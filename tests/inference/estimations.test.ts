import { describe, it, expect } from 'vitest';
import type { Stratum } from '../../core/types'; // Adjust path if needed
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
} from '../../core/inference/estimations';

describe('Statistical Estimation and Confidence Intervals', () => {
    describe('Mean Estimation (IID)', () => {
        const sample = [10, 12, 14, 15, 19];

        it('should calculate IID confidence interval with known standard deviation', () => {
            const ci = meanEstimationIIDwithSTD(sample, 0.05, 3.0);
            expect(ci.lower).toBeLessThan(ci.upper);
            expect(ci.lower).toBeCloseTo(11.37, 1);
            expect(ci.upper).toBeCloseTo(16.63, 1);
        });

        it('should throw error for non-positive sigma in known STD estimation', () => {
            expect(() => meanEstimationIIDwithSTD(sample, 0.05, 0)).toThrowError(
                'Population standard deviation (sigma) must be greater than zero.'
            );
        });

        it('should calculate IID confidence interval with unknown standard deviation (t-distribution)', () => {
            const ci = meanEstimationIIDwithoutSTD(sample, 0.05);
            expect(ci.lower).toBeLessThan(ci.upper);
            expect(ci.lower).toBeLessThan(14);
            expect(ci.upper).toBeGreaterThan(14);
        });

        it('should throw error if sample size is less than 2 for unknown STD', () => {
            expect(() => meanEstimationIIDwithoutSTD([10], 0.05)).toThrowError(
                "Calculating the Student's t-distribution requires at least 2 sample values."
            );
        });
    });

    describe('Proportion Estimation', () => {
        it('should calculate IID proportion estimation correctly', () => {
            const ci = proportionEstimationIID(0.5, 0.05, 100);
            expect(ci.lower).toBeGreaterThanOrEqual(0);
            expect(ci.upper).toBeLessThanOrEqual(1);
            expect(ci.lower).toBeCloseTo(0.402, 2);
            expect(ci.upper).toBeCloseTo(0.598, 2);
        });

        it('should throw error for invalid proportion parameters', () => {
            expect(() => proportionEstimationIID(1.5, 0.05, 50)).toThrowError(
                'Sample proportion (p) must be between 0 and 1.'
            );
            expect(() => proportionEstimationIID(0.5, 0.05, 0)).toThrowError(
                'Sample size (n) must be a positive integer.'
            );
        });

        it('should calculate SRS proportion estimation using FPC', () => {
            const ci = proportionEstimationSRS(0.5, 0.05, 100, 1000);
            expect(ci.lower).toBeGreaterThanOrEqual(0);
            expect(ci.upper).toBeLessThanOrEqual(1);
        });
    });

    describe('SRS Mean Estimation with FPC', () => {
        const sample = [20, 22, 19, 24, 25];

        it('should estimate SRS mean with known STD', () => {
            const ci = meanEstimationSRSwithSTD(sample, 0.05, 4.0, 500);
            expect(ci.lower).toBeLessThan(ci.upper);
        });

        it('should estimate SRS mean with unknown STD', () => {
            const ci = meanEstimationSRSwithoutSTD(sample, 0.05, 500);
            expect(ci.lower).toBeLessThan(ci.upper);
        });
    });

    describe('Variance Estimation', () => {
        const sample = [5, 8, 12, 15, 20];

        it('should calculate IID variance confidence interval', () => {
            const ci = varianceEstimationIID(sample, 0.05);
            expect(ci.lower).toBeLessThan(ci.upper);
            expect(ci.lower).toBeGreaterThan(0);
        });

        it('should calculate SRS variance confidence interval with valid population size', () => {
            const ci = varianceEstimationSRS(sample, 0.05, 200);
            expect(ci.lower).toBeLessThan(ci.upper);
        });

        it('should throw error if population size is invalid or smaller than sample', () => {
            expect(() => varianceEstimationSRS(sample, 0.05, 0)).toThrowError(
                'Population size (N) must be greater than zero.'
            );
            expect(() => varianceEstimationSRS(sample, 0.05, 3)).toThrowError(
                'Sample size cannot be greater than population size.'
            );
        });
    });

    describe('Stratified Sampling Estimations', () => {
        const strata: Stratum[] = [
            { label: 'Stratum 1', stratumSize: 400, samples: [10, 12, 14] },
            { label: 'Stratum 2', stratumSize: 600, samples: [20, 22, 24, 26] }
        ];

        it('should estimate stratified mean correctly', () => {
            const meanVal = estimateStratifiedMean(strata);
            expect(typeof meanVal).toBe('number');
            expect(meanVal).toBeGreaterThan(0);
        });

        it('should estimate stratified total correctly', () => {
            const totalVal = estimateStratifiedTotal(strata);
            expect(typeof totalVal).toBe('number');
            expect(totalVal).toBeGreaterThan(0);
        });

        it('should estimate stratified variance correctly', () => {
            const varVal = estimateStratifiedVariance(strata);
            expect(typeof varVal).toBe('number');
            expect(varVal).toBeGreaterThanOrEqual(0);
        });

        it('should throw error if total population size is zero across strata', () => {
            const emptyStrata: Stratum[] = [{ label: 'Empty', stratumSize: 0, samples: [1, 2] }];
            expect(() => estimateStratifiedMean(emptyStrata)).toThrowError(
                'Total population size across all strata must be greater than zero.'
            );
        });
    });

    describe('Difference Between Two Means and Proportions', () => {
        const sample1 = [10, 12, 14, 16];
        const sample2 = [8, 9, 11, 13];

        it('should calculate mean difference CI with known variances', () => {
            const ci = getMeanDiffKnownVariance(sample1, sample2, 4, 4, 0.05);
            expect(ci.lower).toBeLessThan(ci.upper);
        });

        it('should throw error on negative variances or empty samples', () => {
            expect(() => getMeanDiffKnownVariance([], sample2, 4, 4, 0.05)).toThrowError(
                'Both samples must contain at least 1 element.'
            );
            expect(() => getMeanDiffKnownVariance(sample1, sample2, -1, 4, 0.05)).toThrowError(
                'Variances (var1, var2) cannot be negative!'
            );
        });

        it('should calculate pooled mean difference CI (t-distribution)', () => {
            const ci = getMeanDiffPooledCI(sample1, sample2, 0.05);
            expect(ci.lower).toBeLessThan(ci.upper);
        });

        it('should calculate proportion difference CI', () => {
            const ci = getProportionDiff(40, 100, 30, 100, 0.05);
            expect(ci.lower).toBeLessThan(ci.upper);
        });

        it('should throw error for invalid proportion difference inputs', () => {
            expect(() => getProportionDiff(-1, 100, 30, 100, 0.05)).toThrowError(
                'k1 must be between 0 and n1'
            );
            expect(() => getProportionDiff(40, 0, 30, 100, 0.05)).toThrowError(
                'Sample sizes (n1, n2) must be strictly greater than 0.'
            );
        });

        it('should calculate paired mean difference CI', () => {
            const ci = getPairedMeanDiff([12, 15, 18], [10, 13, 15], 0.05);
            expect(ci.lower).toBeLessThan(ci.upper);
        });

        it('should throw error on mismatched paired sample lengths', () => {
            expect(() => getPairedMeanDiff([1, 2], [1], 0.05)).toThrowError(
                'Paired samples must have the exact same length!'
            );
        });
    });
});