import { describe, it, expect } from 'vitest';
import Regression from '../../core/inference/Regression.js';
import { lre } from '../../core/utils/numberUtils.js';

/**
 * NIST StRD - NoInt2.dat official dataset
 * Source: https://itl.nist.gov/div898/strd/lls/data/LINKS/DATA/NoInt2.dat
 * 
 * Data:   y       x
 *         3       4
 *         4       5
 *         4       6
 */
const yValues = [3, 4, 4];
const xValues = [4, 5, 6];

const CERTIFIED_NO_INTERCEPT = {
    b1: 0.727272727272727,
    rsd: 0.369274472937998
};

describe('Regression Class - Comprehensive Test Suite', () => {
    describe('NIST NoInt2 Benchmark - NoIntercept Models (b0 = 0 / b0 = 1)', () => {
        it('calculates linearNoItcpt (b1) matching NIST certified value (LRE >= 15)', () => {
            const regression = new Regression(xValues, yValues);
            const b1 = regression.linearNoItcpt();

            const b1Lre = lre(b1, CERTIFIED_NO_INTERCEPT.b1);
            expect(b1Lre).toBeGreaterThanOrEqual(15);
        });

        it('calculates RSDLinearNoItcpt matching NIST certified RSD value (LRE >= 15)', () => {
            const regression = new Regression(xValues, yValues);
            regression.linearNoItcpt();

            const rsd = regression.RSDLinearNoItcpt();
            const rsdLre = lre(rsd, CERTIFIED_NO_INTERCEPT.rsd);

            expect(rsdLre).toBeGreaterThanOrEqual(15);
        });
    });
});