import { describe, it, expect } from 'vitest';
import fQuantile from '../../core/distributions/fDist';
import chiSquareQuantile from '../../core/distributions/chiSquareDist';

function exactQuantileD1eq2(p: number, d2: number): number {
    return (d2 / 2) * (Math.pow(1 - p, -2 / d2) - 1);
}

function exactQuantileD2eq2(p: number, d1: number): number {
    const t = Math.pow(p, 2 / d1);
    return (2 * t) / (d1 * (1 - t));
}

describe('fQuantile', () => {
    describe('input validation', () => {
        it('throws an error if p <= 0', () => {
            expect(() => fQuantile(0, 3, 5)).toThrow();
            expect(() => fQuantile(-0.1, 3, 5)).toThrow();
        });

        it('throws an error if p >= 1', () => {
            expect(() => fQuantile(1, 3, 5)).toThrow();
            expect(() => fQuantile(1.1, 3, 5)).toThrow();
        });

        it('throws an error if d1 <= 0', () => {
            expect(() => fQuantile(0.5, 0, 5)).toThrow();
            expect(() => fQuantile(0.5, -2, 5)).toThrow();
        });

        it('throws an error if d2 <= 0', () => {
            expect(() => fQuantile(0.5, 5, 0)).toThrow();
            expect(() => fQuantile(0.5, 5, -2)).toThrow();
        });
    });

    describe('d1 = 2 closed-form verification', () => {
        const d2Values = [1, 2, 5, 10, 30, 100];
        const pValues = [0.01, 0.1, 0.5, 0.9, 0.95, 0.99];

        for (const d2 of d2Values) {
            it.each(pValues)(`d2 = ${d2}, p = %f`, (p) => {
                const expected = exactQuantileD1eq2(p, d2);
                const actual = fQuantile(p, 2, d2);
                expect(actual).toBeCloseTo(expected, 6);
            });
        }
    });

    describe('d2 = 2 closed-form verification', () => {
        const d1Values = [1, 2, 5, 10, 30, 100];
        const pValues = [0.01, 0.1, 0.5, 0.9, 0.95, 0.99];

        for (const d1 of d1Values) {
            it.each(pValues)(`d1 = ${d1}, p = %f`, (p) => {
                const expected = exactQuantileD2eq2(p, d1);
                const actual = fQuantile(p, d1, 2);
                expect(actual).toBeCloseTo(expected, 6);
            });
        }
    });

    describe('reciprocal relationship: if X ~ F(d1,d2), then 1/X ~ F(d2,d1)', () => {
        it.each([
            [0.05, 3, 8],
            [0.1, 5, 5],
            [0.5, 2, 20],
            [0.9, 10, 4],
            [0.95, 1, 15],
            [0.99, 30, 6],
        ])('p = %f, d1 = %i, d2 = %i', (p, d1, d2) => {
            const x = fQuantile(p, d1, d2);
            const xRecip = fQuantile(1 - p, d2, d1);
            expect(x * xRecip).toBeCloseTo(1, 6);
        });
    });

    describe('limiting case: as d2 -> infinity, d1 * F(d1,d2) -> chi-square(d1)', () => {
        it.each([
            [0.5, 3],
            [0.9, 5],
            [0.95, 8],
            [0.99, 2],
        ])('p = %f, d1 = %i', (p, d1) => {
            const d2 = 1_000_000;
            const scaled = d1 * fQuantile(p, d1, d2);
            const expected = chiSquareQuantile(p, d1);
            expect(scaled).toBeCloseTo(expected, 2);
        });
    });

    describe('monotonicity', () => {
        it('is strictly increasing in p for fixed d1 and d2', () => {
            const d1 = 4;
            const d2 = 12;
            const ps = [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 0.9, 0.95, 0.99];

            let prev = -Infinity;

            for (const p of ps) {
                const x = fQuantile(p, d1, d2);
                expect(x).toBeGreaterThan(prev);
                prev = x;
            }
        });
    });

    describe('general properties', () => {
        it('always returns a finite, positive number', () => {
            const cases: [number, number, number][] = [
                [1e-6, 1, 1],
                [1e-4, 0.5, 0.5],
                [0.5, 3, 7],
                [1 - 1e-4, 10, 20],
                [1 - 1e-8, 100, 100],
                [0.5, 1000, 1000],
            ];

            for (const [p, d1, d2] of cases) {
                const x = fQuantile(p, d1, d2);
                expect(Number.isFinite(x)).toBe(true);
                expect(x).toBeGreaterThan(0);
            }
        });

        it('remains stable even for very small d1 (PDF is singular as x -> 0)', () => {
            expect(() => fQuantile(0.5, 0.01, 5)).not.toThrow();

            const x = fQuantile(0.5, 0.01, 5);
            expect(Number.isFinite(x)).toBe(true);
            expect(x).toBeGreaterThan(0);
        });

        it('has the expected median symmetry: the median of F(d,d) is close to 1', () => {
            const x = fQuantile(0.5, 20, 20);
            expect(x).toBeGreaterThan(0.8);
            expect(x).toBeLessThan(1.25);
        });
    });
});