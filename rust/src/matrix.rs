use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Matrix {
    data: Vec<f64>,
    rows: usize,
    cols: usize,
}

#[wasm_bindgen]
impl Matrix {
    #[wasm_bindgen(constructor)]
    pub fn new(data: &[f64], rows: usize, cols: usize) -> Result<Matrix, JsValue> {
        if rows == 0 || cols == 0 {
            return Err(JsValue::from_str("Matrix dimensions must be positive."));
        }
        if data.len() != rows * cols {
            return Err(JsValue::from_str("Data length does not match specified dimensions."));
        }

        Ok(Matrix {
            data: data.to_vec(),
            rows,
            cols,
        })
    }

    #[wasm_bindgen(getter)]
    pub fn rows(&self) -> usize {
        self.rows
    }

    #[wasm_bindgen(getter)]
    pub fn cols(&self) -> usize {
        self.cols
    }

    #[wasm_bindgen(getter, js_name = isSquare)]
    pub fn is_square(&self) -> bool {
        self.rows == self.cols
    }

    #[wasm_bindgen(getter, js_name = isSymmetric)]
    pub fn is_symmetric(&self) -> bool {
        if !self.is_square() {
            return false;
        }
        for i in 0..self.rows {
            for j in (i + 1)..self.cols {
                if (self.data[i * self.cols + j] - self.data[j * self.cols + i]).abs() > 1e-9 {
                    return false;
                }
            }
        }
        true
    }

    #[wasm_bindgen(js_name = getElement)]
    pub fn get_element(&self, row_index: usize, col_index: usize) -> Result<f64, JsValue> {
        if row_index >= self.rows || col_index >= self.cols {
            return Err(JsValue::from_str("Index out of bounds."));
        }
        Ok(self.data[row_index * self.cols + col_index])
    }

    #[wasm_bindgen(getter)]
    pub fn transposed(&self) -> Matrix {
        let mut transposed_data = vec![0.0; self.rows * self.cols];
        for r in 0..self.rows {
            for c in 0..self.cols {
                transposed_data[c * self.rows + r] = self.data[r * self.cols + c];
            }
        }
        Matrix {
            data: transposed_data,
            rows: self.cols,
            cols: self.rows,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn determinant(&self) -> Result<f64, JsValue> {
        if !self.is_square() {
            return Err(JsValue::from_str("Determinant is only defined for square matrices."));
        }

        let n = self.rows;
        let mut a = self.data.clone();
        let mut det = 1.0_f64;
        let mut swap_count = 0usize;

        for i in 0..n {
            let mut pivot_row = i;
            for r in (i + 1)..n {
                if a[r * n + i].abs() > a[pivot_row * n + i].abs() {
                    pivot_row = r;
                }
            }

            if a[pivot_row * n + i].abs() < 1e-10 {
                return Ok(0.0);
            }

            if pivot_row != i {
                for c in 0..n {
                    a.swap(i * n + c, pivot_row * n + c);
                }
                swap_count += 1;
            }

            let pivot_val = a[i * n + i];
            det *= pivot_val;

            for r in (i + 1)..n {
                let factor = a[r * n + i] / pivot_val;
                for c in i..n {
                    a[r * n + c] -= factor * a[i * n + c];
                }
            }
        }

        if swap_count % 2 == 0 {
            Ok(det)
        } else {
            Ok(-det)
        }
    }

    pub fn multiply(&self, other: &Matrix) -> Result<Matrix, JsValue> {
        if self.cols != other.rows {
            return Err(JsValue::from_str("Incompatible matrix dimensions for multiplication."));
        }

        let mut result = vec![0.0; self.rows * other.cols];

        for i in 0..self.rows {
            for k in 0..self.cols {
                let a_ik = self.data[i * self.cols + k];
                for j in 0..other.cols {
                    result[i * other.cols + j] += a_ik * other.data[k * other.cols + j];
                }
            }
        }

        Ok(Matrix {
            data: result,
            rows: self.rows,
            cols: other.cols,
        })
    }
}