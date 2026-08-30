import { describe, it, expect } from 'vitest';
import Matrix from '../../core/math/Matrix';

describe('Matrix', () => {
    describe('Constructor and basic properties', () => {
        it('throws an error for empty matrix', () => {
            expect(() => new Matrix([])).toThrowError();
            expect(() => new Matrix(null as any)).toThrowError();
        });

        it('throws an error for empty rows', () => {
            expect(() => new Matrix([[], []])).toThrowError();
        });

        it('throws an error if row dimensions mismatch', () => {
            expect(() => new Matrix([[1, 2], [3]])).toThrowError();
        });

        it('initializes correctly and returns proper dimensions', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(m.rows).toBe(2);
            expect(m.cols).toBe(3);
        });

        it('returns a deep copy of values', () => {
            const original = [[1, 2], [3, 4]];
            const m = new Matrix(original);
            const vals = m.values;
            
            vals[0][0] = 99;
            expect(m.values[0][0]).toBe(1);
        });
    });

    describe('Matrix Characteristics', () => {
        it('identifies square matrices correctly', () => {
            const square = new Matrix([[1, 2], [3, 4]]);
            const nonSquare = new Matrix([[1, 2, 3], [4, 5, 6]]);
            
            expect(square.isSquare).toBe(true);
            expect(nonSquare.isSquare).toBe(false);
        });

        it('identifies symmetric matrices correctly', () => {
            const nonSquare = new Matrix([[1, 2, 3], [4, 5, 6]]);
            const squareNonSymmetric = new Matrix([[1, 2], [3, 4]]);
            const symmetric = new Matrix([[2, 1], [1, 2]]);
            
            expect(nonSquare.isSymmetric).toBe(false);
            expect(squareNonSymmetric.isSymmetric).toBe(false);
            expect(symmetric.isSymmetric).toBe(true);
        });
    });

    describe('getElement', () => {
        const m = new Matrix([[5, 10], [15, 20]]);

        it('returns correct element', () => {
            expect(m.getElement(0, 1)).toBe(10);
            expect(m.getElement(1, 0)).toBe(15);
        });

        it('throws an error if index is out of bounds', () => {
            expect(() => m.getElement(-1, 0)).toThrowError();
            expect(() => m.getElement(0, 2)).toThrowError();
            expect(() => m.getElement(2, 0)).toThrowError();
        });
    });

    describe('Transpose', () => {
        it('transposes a matrix correctly', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            const transposed = m.transposed;
            
            expect(transposed.rows).toBe(3);
            expect(transposed.cols).toBe(2);
            expect(transposed.values).toEqual([[1, 4], [2, 5], [3, 6]]);
        });
    });

    describe('Determinant', () => {
        it('throws an error for non-square matrices', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(() => m.determinant).toThrowError();
        });

        it('calculates determinant of a 2x2 matrix correctly', () => {
            const m = new Matrix([[4, 6], [3, 8]]);
            expect(m.determinant).toBeCloseTo(14, 5);
        });

        it('calculates determinant of a 3x3 matrix correctly', () => {
            const m = new Matrix([
                [1, 2, 3],
                [0, 1, 4],
                [5, 6, 0]
            ]);
            expect(m.determinant).toBeCloseTo(1, 5);
        });

        it('returns 0 for a singular matrix', () => {
            const m = new Matrix([[2, 4], [1, 2]]);
            expect(m.determinant).toBeCloseTo(0, 5);
        });
    });

    describe('Inverse', () => {
        it('throws an error for non-square matrices', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(() => m.inverse()).toThrowError();
        });

        it('throws an error for singular matrices', () => {
            const m = new Matrix([[2, 4], [1, 2]]);
            expect(() => m.inverse()).toThrowError();
        });

        it('calculates the inverse of a 2x2 matrix correctly', () => {
            const m = new Matrix([[4, 7], [2, 6]]);
            const inv = m.inverse().values;
            
            expect(inv[0][0]).toBeCloseTo(0.6, 5);
            expect(inv[0][1]).toBeCloseTo(-0.7, 5);
            expect(inv[1][0]).toBeCloseTo(-0.2, 5);
            expect(inv[1][1]).toBeCloseTo(0.4, 5);
        });
    });

    describe('Eigen Decomposition (Jacobi Method)', () => {
        it('throws an error for non-square matrices', () => {
            const m = new Matrix([[1, 2, 3], [4, 5, 6]]);
            expect(() => m.eigen()).toThrowError();
        });

        it('throws an error for non-symmetric matrices', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            expect(() => m.eigen()).toThrowError();
        });

        it('calculates eigenvalues for a symmetric matrix correctly', () => {
            const m = new Matrix([[2, 1], [1, 2]]);
            const { values } = m.eigen();
            
            const sortedValues = values.sort((a, b) => b - a);
            
            expect(sortedValues[0]).toBeCloseTo(3, 5);
            expect(sortedValues[1]).toBeCloseTo(1, 5);
        });
    });

    describe('Pivot Operation', () => {
        it('throws an error for out of bound indices', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            expect(() => m.pivot(-1, 0)).toThrowError();
            expect(() => m.pivot(0, 5)).toThrowError();
        });

        it('throws an error if pivot element is zero', () => {
            const m = new Matrix([[0, 2], [3, 4]]);
            expect(() => m.pivot(0, 0)).toThrowError();
        });

        it('performs pivot operation correctly', () => {
            const m = new Matrix([[2, 4], [3, 1]]);
            const pivoted = m.pivot(0, 0).values;
            
            expect(pivoted[0][0]).toBeCloseTo(1, 5);
            expect(pivoted[0][1]).toBeCloseTo(2, 5);
            expect(pivoted[1][0]).toBeCloseTo(0, 5);
            expect(pivoted[1][1]).toBeCloseTo(-5, 5);
        });
    });

    describe('Linear System Solver', () => {
        it('throws an error if vector length does not match matrix rows', () => {
            const m = new Matrix([[1, 2], [3, 4]]);
            expect(() => m.solve([1])).toThrowError();
        });

        it('throws an error for inconsistent systems (no solution)', () => {
            const m = new Matrix([[1, 1], [1, 1]]);
            expect(() => m.solve([1, 2])).toThrowError();
        });

        it('throws an error for underdetermined systems (infinite solutions)', () => {
            const m = new Matrix([[1, 1], [2, 2]]);
            expect(() => m.solve([1, 2])).toThrowError();
        });

        it('solves a valid linear system correctly', () => {
            const m = new Matrix([[3, 2], [1, 2]]);
            const b = [7, 5];
            const x = m.solve(b);
            
            expect(x[0]).toBeCloseTo(1, 5);
            expect(x[1]).toBeCloseTo(2, 5);
        });
    });
});