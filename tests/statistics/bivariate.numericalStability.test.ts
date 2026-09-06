import { describe, it, expect } from 'vitest';
import { covariance, correlation } from '../../core/statistics/bivariate';

describe('Bivariate Numerical Stability Tests', () => {

    // ============================================================
    // 1. CATASTROPHIC CANCELLATION
    // ============================================================

    describe('High-Offset Covariance and Correlation', () => {
        const X = [
            1_000_000_000.1,
            1_000_000_000.2,
            1_000_000_000.3,
            1_000_000_000.4
        ];

        const Y = [
            2_000_000_000.2,
            2_000_000_000.4,
            2_000_000_000.6,
            2_000_000_000.8
        ];

        // Y = 2X
        //
        // X deviations: -0.15, -0.05, +0.05, +0.15
        // Y deviations: -0.30, -0.10, +0.10, +0.30
        //
        // Sum of cross-deviations = 0.10
        // Sample covariance = 0.10 / 3

        it('should calculate sample covariance with small relative error at high magnitude', () => {
            const expected = 0.1 / 3;
            const actual = covariance(X, Y, true);

            const relativeError = Math.abs(actual - expected) / Math.abs(expected);
            expect(relativeError).toBeLessThan(1e-6);
        });

        it('should calculate perfect positive correlation', () => {
            expect(correlation(X, Y, true))
                .toBeCloseTo(1, 12);
        });

        const YNegative = [
            2_000_000_000.8,
            2_000_000_000.6,
            2_000_000_000.4,
            2_000_000_000.2
        ];

        it('should calculate perfect negative correlation', () => {
            expect(correlation(X, YNegative, true))
                .toBeCloseTo(-1, 12);
        });
    });


    // ============================================================
    // 2. TRANSLATION INVARIANCE
    // ============================================================

    describe('Translation Invariance', () => {
        const X = [1, 2, 3, 4, 5];
        const Y = [2, 4, 6, 8, 10];

        const shiftedX = X.map(x => x + 1_000_000_000_000);
        const shiftedY = Y.map(y => y + 2_000_000_000_000);

        it('should preserve covariance when both variables are shifted', () => {
            expect(covariance(shiftedX, shiftedY, true))
                .toBeCloseTo(covariance(X, Y, true), 10);
        });

        it('should preserve correlation when both variables are shifted', () => {
            expect(correlation(shiftedX, shiftedY, true))
                .toBeCloseTo(correlation(X, Y, true), 12);
        });

        it('should preserve covariance when only X is shifted', () => {
            expect(covariance(shiftedX, Y, true))
                .toBeCloseTo(covariance(X, Y, true), 10);
        });

        it('should preserve covariance when only Y is shifted', () => {
            expect(covariance(X, shiftedY, true))
                .toBeCloseTo(covariance(X, Y, true), 10);
        });
    });


    // ============================================================
    // 3. SCALE INVARIANCE
    // ============================================================

    describe('Scale Invariance', () => {
        const X = [1, 2, 3, 4, 5];
        const Y = [2, 4, 6, 8, 10];

        const scaleX = 1_000_000;
        const scaleY = 1_000;

        const scaledX = X.map(x => x * scaleX);
        const scaledY = Y.map(y => y * scaleY);

        it('should scale covariance by the product of scale factors', () => {
            expect(covariance(scaledX, scaledY, true))
                .toBeCloseTo(
                    covariance(X, Y, true) * scaleX * scaleY,
                    2
                );
        });

        it('should preserve perfect correlation under positive scaling', () => {
            expect(correlation(scaledX, scaledY, true))
                .toBeCloseTo(1, 12);
        });
    });


    // ============================================================
    // 4. SIGN / NEGATIVE SCALE
    // ============================================================

    describe('Negative Scaling', () => {
        const X = [1, 2, 3, 4, 5];
        const Y = [2, 4, 6, 8, 10];

        const negativeY = Y.map(y => -y);

        it('should change covariance sign when Y is multiplied by -1', () => {
            expect(covariance(X, negativeY, true))
                .toBeCloseTo(-covariance(X, Y, true), 12);
        });

        it('should change correlation sign when Y is multiplied by -1', () => {
            expect(correlation(X, negativeY, true))
                .toBeCloseTo(-correlation(X, Y, true), 12);
        });
    });


    // ============================================================
    // 5. ORDER STABILITY
    // ============================================================

    describe('Order Stability', () => {
        const X = [
            1_000_000_000.1,
            1_000_000_000.2,
            1_000_000_000.3,
            1_000_000_000.4
        ];

        const Y = [
            2_000_000_000.2,
            2_000_000_000.4,
            2_000_000_000.6,
            2_000_000_000.8
        ];

        const reversedX = [...X].reverse();
        const reversedY = [...Y].reverse();

        it('should preserve covariance when observations are reordered', () => {
            expect(covariance(reversedX, reversedY, true))
                .toBeCloseTo(covariance(X, Y, true), 10);
        });

        it('should preserve correlation when observations are reordered', () => {
            expect(correlation(reversedX, reversedY, true))
                .toBeCloseTo(correlation(X, Y, true), 12);
        });
    });


    // ============================================================
    // 6. ZERO VARIANCE
    // ============================================================

    describe('Zero Variance Edge Cases', () => {
        const constantX = [5.5, 5.5, 5.5, 5.5];
        const constantY = [10.2, 10.2, 10.2, 10.2];

        it('should return zero correlation when X has zero variance', () => {
            expect(correlation(constantX, [1, 2, 3, 4]))
                .toBe(0);
        });

        it('should return zero correlation when Y has zero variance', () => {
            expect(correlation([1, 2, 3, 4], constantY))
                .toBe(0);
        });

        it('should return zero correlation when both variables are constant', () => {
            expect(correlation(constantX, constantY))
                .toBe(0);
        });
    });
});