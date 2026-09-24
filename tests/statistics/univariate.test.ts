import { describe, it, expect } from 'vitest';
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

describe('Statisztikai Függvények Tesztelése (Tört- és Egész Számok)', () => {
    const sampleData = new Float64Array([1.25, 2.5, 3.75, 4.2, 5.8]);

    describe('getDegreesOfFreedom', () => {
        it('should return population length when isSample is false', () => {
            expect(getDegreesOfFreedom(sampleData, false)).toBe(5);
        });

        it('should return N - 1 when isSample is true', () => {
            expect(getDegreesOfFreedom(sampleData, true)).toBe(4);
        });
    });

    describe('mean', () => {
        it('should calculate arithmetic mean correctly with mixed integer and float data', () => {
            expect(mean(sampleData)).toBeCloseTo(3.5, 5);
            expect(mean(new Float64Array([10.5, 20, 30.25]))).toBeCloseTo(20.25, 5);
            expect(mean(new Float64Array([2.5, 7.5, 10, 20.6]))).toBeCloseTo(10.15, 5);
            expect(mean(new Float64Array([-10.5, 0, 10.2, 20.8]))).toBeCloseTo(5.125, 5);
            expect(mean(new Float64Array([100.1, 200, 300.3, 400.4, 500]))).toBeCloseTo(300.16, 5);
        });

        it('should throw error on empty array', () => {
            expect(() => mean(new Float64Array([]))).toThrow('You should give at least one number!');
        });
    });

    describe('geometricMean', () => {
        it('should calculate geometric mean correctly with floats and integers', () => {
            expect(geometricMean(new Float64Array([2.5, 8.0]))).toBeCloseTo(4.47214, 5);
            expect(geometricMean(new Float64Array([1.5, 3, 9.25]))).toBeCloseTo(3.46565, 5);
            expect(geometricMean(new Float64Array([4.2, 16.8, 64]))).toBeCloseTo(16.52898, 5);
            expect(geometricMean(new Float64Array([10.5, 100, 1000.25]))).toBeCloseTo(101.64810, 5);
            expect(geometricMean(new Float64Array([1.5, 6, 24.8]))).toBeCloseTo(6.06594, 5);
        });

        it('should throw error on non-positive values', () => {
            expect(() => geometricMean(new Float64Array([0, 2.5, 4]))).toThrow('Geometric mean requires strictly positive numbers!');
        });
    });

    describe('weightedMean', () => {
        it('should calculate weighted mean correctly with floats and integers', () => {
            expect(weightedMean(new Float64Array([10.5, 20]), new Float64Array([1.5, 3]))).toBeCloseTo(16.83333, 5);
            expect(weightedMean(new Float64Array([1.2, 2.4, 3, 4.8]), new Float64Array([0.5, 1, 1.5, 2]))).toBeCloseTo(3.42, 5);
            expect(weightedMean(new Float64Array([10, 20.5, 30.25]), new Float64Array([0.2, 0.3, 0.5]))).toBeCloseTo(23.275, 5);
            expect(weightedMean(new Float64Array([5.5, 15, 25.25]), new Float64Array([2.5, 1, 1]))).toBeCloseTo(12.0, 5);
            expect(weightedMean(new Float64Array([100.5, 200, 300.25]), new Float64Array([1, 2.5, 1]))).toBeCloseTo(200.16667, 5);
        });

        it('should throw error if lengths mismatch or weights sum to zero', () => {
            expect(() => weightedMean(new Float64Array([1.5, 2]), new Float64Array([1]))).toThrow('The number of weights should be the same as the number of values!');
            expect(() => weightedMean(new Float64Array([1.5, 2]), new Float64Array([1.5, -1.5]))).toThrow('The sum of weights cannot be zero!');
        });
    });

    describe('harmonicMean', () => {
        it('should calculate weighted harmonic mean correctly with floats and integers', () => {
            expect(harmonicMean(new Float64Array([10.5, 20]), new Float64Array([1.5, 1]))).toBeCloseTo(12.96296, 5);
            expect(harmonicMean(new Float64Array([1.2, 2.5, 4]), new Float64Array([1, 1.5, 1]))).toBeCloseTo(2.07921, 5);
            expect(harmonicMean(new Float64Array([5.5, 10, 20.25]), new Float64Array([1, 2.5, 1]))).toBeCloseTo(9.35160, 5);
            expect(harmonicMean(new Float64Array([2.5, 3.5, 6]), new Float64Array([1, 1, 1]))).toBeCloseTo(3.51955, 5);
            expect(harmonicMean(new Float64Array([10.2, 30, 60.5]), new Float64Array([2, 1, 2.5]))).toBeCloseTo(20.31514, 5);
        });

        it('should throw error on non-positive values or weights', () => {
            expect(() => harmonicMean(new Float64Array([0, 2.5]), new Float64Array([1, 1]))).toThrow('Harmonic mean requires strictly positive values!');
            expect(() => harmonicMean(new Float64Array([1.5, 2]), new Float64Array([0, 1]))).toThrow('Harmonic mean requires strictly positive weights!');
        });
    });

    describe('ssd & variance & std', () => {
        it('should calculate sum of squared deviations (ssd) correctly with floats', () => {
            expect(ssd(new Float64Array([1.25, 2.5, 3.75, 4.2, 5.8]))).toBeCloseTo(11.905, 5);
            expect(ssd(new Float64Array([2.5, 4, 6.25, 8.75]))).toBeCloseTo(22.3125, 5);
            expect(ssd(new Float64Array([10.1, 20.2, 30.3]))).toBeCloseTo(204.02, 5);
            expect(ssd(new Float64Array([5.5, 5.5, 5.5]))).toBe(0);
            expect(ssd(new Float64Array([-2.5, -1, 0, 1.25, 2]))).toBeCloseTo(12.8, 5);
        });

        it('should calculate population and sample variance correctly with floats and integers', () => {
            expect(variance(new Float64Array([1.25, 2.5, 3.75, 4.2, 5.8]), false)).toBeCloseTo(2.381, 5);
            expect(variance(new Float64Array([1.25, 2.5, 3.75, 4.2, 5.8]), true)).toBeCloseTo(2.97625, 5);
            expect(variance(new Float64Array([10.5, 20, 30.25]), false)).toBeCloseTo(65.04167, 5);
            expect(variance(new Float64Array([10.5, 20, 30.25]), true)).toBeCloseTo(97.5625, 5);
            expect(variance(new Float64Array([2.5, 4, 4.5, 4.5, 55.25, 5, 5.75, 7, 9]), true)).toBeCloseTo(280.89063, 5);
        });

        it('should calculate standard deviation correctly with floats and integers', () => {
            expect(std(new Float64Array([1.25, 2.5, 3.75, 4.2, 5.8]), false)).toBeCloseTo(1.54305, 5);
            expect(std(new Float64Array([1.25, 2.5, 3.75, 4.2, 5.8]), true)).toBeCloseTo(1.72518, 5);
            expect(std(new Float64Array([10.5, 20, 30.25]), true)).toBeCloseTo(9.87737, 5);
            expect(std(new Float64Array([10.5, 20, 30.25]), false)).toBeCloseTo(8.06484, 5);
            expect(std(new Float64Array([100.25, 200, 300.75, 400.5]), true)).toBeCloseTo(129.29335, 5);
            expect(() => std(new Float64Array([5.5]), true)).toThrow('Sample statistics require at least two numbers!');
        });
    });

    describe('Percentiles & Quartiles (percentile, median, q1-q4)', () => {
        const floatData = new Float64Array([10.25, 20.5, 30.75, 40.0, 50.8]);

        it('should calculate percentiles and median accurately with floats and integers', () => {
            expect(median(floatData)).toBe(30.75);
            expect(q1(floatData)).toBe(20.5);
            expect(q3(floatData)).toBe(40.0);
            expect(q4(floatData)).toBe(50.8);
            expect(percentile(floatData, 0.5)).toBe(30.75);
            expect(median(new Float64Array([1.25, 2.5, 3.75, 4.5]))).toBe(3.125);
            expect(q1(new Float64Array([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]))).toBeCloseTo(3.3, 5);
            expect(q3(new Float64Array([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]))).toBeCloseTo(7.7, 5);
            expect(percentile(new Float64Array([0.5, 100.25]), 0.1)).toBeCloseTo(10.475, 5);
        });

        it('should throw error on invalid percent bounds', () => {
            expect(() => percentile(floatData, 1.5)).toThrow('The given percentage should be between 0 and 1!');
        });
    });

    describe('mode', () => {
        it('should find single or multiple modes with floats and integers', () => {
            expect(mode(new Float64Array([1.25, 2.5, 2.5, 3]))).toEqual(new Float64Array([2.5]));
            expect(mode(new Float64Array([1.1, 1.1, 2.5, 2.5, 3]))).toEqual(new Float64Array([1.1, 2.5]));
            expect(mode(new Float64Array([5.5, 5.5, 5.5, 1, 2.25]))).toEqual(new Float64Array([5.5]));
            expect(mode(new Float64Array([1.25, 2, 3.5, 3.5, 4.1, 4.1]))).toEqual(new Float64Array([3.5, 4.1]));
            expect(mode(new Float64Array([10.5, 10.5, 10.5, 20, 20, 30.25]))).toEqual(new Float64Array([10.5]));
        });

        it('should return empty array if all elements have uniform frequency', () => {
            expect(mode(new Float64Array([1.2, 2.5, 3]))).toEqual(new Float64Array([]));
        });
    });

    describe('Skewness and Kurtosis', () => {
        const skewedData1 = new Float64Array([1.25, 2.5, 2.5, 3.75, 10.5]);
        const skewedData2 = new Float64Array([1.1, 5.25, 7.5, 10, 23.4, 44.8]);
        const skewedData3 = new Float64Array([11, 12.45, 4.2, 5.1, 20.2, 25.8, 19.6]);
        const skewedData4 = new Float64Array([2.25, 3.5, 5, 7.75, 11.2, 13, 17.8, 19.1]);
        const skewedData5 = new Float64Array([10.5, 12, 12, 14.25, 18.5, 24]);

        it('should calculate Pearson, Bowley, and Kelly skewness accurately with floats and integers', () => {
            expect(pearsonMeSkewness(skewedData1, false)).toBeCloseTo(1.45622, 5);
            expect(bowleySkewness(skewedData1)).toBe(1);
            expect(kellySkewness(skewedData1)).toBeCloseTo(0.75207, 5);
            expect(bowleySkewness(skewedData2)).toBeCloseTo(0.58736, 5);
            expect(pearsonMeSkewness(skewedData5, false)).toBeCloseTo(1.33350, 5);
        });

        it('should calculate central moments, skewness, and excess kurtosis accurately with floats and integers', () => {
            expect(centralMoment(skewedData1, 2)).toBeCloseTo(naiveCentralDeviationsSum(skewedData1, 2), 5);
            expect(centralMoment(skewedData1, 3)).toBeCloseTo(naiveCentralDeviationsSum(skewedData1, 3), 5);
            expect(centralMoment(skewedData1, 4)).toBeCloseTo(naiveCentralDeviationsSum(skewedData1, 4), 5);

            expect(skewness(skewedData1)).toBeCloseTo(1.92105, 5);
            expect(excessKurtosis(skewedData1)).toBeCloseTo(3.90577, 5);
            expect(skewness(skewedData2)).toBeCloseTo(1.49358, 5);
            expect(excessKurtosis(skewedData2)).toBeCloseTo(1.82825, 5);
            expect(skewness(skewedData3)).toBeCloseTo(0.13975, 5);
            expect(excessKurtosis(skewedData3)).toBeCloseTo(-1.39060, 5);

            expect(skewness(skewedData4)).toBeCloseTo(0.30803, 5);
            expect(excessKurtosis(skewedData4)).toBeCloseTo(-1.46721, 5);
            expect(skewness(skewedData5)).toBeCloseTo(1.20562, 5);
            expect(excessKurtosis(skewedData5)).toBeCloseTo(0.59601, 5);
        });

        it('should throw error for zero-variance dataset in skewness/kurtosis', () => {
            expect(() => skewness(new Float64Array([5.5, 5.5, 5.5]))).toThrow('Cannot calculate skewness for constant or zero-variance dataset.');
            expect(() => excessKurtosis(new Float64Array([5.5, 5.5, 5.5]))).toThrow('Cannot calculate excess kurtosis for constant or zero-variance dataset.');
        });
    });

    describe('Range, IQR, RSD, and MSE', () => {
        it('should calculate range correctly with floats and integers', () => {
            expect(range(new Float64Array([2.25, 5, 10.75]))).toBeCloseTo(8.5, 5);
            expect(range(new Float64Array([1.1, 1.1, 1.1]))).toBe(0);
            expect(range(new Float64Array([-10.5, 0, 10.25]))).toBeCloseTo(20.75, 5);
            expect(range(new Float64Array([100.1, 500.5, 200]))).toBeCloseTo(400.4, 5);
            expect(range(new Float64Array([1.5, 2.8, 9.1]))).toBeCloseTo(7.6, 5);
        });

        it('should calculate IQR correctly with floats and integers', () => {
            expect(iqr(new Float64Array([10.25, 20.5, 30.75, 40.0, 50.8]))).toBeCloseTo(19.5, 5);
            expect(iqr(new Float64Array([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9]))).toBeCloseTo(4.4, 5);
            expect(iqr(new Float64Array([2.5, 4, 6.25, 8.5, 10, 12.75]))).toBeCloseTo(5.0625, 5);
            expect(iqr(new Float64Array([100.5, 200, 300.25, 400, 500.75, 600, 700.5]))).toBeCloseTo(300.25, 5);
            expect(iqr(new Float64Array([1.5, 1.5, 1.5, 1.5, 1.5]))).toBe(0);
        });

        it('should calculate relative standard deviation (RSD) with floats and integers', () => {
            expect(rsd(new Float64Array([10.5, 20, 30.25]), false)).toBeCloseTo(0.39826, 5);
            expect(rsd(new Float64Array([10.5, 20, 30.25]), true)).toBeCloseTo(0.48777, 5);
            expect(rsd(new Float64Array([100.25, 200, 300.75, 400.5]), false)).toBeCloseTo(0.44721, 5);
            expect(rsd(new Float64Array([5.5, 5.5, 5.5]), false)).toBe(0);
            expect(rsd(new Float64Array([2.5, 4, 6.25, 8.5]), true)).toBeCloseTo(0.49412, 5);
            expect(() => rsd(new Float64Array([0, 0, 0]), false)).toThrow('Cannot calculate relative standard deviation with the mean of zero!');
        });

        it('should calculate Mean Squared Error (MSE) with floats and integers', () => {
            expect(mse(new Float64Array([1.5, 2.5, 3.5]), new Float64Array([1.5, 2.5, 3.5]))).toBe(0);
            expect(mse(new Float64Array([1.25, 2.5, 3.75]), new Float64Array([2, 2, 2]))).toBeCloseTo(1.29167, 5);
            expect(mse(new Float64Array([10.5, 20.25, 30]), new Float64Array([12, 18.5, 33.1]))).toBeCloseTo(4.97417, 5);
            expect(mse(new Float64Array([0, 0, 0]), new Float64Array([2.5, 2.5, 2.5]))).toBeCloseTo(6.25, 5);
            expect(mse(new Float64Array([1.5, 2.5, 3.5]), new Float64Array([1.0, 2.0, 3.0]))).toBe(0.25);
            expect(() => mse(new Float64Array([1.5, 2]), new Float64Array([1]))).toThrow('The number of actual values must match the number of predicted values.');
        });
    });
});