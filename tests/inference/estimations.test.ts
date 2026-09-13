import { describe, it, expect } from 'vitest';
import type { Stratum } from '../../core/types/types';
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

describe('Statistical Estimation and Confidence Intervals (strict)', () => {
    describe('Mean Estimation (IID)', () => {
        const sample = [10, 12, 14, 15, 19];

        it('matches the exact known-sigma z-interval', () => {
            const ci = meanEstimationIIDwithSTD(sample, 0.05, 3.0);
            expect(ci.lower).toBeCloseTo(11.370432, 4);
            expect(ci.upper).toBeCloseTo(16.629568, 4);
        });

        it('matches the exact unknown-sigma t-interval', () => {
            const ci = meanEstimationIIDwithoutSTD(sample, 0.05);
            expect(ci.lower).toBeCloseTo(9.789313, 3);
            expect(ci.upper).toBeCloseTo(18.210687, 3);
        });
    });

    describe('Proportion Estimation', () => {
        it('matches the exact Wald interval (IID)', () => {
            const ci = proportionEstimationIID(0.5, 0.05, 100);
            expect(ci.lower).toBeCloseTo(0.402002, 4);
            expect(ci.upper).toBeCloseTo(0.597998, 4);
        });

        it('narrows relative to the IID interval once FPC is applied (SRS)', () => {
            const iid = proportionEstimationIID(0.5, 0.05, 100);
            const srs = proportionEstimationSRS(0.5, 0.05, 100, 1000);
            const iidWidth = iid.upper - iid.lower;
            const srsWidth = srs.upper - srs.lower;
            expect(srsWidth).toBeLessThan(iidWidth);
            expect(srs.lower).toBeGreaterThanOrEqual(0);
            expect(srs.upper).toBeLessThanOrEqual(1);
        });

        it('collapses to the IID interval as N grows very large (FPC -> 1)', () => {
            const iid = proportionEstimationIID(0.5, 0.05, 100);
            const srsHugeN = proportionEstimationSRS(0.5, 0.05, 100, 10_000_000);
            expect(srsHugeN.lower).toBeCloseTo(iid.lower, 3);
            expect(srsHugeN.upper).toBeCloseTo(iid.upper, 3);
        });
    });

    describe('SRS Mean Estimation with FPC', () => {
        const sample = [20, 22, 19, 24, 25];

        it('matches the exact known-sigma SRS interval', () => {
            const ci = meanEstimationSRSwithSTD(sample, 0.05, 4.0, 500);
            expect(ci.lower).toBeCloseTo(18.511484, 3);
            expect(ci.upper).toBeCloseTo(25.488516, 3);
        });

        it('matches the exact unknown-sigma SRS interval', () => {
            const ci = meanEstimationSRSwithoutSTD(sample, 0.05, 500);
            expect(ci.lower).toBeCloseTo(18.850233, 3);
            expect(ci.upper).toBeCloseTo(25.149767, 3);
        });

        it('is strictly narrower than the equivalent IID interval', () => {
            const srs = meanEstimationSRSwithSTD(sample, 0.05, 4.0, 500);
            const iid = meanEstimationIIDwithSTD(sample, 0.05, 4.0);
            expect(srs.upper - srs.lower).toBeLessThan(iid.upper - iid.lower);
        });
    });

    describe('Variance Estimation', () => {
        const sample = [5, 8, 12, 15, 20];

        it('matches the exact chi-square interval (IID)', () => {
            const ci = varianceEstimationIID(sample, 0.05);
            expect(ci.lower).toBeCloseTo(12.384138, 3);
            expect(ci.upper).toBeCloseTo(284.877608, 2);
        });

        it('produces the exact same interval as the IID variance CI (N is validation-only)', () => {
            const ci = varianceEstimationSRS(sample, 0.05, 200);
            const iid = varianceEstimationIID(sample, 0.05);
            expect(ci.lower).toBeCloseTo(iid.lower, 10);
            expect(ci.upper).toBeCloseTo(iid.upper, 10);
        });

        it('still validates N and n independently of the identical CI math', () => {
            expect(() => varianceEstimationSRS(sample, 0.05, 0)).toThrow(
                'Population size (N) must be greater than zero.'
            );
            expect(() => varianceEstimationSRS(sample, 0.05, 3)).toThrow(
                'Sample size cannot be greater than population size.'
            );
        });
    });

    describe('Stratified Sampling Estimations', () => {
        const strata: Stratum[] = [
            { label: 'Stratum 1', stratumSize: 400, samples: [10, 12, 14] },
            { label: 'Stratum 2', stratumSize: 600, samples: [20, 22, 24, 26] }
        ];

        it('matches the exact size-weighted stratified mean', () => {
            const meanVal = estimateStratifiedMean(strata);
            expect(meanVal).toBeCloseTo(18.6, 6);
        });

        it('matches the exact stratified total (N * weighted mean)', () => {
            const totalVal = estimateStratifiedTotal(strata);
            expect(totalVal).toBeCloseTo(18600, 4);
        });

        it('matches the exact stratified variance-of-the-mean estimate', () => {
            const varVal = estimateStratifiedVariance(strata);
            expect(varVal).toBeCloseTo(0.807733, 4);
        });
    });

    describe('Difference Between Two Means and Proportions', () => {
        const sample1 = [10, 12, 14, 16];
        const sample2 = [8, 9, 11, 13];

        it('matches the exact known-variance mean-difference CI', () => {
            const ci = getMeanDiffKnownVariance(sample1, sample2, 4, 4, 0.05);
            expect(ci.lower).toBeCloseTo(-0.021808, 3);
            expect(ci.upper).toBeCloseTo(5.521808, 3);
        });

        it('matches the exact pooled t mean-difference CI', () => {
            const ci = getMeanDiffPooledCI(sample1, sample2, 0.05);
            expect(ci.lower).toBeCloseTo(-1.413946, 3);
            expect(ci.upper).toBeCloseTo(6.913946, 3);
        });

        it('matches the exact proportion-difference CI', () => {
            const ci = getProportionDiff(40, 100, 30, 100, 0.05);
            expect(ci.lower).toBeCloseTo(-0.031478, 4);
            expect(ci.upper).toBeCloseTo(0.231478, 4);
        });

        it('matches the exact paired mean-difference CI', () => {
            const ci = getPairedMeanDiff([12, 15, 18], [10, 13, 15], 0.05);
            expect(ci.lower).toBeCloseTo(0.899116, 3);
            expect(ci.upper).toBeCloseTo(3.767551, 3);
        });
    });
});