use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = getMin)]
pub fn get_min(values: &[f64]) -> Result<f64, JsValue> {
    if values.is_empty() {
        return Err(JsValue::from_str("Cannot get minimum of an empty array!"));
    }

    let mut min = values[0];
    for &val in values.iter().skip(1) {
        if val < min {
            min = val;
        }
    }

    Ok(min)
}

#[wasm_bindgen(js_name = getMax)]
pub fn get_max(values: &[f64]) -> Result<f64, JsValue> {
    if values.is_empty() {
        return Err(JsValue::from_str("Cannot get maximum of an empty array!"));
    }

    let mut max = values[0];
    for &val in values.iter().skip(1) {
        if val > max {
            max = val;
        }
    }

    Ok(max)
}

#[wasm_bindgen(js_name = flattenArray)]
pub fn flatten_array(table: &js_sys::Array) -> Vec<f64> {
    let columns: Vec<Vec<f64>> = table
        .iter()
        .map(|col| js_sys::Float64Array::new(&col).to_vec())
        .collect();

    let total_length: usize = columns.iter().map(|c| c.len()).sum();
    let mut flattened = Vec::with_capacity(total_length);

    for col in &columns {
        flattened.extend_from_slice(col);
    }

    flattened
}