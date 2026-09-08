import Column from "./Column.js";
import { getMax, getMin, toNumberArray } from '../utils/utils.js';
import { mean, variance, ssd, range, skewness, excessKurtosis, percentile, q1, median, q3, iqr, std }
    from '../statistics/univariate.js';
import { standardizeValues, normalizeValues, replaceOutliers, replaceEmptyValues, isInvalidValue }
    from '../dataPreparation/dataPreparation.js';
import { Boundaries, ConfidenceInterval, ImputeType, PercentMode, RegressionModel, Stratum, TrendModel } from "../types/types.js";
import { correlation, covariance } from "../statistics/bivariate.js";
import Regression from "../inference/Regression.js";
import Trend from "../inference/Trend.js";
import { orderAsc, orderDesc } from '../utils/numberUtils.js';
import {
    meanEstimationIIDwithSTD,
    meanEstimationIIDwithoutSTD,
    proportionEstimationIID,
    proportionEstimationSRS,
    meanEstimationSRSwithSTD,
    meanEstimationSRSwithoutSTD,
    varianceEstimationIID,
    varianceEstimationSRS,
    estimateStratifiedMean,
    estimateStratifiedTotal,
    estimateStratifiedVariance,
    getMeanDiffKnownVariance,
    getMeanDiffPooledCI,
    getProportionDiff,
    getPairedMeanDiff
} from "../inference/estimations.js";
import {
    zTest,
    tTest,
    zTestProportion,
    chi2Test,
    chi2FitTest,
    chiSquaredIndependenceTest,
    zTestTwoSamples,
    tTestTwoSamples,
    twoSampleAsymptoticZMeanTest,
    zTestProportionTwoSamples,
    fTestTwoSamples,
    tTestIndependent,
    oneWayAnova,
    bartlett
} from "../inference/hypothesis.js";

export default class NumberColumn extends Column<number> {
    private regression: Regression | null = null;
    private trend: Trend | null = null;

    /**
     * Converts raw unknown input data into an array of numeric or null values.
     *
     * @protected
     * @param {unknown[]} rawValues - The raw input values.
     * @returns {(number | NaN)[]} An array of processed numeric values or nulls for missing/invalid entries.
     */
    protected prepareData(rawValues: unknown[]): number[] {
        return toNumberArray(rawValues);
    }

    protected override clearCache(): void {
        super.clearCache();
        this.trend = null;
        this.regression = null;
    }

    protected isValid(val: number | null): boolean {
        return typeof val === 'number' && Number.isFinite(val);
    }

    /**
     * Calculates and caches the minimum valid value in the column.
     *
     * @returns {number} The minimum numeric value.
     */
    public min(): number {
        return this.getCached('min', () => getMin(this.getValidValues()));
    }

    /**
     * Calculates and caches the maximum valid value in the column.
     *
     * @returns {number} The maximum numeric value.
     */
    public max(): number {
        return this.getCached('max', () => getMax(this.getValidValues()));
    }

    /**
     * Calculates and caches the arithmetic mean of valid values in the column.
     *
     * @returns {number} The mean of the column values.
     */
    public mean(): number {
        return this.getCached('mean', () => mean(this.getValidValues()));
    }

    /**
     * Calculates and caches the sample variance of valid values in the column.
     *
     * @returns {number} The variance of the column values.
     */
    public variance(): number {
        return this.getCached('variance', () => variance(this.getValidValues()));
    }

    /**
     * Calculates and caches the sample variance of valid values in the column.
     *
     * @returns {number} The variance of the column values.
     */
    public std(): number {
        return this.getCached('variance', () => std(this.getValidValues()));
    }

    /**
     * Calculates and caches the sum of squared deviations (SSD) for valid values in the column.
     *
     * @returns {number} The sum of squared deviations.
     */
    public ssd(): number {
        return this.getCached('ssd', () => ssd(this.getValidValues()));
    }

    /**
     * Calculates and caches the range (difference between max and min) of valid values in the column.
     *
     * @returns {number} The numeric range of the column.
     */
    public range(): number {
        return this.getCached('range', () => range(this.getValidValues()));
    }

    /**
     * Calculates and caches the skewness (asymmetry measure) of valid values in the column.
     *
     * @returns {number} The skewness value.
     */
    public skewness(): number {
        return this.getCached('skewness', () => skewness(this.getValidValues()));
    }

    /**
     * Calculates and caches the excess kurtosis (tailedness measure) of valid values in the column.
     *
     * @returns {number} The excess kurtosis value.
     */
    public kurtosis(): number {
        return this.getCached('kurtosis', () => excessKurtosis(this.getValidValues()));
    }

    /**
     * Calculates and caches a specific percentile of valid values in the column.
     *
     * @param {number} percent - The percentile value to compute (0-100).
     * @param {PercentMode} [percentMode='interpolated'] - The mode/method used for percentile estimation.
     * @returns {number} The calculated percentile value.
     */
    public percentile(percent: number, percentMode: PercentMode = 'interpolated'): number {
        return this.getCached(`percentile_${percent}_${percentMode}`, () =>
            percentile(this.getValidValues(), percent, percentMode)
        );
    }

    /**
     * Calculates and caches the first quartile (25th percentile) of valid values in the column.
     *
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     * @returns {number} The first quartile value.
     */
    public q1(percentMode: PercentMode = 'interpolated'): number {
        return this.getCached(`q1_${percentMode}`, () => q1(this.getValidValues(), percentMode));
    }

    /**
     * Calculates and caches the median (50th percentile) of valid values in the column.
     *
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     * @returns {number} The median value.
     */
    public median(percentMode: PercentMode = 'interpolated'): number {
        return this.getCached(`median_${percentMode}`, () => median(this.getValidValues(), percentMode));
    }

    /**
     * Calculates and caches the third quartile (75th percentile) of valid values in the column.
     *
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     * @returns {number} The third quartile value.
     */
    public q3(percentMode: PercentMode = 'interpolated'): number {
        return this.getCached(`q3_${percentMode}`, () => q3(this.getValidValues(), percentMode));
    }

    /**
     * Calculates and caches the Interquartile Range (IQR = Q3 - Q1) of valid values in the column.
     *
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     * @returns {number} The calculated interquartile range.
     */
    public iqr(percentMode: PercentMode = 'interpolated'): number {
        return this.getCached(`iqr_${percentMode}`, () => iqr(this.getValidValues(), percentMode));
    }

    /**
     * Computes lower and upper outlier threshold boundaries based on Tukey's rule using the IQR.
     *
     * @param {number} [multiplier=1.5] - The IQR multiplier factor (typically 1.5 for mild outliers, 3.0 for extreme outliers).
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     * @returns {Boundaries} An object containing the computed `min` and `max` threshold boundaries.
     */
    public getIqrBoundaries(
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): Boundaries {
        const q1Val = this.q1(percentMode);
        const q3Val = this.q3(percentMode);
        const iqrVal = q3Val - q1Val;

        return {
            min: q1Val - (iqrVal * multiplier),
            max: q3Val + (iqrVal * multiplier)
        };
    }

    /**
     * Standardizes the values in the column in-place using Z-score standardization ($z = (x - \mu) / \sigma$).
     * Clears cached calculations.
     *
     * @throws {Error} Throws an error if the column contains invalid or missing values (`NaN`/`null`).
     */
    public standardize(): NumberColumn {
        const values: number[] = standardizeValues(this._values as number[]) as number[];
        return new NumberColumn(values, this._label);
    }

    /**
     * Normalizes the values in the column in-place using Min-Max scaling to a [0, 1] range.
     * Clears cached calculations.
     *
     * @throws {Error} Throws an error if the column contains invalid or missing values (`NaN`/`null`).
     */
    public normalize(): NumberColumn {
        const values: number[] = normalizeValues(this._values as number[]) as number[];
        return new NumberColumn(values, this._label);
    }

    /**
     * Replaces values falling outside specified boundaries in-place using a statistical imputation strategy.
     * Preserves existing missing/NaN values. Clears cached calculations.
     *
     * @param {ImputeType} type - The imputation method ('MEAN', 'MEDIAN', 'MODE').
     * @param {Boundaries} boundaries - The threshold boundaries (`min` and/or `max`) for identifying outliers.
     */
    public replaceOutliers(type: ImputeType, boundaries: Boundaries): NumberColumn {
        const values: number[] = replaceOutliers(this._values as number[], type, boundaries);
        return new NumberColumn(values, this._label);
    }

    /**
     * Replaces outlier values identified using Tukey's IQR boundaries in-place using a statistical imputation strategy.
     * Preserves existing missing/NaN values. Clears cached calculations.
     *
     * @param {ImputeType} type - The imputation method ('MEAN', 'MEDIAN', 'MODE').
     * @param {number} [multiplier=1.5] - The IQR boundary multiplier factor.
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     */
    public replaceOutliersIqr(
        type: ImputeType,
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): NumberColumn {
        const boundaries: Boundaries = this.getIqrBoundaries(multiplier, percentMode);
        return this.replaceOutliers(type, boundaries);
    }

    /**
     * Replaces empty, null, or NaN values in the column in-place using a statistical imputation strategy.
     * Clears cached calculations.
     *
     * @param {ImputeType} type - The imputation method ('MEAN', 'MEDIAN', 'MODE').
     */
    public replaceEmptyValues(type: ImputeType): NumberColumn {
        const values: number[] = replaceEmptyValues(this._values as number[], type) as number[];
        return new NumberColumn(values, this._label);
    }

    public getImputedValues(type: ImputeType) {
        return replaceEmptyValues(this._values as number[], type) as number[];
    }

    /**
     * Removes rows (values) that fall outside specified threshold boundaries in-place and clears cached calculations.
     * 
     * @param {Boundaries} boundaries - The lower (`min`) and upper (`max`) threshold boundaries.
     */
    public removeInvalidRows(boundaries: Boundaries): NumberColumn {
        const values: number[] = this.filterValues((val) => !isInvalidValue(
            (val as number), boundaries)
        ) as number[];

        return new NumberColumn(values, this._label);
    }

    /**
     * Removes rows (values) that fall outside IQR-based threshold boundaries in-place and clears cached calculations.
     * 
     * @param {number} [multiplier=1.5] - The IQR multiplier factor (typically 1.5 for mild outliers, 3.0 for extreme outliers).
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile calculation.
     */
    public removeRowsIqr(
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ) {
        const boundaries = this.getIqrBoundaries(multiplier, percentMode);
        const values: number[] = this.filterValues(val => !isInvalidValue(val, boundaries)) as number[];
        return new NumberColumn(values, this._label);
    }

    /**
     * Evaluates column values against threshold boundaries and returns the row indices that are valid.
     * Does not mutate internal column state.
     * 
     * @param {Boundaries} boundaries - The lower (`min`) and upper (`max`) threshold boundaries.
     * @returns {number[]} An array of original zero-based row indices that pass boundary validation.
     */
    public filterIndicesByBoundaries(boundaries: Boundaries): Int32Array {
        return this.filterIndices(val => !isInvalidValue(val, boundaries));
    }

    /**
     * Evaluates column values against Tukey's IQR threshold boundaries and returns valid row indices.
     * Does not mutate internal column state.
     * 
     * @param {number} [multiplier=1.5] - The IQR multiplier factor (typically 1.5 for mild outliers, 3.0 for extreme outliers).
     * @param {PercentMode} [percentMode='interpolated'] - The mode used for percentile estimation.
     * @returns {number[]} An array of original zero-based row indices that pass IQR outlier validation.
     */
    public filterIndicesByIqr(
        multiplier: number = 1.5,
        percentMode: PercentMode = 'interpolated'
    ): Int32Array {
        const boundaries = this.getIqrBoundaries(multiplier, percentMode);
        return this.filterIndicesByBoundaries(boundaries);
    }

    /**
     * Computes the sample covariance between this column and another NumberColumn.
     *
     * @param {NumberColumn} column - The target column to calculate covariance with.
     * @returns {number} The covariance between the two columns.
     * @throws {Error} Throws an error if array lengths do not match or if missing values are present.
     */
    public covariance(column: NumberColumn): number {
        return covariance(this._values as number[], column.values as number[]);
    }

    /**
     * Computes Pearson's correlation coefficient ($r$) between this column and another NumberColumn.
     *
     * @param {NumberColumn} column - The target column to calculate correlation with.
     * @returns {number} The Pearson correlation coefficient ranging between -1 and 1.
     * @throws {Error} Throws an error if array lengths do not match or if missing values are present.
     */
    public correlation(column: NumberColumn): number {
        return correlation(this._values as number[], column.values as number[]);
    }

    /**
     * Fits a linear regression model ($y = b_0 + b_1 \cdot x$) between this column (independent variable X) 
     * and a target column (dependent variable Y).
     *
     * @param {NumberColumn} column - The target dependent column (Y).
     * @returns {{ b0: number, b1: number }} An object containing the y-intercept (`b0`) and slope (`b1`).
     * @throws {Error} Throws if array lengths do not match or if missing/non-positive values violate model assumptions.
     */
    public linearRegression(column: NumberColumn): RegressionModel {
        if (!(column instanceof NumberColumn)) {
            throw new Error('You must provide a numeric column (NumberColumn) instance!');
        }

        this.regression = new Regression(
            this._values as number[],
            column.values as number[]
        );

        return {
            ...this.regression.linear(),
            rsd: this.regression.RSDLinear()
        };
    }

    /**
     * Fits an exponential regression model ($y = b_0 \cdot e^{b_1 \cdot x}$) between this column (X) and a target column (Y).
     *
     * @param {NumberColumn} column - The target dependent column (Y).
     * @returns {{ b0: number; b1: number; rsd: number }} An object containing:
     *  - `b0`: The initial value or scale factor (intercept).
     *  - `b1`: The exponential growth rate constant.
     *  - `rsd`: The Residual Standard Deviation, measuring the standard error of the regression model fit.
     * @throws {Error} Throws if dependent values contain non-positive numbers.
     */
    public exponentialRegression(column: NumberColumn): RegressionModel {
        if (!(column instanceof NumberColumn)) {
            throw new Error('You must provide a numeric column (NumberColumn) instance!');
        }

        this.regression = new Regression(
            this._values as number[],
            column.values as number[]
        );

        return {
            ...this.regression.exponential(),
            rsd: this.regression.RSDExponential()
        };
    }

    /**
     * Fits a power regression model ($y = b_0 \cdot x^{b_1}$) between this column (X) and a target column (Y).
     *
     * @param {NumberColumn} column - The target dependent column (Y).
     * @returns {{ b0: number; b1: number; rsd: number }} An object containing:
     *  - `b0`: The proportionality constant (intercept factor).
     *  - `b1`: The power exponent.
     *  - `rsd`: The Residual Standard Deviation, indicating the standard error of the regression estimate.
     * @throws {Error} Throws if independent or dependent values contain non-positive numbers.
     */
    public powerRegression(column: NumberColumn): RegressionModel {
        if (!(column instanceof NumberColumn)) {
            throw new Error('You must provide a numeric column (NumberColumn) instance!');
        }

        this.regression = new Regression(
            this._values as number[],
            column.values as number[]
        );

        return {
            ...this.regression.power(),
            rsd: this.regression.RSDPower()
        };
    }

    /**
     * Calculates and caches the linear time-series trend of the column values.
     *
     * @returns {TrendModel} An object containing:
     *  - `a`: The baseline trend value (y-intercept).
     *  - `b`: The rate of change per time step (slope).
     *  - `mse`: The Mean Squared Error of the fitted trend line.
     */
    public linearTrend(): TrendModel {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached('linear_trend', () => {
            return {
                ...this.trend?.linear(),
                mse: this.trend?.MSELinear()
            }
        }) as TrendModel;
    }

    /**
     * Calculates and caches the exponential time-series trend of the column values.
     *
     * @returns {TrendModel} An object containing:
     *  - `a`: The initial baseline value (scale factor).
     *  - `b`: The growth or decay rate base.
     *  - `mse`: The Mean Squared Error of the fitted exponential trend line.
     */
    public exponentialTrend(): TrendModel {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached('exponential_trend', () => {
            return {
                ...this.trend?.exponential(),
                mse: this.trend?.MSEExponential()
            }
        }) as TrendModel;
    }

    /**
     * Calculates and caches the logarithmic time-series trend of the column values.
     *
     * @returns {TrendModel} An object containing:
     *  - `a`: The constant offset factor (intercept).
     *  - `b`: The logarithmic growth/decay coefficient (slope).
     *  - `mse`: The Mean Squared Error of the fitted logarithmic trend line.
     */
    public logarithmicTrend(): TrendModel {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached('exponential_trend', () => {
            return {
                ...this.trend?.logarithmic(),
                mse: this.trend?.MSELogarithmic()
            }
        }) as TrendModel;
    }

    /**
     * Calculates and caches a polynomial time-series trend of a specified degree.
     *
     * @param {number} degree - The polynomial degree (e.g., 2 for quadratic, 3 for cubic).
     * @returns {any} The fitted polynomial trend parameters or series with MSE.
     */
    public polynomialTrend(degree: number) {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached(`polynomial_trend_${degree}`, () => {
            return {
                ...this.trend?.polynomial(degree),
                mse: this.trend?.MSEPolynomial(degree)
            }
        });
    }

    /**
     * Sorts the values of the column in ascending order in-place.
     * Clears cached calculations.
     */
    public orderAsc(): NumberColumn {
        const copyValues = [...this._values];
        const values: number[] = orderAsc(copyValues as number[]);
        return new NumberColumn(values, this._label);
    }

    /**
     * Sorts the values of the column in descending order in-place.
     * Clears cached calculations.
     */
    public orderDesc(): NumberColumn {
        const copyValues = [...this._values];
        const values: number[] = orderDesc(copyValues as number[]);
        return new NumberColumn(values, this._label);
    }

    /**
     * Calculates the confidence interval for the population mean under Independent and Identically
     * Distributed (IID) sampling when the population standard deviation is KNOWN.
     *
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @param sigma - Known population standard deviation (> 0).
     * @returns An object containing the lower and upper bounds of the confidence interval.
     */
    public meanEstimationIIDwithSTD(alpha: number, sigma: number): ConfidenceInterval {
        return this.getCached(`meanEstimationIIDwithSTD_${alpha}_${sigma}`, () =>
            meanEstimationIIDwithSTD(this.getValidValues(), alpha, sigma)
        );
    }

    /**
     * Calculates the confidence interval for the population mean when the population
     * standard deviation is UNKNOWN (Student's t-distribution).
     * 
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence interval).
     * @returns Object containing the lower and upper bounds of the confidence interval.
     */
    public meanEstimationIIDwithoutSTD(alpha: number): ConfidenceInterval {
        return this.getCached(`meanEstimationIIDwithoutSTD_${alpha}`, () =>
            meanEstimationIIDwithoutSTD(this.getValidValues(), alpha)
        );
    }

    /**
     * Calculates the confidence interval for a population proportion under IID sampling
     * using the Wald (normal approximation) method. Lower and upper bounds are clipped to [0, 1].
     *
     * @param p - Sample proportion (between 0 and 1).
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @returns An object containing the lower and upper bounds clipped to [0, 1].
     */
    public proportionEstimationIID(p: number, alpha: number): ConfidenceInterval {
        return this.getCached(`proportionEstimationIID_${p}_${alpha}`, () =>
            proportionEstimationIID(p, alpha, this.getValidValues().length)
        );
    }

    /**
     * Calculates the confidence interval for a population proportion under Simple Random Sampling (SRS, without replacement)
     * using the Wald method with Finite Population Correction (FPC). Bounds are clipped to [0, 1].
     *
     * @param p - Sample proportion (between 0 and 1).
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @param N - Total population size (N >= sample size).
     * @returns An object containing the lower and upper bounds clipped to [0, 1].
     */
    public proportionEstimationSRS(p: number, alpha: number, N: number): ConfidenceInterval {
        return this.getCached(`proportionEstimationSRS_${p}_${alpha}_${N}`, () =>
            proportionEstimationSRS(p, alpha, this.getValidValues().length, N)
        );
    }

    /**
     * Calculates the confidence interval for the population mean under Simple Random Sampling (SRS, without replacement)
     * when the population standard deviation is KNOWN, incorporating the Finite Population Correction (FPC).
     *
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @param sigma - Known population standard deviation (> 0).
     * @param N - Total population size (N >= sample size).
     * @returns An object containing the lower and upper bounds adjusted with FPC.
     */
    public meanEstimationSRSwithSTD(alpha: number, sigma: number, N: number): ConfidenceInterval {
        return this.getCached(`meanEstimationSRSwithSTD_${alpha}_${sigma}_${N}`, () =>
            meanEstimationSRSwithSTD(this.getValidValues(), alpha, sigma, N)
        );
    }

    /**
     * Calculates the confidence interval for the population mean under Simple Random Sampling (SRS, without replacement)
     * when the population standard deviation is UNKNOWN, incorporating the Finite Population Correction (FPC).
     *
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @param N - Total population size (N >= sample size).
     * @returns An object containing the lower and upper bounds adjusted with FPC.
     */
    public meanEstimationSRSwithoutSTD(alpha: number, N: number): ConfidenceInterval {
        return this.getCached(`meanEstimationSRSwithoutSTD_${alpha}_${N}`, () =>
            meanEstimationSRSwithoutSTD(this.getValidValues(), alpha, N)
        );
    }

    /**
     * Calculates the asymmetric confidence interval for the population variance
     * under IID sampling assumptions using the Chi-Square (χ²) distribution.
     *
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @returns An object containing the lower and upper bounds of the variance confidence interval.
     */
    public varianceEstimationIID(alpha: number): ConfidenceInterval {
        return this.getCached(`varianceEstimationIID_${alpha}`, () =>
            varianceEstimationIID(this.getValidValues(), alpha)
        );
    }

    /**
     * Calculates the confidence interval for the population variance under Simple Random Sampling (SRS).
     * Evaluates the adjusted variance bounds for finite populations.
     *
     * @param alpha - Significance level (e.g., 0.05 for a 95% confidence level).
     * @param N - Total population size (N >= sample size).
     * @returns An object containing the lower and upper bounds of the variance confidence interval.
     */
    public varianceEstimationSRS(alpha: number, N: number): ConfidenceInterval {
        return this.getCached(`varianceEstimationSRS_${alpha}_${N}`, () =>
            varianceEstimationSRS(this.getValidValues(), alpha, N)
        );
    }

    /**
     * Becsli a teljes sokasági átlagot rétegzett mintából.
     * 
     * @param strata - A rétegek adatát (minták és sokasági létszám) tartalmazó tömb.
     * @returns A teljes sokaság becsült átlaga.
     */
    public estimateStratifiedMean(strata: Stratum[]): number {
        return this.getCached(`estimateStratifiedMean_${JSON.stringify(strata)}`, () =>
            estimateStratifiedMean(strata)
        );
    }

    /**
     * Estimates the population total (sum of values) from a stratified sample.
     * 
     * @param strata - Array containing stratum data (sample values and total population size per stratum).
     * @returns The estimated total value (sum) of the population.
     */
    public estimateStratifiedTotal(strata: Stratum[]): number {
        return this.getCached(`estimateStratifiedTotal_${JSON.stringify(strata)}`, () =>
            estimateStratifiedTotal(strata)
        );
    }

    /**
     * Estimates the variance of the stratified mean estimator.
     * 
     * @param strata - Array containing stratum data (sample values and total population size per stratum).
     * @returns The estimated variance of the stratified mean estimator.
     */
    public estimateStratifiedVariance(strata: Stratum[]): number {
        return this.getCached(`estimateStratifiedVariance_${JSON.stringify(strata)}`, () =>
            estimateStratifiedVariance(strata)
        );
    }

    /**
     * Calculates the confidence interval for the difference between two independent sample means
     * when population variances are known (Z-distribution approach).
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param var1 - Known population variance of the current sample (must be non-negative).
     * @param var2 - Known population variance of the second sample (must be non-negative).
     * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
     * @returns An object containing the lower and upper bounds of the estimated confidence interval.
     */
    public getMeanDiffKnownVariance(
        otherColumn: NumberColumn,
        var1: number,
        var2: number,
        alpha: number
    ): ConfidenceInterval {
        return this.getCached(`getMeanDiffKnownVariance_${otherColumn}_${var1}_${var2}_${alpha}`, () =>
            getMeanDiffKnownVariance(
                this.getValidValues(),
                otherColumn.getValidValues(),
                var1,
                var2,
                alpha
            )
        );
    }

    /**
     * Calculates the confidence interval for the difference between two independent sample means
     * assuming unknown but equal population variances (pooled sample variance t-distribution approach).
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
     * @returns An object containing the lower and upper bounds of the estimated confidence interval.
     */
    public getMeanDiffPooledCI(otherColumn: NumberColumn, alpha: number): ConfidenceInterval {
        return this.getCached(`getMeanDiffPooledCI_${otherColumn}_${alpha}`, () =>
            getMeanDiffPooledCI(this.getValidValues(), otherColumn.getValidValues(), alpha)
        );
    }

    /**
     * Calculates the confidence interval for the difference between two independent proportions
     * using normal approximation (Wald interval).
     *
     * @param k1 - Number of successes in the current sample (must be between 0 and n1).
     * @param k2 - Number of successes in the second sample (must be between 0 and n2).
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
     * @returns An object containing the lower and upper bounds of the estimated confidence interval.
     */
    public getProportionDiff(
        k1: number,
        k2: number,
        otherColumn: NumberColumn,
        alpha: number
    ): ConfidenceInterval {
        return this.getCached(`getProportionDiff_${k1}_${k2}_${otherColumn}_${alpha}`, () =>
            getProportionDiff(
                k1,
                this.getValidValues().length,
                k2,
                otherColumn.getValidValues().length,
                alpha
            )
        );
    }

    /**
     * Calculates the confidence interval for the mean difference between two paired/dependent samples
     * using the Student's t-distribution.
     *
     * @param otherColumn - The second paired sample dataset as a NumberColumn.
     * @param alpha - Significance level strictly between 0 and 1 (e.g., 0.05 for a 95% confidence interval).
     * @returns An object containing the lower and upper bounds of the estimated confidence interval.
     */
    public getPairedMeanDiff(otherColumn: NumberColumn, alpha: number): ConfidenceInterval {
        return this.getCached(`getPairedMeanDiff_${otherColumn}_${alpha}`, () =>
            getPairedMeanDiff(this.getValidValues(), otherColumn.getValidValues(), alpha)
        );
    }

    /**
     * Performs a one-sample Z-test on continuous data when the population standard deviation is known.
     *
     * @param sigma - The known population standard deviation (> 0).
     * @param alpha - Significance level (e.g., 0.05).
     * @param mu - The hypothesized population mean under H0.
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @returns An object containing test statistic z, critical value Z, and boolean result passed.
     */
    public zTest(
        sigma: number,
        alpha: number,
        mu: number,
        testDirection: 'left' | 'right' | 'two-sided'
    ): { z: number; Z: number; passed: boolean } {
        return this.getCached(`zTest_${sigma}_${alpha}_${mu}_${testDirection}`, () =>
            zTest(this.getValidValues(), sigma, alpha, mu, testDirection)
        );
    }

    /**
     * Performs a one-sample Student's t-test when the population standard deviation is unknown.
     *
     * @param alpha - Significance level (e.g., 0.05).
     * @param mu - The hypothesized population mean under H0.
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @returns An object containing test statistic t, critical value T, and boolean result passed.
     */
    public tTest(
        alpha: number,
        mu: number,
        testDirection: 'left' | 'right' | 'two-sided'
    ): { t: number; T: number; passed: boolean } {
        return this.getCached(`tTest_${alpha}_${mu}_${testDirection}`, () =>
            tTest(this.getValidValues(), alpha, mu, testDirection)
        );
    }

    /**
     * Performs a one-sample Z-test for a population proportion using the current column's length as sample size.
     *
     * @param pPopulation - The hypothesized population proportion (0 < p < 1).
     * @param pSample - The observed relative frequency in the sample (0 <= p <= 1).
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @returns An object containing z-statistic, Z-critical, and boolean result passed.
     */
    public zTestProportion(
        pPopulation: number,
        pSample: number,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided'
    ): { z: number; Z: number; passed: boolean } {
        return this.getCached(`zTestProportion_${pPopulation}_${pSample}_${alpha}_${testDirection}`, () =>
            zTestProportion(pPopulation, pSample, this.getValidValues().length, alpha, testDirection)
        );
    }

    /**
     * Performs a one-sample Chi-squared test for population variance.
     *
     * @param hypotheticalVar - The hypothesized population variance under H0 (> 0).
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @returns An object containing chi2 statistic, critical bounds, and boolean result passed.
     */
    public chi2Test(
        hypotheticalVar: number,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided'
    ): { chi2: number; criticalBounds: { lower?: number; upper?: number }; passed: boolean } {
        return this.getCached(`chi2Test_${hypotheticalVar}_${alpha}_${testDirection}`, () =>
            chi2Test(this.getValidValues(), hypotheticalVar, alpha, testDirection)
        );
    }

    /**
     * Performs a Chi-squared goodness-of-fit test comparing observed frequencies in this column with expected frequencies.
     *
     * @param expected - An array of expected frequencies for each category.
     * @param alpha - Significance level (e.g., 0.05).
     * @param numEstimatedParams - Number of estimated parameters (default: 0).
     * @returns An object containing chi2 statistic, degrees of freedom, critical bounds, and boolean result passed.
     */
    public chi2FitTest(
        expected: number[],
        alpha: number,
        numEstimatedParams: number = 0
    ): { chi2: number; criticalBounds: { lower?: number; upper?: number }; passed: boolean } {
        return this.getCached(`chi2FitTest_${JSON.stringify(expected)}_${alpha}_${numEstimatedParams}`, () =>
            chi2FitTest(this.getValidValues(), expected, alpha, numEstimatedParams)
        );
    }

    /**
     * Performs a Chi-squared test of independence on a 2D contingency table matrix.
     *
     * @param contingencyTable - A 2D array representing observed frequencies.
     * @param alpha - Significance level (e.g., 0.05).
     * @returns An object containing chi2 statistic, degrees of freedom, critical bounds, and boolean result passed.
     */
    public chiSquaredIndependenceTest(
        contingencyTable: number[][],
        alpha: number
    ): { chi2: number; criticalBounds: { lower?: number; upper?: number }; passed: boolean } {
        return this.getCached(`chiSquaredIndependenceTest_${JSON.stringify(contingencyTable)}_${alpha}`, () =>
            chiSquaredIndependenceTest(contingencyTable, alpha)
        );
    }

    /**
     * Performs a two-sample Z-test for the difference between two population means with known population variances.
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param popVar1 - Known population variance of the current sample (> 0).
     * @param popVar2 - Known population variance of the second sample (> 0).
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @param meanDifference - Hypothesized mean difference (default: 0).
     * @returns An object containing z-statistic, Z-critical, and boolean result passed.
     */
    public zTestTwoSamples(
        otherColumn: NumberColumn,
        popVar1: number,
        popVar2: number,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided',
        meanDifference: number = 0
    ): { z: number; Z: number; passed: boolean } {
        return this.getCached(`zTestTwoSamples_${otherColumn}_${popVar1}_${popVar2}_${alpha}_${testDirection}_${meanDifference}`, () =>
            zTestTwoSamples(
                this.getValidValues(),
                otherColumn.getValidValues(),
                popVar1,
                popVar2,
                alpha,
                testDirection,
                meanDifference
            )
        );
    }

    /**
     * Performs a two-sample t-test for the difference between two population means (Student's or Welch's).
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @param assumeEqualVariances - True for Student's t-test, false for Welch's t-test (default: false).
     * @param meanDifference - Hypothesized mean difference (default: 0).
     * @returns An object containing t-statistic, T-critical, degrees of freedom, and boolean result passed.
     */
    public tTestTwoSamples(
        otherColumn: NumberColumn,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided',
        assumeEqualVariances: boolean = false,
        meanDifference: number = 0
    ): { t: number; T: number; passed: boolean } {
        return this.getCached(`tTestTwoSamples_${otherColumn}_${alpha}_${testDirection}_${assumeEqualVariances}_${meanDifference}`, () =>
            tTestTwoSamples(
                this.getValidValues(),
                otherColumn.getValidValues(),
                alpha,
                testDirection,
                assumeEqualVariances,
                meanDifference
            )
        );
    }

    /**
     * Performs an asymptotic two-sample Z-test for the difference between two population means (large sample sizes).
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @param meanDifference - Hypothesized mean difference (default: 0).
     * @returns An object containing z-statistic, Z-critical, and boolean result passed.
     */
    public twoSampleAsymptoticZMeanTest(
        otherColumn: NumberColumn,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided',
        meanDifference: number = 0
    ): { z: number; Z: number; passed: boolean } {
        return this.getCached(`twoSampleAsymptoticZMeanTest_${otherColumn}_${alpha}_${testDirection}_${meanDifference}`, () =>
            twoSampleAsymptoticZMeanTest(
                this.getValidValues(),
                otherColumn.getValidValues(),
                alpha,
                testDirection,
                meanDifference
            )
        );
    }

    /**
     * Performs a two-sample Z-test for the difference between two population proportions.
     *
     * @param pSample1 - Observed proportion in the current sample.
     * @param pSample2 - Observed proportion in the second sample.
     * @param otherColumn - The second sample dataset as a NumberColumn (used for n2 size).
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @param pDifference - Hypothesized difference in proportions (default: 0).
     * @returns An object containing z-statistic, Z-critical, and boolean result passed.
     */
    public zTestProportionTwoSamples(
        pSample1: number,
        pSample2: number,
        otherColumn: NumberColumn,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided',
        pDifference: number = 0
    ): { z: number; Z: number; passed: boolean } {
        return this.getCached(`zTestProportionTwoSamples_${pSample1}_${pSample2}_${otherColumn}_${alpha}_${testDirection}_${pDifference}`, () =>
            zTestProportionTwoSamples(
                pSample1,
                this.getValidValues().length,
                pSample2,
                otherColumn.getValidValues().length,
                alpha,
                testDirection,
                pDifference
            )
        );
    }

    /**
     * Performs a two-sample F-test for the equality of two population variances.
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @returns An object containing F-statistic, degrees of freedom (df1, df2), critical bounds, and boolean result passed.
     */
    public fTestTwoSamples(
        otherColumn: NumberColumn,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided'
    ): { F: number; criticalBounds: { lower?: number; upper?: number }; passed: boolean } {
        return this.getCached(`fTestTwoSamples_${otherColumn}_${alpha}_${testDirection}`, () =>
            fTestTwoSamples(this.getValidValues(), otherColumn.getValidValues(), alpha, testDirection)
        );
    }

    /**
     * Performs a two-sample independent Student's t-test assuming equal variances (pooled variance approach).
     *
     * @param otherColumn - The second sample dataset as a NumberColumn.
     * @param alpha - Significance level (e.g., 0.05).
     * @param testDirection - The direction of the test ('left', 'right', or 'two-sided').
     * @returns An object containing t-statistic, T-critical, and boolean result passed.
     */
    public tTestIndependent(
        otherColumn: NumberColumn,
        alpha: number,
        testDirection: 'left' | 'right' | 'two-sided'
    ): { T: number; t: number; passed: boolean } {
        return this.getCached(`tTestIndependent_${otherColumn}_${alpha}_${testDirection}`, () =>
            tTestIndependent(this.getValidValues(), otherColumn.getValidValues(), alpha, testDirection)
        );
    }

    /**
     * Performs a One-Way Analysis of Variance (ANOVA) combining this column with additional NumberColumn groups.
     *
     * @param otherColumns - Array of other sample groups as NumberColumn instances.
     * @param alpha - Significance level (e.g., 0.05).
     * @returns An object containing F-statistic, degrees of freedom, mean squares, critical bounds, and boolean result passed.
     */
    public oneWayAnova(
        otherColumns: NumberColumn[],
        alpha: number
    ): { F: number; msBetween: number; msWithin: number; criticalBounds: { lower?: number; upper?: number }; passed: boolean } {
        const groups = [this.getValidValues(), ...otherColumns.map(col => col.getValidValues())];
        return this.getCached(`oneWayAnova_${otherColumns.join('_')}_${alpha}`, () =>
            oneWayAnova(groups, alpha)
        );
    }

    /**
     * Performs Bartlett's test for homogeneity of variances across this column and additional NumberColumn groups.
     *
     * @param otherColumns - Array of other sample groups as NumberColumn instances.
     * @param alpha - Significance level (e.g., 0.05).
     * @returns An object containing chi2 statistic, critical bounds, and boolean result passed.
     */
    public bartlett(
        otherColumns: NumberColumn[],
        alpha: number
    ): { chi2: number; criticalBounds: { lower?: number; upper?: number }; passed: boolean } {
        const groups = [this.getValidValues(), ...otherColumns.map(col => col.getValidValues())];
        return this.getCached(`bartlett_${otherColumns.join('_')}_${alpha}`, () =>
            bartlett(groups, alpha)
        );
    }
}