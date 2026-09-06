import { describe, it, expect } from 'vitest';
import { mean, ssd, variance, std } from '../../core/statistics/univariate';

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
    });


    // ============================================================
    // 4. TRANSLATION / SHIFT INVARIANCE
    // ============================================================

    describe('Translation Invariance', () => {
        const base = [1, 2, 3, 4, 5];

        // Adding a constant must not change SSD, variance or std.
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
    });
});