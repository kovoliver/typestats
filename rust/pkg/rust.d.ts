/* tslint:disable */
/* eslint-disable */

export class DotProductAndSumPow2Result {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    x2_sum: number;
    xy_sum: number;
}

export enum ImputeMode {
    Impute = 0,
    Replace = 1,
}

export class LogYResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly ln_y: Float64Array;
    readonly lnxy_sum: number;
    readonly lny_sum: number;
}

export class Matrix {
    free(): void;
    [Symbol.dispose](): void;
    static createIdentityMatrix(rows: number, cols?: number | null): Matrix;
    static fromColumns(columns: Float64Array[]): Matrix;
    getElement(row: number, col: number): number | undefined;
    isSquare(): boolean;
    isSymmetric(): boolean;
    multiplyCentered(matrix: Matrix): Matrix;
    multiply(matrix: Matrix): Matrix;
    constructor(values: Float64Array, rows: number, cols: number);
    solve(matrix: Matrix): Matrix;
    readonly cols: number;
    readonly inverted: Matrix;
    readonly rows: number;
    readonly transposed: Matrix;
    readonly values: Float64Array;
}

export class MultiRegression {
    free(): void;
    [Symbol.dispose](): void;
    calculateRSD(regression_type?: string | null): number;
    calculateRegression(regression_type?: string | null): Matrix;
    constructor(independents: Float64Array[], dependent: Float64Array);
}

export class VarCovResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cov: number;
    x_var: number;
}

export function betweenSSD(table: Array<any>): number;

export function calculateMSE(y_actual: Float64Array, x: Float64Array, model: string, coefficients: Float64Array, degrees_of_freedom: number): number;

export function centralMoment2(values: Float64Array): number;

export function centralMoment3(values: Float64Array): number;

export function centralMoment4(values: Float64Array): number;

export function chiSquare(table: Array<any>): number;

export function describeStats(values: Float64Array, label?: string | null): any;

export function flattenArray(table: Array<any>): Float64Array;

export function getLogYandLogXYsum(values: Float64Array): LogYResult;

export function getLogarithmicSums(x: Float64Array, y: Float64Array): Float64Array;

export function getMax(values: Float64Array): number;

export function getMin(values: Float64Array): number;

export function getPolynomialSums(x: Float64Array, y: Float64Array, degree: number): Float64Array;

export function getRanks(values: Float64Array): Map<any, any>;

export function getYandXYsum(values: Float64Array): Float64Array;

export function interpolation(values: Float64Array, mode: string, min?: number | null, max?: number | null, ordered_indices?: Uint32Array | null): void;

export function locf(values: Float64Array, mode: string, min?: number | null, max?: number | null, ordered_indices?: Uint32Array | null): void;

export function mean(values: Float64Array): number;

export function mode(values: Float64Array): Float64Array;

export function movingAverageImputation(values: Float64Array, mode: string, min: number | null | undefined, max: number | null | undefined, window_size: number, ordered_indices?: Uint32Array | null): void;

export function neumaierDotProductAndSumPow2(x: Float64Array, y: Float64Array): DotProductAndSumPow2Result;

export function neumaierSum(values: Float64Array): number;

export function nocb(values: Float64Array, mode: string, min?: number | null, max?: number | null, ordered_indices?: Uint32Array | null): void;

export function orderAsc(values: Float64Array): void;

export function orderDesc(values: Float64Array): void;

export function percentile(values: Float64Array, percent: number, mode: string, is_sorted: boolean): number;

export function quickSortTable(table: Array<any>, sort_type: string, left_idx: number, right_idx: number): Uint32Array;

export function quickselect(arr: Float64Array, k: number, left: number, right: number): number;

export function scd(x_values: Float64Array, y_values: Float64Array): number;

export function ssd(values: Float64Array): number;

export function varianceAndCovariance(x: Float64Array, y: Float64Array, x_mean: number, y_mean: number): VarCovResult;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_dotproductandsumpow2result_free: (a: number, b: number) => void;
    readonly __wbg_get_dotproductandsumpow2result_x2_sum: (a: number) => number;
    readonly __wbg_get_dotproductandsumpow2result_xy_sum: (a: number) => number;
    readonly __wbg_get_varcovresult_cov: (a: number) => number;
    readonly __wbg_get_varcovresult_x_var: (a: number) => number;
    readonly __wbg_logyresult_free: (a: number, b: number) => void;
    readonly __wbg_matrix_free: (a: number, b: number) => void;
    readonly __wbg_multiregression_free: (a: number, b: number) => void;
    readonly __wbg_set_dotproductandsumpow2result_x2_sum: (a: number, b: number) => void;
    readonly __wbg_set_dotproductandsumpow2result_xy_sum: (a: number, b: number) => void;
    readonly __wbg_set_varcovresult_cov: (a: number, b: number) => void;
    readonly __wbg_set_varcovresult_x_var: (a: number, b: number) => void;
    readonly __wbg_varcovresult_free: (a: number, b: number) => void;
    readonly betweenSSD: (a: any) => [number, number, number];
    readonly calculateMSE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly centralMoment2: (a: number, b: number) => number;
    readonly centralMoment3: (a: number, b: number) => number;
    readonly centralMoment4: (a: number, b: number) => number;
    readonly chiSquare: (a: any) => [number, number, number];
    readonly describeStats: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly flattenArray: (a: any) => [number, number];
    readonly getLogYandLogXYsum: (a: number, b: number) => number;
    readonly getLogarithmicSums: (a: number, b: number, c: number, d: number) => [number, number];
    readonly getMax: (a: number, b: number) => [number, number, number];
    readonly getMin: (a: number, b: number) => [number, number, number];
    readonly getPolynomialSums: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly getRanks: (a: number, b: number) => [number, number, number];
    readonly getYandXYsum: (a: number, b: number) => [number, number];
    readonly interpolation: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number];
    readonly locf: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number];
    readonly logyresult_ln_y: (a: number) => [number, number];
    readonly logyresult_lnxy_sum: (a: number) => number;
    readonly logyresult_lny_sum: (a: number) => number;
    readonly matrix_cols: (a: number) => number;
    readonly matrix_createIdentityMatrix: (a: number, b: number) => [number, number, number];
    readonly matrix_fromColumns: (a: number, b: number) => [number, number, number];
    readonly matrix_getElement: (a: number, b: number, c: number) => [number, number];
    readonly matrix_inverted: (a: number) => [number, number, number];
    readonly matrix_isSquare: (a: number) => number;
    readonly matrix_isSymmetric: (a: number) => number;
    readonly matrix_multiply: (a: number, b: number) => [number, number, number];
    readonly matrix_multiplyCentered: (a: number, b: number) => [number, number, number];
    readonly matrix_new: (a: number, b: number, c: number, d: number) => [number, number, number];
    readonly matrix_rows: (a: number) => number;
    readonly matrix_solve: (a: number, b: number) => [number, number, number];
    readonly matrix_transposed: (a: number) => number;
    readonly matrix_values: (a: number) => any;
    readonly mean: (a: number, b: number) => [number, number, number];
    readonly mode: (a: number, b: number) => [number, number];
    readonly movingAverageImputation: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number];
    readonly multiregression_calculateRSD: (a: number, b: number, c: number) => [number, number, number];
    readonly multiregression_calculateRegression: (a: number, b: number, c: number) => [number, number, number];
    readonly multiregression_new: (a: number, b: number, c: any) => [number, number, number];
    readonly neumaierDotProductAndSumPow2: (a: number, b: number, c: number, d: number) => number;
    readonly neumaierSum: (a: number, b: number) => number;
    readonly nocb: (a: number, b: number, c: any, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => [number, number];
    readonly orderAsc: (a: number, b: number, c: any) => void;
    readonly orderDesc: (a: number, b: number, c: any) => void;
    readonly percentile: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly quickSortTable: (a: any, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly quickselect: (a: number, b: number, c: any, d: number, e: number, f: number) => number;
    readonly scd: (a: number, b: number, c: number, d: number) => number;
    readonly ssd: (a: number, b: number) => [number, number, number];
    readonly varianceAndCovariance: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
