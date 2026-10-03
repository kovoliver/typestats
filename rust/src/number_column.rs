use crate::univariate::percentile;
use wasm_bindgen::prelude::*;

fn round_to(val: f64, digits: u32) -> f64 {
    if val.is_nan() || val.is_infinite() {
        return val;
    }
    let factor = 10.0_f64.powi(digits as i32);
    (val * factor).round() / factor
}

#[wasm_bindgen(js_name = describeStats)]
pub fn describe_stats(values: &[f64], label: Option<String>) -> Result<JsValue, JsValue> {
    let len = values.len();

    if len == 0 {
        let result = js_sys::Object::new();
        js_sys::Reflect::set(&result, &"missing".into(), &0.into())?;
        js_sys::Reflect::set(&result, &"valid".into(), &0.into())?;
        js_sys::Reflect::set(&result, &"mean".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"std".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"min".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"median".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"max".into(), &f64::NAN.into())?;
        if let Some(lbl) = label {
            js_sys::Reflect::set(&result, &"label".into(), &lbl.into())?;
        }
        return Ok(result.into());
    }

    let mut valid_values = Vec::with_capacity(len);
    let mut missing = 0usize;
    let mut valid_count = 0usize;

    let mut mean_acc = 0.0_f64;
    let mut m2 = 0.0_f64;
    let mut min = f64::INFINITY;
    let mut max = f64::NEG_INFINITY;

    for &val in values {
        if val.is_nan() {
            missing += 1;
            continue;
        }

        valid_values.push(val);
        valid_count += 1;

        if val < min {
            min = val;
        }
        if val > max {
            max = val;
        }

        let count_f64 = valid_count as f64;
        let delta = val - mean_acc;
        mean_acc += delta / count_f64;
        let delta2 = val - mean_acc;
        m2 += delta * delta2;
    }

    if valid_count == 0 {
        let result = js_sys::Object::new();
        js_sys::Reflect::set(&result, &"missing".into(), &(missing as u32).into())?;
        js_sys::Reflect::set(&result, &"valid".into(), &0.into())?;
        js_sys::Reflect::set(&result, &"mean".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"std".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"min".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"median".into(), &f64::NAN.into())?;
        js_sys::Reflect::set(&result, &"max".into(), &f64::NAN.into())?;
        if let Some(lbl) = label {
            js_sys::Reflect::set(&result, &"label".into(), &lbl.into())?;
        }
        return Ok(result.into());
    }

    let variance = if valid_count > 1 {
        m2 / ((valid_count - 1) as f64)
    } else {
        0.0
    };

    let std_val = variance.sqrt();

    let raw_median = percentile(&valid_values, 0.5, Some("interpolated".to_string()), Some(false))?;
    let median = round_to(raw_median, 3);

    let result = js_sys::Object::new();
    if let Some(lbl) = label {
        js_sys::Reflect::set(&result, &"label".into(), &lbl.into())?;
    }
    js_sys::Reflect::set(&result, &"missing".into(), &(missing as u32).into())?;
    js_sys::Reflect::set(&result, &"valid".into(), &(valid_count as u32).into())?;
    js_sys::Reflect::set(&result, &"mean".into(), &round_to(mean_acc, 3).into())?;
    js_sys::Reflect::set(&result, &"std".into(), &round_to(std_val, 3).into())?;
    js_sys::Reflect::set(&result, &"min".into(), &round_to(min, 3).into())?;
    js_sys::Reflect::set(&result, &"max".into(), &round_to(max, 3).into())?;
    js_sys::Reflect::set(&result, &"median".into(), &median.into())?;

    Ok(result.into())
}