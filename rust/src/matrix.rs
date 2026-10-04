use js_sys::{Array, Float64Array, Object, Reflect};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Matrix {
    matrix: Vec<Vec<f64>>,
    rows: usize,
    cols: usize,
}

impl Matrix {
    fn from_rows(m: Vec<Vec<f64>>) -> Matrix {
        let rows = m.len();
        let cols = m[0].len();
        Matrix { matrix: m, rows, cols }
    }
}


fn to_index(v: f64, limit: usize) -> Option<usize> {
    if v >= 0.0 && v < limit as f64 && v.fract() == 0.0 {
        Some(v as usize)
    } else {
        None
    }
}

fn pivot_in_place(a: &mut [Vec<f64>], pivot_row: usize, pivot_col: usize) {
    let pivot_value = a[pivot_row][pivot_col];
    for x in a[pivot_row].iter_mut() {
        *x /= pivot_value;
    }
    let pr = a[pivot_row].clone();
    for i in 0..a.len() {
        if i != pivot_row {
            let factor = a[i][pivot_col];
            for j in 0..pr.len() {
                a[i][j] -= factor * pr[j];
            }
        }
    }
}

#[wasm_bindgen]
impl Matrix {
    #[wasm_bindgen(constructor)]
    pub fn new(
        #[wasm_bindgen(unchecked_param_type = "Float64Array[]")] values: Option<Array>,
    ) -> Result<Matrix, JsError> {
        let values = match values {
            Some(v) if v.length() > 0 => v,
            _ => return Err(JsError::new("Matrix cannot be empty.")),
        };

        // new Float64Array(values[i]) másolat, ugyanúgy, mint a JS-ben
        let len = values.length();
        let mut data: Vec<Vec<f64>> = Vec::with_capacity(len as usize);
        for i in 0..len {
            data.push(Float64Array::new(&values.get(i)).to_vec());
        }

        if data[0].is_empty() {
            return Err(JsError::new("Matrix rows cannot be empty."));
        }
        let cols = data[0].len();
        for row in &data {
            if row.len() != cols {
                return Err(JsError::new("All rows in the matrix must have the same length."));
            }
        }

        Ok(Matrix::from_rows(data))
    }

    #[wasm_bindgen(getter, unchecked_return_type = "Float64Array[]")]
    pub fn values(&self) -> Array {
        let out = Array::new_with_length(self.rows as u32);
        for (i, row) in self.matrix.iter().enumerate() {
            out.set(i as u32, Float64Array::from(row.as_slice()).into());
        }
        out
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
                if (self.matrix[i][j] - self.matrix[j][i]).abs() > 1e-9 {
                    return false;
                }
            }
        }
        true
    }

    #[wasm_bindgen(js_name = getElement)]
    pub fn get_element(&self, row_index: f64, col_index: f64) -> Result<f64, JsError> {
        match (to_index(row_index, self.rows), to_index(col_index, self.cols)) {
            (Some(r), Some(c)) => Ok(self.matrix[r][c]),
            _ => Err(JsError::new(&format!(
                "Index out of bounds: [{}, {}].",
                row_index, col_index
            ))),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn transposed(&self) -> Matrix {
        let mut result: Vec<Vec<f64>> = Vec::with_capacity(self.cols);
        for col in 0..self.cols {
            let mut row_arr = vec![0.0; self.rows];
            for row in 0..self.rows {
                row_arr[row] = self.matrix[row][col];
            }
            result.push(row_arr);
        }
        Matrix::from_rows(result)
    }

    #[wasm_bindgen(getter)]
    pub fn determinant(&self) -> Result<f64, JsError> {
        if !self.is_square() {
            return Err(JsError::new("Determinant is only defined for square matrices."));
        }

        let n = self.rows;
        let mut a = self.matrix.clone();
        let mut det = 1.0_f64;
        let mut swap_count = 0usize;

        for i in 0..n {
            let mut pivot_row = i;
            for r in (i + 1)..n {
                if a[r][i].abs() > a[pivot_row][i].abs() {
                    pivot_row = r;
                }
            }

            if a[pivot_row][i].abs() < 1e-10 {
                return Ok(0.0);
            }

            if pivot_row != i {
                a.swap(i, pivot_row);
                swap_count += 1;
            }

            det *= a[i][i];

            let pr = a[i].clone();
            for r in (i + 1)..n {
                let factor = a[r][i] / pr[i];
                for c in i..n {
                    a[r][c] -= factor * pr[c];
                }
            }
        }

        Ok(if swap_count % 2 == 0 { det } else { -det })
    }

    pub fn inverse(&self) -> Result<Matrix, JsError> {
        if !self.is_square() {
            return Err(JsError::new("Only square matrices can be inverted."));
        }

        let n = self.rows;
        let mut aug: Vec<Vec<f64>> = Vec::with_capacity(n);
        for i in 0..n {
            let mut row = vec![0.0; 2 * n];
            row[..n].copy_from_slice(&self.matrix[i]);
            row[n + i] = 1.0;
            aug.push(row);
        }

        for i in 0..n {
            let mut pivot_row = i;
            for r in (i + 1)..n {
                if aug[r][i].abs() > aug[pivot_row][i].abs() {
                    pivot_row = r;
                }
            }

            if aug[pivot_row][i].abs() < 1e-10 {
                return Err(JsError::new(
                    "Matrix is singular and cannot be inverted (determinant is 0).",
                ));
            }

            if pivot_row != i {
                aug.swap(i, pivot_row);
            }

            let pivot = aug[i][i];
            for x in aug[i].iter_mut() {
                *x /= pivot;
            }

            let pr = aug[i].clone();
            for r in 0..n {
                if r != i {
                    let factor = aug[r][i];
                    for j in 0..(2 * n) {
                        aug[r][j] -= factor * pr[j];
                    }
                }
            }
        }

        let inv: Vec<Vec<f64>> = aug.into_iter().map(|row| row[n..].to_vec()).collect();
        Ok(Matrix::from_rows(inv))
    }

    #[wasm_bindgen(unchecked_return_type = "{ values: Float64Array; vectors: Matrix }")]
    pub fn eigen(
        &self,
        max_iterations: Option<f64>,
        tolerance: Option<f64>,
    ) -> Result<Object, JsError> {
        let max_iterations = max_iterations.unwrap_or(100.0);
        let tolerance = tolerance.unwrap_or(1e-10);

        if !self.is_square() {
            return Err(JsError::new("Eigenvalues are only defined for square matrices."));
        }
        if !self.is_symmetric() {
            return Err(JsError::new(
                "This implementation of eigen decomposition requires a real symmetric matrix.",
            ));
        }

        let n = self.rows;
        let mut a = self.matrix.clone();
        let mut v: Vec<Vec<f64>> = vec![vec![0.0; n]; n];
        for i in 0..n {
            v[i][i] = 1.0;
        }

        let mut iter = 0.0_f64;
        while iter < max_iterations {
            iter += 1.0;

            let mut max_off_diag = 0.0_f64;
            let mut p = 0usize;
            let mut q = 1usize;

            for i in 0..n {
                for j in (i + 1)..n {
                    if a[i][j].abs() > max_off_diag {
                        max_off_diag = a[i][j].abs();
                        p = i;
                        q = j;
                    }
                }
            }

            if max_off_diag < tolerance || n < 2 {
                break;
            }

            let app = a[p][p];
            let aqq = a[q][q];
            let apq = a[p][q];

            let phi = 0.5 * (2.0 * apq).atan2(aqq - app);
            let c = phi.cos();
            let s = phi.sin();

            a[p][p] = c * c * app - 2.0 * s * c * apq + s * s * aqq;
            a[q][q] = s * s * app + 2.0 * s * c * apq + c * c * aqq;
            a[p][q] = 0.0;
            a[q][p] = 0.0;

            for i in 0..n {
                if i != p && i != q {
                    let aip = a[i][p];
                    let aiq = a[i][q];

                    let new_ip = c * aip - s * aiq;
                    a[i][p] = new_ip;
                    a[p][i] = new_ip;

                    let new_iq = s * aip + c * aiq;
                    a[i][q] = new_iq;
                    a[q][i] = new_iq;
                }

                let vip = v[i][p];
                let viq = v[i][q];

                v[i][p] = c * vip - s * viq;
                v[i][q] = s * vip + c * viq;
            }
        }

        let eigen_values: Vec<f64> = (0..n).map(|i| a[i][i]).collect();

        let obj = Object::new();
        let _ = Reflect::set(
            &obj,
            &JsValue::from_str("values"),
            &Float64Array::from(eigen_values.as_slice()).into(),
        );
        let _ = Reflect::set(
            &obj,
            &JsValue::from_str("vectors"),
            &JsValue::from(Matrix::from_rows(v)),
        );
        Ok(obj)
    }

    pub fn pivot(&self, pivot_row: f64, pivot_col: f64) -> Result<Matrix, JsError> {
        let (pr, pc) = match (to_index(pivot_row, self.rows), to_index(pivot_col, self.cols)) {
            (Some(r), Some(c)) => (r, c),
            _ => {
                return Err(JsError::new(&format!(
                    "Pivot index out of bounds: [{}, {}].",
                    pivot_row, pivot_col
                )))
            }
        };

        if self.matrix[pr][pc].abs() < 1e-10 {
            return Err(JsError::new(&format!(
                "Pivot element at [{}, {}] cannot be zero.",
                pivot_row, pivot_col
            )));
        }

        let mut result = self.matrix.clone();
        pivot_in_place(&mut result, pr, pc);
        Ok(Matrix::from_rows(result))
    }

    pub fn solve(&self, b: &[f64]) -> Result<Vec<f64>, JsError> {
        if b.len() != self.rows {
            return Err(JsError::new(&format!(
                "A b vektor hossza ({}) nem egyezik meg a mátrix sorainak számával ({}).",
                b.len(),
                self.rows
            )));
        }

        let m = self.rows;
        let n = self.cols;

        let mut aug: Vec<Vec<f64>> = self
            .matrix
            .iter()
            .zip(b.iter())
            .map(|(row, &bi)| {
                let mut r = row.clone();
                r.push(bi);
                r
            })
            .collect();

        let mut pivot_row = 0usize;
        let mut pivot_cols: Vec<usize> = Vec::new();

        for col in 0..n {
            if pivot_row >= m {
                break;
            }

            let mut max_row = pivot_row;
            for r in (pivot_row + 1)..m {
                if aug[r][col].abs() > aug[max_row][col].abs() {
                    max_row = r;
                }
            }

            if aug[max_row][col].abs() < 1e-10 {
                continue;
            }

            if max_row != pivot_row {
                aug.swap(pivot_row, max_row);
            }

            pivot_in_place(&mut aug, pivot_row, col);
            pivot_cols.push(col);
            pivot_row += 1;
        }

        for r in 0..m {
            let all_zeros_a = (0..n).all(|c| aug[r][c].abs() < 1e-10);
            let constant_non_zero = aug[r][n].abs() > 1e-10;

            if all_zeros_a && constant_non_zero {
                return Err(JsError::new("Az egyenletrendszernek nincs megoldása (ellentmondásos)."));
            }
        }

        if pivot_cols.len() < n {
            return Err(JsError::new(
                "Az egyenletrendszernek végtelen sok megoldása van (szabad paraméterek vannak).",
            ));
        }

        let mut x = vec![0.0; n];
        for (i, &col) in pivot_cols.iter().enumerate() {
            x[col] = aug[i][n];
        }
        Ok(x)
    }

    pub fn multiply(&self, matrix_a: &Matrix, matrix_b: &Matrix) -> Result<Matrix, JsError> {
        let a = &matrix_a.matrix;
        let b = &matrix_b.matrix;

        let rows_a = a.len();
        let cols_a = a[0].len();
        let cols_b = b[0].len();

        if cols_a > b.len() {
            return Err(JsError::new("Incompatible matrix dimensions for multiplication."));
        }

        let mut result: Vec<Vec<f64>> = vec![vec![0.0; cols_b]; rows_a];
        for i in 0..rows_a {
            for j in 0..cols_b {
                let mut sum = 0.0;
                for k in 0..cols_a {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }

        Ok(Matrix::from_rows(result))
    }
}