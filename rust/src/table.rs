use std::cmp::Ordering;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub enum ImputeMode {
    Impute,
    Replace,
}

fn is_valid(value: f64, mode: &str, min: Option<f64>, max: Option<f64>) -> bool {
    if !value.is_finite() {
        return false;
    }

    match mode {
        "impute" => true,

        "replace" => {
            if let Some(min) = min {
                if value < min {
                    return false;
                }
            }

            if let Some(max) = max {
                if value > max {
                    return false;
                }
            }

            true
        }

        _ => false,
    }
}

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

    /*
     * Convert the JS columns to Rust-owned numeric/string data once.
     *
     * This avoids calling Reflect::get() inside sort_by().
     */
    let num_cols = columns_data.length() as usize;

    let mut columns: Vec<Vec<f64>> = Vec::with_capacity(num_cols);

    for i in 0..num_cols {
        let col = columns_data.get(i as u32);
        let array = js_sys::Float64Array::new(&col);
        columns.push(array.to_vec());
    }

    indices.sort_unstable_by(|&a, &b| {
        let a = a as usize;
        let b = b as usize;

        for col in &columns {
            let val_a = col[a];
            let val_b = col[b];

            let a_nan = val_a.is_nan();
            let b_nan = val_b.is_nan();

            if a_nan && b_nan {
                continue;
            }

            if a_nan {
                return if is_ascending {
                    Ordering::Greater
                } else {
                    Ordering::Less
                };
            }

            if b_nan {
                return if is_ascending {
                    Ordering::Less
                } else {
                    Ordering::Greater
                };
            }

            let cmp = val_a.partial_cmp(&val_b).unwrap_or(Ordering::Equal);

            if cmp != Ordering::Equal {
                return if is_ascending { cmp } else { cmp.reverse() };
            }
        }

        Ordering::Equal
    });

    indices
}

const ERR_EMPTY: &str = "The time series does not have values!";
const ERR_NO_VALID: &str = "The given dataset only has invalid values or outliers!";

#[wasm_bindgen]
pub fn locf(
    values: &mut [f64],
    mode: &str,
    min: Option<f64>,
    max: Option<f64>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    let first_valid = values.iter().position(|&x| is_valid(x, mode, min, max));

    let first_valid = match first_valid {
        Some(i) => i,
        None => return Err(JsError::new(ERR_NO_VALID).into()),
    };

    let first_value = values[first_valid];

    for value in values.iter_mut().take(first_valid) {
        *value = first_value;
    }

    let mut last_valid = first_value;

    for value in values.iter_mut().skip(first_valid + 1) {
        if is_valid(*value, mode, min, max) {
            last_valid = *value;
        } else {
            *value = last_valid;
        }
    }

    Ok(())
}

#[wasm_bindgen]
pub fn nocb(
    values: &mut [f64],
    mode: &str,
    min: Option<f64>,
    max: Option<f64>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    let last_valid = values.iter().rposition(|&x| is_valid(x, mode, min, max));

    let last_valid = match last_valid {
        Some(i) => i,
        None => return Err(JsError::new(ERR_NO_VALID).into()),
    };

    let last_value = values[last_valid];

    for value in values.iter_mut().skip(last_valid + 1) {
        *value = last_value;
    }

    let mut next_valid = last_value;

    for i in (0..last_valid).rev() {
        if is_valid(values[i], mode, min, max) {
            next_valid = values[i];
        } else {
            values[i] = next_valid;
        }
    }

    Ok(())
}

#[wasm_bindgen(js_name=getInterpolatedValues)]
pub fn get_interpolated_values(first_valid: f64, last_valid: f64, steps: usize) -> Vec<f64> {
    let inter_pol_add = (last_valid - first_valid) / (steps + 1) as f64;
    let mut interpol_val = first_valid + inter_pol_add;
    let mut out = Vec::with_capacity(steps);

    for _ in 0..steps {
        out.push(interpol_val);
        interpol_val += inter_pol_add;
    }
    out
}

#[wasm_bindgen(js_name = interpolation)]
pub fn interpolation(
    values: &mut [f64],
    mode: &str,
    min: Option<f64>,
    max: Option<f64>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    let len = values.len();
    let mut count_invalid = 0usize;

    for i in 0..len {
        if !is_valid(values[i], mode, min, max) {
            if i == 0 {
                return Err(
                    JsError::new(
                        "The first element is invalid or an outlier; hence, interpolation is not possible!"
                    ).into()
                );
            }

            count_invalid += 1;
        } else if count_invalid != 0 {
            let first_valid = values[i - (count_invalid + 1)];

            let last_valid = values[i];

            let step = (last_valid - first_valid) / (count_invalid + 1) as f64;

            for j in 0..count_invalid {
                values[i - count_invalid + j] = first_valid + step * (j + 1) as f64;
            }

            count_invalid = 0;
        }
    }

    if count_invalid > 0 {
        return Err(JsError::new(
            "The last elements are invalid or outliers; hence, interpolation is not possible!",
        )
        .into());
    }

    Ok(())
}

#[wasm_bindgen(js_name = movingAverageImputation)]
pub fn moving_average_imputation(
    values: &mut [f64],
    mode: &str,
    min: Option<f64>,
    max: Option<f64>,
    window_size: usize,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    if window_size == 0 {
        return Err(JsError::new("Window size must be a positive integer!").into());
    }

    let len = values.len();

    let mut valid = vec![false; len];
    let mut has_any_valid = false;

    for i in 0..len {
        valid[i] = is_valid(values[i], mode, min, max);

        if valid[i] {
            has_any_valid = true;
        }
    }

    if !has_any_valid {
        return Err(JsError::new(ERR_NO_VALID).into());
    }

    let left_radius = window_size / 2;

    let right_radius = if window_size % 2 == 0 {
        left_radius.saturating_sub(1)
    } else {
        left_radius
    };

    let mut prefix_sum = vec![0.0; len + 1];
    let mut prefix_valid = vec![0usize; len + 1];

    for i in 0..len {
        prefix_sum[i + 1] = prefix_sum[i];
        prefix_valid[i + 1] = prefix_valid[i];

        if valid[i] {
            prefix_sum[i + 1] += values[i];
            prefix_valid[i + 1] += 1;
        }
    }

    for i in 0..len {
        if valid[i] {
            continue;
        }

        let start = i.saturating_sub(left_radius);
        let end = (len - 1).min(i + right_radius);

        let window_start = start;
        let window_end = end + 1;

        let valid_count = prefix_valid[window_end] - prefix_valid[window_start];

        if valid_count == 0 {
            return Err(
                JsError::new(&format!(
                    "Moving average imputation is not possible for index {}: no valid values or non-outliers in window size {}!",
                    i,
                    window_size
                ))
                .into()
            );
        }

        let sum = prefix_sum[window_end] - prefix_sum[window_start];

        values[i] = sum / valid_count as f64;
    }

    Ok(())
}
