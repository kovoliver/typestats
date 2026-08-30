import { describe, it, expect } from 'vitest';
import chiSquareQuantile from '../../core/distributions/chiSquareDist';
import normalQuantile from '../../core/distributions/normalDist';

function exactQuantileDf2(p: number): number {
    return -2 * Math.log(1 - p);
}

function exactCdfDf4(x: number): number {
    if (x <= 0) return 0;
    return 1 - Math.exp(-x / 2) * (1 + x / 2);
}

function exactQuantileDf4(p: number): number {
    let lo = 0;
    let hi = 1;
    while (exactCdfDf4(hi) < p) hi *= 2;
    for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (exactCdfDf4(mid) < p) lo = mid;
        else hi = mid;
    }
    return (lo + hi) / 2;
}

describe('chiSquareQuantile', () => {
    describe('input validation', () => {
        it('throws an error if p <= 0', () => {
            expect(() => chiSquareQuantile(0, 5)).toThrow();
            expect(() => chiSquareQuantile(-0.1, 5)).toThrow();
        });

        it('throws an error if p >= 1', () => {
            expect(() => chiSquareQuantile(1, 5)).toThrow();
            expect(() => chiSquareQuantile(1.1, 5)).toThrow();
        });

        it('throws an error if df <= 0', () => {
            expect(() => chiSquareQuantile(0.5, 0)).toThrow();
            expect(() => chiSquareQuantile(0.5, -3)).toThrow();
        });

        it('does not throw an error for valid extreme df values (e.g. df < 1)', () => {
            expect(() => chiSquareQuantile(0.5, 0.1)).not.toThrow();
        });
    });

    describe('df = 2 closed-form verification (x = -2 ln(1-p))', () => {
        it.each([0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999])(
            'p = %f',
            (p) => {
                const expected = exactQuantileDf2(p);
                const actual = chiSquareQuantile(p, 2);
                expect(actual).toBeCloseTo(expected, 8);
            },
        );
    });

    describe('df = 4 closed-form verification (binary search oracle)', () => {
        it.each([0.01, 0.1, 0.5, 0.9, 0.95, 0.99])('p = %f', (p) => {
            const expected = exactQuantileDf4(p);
            const actual = chiSquareQuantile(p, 4);
            expect(actual).toBeCloseTo(expected, 6);
        });
    });

    describe('df = 1 cross-check with normalQuantile (Z^2 ~ chi2_1)', () => {
        it.each([0.01, 0.1, 0.5, 0.9, 0.99, 0.999])('p = %f', (p) => {
            const z = normalQuantile((1 + p) / 2);
            const expected = z * z;
            const actual = chiSquareQuantile(p, 1);
            expect(actual).toBeCloseTo(expected, 8);
        });
    });

    describe('monotonicity', () => {
        it('is strictly increasing in p for fixed df', () => {
            const df = 7;
            const ps = [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 0.9, 0.95, 0.99];
            let prev = -Infinity;
            for (const p of ps) {
                const x = chiSquareQuantile(p, df);
                expect(x).toBeGreaterThan(prev);
                prev = x;
            }
        });

        it('is strictly increasing in df for fixed p', () => {
            const p = 0.95;
            const dfs = [1, 2, 5, 10, 20, 50, 100];
            let prev = -Infinity;
            for (const df of dfs) {
                const x = chiSquareQuantile(p, df);
                expect(x).toBeGreaterThan(prev);
                prev = x;
            }
        });
    });

    describe('general properties', () => {
        it('always returns a finite, positive number', () => {
            const cases: [number, number][] = [
                [1e-6, 0.5],
                [1e-4, 1],
                [0.5, 3],
                [1 - 1e-4, 10],
                [1 - 1e-8, 100],
                [0.5, 500],
            ];
            for (const [p, df] of cases) {
                const x = chiSquareQuantile(p, df);
                expect(Number.isFinite(x)).toBe(true);
                expect(x).toBeGreaterThan(0);
            }
        });

        it('remains stable even for very small df (PDF is singular as x -> 0)', () => {
            expect(() => chiSquareQuantile(0.5, 0.01)).not.toThrow();
            const x = chiSquareQuantile(0.5, 0.01);
            expect(Number.isFinite(x)).toBe(true);
            expect(x).toBeGreaterThan(0);
        });

        it('is consistent with the Wilson-Hilferty order of magnitude for large df (~df)', () => {
            const df = 1000;
            const x = chiSquareQuantile(0.5, df);
            expect(x).toBeGreaterThan(df - 10);
            expect(x).toBeLessThan(df + 10);
        });
    });
});