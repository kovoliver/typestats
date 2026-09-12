import { describe, it, expect } from 'vitest';
import { mean, variance, std } from '../../core/statistics/univariate.js';
import { lre } from '../../core/utils/numberUtils.js';

/**
 * NIST StRD - NumAcc4.dat dataset (1001 observations)
 * Source: https://itl.nist.gov/div898/strd/univ/data/NumAcc4.dat
 */
const numAcc4Data: number[] = [10000000.2];

for (let i = 0; i < 250; i++) {
    numAcc4Data.push(10000000.1);
    numAcc4Data.push(10000000.3);
}

const CERTIFIED_NUMACC4 = {
    mean: 10000000.2,
    std: 0.1,
    variance: 0.01
};

describe('Univariate Statistics - NIST NumAcc4 Benchmark Test', () => {
    it('calculates mean with high numerical accuracy (LRE >= 15)', () => {
        const computedMean = mean(numAcc4Data);
        const score = lre(computedMean, CERTIFIED_NUMACC4.mean);

        expect(score).toBeGreaterThanOrEqual(15);
    });

    it('calculates sample variance with high numerical accuracy (LRE >= 7)', () => {
        const computedVariance = variance(numAcc4Data);
        const score = lre(computedVariance, CERTIFIED_NUMACC4.variance);

        expect(score).toBeGreaterThanOrEqual(7);
    });

    it('calculates standard deviation with high numerical accuracy (LRE >= 8)', () => {
        const computedStd = std(numAcc4Data);
        const score = lre(computedStd, CERTIFIED_NUMACC4.std);

        expect(score).toBeGreaterThanOrEqual(8);
    });
});