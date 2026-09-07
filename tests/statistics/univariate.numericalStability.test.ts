import { describe, it, expect } from 'vitest';
import { mean, ssd, variance, std, centralMoment } from '../../core/statistics/univariate';

describe('Univariate Numerical Stability Tests', () => {

    // ============================================================
    // 1. CATASTROPHIC CANCELLATION
    // ============================================================
    describe('Catastrophic Cancellation Prevention', () => {
        // Huge offset, tiny variance.
        // A naive Σx² - n·mean² implementation is vulnerable here.
        const values = [
            1_000_000_000_000,
            1_000_000_000_001,
            1_000_000_000_002,
            1_000_000_000_003,
            1_000_000_000_004
        ];

        it('should calculate the mean correctly at trillion magnitude', () => {
            expect(mean(values)).toBe(1_000_000_000_002);
        });

        it('should calculate SSD without catastrophic cancellation', () => {
            expect(ssd(values)).toBeCloseTo(10, 10);
        });

        it('should calculate sample variance correctly', () => {
            expect(variance(values, true)).toBeCloseTo(2.5, 10);
        });

        it('should calculate sample standard deviation correctly', () => {
            expect(std(values, true)).toBeCloseTo(Math.sqrt(2.5), 10);
        });

        it('should calculate 1st central moment strictly as 0', () => {
            expect(centralMoment(values, 1, true)).toBe(0);
        });

        it('should calculate 2nd central moment (sample variance) correctly', () => {
            expect(centralMoment(values, 2, true)).toBeCloseTo(2.5, 10);
        });

        it('should calculate 3rd central moment (skewness numerator) without cancellation', () => {
            // Deviations: -2, -1, 0, 1, 2 => Cubed: -8, -1, 0, 1, 8 => Sum = 0
            expect(centralMoment(values, 3, true)).toBeCloseTo(0, 10);
        });

        it('should calculate 4th central moment (kurtosis numerator) without cancellation', () => {
            // Deviations: -2, -1, 0, 1, 2 => 4th powers: 16, 1, 0, 1, 16 => Sum = 34
            // Sample degrees of freedom (N - 1 = 4): 34 / 4 = 8.5
            expect(centralMoment(values, 4, true)).toBeCloseTo(8.5, 10);
        });

        it('should calculate 3rd central moment for asymmetric data without cancellation', () => {
            // Positively skewed data at trillion magnitude:
            // Deviations: -3.25, -2.25, -1.25, +6.75
            // Cubed sum: -34.328125 - 11.390625 - 1.953125 + 307.546875 = 259.875
            // Sample moment (df = N - 1 = 3): 259.875 / 3 = 86.625
            const skewedValues = [
                1_000_000_000_000,
                1_000_000_000_001,
                1_000_000_000_002,
                1_000_000_000_010
            ];

            expect(centralMoment(skewedValues, 3, true)).toBeCloseTo(86.625, 10);
        });
    });


    // ============================================================
    // 2. SMALL-MAGNITUDE DATA
    // ============================================================
    describe('Small-Magnitude Precision', () => {
        const values = [
            1.00e-8,
            1.02e-8,
            1.04e-8,
            1.06e-8
        ];

        // Mean = 1.03e-8
        // Deviations = -3e-10, -1e-10, +1e-10, +3e-10
        // SSD = 2e-19
        it('should preserve a very small but non-zero SSD', () => {
            expect(ssd(values)).toBeCloseTo(2e-19, 28);
        });

        it('should preserve a positive variance', () => {
            expect(variance(values, true)).toBeGreaterThan(0);
        });

        it('should preserve a positive standard deviation', () => {
            expect(std(values, true)).toBeGreaterThan(0);
        });

        it('should preserve small-magnitude 2nd central moment', () => {
            expect(centralMoment(values, 2, true)).toBeGreaterThan(0);
        });

        it('should preserve small-magnitude 4th central moment', () => {
            // 4th powers sum = 8.2e-38 => Sample moment = 8.2e-38 / 3 ≈ 2.733e-38
            expect(centralMoment(values, 4, true)).toBeGreaterThan(0);
        });
    });


    // ============================================================
    // 3. CONSTANT DATA
    // ============================================================
    describe('Constant Data', () => {
        const values = [5.5, 5.5, 5.5, 5.5];

        it('should return zero SSD', () => {
            expect(ssd(values)).toBe(0);
        });

        it('should return zero population variance', () => {
            expect(variance(values)).toBe(0);
        });

        it('should return zero sample variance', () => {
            expect(variance(values, true)).toBe(0);
        });

        it('should return zero population standard deviation', () => {
            expect(std(values)).toBe(0);
        });

        it('should return zero sample standard deviation', () => {
            expect(std(values, true)).toBe(0);
        });

        it('should return zero for all central moments up to 4th order', () => {
            expect(centralMoment(values, 1)).toBe(0);
            expect(centralMoment(values, 2)).toBe(0);
            expect(centralMoment(values, 3)).toBe(0);
            expect(centralMoment(values, 4)).toBe(0);
        });
    });


    // ============================================================
    // 4. TRANSLATION / SHIFT INVARIANCE
    // ============================================================
    describe('Translation Invariance', () => {
        const base = [1, 2, 3, 4, 5];

        // Adding a constant must not change SSD, variance, std, or central moments.
        const shifted = base.map(x => x + 1_000_000_000_000);

        it('should preserve SSD under a constant shift', () => {
            expect(ssd(shifted)).toBeCloseTo(ssd(base), 10);
        });

        it('should preserve variance under a constant shift', () => {
            expect(variance(shifted)).toBeCloseTo(variance(base), 10);
        });

        it('should preserve standard deviation under a constant shift', () => {
            expect(std(shifted)).toBeCloseTo(std(base), 10);
        });

        it('should preserve 3rd central moment under a constant shift', () => {
            expect(centralMoment(shifted, 3)).toBeCloseTo(centralMoment(base, 3), 10);
        });

        it('should preserve 4th central moment under a constant shift', () => {
            expect(centralMoment(shifted, 4)).toBeCloseTo(centralMoment(base, 4), 10);
        });
    });


    // ============================================================
    // 5. SCALE INVARIANCE
    // ============================================================
    describe('Scale Invariance', () => {
        const base = [1, 2, 3, 4, 5];
        const scale = 1_000_000;

        const scaled = base.map(x => x * scale);

        it('should scale SSD by the square of the scale factor', () => {
            expect(ssd(scaled))
                .toBeCloseTo(ssd(base) * scale ** 2, 2);
        });

        it('should scale variance by the square of the scale factor', () => {
            expect(variance(scaled))
                .toBeCloseTo(variance(base) * scale ** 2, 2);
        });

        it('should scale standard deviation by the absolute scale factor', () => {
            expect(std(scaled))
                .toBeCloseTo(std(base) * Math.abs(scale), 5);
        });

        it('should scale k-th central moment by the k-th power of the scale factor', () => {
            expect(centralMoment(scaled, 3))
                .toBeCloseTo(centralMoment(base, 3) * scale ** 3, -5);

            expect(centralMoment(scaled, 4))
                .toBeCloseTo(centralMoment(base, 4) * scale ** 4, -10);
        });
    });


    // ============================================================
    // 6. NEGATIVE SCALE
    // ============================================================
    describe('Negative Scale', () => {
        const base = [1, 2, 3, 4, 5];
        const scaled = base.map(x => -x);

        it('should preserve variance under sign reversal', () => {
            expect(variance(scaled)).toBeCloseTo(variance(base), 12);
        });

        it('should preserve standard deviation under sign reversal', () => {
            expect(std(scaled)).toBeCloseTo(std(base), 12);
        });

        it('should preserve SSD under sign reversal', () => {
            expect(ssd(scaled)).toBeCloseTo(ssd(base), 12);
        });

        it('should invert sign for odd central moments (3rd order)', () => {
            expect(centralMoment(scaled, 3)).toBeCloseTo(-centralMoment(base, 3), 12);
        });

        it('should preserve sign for even central moments (4th order)', () => {
            expect(centralMoment(scaled, 4)).toBeCloseTo(centralMoment(base, 4), 12);
        });
    });


    // ============================================================
    // 7. ORDER SENSITIVITY
    // ============================================================
    describe('Order Stability', () => {
        const values = [
            1_000_000_000_000,
            1_000_000_000_001,
            1_000_000_000_002,
            1_000_000_000_003,
            1_000_000_000_004
        ];

        const reversed = [...values].reverse();

        it('should produce the same mean regardless of input order', () => {
            expect(mean(reversed)).toBeCloseTo(mean(values), 12);
        });

        it('should produce the same SSD regardless of input order', () => {
            expect(ssd(reversed)).toBeCloseTo(ssd(values), 10);
        });

        it('should produce the same variance regardless of input order', () => {
            expect(variance(reversed)).toBeCloseTo(variance(values), 10);
        });

        it('should produce the same standard deviation regardless of input order', () => {
            expect(std(reversed)).toBeCloseTo(std(values), 10);
        });

        it('should produce the same 3rd central moment regardless of input order', () => {
            expect(centralMoment(reversed, 3)).toBeCloseTo(centralMoment(values, 3), 10);
        });

        it('should produce the same 4th central moment regardless of input order', () => {
            expect(centralMoment(reversed, 4)).toBeCloseTo(centralMoment(values, 4), 10);
        });
    });
});