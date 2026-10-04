use crate::number_utils::neumaier_sum;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn mean(values: &[f64]) -> Result<f64, JsValue> {
    let n = values.len();
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

#[wasm_bindgen(js_name=centralMoment2)]
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

#[wasm_bindgen(js_name=centralMoment3)]
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

#[wasm_bindgen(js_name=centralMoment4)]
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
pub fn quickselect(arr: &mut [f64], k: usize, left: usize, right: usize) -> f64 {
    let (mut left, mut right) = (left, right);
    let k_i = k as isize;

    while left < right {
        let pivot = arr[(left + right) >> 1];
        let mut i = left as isize;
        let mut j = right as isize;

        while i <= j {
            while arr[i as usize] < pivot {
                i += 1;
            }
            while arr[j as usize] > pivot {
                j -= 1;
            }
            if i <= j {
                arr.swap(i as usize, j as usize);
                i += 1;
                j -= 1;
            }
        }

        if k_i <= j {
            right = j as usize;
        } else if k_i >= i {
            left = i as usize;
        } else {
            break;
        }
    }
    arr[k]
}

#[wasm_bindgen]
pub fn percentile(values: &[f64], percent: f64, mode: &str, is_sorted: bool) -> f64 {
    let len = values.len();
    if len == 0 {
        return f64::NAN;
    }

    let mut owned: Vec<f64> = if is_sorted {
        Vec::new()
    } else {
        values.to_vec()
    };

    if percent == 0.0 {
        if is_sorted {
            return values[0];
        }
        return quickselect(&mut owned, 0, 0, len - 1);
    }
    if percent == 1.0 {
        if is_sorted {
            return values[len - 1];
        }
        return quickselect(&mut owned, len - 1, 0, len - 1);
    }

    let index = (len - 1) as f64 * percent;
    let int_index = index.floor() as usize;
    let index_diff = index - int_index as f64;

    if index_diff == 0.0 {
        if is_sorted {
            return values[int_index];
        }
        return quickselect(&mut owned, int_index, 0, len - 1);
    }

    let v_low = if is_sorted {
        values[int_index]
    } else {
        quickselect(&mut owned, int_index, 0, len - 1)
    };

    let need_high = match mode {
        "lower" => false,
        "nearest" => index_diff >= 0.5,
        _ => true,
    };

    let v_high = if !need_high {
        v_low
    } else if is_sorted {
        values[int_index + 1]
    } else {
        quickselect(&mut owned, int_index + 1, int_index + 1, len - 1)
    };

    match mode {
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
        _ => v_low + (v_high - v_low) * index_diff,
    }
}
