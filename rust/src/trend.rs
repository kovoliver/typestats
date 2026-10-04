use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = getYandXYsum)]
pub fn get_y_and_xy_sum(values: &[f64]) -> Vec<f64> {
    let mut y_sum: f64 = 0.0;
    let mut xy_sum: f64 = 0.0;
    let mut y_c: f64 = 0.0;
    let mut xy_c: f64 = 0.0;
    let mut x: f64 = 0.0;

    for &y in values {
        x += 1.0;

        let t = y_sum + y;
        if y_sum.abs() >= y.abs() {
            y_c += (y_sum - t) + y;
        } else {
            y_c += (y - t) + y_sum;
        }
        y_sum = t;

        let xy = x * y;
        let t_xy = xy_sum + xy;
        if xy_sum.abs() >= xy.abs() {
            xy_c += (xy_sum - t_xy) + xy;
        } else {
            xy_c += (xy - t_xy) + xy_sum;
        }
        xy_sum = t_xy;
    }

    vec![y_sum + y_c, xy_sum + xy_c]
}

#[wasm_bindgen]
pub struct LogYResult {
    lny_sum: f64,
    lnxy_sum: f64,
    ln_y: Vec<f64>,
}

#[wasm_bindgen]
impl LogYResult {
    #[wasm_bindgen(getter)]
    pub fn lny_sum(&self) -> f64 {
        self.lny_sum
    }

    #[wasm_bindgen(getter)]
    pub fn lnxy_sum(&self) -> f64 {
        self.lnxy_sum
    }

    #[wasm_bindgen(getter)]
    pub fn ln_y(&self) -> Vec<f64> {
        self.ln_y.clone()
    }
}

#[wasm_bindgen(js_name = getLogYandLogXYsum)]
pub fn get_log_y_and_log_xy_sum(values: &[f64]) -> LogYResult {
    let mut ln_y = Vec::with_capacity(values.len());

    let mut lny_sum = 0.0;
    let mut lny_c = 0.0;

    let mut lnxy_sum = 0.0;
    let mut lnxy_c = 0.0;

    for (i, &y) in values.iter().enumerate() {
        let x = (i + 1) as f64;
        let ln_val = y.ln();

        ln_y.push(ln_val);

        let t = lny_sum + ln_val;

        if lny_sum.abs() >= ln_val.abs() {
            lny_c += (lny_sum - t) + ln_val;
        } else {
            lny_c += (ln_val - t) + lny_sum;
        }

        lny_sum = t;

        let lnxy = x * ln_val;
        let t = lnxy_sum + lnxy;

        if lnxy_sum.abs() >= lnxy.abs() {
            lnxy_c += (lnxy_sum - t) + lnxy;
        } else {
            lnxy_c += (lnxy - t) + lnxy_sum;
        }

        lnxy_sum = t;
    }

    LogYResult {
        lny_sum: lny_sum + lny_c,
        lnxy_sum: lnxy_sum + lnxy_c,
        ln_y,
    }
}

#[wasm_bindgen(js_name = getLogarithmicSums)]
pub fn get_logarithmic_sums(x: &[f64], y: &[f64]) -> Vec<f64> {
    let mut z_sum = 0.0;
    let mut z_c = 0.0;

    let mut z2_sum = 0.0;
    let mut z2_c = 0.0;

    let mut zy_sum = 0.0;
    let mut zy_c = 0.0;

    for i in 0..x.len() {
        let z = x[i].ln();
        let yi = y[i];

        let t = z_sum + z;

        if z_sum.abs() >= z.abs() {
            z_c += (z_sum - t) + z;
        } else {
            z_c += (z - t) + z_sum;
        }

        z_sum = t;

        let z2 = z * z;
        let t = z2_sum + z2;

        if z2_sum.abs() >= z2.abs() {
            z2_c += (z2_sum - t) + z2;
        } else {
            z2_c += (z2 - t) + z2_sum;
        }

        z2_sum = t;

        let zy = z * yi;
        let t = zy_sum + zy;

        if zy_sum.abs() >= zy.abs() {
            zy_c += (zy_sum - t) + zy;
        } else {
            zy_c += (zy - t) + zy_sum;
        }

        zy_sum = t;
    }

    vec![z_sum + z_c, z2_sum + z2_c, zy_sum + zy_c]
}

#[wasm_bindgen(js_name = getPolynomialSums)]
pub fn get_polynomial_sums(x: &[f64], y: &[f64], degree: usize) -> Vec<f64> {
    let mut eq_sums = vec![0.0; degree * 2 + 1];
    let mut eq_comps = vec![0.0; degree * 2 + 1];

    let mut result_sums = vec![0.0; degree + 1];
    let mut result_comps = vec![0.0; degree + 1];

    eq_sums[0] = x.len() as f64;

    for i in 0..x.len() {
        let xi = x[i];
        let yi = y[i];

        let mut power = 1.0;

        for deg in 1..=degree * 2 {
            power *= xi;

            let t = eq_sums[deg] + power;

            if eq_sums[deg].abs() >= power.abs() {
                eq_comps[deg] += (eq_sums[deg] - t) + power;
            } else {
                eq_comps[deg] += (power - t) + eq_sums[deg];
            }

            eq_sums[deg] = t;

            if deg <= degree {
                let value = power * yi;
                let t = result_sums[deg] + value;

                if result_sums[deg].abs() >= value.abs() {
                    result_comps[deg] += (result_sums[deg] - t) + value;
                } else {
                    result_comps[deg] += (value - t) + result_sums[deg];
                }

                result_sums[deg] = t;
            }
        }
    }

    for deg in 1..=degree * 2 {
        eq_sums[deg] += eq_comps[deg];
    }

    for deg in 1..=degree {
        result_sums[deg] += result_comps[deg];
    }

    let mut result = Vec::with_capacity(2 * degree + 1);

    result.extend_from_slice(&eq_sums);
    result.extend_from_slice(&result_sums[1..]);

    result
}