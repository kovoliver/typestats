import { getPooledTContext, getZCritical } from "../utils/testAndEstimationUtils";
import { getTCritical } from "../utils/testAndEstimationUtils";
import { mean, std } from "../statistics/univariate";

/**
 * Determines whether the calculated test statistic falls within the acceptance region.
 *
 * @param criticalVal - The calculated critical value threshold (Z or T value).
 * @param value - The calculated test statistic from the sample data (z or t value).
 * @param testDirection - The direction of the hypothesis test ('left', 'right', or 'two-sided').
 * @returns `true` if the test statistic falls within the acceptance region (fail to reject H0), `false` if it falls in the critical region (reject H0).
 * @throws {Error} Throws an error if an invalid test direction is provided.
 */
export function getPassed(
    criticalVal: number,
    value: number,
    testDirection: 'left' | 'right' | 'two-sided'
): boolean {
    switch (testDirection) {
        case 'left':
            return value >= criticalVal;
        case 'right':
            return value <= criticalVal;
        case 'two-sided':
            return Math.abs(value) <= criticalVal;
        default:
            throw new Error(`Invalid test direction: ${testDirection}`);
    }
}

/**
 * Performs a one-sample Z-test on continuous data when the population standard deviation is known.
 *
 * @param sample - Array of numerical sample observations. Must contain at least 1 element.
 * @param sigma - The known population standard deviation. Must be strictly greater than 0.
 * @param alpha - Significance level (e.g., 0.05 for 5%). Must be between 0 and 1.
 * @param mu - The hypothesized population mean under the null hypothesis (H0).
 * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
 * @returns An object containing:
 *   - `z`: The calculated Z-test statistic.
 *   - `Z`: The critical Z-value boundary for the given alpha and direction.
 *   - `passed`: `true` if H0 is retained (accepted), `false` if H0 is rejected.
 * @throws {Error} Throws an error if the sample is empty or if sigma is less than or equal to 0.
 */
export function oneSampleZTest(
    sample: number[],
    sigma: number,
    alpha: number,
    mu: number,
    testDirection: 'left' | 'right' | 'two-sided'
) {
    if (sample.length === 0) {
        throw new Error('Sample must contain at least one value.');
    }

    if (sigma <= 0) {
        throw new Error('Standard deviation must be strictly positive.');
    }

    const avg = mean(sample);
    const z = (avg - mu) / (sigma / Math.sqrt(sample.length));
    const Z = getZCritical(alpha, testDirection);
    let passed = getPassed(Z, z, testDirection);

    return {
        z, Z, passed
    }
}

/**
 * Performs a one-sample Student's t-test when the population standard deviation is unknown.
 *
 * @param sample - Array of numerical sample observations. Must contain at least 2 elements.
 * @param alpha - Significance level (e.g., 0.05 for 5%). Must be between 0 and 1.
 * @param mu - The hypothesized population mean under the null hypothesis (H0).
 * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
 * @returns An object containing:
 *   - `t`: The calculated t-test statistic.
 *   - `T`: The critical t-value boundary for df = n - 1.
 *   - `passed`: `true` if H0 is retained (accepted), `false` if H0 is rejected.
 * @throws {Error} Throws an error if the sample size is less than 2 or if the sample standard deviation is zero.
 */
export function oneSampleTTest(
    sample: number[],
    alpha: number,
    mu: number,
    testDirection: 'left' | 'right' | 'two-sided'
) {
    if (sample.length < 2) {
        throw new Error('Sample must contain at least two values for a t-test.');
    }

    const s = std(sample, true);

    if (s === 0) {
        throw new Error('Sample standard deviation cannot be zero (all values in sample are identical).');
    }

    const df = sample.length - 1;
    const avg = mean(sample);
    const t = (avg - mu) / (s / Math.sqrt(sample.length));
    const T = getTCritical(alpha, df, testDirection);
    let passed = getPassed(T, t, testDirection);

    return {
        t, T, passed
    }
}

/**
 * Performs a two-sample independent Student's t-test assuming equal variances (pooled variance approach).
 *
 * @param sample1 - Array of numerical observations for the first independent group (min. 2 elements).
 * @param sample2 - Array of numerical observations for the second independent group (min. 2 elements).
 * @param alpha - Significance level (e.g., 0.05 for 5%). Must be between 0 and 1.
 * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
 * @returns An object containing:
 *   - `t`: The calculated two-sample t-test statistic.
 *   - `T`: The critical t-value boundary for df = n1 + n2 - 2.
 *   - `passed`: `true` if H0 is retained (accepted), `false` if H0 is rejected.
 * @throws {Error} Throws an error if samples have fewer than 2 items or if the pooled standard deviation is zero.
 */
export function twoSampleIndependentTTest(
    sample1: number[],
    sample2: number[],
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided'
) {
    const { df, meanDiff, pooledStd, standardError } = getPooledTContext(sample1, sample2);

    if (pooledStd === 0) {
        throw new Error('Pooled standard deviation cannot be zero.');
    }

    const t = meanDiff / standardError;
    const T = getTCritical(alpha, df, testDirection);
    const passed = getPassed(T, t, testDirection);

    return { T, t, passed };
}