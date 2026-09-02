import { describe, it, expect } from 'vitest';
import {
    getPassed, zTest, tTest, zTestProportion, chi2Test, chi2FitTest,
    chiSquaredIndependenceTest, zTestTwoSamples, tTestTwoSamples,
    twoSampleAsymptoticZMeanTest, zTestProportionTwoSamples, fTestTwoSamples,
    tTestIndependent, oneWayAnova, bartlett
} from '../../core/inference/hypothesis';

describe('Hypothesis Testing Functions', () => {
    describe('getPassed', () => {
        it('returns correct boolean for left test direction', () => {
            expect(getPassed(-1.645, -2.0, 'left')).toBe(false);
            expect(getPassed(-1.645, -1.0, 'left')).toBe(true);
        });

        it('returns correct boolean for right test direction', () => {
            expect(getPassed(1.645, 2.0, 'right')).toBe(false);
            expect(getPassed(1.645, 1.0, 'right')).toBe(true);
        });

        it('returns correct boolean for two-sided test direction', () => {
            expect(getPassed(1.96, 2.5, 'two-sided')).toBe(false);
            expect(getPassed(1.96, -2.5, 'two-sided')).toBe(false);
            expect(getPassed(1.96, 1.5, 'two-sided')).toBe(true);
        });

        it('throws an error for invalid test direction', () => {
            expect(() => getPassed(1.96, 1.0, 'invalid' as any)).toThrowError(/Invalid test direction/);
        });
    });

    describe('zTest', () => {
        it('throws if sample is empty', () => {
            expect(() => zTest([], 1, 0.05, 0, 'two-sided')).toThrowError(/contain at least one value/);
        });

        it('throws if sigma is not strictly positive', () => {
            expect(() => zTest([1, 2, 3], 0, 0.05, 0, 'two-sided')).toThrowError(/strictly positive/);
        });

        it('calculates Z test statistic correctly', () => {
            const result = zTest([1, 2, 3], 1.5, 0.05, 0, 'two-sided');
            expect(result.z).toBeCloseTo(2.3094, 4);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });
    });

    describe('tTest', () => {
        it('throws if sample size is less than 2', () => {
            expect(() => tTest([1], 0.05, 0, 'two-sided')).toThrowError(/contain at least two values/);
        });

        it('throws if sample standard deviation is zero', () => {
            expect(() => tTest([2, 2, 2], 0.05, 0, 'two-sided')).toThrowError(/cannot be zero/);
        });

        it('calculates t test statistic correctly', () => {
            const result = tTest([1, 2, 3], 0.05, 0, 'two-sided');
            expect(result.t).toBeCloseTo(3.4641, 4);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });
    });

    describe('zTestProportion', () => {
        it('throws for invalid population proportion', () => {
            expect(() => zTestProportion(0, 0.5, 100, 0.05, 'two-sided')).toThrowError(/strictly between 0 and 1/);
            expect(() => zTestProportion(1, 0.5, 100, 0.05, 'two-sided')).toThrowError(/strictly between 0 and 1/);
        });

        it('throws for invalid sample proportion', () => {
            expect(() => zTestProportion(0.5, -0.1, 100, 0.05, 'two-sided')).toThrowError(/between 0 and 1/);
        });

        it('throws if sample size is less than or equal to zero', () => {
            expect(() => zTestProportion(0.5, 0.6, 0, 0.05, 'two-sided')).toThrowError(/greater than 0/);
        });

        it('calculates Z test for proportion correctly', () => {
            const result = zTestProportion(0.5, 0.6, 100, 0.05, 'two-sided');
            expect(result.z).toBeCloseTo(2.0, 4);
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.Z).toBe('number');
        });
    });

    describe('chi2Test', () => {
        it('throws if hypothetical variance is less than or equal to 0', () => {
            expect(() => chi2Test([1, 2, 3], 0, 0.05, 'right')).toThrowError(/strictly greater than 0/);
        });

        it('calculates chi2 test correctly', () => {
            const result = chi2Test([1, 2, 3], 1, 0.05, 'right');
            expect(result.chi2).toBeCloseTo(2.0, 4);
            expect(typeof result.passed).toBe('boolean');
            expect(result.criticalBounds).toBeDefined();
        });
    });

    describe('chi2FitTest', () => {
        it('throws if arrays have different lengths', () => {
            expect(() => chi2FitTest([10, 20], [10, 20, 30], 0.05)).toThrowError(/same length/);
        });

        it('throws if expected frequencies are less than or equal to 0', () => {
            expect(() => chi2FitTest([10, 20], [10, 0], 0.05)).toThrowError(/strictly greater than 0/);
        });

        it('calculates chi2 goodness-of-fit correctly', () => {
            const result = chi2FitTest([10, 20], [15, 15], 0.05);
            expect(result.chi2).toBeCloseTo(3.3333, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('chiSquaredIndependenceTest', () => {
        it('throws on invalid contingency table dimensions', () => {
            expect(() => chiSquaredIndependenceTest([[10, 20]], 0.05)).toThrowError(/at least 2 rows/);
            expect(() => chiSquaredIndependenceTest([[10], [20]], 0.05)).toThrowError(/at least 2 columns/);
        });

        it('calculates chi2 independence test correctly', () => {
            const result = chiSquaredIndependenceTest([[20, 10], [10, 20]], 0.05);
            expect(result.chi2).toBeCloseTo(6.6667, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('zTestTwoSamples', () => {
        it('throws on empty samples', () => {
            expect(() => zTestTwoSamples([], [1], 1, 1, 0.05, 'two-sided')).toThrowError(/at least one element/);
        });

        it('throws on non-positive population variances', () => {
            expect(() => zTestTwoSamples([1], [1], 0, 1, 0.05, 'two-sided')).toThrowError(/strictly greater than 0/);
        });

        it('calculates two sample Z test correctly', () => {
            const result = zTestTwoSamples([1, 2, 3], [3, 4, 5], 1, 1, 0.05, 'two-sided');
            expect(result.z).toBeCloseTo(-2.4495, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('tTestTwoSamples', () => {
        it('throws if samples are too small', () => {
            expect(() => tTestTwoSamples([1], [1, 2], 0.05, 'two-sided')).toThrowError(/at least two elements/);
        });

        it('calculates Welch t-test correctly (unequal variances)', () => {
            const result = tTestTwoSamples([1, 2, 3], [3, 4, 5], 0.05, 'two-sided', false);
            expect(result.t).toBeCloseTo(-2.4495, 4);
            expect(typeof result.passed).toBe('boolean');
        });

        it('calculates Student t-test correctly (equal variances)', () => {
            const result = tTestTwoSamples([1, 2, 3], [3, 4, 5], 0.05, 'two-sided', true);
            expect(result.t).toBeCloseTo(-2.4495, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('twoSampleAsymptoticZMeanTest', () => {
        it('throws if standard error is zero', () => {
            expect(() => twoSampleAsymptoticZMeanTest([1, 1], [1, 1], 0.05, 'two-sided')).toThrowError(/Standard error is zero/);
        });

        it('calculates asymptotic Z test correctly', () => {
            const result = twoSampleAsymptoticZMeanTest([1, 2, 3], [3, 4, 5], 0.05, 'two-sided');
            expect(result.z).toBeCloseTo(-2.4495, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('zTestProportionTwoSamples', () => {
        it('throws on invalid proportions', () => {
            expect(() => zTestProportionTwoSamples(-0.1, 10, 0.5, 10, 0.05, 'two-sided')).toThrowError(/between 0 and 1/);
        });

        it('calculates two sample proportion Z test without difference correctly', () => {
            const result = zTestProportionTwoSamples(0.6, 100, 0.4, 100, 0.05, 'two-sided');
            expect(result.z).toBeCloseTo(2.8284, 4);
            expect(typeof result.passed).toBe('boolean');
        });

        it('calculates two sample proportion Z test with difference correctly', () => {
            const result = zTestProportionTwoSamples(0.6, 100, 0.4, 100, 0.05, 'two-sided', 0.1);
            expect(result.z).toBeCloseTo(1.4434, 4);
        });
    });

    describe('fTestTwoSamples', () => {
        it('throws if second sample variance is zero', () => {
            expect(() => fTestTwoSamples([1, 2], [1, 1], 0.05, 'two-sided')).toThrowError(/variance of the second sample is zero/);
        });

        it('calculates F test correctly', () => {
            const result = fTestTwoSamples([1, 2, 3], [1, 3, 5], 0.05, 'right');
            expect(result.F).toBeCloseTo(0.25, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('tTestIndependent', () => {
        it('calculates independent t-test correctly', () => {
            const result = tTestIndependent([1, 2, 3], [3, 4, 5], 0.05, 'two-sided');
            expect(typeof result.t).toBe('number');
            expect(result.t).not.toBeNaN();
            expect(typeof result.passed).toBe('boolean');
            expect(typeof result.T).toBe('number');
        });
    });

    describe('oneWayAnova', () => {
        it('throws if less than two groups', () => {
            expect(() => oneWayAnova([[1, 2, 3]], 0.05)).toThrowError(/At least two groups/);
        });

        it('calculates ANOVA statistics correctly', () => {
            const result = oneWayAnova([[1, 2, 3], [3, 4, 5], [5, 6, 7]], 0.05);
            expect(result.msBetween).toBeCloseTo(12, 4);
            expect(result.msWithin).toBeCloseTo(1, 4);
            expect(result.F).toBeCloseTo(12, 4);
            expect(typeof result.passed).toBe('boolean');
        });
    });

    describe('bartlett', () => {
        it('throws if group size is less than 2', () => {
            expect(() => bartlett([[1], [2, 3]], 0.05)).toThrowError(/at least two elements/);
        });

        it('throws if group variance is zero', () => {
            expect(() => bartlett([[1, 1], [2, 2]], 0.05)).toThrowError(/zero or negative/);
        });

        it('calculates Bartlett test correctly', () => {
            const result = bartlett([[1, 2, 3], [1, 3, 5]], 0.05);
            expect(result.chi2).toBeCloseTo(0.714, 3);
            expect(typeof result.passed).toBe('boolean');
        });
    });
});