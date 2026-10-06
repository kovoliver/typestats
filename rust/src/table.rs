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

const ERR_EMPTY: &str = "The time series does not have values!";
const ERR_NO_VALID: &str = "The given dataset only has invalid values or outliers!";

fn validate_order<'a>(
    ordered_indices: &'a Option<Vec<u32>>,
    len: usize,
) -> Result<Option<&'a [u32]>, JsValue> {
    match ordered_indices {
        None => Ok(None),
        Some(o) => {
            if o.len() != len {
                return Err(JsError::new(
                    "The length of orderedIndices must match the length of the values!",
                )
                .into());
            }

            if o.iter().any(|&i| i as usize >= len) {
                return Err(JsError::new("orderedIndices contains an out-of-range index!").into());
            }

            Ok(Some(o.as_slice()))
        }
    }
}

#[wasm_bindgen]
pub fn locf(
    values: &mut [f64],
    mode: &str,
    min: Option<f64>,
    max: Option<f64>,
    ordered_indices: Option<Vec<u32>>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    let len = values.len();
    let order = validate_order(&ordered_indices, len)?;
    let at = |k: usize| -> usize {
        match order {
            Some(o) => o[k] as usize,
            None => k,
        }
    };

    let first_valid = match (0..len).find(|&k| is_valid(values[at(k)], mode, min, max)) {
        Some(k) => k,
        None => return Err(JsError::new(ERR_NO_VALID).into()),
    };

    let first_value = values[at(first_valid)];

    for k in 0..first_valid {
        values[at(k)] = first_value;
    }

    let mut last_valid = first_value;

    for k in (first_valid + 1)..len {
        let idx = at(k);

        if is_valid(values[idx], mode, min, max) {
            last_valid = values[idx];
        } else {
            values[idx] = last_valid;
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
    ordered_indices: Option<Vec<u32>>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    let len = values.len();
    let order = validate_order(&ordered_indices, len)?;
    let at = |k: usize| -> usize {
        match order {
            Some(o) => o[k] as usize,
            None => k,
        }
    };

    let last_valid = match (0..len)
        .rev()
        .find(|&k| is_valid(values[at(k)], mode, min, max))
    {
        Some(k) => k,
        None => return Err(JsError::new(ERR_NO_VALID).into()),
    };

    let last_value = values[at(last_valid)];

    for k in (last_valid + 1)..len {
        values[at(k)] = last_value;
    }

    let mut next_valid = last_value;

    for k in (0..last_valid).rev() {
        let idx = at(k);

        if is_valid(values[idx], mode, min, max) {
            next_valid = values[idx];
        } else {
            values[idx] = next_valid;
        }
    }

    Ok(())
}

#[wasm_bindgen(js_name = interpolation)]
pub fn interpolation(
    values: &mut [f64],
    mode: &str,
    min: Option<f64>,
    max: Option<f64>,
    ordered_indices: Option<Vec<u32>>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    let len = values.len();
    let order = validate_order(&ordered_indices, len)?;
    let at = |k: usize| -> usize {
        match order {
            Some(o) => o[k] as usize,
            None => k,
        }
    };

    let mut count_invalid = 0usize;

    for k in 0..len {
        if !is_valid(values[at(k)], mode, min, max) {
            if k == 0 {
                return Err(JsError::new(
                    "The first element is invalid or an outlier; hence, interpolation is not possible!",
                )
                .into());
            }

            count_invalid += 1;
        } else if count_invalid != 0 {
            let first_valid = values[at(k - (count_invalid + 1))];
            let last_valid = values[at(k)];

            let step = (last_valid - first_valid) / (count_invalid + 1) as f64;

            for j in 0..count_invalid {
                values[at(k - count_invalid + j)] = first_valid + step * (j + 1) as f64;
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
    ordered_indices: Option<Vec<u32>>,
) -> Result<(), JsValue> {
    if values.is_empty() {
        return Err(JsError::new(ERR_EMPTY).into());
    }

    if window_size == 0 {
        return Err(JsError::new("Window size must be a positive integer!").into());
    }

    let len = values.len();
    let order = validate_order(&ordered_indices, len)?;
    let at = |k: usize| -> usize {
        match order {
            Some(o) => o[k] as usize,
            None => k,
        }
    };

    // Validity and prefix sums are indexed by position in the ordered sequence.
    let mut valid = vec![false; len];
    let mut has_any_valid = false;

    for k in 0..len {
        valid[k] = is_valid(values[at(k)], mode, min, max);

        if valid[k] {
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

    for k in 0..len {
        prefix_sum[k + 1] = prefix_sum[k];
        prefix_valid[k + 1] = prefix_valid[k];

        if valid[k] {
            prefix_sum[k + 1] += values[at(k)];
            prefix_valid[k + 1] += 1;
        }
    }

    for k in 0..len {
        if valid[k] {
            continue;
        }

        let start = k.saturating_sub(left_radius);
        let end: usize = (len - 1).min(k + right_radius);

        let window_start = start;
        let window_end = end + 1;

        let valid_count = prefix_valid[window_end] - prefix_valid[window_start];

        if valid_count == 0 {
            return Err(JsError::new(&format!(
                "Moving average imputation is not possible for index {}: no valid values or non-outliers in window size {}!",
                at(k),
                window_size
            ))
            .into());
        }

        let sum = prefix_sum[window_end] - prefix_sum[window_start];

        values[at(k)] = sum / valid_count as f64;
    }

    Ok(())
}
