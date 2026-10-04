use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct VarCovResult {
    pub x_var: f64,
    pub cov: f64,
}

#[wasm_bindgen]
pub struct DotProductAndSumPow2Result {
    pub xy_sum: f64,
    pub x2_sum: f64,
}

#[wasm_bindgen(js_name = orderAsc)]
pub fn order_asc(values: &mut [f64]) {
    if values.len() <= 1 {
        return;
    }

    values.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
}

#[wasm_bindgen(js_name = orderDesc)]
pub fn order_desc(values: &mut [f64]) {
    if values.len() <= 1 {
        return;
    }

    values.sort_unstable_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
}

#[wasm_bindgen(js_name = neumaierSum)]
pub fn neumaier_sum(values: &[f64]) -> f64 {
    let mut sum: f64 = 0.0;
    let mut c: f64 = 0.0;

    for &x in values {
        let t: f64 = sum + x;

        if sum.abs() >= x.abs() {
            c += (sum - t) + x;
        } else {
            c += (x - t) + sum;
        }

        sum = t;
    }

    sum + c
}

#[wasm_bindgen(js_name = varianceAndCovariance)]
pub fn variance_and_covariance(x: &[f64], y: &[f64], x_mean: f64, y_mean: f64) -> VarCovResult {
    let len = x.len();

    if len <= 1 {
        return VarCovResult {
            x_var: f64::NAN,
            cov: f64::NAN,
        };
    }

    let mut var_sum: f64 = 0.0;
    let mut var_c: f64 = 0.0;
    let mut cov_sum: f64 = 0.0;
    let mut cov_c: f64 = 0.0;

    for i in 0..len {
        let x_diff = x[i] - x_mean;
        let y_diff = y[i] - y_mean;

        let v_val = x_diff * x_diff;
        let v_t = var_sum + v_val;

        if var_sum.abs() >= v_val.abs() {
            var_c += (var_sum - v_t) + v_val;
        } else {
            var_c += (v_val - v_t) + var_sum;
        }
        var_sum = v_t;

        let c_val = x_diff * y_diff;
        let c_t = cov_sum + c_val;

        if cov_sum.abs() >= c_val.abs() {
            cov_c += (cov_sum - c_t) + c_val;
        } else {
            cov_c += (c_val - c_t) + cov_sum;
        }
        cov_sum = c_t;
    }

    var_sum += var_c;
    cov_sum += cov_c;

    let df = (len - 1) as f64;

    VarCovResult {
        x_var: var_sum / df,
        cov: cov_sum / df,
    }
}

#[wasm_bindgen(js_name = neumaierDotProductAndSumPow2)]
pub fn neumaier_dot_product_and_sum_pow2(x: &[f64], y: &[f64]) -> DotProductAndSumPow2Result {
    let len = x.len();

    let mut xy_sum: f64 = 0.0;
    let mut xy_c: f64 = 0.0;
    let mut x2_sum: f64 = 0.0;
    let mut x2_c: f64 = 0.0;

    for i in 0..len {
        let xi = x[i];
        let yi = y[i];

        let xy_val = xi * yi;
        let xy_t = xy_sum + xy_val;

        if xy_sum.abs() >= xy_val.abs() {
            xy_c += (xy_sum - xy_t) + xy_val;
        } else {
            xy_c += (xy_val - xy_t) + xy_sum;
        }
        xy_sum = xy_t;

        let x2_val = xi * xi;
        let x2_t = x2_sum + x2_val;

        if x2_sum.abs() >= x2_val.abs() {
            x2_c += (x2_sum - x2_t) + x2_val;
        } else {
            x2_c += (x2_val - x2_t) + x2_sum;
        }
        x2_sum = x2_t;
    }

    xy_sum += xy_c;
    x2_sum += x2_c;

    DotProductAndSumPow2Result { xy_sum, x2_sum }
}

fn squared_residuals(y: &[f64], x: &[f64], predict: impl Fn(f64) -> f64) -> Vec<f64> {
    if x.is_empty() {
        y.iter()
            .enumerate()
            .map(|(i, &yi)| {
                let d = yi - predict(i as f64);
                d * d
            })
            .collect()
    } else {
        y.iter()
            .zip(x)
            .map(|(&yi, &xi)| {
                let d = yi - predict(xi);
                d * d
            })
            .collect()
    }
}

#[wasm_bindgen(js_name = calculateMSE)]
pub fn calculate_mse(
    y_actual: &[f64],
    x: &[f64],
    model: &str,
    coefficients: &[f64],
    degrees_of_freedom: usize,
) -> Result<f64, JsValue> {
    let n = y_actual.len();

    if n == 0 {
        return Ok(f64::NAN);
    }

    if !x.is_empty() && x.len() != n {
        return Err(JsValue::from_str(
            "RangeError: x length must match y_actual length, or be empty.",
        ));
    }

    if degrees_of_freedom >= n {
        let divisor = n as isize - degrees_of_freedom as isize;

        return Err(JsValue::from_str(&format!(
            "RangeError: Degrees of freedom corrected divisor ({}) must be positive.",
            divisor
        )));
    }

    let divisor = (n - degrees_of_freedom) as f64;

    let squared = match model {
        "linear" | "exponential" | "power" | "logarithmic" if coefficients.len() != 2 => {
            return Err(JsValue::from_str(
                "RangeError: this model expects exactly 2 coefficients.",
            ));
        }

        "linear_no_intercept" | "exponential_no_intercept" | "power_no_intercept"
            if coefficients.len() != 1 =>
        {
            return Err(JsValue::from_str(
                "RangeError: this model expects exactly 1 coefficient.",
            ));
        }

        "linear" => {
            let (a, b) = (coefficients[0], coefficients[1]);
            squared_residuals(y_actual, x, |t| a + b * t)
        }

        "exponential" => {
            let (a, b) = (coefficients[0], coefficients[1]);
            let ln_b = b.ln();
            squared_residuals(y_actual, x, |t| a * (t * ln_b).exp())
        }

        "power" => {
            let (a, b) = (coefficients[0], coefficients[1]);
            squared_residuals(y_actual, x, |t| a * t.powf(b))
        }

        "logarithmic" => {
            let (a, b) = (coefficients[0], coefficients[1]);
            squared_residuals(y_actual, x, |t| a + b * t.ln())
        }

        "polynomial" => {
            if coefficients.is_empty() {
                return Err(JsValue::from_str(
                    "RangeError: polynomial needs at least one coefficient.",
                ));
            }
            squared_residuals(y_actual, x, |t| {
                coefficients.iter().rev().fold(0.0, |acc, &c| acc * t + c)
            })
        }

        "linear_no_intercept" => {
            let b = coefficients[0];
            squared_residuals(y_actual, x, |t| b * t)
        }

        "exponential_no_intercept" => {
            let ln_b = coefficients[0].ln();
            squared_residuals(y_actual, x, |t| (t * ln_b).exp())
        }

        "power_no_intercept" => {
            let b = coefficients[0];
            squared_residuals(y_actual, x, |t| t.powf(b))
        }

        _ => {
            return Err(JsValue::from_str(&format!(
                "RangeError: unknown model '{}'.",
                model
            )));
        }
    };

    Ok(neumaier_sum(&squared) / divisor)
}
