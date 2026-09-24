import { describe, it, expect } from 'vitest';
import Trend from '../../core/inference/Trend';

describe('Trend Class - Strict Numerical Benchmarks', () => {
    const noisyData = new Float64Array([12.45, 25.89, 33.12, 51.04, 68.77]);

    describe('Linear Trend (Noisy Data)', () => {
        it('calculates exact linear parameters and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const { a, b } = trend.linear();

            expect(a).toBeCloseTo(10.696000, 4);
            expect(b).toBeCloseTo(13.779000, 4);
            expect(trend.MSELinear()).toBeCloseTo(8.234502, 4);
        });
    });

    describe('Exponential Trend (Noisy Data)', () => {
        it('calculates exact exponential parameters and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const { a, b } = trend.exponential();

            expect(a).toBeCloseTo(14.417591, 4);
            expect(b).toBeCloseTo(1.506343, 4);
            expect(trend.MSEExponential()).toBeCloseTo(10.874075, 4);
        });
    });

    describe('Polynomial Trend (Degree 2, Noisy Data)', () => {
        it('calculates exact degree 2 polynomial coefficients and MSE for fractional dataset', () => {
            const trend = new Trend(noisyData);
            const coeffs = trend.polynomial(2);

            expect(coeffs.a0).toBeCloseTo(13.448857, 4);
            expect(coeffs.a1).toBeCloseTo(8.273286, 4);
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
});