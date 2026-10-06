use js_sys::{Array, Float64Array};
use wasm_bindgen::JsCast;
use wasm_bindgen::prelude::*;

enum Column {
    Float(Vec<f64>),
    Str(Vec<Option<String>>),
    Bool(Vec<Option<bool>>),
}

fn compare_table_data<T: PartialOrd>(val1: Option<T>, val2: Option<T>) -> i32 {
    match (val1, val2) {
        (None, None) => 0,
        (None, _) => 1,
        (_, None) => -1,
        (Some(a), Some(b)) => {
            if a == b {
                0
            } else if a > b {
                1
            } else {
                -1
            }
        }
    }
}

impl Column {
    fn len(&self) -> usize {
        match self {
            Column::Float(v) => v.len(),
            Column::Str(v) => v.len(),
            Column::Bool(v) => v.len(),
        }
    }

    fn compare_at(&self, a: usize, b: usize) -> i32 {
        match self {
            Column::Float(v) => {
                let valid = |x: f64| if x.is_nan() { None } else { Some(x) };
                compare_table_data(valid(v[a]), valid(v[b]))
            }
            Column::Str(v) => compare_table_data(v[a].as_deref(), v[b].as_deref()),
            Column::Bool(v) => compare_table_data(v[a], v[b]),
        }
    }
}

fn compare_rows_at_index(table: &[Column], row_a: usize, row_b: usize) -> i32 {
    for col in table {
        let res = col.compare_at(row_a, row_b);
        if res != 0 {
            return res;
        }
    }
    0
}

fn quick_sort_inner(
    table: &[Column],
    dir: i32,
    left_idx: isize,
    right_idx: isize,
    indices: &mut [u32],
) {
    if left_idx >= right_idx {
        return;
    }

    let mut i = left_idx;
    let mut j = right_idx;
    let pivot_row_idx = indices[((left_idx + right_idx) / 2) as usize] as usize;

    while i <= j {
        while compare_rows_at_index(table, indices[i as usize] as usize, pivot_row_idx) == -dir {
            i += 1;
        }

        while compare_rows_at_index(table, indices[j as usize] as usize, pivot_row_idx) == dir {
            j -= 1;
        }

        if i <= j {
            indices.swap(i as usize, j as usize);
            i += 1;
            j -= 1;
        }
    }

    if left_idx < j {
        quick_sort_inner(table, dir, left_idx, j, indices);
    }
    if i < right_idx {
        quick_sort_inner(table, dir, i, right_idx, indices);
    }
}

fn parse_table(table: &Array) -> Result<Vec<Column>, JsValue> {
    let mut columns = Vec::with_capacity(table.length() as usize);

    for c in table.iter() {
        if let Some(f) = c.dyn_ref::<Float64Array>() {
            columns.push(Column::Float(f.to_vec()));
            continue;
        }

        let arr: Array = c
            .dyn_into()
            .map_err(|_| JsValue::from_str("The column must be a Float64Array"))?;

        let is_bool = arr
            .iter()
            .find(|v| !v.is_null())
            .map_or(false, |v| v.as_bool().is_some());

        if is_bool {
            columns.push(Column::Bool(arr.iter().map(|v| v.as_bool()).collect()));
        } else {
            columns.push(Column::Str(arr.iter().map(|v| v.as_string()).collect()));
        }
    }

    Ok(columns)
}

#[wasm_bindgen(js_name = quickSortTable)]
pub fn quick_sort_table(
    table: &Array,
    sort_type: &str,
    left_idx: u32,
    right_idx: u32,
) -> Result<Vec<u32>, JsValue> {
    let columns = parse_table(table)?;

    let row_numbers = columns.first().map_or(0, |c| c.len());
    let mut indices: Vec<u32> = (0..row_numbers as u32).collect();

    if row_numbers == 0 {
        return Ok(indices);
    }

    let dir = if sort_type == "asc" { 1 } else { -1 };
    quick_sort_inner(
        &columns,
        dir,
        left_idx as isize,
        right_idx as isize,
        &mut indices,
    );

    Ok(indices)
}