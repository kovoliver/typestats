use crate::number_utils::neumaier_sum;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn mean(values: &[f64]) -> Result<f64, JsValue> {
    let n = values.len();

    if n == 0 {
        return Err(JsValue::from_str("You should give at least one number!"));
    }

    for &x in values {
        if x.is_nan() {
            return Err(JsValue::from_str(
                "The given dataset contains empty or invalid values (null, undefined, NaN, or empty strings). Please impute or filter missing values before performing statistical calculations.",
            ));
        }
    }

    let sum = neumaier_sum(values);

    Ok(sum / (n as f64))
}

#[wasm_bindgen]
pub fn ssd(values: &[f64]) -> Result<f64, JsValue> {
    let avg = mean(values)?;
    let n = values.len();

    let mut ss: f64 = 0.0;
    let mut compensation: f64 = 0.0;

    for i in 0..n {
        let diff = values[i] - avg;
        let x = diff * diff;
        let t = ss + x;

        if ss.abs() >= x.abs() {
            compensation += (ss - t) + x;
        } else {
            compensation += (x - t) + ss;
        }

        ss = t;
    }

    Ok(ss + compensation)
}

pub fn quickselect(arr: &mut [f64], k: usize) -> f64 {
    let mut left = 0;
    let mut right = arr.len().saturating_sub(1);

    while left < right {
        let pivot_index = (left + right) >> 1;
        let pivot_value = arr[pivot_index];
        let mut i = left;
        let mut j = right;

        while i <= j {
            while arr[i] < pivot_value {
                i += 1;
            }
            while arr[j] > pivot_value {
                if j == 0 {
                    break;
                }
                j -= 1;
            }
            if i <= j {
                arr.swap(i, j);
                i += 1;
                if j == 0 {
                    break;
                }
                j -= 1;
            }
        }

        if k <= j {
            right = j;
        } else if k >= i {
            left = i;
        } else {
            break;
        }
    }

    arr[k]
}

#[wasm_bindgen]
pub fn central_moment_2(values: &[f64]) -> f64 {
    let big_n = values.len();

    if big_n == 0 {
        return 0.0;
    }

    let mut mean = 0.0;
    let mut m2 = 0.0;

    for i in 0..big_n {
        let n = (i + 1) as f64;
        let x = values[i];

        let delta = x - mean;
        let delta_n = delta / n;
        let term1 = delta * delta_n * (n - 1.0);

        mean += delta_n;
        m2 += term1;
    }

    m2
}

#[wasm_bindgen]
pub fn central_moment_3(values: &[f64]) -> f64 {
    let big_n = values.len();

    if big_n == 0 {
        return 0.0;
    }

    let mut mean = 0.0;
    let mut m2 = 0.0;
    let mut m3 = 0.0;

    for i in 0..big_n {
        let n = (i + 1) as f64;
        let x = values[i];

        let delta = x - mean;
        let delta_n = delta / n;
        let term1 = delta * delta_n * (n - 1.0);

        mean += delta_n;
        m3 += term1 * delta_n * (n - 2.0) - 3.0 * delta_n * m2;
        m2 += term1;
    }

    m3
}

#[wasm_bindgen]
pub fn central_moment_4(values: &[f64]) -> f64 {
    let big_n = values.len();

    if big_n == 0 {
        return 0.0;
    }

    let mut mean = 0.0;
    let mut m2 = 0.0;
    let mut m3 = 0.0;
    let mut m4 = 0.0;

    for i in 0..big_n {
        let n = (i + 1) as f64;
        let x = values[i];

        let delta = x - mean;
        let delta_n = delta / n;
        let delta_n2 = delta_n * delta_n;
        let term1 = delta * delta_n * (n - 1.0);

        mean += delta_n;
        m4 += term1 * delta_n2 * (n * n - 3.0 * n + 3.0) + 6.0 * delta_n2 * m2 - 4.0 * delta_n * m3;
        m3 += term1 * delta_n * (n - 2.0) - 3.0 * delta_n * m2;
        m2 += term1;
    }

    m4
}

#[wasm_bindgen]
pub fn mode(values: &[f64]) -> Vec<f64> {
    let mut counts: HashMap<u64, (f64, usize)> = HashMap::new();
    let mut max_count = 0;

    for &val in values {
        let key = val.to_bits();
        let entry = counts.entry(key).or_insert((val, 0));
        entry.1 += 1;

        if entry.1 > max_count {
            max_count = entry.1;
        }
    }

    if counts.len() > 1 && counts.len() * max_count == values.len() {
        return Vec::new();
    }

    let mut modes = Vec::new();
    for (_key, (val, count)) in counts {
        if count == max_count {
            modes.push(val);
        }
    }

    modes
}

#[wasm_bindgen]
pub fn percentile(
    values: &[f64],
    percent: f64,
    mode: Option<String>,
    is_sorted: Option<bool>,
) -> Result<f64, JsValue> {
    if !(0.0..=1.0).contains(&percent) {
        return Err(JsValue::from_str(
            "The given percentage should be between 0 and 1!",
        ));
    }

    let len = values.len();
    if len == 0 {
        return Ok(f64::NAN);
    }

    let sorted = is_sorted.unwrap_or(false);
    let mut arr = values.to_vec();

    if percent == 0.0 {
        if !sorted {
            quickselect(&mut arr, 0);
        }
        return Ok(arr[0]);
    }

    if percent == 1.0 {
        if !sorted {
            quickselect(&mut arr, len - 1);
        }
        return Ok(arr[len - 1]);
    }

    let index = (len - 1) as f64 * percent;
    let int_index = index.floor() as usize;
    let index_diff = index - (int_index as f64);

    if index_diff == 0.0 {
        if !sorted {
            quickselect(&mut arr, int_index);
        }
        return Ok(arr[int_index]);
    }

    let v_low = if sorted {
        arr[int_index]
    } else {
        quickselect(&mut arr, int_index)
    };

    let mode_str = mode.as_deref().unwrap_or("interpolated");

    let needs_high = matches!(mode_str, "interpolated" | "midpoint" | "higher")
        || (mode_str == "nearest" && index_diff >= 0.5);

    let v_high = if needs_high {
        if sorted {
            arr[int_index + 1]
        } else {
            quickselect(&mut arr, int_index + 1)
        }
    } else {
        v_low
    };

    let result = match mode_str {
        "midpoint" => (v_low + v_high) / 2.0,
        "lower" => v_low,
        "higher" => v_high,
        "nearest" => {
            if index_diff < 0.5 {
                v_low
            } else {
                v_high
            }
        }
        "interpolated" | _ => v_low + (v_high - v_low) * index_diff,
    };

    Ok(result)
}
