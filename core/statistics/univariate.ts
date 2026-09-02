import type {PercentMode} from "../types/types";
import { orderAsc, round } from "../utils/numberUtils";
import { hasEmptyValues } from "../utils/utils";

/**
 * Validates an array of numerical values to ensure it is non-empty and meets minimum length requirements.
 *
 * @param values - Array of numerical values to validate.
 * @param [isSample=false] - Whether the calculation requires sample statistics (requires at least 2 values).
 * @throws {Error} If the array is empty/null, or if sample validation fails (fewer than 2 values).
 * @throws {Error} If the array contains empty (null|undefined|NaN) values.
 */
function validateValues(values: number[], isSample: boolean = true): void {
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
export function getDegreesOfFreedom(values: number[], isSample: boolean = true): number {
    return !isSample ? values.length : values.length - 1;
}

/**
 * Calculates the arithmetic mean (average) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The arithmetic mean.
 * @throws {Error} If `values` is empty.
 */
export function mean(values: number[], digits: number = -1): number {
    if (!values || values.length === 0) {
        throw new Error('You should give at least one number!');
    }

    if (hasEmptyValues(values)) {
        throw new Error(
            'The given dataset contains empty or invalid values (null, undefined, NaN, or empty strings). ' +
            'Please impute or filter missing values before performing statistical calculations.'
        );
    }
    
    const sum = values.reduce((total, value) => total + value, 0);
    return round(sum / values.length, digits);
}

/**
 * Calculates the geometric mean of an array of strictly positive numbers.
 *
 * @param values - Array of strictly positive numerical values.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The geometric mean.
 * @throws {Error} If `values` is empty or contains non-positive numbers (<= 0).
 */
export function geometricMean(values: number[], digits: number = -1): number {
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The weighted arithmetic mean.
 * @throws {Error} If array lengths do not match, `values` is empty, or the sum of weights is zero.
 */
export function weightedMean(values: number[], weights: number[], digits: number = -1): number {
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The weighted harmonic mean.
 * @throws {Error} If array lengths do not match, `values` is empty, or any value/weight is non-positive.
 */
export function harmonicMean(values: number[], weights: number[], digits: number = -1): number {
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The sum of squared deviations.
 * @throws {Error} If `values` is empty.
 */
export function ssd(values: number[], digits: number = -1): number {
    const m = mean(values);
    const sumOfSquares = values.reduce((total, value) => total + Math.pow(value - m, 2), 0);
    return round(sumOfSquares, digits);
}

/**
 * Calculates the variance of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to calculate sample variance (N - 1) or population variance (N).
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The dataset's variance.
 * @throws {Error} If `values` is empty or invalid for sample statistics.
 */
export function variance(values: number[], isSample: boolean = true, digits: number = -1): number {
    validateValues(values, isSample);
    const sumSq = ssd(values);
    const length = getDegreesOfFreedom(values, isSample);
    return round(sumSq / length, digits);
}

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to calculate sample standard deviation (N - 1) or population standard deviation (N).
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The standard deviation.
 * @throws {Error} If `values` is empty or invalid for sample statistics.
 */
export function std(values: number[], isSample: boolean = true, digits: number = -1): number {
    validateValues(values, isSample);
    const v = variance(values, isSample); // nyers variancia
    return round(Math.sqrt(v), digits);
}

/**
 * Calculates a specified percentile value from an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param percent - Percentile value to calculate as a decimal between 0 and 1 (e.g., 0.5 for 50th percentile).
 * @param [mode='interpolated'] - The strategy used for percentile calculation ('midpoint', 'lower', 'higher', 'nearest', 'interpolated').
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The calculated percentile value.
 * @throws {Error} If `values` is empty or `percent` is out of bounds [0, 1].
 */
export function percentile(
    values: number[],
    percent: number,
    mode: PercentMode = 'interpolated',
    digits: number = -1
): number {
    validateValues(values);

    if (percent < 0 || percent > 1) {
        throw new Error('The given percentage should be between 0 and 1!');
    }

    const sortedVals = orderAsc([...values]);

    if (percent === 0) return round(sortedVals[0], digits);
    if (percent === 1) return round(sortedVals[sortedVals.length - 1], digits);

    const index = (sortedVals.length - 1) * percent;
    const intIndex = Math.floor(index);
    const indexDiff = index - intIndex;

    if (indexDiff === 0) {
        return round(sortedVals[intIndex], digits);
    }

    let result: number;
    const interpolVal = (sortedVals[intIndex + 1] - sortedVals[intIndex]) * indexDiff;
    const interpolated = sortedVals[intIndex] + interpolVal;

    switch (mode) {
        case 'midpoint':
            result = (sortedVals[intIndex] + sortedVals[intIndex + 1]) / 2;
            break;
        case 'lower':
            result = sortedVals[intIndex];
            break;
        case 'higher':
            result = sortedVals[intIndex + 1];
            break;
        case 'nearest': {
            const currIndex = indexDiff < 0.5 ? intIndex : intIndex + 1;
            result = sortedVals[currIndex];
            break;
        }
        case 'interpolated':
        default:
            result = interpolated;
            break;
    }

    return round(result, digits);
}

/**
 * Calculates the median (50th percentile) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The median value.
 */
export function median(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    return percentile(values, 0.5, mode, digits);
}

/**
 * Calculates the first quartile (Q1 / 25th percentile) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The first quartile value.
 */
export function q1(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    return percentile(values, 0.25, mode, digits);
}

/**
 * Calculates the second quartile (Q2 / 50th percentile / median) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The second quartile (median) value.
 */
export function q2(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    return median(values, mode, digits);
}

/**
 * Calculates the third quartile (Q3 / 75th percentile) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The third quartile value.
 */
export function q3(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    return percentile(values, 0.75, mode, digits);
}

/**
 * Calculates the fourth quartile (Q4 / 100th percentile / maximum) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The maximum percentile value.
 */
export function q4(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
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
export function mode(values: number[], digits: number = -1): number[] {
    validateValues(values);
    const counts = new Map<number, number>();
    let maxCount = 0;

    for (const val of values) {
        const count = (counts.get(val) || 0) + 1;
        counts.set(val, count);

        if (count > maxCount) {
            maxCount = count;
        }
    }

    if (counts.size > 1 && counts.size * maxCount === values.length) {
        return [];
    }

    const modes: number[] = [];
    for (const [val, count] of counts.entries()) {
        if (count === maxCount) {
            modes.push(round(val, digits));
        }
    }

    return modes;
}

/**
 * Calculates quantile-based skewness using custom lower and upper percentile points.
 *
 * @param values - Array of numerical values.
 * @param pLower - Lower percentile decimal value (e.g., 0.25).
 * @param pUpper - Upper percentile decimal value (e.g., 0.75).
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The quantile skewness coefficient.
 * @throws {Error} If the denominator evaluates to zero.
 */
function quantileSkewness(
    values: number[],
    pLower: number,
    pUpper: number,
    mode: PercentMode = 'interpolated',
    digits: number = -1
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Pearson median skewness coefficient.
 * @throws {Error} If standard deviation is zero.
 */
export function pearsonMeSkewness(
    values: number[],
    isSample: boolean = true,
    mode: PercentMode = 'interpolated',
    digits: number = -1
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
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Bowley skewness coefficient.
 * @throws {Error} If `values` is empty or calculation results in a zero denominator.
 */
export function bowleySkewness(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    validateValues(values);
    return quantileSkewness(values, 0.25, 0.75, mode, digits);
}

/**
 * Calculates Kelly's Skewness (Percentile Skewness) based on the 10th, 50th, and 90th percentiles.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The Kelly skewness coefficient.
 * @throws {Error} If `values` is empty or calculation results in a zero denominator.
 */
export function kellySkewness(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    validateValues(values);
    return quantileSkewness(values, 0.1, 0.9, mode, digits);
}

/**
 * Calculates the k-th central moment of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param k - The order of the central moment to compute (e.g., 2 for variance numerator, 3 for skewness numerator).
 * @param [isSample=false] - Whether to calculate sample central moment (N - 1) or population central moment (N).
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The k-th central moment value.
 * @throws {Error} If `values` is empty or invalid for sample statistics.
 */
export function centralMoment(
    values: number[],
    k: number,
    isSample: boolean = true,
    digits: number = -1
): number {
    validateValues(values, isSample);
    const m = mean(values);
    const length = getDegreesOfFreedom(values, isSample);
    const sum = values.reduce((total, value) => total + Math.pow(value - m, k), 0);
    return round(sum / length, digits);
}

/**
 * Calculates the excess kurtosis of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to use sample calculations for central moment and standard deviation.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The excess kurtosis value.
 * @throws {Error} If standard deviation is zero.
 */
export function excessKurtosis(
    values: number[],
    isSample: boolean = true,
    digits: number = -1
): number {
    validateValues(values, isSample);
    const s = std(values, isSample);

    if (s === 0) {
        throw new Error('Cannot calculate excess kurtosis for constant or zero-variance dataset.');
    }

    const kurtosis = (centralMoment(values, 4, isSample) / Math.pow(s, 4)) - 3;
    return round(kurtosis, digits);
}

/**
 * Calculates the standard skewness coefficient (3rd standardized moment) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to use sample statistics.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The skewness coefficient.
 * @throws {Error} If standard deviation is zero.
 */
export function skewness(values: number[], isSample: boolean = true, digits: number = -1): number {
    validateValues(values, isSample);
    const s = std(values, isSample);

    if (s === 0) {
        throw new Error('Cannot calculate skewness for constant or zero-variance dataset.');
    }

    return round(centralMoment(values, 3, isSample) / Math.pow(s, 3), digits);
}

/**
 * Calculates the statistical range (difference between maximum and minimum values) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The range value.
 * @throws {Error} If `values` is empty.
 */
export function range(values: number[], digits: number = -1): number {
    validateValues(values);
    const sortedVals = orderAsc([...values]);
    const difference = sortedVals[sortedVals.length - 1] - sortedVals[0];
    return round(difference, digits);
}

/**
 * Calculates the Interquartile Range (IQR, difference between Q3 and Q1) of an array of numbers.
 *
 * @param values - Array of numerical values.
 * @param [mode='interpolated'] - The percentile calculation strategy to use.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The interquartile range.
 * @throws {Error} If `values` is empty.
 */
export function iqr(values: number[], mode: PercentMode = 'interpolated', digits: number = -1): number {
    validateValues(values);
    const result = percentile(values, 0.75, mode) - percentile(values, 0.25, mode);
    return round(result, digits);
}

/**
 * Calculates the Relative Standard Deviation (RSD / Coefficient of Variation).
 *
 * @param values - Array of numerical values.
 * @param [isSample=false] - Whether to use sample standard deviation.
 * @param [digits=-1] - Number of decimal places to round the result to (-1 disables rounding).
 * @returns The relative standard deviation (standard deviation divided by mean).
 * @throws {Error} If the mean of `values` is zero.
 */
export function rsd(values: number[], isSample: boolean = true, digits: number = -1): number {
    validateValues(values, isSample);
    const m = mean(values);

    if (m === 0) {
        throw new Error('Cannot calculate relative standard deviation with the mean of zero!');
    }

    return round(std(values, isSample) / m, digits);
}

/**
 * Calculates the Mean Squared Error (MSE) between actual values and predicted values.
 *
 * @param yValues - Array of ground truth / actual numerical values.
 * @param yHatValues - Array of predicted numerical values.
 * @returns The mean squared error.
 * @throws {Error} If actual and predicted arrays do not have equal lengths.
 */
export function mse(yValues: number[], yHatValues: number[]): number {
    if(yValues.length !== yHatValues.length) {
        throw new Error(
            'The number of actual values must match the number of predicted values.'
        );
    }

    return yValues.reduce(
        (total, value, i) => total + Math.pow(value - yHatValues[i], 2),
        0
    ) / yValues.length;
}