import chisquareQuantile  from "../distributions/chiSquareDist.js";
import fQuantile from "../distributions/fDist.js";
import normalQuantile from "../distributions/normalDist.js";
import tQuantile from "../distributions/studentDist.js";
import { mean, variance } from "../statistics/univariate.js";

export function getCriticalTailParameters(
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided' = 'two-sided'
) {
    const effectiveAlpha = testDirection === 'two-sided' ? alpha / 2 : alpha;
    const multiplier = testDirection === 'left' ? -1 : 1;

    return {
        effectiveAlpha,
        multiplier
    };
}

export function getPooledStd(
    n1: number,
    var1: number,
    n2: number,
    var2: number
): number {
    if (n1 < 1 || n2 < 1 || (n1 + n2) <= 2) {
        throw new Error('Total sample size (n1 + n2) must be greater than 2 to calculate pooled variance.');
    }

    if (var1 < 0 || var2 < 0) {
        throw new Error('Variance cannot be negative.');
    }

    const df = n1 + n2 - 2;
    return Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / df);
}

export function getPooledTContext(sample1: number[], sample2: number[]) {
    if (sample1.length < 2 || sample2.length < 2) {
        throw new Error('Both samples must contain at least 2 elements.');
    }

    const n1 = sample1.length;
    const n2 = sample2.length;
    const df = n1 + n2 - 2;

    const mean1 = mean(sample1);
    const mean2 = mean(sample2);
    const meanDiff = mean1 - mean2;

    const var1 = variance(sample1, true);
    const var2 = variance(sample2, true);

    const pooledStd = getPooledStd(n1, var1, n2, var2);
    const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2);

    return {
        n1,
        n2,
        df,
        meanDiff,
        pooledStd,
        standardError
    };
}

/**
 * Calculates the two-tailed critical Z-value for a given significance level alpha
 * using the standard normal distribution (Z-distribution).
 *
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level). Must be strictly between 0 and 1.
 * @returns The critical Z-value (e.g., ~1.96 for alpha = 0.05).
 */
export function getZCritical(
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided' = 'two-sided'
): number {
    if (alpha <= 0 || alpha >= 1) {
        throw new Error("Significance level (alpha) must be strictly between 0 and 1 (e.g., 0.05).");
    }

    const ctp = getCriticalTailParameters(
        alpha, testDirection
    );

    return normalQuantile(1 - ctp.effectiveAlpha) * ctp.multiplier;
}

/**
 * Calculates the two-tailed critical T-value for a given significance level alpha
 * and degrees of freedom using Student's t-distribution.
 *
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level). Must be strictly between 0 and 1.
 * @param df - Degrees of freedom (n - 1). Must be a positive integer.
 * @returns The critical T-value.
 */
export function getTCritical(
    alpha: number,
    df: number,
    testDirection: 'left' | 'right' | 'two-sided' = 'two-sided'
): number {
    if (alpha <= 0 || alpha >= 1) {
        throw new Error("Significance level (alpha) must be strictly between 0 and 1 (e.g., 0.05).");
    }

    if (df <= 0 || !Number.isFinite(df)) {
        throw new Error("Degrees of freedom (df) must be a positive number.");
    }

    const ctp = getCriticalTailParameters(alpha, testDirection);

    return tQuantile(1 - ctp.effectiveAlpha, df) * ctp.multiplier;
}

/**
 * Calculates the critical boundaries for a Chi-squared distribution based on the test direction.
 *
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {number} df - The degrees of freedom (typically n - 1 for a single sample).
 * @param {'left' | 'right' | 'two-sided'} [testDirection='two-sided'] - The direction of the hypothesis test. 
 *                                                                       Defaults to 'two-sided'.
 * 
 * @returns {{ lower?: number, upper?: number }} An object containing the required critical boundaries:
 *          - For 'two-sided': both `lower` and `upper` are returned.
 *          - For 'left': only `lower` is returned.
 *          - For 'right': only `upper` is returned.
 */
export function getChi2CriticalBounds(
    alpha: number, 
    df: number, 
    testDirection: 'left' | 'right' | 'two-sided' = 'two-sided'
): { lower?: number; upper?: number } {
    if (testDirection === 'two-sided') {
        return {
            lower: chisquareQuantile(alpha / 2, df),
            upper: chisquareQuantile(1 - alpha / 2, df)
        };
    } else if (testDirection === 'left') {
        return {
            lower: chisquareQuantile(alpha, df)
        };
    } else {
        return {
            upper: chisquareQuantile(1 - alpha, df)
        };
    }
}

/**
 * Calculates the critical boundaries for an F-distribution based on the test direction.
 *
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {number} df1 - The degrees of freedom for the numerator.
 * @param {number} df2 - The degrees of freedom for the denominator.
 * @param {'left' | 'right' | 'two-sided'} [testDirection='two-sided'] - The direction of the hypothesis test. Defaults to 'two-sided'.
 * 
 * @returns {{ lower?: number, upper?: number }} An object containing the required critical boundaries.
 */
export function getFCriticalBounds(
    alpha: number, 
    df1: number, 
    df2: number, 
    testDirection: 'left' | 'right' | 'two-sided' = 'two-sided'
): { lower?: number; upper?: number } {
    if (testDirection === 'two-sided') {
        return {
            lower: fQuantile(alpha / 2, df1, df2),
            upper: fQuantile(1 - alpha / 2, df1, df2)
        };
    } else if (testDirection === 'left') {
        return {
            lower: fQuantile(alpha, df1, df2)
        };
    } else {
        return {
            upper: fQuantile(1 - alpha, df1, df2)
        };
    }
}

/**
 * Calculates the Finite Population Correction (FPC) factor for sampling without replacement.
 *
 * @param n - Sample size. Must be a positive integer.
 * @param N - Total population size. Must be greater than or equal to `n`.
 * @returns The FPC scaling multiplier factor: sqrt(1 - n / N).
 * @throws Error if population or sample sizes are invalid or if n > N.
 */
export function FPC(n: number, N: number): number {
    if (N <= 0) {
        throw new Error('The population size cannot be zero or negative.');
    }

    if (n <= 0) {
        throw new Error('The sample size cannot be zero or negative.');
    }

    if (n > N) {
        throw new Error('The sample size cannot be greater than the population size.');
    }

    return Math.sqrt(1 - n / N);
}