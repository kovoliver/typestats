import Column from "./Column";
import { getMax, getMin, isOutlier, toNumberArray } from '../utils/utils';
import { mean, variance, ssd, range, skewness, excessKurtosis, percentile, q1, median, q3, iqr }
    from '../statistics/univariate';
import { standardizeValues, normalizeValues, replaceOutliers, replaceEmptyValues, isInvalidValue }
    from '../dataPreparation/dataPreparation';
import { Boundaries, ImputeType, PercentMode } from "../types/types";
import { correlation, covariance } from "../statistics/bivariate";
import Regression from "../inference/Regression";
import Trend from "../inference/Trend";
import { orderAsc, orderDesc } from '../utils/numberUtils';

export default class NumberColumn extends Column<number> {
    private regression: Regression | null = null;
    private trend: Trend | null = null;

    /**
     * Creates an instance of NumberColumn.
     *
     * @param {unknown[]} values - The raw input array of values to be converted and processed.
     * @param {string} label - The label or title identifier for the column.
     */
    constructor(values: unknown[], label: string) {
        super(values, label);
    }

    /**
     * Converts raw unknown input data into an array of numeric or null values.
     *
     * @protected
     * @param {unknown[]} rawValues - The raw input values.
     * @returns {(number | null)[]} An array of processed numeric values or nulls for missing/invalid entries.
     */
    protected prepareData(rawValues: unknown[]): (number | null)[] {
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
    public standardize(): void {
        this._values = standardizeValues(this._values as number[]) as number[];
        this.clearCache();
    }

    /**
     * Normalizes the values in the column in-place using Min-Max scaling to a [0, 1] range.
     * Clears cached calculations.
     *
     * @throws {Error} Throws an error if the column contains invalid or missing values (`NaN`/`null`).
     */
    public normalize(): void {
        this._values = normalizeValues(this._values as number[]) as number[];
        this.clearCache();
    }

    /**
     * Replaces values falling outside specified boundaries in-place using a statistical imputation strategy.
     * Preserves existing missing/NaN values. Clears cached calculations.
     *
     * @param {ImputeType} type - The imputation method ('MEAN', 'MEDIAN', 'MODE').
     * @param {Boundaries} boundaries - The threshold boundaries (`min` and/or `max`) for identifying outliers.
     */
    public replaceOutliers(type: ImputeType, boundaries: Boundaries): void {
        this._values = replaceOutliers(this._values as number[], type, boundaries);
        this.clearCache();
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
    ): void {
        const boundaries = this.getIqrBoundaries(multiplier, percentMode);
        this.replaceOutliers(type, boundaries);
        this.clearCache();
    }

    /**
     * Replaces empty, null, or NaN values in the column in-place using a statistical imputation strategy.
     * Clears cached calculations.
     *
     * @param {ImputeType} type - The imputation method ('MEAN', 'MEDIAN', 'MODE').
     */
    public replaceEmptyValues(type: ImputeType): void {
        this._values = replaceEmptyValues(this._values as number[], type) as number[];
        this.clearCache();
    }

    public getImputedValues(type: ImputeType) {
        return replaceEmptyValues(this._values as number[], type) as number[];
    }

    /**
     * Removes rows (values) that fall outside specified threshold boundaries in-place and clears cached calculations.
     * 
     * @param {Boundaries} boundaries - The lower (`min`) and upper (`max`) threshold boundaries.
     */
    public removeInvalidRows(boundaries: Boundaries) {
        this._values = this.filterValues((val) => !isInvalidValue(
            (val as number), boundaries)
        );
        this.clearCache();
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
        this._values = this.filterValues(val => !isInvalidValue(val, boundaries));
        this.clearCache();
    }

    /**
     * Evaluates column values against threshold boundaries and returns the row indices that are valid.
     * Does not mutate internal column state.
     * 
     * @param {Boundaries} boundaries - The lower (`min`) and upper (`max`) threshold boundaries.
     * @returns {number[]} An array of original zero-based row indices that pass boundary validation.
     */
    public filterIndicesByBoundaries(boundaries: Boundaries): number[] {
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
    ): number[] {
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
    public linearRegression(column: NumberColumn): { b0: number, b1: number } {
        this.regression = new Regression(
            this._values as number[],
            column.values as number[]
        );

        return this.regression.linear();
    }

    /**
     * Fits an exponential regression model ($y = b_0 \cdot e^{b_1 \cdot x}$) between this column (X) and a target column (Y).
     *
     * @param {NumberColumn} column - The target dependent column (Y).
     * @returns {{ b0: number, b1: number }} An object containing the base parameter (`b0`) and growth rate (`b1`).
     * @throws {Error} Throws if dependent values contain non-positive numbers.
     */
    public exponentialRegression(column: NumberColumn): { b0: number, b1: number } {
        this.regression = new Regression(
            this._values as number[],
            column.values as number[]
        );

        return this.regression.exponential();
    }

    /**
     * Fits a power regression model ($y = b_0 \cdot x^{b_1}$) between this column (X) and a target column (Y).
     *
     * @param {NumberColumn} column - The target dependent column (Y).
     * @returns {{ b0: number, b1: number }} An object containing the proportionality constant (`b0`) and exponent (`b1`).
     * @throws {Error} Throws if independent or dependent values contain non-positive numbers.
     */
    public powerRegression(column: NumberColumn): { b0: number, b1: number } {
        this.regression = new Regression(
            this._values as number[],
            column.values as number[]
        );

        return this.regression.power();
    }

    /**
     * Calculates and caches the linear time-series trend of the column values.
     *
     * @returns {any} The fitted linear trend parameters or series.
     */
    public linearTrend() {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached('linear_trend', () => this.trend?.linear());
    }

    /**
     * Calculates and caches the exponential time-series trend of the column values.
     *
     * @returns {any} The fitted exponential trend parameters or series.
     */
    public exponentialTrend() {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached('exponential_trend', () => this.trend?.exponential());
    }

    /**
     * Calculates and caches the logarithmic time-series trend of the column values.
     *
     * @returns {any} The fitted logarithmic trend parameters or series.
     */
    public logarithmicTrend() {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached('logarithmic_trend', () => this.trend?.logarithmic());
    }

    /**
     * Calculates and caches a polynomial time-series trend of a specified degree.
     *
     * @param {number} degree - The polynomial degree (e.g., 2 for quadratic, 3 for cubic).
     * @returns {any} The fitted polynomial trend parameters or series.
     */
    public polynomialTrend(degree: number) {
        if (this.trend === null) {
            this.trend = new Trend(this.getValidValues());
        }

        return this.getCached(`polynomial_trend_${degree}`, () => this.trend?.polynomial(degree));
    }

    /**
     * Sorts the values of the column in ascending order in-place.
     * Clears cached calculations.
     */
    public orderAsc() {
        this._values = orderAsc(this._values as number[]);
        this.clearCache();
    }

    /**
     * Sorts the values of the column in descending order in-place.
     * Clears cached calculations.
     */
    public orderDesc() {
        this._values = orderDesc(this._values as number[]);
        this.clearCache();
    }
}