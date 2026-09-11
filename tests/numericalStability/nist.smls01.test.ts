import { describe, expect, test } from 'vitest';
import DataMatrix from '../../core/dataStructures/DataMatrix.js';
import { std } from '../../core/statistics/univariate.js';
import { lre } from '../../core/utils/numberUtils.js';

describe('DataMatrix - NIST SmLs01 Numerical Stability Test (Low Difficulty)', () => {
    const rawNistValues: number[][] = [
        [0.4, 0.3, 0.5, 0.3, 0.5, 0.3, 0.5, 0.3, 0.5],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6],
        [0.3, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4, 0.2, 0.4],
        [0.5, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6, 0.4, 0.6]
    ];

    const values: number[][] = rawNistValues[0].map((_, colIndex) =>
        rawNistValues.map(row => row[colIndex])
    );

    const colLabels = Array.from({ length: 21 }, (_, i) => `Replicate ${i + 1}`);
    const rowLabels = Array.from({ length: 9 }, (_, i) => `Treatment ${i + 1}`);

    const matrix = new DataMatrix(values, colLabels, rowLabels);

    const CERTIFIED = {
        mainMean: 0.4,
        totalSSD: 3.48,
        withinSSD: 1.80,
        betweenSSD: 1.68,
        etaSquared: 1.68 / 3.48,
        betweenMS: 0.21,
        withinMS: 0.01,
        fStat: 21.0,
        residualSD: 0.1
    };

    /**
     * Developer note on numerical stability threshold (MIN_LRE_THRESHOLD = 14.0):
     *
     * In the NIST SmLs01 dataset, numbers are unshifted on a 10^0 scale (e.g., 0.4).
     * Since there is no large integer constant, zero bits are consumed by integer scale shift,
     * allowing full utilization of the 53-bit IEEE 754 mantissa (~15.95 decimal digits).
     *
     * An LRE threshold >= 15.0 confirms maximum hardware precision.
     */
    const MIN_LRE_THRESHOLD = 15.0;

    test('should have transposed dimensions (9 rows = treatments, 21 cols = replicates)', () => {
        expect(matrix.rows).toBe(9);
        expect(matrix.cols).toBe(21);
    });

    test('should achieve near-perfect LRE for Grand Mean', () => {
        const computed = matrix.mainMean();
        expect(lre(computed, CERTIFIED.mainMean)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain maximum precision (LRE >= 15.0) for Total Sum of Squared Deviations (SSD)', () => {
        const computed = matrix.totalSSD();
        expect(lre(computed, CERTIFIED.totalSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain maximum precision (LRE >= 15.0) for Within-treatment SSD', () => {
        const computed = matrix.withinSSD();
        expect(lre(computed, CERTIFIED.withinSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain maximum precision (LRE >= 15.0) for Between-treatment SSD', () => {
        const computed = matrix.betweenSSD();
        expect(lre(computed, CERTIFIED.betweenSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain maximum precision (LRE >= 15.0) for Eta Squared', () => {
        const computed = matrix.etaSquared();
        expect(lre(computed, CERTIFIED.etaSquared)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain maximum precision (LRE >= 15.0) for ANOVA statistics (MS, F-ratio, Residual SD)', () => {
        const betweenDF = matrix.rows - 1;
        const totalN = matrix.rows * matrix.cols;
        const withinDF = totalN - matrix.rows;

        const betweenMS = matrix.betweenSSD() / betweenDF;
        const withinMS = matrix.withinSSD() / withinDF;
        const fStat = betweenMS / withinMS;
        const residualSD = Math.sqrt(withinMS);

        expect(lre(betweenMS, CERTIFIED.betweenMS)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
        expect(lre(withinMS, CERTIFIED.withinMS)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
        expect(lre(fStat, CERTIFIED.fStat)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
        expect(lre(residualSD, CERTIFIED.residualSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should calculate standard deviation of individual treatment row with maximum accuracy', () => {
        const treatment1 = values[0];
        expect(lre(std(treatment1), CERTIFIED.residualSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });
});