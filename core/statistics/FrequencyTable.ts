import { isInteger } from "../utils/numberUtils";

export default class FrequencyTable {
    private _frequencies: number[];
    private _classIntervals: [number, number][];
    private _midPoints: number[];
    private _cumFreq: number[] | null = null;
    private _relFreq: number[] | null = null;
    private _cumRelFreq: number[] | null = null;
    private _valueSums: number[] | null = null;
    private _cumValueSums: number[] | null = null;
    private _relValueSums: number[] | null = null;
    private _cumRelValueSums: number[] | null = null;
    private _length: number;
    private _frequency: number;
    private _avg: number | null = null;
    private _ssd: number | null = null;
    private _popVariance: number | null = null;
    private _sampleVariance: number | null = null;
    private _popStd: number | null = null;
    private _sampleStd: number | null = null;

    /**
     * Creates an instance of FrequencyTable.
     *
     * @param classIntervals - Array of tuple pairs representing lower and upper bounds for each class interval.
     * @param frequencies - Array of frequency counts for each corresponding class interval.
     * @throws {Error} If `classIntervals` and `frequencies` arrays do not have equal lengths.
     */
    constructor(classIntervals: [number, number][], frequencies: number[]) {
        if (classIntervals.length !== frequencies.length) {
            throw new Error('Class intervals and frequencies must contain the same number of values!');
        }

        this._classIntervals = classIntervals;
        this._frequencies = frequencies;
        this._length = frequencies.length;
        this._frequency = frequencies.reduce((total, val) => total + val, 0);
        this._midPoints = this.calcMidpoints();
    }

    private calcMidpoints(): number[] {
        return this._classIntervals.map(interval => (interval[0] + interval[1]) / 2);
    }

    /**
     * Gets the midpoints for each class interval.
     *
     * @returns An array containing the calculated midpoints of each class interval.
     */
    public get midPoints(): number[] {
        return this._midPoints;
    }

    /**
     * Gets the raw frequency counts for each class interval.
     *
     * @returns An array containing the frequencies of each class interval.
     */
    public get frequencies(): number[] {
        return this._frequencies;
    }

    /**
     * Gets the cumulative frequencies across all class intervals.
     *
     * @returns An array of cumulative frequency sums.
     */
    public get cumulativeFrequencies(): number[] {
        if (this._cumFreq !== null) return this._cumFreq;

        this._cumFreq = [];
        let sum = 0;
        for (const freq of this._frequencies) {
            sum += freq;
            this._cumFreq.push(sum);
        }
        return this._cumFreq;
    }

    /**
     * Gets the relative frequencies (proportions) for each class interval.
     *
     * @returns An array of relative frequencies.
     */
    public get relativeFrequencies(): number[] {
        if (this._relFreq !== null) return this._relFreq;

        this._relFreq = this._frequencies.map(freq => (this._frequency !== 0 ? freq / this._frequency : 0));
        return this._relFreq;
    }

    /**
     * Gets the cumulative relative frequencies across all class intervals.
     *
     * @returns An array of cumulative relative frequencies.
     */
    public get cumulativeRelativeFrequencies(): number[] {
        if (this._cumRelFreq !== null) return this._cumRelFreq;

        this._cumRelFreq = [];
        let sum = 0;
        for (const relFreq of this.relativeFrequencies) {
            sum += relFreq;
            this._cumRelFreq.push(sum);
        }
        return this._cumRelFreq;
    }

    /**
     * Gets the estimated sum of values for each class interval (midpoint multiplied by frequency).
     *
     * @returns An array of value sums per class interval.
     */
    public get valueSums(): number[] {
        if (this._valueSums !== null) return this._valueSums;

        this._valueSums = this._midPoints.map((mid, i) => mid * this._frequencies[i]);
        return this._valueSums;
    }

    /**
     * Gets the cumulative sum of value sums across all class intervals.
     *
     * @returns An array of cumulative value sums.
     */
    public get cumulativeValueSums(): number[] {
        if (this._cumValueSums !== null) return this._cumValueSums;

        this._cumValueSums = [];
        let sum = 0;
        for (const valueSum of this.valueSums) {
            sum += valueSum;
            this._cumValueSums.push(sum);
        }
        return this._cumValueSums;
    }

    /**
     * Gets the total sum of all values across all class intervals.
     *
     * @returns The grand total value sum.
    */
    public get valueSum(): number {
        const cumSums = this.cumulativeValueSums;
        return cumSums.length > 0 ? cumSums[this._length - 1] : 0;
    }

    /**
     * Gets the relative contribution of each class interval's value sum to the grand total value sum.
     *
     * @returns An array of relative value sums.
     */
    public get relativeValueSums(): number[] {
        if (this._relValueSums !== null) return this._relValueSums;

        const totalValueSum = this.valueSum;
        this._relValueSums = this.valueSums.map(
            valSum => (totalValueSum !== 0 ? valSum / totalValueSum : 0)
        );
        return this._relValueSums;
    }

    /**
     * Gets the cumulative relative value sums across all class intervals.
     *
     * @returns An array of cumulative relative value sums.
     */
    public get cumulativeRelativeValueSums(): number[] {
        if (this._cumRelValueSums !== null) return this._cumRelValueSums;

        const totalValueSum = this.valueSum;
        this._cumRelValueSums = this.cumulativeValueSums.map(
            cumSum => (totalValueSum !== 0 ? cumSum / totalValueSum : 0)
        );
        return this._cumRelValueSums;
    }

    /**
     * Gets the total frequency count (total population or sample size, N).
     *
     * @returns The total sum of all frequencies.
     */
    public get frequency(): number {
        return this._frequency;
    }

    /**
     * Gets the sample degrees of freedom (N - 1).
     *
     * @returns The sample frequency (total frequency minus 1, clamped to a minimum of 0).
     */
    public get sampleFrequency(): number {
        return Math.max(0, this._frequency - 1);
    }

    /**
     * Gets the estimated arithmetic mean derived from class midpoints and frequencies.
     *
     * @returns The estimated mean value.
     */
    public get avg(): number {
        if (this._avg === null) {
            this._avg = this._frequency !== 0 ? this.valueSum / this._frequency : 0;
        }
        return this._avg;
    }

    /**
     * Gets the sum of squared deviations (SSD) from the mean.
     *
     * @returns The sum of squared deviations.
     */
    public get ssd(): number {
        if (this._ssd === null) {
            this._ssd = this._midPoints.reduce(
                (total, mp, i) => total + Math.pow(mp - this.avg, 2) * this._frequencies[i],
                0
            );
        }
        return this._ssd;
    }

    /**
     * Gets the population variance (divided by N).
     *
     * @returns The population variance.
     */
    public get variance(): number {
        if (this._popVariance === null) {
            this._popVariance = this._frequency !== 0 ? this.ssd / this._frequency : 0;
        }
        return this._popVariance;
    }

    /**
     * Gets the sample variance (divided by N - 1).
     *
     * @returns The sample variance.
     */
    public get sampleVariance(): number {
        if (this._sampleVariance === null) {
            this._sampleVariance = this.sampleFrequency > 0 ? this.ssd / this.sampleFrequency : 0;
        }
        return this._sampleVariance;
    }

    /**
     * Gets the population standard deviation.
     *
     * @returns The population standard deviation.
     */
    public get std(): number {
        if (this._popStd === null) {
            this._popStd = Math.sqrt(this.variance);
        }
        return this._popStd;
    }

    /**
     * Gets the sample standard deviation.
     *
     * @returns The sample standard deviation.
     */
    public get sampleStd(): number {
        if (this._sampleStd === null) {
            this._sampleStd = Math.sqrt(this.sampleVariance);
        }
        return this._sampleStd;
    }

    /**
     * Calculates the relative standard deviation (coefficient of variation).
     *
     * @param [isSample=false] - Whether to use sample standard deviation instead of population standard deviation.
     * @returns The relative standard deviation (standard deviation divided by absolute mean).
     */
    public relativeStd(isSample: boolean = false): number {
        if (this.avg === 0) return 0;
        const s = isSample ? this.sampleStd : this.std;
        return s / Math.abs(this.avg);
    }

    /**
     * Calculates the k-th central moment for the frequency distribution.
     *
     * @param k - The order of the central moment to compute.
     * @param [isSample=false] - Whether to use sample frequency (N - 1) as denominator instead of population frequency (N).
     * @returns The calculated k-th central moment.
     */
    public centralMoment(k: number, isSample: boolean = false): number {
        const sum = this._midPoints.reduce(
            (total, mp, i) => total + Math.pow(mp - this.avg, k) * this._frequencies[i],
            0
        );
        const denom = isSample ? this.sampleFrequency : this._frequency;
        return denom > 0 ? sum / denom : 0;
    }

    /**
     * Calculates the skewness coefficient of the frequency distribution.
     *
     * @param [isSample=false] - Whether to use sample statistics.
     * @returns The skewness coefficient. Returns 0 if standard deviation is zero.
     */
    public skewness(isSample: boolean = false): number {
        const s = isSample ? this.sampleStd : this.std;
        if (s === 0) return 0;

        return this.centralMoment(3, isSample) / Math.pow(s, 3);
    }

    /**
     * Calculates the kurtosis of the frequency distribution.
     *
     * @param [isSample=false] - Whether to use sample statistics.
     * @returns The kurtosis value. Returns 0 if standard deviation is zero.
     */
    public kurtosis(isSample: boolean = false): number {
        const s = isSample ? this.sampleStd : this.std;
        if (s === 0) return 0;

        return this.centralMoment(4, isSample) / Math.pow(s, 4);
    }

    /**
     * Calculates the excess kurtosis (kurtosis - 3) of the frequency distribution.
     *
     * @param [isSample=false] - Whether to use sample statistics.
     * @returns The excess kurtosis value. Returns 0 if standard deviation is zero.
     */
    public excessKurtosis(isSample: boolean = false): number {
        const s = isSample ? this.sampleStd : this.std;
        if (s === 0) return 0;

        return this.kurtosis(isSample) - 3;
    }

    /**
     * Gets the total range span across all class intervals (upper bound of last interval minus lower bound of first interval).
     *
     * @returns The total range value.
     */
    public get range(): number {
        if (this._classIntervals.length === 0) return 0;
        const min = this._classIntervals[0][0];
        const max = this._classIntervals[this._length - 1][1];
        return max - min;
    }

    /**
     * Gets the estimated mode(s) calculated via linear interpolation within modal class interval(s).
     *
     * @returns An array of estimated mode values. Returns an empty array if all frequencies are equal or zero.
     */
    public get modes(): number[] {
        const maxValue = Math.max(...this._frequencies);
        const allEqual = this._frequencies.every(f => f === maxValue);

        if (maxValue === 0 || allEqual) {
            return [];
        }

        const modeIndices = this._frequencies
            .map((f, i) => (f === maxValue ? i : -1))
            .filter(i => i !== -1);

        return modeIndices.map(modeIndex => {
            const fPrev = modeIndex > 0 ? this._frequencies[modeIndex - 1] : 0;
            const fNext = modeIndex < this._length - 1 ? this._frequencies[modeIndex + 1] : 0;

            const k1 = maxValue - fPrev;
            const k2 = maxValue - fNext;

            const [lowerBound, upperBound] = this._classIntervals[modeIndex];
            const hmo = upperBound - lowerBound;

            if (k1 + k2 === 0) {
                return (lowerBound + upperBound) / 2;
            }

            return lowerBound + (k1 / (k1 + k2)) * hmo;
        });
    }

    /**
     * Calculates a k/n-th quantile value using linear interpolation within class intervals.
     *
     * @param n - Total number of equal parts (e.g., 4 for quartiles, 100 for percentiles).
     * @param k - The specific quantile part index to calculate (1 <= k < n).
     * @returns The interpolated quantile value.
     * @throws {Error} If `n` or `k` are not integers, if `n <= 0`, or if `k` is out of bounds (`k <= 0` or `k >= n`).
     */
    public kvantile(n: number, k: number): number {
        if (!isInteger(n) || !isInteger(k)) {
            throw new Error('Quantile parameters n and k must be integers!');
        }

        if (n <= 0) {
            throw new Error('Quantile value n must be greater than zero!');
        }

        if (k <= 0 || k >= n) {
            throw new Error('k must be greater than 0 and less than n!');
        }

        const position = (this._frequency / n) * k;

        const index = this.cumulativeFrequencies.findIndex(
            cf => cf >= position
        );

        if (index === -1) {
            throw new Error('Invalid quantile position!');
        }

        const prev = index > 0
            ? this.cumulativeFrequencies[index - 1]
            : 0;

        const classFrequency = this._frequencies[index];
        const [lowerBound, upperBound] = this._classIntervals[index];
        const hme = upperBound - lowerBound;

        if (classFrequency === 0) return lowerBound;

        return lowerBound + ((position - prev) / classFrequency) * hme;
    }

    /**
     * Gets the interpolated median (50th percentile / 2nd quartile) value.
     *
     * @returns The estimated median value.
     */
    public get median(): number {
        return this.kvantile(2, 1);
    }

    /**
     * Gets the interpolated first quartile (Q1 / 25th percentile) value.
     *
     * @returns The estimated first quartile value.
     */
    public get q1(): number {
        return this.kvantile(4, 1);
    }

    /**
     * Gets the interpolated third quartile (Q3 / 75th percentile) value.
     *
     * @returns The estimated third quartile value.
     */
    public get q3(): number {
        return this.kvantile(4, 3);
    }

    /**
     * Gets the interquartile range (IQR, Q3 - Q1).
     *
     * @returns The interquartile range value.
     */
    public get iqr(): number {
        return this.q3 - this.q1;
    }

    /**
     * Gets an aggregated object containing all calculated frequency table vectors and summary series.
     *
     * @returns An object containing `midPoints`, `frequencies`, `cumulativeFrequencies`, `relativeFrequencies`, `cumulativeRelativeFrequencies`, `valueSums`, `cumulativeValueSums`, `relativeValueSums`, and `cumulativeRelativeValueSums`.
     */
    public get frequencyTable() {
        return {
            midPoints: this._midPoints,
            frequencies: this._frequencies,
            cumulativeFrequencies: this.cumulativeFrequencies,
            relativeFrequencies: this.relativeFrequencies,
            cumulativeRelativeFrequencies: this.cumulativeRelativeFrequencies,
            valueSums: this.valueSums,
            cumulativeValueSums: this.cumulativeValueSums,
            relativeValueSums: this.relativeValueSums,
            cumulativeRelativeValueSums: this.cumulativeRelativeValueSums,
        };
    }
}