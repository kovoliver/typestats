import { RegressionType } from '../types/types.js';
import {
    neumaierSum as wasmNeumaierSum,
    varianceAndCovariance as wasmVarianceAndCovariance,
    neumaierDotProductAndSumPow2 as wasmNeumaierDotProductAndSumPow2,
    calculateMSE as wasmcalculateMSE
} from '../wasm.js';

export function round(value: number, decimals?: number): number {
    if (decimals === undefined) return value;

    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function orderAsc(values: Float64Array): Float64Array {
    const len = values.length;
    if (len <= 1) return values.slice();
    return values.slice().sort();
}

export function orderDesc(values: Float64Array): Float64Array {
    const len = values.length;
    if (len <= 1) return values.slice();
    const sorted = values.slice().sort();
    return sorted.reverse();
}

export function isInteger(value: number): boolean {
    return round(value, 0) === value;
}

export function rangeSequence(from: number, to: number) {
    return Array.from(
        { length: to - from + 1 },
        (_, i) => from + i
    );
}

/**
 * Clamps a number between a specified minimum and maximum value and rounds it to a given number of decimal places to eliminate floating-point calculation errors.
 * 
 * @param value - The numerical value to clamp.
 * @param min - The lower boundary.
 * @param max - The upper boundary.
 * @param digits - Number of decimal places to round the result to.
 * @returns The clamped and rounded value.
 * @throws {Error} If `digits` is not an integer or is less than 0.
 */
export function clamp(value: number, min: number, max: number, digits: number): number {
    if (!Number.isInteger(digits)) {
        throw new Error('The digits parameter must be a discrete value!');
    }

    if (digits < 0) {
        throw new Error('The digits parameter must be a non-negative integer!');
    }

    return parseFloat(Math.min(Math.max(value, min), max).toFixed(digits));
}

/**
 * Clamps a value between 0 and 1 and rounds it to a given number of decimal places (ideal for Eta-squared, Cramér's V, etc.).
 * 
 * @param value - The numerical value to clamp.
 * @param digits - Number of decimal places to round the result to.
 * @returns The clamped and rounded value between 0 and 1.
 * @throws {Error} If `digits` is invalid.
 */
export function clamp01(value: number, digits: number): number {
    return clamp(value, 0, 1, digits);
}

/**
 * Clamps a value between -1 and 1 and rounds it to a given number of decimal places (ideal for Pearson and Spearman correlations).
 * 
 * @param value - The numerical value to clamp.
 * @param digits - Number of decimal places to round the result to.
 * @returns The clamped and rounded value between -1 and 1.
 * @throws {Error} If `digits` is invalid.
 */
export function clampSymmetric(value: number, digits: number): number {
    return clamp(value, -1, 1, digits);
}

export function lre(computed: number, certified: number): number {
    if (certified === 0) {
        if (computed === 0) return Infinity;
        return -Math.log10(Math.abs(computed));
    }

    const relError = Math.abs(computed - certified) / Math.abs(certified);

    if (relError === 0) return Infinity;
    return Math.min(-Math.log10(relError), 15);
}

export function kahanSum(numbers: Float64Array): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < numbers.length; i++) {
        const y = numbers[i] - c;
        const t = sum + y;
        c = (t - sum) - y;
        sum = t;
    }

    return sum;
}

export function kahanSumDotProduct(x: Float64Array, y: Float64Array): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < x.length; i++) {
        const product = x[i] * y[i];
        const yCorr = product - c;
        const t = sum + yCorr;
        c = (t - sum) - yCorr;
        sum = t;
    }

    return sum;
}

export function kahanSumPow(x: Float64Array, pow: number): number {
    let sum = 0.0;
    let c = 0.0;

    for (let i = 0; i < x.length; i++) {
        const square = Math.pow(x[i], pow);
        const yCorr = square - c;
        const t = sum + yCorr;
        c = (t - sum) - yCorr;
        sum = t;
    }

    return sum;
}

export function neumaierSum(numbers: Float64Array): number {
    const result = wasmNeumaierSum(numbers);
    return result;
}

export function neumaierSumDotProduct(x: Float64Array, y: Float64Array): number {
    return neumaierSumDotProduct(x, y);
}

export function neumaierSumPow(x: Float64Array, pow: number): number {
    return neumaierSumPow(x, pow);
}

export function varianceAndCovariance(
    x: Float64Array, y: Float64Array, xMean: number, yMean: number): { xVar: number; cov: number } {
    const result = wasmVarianceAndCovariance(x, y, xMean, yMean);

    return {
        xVar: result.x_var,
        cov: result.cov
    }
}

export function neumaierDotProductAndSumPow2(x: Float64Array, y: Float64Array)
    : { xySum: number; x2Sum: number } {
    const result = wasmNeumaierDotProductAndSumPow2(x, y);

    return {
        x2Sum: result.x2_sum,
        xySum: result.xy_sum
    }
}

/**
 * Calculates Mean Squared Error (MSE) on-the-fly using Neumaier summation.
 * 
 * @param yActual - Observed values array.
 * @param predict - Callback function returning predicted value (yHat) for index i.
 * @param degreesOfFreedom - Estimated parameter count (k). Defaults to 0.
 */
export function calculateMSE(
    yActual: Float64Array,
    x: Float64Array,
    model: RegressionType,
    coefficients: Float64Array,
    degreesOfFreedom: number = 0
): number {
    const result = wasmcalculateMSE(
        yActual, x, model,
        coefficients, degreesOfFreedom
    );

    return result;
}