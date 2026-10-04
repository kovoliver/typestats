export class DotProductAndSumPow2Result {
    static __wrap(ptr) {
        const obj = Object.create(DotProductAndSumPow2Result.prototype);
        obj.__wbg_ptr = ptr;
        DotProductAndSumPow2ResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DotProductAndSumPow2ResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dotproductandsumpow2result_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get x2_sum() {
        const ret = wasm.__wbg_get_dotproductandsumpow2result_x2_sum(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get xy_sum() {
        const ret = wasm.__wbg_get_dotproductandsumpow2result_xy_sum(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set x2_sum(arg0) {
        wasm.__wbg_set_dotproductandsumpow2result_x2_sum(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set xy_sum(arg0) {
        wasm.__wbg_set_dotproductandsumpow2result_xy_sum(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) DotProductAndSumPow2Result.prototype[Symbol.dispose] = DotProductAndSumPow2Result.prototype.free;

/**
 * @enum {0 | 1}
 */
export const ImputeMode = Object.freeze({
    Impute: 0, "0": "Impute",
    Replace: 1, "1": "Replace",
});

export class Matrix {
    static __wrap(ptr) {
        const obj = Object.create(Matrix.prototype);
        obj.__wbg_ptr = ptr;
        MatrixFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MatrixFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_matrix_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get cols() {
        const ret = wasm.matrix_cols(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get determinant() {
        const ret = wasm.matrix_determinant(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number | null} [max_iterations]
     * @param {number | null} [tolerance]
     * @returns {{ values: Float64Array; vectors: Matrix }}
     */
    eigen(max_iterations, tolerance) {
        const ret = wasm.matrix_eigen(this.__wbg_ptr, !isLikeNone(max_iterations), isLikeNone(max_iterations) ? 0 : max_iterations, !isLikeNone(tolerance), isLikeNone(tolerance) ? 0 : tolerance);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {number} row_index
     * @param {number} col_index
     * @returns {number}
     */
    getElement(row_index, col_index) {
        const ret = wasm.matrix_getElement(this.__wbg_ptr, row_index, col_index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @returns {Matrix}
     */
    inverse() {
        const ret = wasm.matrix_inverse(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Matrix.__wrap(ret[0]);
    }
    /**
     * @returns {boolean}
     */
    get isSquare() {
        const ret = wasm.matrix_isSquare(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get isSymmetric() {
        const ret = wasm.matrix_isSymmetric(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {Matrix} matrix_a
     * @param {Matrix} matrix_b
     * @returns {Matrix}
     */
    multiply(matrix_a, matrix_b) {
        _assertClass(matrix_a, Matrix);
        _assertClass(matrix_b, Matrix);
        const ret = wasm.matrix_multiply(this.__wbg_ptr, matrix_a.__wbg_ptr, matrix_b.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Matrix.__wrap(ret[0]);
    }
    /**
     * @param {Float64Array[]} values
     */
    constructor(values) {
        const ret = wasm.matrix_new(isLikeNone(values) ? 0 : addToExternrefTable0(values));
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        MatrixFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} pivot_row
     * @param {number} pivot_col
     * @returns {Matrix}
     */
    pivot(pivot_row, pivot_col) {
        const ret = wasm.matrix_pivot(this.__wbg_ptr, pivot_row, pivot_col);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Matrix.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    get rows() {
        const ret = wasm.matrix_rows(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Float64Array} b
     * @returns {Float64Array}
     */
    solve(b) {
        const ptr0 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.matrix_solve(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @returns {Matrix}
     */
    get transposed() {
        const ret = wasm.matrix_transposed(this.__wbg_ptr);
        return Matrix.__wrap(ret);
    }
    /**
     * @returns {Float64Array[]}
     */
    get values() {
        const ret = wasm.matrix_values(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Matrix.prototype[Symbol.dispose] = Matrix.prototype.free;

export class VarCovResult {
    static __wrap(ptr) {
        const obj = Object.create(VarCovResult.prototype);
        obj.__wbg_ptr = ptr;
        VarCovResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VarCovResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_varcovresult_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get cov() {
        const ret = wasm.__wbg_get_varcovresult_cov(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get x_var() {
        const ret = wasm.__wbg_get_varcovresult_x_var(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set cov(arg0) {
        wasm.__wbg_set_varcovresult_cov(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set x_var(arg0) {
        wasm.__wbg_set_varcovresult_x_var(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) VarCovResult.prototype[Symbol.dispose] = VarCovResult.prototype.free;

/**
 * @param {Array<any>} table
 * @returns {number}
 */
export function betweenSSD(table) {
    const ret = wasm.betweenSSD(table);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} y_actual
 * @param {Function} predict
 * @param {number} degrees_of_freedom
 * @returns {number}
 */
export function calculateMSE(y_actual, predict, degrees_of_freedom) {
    const ptr0 = passArrayF64ToWasm0(y_actual, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.calculateMSE(ptr0, len0, predict, degrees_of_freedom);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function centralMoment2(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.centralMoment2(ptr0, len0);
    return ret;
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function centralMoment3(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.centralMoment3(ptr0, len0);
    return ret;
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function centralMoment4(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.centralMoment4(ptr0, len0);
    return ret;
}

/**
 * @param {Array<any>} table
 * @returns {number}
 */
export function chiSquare(table) {
    const ret = wasm.chiSquare(table);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} values
 * @param {string | null} [label]
 * @returns {any}
 */
export function describeStats(values, label) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    var ptr1 = isLikeNone(label) ? 0 : passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    const ret = wasm.describeStats(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {Array<any>} table
 * @returns {Float64Array}
 */
export function flattenArray(table) {
    const ret = wasm.flattenArray(table);
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
}

/**
 * @param {number} first_valid
 * @param {number} last_valid
 * @param {number} steps
 * @returns {Float64Array}
 */
export function getInterpolatedValues(first_valid, last_valid, steps) {
    const ret = wasm.getInterpolatedValues(first_valid, last_valid, steps);
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function getMax(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.getMax(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function getMin(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.getMin(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} values
 * @returns {Map<any, any>}
 */
export function getRanks(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.getRanks(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {Float64Array} values
 * @param {string} mode
 * @param {number | null} [min]
 * @param {number | null} [max]
 */
export function interpolation(values, mode, min, max) {
    var ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.interpolation(ptr0, len0, values, ptr1, len1, !isLikeNone(min), isLikeNone(min) ? 0 : min, !isLikeNone(max), isLikeNone(max) ? 0 : max);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {Float64Array} values
 * @param {string} mode
 * @param {number | null} [min]
 * @param {number | null} [max]
 */
export function locf(values, mode, min, max) {
    var ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.locf(ptr0, len0, values, ptr1, len1, !isLikeNone(min), isLikeNone(min) ? 0 : min, !isLikeNone(max), isLikeNone(max) ? 0 : max);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function mean(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mean(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} values
 * @returns {Float64Array}
 */
export function mode(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mode(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {Float64Array} values
 * @param {string} mode
 * @param {number | null | undefined} min
 * @param {number | null | undefined} max
 * @param {number} window_size
 */
export function movingAverageImputation(values, mode, min, max, window_size) {
    var ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.movingAverageImputation(ptr0, len0, values, ptr1, len1, !isLikeNone(min), isLikeNone(min) ? 0 : min, !isLikeNone(max), isLikeNone(max) ? 0 : max, window_size);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {DotProductAndSumPow2Result}
 */
export function neumaierDotProductAndSumPow2(x, y) {
    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.neumaierDotProductAndSumPow2(ptr0, len0, ptr1, len1);
    return DotProductAndSumPow2Result.__wrap(ret);
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function neumaierSum(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.neumaierSum(ptr0, len0);
    return ret;
}

/**
 * @param {Float64Array} values
 * @param {string} mode
 * @param {number | null} [min]
 * @param {number | null} [max]
 */
export function nocb(values, mode, min, max) {
    var ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.nocb(ptr0, len0, values, ptr1, len1, !isLikeNone(min), isLikeNone(min) ? 0 : min, !isLikeNone(max), isLikeNone(max) ? 0 : max);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * @param {Float64Array} values
 */
export function orderAsc(values) {
    var ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.orderAsc(ptr0, len0, values);
}

/**
 * @param {Float64Array} values
 */
export function orderDesc(values) {
    var ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.orderDesc(ptr0, len0, values);
}

/**
 * @param {Float64Array} values
 * @param {number} percent
 * @param {string} mode
 * @param {boolean} is_sorted
 * @returns {number}
 */
export function percentile(values, percent, mode, is_sorted) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.percentile(ptr0, len0, percent, ptr1, len1, is_sorted);
    return ret;
}

/**
 * @param {Float64Array} arr
 * @param {number} k
 * @param {number} left
 * @param {number} right
 * @returns {number}
 */
export function quickselect(arr, k, left, right) {
    var ptr0 = passArrayF64ToWasm0(arr, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.quickselect(ptr0, len0, arr, k, left, right);
    return ret;
}

/**
 * @param {Float64Array} x_values
 * @param {Float64Array} y_values
 * @returns {number}
 */
export function scd(x_values, y_values) {
    const ptr0 = passArrayF64ToWasm0(x_values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y_values, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.scd(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * @param {Array<any>} columns_data
 * @param {number} row_count
 * @param {boolean} is_ascending
 * @returns {Int32Array}
 */
export function sortTableIndices(columns_data, row_count, is_ascending) {
    const ret = wasm.sortTableIndices(columns_data, row_count, is_ascending);
    var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * @param {Float64Array} values
 * @returns {number}
 */
export function ssd(values) {
    const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.ssd(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {number} x_mean
 * @param {number} y_mean
 * @returns {VarCovResult}
 */
export function varianceAndCovariance(x, y, x_mean, y_mean) {
    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.varianceAndCovariance(ptr0, len0, ptr1, len1, x_mean, y_mean);
    return VarCovResult.__wrap(ret);
}
export function __wbg_Error_30c8987f7c2ed4e2(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return ret;
}
export function __wbg___wbindgen_copy_to_typed_array_88899a52af046901(arg0, arg1, arg2) {
    new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
}
export function __wbg___wbindgen_number_get_2e0e7dee9f701a71(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
}
export function __wbg___wbindgen_throw_41e9ee4f547fc59a(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbg_call_187d372bd5fdd4aa() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments); }
export function __wbg_get_6c896e0571ddae51(arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
}
export function __wbg_get_unchecked_288889d017702237(arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
}
export function __wbg_length_b5f0008bbf60cf59(arg0) {
    const ret = arg0.length;
    return ret;
}
export function __wbg_length_d4bdea10311bd9cf(arg0) {
    const ret = arg0.length;
    return ret;
}
export function __wbg_matrix_new(arg0) {
    const ret = Matrix.__wrap(arg0);
    return ret;
}
export function __wbg_new_28744009d011f847() {
    const ret = new Map();
    return ret;
}
export function __wbg_new_617a8cdb8bb1130e() {
    const ret = new Object();
    return ret;
}
export function __wbg_new_c0cfdc72bf7dee4d(arg0) {
    const ret = new Float64Array(arg0);
    return ret;
}
export function __wbg_new_from_slice_f545fd22ddc142b8(arg0, arg1) {
    const ret = new Float64Array(getArrayF64FromWasm0(arg0, arg1));
    return ret;
}
export function __wbg_new_with_length_469fcc27bd71672e(arg0) {
    const ret = new Array(arg0 >>> 0);
    return ret;
}
export function __wbg_prototypesetcall_d49a4fab5ca427bc(arg0, arg1, arg2) {
    Float64Array.prototype.set.call(getArrayF64FromWasm0(arg0, arg1), arg2);
}
export function __wbg_set_145a351398b48c65() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(arg0, arg1, arg2);
    return ret;
}, arguments); }
export function __wbg_set_6ae97e73113c4f0b(arg0, arg1, arg2) {
    const ret = arg0.set(arg1, arg2);
    return ret;
}
export function __wbg_set_bea140a88be9b277(arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
}
export function __wbindgen_generic_0000000000000001(arg0) {
    // Cast intrinsic for `F64 -> Externref`.
    const ret = arg0;
    return ret;
}
export function __wbindgen_generic_0000000000000002(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
}
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
}
const DotProductAndSumPow2ResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dotproductandsumpow2result_free(ptr, 1));
const MatrixFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_matrix_free(ptr, 1));
const VarCovResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_varcovresult_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

let cachedInt32ArrayMemory0 = null;
function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
