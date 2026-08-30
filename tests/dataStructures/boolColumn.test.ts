import { describe, it, expect, beforeEach } from 'vitest';
import BoolColumn from '../../core/dataStructures/BoolColumn';
import NumberColumn from '../../core/dataStructures/NumberColumn';

describe('BoolColumn', () => {
    let rawData: (boolean | number | string | null | undefined)[];
    let column: BoolColumn;

    beforeEach(() => {
        rawData = [true, false, 1, 0, 'true', 'no', 'on', 'off', null, undefined, ''];
        column = new BoolColumn(rawData, 'ActiveStatus');
    });

    describe('Initialization & Data Preparation', () => {
        it('should correctly initialize label and parse raw boolean values', () => {
            expect(column.label).toBe('ActiveStatus');
            expect(column.values).toEqual([
                true,
                false,
                true,
                false,
                true,
                false,
                true,
                false,
                null,
                null,
                null
            ]);
        });

        it('should throw error for unsupported types or invalid strings', () => {
            expect(() => new BoolColumn(['invalid_string'], 'ErrorCol')).toThrowError();
            expect(() => new BoolColumn([5], 'ErrorCol')).toThrowError();
        });

        it('should correctly report valid and missing counts', () => {
            expect(column.countValid()).toBe(8);
            expect(column.countMissing()).toBe(3);
        });
    });

    describe('Ratios & Counting', () => {
        it('should count true and false values correctly', () => {
            expect(column.countTrue()).toBe(4);
            expect(column.countFalse()).toBe(4);
        });

        it('should calculate true and false ratios relative to valid values', () => {
            expect(column.trueRatio()).toBe(0.5); // 4 / 8
            expect(column.falseRatio()).toBe(0.5); // 4 / 8
        });

        it('should return 0 ratios for column with no valid values', () => {
            const emptyCol = new BoolColumn([null, undefined], 'Empty');
            expect(emptyCol.trueRatio()).toBe(0);
            expect(emptyCol.falseRatio()).toBe(0);
        });
    });

    describe('Data Cleaning & Conversion', () => {
        it('should remove empty/null rows in-place', () => {
            column.removeEmptyRows();
            expect(column.values).toEqual([true, false, true, false, true, false, true, false]);
            expect(column.countMissing()).toBe(0);
        });

        it('should convert to NumberColumn (1 for true, 0 for false, preserving nulls as NaNs)', () => {
            const numCol = column.toNumberColumn();

            expect(numCol).toBeInstanceOf(NumberColumn);
            expect(numCol.label).toBe('ActiveStatus_numeric');
            
            expect(numCol.values).toEqual([1, 0, 1, 0, 1, 0, 1, 0, NaN, NaN, NaN]);
        });

        it('should invert boolean values in-place while preserving nulls', () => {
            const cleanCol = new BoolColumn([true, false, null], 'InvertTest');
            cleanCol.invert();
            expect(cleanCol.values).toEqual([false, true, null]);
        });
    });

    describe('Logical Operations (AND, OR, XOR)', () => {
        let colA: BoolColumn;
        let colB: BoolColumn;

        beforeEach(() => {
            colA = new BoolColumn([true, true, false, false, null], 'ColA');
            colB = new BoolColumn([true, false, true, false, true], 'ColB');
        });

        it('should perform element-wise logical AND', () => {
            const result = colA.and(colB);

            expect(result).toBeInstanceOf(BoolColumn);
            expect(result.label).toBe('ColA_AND_ColB');
            expect(result.values).toEqual([true, false, false, false, null]);
        });

        it('should perform element-wise logical OR', () => {
            const result = colA.or(colB);

            expect(result).toBeInstanceOf(BoolColumn);
            expect(result.label).toBe('ColA_OR_ColB');
            expect(result.values).toEqual([true, true, true, false, null]);
        });

        it('should perform element-wise logical XOR', () => {
            const result = colA.xor(colB);

            expect(result).toBeInstanceOf(BoolColumn);
            expect(result.label).toBe('ColA_XOR_ColB');
            expect(result.values).toEqual([false, true, true, false, null]);
        });

        it('should throw error on logical operations if column lengths mismatch', () => {
            const shortCol = new BoolColumn([true, false], 'Short');
            expect(() => colA.and(shortCol)).toThrowError('Column lengths must match');
            expect(() => colA.or(shortCol)).toThrowError('Column lengths must match');
            expect(() => colA.xor(shortCol)).toThrowError('Column lengths must match');
        });
    });
});