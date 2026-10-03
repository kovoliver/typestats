use std::cmp::Ordering;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = sortTableIndices)]
pub fn sort_table_indices(
    columns_data: &js_sys::Array,
    row_count: usize,
    is_ascending: bool,
) -> Vec<i32> {
    let mut indices: Vec<i32> = (0..row_count as i32).collect();

    if columns_data.length() == 0 || row_count == 0 {
        return indices;
    }

    let dir = if is_ascending { 1 } else { -1 };
    let num_cols = columns_data.length();

    indices.sort_by(|&a, &b| {
        let idx_a = JsValue::from(a);
        let idx_b = JsValue::from(b);

        for i in 0..num_cols {
            let col = columns_data.get(i);
            let val_a = js_sys::Reflect::get(&col, &idx_a).unwrap_or(JsValue::NULL);
            let val_b = js_sys::Reflect::get(&col, &idx_b).unwrap_or(JsValue::NULL);

            if val_a == val_b {
                continue;
            }

            let is_a_invalid =
                val_a.is_null() || val_a.is_undefined() || js_sys::Number::is_nan(&val_a);
            let is_b_invalid =
                val_b.is_null() || val_b.is_undefined() || js_sys::Number::is_nan(&val_b);

            // Két érvénytelen érték egyenlőnek számít, megy tovább a következő oszlopra
            if is_a_invalid && is_b_invalid {
                continue;
            }

            if is_a_invalid {
                return if dir == 1 {
                    Ordering::Greater
                } else {
                    Ordering::Less
                };
            }
            if is_b_invalid {
                return if dir == 1 {
                    Ordering::Less
                } else {
                    Ordering::Greater
                };
            }

            if let (Some(num_a), Some(num_b)) = (val_a.as_f64(), val_b.as_f64()) {
                let cmp = num_a.partial_cmp(&num_b).unwrap_or(Ordering::Equal);
                return if dir == 1 { cmp } else { cmp.reverse() };
            }

            if let (Some(bool_a), Some(bool_b)) = (val_a.as_bool(), val_b.as_bool()) {
                let cmp = bool_a.cmp(&bool_b);
                return if dir == 1 { cmp } else { cmp.reverse() };
            }

            if let (Some(str_a), Some(str_b)) = (val_a.as_string(), val_b.as_string()) {
                let cmp = str_a.cmp(&str_b);
                return if dir == 1 { cmp } else { cmp.reverse() };
            }

            let str_a = val_a.as_string().unwrap_or_default();
            let str_b = val_b.as_string().unwrap_or_default();
            let cmp = str_a.cmp(&str_b);
            return if dir == 1 { cmp } else { cmp.reverse() };
        }

        Ordering::Equal
    });

    indices
}

fn build_flags(values: &[f64], valid_mask: Option<Vec<u8>>) -> Result<Vec<bool>, JsValue> {
    let len = values.len();
    if len == 0 {
        return Err(JsValue::from_str("The time series does not have values!"));
    }

    let flags: Vec<bool> = match valid_mask {
        Some(mask) => {
            if mask.len() != len {
                return Err(JsValue::from_str(&format!(
                    "The valid mask length ({}) must match the number of values ({})!",
                    mask.len(),
                    len
                )));
            }
            mask.iter().map(|&m| m != 0).collect()
        }
        None => values.iter().map(|v| !v.is_nan()).collect(),
    };

    if !flags.iter().any(|&f| f) {
        return Err(JsValue::from_str(
            "The given dataset only has invalid values or outliers!",
        ));
    }

    Ok(flags)
}

#[wasm_bindgen(js_name = locf)]
pub fn locf(values: &mut [f64], valid_mask: Option<Vec<u8>>) -> Result<Vec<f64>, JsValue> {
    let flags = build_flags(values, valid_mask)?;

    let first_idx = flags.iter().position(|&f| f).unwrap();
    let mut last_valid = values[first_idx];

    for i in 0..values.len() {
        if flags[i] {
            last_valid = values[i];
        } else {
            values[i] = last_valid;
        }
    }

    Ok(values.to_vec())
}

#[wasm_bindgen(js_name = nocb)]
pub fn nocb(values: &mut [f64], valid_mask: Option<Vec<u8>>) -> Result<Vec<f64>, JsValue> {
    let flags = build_flags(values, valid_mask)?;

    let last_idx = flags.iter().rposition(|&f| f).unwrap();
    let mut next_valid = values[last_idx];

    for i in (0..values.len()).rev() {
        if flags[i] {
            next_valid = values[i];
        } else {
            values[i] = next_valid;
        }
    }

    Ok(values.to_vec())
}

pub fn get_interpolated_values(first_valid: f64, last_valid: f64, steps: usize) -> Vec<f64> {
    let interpol_add = (last_valid - first_valid) / ((steps + 1) as f64);
    let mut interpol_val = first_valid + interpol_add;
    let mut interpol_values = Vec::with_capacity(steps);

    for _ in 0..steps {
        interpol_values.push(interpol_val);
        interpol_val += interpol_add;
    }

    interpol_values
}

#[wasm_bindgen(js_name = movingAverageImputation)]
pub fn moving_average_imputation(
    values: &mut [f64],
    window_size: usize,
    valid_mask: Option<Vec<u8>>,
) -> Result<Vec<f64>, JsValue> {
    if window_size == 0 {
        return Err(JsValue::from_str("Window size must be a positive integer!"));
    }

    let flags = build_flags(values, valid_mask)?;
    let len = values.len();

    let left_radius = window_size / 2;
    let right_radius = if window_size % 2 == 0 {
        left_radius.saturating_sub(1)
    } else {
        left_radius
    };

    for i in 0..len {
        if flags[i] {
            continue;
        }

        let start = i.saturating_sub(left_radius);
        let end = (i + right_radius).min(len - 1);

        let mut sum = 0.0_f64;
        let mut valid_count = 0usize;

        for j in start..=end {
            if flags[j] {
                sum += values[j];
                valid_count += 1;
            }
        }

        if valid_count == 0 {
            return Err(JsValue::from_str(&format!(
                "Moving average imputation is not possible for index {}: no valid values or non-outliers in window size {}!",
                i, window_size
            )));
        }

        values[i] = sum / (valid_count as f64);
    }

    Ok(values.to_vec())
}