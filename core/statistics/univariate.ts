import type { PercentMode } from "../types/types.js";
import { neumaierSum, orderAsc, round } from "../utils/numberUtils.js";
import { hasEmptyValues } from "../utils/utils.js";
import {
    mean as wasmMean,
    ssd as wasmSSD,
    quickselect as wasmQuickSelect,
    centralMoment2 as wasmCentralMoment2,
    centralMoment3 as wasmCentralMoment3,
    centralMoment4 as wasmCentralMoment4,
    mode as wasmMode,
    percentile as wasmPercentile
} from '../wasm.js';

/**
 * Validates an array of numerical values to ensure it is non-empty and meets minimum length requirements.
 *
 * @param values - Array of numerical values to validate.
 * @param [isSample=false] - Whether the calculation requires sample statistics (requires at least 2 values).
 * @throws {Error} If the array is empty/null, or if sample validation fails (fewer than 2 values).
 * @throws {Error} If the array contains empty (null|undefined|NaN) values.
 */
function validateValues(values: Float64Array, isSample: boolean = true): void {
    if (!values || values.length === 0) {
        throw new Error('You should give at least one number!');
    }

    if (isSample && values.length < 2) {
        throw new Error('Sample statistics require at least two numbers!');
    }

    if (hasEmptyValues(values)) {
        throw new Error(
            'The given dataset contains empty or invalid values (null, undefined, NaN, or empty strings). ' +
            'Please impute or filter missing values before performing statistical calculations.'
        );
    }
}

/**
 * Calculates the degrees of freedom for a dataset.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether the dataset represents a sample (N - 1) or a population (N).
 * @returns The degrees of freedom.
 */
export function getDegreesOfFreedom(values: ArrayLike<number>, isSample: boolean = true): number {
    return !isSample ? values.length : values.length - 1;
}

/**
 * Calculates the arithmetic mean (average) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The arithmetic mean.
 * @throws {Error} If `values` is empty.
 */
export function mean(values: Float64Array, digits?: number): number {
    if (!values || values.length === 0) {
        throw new Error('You should give at least one number!');
    }

    if (hasEmptyValues(values)) {
        throw new Error(
            'The given dataset contains empty or invalid values (null, undefined, NaN, or empty strings). ' +
            'Please impute or filter missing values before performing statistical calculations.'
        );
    }

    return round(wasmMean(values), digits);
}

/**
 * Calculates the geometric mean of an array of strictly positive numbers.
 *
 * @param values - Array of strictly positive numerical values.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The geometric mean.
 * @throws {Error} If `values` is empty or contains non-positive numbers (<= 0).
 */
export function geometricMean(values: Float64Array, digits?: number): number {
    validateValues(values);
    if (values.some(v => v <= 0)) {
        throw new Error('Geometric mean requires strictly positive numbers!');
    }

    const logSum = values.reduce((total, value) => total + Math.log(value), 0);
    const geoMean = Math.exp(logSum / values.length);
    return round(geoMean, digits);
}

/**
 * Calculates the weighted arithmetic mean of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param weights - Array of weights corresponding to each value.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The weighted arithmetic mean.
 * @throws {Error} If array lengths do not match, `values` is empty, or the sum of weights is zero.
 */
export function weightedMean(values: Float64Array, weights: Float64Array, digits?: number): number {
    validateValues(values);

    if (weights.length !== values.length) {
        throw new Error('The number of weights should be the same as the number of values!');
    }

    const weightedSum = values.reduce((total, value, index) => total + (value * weights[index]), 0);
    const weightsSum = weights.reduce((total, value) => total + value, 0);

    if (weightsSum === 0) {
        throw new Error('The sum of weights cannot be zero!');
    }

    return round(weightedSum / weightsSum, digits);
}

/**
 * Calculates the weighted harmonic mean of an array of positive numbers.
 *
 * @param values - Array of strictly positive numerical values.
 * @param weights - Array of strictly positive weights corresponding to each value.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The weighted harmonic mean.
 * @throws {Error} If array lengths do not match, `values` is empty, or any value/weight is non-positive.
 */
export function harmonicMean(values: Float64Array, weights: Float64Array, digits?: number): number {
    validateValues(values);
    if (weights.length !== values.length) {
        throw new Error('The number of weights should be the same as the number of values!');
    }

    if (values.some(v => v <= 0)) {
        throw new Error('Harmonic mean requires strictly positive values!');
    }

    if (weights.some(w => w <= 0)) {
        throw new Error('Harmonic mean requires strictly positive weights!');
    }

    const weightsSum = weights.reduce((total, w) => total + w, 0);
    const weightedReciprocalSum = values.reduce(
        (total, value, index) => total + (weights[index] / value),
        0
    );

    return round(weightsSum / weightedReciprocalSum, digits);
}

/**
 * Calculates the sum of squared deviations (SSD) from the mean.
 *
 * @param values - Array of numerical values.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The sum of squared deviations.
 * @throws {Error} If `values` is empty.
 */
export function ssd(values: Float64Array, digits?: number) {
    const ss = wasmSSD(values);
    return round(ss, digits);
}

/**
 * Calculates the variance of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to calculate sample variance (N - 1) or population variance (N).
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The dataset's variance.
 * @throws {Error} If `values` is empty or invalid for sample statistics.
 */
export function variance(values: Float64Array, isSample: boolean = true, digits?: number): number {
    validateValues(values, isSample);
    const sumSq = wasmSSD(values);
    const length = getDegreesOfFreedom(values, isSample);
    return round(sumSq / length, digits);
}

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to calculate sample standard deviation (N - 1) or population standard deviation (N).
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The standard deviation.
 * @throws {Error} If `values` is empty or invalid for sample statistics.
 */
export function std(values: Float64Array, isSample: boolean = true, digits?: number): number {
    validateValues(values, isSample);
    const v = variance(values, isSample);
    return round(Math.sqrt(v), digits);
}

function quickselect(arr: Float64Array, k: number, left = 0, right = arr.length - 1): number {
    return wasmQuickSelect(arr, k, left, right);
}

/**
 * Calculates a specified percentile value from an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param percent - Percentile value to calculate as a decimal between 0 and 1 (e.g., 0.5 for 50th percentile).
 * @param [mode='interpolated'] - The strategy used for percentile calculation ('midpoint', 'lower', 'higher', 'nearest', 'interpolated').
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The calculated percentile value.
 * @throws {Error} If `values` is empty or `percent` is out of bounds [0, 1].
 */
export function percentile(
    values: Float64Array,
    percent: number,
    mode: PercentMode = 'interpolated',
    digits?: number,
    isSorted: boolean = false
): number {
    validateValues(values);

    if (percent < 0 || percent > 1) {
        throw new Error('The given percentage should be between 0 and 1!');
    }

    const result = wasmPercentile(values, percent, mode, isSorted);

    return round(result, digits);
}

/**
 * Calculates the median (50th percentile) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The median value.
 */
export function median(
    values: Float64Array,
    mode: PercentMode = 'interpolated',
    digits?: number,
    isSorted: boolean = false
): number {
    return percentile(values, 0.5, mode, digits, isSorted);
}

/**
 * Calculates the first quartile (Q1 / 25th percentile) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The first quartile value.
 */
export function q1(
    values: Float64Array,
    mode: PercentMode = 'interpolated',
    digits?: number,
    isSorted: boolean = false
): number {
    return percentile(values, 0.25, mode, digits, isSorted);
}

/**
 * Calculates the second quartile (Q2 / 50th percentile / median) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The second quartile (median) value.
 */
export function q2(
    values: Float64Array,
    mode: PercentMode = 'interpolated',
    digits?: number,
    isSorted: boolean = false
): number {
    return median(values, mode, digits, isSorted);
}

/**
 * Calculates the third quartile (Q3 / 75th percentile) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The third quartile value.
 */
export function q3(
    values: Float64Array,
    mode: PercentMode = 'interpolated',
    digits?: number,
    isSorted: boolean = false
): number {
    return percentile(values, 0.75, mode, digits, isSorted);
}

/**
 * Calculates the fourth quartile (Q4 / 100th percentile / maximum) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The maximum percentile value.
 */
export function q4(values: Float64Array, mode: PercentMode = 'interpolated', digits?: number): number {
    return percentile(values, 1, mode, digits);
}

/**
 * Calculates the mode(s) (most frequently occurring value(s)) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [digits=-1] - Number of decimal places to round the resulting mode values (-1 disables rounding).
 * @returns An array containing the mode value(s). Returns an empty array if all elements appear with equal frequency.
 * @throws {Error} If `values` is empty.
 */
export function mode(values: Float64Array): Float64Array {
    validateValues(values);
    return wasmMode(values);
}

/**
 * Calculates quantile-based skewness using custom lower and upper percentile points.
 *
 * @param values - Array of numerical values.
 * @param pLower - Lower percentile decimal value (e.g., 0.25).
 * @param pUpper - Upper percentile decimal value (e.g., 0.75).
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The quantile skewness coefficient.
 * @throws {Error} If the denominator evaluates to zero.
 */
function quantileSkewness(
    values: Float64Array,
    pLower: number,
    pUpper: number,
    mode: PercentMode = 'interpolated',
    digits?: number
): number {
    const medianVal = percentile(values, 0.5, mode);
    const firstPart = percentile(values, pUpper, mode) - medianVal;
    const secondPart = medianVal - percentile(values, pLower, mode);

    const numerator = firstPart - secondPart;
    const denominator = firstPart + secondPart;

    if (denominator === 0) {
        throw new Error(`Cannot calculate skewness for percentiles ${pLower} and ${pUpper}: denominator evaluated to zero.`);
    }

    return round(numerator / denominator, digits);
}

/**
 * Calculates Pearson's Median Skewness coefficient for an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to use sample standard deviation.
 * @param [mode='interpolated'] - The percentile calculation strategy used for the median.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Pearson median skewness coefficient.
 * @throws {Error} If standard deviation is zero.
 */
export function pearsonMeSkewness(
    values: Float64Array,
    isSample: boolean = true,
    mode: PercentMode = 'interpolated',
    digits?: number
): number {
    validateValues(values, isSample);
    const s = std(values, isSample);
    if (s === 0) {
        throw new Error('Cannot calculate skewness for constant or zero-variance dataset.');
    }

    const result = 3 * (mean(values) - percentile(values, 0.5, mode)) / s;
    return round(result, digits);
}

/**
 * Calculates Bowley's Skewness (Quartile Skewness) based on Q1, median, and Q3.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Bowley skewness coefficient.
 * @throws {Error} If `values` is empty or calculation results in a zero denominator.
 */
export function bowleySkewness(values: Float64Array, mode: PercentMode = 'interpolated', digits?: number): number {
    validateValues(values);
    return quantileSkewness(values, 0.25, 0.75, mode, digits);
}

/**
 * Calculates Kelly's Skewness (Percentile Skewness) based on the 10th, 50th, and 90th percentiles.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The Kelly skewness coefficient.
 * @throws {Error} If `values` is empty or calculation results in a zero denominator.
 */
export function kellySkewness(values: Float64Array, mode: PercentMode = 'interpolated', digits?: number): number {
    validateValues(values);
    return quantileSkewness(values, 0.1, 0.9, mode, digits);
}

export function centralMoment2(values: Float64Array): number {
    return wasmCentralMoment2(values);
}

export function centralMoment3(values: Float64Array): number {
    return wasmCentralMoment3(values);
}

export function centralMoment4(values: Float64Array): number {
    return wasmCentralMoment4(values);
}

export const naiveCentralDeviationsSum = (values: Float64Array, k: number) => {
    const avg = mean(values);
    return values.reduce((total, val) => total + Math.pow(val - avg, k), 0);
};

/**
 * Calculates the k-th central moment of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param k - The order of the central moment to compute (e.g., 2 for variance numerator, 3 for skewness numerator).
 * @param [isSample=false] - Whether to calculate sample central moment (N - 1) or population central moment (N).
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The k-th central moment value.
 * @throws {Error} If `values` is empty or invalid for sample statistics.
 * @see {@link https://www.osti.gov/servlets/purl/1426900 | Formulas for the Computation of Higher-Order Central Moments }
 */
export function centralMoment(
    values: Float64Array,
    k: number,
    digits?: number
): number {
    switch (k) {
        case 2:
            return round(centralMoment2(values), digits);
        case 3:
            return round(centralMoment3(values), digits);
        case 4:
            return round(centralMoment4(values), digits);
        default:
            throw new Error("Only the 2nd, 3rd, and 4th central moments are allowed!");
    }
}

/**
 * Calculates the sample skewness (G1) of a dataset using the Terribery algorithm for M3 
 * and applies the SPSS/SAS Type 2 bias correction.
 *
 * @see {@link https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm | NIST Measures of Skewness and Kurtosis }
 * 
 * @param values - Array of numerical values.
 * @param isSample - If true (default), returns the unbiased Type 2 sample skewness (G1). 
 *                   If false, returns the population skewness (g1).
 * @param digits - Optional number of decimal places to round the result.
 * @returns The calculated skewness value.
 * @throws {Error} If the dataset has fewer than 3 values (for sample mode) or zero variance.
 */
export function skewness(
    values: Float64Array,
    isSample: boolean = true,
    digits?: number
): number {
    validateValues(values, isSample);
    const N = values.length;

    const s = std(values, isSample);

    if (s === 0) {
        throw new Error('Cannot calculate skewness for constant or zero-variance dataset.');
    }

    const M3 = centralMoment3(values);
    const sk = M3 / Math.pow(s, 3);

    if (!isSample) {
        return round(sk, digits);
    }

    if (N < 3) {
        throw new Error("Sample skewness requires at least 3 values.");
    }

    const bias = N / ((N - 1) * (N - 2));
    return round(sk * bias, digits);
}

/**
 * Calculates the sample excess kurtosis (G2) of a dataset using the Terribery algorithm for M4 
 * and applies the SPSS/SAS Type 2 bias correction.
 * 
 * Excess kurtosis is zero for a normal distribution.
 *
 * @see @see {@link https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm | NIST Measures of Skewness and Kurtosis }
 * 
 * @param values - Array of numerical values.
 * @param isSample - If true (default), returns the unbiased Type 2 sample excess kurtosis (G2). 
 *                   If false, returns the population excess kurtosis (g2).
 * @param digits - Optional number of decimal places to round the result.
 * @returns The calculated excess kurtosis value.
 * @throws {Error} If the dataset has fewer than 4 values (for sample mode) or zero variance.
 */
export function excessKurtosis(
    values: Float64Array,
    isSample: boolean = true,
    digits?: number
): number {
    validateValues(values, isSample);
    const n = values.length;

    const s = std(values, isSample);

    if (s === 0) {
        throw new Error('Cannot calculate excess kurtosis for constant or zero-variance dataset.');
    }

    if (!isSample) {
        const m4 = centralMoment4(values);
        return round(m4 / Math.pow(s, 4) - 3, digits);
    }

    if (n < 4) {
        throw new Error("Sample excess kurtosis requires at least 4 values.");
    }

    const M4 = centralMoment4(values);
    const sumZ4 = M4 / Math.pow(s, 4);
    const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term2 = (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    const K = term1 * sumZ4 - term2;

    return round(K, digits);
}

/**
 * Calculates the statistical range (difference between maximum and minimum values) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The range value.
 * @throws {Error} If `values` is empty.
 */
export function range(values: Float64Array, digits?: number): number {
    validateValues(values);
    const sortedVals = orderAsc(values);
    const difference = sortedVals[sortedVals.length - 1] - sortedVals[0];
    return round(difference, digits);
}

/**
 * Calculates the Interquartile Range (IQR, difference between Q3 and Q1) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The interquartile range.
 * @throws {Error} If `values` is empty.
 */
export function iqr(values: Float64Array, mode: PercentMode = 'interpolated', digits?: number): number {
    validateValues(values);
    const result = percentile(values, 0.75, mode) - percentile(values, 0.25, mode);
    return round(result, digits);
}

/**
 * Calculates the Relative Standard Deviation (RSD / Coefficient of Variation).
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to use sample standard deviation.
 * @param [digits] - Number of decimal places to round the result to. If omitted, the result is returned without rounding.
 * @returns The relative standard deviation (standard deviation divided by mean).
 * @throws {Error} If the mean of `values` is zero.
 */
export function rsd(values: Float64Array, isSample: boolean = true, digits?: number): number {
    validateValues(values, isSample);
    const m = mean(values);

    if (m === 0) {
        throw new Error('Cannot calculate relative standard deviation with the mean of zero!');
    }

    return round(std(values, isSample) / m, digits);
}

/**
 * Calculates the Mean Squared Error (MSE) using Neumaier summation for numerical stability.
 * 
 * @param yActual - The actual observed values.
 * @param yPredicted - The model's predicted values (yHat).
 * @param degreesOfFreedom - The number of estimated parameters in the model (k). 
 *                           Defaults to 0 (population divisor: n). 
 *                           If k > 0, calculates using an unbiased divisor: n - k.
 */
export function mse(
    yActual: ArrayLike<number>,
    yPredicted: ArrayLike<number>,
    degreesOfFreedom: number = 0
): number {
    const n = yActual.length;

    if (n === 0) {
        return NaN;
    }

    if (n !== yPredicted.length) {
        throw new Error('The number of actual values must match the number of predicted values.');
    }

    const divisor = n - degreesOfFreedom;

    if (divisor <= 0) {
        throw new RangeError(
            `Degrees of freedom corrected divisor (${divisor}) cannot be zero or negative.`
        );
    }

    let sum = 0;
    let c = 0;

    for (let i = 0; i < n; i++) {
        const diff = yActual[i] - yPredicted[i];
        const sqError = diff * diff;

        const t = sum + sqError;
        if (Math.abs(sum) >= Math.abs(sqError)) {
            c += (sum - t) + sqError;
        } else {
            c += (sqError - t) + sum;
        }
        sum = t;
    }

    return (sum + c) / divisor;
}