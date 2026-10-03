use crate::univariate::mean;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = chiSquare)]
pub fn chi_square(table: &js_sys::Array) -> Result<f64, JsValue> {
    let columns: Vec<Vec<f64>> = table
        .iter()
        .map(|col| js_sys::Float64Array::new(&col).to_vec())
        .collect();

    let num_cols = columns.len();
    if num_cols == 0 {
        return Ok(0.0);
    }

    let num_rows = columns[0].len();
    if num_rows == 0 {
        return Ok(0.0);
    }

    let mut col_totals = vec![0.0_f64; num_cols];
    let mut row_totals = vec![0.0_f64; num_rows];
    let mut grand_total = 0.0_f64;

    for col in 0..num_cols {
        let col_arr = &columns[col];

        if col_arr.len() != num_rows {
            return Err(JsValue::from_str(
                "All columns in the table must have the same length!",
            ));
        }

        let mut c_total = 0.0_f64;

        for row in 0..num_rows {
            let current_el = col_arr[row];
            c_total += current_el;
            row_totals[row] += current_el;
        }

        col_totals[col] = c_total;
        grand_total += c_total;
    }

    if grand_total <= 0.0 {
        return Err(JsValue::from_str(
            "The grand total cannot be zero or negative!",
        ));
    }

    let mut khi = 0.0_f64;
    let mut compensation = 0.0_f64;

    for col in 0..num_cols {
        let col_total = col_totals[col];
        if col_total == 0.0 {
            continue;
        }

        let col_arr = &columns[col];

        for row in 0..num_rows {
            let row_total = row_totals[row];
            if row_total == 0.0 {
                continue;
            }

            let expected_value = (col_total * row_total) / grand_total;

            if expected_value < f64::EPSILON {
                continue;
            }

            let observed = col_arr[row];
            let diff = observed - expected_value;
            let ratio = (diff * diff) / expected_value;

            let t = khi + ratio;

            if khi.abs() >= ratio.abs() {
                compensation += (khi - t) + ratio;
            } else {
                compensation += (ratio - t) + khi;
            }

            khi = t;
        }
    }

    let final_khi = khi + compensation;
    Ok(final_khi.max(0.0))
}

#[wasm_bindgen(js_name = betweenSsd)]
pub fn between_ssd(table: &js_sys::Array) -> Result<f64, JsValue> {
    let columns: Vec<Vec<f64>> = table
        .iter()
        .map(|col| js_sys::Float64Array::new(&col).to_vec())
        .collect();

    let len = columns.len();
    if len == 0 {
        return Ok(0.0);
    }

    let mut group_ns = Vec::with_capacity(len);
    let mut group_means = Vec::with_capacity(len);

    for col_arr in &columns {
        if col_arr.is_empty() {
            continue;
        }

        let g_mean = mean(col_arr)?;
        group_ns.push(col_arr.len() as f64);
        group_means.push(g_mean);
    }

    let valid_group_count = group_ns.len();
    if valid_group_count == 0 {
        return Ok(0.0);
    }

    let mut comb_n = group_ns[0];
    let mut comb_mean = group_means[0];

    for i in 1..valid_group_count {
        let gn = group_ns[i];
        let g_mean = group_means[i];
        let next_n = comb_n + gn;
        let delta = g_mean - comb_mean;

        comb_mean += delta * (gn / next_n);
        comb_n = next_n;
    }

    let grand_mean = comb_mean;

    let mut total_ssd = 0.0_f64;
    let mut compensation = 0.0_f64;

    for i in 0..valid_group_count {
        let gn = group_ns[i];
        let diff = group_means[i] - grand_mean;
        let term = gn * diff * diff;

        let t = total_ssd + term;
        if total_ssd.abs() >= term.abs() {
            compensation += (total_ssd - t) + term;
        } else {
            compensation += (term - t) + total_ssd;
        }
        total_ssd = t;
    }

    let final_ssd = total_ssd + compensation;
    Ok(final_ssd.max(0.0))
}

#[wasm_bindgen]
pub fn scd(x_values: &[f64], y_values: &[f64]) -> f64 {
    let len = x_values.len().min(y_values.len());

    let mut avg_x = 0.0;
    let mut avg_y = 0.0;
    let mut sum_cross = 0.0;

    for i in 0..len {
        let count = (i + 1) as f64;

        let delta_x = x_values[i] - avg_x;
        avg_x += delta_x / count;

        let delta_y = y_values[i] - avg_y;
        avg_y += delta_y / count;
        sum_cross += delta_x * (y_values[i] - avg_y);
    }

    sum_cross
}

pub fn get_ranks(values: &[f64]) -> Result<js_sys::Map, JsValue> {
    if values.len() < 2 {
        return Err(JsValue::from_str(
            "Values array must contain at least 2 numbers!",
        ));
    }

    let mut sorted_vals = values.to_vec();
    sorted_vals.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let ranks = js_sys::Map::new();
    let mut i = 0;

    while i < sorted_vals.len() {
        let val = sorted_vals[i];
        let mut count = 0;

        while i + count < sorted_vals.len() && sorted_vals[i + count] == val {
            count += 1;
        }

        let start_serial = (i + 1) as f64;
        let end_serial = (i + count) as f64;
        let avg_rank = (start_serial + end_serial) / 2.0;

        ranks.set(&JsValue::from_f64(val), &JsValue::from_f64(avg_rank));

        i += count;
    }

    Ok(ranks)
}