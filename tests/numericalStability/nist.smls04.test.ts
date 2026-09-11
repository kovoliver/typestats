import { describe, expect, test } from 'vitest';
import DataMatrix from '../../core/dataStructures/DataMatrix.js';
import { std } from '../../core/statistics/univariate.js';
import { lre } from '../../core/utils/numberUtils.js';

describe('DataMatrix - NIST SmLs04 Numerical Stability Test (Medium Difficulty)', () => {
    const rawNistValues: number[][] = [
        [1000000.4, 1000000.3, 1000000.5, 1000000.3, 1000000.5, 1000000.3, 1000000.5, 1000000.3, 1000000.5],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6],
        [1000000.3, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4, 1000000.2, 1000000.4],
        [1000000.5, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6, 1000000.4, 1000000.6]
    ];

    const values: number[][] = rawNistValues[0].map((_, colIndex) =>
        rawNistValues.map(row => row[colIndex])
    );

    const colLabels = Array.from({ length: 21 }, (_, i) => `Replicate ${i + 1}`);
    const rowLabels = Array.from({ length: 9 }, (_, i) => `Treatment ${i + 1}`);

    const matrix = new DataMatrix(values, colLabels, rowLabels);

    const CERTIFIED = {
        mainMean: 1000000.4,
        totalSSD: 3.48,
        withinSSD: 1.80,
        betweenSSD: 1.68,
        etaSquared: 0.482758620689655,
        betweenMS: 0.21,
        withinMS: 0.01,
        fStat: 21.0,
        residualSD: 0.1
    };

    /**
     * Developer note on numerical stability threshold (MIN_LRE_THRESHOLD = 8.0):
     *
     * In the NIST SmLs04 dataset, numbers are shifted onto a million scale (10^6),
     * e.g., 1000000.4. The 7-digit integer part consumes 7 decimal digits of the
     * 53-bit IEEE 754 mantissa (~15.95 digits total), leaving 15.95 - 7 = ~8.95
     * digits of precision for fractional variations.
     *
     * An LRE threshold >= 8.0 confirms near-optimal numerical precision under 64-bit limits.
     */
    const MIN_LRE_THRESHOLD = 8.0;

    test('should have transposed dimensions (9 rows = treatments, 21 cols = replicates)', () => {
        expect(matrix.rows).toBe(9);
        expect(matrix.cols).toBe(21);
    });

    test('should achieve high LRE for Grand Mean', () => {
        const computed = matrix.mainMean();
        expect(lre(computed, CERTIFIED.mainMean)).toBeGreaterThanOrEqual(14);
    });

    test('should maintain high precision (LRE >= 8.0) for Total Sum of Squared Deviations (SSD)', () => {
        const computed = matrix.totalSSD();
        expect(lre(computed, CERTIFIED.totalSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 8.0) for Within-treatment SSD', () => {
        const computed = matrix.withinSSD();
        expect(lre(computed, CERTIFIED.withinSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 8.0) for Between-treatment SSD', () => {
        const computed = matrix.betweenSSD();
        expect(lre(computed, CERTIFIED.betweenSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 8.0) for Eta Squared', () => {
        const computed = matrix.etaSquared();
        expect(lre(computed, CERTIFIED.etaSquared)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 8.0) for ANOVA statistics (MS, F-ratio, Residual SD)', () => {
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

    test('should calculate standard deviation of individual treatment row accurately', () => {
        const treatment1 = values[0];
        expect(lre(std(treatment1), CERTIFIED.residualSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });
});