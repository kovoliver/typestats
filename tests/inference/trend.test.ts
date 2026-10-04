import { describe, it, expect } from 'vitest';
import Trend from '../../core/inference/Trend';

describe('Trend Class - Strict Numerical Benchmarks (1-based time index, t = 1..n)', () => {
    const noisyData = new Float64Array([12.45, 25.89, 33.12, 51.04, 68.77]);

    describe('Linear Trend (Noisy Data)', () => {
        it('calculates exact linear parameters and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const { a, b } = trend.linear();

            expect(a).toBeCloseTo(-3.083000, 4);
            expect(b).toBeCloseTo(13.779000, 4);
            expect(trend.MSELinear()).toBeCloseTo(8.234502, 4);
        });
    });

    describe('Exponential Trend (Noisy Data)', () => {
        it('calculates exact exponential parameters and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const { a, b } = trend.exponential();

            expect(a).toBeCloseTo(9.571255, 4);
            expect(b).toBeCloseTo(1.506343, 4);
            expect(trend.MSEExponential()).toBeCloseTo(10.874075, 4);
        });
    });

    describe('Polynomial Trend (Degree 2, Noisy Data)', () => {
        it('calculates exact degree 2 polynomial coefficients and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const coeffs = trend.polynomial(2);

            expect(coeffs.a0).toBeCloseTo(6.552000, 4);
            expect(coeffs.a1).toBeCloseTo(5.520429, 4);
            expect(coeffs.a2).toBeCloseTo(1.376429, 4);
            expect(trend.MSEPolynomial(2)).toBeCloseTo(2.929746, 4);
        });
    });

    describe('Logarithmic Trend (Noisy Data)', () => {
        it('calculates exact logarithmic parameters and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const { a, b } = trend.logarithmic();

            expect(a).toBeCloseTo(7.061200, 4);
            expect(b).toBeCloseTo(32.577393, 4);
            expect(trend.MSELogarithmic()).toBeCloseTo(45.056840, 4);
        });
    });

    describe('Index convention (exact data generated on t = 1..n)', () => {
        const n = 5;

        it('linear: y = 2 + 3t recovers a = 2 and b = 3 with zero error', () => {
            const y = Float64Array.from({ length: n }, (_, i) => 2 + 3 * (i + 1));
            const trend = new Trend(y);
            const { a, b } = trend.linear();

            expect(a).toBeCloseTo(2, 8);
            expect(b).toBeCloseTo(3, 8);
            expect(trend.MSELinear()).toBeCloseTo(0, 8);
        });

        it('exponential: y = 2 * 3^t recovers a = 2 and b = 3 with zero error', () => {
            const y = Float64Array.from({ length: n }, (_, i) => 2 * Math.pow(3, i + 1));
            const trend = new Trend(y);
            const { a, b } = trend.exponential();

            expect(a).toBeCloseTo(2, 6);
            expect(b).toBeCloseTo(3, 6);
            expect(trend.MSEExponential()).toBeCloseTo(0, 6);
        });

        it('polynomial: y = 1 + 2t + 3t^2 recovers the coefficients with zero error', () => {
            const y = Float64Array.from({ length: n }, (_, i) => {
                const t = i + 1;
                return 1 + 2 * t + 3 * t * t;
            });
            const trend = new Trend(y);
            const coeffs = trend.polynomial(2);

            expect(coeffs.a0).toBeCloseTo(1, 6);
            expect(coeffs.a1).toBeCloseTo(2, 6);
            expect(coeffs.a2).toBeCloseTo(3, 6);
            expect(trend.MSEPolynomial(2)).toBeCloseTo(0, 6);
        });

        it('logarithmic: y = 4 + 5 ln(t) recovers a = 4 and b = 5 with zero error', () => {
            const y = Float64Array.from({ length: n }, (_, i) => 4 + 5 * Math.log(i + 1));
            const trend = new Trend(y);
            const { a, b } = trend.logarithmic();

            expect(a).toBeCloseTo(4, 6);
            expect(b).toBeCloseTo(5, 6);
            expect(trend.MSELogarithmic()).toBeCloseTo(0, 6);
        });
    });
});