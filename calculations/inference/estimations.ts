import { mean, std, variance } from '../statistics/univariate';
import type { ConfidenceInterval, Stratum } from '../../types';
import { FPC, getChi2CriticalBounds, getPooledTContext, getTCritical, getZCritical } from '../utils/testAndEstimationUtils';


/**
 * Calculates the margin of error for a population mean when the population
 * standard deviation (sigma) is KNOWN (uses Standard Normal / Z-distribution).
 *
 * @param values - Array of sample values. Must contain at least 1 item.
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level). Must be strictly between 0 and 1.
 * @param sigma - Known population standard deviation. Must be strictly greater than 0.
 * @returns The margin of error value.
 * @throws Error if values array is empty or parameters are out of valid range.
 */
function meanMarginOfErrorWithSTD(
    values: number[],
    alpha: number,
    sigma: number
): number {
    if (sigma <= 0) {
        throw new Error("Population standard deviation (sigma) must be greater than zero.");
    }

    const n = values.length;
    const Z = getZCritical(alpha);
    const marginOfError = Z * (sigma / Math.sqrt(n));

    return marginOfError;
}

/**
 * Calculates the margin of error for a population mean when the population
 * standard deviation is UNKNOWN (uses Sample Standard Deviation and Student's t-distribution).
 *
 * @param values - Array of sample values. Must contain at least 2 items to compute sample variance.
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level). Must be strictly between 0 and 1.
 * @returns The margin of error value (or 0 if sample standard deviation is 0).
 * @throws Error if sample contains fewer than 2 items or alpha is out of range.
 */
function meanMarginOfErrorWithoutSTD(
    values: number[],
    alpha: number
): number {
    if (values.length < 2) {
        throw new Error("Calculating the Student's t-distribution requires at least 2 sample values.");
    }

    const sampleStd = std(values, true);

    if (sampleStd === 0) {
        return 0;
    }

    const degreesOfFreedom = values.length - 1;
    const T = getTCritical(alpha, degreesOfFreedom);
    const marginOfError = T * (sampleStd / Math.sqrt(values.length));

    return marginOfError;
}

/**
 * Calculates the margin of error for a population proportion using the normal approximation (Wald method).
 *
 * @param p - Estimated sample proportion. Must be a probability between 0 and 1 (inclusive).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level). Must be strictly between 0 and 1.
 * @param n - Sample size. Must be a positive integer.
 * @returns The margin of error value.
 * @throws Error if inputs do not meet domain constraints.
 */
function proportionMarginOfError(
    p: number,
    alpha: number,
    n: number
) {
    if (!Number.isInteger(n) || n < 1) {
        throw new Error("Sample size (n) must be a positive integer.");
    }

    if (p < 0 || p > 1) {
        throw new Error("Sample proportion (p) must be between 0 and 1.");
    }

    const Z = getZCritical(alpha);
    const standardError = Math.sqrt((p * (1 - p)) / n);
    const marginOfError = Z * standardError;

    return marginOfError;
}

/**
 * Internal helper function to compute the asymmetrical lower and upper confidence bounds
 * for population variance based on sample variance, sample size, and significance level.
 *
 * @param sampleVar - Computed sample variance (s^2). Must be non-negative.
 * @param n - Sample size (must be >= 2).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence interval).
 * @returns An object containing the lower and upper confidence bounds for variance.
 * @throws Error if parameters fail statistical validity criteria.
 */
function calculateVarianceCIFromSampleVar(
    sampleVar: number,
    n: number,
    alpha: number
): ConfidenceInterval {
    if (n < 2) {
        throw new Error("Calculating variance confidence interval requires at least 2 sample values.");
    }

    if (sampleVar === 0) {
        return { lower: 0, upper: 0 };
    }

    const df = n - 1;
    const chi2Obj = getChi2CriticalBounds(alpha, df);

    if (chi2Obj.lower <= 0 || chi2Obj.upper <= 0) {
        throw new Error("Chi-square critical values could not be calculated.");
    }

    const numerator = df * sampleVar;

    return {
        lower: numerator / chi2Obj.upper,
        upper: numerator / chi2Obj.lower
    };
}

/**
 * Calculates the confidence interval for the population mean under Independent and Identically
 * Distributed (IID) sampling when the population standard deviation is KNOWN.
 *
 * @param values - Array of sample values.
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @param sigma - Known population standard deviation (> 0).
 * @returns An object containing the lower and upper bounds of the confidence interval.
 */
export function meanEstimationIIDwithSTD(
    values: number[],
    alpha: number,
    sigma: number
): ConfidenceInterval {
    const avg = mean(values);
    const marginOfError = meanMarginOfErrorWithSTD(values, alpha, sigma);

    return {
        lower: avg - marginOfError,
        upper: avg + marginOfError
    };
}

/**
 * Calculates the confidence interval for the population mean when the population
 * standard deviation is UNKNOWN (Student's t-distribution).
 * 
 * @param values - Array of sample values (must contain at least 2 items).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence interval).
 * @returns Object containing the lower and upper bounds of the confidence interval.
 */
export function meanEstimationIIDwithoutSTD(
    values: number[],
    alpha: number
): ConfidenceInterval {
    const avg = mean(values);

    const marginOfError = meanMarginOfErrorWithoutSTD(values, alpha);

    return {
        lower: avg - marginOfError,
        upper: avg + marginOfError
    };
}

/**
 * Calculates the confidence interval for a population proportion under IID sampling
 * using the Wald (normal approximation) method. Lower and upper bounds are clipped to [0, 1].
 *
 * @param p - Sample proportion (between 0 and 1).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @param n - Sample size (positive integer).
 * @returns An object containing the lower and upper bounds clipped to [0, 1].
 */
export function proportionEstimationIID(
    p: number,
    alpha: number,
    n: number
): ConfidenceInterval {
    const marginOfError = proportionMarginOfError(p, alpha, n);

    return {
        lower: Math.max(0, p - marginOfError),
        upper: Math.min(1, p + marginOfError)
    };
}

/**
 * Calculates the confidence interval for a population proportion under Simple Random Sampling (SRS, without replacement)
 * using the Wald method with Finite Population Correction (FPC). Bounds are clipped to [0, 1].
 *
 * @param p - Sample proportion (between 0 and 1).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @param n - Sample size (positive integer).
 * @param N - Total population size (N >= n).
 * @returns An object containing the lower and upper bounds clipped to [0, 1].
 */
export function proportionEstimationSRS(
    p: number,
    alpha: number,
    n: number,
    N: number
): ConfidenceInterval {
    const marginOfError = proportionMarginOfError(p, alpha, n) * FPC(n, N);

    return {
        lower: Math.max(0, p - marginOfError),
        upper: Math.min(1, p + marginOfError)
    };
}

/**
 * Calculates the confidence interval for the population mean under Simple Random Sampling (SRS, without replacement)
 * when the population standard deviation is KNOWN, incorporating the Finite Population Correction (FPC).
 *
 * @param values - Array of sample values.
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @param sigma - Known population standard deviation (> 0).
 * @param N - Total population size (N >= values.length).
 * @returns An object containing the lower and upper bounds adjusted with FPC.
 */
export function meanEstimationSRSwithSTD(
    values: number[],
    alpha: number,
    sigma: number,
    N: number
): ConfidenceInterval {
    const fpc = FPC(values.length, N);
    const avg = mean(values);
    const marginOfError = meanMarginOfErrorWithSTD(values, alpha, sigma) * fpc;

    return {
        lower: avg - marginOfError,
        upper: avg + marginOfError
    }
}

/**
 * Calculates the confidence interval for the population mean under Simple Random Sampling (SRS, without replacement)
 * when the population standard deviation is UNKNOWN, incorporating the Finite Population Correction (FPC).
 *
 * @param values - Array of sample values (minimum 2 items).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @param N - Total population size (N >= values.length).
 * @returns An object containing the lower and upper bounds adjusted with FPC.
 */
export function meanEstimationSRSwithoutSTD(
    values: number[],
    alpha: number,
    N: number
): ConfidenceInterval {
    const fpc = FPC(values.length, N);
    const avg = mean(values);
    const marginOfError = meanMarginOfErrorWithoutSTD(values, alpha) * fpc;

    return {
        lower: avg - marginOfError,
        upper: avg + marginOfError
    };
}

/**
 * Calculates the asymmetric confidence interval for the population variance
 * under IID sampling assumptions using the Chi-Square (χ²) distribution.
 *
 * @param values - Array of sample values (minimum 2 items).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @returns An object containing the lower and upper bounds of the variance confidence interval.
 */
export function varianceEstimationIID(
    values: number[],
    alpha: number
): ConfidenceInterval {
    const sampleVar = variance(values, true);
    return calculateVarianceCIFromSampleVar(sampleVar, values.length, alpha);
}

/**
 * Calculates the confidence interval for the population variance under Simple Random Sampling (SRS).
 * Evaluates the adjusted variance bounds for finite populations.
 *
 * @param values - Array of sample values (minimum 2 items).
 * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
 * @param N - Total population size (N >= values.length).
 * @returns An object containing the lower and upper bounds of the variance confidence interval.
 */
export function varianceEstimationSRS(
    values: number[],
    alpha: number,
    N: number
): ConfidenceInterval {
    if (N <= 0) {
        throw new Error("Population size (N) must be greater than zero.");
    }

    if (values.length > N) {
        throw new Error("Sample size cannot be greater than population size.");
    }

    const sampleVar = variance(values, true);
    return calculateVarianceCIFromSampleVar(sampleVar, values.length, alpha);
}

/**
 * Becsli a teljes sokasági átlagot rétegzett mintából.
 * 
 * A számítás a rétegenkénti mintaátlagok sokasági súlyokkal (W_h = N_h / N)
 * képzett súlyozott átlagán alapul: \hat{\bar{Y}} = \sum (N_h / N) * \bar{y}_h.
 * 
 * @param strata - A rétegek adatát (minták és sokasági létszám) tartalmazó tömb.
 * @returns A teljes sokaság becsült átlaga.
 * 
 * @throws {Error} Ha az összesített sokasági létszám (totalPopulationSize) 0 vagy negatív.
 */
export function estimateStratifiedMean(strata: Stratum[]): number {
    const totalPopulationSize = strata.reduce(
        (acc, s) => acc + s.stratumSize, 0
    );

    if (totalPopulationSize === 0) {
        throw new Error('Total population size across all strata must be greater than zero.');
    }

    return strata.reduce((total, stratum) => {
        const sampleMean = mean(stratum.samples);
        const weight = stratum.stratumSize / totalPopulationSize;
        return total + sampleMean * weight;
    }, 0);
}

/**
 * Estimates the population total (sum of values) from a stratified sample.
 * 
 * The calculation sums the product of each stratum's sample mean and its total
 * population size: \hat{Y} = \sum N_h * \bar{y}_h.
 * 
 * @param strata - Array containing stratum data (sample values and total population size per stratum).
 * @returns The estimated total value (sum) of the population.
 * 
 * @throws {Error} If the total population size across all strata is zero or negative.
 */
export function estimateStratifiedTotal(strata: Stratum[]): number {
    const totalPopulationSize = strata.reduce(
        (acc, s) => acc + s.stratumSize, 0
    );

    if (totalPopulationSize === 0) {
        throw new Error('Total population size across all strata must be greater than zero.');
    }

    return strata.reduce((total, stratum) => {
        const sampleMean = mean(stratum.samples);
        return total + sampleMean * stratum.stratumSize;
    }, 0);
}

/**
 * Estimates the variance of the stratified mean estimator.
 * 
 * The calculation incorporates the Finite Population Correction (FPC = 1 - n_h / N_h)
 * and squared stratum weights: Var(\hat{\bar{Y}}) = \sum W_h^2 * FPC * (s_h^2 / n_h).
 * 
 * @param strata - Array containing stratum data (sample values and total population size per stratum).
 * @returns The estimated variance of the stratified mean estimator.
 * 
 * @throws {Error} If the total population size across all strata is zero or negative.
 */
export function estimateStratifiedVariance(strata: Stratum[]): number {
    const totalPopulationSize = strata.reduce(
        (acc, s) => acc + s.stratumSize, 0
    );

    if (totalPopulationSize === 0) {
        throw new Error('Total population size across all strata must be greater than zero.');
    }

    return strata.reduce((total, stratum) => {
        const sampleSize = stratum.samples.length;
        const sampleVariance = variance(stratum.samples);
        const weight = stratum.stratumSize / totalPopulationSize;
        const weightSquared = Math.pow(weight, 2);

        const fpc = 1 - sampleSize / stratum.stratumSize;
        return total + weightSquared * fpc * (sampleVariance / sampleSize);
    }, 0);
}

/**
 * Calculates the confidence interval for the difference between two independent sample means
 * when population variances are known (Z-distribution approach).
 *
 * @param sample1 - Array of numeric observations from the first independent sample.
 * @param sample2 - Array of numeric observations from the second independent sample.
 * @param var1 - Known population variance of the first sample (must be non-negative).
 * @param var2 - Known population variance of the second sample (must be non-negative).
 * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
 * @returns An object containing the lower and upper bounds of the estimated confidence interval.
 *
 * @throws {Error} If either sample array is empty.
 * @throws {Error} If either variance parameter is negative.
 * @throws {Error} If alpha is not strictly between 0 and 1.
 */
export function getMeanDiffKnownVariance(
    sample1: number[],
    sample2: number[],
    var1: number,
    var2: number,
    alpha: number
): ConfidenceInterval {
    if (sample1.length === 0 || sample2.length === 0) {
        throw new Error('Both samples must contain at least 1 element.');
    }

    if (var1 < 0 || var2 < 0) {
        throw new Error('Variances (var1, var2) cannot be negative!');
    }

    const Z = getZCritical(alpha);
    const sample1Mean = mean(sample1);
    const sample2Mean = mean(sample2);
    const meanDiff = sample1Mean - sample2Mean;
    const varProportion1 = var1 / sample1.length;
    const varProportion2 = var2 / sample2.length;

    const marginOfError = Z * Math.sqrt(
        varProportion1 + varProportion2
    );

    return {
        lower: meanDiff - marginOfError,
        upper: meanDiff + marginOfError
    }
}

/**
 * Calculates the confidence interval for the difference between two independent sample means
 * assuming unknown but equal population variances (pooled sample variance t-distribution approach).
 *
 * @param sample1 - Array of numeric observations from the first independent sample.
 * @param sample2 - Array of numeric observations from the second independent sample.
 * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
 * @returns An object containing the lower and upper bounds of the estimated confidence interval.
 *
 * @throws {Error} If either sample contains fewer than 2 elements (required for sample variance calculation).
 * @throws {Error} If alpha is not strictly between 0 and 1.
 */
export function getMeanDiffPooledCI(
    sample1: number[],
    sample2: number[],
    alpha: number
): ConfidenceInterval {
    const { df, meanDiff, standardError } = getPooledTContext(sample1, sample2);

    const t = getTCritical(alpha, df);
    const marginOfError = t * standardError;

    return {
        lower: meanDiff - marginOfError,
        upper: meanDiff + marginOfError,
    };
}

/**
 * Calculates the confidence interval for the difference between two independent proportions
 * using normal approximation (Wald interval).
 *
 * @param k1 - Number of successes in the first sample (must be between 0 and n1).
 * @param n1 - Total size of the first sample (must be strictly greater than 0).
 * @param k2 - Number of successes in the second sample (must be between 0 and n2).
 * @param n2 - Total size of the second sample (must be strictly greater than 0).
 * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
 * @returns An object containing the lower and upper bounds of the estimated confidence interval.
 *
 * @throws {Error} If n1 or n2 is less than or equal to 0.
 * @throws {Error} If k1 or k2 is negative or exceeds its respective sample size.
 * @throws {Error} If alpha is not strictly between 0 and 1.
 */
export function getProportionDiff(
    k1: number, n1: number,
    k2: number, n2: number,
    alpha: number
): ConfidenceInterval {
    if (n1 <= 0 || n2 <= 0) {
        throw new Error('Sample sizes (n1, n2) must be strictly greater than 0.');
    }

    if (k1 < 0 || k1 > n1) {
        throw new Error(`k1 must be between 0 and n1 (${n1}), but got ${k1}.`);
    }

    if (k2 < 0 || k2 > n2) {
        throw new Error(`k2 must be between 0 and n2 (${n2}), but got ${k2}.`);
    }

    const Z = getZCritical(alpha);
    const p1 = k1 / n1;
    const p2 = k2 / n2;
    const pDiff = p1 - p2;

    const var1 = (p1 * (1 - p1)) / n1;
    const var2 = (p2 * (1 - p2)) / n2;

    const marginOfError = Z * Math.sqrt(var1 + var2);

    return {
        lower: pDiff - marginOfError,
        upper: pDiff + marginOfError
    }
}

/**
 * Calculates the confidence interval for the mean difference between two paired/dependent samples
 * using the Student's t-distribution.
 *
 * @param sample1 - Array of numeric observations for the first paired condition.
 * @param sample2 - Array of numeric observations for the second paired condition.
 * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
 * @returns An object containing the lower and upper bounds of the estimated confidence interval.
 *
 * @throws {Error} If either sample array is empty.
 * @throws {Error} If sample arrays do not have equal lengths.
 * @throws {Error} If fewer than 2 pairs are provided (required for variance estimation).
 * @throws {Error} If alpha is not strictly between 0 and 1.
 */
export function getPairedMeanDiff(
    sample1: number[],
    sample2: number[],
    alpha: number
): ConfidenceInterval {
    if (sample1.length === 0 || sample2.length === 0) {
        throw new Error('Samples must contain at least one observation.');
    }

    if (sample1.length !== sample2.length) {
        throw new Error(
            `Paired samples must have the exact same length! 
            (sample1: ${sample1.length}, sample2: ${sample2.length})`
        );
    }

    const n = sample1.length;

    if (n < 2) {
        throw new Error('At least 2 pairs of observations are required to calculate standard deviation.');
    }

    const pairDiffs = sample1.map((val, i) => val - sample2[i]);
    const pairDiffAvg = mean(pairDiffs);
    const pairDiffStd = std(pairDiffs, true);
    const t = getTCritical(alpha, n - 1);

    const marginOfError = t * pairDiffStd / Math.sqrt(n);

    return {
        lower: pairDiffAvg - marginOfError,
        upper: pairDiffAvg + marginOfError,
    }
}