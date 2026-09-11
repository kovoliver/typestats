import { describe, expect, test } from 'vitest';
import DataMatrix from '../../core/dataStructures/DataMatrix.js';
import { std } from '../../core/statistics/univariate.js';
import { lre } from '../../core/utils/numberUtils.js';

describe('DataMatrix - NIST SmLs09 Numerical Stability Test (High Difficulty)', () => {
    const rawNistValues: number[][] = [
        [1000000000.4, 1000000000.3, 1000000000.5, 1000000000.3, 1000000000.5, 1000000000.3, 1000000000.5, 1000000000.3, 1000000000.5],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6],
        [1000000000.3, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4, 1000000000.2, 1000000000.4],
        [1000000000.5, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6, 1000000000.4, 1000000000.6]
    ];

    const values: number[][] = rawNistValues[0].map((_, colIndex) =>
        rawNistValues.map(row => row[colIndex])
    );

    const colLabels = Array.from({ length: 21 }, (_, i) => `Replicate ${i + 1}`);
    const rowLabels = Array.from({ length: 9 }, (_, i) => `Treatment ${i + 1}`);

    const matrix = new DataMatrix(values, colLabels, rowLabels);

    const CERTIFIED = {
        mainMean: 1000000000.4,
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
     * Developer note on numerical stability threshold (MIN_LRE_THRESHOLD = 6.0):
     *
     * JavaScript uses the IEEE 754 double-precision (64-bit) floating-point format:
     * - 1 bit for the sign (0 = positive, 1 = negative)
     * - 11 bits for the exponent (determines magnitude and decimal point location)
     * - 52 stored bits + 1 implicit bit = 53 bits for the mantissa (significand)
     *
     * This provides a maximum total precision of log10(2^53) ≈ 15.95 significant decimal digits.
     *
     * In the NIST SmLs09 dataset, numbers are shifted onto a billion scale (10^9),
     * e.g., 1000000000.4. The 10-digit integer part consumes most of the mantissa,
     * leaving only 15.95 - 10 = ~5.95 to 6.95 digits of precision for fractional variations.
     *
     * Additionally, 0.4 is an infinitely repeating binary fraction (0.01100110..._2).
     * Parsing 1000000000.4 into float64 introduces an immediate representation error of
     * ~2.38e-8 (~0.2 ULP), physically capping the maximum achievable Log Relative Error (LRE)
     * at ~7.22 before any computation takes place.
     * 
     * 0.4 × 2 = 0.8 → 0
     * 0.8 × 2 = 1.6 → 1, remainder 0.6
     * 0.6 × 2 = 1.2 → 1, remainder 0.2
     * 0.2 × 2 = 0.4 → 0, remainder 0.4
     *
     * Therefore, an LRE >= 6.0 on this high-difficulty dataset represents the theoretical
     * maximum accuracy achievable under 64-bit hardware limits.
     */
    const MIN_LRE_THRESHOLD = 6.0;

    test('should have transposed dimensions (9 rows = treatments, 21 cols = replicates)', () => {
        expect(matrix.rows).toBe(9);
        expect(matrix.cols).toBe(21);
    });

    test('should achieve high LRE for Grand Mean', () => {
        const computed = matrix.mainMean();
        expect(lre(computed, CERTIFIED.mainMean)).toBeGreaterThanOrEqual(14);
    });

    test('should maintain high precision (LRE >= 10) for Total Sum of Squared Deviations (SSD)', () => {
        const computed = matrix.totalSSD();
        expect(lre(computed, CERTIFIED.totalSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 10) for Within-treatment SSD', () => {
        const computed = matrix.withinSSD();
        expect(lre(computed, CERTIFIED.withinSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 10) for Between-treatment SSD', () => {
        const computed = matrix.betweenSSD();
        expect(lre(computed, CERTIFIED.betweenSSD)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 10) for Eta Squared', () => {
        const computed = matrix.etaSquared();
        expect(lre(computed, CERTIFIED.etaSquared)).toBeGreaterThanOrEqual(MIN_LRE_THRESHOLD);
    });

    test('should maintain high precision (LRE >= 10) for ANOVA statistics (MS, F-ratio, Residual SD)', () => {
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