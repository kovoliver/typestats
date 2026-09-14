import {
    getDegreesOfFreedom,
    mean,
    geometricMean,
    weightedMean,
    harmonicMean,
    ssd,
    variance,
    std,
    percentile,
    median,
    q1,
    q3,
    q4,
    mode,
    pearsonMeSkewness,
    bowleySkewness,
    kellySkewness,
    centralMoment,
    excessKurtosis,
    skewness,
    range,
    iqr,
    rsd,
    mse,
    naiveCentralDeviationsSum
} from "../../core/statistics/univariate";

describe('Statisztikai Függvények Tesztelése', () => {
    const sampleData = [1, 2, 3, 4, 5];

    describe('getDegreesOfFreedom', () => {
        it('should return population length when isSample is false', () => {
            expect(getDegreesOfFreedom(sampleData, false)).toBe(5);
        });

        it('should return N - 1 when isSample is true', () => {
            expect(getDegreesOfFreedom(sampleData, true)).toBe(4);
        });
    });

    describe('mean', () => {
        it('should calculate arithmetic mean correctly', () => {
            expect(mean(sampleData)).toBe(3);
            expect(mean([10, 20, 30], 1)).toBe(20);
        });

        it('should throw error on empty array', () => {
            expect(() => mean([])).toThrow('You should give at least one number!');
        });
    });

    describe('geometricMean', () => {
        it('should calculate geometric mean correctly', () => {
            expect(geometricMean([2, 8])).toBe(4);
        });

        it('should throw error on non-positive values', () => {
            expect(() => geometricMean([0, 2, 4])).toThrow('Geometric mean requires strictly positive numbers!');
        });
    });

    describe('weightedMean', () => {
        it('should calculate weighted mean correctly', () => {
            expect(weightedMean([10, 20], [1, 3])).toBe(17.5);
        });

        it('should throw error if lengths mismatch or weights sum to zero', () => {
            expect(() => weightedMean([1, 2], [1])).toThrow('The number of weights should be the same as the number of values!');
            expect(() => weightedMean([1, 2], [1, -1])).toThrow('The sum of weights cannot be zero!');
        });
    });

    describe('harmonicMean', () => {
        it('should calculate weighted harmonic mean correctly', () => {
            expect(harmonicMean([10, 20], [1, 1])).toBeCloseTo(13.3333, 4);
        });

        it('should throw error on non-positive values or weights', () => {
            expect(() => harmonicMean([0, 2], [1, 1])).toThrow('Harmonic mean requires strictly positive values!');
            expect(() => harmonicMean([1, 2], [0, 1])).toThrow('Harmonic mean requires strictly positive weights!');
        });
    });

    describe('ssd & variance & std', () => {
        it('should calculate sum of squared deviations correctly', () => {
            expect(ssd([1, 2, 3, 4, 5])).toBe(10);
        });

        it('should calculate population and sample variance correctly', () => {
            expect(variance([1, 2, 3, 4, 5], false)).toBe(2);
            expect(variance([1, 2, 3, 4, 5], true)).toBe(2.5);
        });

        it('should calculate standard deviation correctly', () => {
            expect(std([1, 2, 3, 4, 5], false)).toBeCloseTo(Math.sqrt(2), 5);
            expect(() => std([5], true)).toThrow('Sample statistics require at least two numbers!');
        });
    });

    describe('Percentiles & Quartiles (percentile, median, q1-q4)', () => {
        const data = [10, 20, 30, 40, 50];

        it('should calculate percentiles and median accurately', () => {
            expect(median(data)).toBe(30);
            expect(q1(data)).toBe(20);
            expect(q3(data)).toBe(40);
            expect(q4(data)).toBe(50);
            expect(percentile(data, 0.5)).toBe(30);
        });

        it('should throw error on invalid percent bounds', () => {
            expect(() => percentile(data, 1.5)).toThrow('The given percentage should be between 0 and 1!');
        });
    });

    describe('mode', () => {
        it('should find single or multiple modes', () => {
            expect(mode([1, 2, 2, 3])).toEqual([2]);
            expect(mode([1, 1, 2, 2, 3])).toEqual([1, 2]);
        });

        it('should return empty array if all elements have uniform frequency', () => {
            expect(mode([1, 2, 3])).toEqual([]);
        });
    });

    describe('Skewness and Kurtosis', () => {
        const skewedData = [1, 2, 2, 3, 10];
        const skewedData2 = [1, 5, 7, 10, 23, 44];

        it('should calculate Pearson, Bowley, and Kelly skewness accurately', () => {
            expect(pearsonMeSkewness(skewedData, false)).toBeCloseTo(1.4715, 4);
            expect(bowleySkewness(skewedData)).toBe(1);
            expect(kellySkewness(skewedData)).toBeCloseTo(0.7931, 4);
        });

        it('should calculate central moments, skewness, and excess kurtosis accurately', () => {
            // 1. Terribery vs Naive internal accumulator verification
            expect(centralMoment(skewedData, 2)).toBeCloseTo(naiveCentralDeviationsSum(skewedData, 2), 5);
            expect(centralMoment(skewedData, 3)).toBeCloseTo(naiveCentralDeviationsSum(skewedData, 3), 5);
            expect(centralMoment(skewedData, 4)).toBeCloseTo(naiveCentralDeviationsSum(skewedData, 4), 5);

            // 2. SPSS Type-2 sample shape parameters verification
            expect(skewness(skewedData)).toBeCloseTo(2.029, 2);
            expect(excessKurtosis(skewedData)).toBeCloseTo(4.272, 2);

            expect(skewness(skewedData2)).toBeCloseTo(1.485, 2);
            expect(excessKurtosis(skewedData2)).toBeCloseTo(1.790, 2);
        });

        it('should throw error for zero-variance dataset in skewness/kurtosis', () => {
            expect(() => skewness([5, 5, 5])).toThrow('Cannot calculate skewness for constant or zero-variance dataset.');
            expect(() => excessKurtosis([5, 5, 5])).toThrow('Cannot calculate excess kurtosis for constant or zero-variance dataset.');
        });
    });

    describe('Range, IQR, RSD, and MSE', () => {
        it('should calculate range and IQR correctly', () => {
            expect(range([2, 5, 10])).toBe(8);
            expect(iqr([10, 20, 30, 40, 50])).toBe(20);
        });

        it('should calculate relative standard deviation (RSD)', () => {
            expect(rsd([10, 20, 30], false)).toBeCloseTo(0.4082, 4);
            expect(() => rsd([0, 0, 0], false)).toThrow('Cannot calculate relative standard deviation with the mean of zero!');
        });

        it('should calculate Mean Squared Error (MSE)', () => {
            expect(mse([1, 2, 3], [1, 2, 3])).toBe(0);
            expect(mse([1, 2, 3], [2, 2, 2])).toBe(2 / 3);
            expect(() => mse([1, 2], [1])).toThrow('The number of actual values must match the number of predicted values.');
        });
    });
});