use js_sys::Float64Array;
use wasm_bindgen::prelude::*;
use crate::matrix::Matrix;

#[derive(Clone, Copy, PartialEq, Eq)]
enum RegressionType {
    Linear,
    Logarithmic,
    Exponential,
    Power,
}

impl RegressionType {
    fn from_str(value: Option<String>) -> Result<Self, JsError> {
        match value.as_deref().unwrap_or("linear") {
            "linear" => Ok(Self::Linear),
            "logarithmic" => Ok(Self::Logarithmic),
            "exponential" => Ok(Self::Exponential),
            "power" => Ok(Self::Power),
            _ => Err(JsError::new("Invalid regression type.")),
        }
    }

    #[inline]
    fn uses_log_x(self) -> bool {
        matches!(self, Self::Logarithmic | Self::Power)
    }

    #[inline]
    fn uses_log_y(self) -> bool {
        matches!(self, Self::Exponential | Self::Power)
    }
}

#[inline]
fn neumaier_add(sum: &mut f64, correction: &mut f64, x: f64) {
    let t = *sum + x;

    if sum.abs() >= x.abs() {
        *correction += (*sum - t) + x;
    } else {
        *correction += (x - t) + *sum;
    }

    *sum = t;
}

#[inline]
fn compensated_sum(values: &[f64]) -> f64 {
    let mut sum = 0.0;
    let mut correction = 0.0;

    for &value in values {
        neumaier_add(&mut sum, &mut correction, value);
    }

    sum + correction
}

#[inline]
fn mean(values: &[f64]) -> f64 {
    compensated_sum(values) / values.len() as f64
}

#[wasm_bindgen(js_name = MultiRegression)]
pub struct MultiRegression {
    x: Matrix,
    y: Matrix,

    log_x: Option<Matrix>,
    log_y: Option<Matrix>,

    n: usize,
    k: usize,
    df_divider: isize,
}

impl MultiRegression {
    fn calculate_log_x_lazy(&mut self) -> Result<(), JsError> {
        if self.log_x.is_some() {
            return Ok(());
        }

        let values = self.x.values().to_vec();

        let log_values: Vec<f64> =
            values.into_iter().map(f64::ln).collect();

        self.log_x = Some(Matrix::new(
            log_values,
            self.n,
            self.k,
        )?);

        Ok(())
    }

    fn calculate_log_y_lazy(&mut self) -> Result<(), JsError> {
        if self.log_y.is_some() {
            return Ok(());
        }

        let values = self.y.values().to_vec();

        let log_values: Vec<f64> =
            values.into_iter().map(f64::ln).collect();

        self.log_y = Some(Matrix::new(
            log_values,
            self.n,
            1,
        )?);

        Ok(())
    }

    fn calculate_regression(
        &mut self,
        regression_type: RegressionType,
    ) -> Result<Matrix, JsError> {
        if regression_type.uses_log_x() {
            self.calculate_log_x_lazy()?;
        }

        if regression_type.uses_log_y() {
            self.calculate_log_y_lazy()?;
        }

        let x = if regression_type.uses_log_x() {
            self.log_x.as_ref().unwrap()
        } else {
            &self.x
        };

        let y = if regression_type.uses_log_y() {
            self.log_y.as_ref().unwrap()
        } else {
            &self.y
        };

        let xt = x.transposed();
        let xtx = xt.multiply_centered(x)?;
        let xty = xt.multiply_centered(y)?;
        let slopes = xtx.solve(&xty)?;

        let x_values = x.values().to_vec();
        let y_values = y.values().to_vec();

        let mut intercept = mean(&y_values);

        for col in 0..self.k {
            let mut sum = 0.0;
            let mut correction = 0.0;

            for row in 0..self.n {
                neumaier_add(
                    &mut sum,
                    &mut correction,
                    x_values[row * self.k + col],
                );
            }

            let x_mean = (sum + correction) / self.n as f64;

            let slope = slopes
                .get_element(col, 0)
                .ok_or_else(|| JsError::new("Missing regression coefficient."))?;

            intercept -= slope * x_mean;
        }

        let mut result = Vec::with_capacity(self.k + 1);
        result.push(intercept);

        for col in 0..self.k {
            result.push(
                slopes
                    .get_element(col, 0)
                    .ok_or_else(|| {
                        JsError::new("Missing regression coefficient.")
                    })?,
            );
        }

        Matrix::new(result, self.k + 1, 1)
    }

    fn predict(
        &self,
        row: usize,
        coefficients: &[f64],
        regression_type: RegressionType,
        x_values: &[f64],
    ) -> f64 {
        let mut sum = coefficients[0];
        let mut correction = 0.0;

        for col in 0..self.k {
            let value = x_values[row * self.k + col];

            let x_value = if regression_type.uses_log_x() {
                value.ln()
            } else {
                value
            };

            neumaier_add(
                &mut sum,
                &mut correction,
                x_value * coefficients[col + 1],
            );
        }

        let linear_predictor = sum + correction;

        if regression_type.uses_log_y() {
            linear_predictor.exp()
        } else {
            linear_predictor
        }
    }
}

#[wasm_bindgen]
impl MultiRegression {
    #[wasm_bindgen(constructor)]
    pub fn new(
        independents: Vec<Float64Array>,
        dependent: Float64Array,
    ) -> Result<MultiRegression, JsError> {
        let n = dependent.length() as usize;
        let k = independents.len();

        if k == 0 {
            return Err(JsError::new(
                "At least one independent variable is required.",
            ));
        }

        if n == 0 {
            return Err(JsError::new(
                "The dependent variable must not be empty.",
            ));
        }

        // A Matrix saját, sorfolytonos Vec<f64> tárolót kap.
        let x = Matrix::from_columns(independents)?;
        let y = Matrix::new(dependent.to_vec(), n, 1)?;

        if x.rows() != n {
            return Err(JsError::new(
                "Independent and dependent variables must have the same length.",
            ));
        }

        Ok(MultiRegression {
            x,
            y,
            log_x: None,
            log_y: None,
            n,
            k,
            df_divider: n as isize - k as isize - 1,
        })
    }

    #[wasm_bindgen(js_name = calculateRegression)]
    pub fn calculate_regression_js(
        &mut self,
        regression_type: Option<String>,
    ) -> Result<Matrix, JsError> {
        let regression_type =
            RegressionType::from_str(regression_type)?;

        self.calculate_regression(regression_type)
    }

    #[wasm_bindgen(js_name = calculateRSD)]
    pub fn calculate_rsd(
        &mut self,
        regression_type: Option<String>,
    ) -> Result<f64, JsError> {
        let regression_type =
            RegressionType::from_str(regression_type)?;

        if self.df_divider <= 0 {
            return Err(JsError::new(
                "Residual standard deviation requires N > K + 1.",
            ));
        }

        let coefficients = self
            .calculate_regression(regression_type)?
            .values()
            .to_vec();

        let x_values = self.x.values().to_vec();
        let y_values = self.y.values().to_vec();

        let mut deviation_sum = 0.0;
        let mut correction = 0.0;

        for row in 0..self.n {
            let predicted = self.predict(
                row,
                &coefficients,
                regression_type,
                &x_values,
            );

            let residual = y_values[row] - predicted;
            let squared_deviation = residual * residual;

            neumaier_add(
                &mut deviation_sum,
                &mut correction,
                squared_deviation,
            );
        }

        let sum_of_squares = deviation_sum + correction;

        Ok((sum_of_squares / self.df_divider as f64).sqrt())
    }
}