use js_sys::Float64Array;
use wasm_bindgen::prelude::*;

#[inline]
fn neumaier_add(sum: &mut f64, c: &mut f64, x: f64) {
    let t = *sum + x;

    if sum.abs() >= x.abs() {
        *c += (*sum - t) + x;
    } else {
        *c += (x - t) + *sum;
    }

    *sum = t;
}

#[inline]
fn compensated_add(sum: f64, x: f64) -> f64 {
    let mut s = sum;
    let mut c = 0.0;
    neumaier_add(&mut s, &mut c, x);
    s + c
}

#[inline]
fn mean(values: &[f64]) -> f64 {
    values.iter().sum::<f64>() / values.len() as f64
}

#[wasm_bindgen(js_name = Matrix)]
pub struct Matrix {
    rows: usize,
    cols: usize,
    values: Vec<f64>,
}

#[wasm_bindgen(js_class = Matrix)]
impl Matrix {
    #[wasm_bindgen(constructor)]
    pub fn new(values: Vec<f64>, rows: usize, cols: usize) -> Result<Matrix, JsError> {
        if rows == 0 || cols == 0 {
            return Err(JsError::new(
                "When the values array is flattened, the dimensions must be at least 1x1!",
            ));
        }

        if values.is_empty() {
            return Err(JsError::new(
                "The provided array must contain at least one value!",
            ));
        }

        if values.len() != rows * cols {
            return Err(JsError::new(
                "The length of the values array does not match rows * cols!",
            ));
        }

        Ok(Matrix { rows, cols, values })
    }

    #[wasm_bindgen(js_name = fromColumns)]
    pub fn from_columns(columns: Vec<Float64Array>) -> Result<Matrix, JsError> {
        if columns.is_empty() || columns[0].length() == 0 {
            return Err(JsError::new(
                "The provided array must contain at least one value!",
            ));
        }

        let cols = columns.len();
        let rows = columns[0].length() as usize;
        let mut values = vec![0.0; rows * cols];

        for (c, column) in columns.iter().enumerate() {
            if column.length() as usize != rows {
                return Err(JsError::new("All columns must have the same length!"));
            }

            let col_values = column.to_vec();

            for (r, v) in col_values.into_iter().enumerate() {
                values[r * cols + c] = v;
            }
        }

        Ok(Matrix { rows, cols, values })
    }

    #[wasm_bindgen(getter)]
    pub fn rows(&self) -> usize {
        self.rows
    }

    #[wasm_bindgen(getter)]
    pub fn cols(&self) -> usize {
        self.cols
    }

    #[wasm_bindgen(getter)]
    pub fn values(&self) -> Float64Array {
        Float64Array::from(self.values.as_slice())
    }

    #[wasm_bindgen(js_name = isSquare)]
    pub fn is_square(&self) -> bool {
        self.rows == self.cols
    }

    #[wasm_bindgen(js_name = isSymmetric)]
    pub fn is_symmetric(&self) -> bool {
        if !self.is_square() {
            return false;
        }

        for row in 0..self.rows {
            for col in (row + 1)..self.cols {
                let a = self.values[row * self.cols + col];
                let b = self.values[col * self.cols + row];

                if (a - b).abs() > 1e-9 {
                    return false;
                }
            }
        }

        true
    }

    #[wasm_bindgen(js_name = getElement)]
    pub fn get_element(&self, row: usize, col: usize) -> Option<f64> {
        if row >= self.rows || col >= self.cols {
            return None;
        }

        Some(self.values[row * self.cols + col])
    }

    #[wasm_bindgen(getter)]
    pub fn transposed(&self) -> Matrix {
        let mut values = vec![0.0; self.cols * self.rows];

        for r in 0..self.rows {
            for c in 0..self.cols {
                values[c * self.rows + r] = self.values[r * self.cols + c];
            }
        }

        Matrix {
            rows: self.cols,
            cols: self.rows,
            values,
        }
    }

    #[wasm_bindgen(js_name = multiply)]
    pub fn multiply(&self, matrix: &Matrix) -> Result<Matrix, JsError> {
        if self.cols != matrix.rows {
            return Err(JsError::new("Matrix dimensions are incompatible."));
        }

        let mut values = vec![0.0; self.rows * matrix.cols];

        for row in 0..self.rows {
            for col in 0..matrix.cols {
                let mut sum = 0.0;
                let mut c = 0.0;

                for k in 0..self.cols {
                    let x = self.values[row * self.cols + k] * matrix.values[k * matrix.cols + col];
                    neumaier_add(&mut sum, &mut c, x);
                }

                values[row * matrix.cols + col] = sum + c;
            }
        }

        Ok(Matrix {
            rows: self.rows,
            cols: matrix.cols,
            values,
        })
    }

    #[wasm_bindgen(js_name = multiplyCentered)]
    pub fn multiply_centered(&self, matrix: &Matrix) -> Result<Matrix, JsError> {
        if self.cols != matrix.rows {
            return Err(JsError::new("Matrix dimensions are incompatible."));
        }

        let row_means_a: Vec<f64> = (0..self.rows)
            .map(|row| mean(&self.values[row * self.cols..(row + 1) * self.cols]))
            .collect();

        let col_means_b: Vec<f64> = (0..matrix.cols)
            .map(|col| {
                let column: Vec<f64> = (0..matrix.rows)
                    .map(|row| matrix.values[row * matrix.cols + col])
                    .collect();
                mean(&column)
            })
            .collect();

        let mut values = vec![0.0; self.rows * matrix.cols];

        for row in 0..self.rows {
            for col in 0..matrix.cols {
                let mut sum = 0.0;
                let mut c = 0.0;

                for k in 0..self.cols {
                    let val_a = self.values[row * self.cols + k] - row_means_a[row];
                    let val_b = matrix.values[k * matrix.cols + col] - col_means_b[col];
                    neumaier_add(&mut sum, &mut c, val_a * val_b);
                }

                values[row * matrix.cols + col] = sum + c;
            }
        }

        Ok(Matrix {
            rows: self.rows,
            cols: matrix.cols,
            values,
        })
    }

    #[wasm_bindgen(js_name = createIdentityMatrix)]
    pub fn create_identity_matrix(rows: usize, cols: Option<usize>) -> Result<Matrix, JsError> {
        let cols = cols.unwrap_or(rows);

        if rows == 0 || cols == 0 {
            return Err(JsError::new("The dimensions must be at least 1x1!"));
        }

        let mut values = vec![0.0; rows * cols];

        for i in 0..rows.min(cols) {
            values[i * cols + i] = 1.0;
        }

        Ok(Matrix { rows, cols, values })
    }

    #[wasm_bindgen(js_name = solve)]
    pub fn solve(&self, matrix: &Matrix) -> Result<Matrix, JsError> {
        if self.rows != self.cols {
            return Err(JsError::new("The coefficient matrix must be square."));
        }

        if self.rows != matrix.rows {
            return Err(JsError::new(
                "Matrix dimensions are incompatible for solving.",
            ));
        }

        let n = self.rows;
        let rhs_cols = matrix.cols;

        let mut a = self.values.clone();
        let mut b = matrix.values.clone();

        for i in 0..n {
            let mut pivot_row = i;
            let mut max_val = a[i * n + i].abs();

            for k in (i + 1)..n {
                let val = a[k * n + i].abs();

                if val > max_val {
                    max_val = val;
                    pivot_row = k;
                }
            }

            if max_val < 1e-12 {
                return Err(JsError::new("Matrix is singular or nearly singular."));
            }

            if pivot_row != i {
                for j in 0..n {
                    a.swap(i * n + j, pivot_row * n + j);
                }

                for j in 0..rhs_cols {
                    b.swap(i * rhs_cols + j, pivot_row * rhs_cols + j);
                }
            }

            let pivot = a[i * n + i];

            for j in 0..n {
                a[i * n + j] /= pivot;
            }

            for j in 0..rhs_cols {
                b[i * rhs_cols + j] /= pivot;
            }

            for k in 0..n {
                if k == i {
                    continue;
                }

                let factor = a[k * n + i];

                for j in 0..n {
                    let x = -factor * a[i * n + j];
                    a[k * n + j] = compensated_add(a[k * n + j], x);
                }

                for j in 0..rhs_cols {
                    let x = -factor * b[i * rhs_cols + j];
                    b[k * rhs_cols + j] = compensated_add(b[k * rhs_cols + j], x);
                }
            }
        }

        Ok(Matrix {
            rows: n,
            cols: rhs_cols,
            values: b,
        })
    }

    #[wasm_bindgen(getter)]
    pub fn inverted(&self) -> Result<Matrix, JsError> {
        if self.rows != self.cols {
            return Err(JsError::new("Only square matrices can be inverted."));
        }

        let identity = Matrix::create_identity_matrix(self.rows, Some(self.cols))?;
        self.solve(&identity)
    }
}
