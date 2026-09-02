import { getChi2CriticalBounds, getPooledTContext, getZCritical } from "../utils/testAndEstimationUtils.js";
import { getTCritical, getFCriticalBounds } from "../utils/testAndEstimationUtils.js";
import { mean, std, variance } from "../statistics/univariate.js";
import { betweenSSD, totalSSD } from "../statistics/bivariate.js";

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
export function zTest(
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
export function tTest(
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
    const passed = getPassed(T, t, testDirection);

    return {
        t, T, passed
    }
}

/**
 * Performs a one-sample Z-test for a population proportion.
 * 
 * This test determines whether the observed sample proportion differs significantly 
 * from a hypothesized population proportion.
 *
 * @param {number} pPopulation - The hypothesized population proportion under the null hypothesis (p0). 
 *                               Must be strictly between 0 and 1 exclusive (0 < p < 1).
 * @param {number} pSample - The observed relative frequency in the sample (p-hat). 
 *                           Must be between 0 and 1 inclusive (0 <= p <= 1).
 * @param {number} n - The sample size. Must be greater than 0.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test.
 * 
 * @returns {{ z: number, Z: number, passed: boolean }} An object containing:
 *          - `z`: The calculated Z-test statistic.
 *          - `Z`: The critical Z-value based on the alpha level and test direction.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If `pPopulation` is not strictly between 0 and 1.
 * @throws {Error} If `pSample` is not between 0 and 1 inclusive.
 * @throws {Error} If the sample size `n` is less than or equal to 0.
 */
export function zTestProportion(
    pPopulation: number,
    pSample: number,
    n: number,
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided'
): { z: number, Z: number, passed: boolean } {
    if (pPopulation <= 0 || pPopulation >= 1) {
        throw new Error("The hypothetical population proportion must be strictly between 0 and 1.");
    }

    if (pSample < 0 || pSample > 1) {
        throw new Error("The sample's relative frequency must be between 0 and 1 (inclusive).");
    }

    if (n <= 0) {
        throw new Error("The sample size (n) must be greater than 0.");
    }

    const z = (pSample - pPopulation) / Math.sqrt((pPopulation * (1 - pPopulation)) / n);

    const Z = getZCritical(alpha, testDirection);
    const passed = getPassed(Z, z, testDirection);

    return {
        z, Z, passed
    }
}

/**
 * Performs a one-sample Chi-squared test for population variance.
 * 
 * This test determines whether the observed sample variance differs significantly 
 * from a hypothesized population variance.
 *
 * @param {number[]} sample - An array of numerical values representing the sample data.
 * @param {number} hypotheticalVar - The hypothesized population variance under the null hypothesis (sigma^2). 
 *                                   Must be strictly greater than 0.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test.
 * 
 * @returns {{ chi2: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} An object containing:
 *          - `chi2`: The calculated Chi-squared test statistic.
 *          - `criticalBounds`: An object containing the `lower` and/or `upper` critical values based on the test direction.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If `hypotheticalVar` is less than or equal to 0.
 */
export function chi2Test(
    sample: number[],
    hypotheticalVar: number,
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided'
) {
    if (hypotheticalVar <= 0) {
        throw new Error("Hypothetical variance must be strictly greater than 0.");
    }

    const df = sample.length - 1;
    const sampleVar = variance(sample, true);

    const chi2 = (df * sampleVar) / hypotheticalVar;
    const criticalBounds = getChi2CriticalBounds(alpha, df, testDirection);

    let passed = false;
    if (testDirection === 'two-sided') {
        passed = chi2 >= criticalBounds.lower! && chi2 <= criticalBounds.upper!;
    } else if (testDirection === 'left') {
        passed = chi2 >= criticalBounds.lower!;
    } else if (testDirection === 'right') {
        passed = chi2 <= criticalBounds.upper!;
    }

    return {
        chi2,
        criticalBounds,
        passed
    };
}

/**
 * Performs a Chi-squared goodness-of-fit test.
 * 
 * This test determines whether the observed categorical frequencies differ significantly 
 * from the expected frequencies.
 *
 * @param {number[]} observed - An array of observed frequencies for each category. 
 *                              Values must be non-negative.
 * @param {number[]} expected - An array of expected frequencies for each category. 
 *                              Values must be strictly greater than 0.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {number} [numEstimatedParams=0] - The number of parameters estimated from the data 
 *                                          to generate the expected frequencies. Defaults to 0.
 * 
 * @returns {{ chi2: number, df: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
 *          An object containing:
 *          - `chi2`: The calculated Chi-squared test statistic.
 *          - `df`: The degrees of freedom used for the test.
 *          - `criticalBounds`: The critical bounds object (will contain `upper` since it's a right-tailed test).
 *          - `passed`: `true` if the test statistic is less than or equal to the upper critical bound 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If `observed` and `expected` arrays have different lengths.
 * @throws {Error} If the arrays contain less than 2 categories.
 * @throws {Error} If any observed frequency is less than 0.
 * @throws {Error} If any expected frequency is less than or equal to 0.
 * @throws {Error} If the resulting degrees of freedom are less than or equal to 0.
 */
export function chi2FitTest(
    observed: number[],
    expected: number[],
    alpha: number,
    numEstimatedParams: number = 0
) {
    if (observed.length !== expected.length) {
        throw new Error("Observed and expected arrays must have the same length.");
    }

    if (observed.length <= 1) {
        throw new Error("Arrays must contain at least two categories.");
    }

    let chi2 = 0;

    // Calculate the Chi-squared test statistic
    for (let i = 0; i < observed.length; i++) {
        const obs = observed[i];
        const exp = expected[i];

        if (obs < 0) {
            throw new Error("Observed frequencies cannot be negative.");
        }
        if (exp <= 0) {
            throw new Error("Expected frequencies must be strictly greater than 0.");
        }

        chi2 += Math.pow(obs - exp, 2) / exp;
    }

    const df = observed.length - 1 - numEstimatedParams;
    if (df <= 0) {
        throw new Error("Degrees of freedom must be greater than 0. Check your number of categories and estimated parameters.");
    }

    const testDirection = 'right';
    const criticalBounds = getChi2CriticalBounds(alpha, df, testDirection);
    const passed = chi2 <= criticalBounds.upper!;

    return {
        chi2,
        criticalBounds,
        passed
    };
}

/**
 * Performs a Chi-squared test of independence.
 * 
 * This test determines whether two categorical variables are independent 
 * based on observed frequencies in a contingency table.
 *
 * @param {number[][]} contingencyTable - A 2D array representing the observed frequencies. 
 *                                        Must be at least a 2x2 matrix, and values must be non-negative.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * 
 * @returns {{ chi2: number, df: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
 *          An object containing:
 *          - `chi2`: The calculated Chi-squared test statistic.
 *          - `df`: The degrees of freedom used for the test.
 *          - `criticalBounds`: The critical bounds object (will contain `upper` since it's a right-tailed test).
 *          - `passed`: `true` if the test statistic is less than or equal to the upper critical bound 
 *                      (fail to reject the null hypothesis of independence), `false` otherwise.
 * 
 * @throws {Error} If the contingency table has fewer than 2 rows or fewer than 2 columns.
 * @throws {Error} If the rows do not have a uniform number of columns.
 * @throws {Error} If any observed frequency is negative.
 * @throws {Error} If the total sum of the table is 0.
 * @throws {Error} If any calculated expected frequency is less than or equal to 0.
 */
export function chiSquaredIndependenceTest(
    contingencyTable: number[][],
    alpha: number
) {
    const numRows = contingencyTable.length;
    if (numRows < 2) {
        throw new Error("Contingency table must have at least 2 rows.");
    }

    const numCols = contingencyTable[0].length;
    if (numCols < 2) {
        throw new Error("Contingency table must have at least 2 columns.");
    }

    let grandTotal = 0;
    const rowTotals = new Array(numRows).fill(0);
    const colTotals = new Array(numCols).fill(0);

    for (let i = 0; i < numRows; i++) {
        if (contingencyTable[i].length !== numCols) {
            throw new Error("All rows in the contingency table must have the same number of columns.");
        }
        for (let j = 0; j < numCols; j++) {
            const val = contingencyTable[i][j];
            if (val < 0) {
                throw new Error("Observed frequencies cannot be negative.");
            }
            rowTotals[i] += val;
            colTotals[j] += val;
            grandTotal += val;
        }
    }

    if (grandTotal === 0) {
        throw new Error("The contingency table must contain non-zero data.");
    }

    let chi2 = 0;
    for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
            const observed = contingencyTable[i][j];
            const expected = (rowTotals[i] * colTotals[j]) / grandTotal;

            if (expected <= 0) {
                throw new Error("Expected frequencies must be strictly greater than 0. Check your data or consider combining categories.");
            }

            chi2 += Math.pow(observed - expected, 2) / expected;
        }
    }

    const df = (numRows - 1) * (numCols - 1);

    const testDirection = 'right';
    const criticalBounds = getChi2CriticalBounds(alpha, df, testDirection);

    const passed = chi2 <= criticalBounds.upper!;

    return {
        chi2,
        criticalBounds,
        passed
    };
}

/**
 * Performs a two-sample Z-test for the difference between two population means.
 * 
 * This test determines whether there is a significant difference between the means 
 * of two independent populations, assuming the population variances are known.
 *
 * @param {number[]} sample1 - An array of numerical values representing the first sample.
 * @param {number[]} sample2 - An array of numerical values representing the second sample.
 * @param {number} popVar1 - The known population variance of the first population (sigma1^2). Must be strictly greater than 0.
 * @param {number} popVar2 - The known population variance of the second population (sigma2^2). Must be strictly greater than 0.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test.
 * @param {number} [meanDifference=0] - The hypothesized difference between the population means (Delta). Defaults to 0.
 * 
 * @returns {{ z: number, Z: number, passed: boolean }} An object containing:
 *          - `z`: The calculated Z-test statistic.
 *          - `Z`: The critical Z-value based on the alpha level and test direction.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If either sample array is empty.
 * @throws {Error} If either population variance is less than or equal to 0.
 */
export function zTestTwoSamples(
    sample1: number[],
    sample2: number[],
    popVar1: number,
    popVar2: number,
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided',
    meanDifference: number = 0
) {
    if (sample1.length === 0 || sample2.length === 0) {
        throw new Error("Both samples must contain at least one element.");
    }

    if (popVar1 <= 0 || popVar2 <= 0) {
        throw new Error("Population variances must be strictly greater than 0.");
    }

    const mean1 = mean(sample1);
    const mean2 = mean(sample2);

    const standardError = Math.sqrt((popVar1 / sample1.length) + (popVar2 / sample2.length));

    const z = ((mean1 - mean2) - meanDifference) / standardError;
    const Z = getZCritical(alpha, testDirection);

    const passed = getPassed(Z, z, testDirection);

    return {
        z,
        Z,
        passed
    };
}

/**
 * Performs a two-sample t-test for the difference between two population means.
 * 
 * This test determines whether there is a significant difference between the means 
 * of two independent populations, when the population variances are unknown. 
 * Supports both Student's t-test (assuming equal variances) and Welch's t-test 
 * (assuming unequal variances).
 *
 * @param {number[]} sample1 - An array of numerical values representing the first sample.
 * @param {number[]} sample2 - An array of numerical values representing the second sample.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test.
 * @param {boolean} [assumeEqualVariances=false] - If true, performs Student's t-test assuming equal population variances. 
 *                                                 If false, performs Welch's t-test assuming unequal variances. Defaults to false.
 * @param {number} [meanDifference=0] - The hypothesized difference between the population means (Delta). Defaults to 0.
 * 
 * @returns {{ t: number, T: number, df: number, passed: boolean }} An object containing:
 *          - `t`: The calculated t-test statistic.
 *          - `T`: The critical t-value based on the alpha level, degrees of freedom, and test direction.
 *          - `df`: The degrees of freedom used for the test.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If either sample contains fewer than 2 elements.
 * @throws {Error} If the standard error is zero (e.g., both samples have zero variance).
 */
export function tTestTwoSamples(
    sample1: number[],
    sample2: number[],
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided',
    assumeEqualVariances: boolean = false,
    meanDifference: number = 0
) {
    const n1 = sample1.length;
    const n2 = sample2.length;

    if (n1 < 2 || n2 < 2) {
        throw new Error("Both samples must contain at least two elements to calculate sample variance.");
    }

    const mean1 = mean(sample1);
    const mean2 = mean(sample2);
    const var1 = variance(sample1, true);
    const var2 = variance(sample2, true);

    let standardError: number;
    let df: number;

    if (assumeEqualVariances) {
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
        standardError = Math.sqrt(pooledVar * ((1 / n1) + (1 / n2)));
        df = n1 + n2 - 2;
    } else {
        const vn1 = var1 / n1;
        const vn2 = var2 / n2;
        standardError = Math.sqrt(vn1 + vn2);

        df = Math.pow(vn1 + vn2, 2) / ((Math.pow(vn1, 2) / (n1 - 1)) + (Math.pow(vn2, 2) / (n2 - 1)));
    }

    if (standardError === 0) {
        throw new Error("Standard error is zero, cannot calculate t-statistic. Check if both sample variances are 0.");
    }

    const t = ((mean1 - mean2) - meanDifference) / standardError;
    const T = getTCritical(alpha, df, testDirection);
    const passed = getPassed(T, t, testDirection);

    return {
        t,
        T,
        passed
    };
}

/**
 * Performs an asymptotic two-sample Z-test for the difference between two population means.
 * 
 * This test determines whether there is a significant difference between the means 
 * of two independent populations when the population variances are unknown. It relies 
 * on the Central Limit Theorem for large sample sizes, substituting sample variances 
 * for the unknown population variances.
 *
 * @param {number[]} sample1 - An array of numerical values representing the first sample.
 * @param {number[]} sample2 - An array of numerical values representing the second sample.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test.
 * @param {number} [meanDifference=0] - The hypothesized difference between the population means (Delta). Defaults to 0.
 * 
 * @returns {{ z: number, Z: number, passed: boolean }} An object containing:
 *          - `z`: The calculated asymptotic Z-test statistic.
 *          - `Z`: The critical Z-value based on the alpha level and test direction.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If either sample contains fewer than 2 elements (required for sample variance).
 * @throws {Error} If the standard error is zero (e.g., both sample variances are 0).
 */
export function twoSampleAsymptoticZMeanTest(
    sample1: number[],
    sample2: number[],
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided',
    meanDifference: number = 0
) {
    const n1 = sample1.length;
    const n2 = sample2.length;

    if (n1 < 2 || n2 < 2) {
        throw new Error("Both samples must contain at least two elements to calculate sample variance.");
    }

    const mean1 = mean(sample1);
    const mean2 = mean(sample2);
    const var1 = variance(sample1, true);
    const var2 = variance(sample2, true);

    const standardError = Math.sqrt((var1 / n1) + (var2 / n2));

    if (standardError === 0) {
        throw new Error("Standard error is zero, cannot calculate Z-statistic. Check if both sample variances are 0.");
    }

    const z = ((mean1 - mean2) - meanDifference) / standardError;
    const Z = getZCritical(alpha, testDirection);
    const passed = getPassed(Z, z, testDirection);

    return {
        z,
        Z,
        passed
    };
}

/**
 * Performs a two-sample Z-test for the difference between two population proportions.
 * 
 * This test determines whether there is a significant difference between the proportions 
 * of two independent populations. By default, it tests for equality (hypothesized difference = 0) 
 * using a pooled proportion. If a non-zero hypothesized difference is provided, 
 * it uses the unpooled standard error.
 *
 * @param {number} pSample1 - The observed proportion (relative frequency) in the first sample. Must be between 0 and 1 (inclusive).
 * @param {number} n1 - The size of the first sample. Must be greater than 0.
 * @param {number} pSample2 - The observed proportion (relative frequency) in the second sample. Must be between 0 and 1 (inclusive).
 * @param {number} n2 - The size of the second sample. Must be greater than 0.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test.
 * @param {number} [pDifference=0] - The hypothesized difference between the population proportions (p1 - p2). Defaults to 0.
 * 
 * @returns {{ z: number, Z: number, passed: boolean }} An object containing:
 *          - `z`: The calculated Z-test statistic.
 *          - `Z`: The critical Z-value based on the alpha level and test direction.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis), `false` otherwise.
 * 
 * @throws {Error} If either sample proportion is not between 0 and 1 (inclusive).
 * @throws {Error} If either sample size is less than or equal to 0.
 * @throws {Error} If the standard error is zero.
 */
export function zTestProportionTwoSamples(
    pSample1: number,
    n1: number,
    pSample2: number,
    n2: number,
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided',
    pDifference: number = 0
) {
    if (pSample1 < 0 || pSample1 > 1 || pSample2 < 0 || pSample2 > 1) {
        throw new Error("Sample proportions must be between 0 and 1 (inclusive).");
    }

    if (n1 <= 0 || n2 <= 0) {
        throw new Error("Sample sizes must be greater than 0.");
    }

    let standardError: number;

    if (pDifference === 0) {
        const pPool = (pSample1 * n1 + pSample2 * n2) / (n1 + n2);
        standardError = Math.sqrt(pPool * (1 - pPool) * ((1 / n1) + (1 / n2)));
    } else {
        standardError = Math.sqrt((pSample1 * (1 - pSample1)) / n1 + (pSample2 * (1 - pSample2)) / n2);
    }

    if (standardError === 0) {
        throw new Error("Standard error is zero, cannot calculate Z-statistic.");
    }

    const z = ((pSample1 - pSample2) - pDifference) / standardError;
    const Z = getZCritical(alpha, testDirection);
    const passed = getPassed(Z, z, testDirection);

    return {
        z,
        Z,
        passed
    };
}

/**
 * Performs a two-sample F-test for the equality of two population variances.
 * 
 * This test determines whether the variances of two independent populations are significantly different.
 * It assumes that both populations are normally distributed.
 *
 * @param {number[]} sample1 - An array of numerical values representing the first sample.
 * @param {number[]} sample2 - An array of numerical values representing the second sample.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * @param {'left' | 'right' | 'two-sided'} testDirection - The direction of the hypothesis test. 
 *                                                         'left' tests if var1 < var2, 'right' tests if var1 > var2.
 * 
 * @returns {{ F: number, df1: number, df2: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
 *          An object containing:
 *          - `F`: The calculated F-test statistic.
 *          - `df1`: The degrees of freedom for the numerator (first sample).
 *          - `df2`: The degrees of freedom for the denominator (second sample).
 *          - `criticalBounds`: An object containing the `lower` and/or `upper` critical values based on the test direction.
 *          - `passed`: `true` if the test statistic falls within the acceptance region 
 *                      (fail to reject the null hypothesis of equal variances), `false` otherwise.
 * 
 * @throws {Error} If either sample contains fewer than 2 elements.
 * @throws {Error} If the variance of the second sample is zero (leads to division by zero).
 */
export function fTestTwoSamples(
    sample1: number[],
    sample2: number[],
    alpha: number,
    testDirection: 'left' | 'right' | 'two-sided'
) {
    const n1 = sample1.length;
    const n2 = sample2.length;

    if (n1 < 2 || n2 < 2) {
        throw new Error("Both samples must contain at least two elements to calculate sample variances.");
    }

    const var1 = variance(sample1, true);
    const var2 = variance(sample2, true);

    if (var2 === 0) {
        throw new Error("The variance of the second sample is zero, cannot calculate the F-statistic.");
    }

    const F = var1 / var2;
    const df1 = n1 - 1;
    const df2 = n2 - 1;

    const criticalBounds = getFCriticalBounds(alpha, df1, df2, testDirection);

    let passed = false;
    if (testDirection === 'two-sided') {
        passed = F >= criticalBounds.lower! && F <= criticalBounds.upper!;
    } else if (testDirection === 'left') {
        passed = F >= criticalBounds.lower!;
    } else if (testDirection === 'right') {
        passed = F <= criticalBounds.upper!;
    }

    return {
        F,
        criticalBounds,
        passed
    };
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
export function tTestIndependent(
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

/**
 * Performs a One-Way Analysis of Variance (ANOVA).
 * 
 * This test determines whether there are any statistically significant differences 
 * between the means of two or more independent (unrelated) groups.
 *
 * @param {number[][]} groups - An array of arrays, where each inner array represents an independent sample group.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * 
 * @returns {{ F: number, dfBetween: number, dfWithin: number, msBetween: number, msWithin: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
 *          An object containing:
 *          - `F`: The calculated F-test statistic.
 *          - `dfBetween`: The degrees of freedom between groups (numerator).
 *          - `dfWithin`: The degrees of freedom within groups (denominator).
 *          - `msBetween`: The mean square between groups.
 *          - `msWithin`: The mean square within groups.
 *          - `criticalBounds`: The critical bounds object (will contain `upper` since ANOVA is a right-tailed test).
 *          - `passed`: `true` if the test statistic is less than or equal to the upper critical bound 
 *                      (fail to reject the null hypothesis of equal means), `false` otherwise.
 * 
 * @throws {Error} If there are fewer than 2 groups.
 * @throws {Error} If any group is empty.
 * @throws {Error} If the total number of observations is not greater than the number of groups.
 * @throws {Error} If the within-group variance (msWithin) is zero.
 */
export function oneWayAnova(
    groups: number[][],
    alpha: number
) {
    const k = groups.length;

    if (k < 2) {
        throw new Error("At least two groups are required for ANOVA.");
    }

    for (const group of groups) {
        if (group.length === 0) {
            throw new Error("All groups must contain at least one element.");
        }
    }

    const totalN = groups.reduce(
        (sum, group) => sum + group.length,
        0
    );

    const dfBetween = k - 1;
    const dfWithin = totalN - k;

    if (dfWithin <= 0) {
        throw new Error(
            "Not enough data points to calculate within-group variance."
        );
    }

    const table = groups;

    const ssBetween = betweenSSD(table);
    const ssTotal = totalSSD(table);
    const ssWithin = ssTotal - ssBetween;

    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    if (msWithin === 0) {
        throw new Error(
            "Within-group variance is zero, cannot calculate the F-statistic."
        );
    }

    const F = msBetween / msWithin;

    const testDirection = 'right';

    const criticalBounds = getFCriticalBounds(
        alpha,
        dfBetween,
        dfWithin,
        testDirection
    );

    const passed = getPassed(
        criticalBounds.upper!,
        F,
        testDirection
    );

    return {
        F,
        msBetween,
        msWithin,
        criticalBounds,
        passed
    };
}

/**
 * Performs Bartlett's test for homogeneity of variances.
 * 
 * This test determines whether the variances of two or more independent groups are equal.
 * It is sensitive to departures from normality; if the data is not normally distributed,
 * Levene's test might be a better alternative.
 *
 * @param {number[][]} groups - An array of arrays, where each inner array represents an independent sample group.
 * @param {number} alpha - The significance level for the test (e.g., 0.05).
 * 
 * @returns {{ chi2: number, df: number, criticalBounds: { lower?: number, upper?: number }, passed: boolean }} 
 *          An object containing:
 *          - `chi2`: The calculated Bartlett's test statistic (often denoted as K-squared or T).
 *          - `df`: The degrees of freedom used for the test (k - 1).
 *          - `criticalBounds`: The critical bounds object (will contain `upper` since it's a right-tailed test).
 *          - `passed`: `true` if the test statistic is less than or equal to the upper critical bound 
 *                      (fail to reject the null hypothesis of equal variances), `false` otherwise.
 * 
 * @throws {Error} If there are fewer than 2 groups.
 * @throws {Error} If any group contains fewer than 2 elements (cannot calculate sample variance).
 * @throws {Error} If the calculated variance for any group is 0 or negative (logarithm is undefined).
 */
export function bartlett(
    groups: number[][],
    alpha: number
) {
    const k = groups.length;
    if (k < 2) {
        throw new Error("At least two groups are required for Bartlett's test.");
    }

    let totalN = 0;
    let sumOfDfTimesVariance = 0;
    let sumOfInverseDf = 0;
    let sumOfDfTimesLogVariance = 0;

    const groupSizes: number[] = [];
    const groupVariances: number[] = [];

    for (let i = 0; i < k; i++) {
        const group = groups[i];
        const n = group.length;

        if (n < 2) {
            throw new Error("All groups must contain at least two elements to calculate sample variance.");
        }

        totalN += n;
        groupSizes.push(n);

        const groupVar = variance(group, true);

        if (groupVar <= 0) {
            throw new Error("Variance of group is zero or negative. Bartlett's test requires strictly positive variances.");
        }

        groupVariances.push(groupVar);

        const dfGroup = n - 1;
        sumOfDfTimesVariance += dfGroup * groupVar;
        sumOfInverseDf += 1 / dfGroup;
        sumOfDfTimesLogVariance += dfGroup * Math.log(groupVar);
    }

    const totalDf = totalN - k;
    const pooledVariance = sumOfDfTimesVariance / totalDf;
    const numerator = totalDf * Math.log(pooledVariance) - sumOfDfTimesLogVariance;
    const denominator = 1 + (1 / (3 * (k - 1))) * (sumOfInverseDf - (1 / totalDf));
    const chi2 = numerator / denominator;
    const df = k - 1;
    const testDirection = 'right';
    const criticalBounds = getChi2CriticalBounds(alpha, df, testDirection);
    const passed = chi2 <= criticalBounds.upper!;

    return {
        chi2,
        criticalBounds,
        passed
    };
}