import { describe, it, expect } from 'vitest';
import Matrix from '../../core/math/Matrix';

function isApproxIdentity(m: number[][], tol = 1e-8): boolean {
    for (let i = 0; i < m.length; i++) {
        for (let j = 0; j < m[i].length; j++) {
            const expected = i === j ? 1 : 0;

            if (Math.abs(m[i][j] - expected) > tol) return false;
        }
    }

    return true;
}

function maxAbsDiff(a: number[][], b: number[][]): number {
    let max = 0;

    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < a[i].length; j++) {
            max = Math.max(max, Math.abs(a[i][j] - b[i][j]));
        }
    }

    return max;
}

describe('Matrix (strict suite)', () => {
    describe('Constructor and basic properties', () => {
        it('throws an error for empty matrix', () => {
            expect(() => new Matrix([])).toThrow();
            expect(() => new Matrix(null as any)).toThrow();
            expect(() => new Matrix(undefined as any)).toThrow();
        });

        it('throws an error for empty rows', () => {
            expect(() => new Matrix([[], []])).toThrow();
        });

        it('throws an error if row dimensions mismatch', () => {
            expect(() => new Matrix([[1, 2], [3]])).toThrow();
            expect(() => new Matrix([[1], [2, 3], [4]])).toThrow();
        });

        it('accepts a 1x1 matrix', () => {
            const m = new Matrix([[7]]);
            expect(m.rows).toBe(1);
            expect(m.cols).toBe(1);
            expect(m.getElement(0, 0)).toBe(7);
        });

        it('initializes correctly and returns proper dimensions for a non-square matrix', () => {
            const m = new Matrix([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]);
            expect(m.rows).toBe(3);
            expect(m.cols).toBe(4);
        });

        it('is not affected by later mutation of the constructor input array', () => {
            const original = [[1, 2], [3, 4]];
            const m = new Matrix(original);
            original[0][0] = 999;
            original.push([5, 6]);
            expect(m.getElement(0, 0)).toBe(1);
            expect(m.rows).toBe(2);
        });

        it('returns a deep copy of values on every access', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            const first = m.values;
            const second = m.values;

            expect(first).not.toBe(second);
            first[0][0] = 99;
            expect(m.values[0][0]).toBe(1);
            expect(second[0][0]).toBe(1);
        });
    });

    describe('Matrix Characteristics', () => {
        it('identifies square matrices correctly, including 1x1', () => {
            expect(new Matrix([[5]]).isSquare).toBe(true);
            expect(new Matrix([[1, 2], [3, 4]]).isSquare).toBe(true);
            expect(new Matrix([[1, 2, 3], [4, 5, 6]]).isSquare).toBe(false);
        });

        it('identifies symmetric matrices correctly', () => {
            expect(new Matrix([[1, 2, 3], [4, 5, 6]]).isSymmetric).toBe(false);
            expect(new Matrix([[1, 2], [3, 4]]).isSymmetric).toBe(false);
            expect(new Matrix([[2, 1], [1, 2]]).isSymmetric).toBe(true);
            expect(new Matrix([[9]]).isSymmetric).toBe(true);
        });

        it('treats differences within the 1e-9 tolerance as symmetric, and beyond it as not', () => {
            const withinTolerance = new Matrix([[1, 2 + 1e-10], [2, 3]]);
            const beyondTolerance = new Matrix([[1, 2 + 1e-8], [2, 3]]);

            expect(withinTolerance.isSymmetric).toBe(true);
            expect(beyondTolerance.isSymmetric).toBe(false);
        });
    });

    describe('getElement', () => {
        const m = new Matrix([[5, 10, 15], [20, 25, 30], [35, 40, 45]]);

        it('returns correct elements across the matrix', () => {
            expect(m.getElement(0, 0)).toBe(5);
            expect(m.getElement(0, 2)).toBe(15);
            expect(m.getElement(2, 0)).toBe(35);
            expect(m.getElement(2, 2)).toBe(45);
            expect(m.getElement(1, 1)).toBe(25);
        });

        it('throws for every out-of-bounds direction, including exact off-by-one', () => {
            expect(() => m.getElement(-1, 0)).toThrow();
            expect(() => m.getElement(0, -1)).toThrow();
            expect(() => m.getElement(3, 0)).toThrow();
            expect(() => m.getElement(0, 3)).toThrow();
            expect(() => m.getElement(3, 3)).toThrow();
        });
    });

    describe('Transpose', () => {
        it('transposes a non-square matrix correctly', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            const transposed = m.transposed;

            expect(transposed.rows).toBe(3);
            expect(transposed.cols).toBe(2);
            expect(transposed.values).toEqual([[1, 4], [2, 5], [3, 6]]);
        });

        it('double transpose returns the original matrix', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            const doubleTransposed = m.transposed.transposed;

            expect(doubleTransposed.rows).toBe(m.rows);
            expect(doubleTransposed.cols).toBe(m.cols);
            expect(doubleTransposed.values).toEqual(m.values);
        });

        it('leaves a symmetric matrix unchanged', () => {
            const m = new Matrix([[4, 1, 1], [1, 3, 0], [1, 0, 2]]);
            expect(m.transposed.values).toEqual(m.values);
        });
    });

    describe('Determinant', () => {
        it('throws an error for non-square matrices', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(() => m.determinant).toThrow();
        });

        it('is 1 for the identity matrix (any size)', () => {
            const identity = new Matrix([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ]);

            expect(identity.determinant).toBeCloseTo(1, 10);
        });

        it('equals the product of the diagonal for a diagonal matrix', () => {
            const diagonal = new Matrix([
                [2, 0, 0],
                [0, 3, 0],
                [0, 0, 5],
            ]);

            expect(diagonal.determinant).toBeCloseTo(30, 8);
        });

        it('equals the product of the diagonal for an upper-triangular matrix', () => {
            const upper = new Matrix([
                [2, 3, 4],
                [0, 5, 6],
                [0, 0, 7],
            ]);

            expect(upper.determinant).toBeCloseTo(70, 8);
        });

        it('calculates the determinant of a 4x4 matrix correctly (numpy-verified)', () => {
            const m = new Matrix([
                [2, 1, 0, 3],
                [4, 3, 2, 1],
                [0, 1, 1, 0],
                [1, 0, 2, 3],
            ]);

            expect(m.determinant).toBeCloseTo(-28, 6);
        });

        it('gives the same determinant for a matrix and its transpose', () => {
            const m = new Matrix([
                [2, 1, 0, 3],
                [4, 3, 2, 1],
                [0, 1, 1, 0],
                [1, 0, 2, 3],
            ]);

            expect(m.determinant).toBeCloseTo(m.transposed.determinant, 6);
        });

        it('flips sign under a single row swap', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            const swapped = new Matrix([[3, 4], [1, 2]]);
            expect(swapped.determinant).toBeCloseTo(-m.determinant, 8);
        });

        it('returns 0 for a singular matrix', () => {
            const m = new Matrix([[2, 4], [1, 2]]);
            expect(m.determinant).toBeCloseTo(0, 5);
        });
    });

    describe('Inverse', () => {
        it('throws an error for non-square matrices', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(() => m.inverse()).toThrow();
        });

        it('throws an error for singular matrices', () => {
            const m = new Matrix([[2, 4], [1, 2]]);
            expect(() => m.inverse()).toThrow();
        });

        it('calculates the inverse of a 2x2 matrix correctly', () => {
            const m = new Matrix([[4, 7], [2, 6]]);
            const inv = m.inverse().values;

            expect(inv[0][0]).toBeCloseTo(0.6, 5);
            expect(inv[0][1]).toBeCloseTo(-0.7, 5);
            expect(inv[1][0]).toBeCloseTo(-0.2, 5);
            expect(inv[1][1]).toBeCloseTo(0.4, 5);
        });

        it('calculates the inverse of a 3x3 matrix correctly (numpy-verified)', () => {
            const m = new Matrix([[2, 1, 1], [1, 3, 2], [1, 0, 0]]);
            const inv = m.inverse().values;

            const expected = [
                [0, 0, 1],
                [-2, 1, 3],
                [3, -1, -5],
            ];

            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    expect(inv[i][j]).toBeCloseTo(expected[i][j], 8);
                }
            }
        });

        it('satisfies A * A^-1 = I for a 3x3 matrix', () => {
            const m = new Matrix([[2, 1, 1], [1, 3, 2], [1, 0, 0]]);
            const product = m.multiply(m, m.inverse());
            expect(isApproxIdentity(product.values, 1e-8)).toBe(true);
        });

        it('satisfies (A^-1)^-1 = A within tolerance', () => {
            const m = new Matrix([[2, 1, 1], [1, 3, 2], [1, 0, 0]]);
            const doubleInverse = m.inverse().inverse();
            expect(maxAbsDiff(doubleInverse.values, m.values)).toBeLessThan(1e-6);
        });
    });

    describe('Eigen Decomposition (Jacobi Method)', () => {
        it('throws an error for non-square matrices', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(() => m.eigen()).toThrow();
        });

        it('throws an error for non-symmetric matrices', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            expect(() => m.eigen()).toThrow();
        });

        it('calculates eigenvalues for a 2x2 symmetric matrix correctly', () => {
            const m = new Matrix([[2, 1], [1, 2]]);
            const { values } = m.eigen();
            const sortedValues = [...values].sort((a, b) => b - a);

            expect(sortedValues[0]).toBeCloseTo(3, 5);
            expect(sortedValues[1]).toBeCloseTo(1, 5);
        });

        it('calculates eigenvalues for a 3x3 symmetric matrix correctly (numpy-verified)', () => {
            const m = new Matrix([[4, 1, 1], [1, 3, 0], [1, 0, 2]]);
            const { values } = m.eigen();
            const sortedValues = [...values].sort((a, b) => b - a);

            expect(sortedValues[0]).toBeCloseTo(4.879385241572, 6);
            expect(sortedValues[1]).toBeCloseTo(2.652703644666, 6);
            expect(sortedValues[2]).toBeCloseTo(1.467911113762, 6);
        });

        it('has eigenvalues that sum to the trace of the matrix', () => {
            const m = new Matrix([[4, 1, 1], [1, 3, 0], [1, 0, 2]]);
            const { values } = m.eigen();
            const trace = m.getElement(0, 0) + m.getElement(1, 1) + m.getElement(2, 2);
            const sumEigenvalues = values.reduce((a, b) => a + b, 0);

            expect(sumEigenvalues).toBeCloseTo(trace, 6);
        });

        it('has eigenvalues whose product equals the determinant', () => {
            const m = new Matrix([[4, 1, 1], [1, 3, 0], [1, 0, 2]]);
            const { values } = m.eigen();
            const productEigenvalues = values.reduce((a, b) => a * b, 1);

            expect(productEigenvalues).toBeCloseTo(m.determinant, 6);
        });

        it('returns an orthogonal eigenvector matrix (V^T * V = I)', () => {
            const m = new Matrix([[4, 1, 1], [1, 3, 0], [1, 0, 2]]);
            const { vectors } = m.eigen();
            const product = m.multiply(vectors.transposed, vectors);

            expect(isApproxIdentity(product.values, 1e-6)).toBe(true);
        });
    });

    describe('Pivot Operation', () => {
        it('throws an error for out of bound indices', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            expect(() => m.pivot(-1, 0)).toThrow();
            expect(() => m.pivot(0, 5)).toThrow();
        });

        it('throws an error if pivot element is zero', () => {
            const m = new Matrix([[0, 2], [3, 4]]);
            expect(() => m.pivot(0, 0)).toThrow();
        });

        it('throws an error if pivot element is below the numerical threshold', () => {
            const m = new Matrix([[1e-11, 2], [3, 4]]);
            expect(() => m.pivot(0, 0)).toThrow();
        });

        it('performs pivot operation correctly on a 2x2 matrix', () => {
            const m = new Matrix([[2, 4], [3, 1]]);
            const pivoted = m.pivot(0, 0).values;

            expect(pivoted[0][0]).toBeCloseTo(1, 5);
            expect(pivoted[0][1]).toBeCloseTo(2, 5);
            expect(pivoted[1][0]).toBeCloseTo(0, 5);
            expect(pivoted[1][1]).toBeCloseTo(-5, 5);
        });

        it('leaves the pivot column as a unit column after pivoting on a 3x3 matrix', () => {
            const m = new Matrix([[2, 1, 1], [1, 3, 2], [1, 0, 4]]);
            const pivoted = m.pivot(1, 1).values;

            expect(pivoted[0][1]).toBeCloseTo(0, 8);
            expect(pivoted[1][1]).toBeCloseTo(1, 8);
            expect(pivoted[2][1]).toBeCloseTo(0, 8);
        });
    });

    describe('Linear System Solver', () => {
        it('throws an error if vector length does not match matrix rows', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            expect(() => m.solve([1])).toThrow();
            expect(() => m.solve([1, 2, 3])).toThrow();
        });

        it('throws an error for inconsistent systems (no solution)', () => {
            const m = new Matrix([[1, 1], [1, 1]]);
            expect(() => m.solve([1, 2])).toThrow();
        });

        it('throws an error for underdetermined systems (infinite solutions)', () => {
            const m = new Matrix([[1, 1], [2, 2]]);
            expect(() => m.solve([1, 2])).toThrow();
        });

        it('solves a valid 2x2 linear system correctly', () => {
            const m = new Matrix([[3, 2], [1, 2]]);
            const b = [7, 5];
            const x = m.solve(b);

            expect(x[0]).toBeCloseTo(1, 5);
            expect(x[1]).toBeCloseTo(2, 5);
        });

        it('solves a 3x3 linear system such that A * x = b (residual check)', () => {
            const values = [[2, 1, 1], [1, 3, 2], [1, 0, 4]];
            const m = new Matrix(values);
            const b = [4, 5, 3];
            const x = m.solve(b);

            const residual = values.map((row) =>
                row.reduce((sum, coeff, j) => sum + coeff * x[j], 0)
            );

            for (let i = 0; i < b.length; i++) {
                expect(residual[i]).toBeCloseTo(b[i], 6);
            }
        });
    });
});