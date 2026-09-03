import { describe, it, expect, beforeEach } from 'vitest';
import StringColumn from '../../core/dataStructures/StringColumn';
import NumberColumn from '../../core/dataStructures/NumberColumn';

describe('StringColumn', () => {
    let rawData: (string | number | boolean | null | undefined)[];
    let column: StringColumn;

    beforeEach(() => {
        rawData = ['apple', 'banana', 'apple', 'cherry', 123, true, null, undefined, 'null'];
        column = new StringColumn(rawData, 'FruitColumn');
    });

    describe('Initialization & Data Preparation', () => {
        it('should correctly initialize label and prepare values', () => {
            expect(column.label).toBe('FruitColumn');
            expect(column.values).toEqual([
                'apple',
                'banana',
                'apple',
                'cherry',
                '123',
                'true',
                null,
                null,
                null
            ]);
        });

        it('should return count of missing and valid items via inherited methods', () => {
            expect(column.countValid()).toBe(6);
            expect(column.countMissing()).toBe(3);
        });

        it('should return unique string values', () => {
            expect(column.unique()).toEqual(['apple', 'banana', 'cherry', '123', 'true']);
        });
    });

    describe('Data Cleaning & Sorting', () => {
        it('should remove empty/null rows in-place', () => {
            const newColumn = column.removeEmptyRows();
            expect(newColumn.values).toEqual(['apple', 'banana', 'apple', 'cherry', '123', 'true']);
            expect(newColumn.countMissing()).toBe(0);
        });

        it('should sort values in ascending order placing nulls at the end', () => {
            const cleanCol = new StringColumn(['cherry', 'apple', null, 'banana'], 'SortAsc');
            const newColumn = cleanCol.orderAsc();
            expect(newColumn.values).toEqual(['apple', 'banana', 'cherry', null]);
        });

        it('should sort values in descending order placing nulls at the end', () => {
            const cleanCol = new StringColumn(['cherry', 'apple', null, 'banana'], 'SortDesc');
            const newColumn = cleanCol.orderDesc();
            expect(newColumn.values).toEqual(['cherry', 'banana', 'apple', null]);
        });
    });

    describe('Encoding Transformations', () => {
        it('should perform label encoding on clean data returning a NumberColumn', () => {
            const cleanCol = new StringColumn(['apple', 'banana', 'apple', 'cherry'], 'Category');
            const encodedCol = cleanCol.labelEncode();

            expect(encodedCol).toBeInstanceOf(NumberColumn);
            expect(encodedCol.label).toBe('Category_encoded');
            expect(encodedCol.values.length).toBe(4);
            expect(encodedCol.values[0]).toBe(encodedCol.values[2]);
            expect(encodedCol.values[0]).not.toBe(encodedCol.values[1]);
        });

        it('should throw an error during labelEncode if column contains null values', () => {
            expect(() => column.labelEncode()).toThrowError(
                'Cannot perform label encoding on column "FruitColumn" containing missing or null values.'
            );
        });

        it('should calculate and cache one-hot encoded columns on clean data', () => {
            const cleanCol = new StringColumn(['apple', 'banana', 'apple'], 'Fruit');
            const encodedCols = cleanCol.oneHotEncoded;

            expect(encodedCols.length).toBe(2); // 'apple' és 'banana' kategóriák
            expect(encodedCols[0]).toBeInstanceOf(NumberColumn);
            expect(encodedCols[0].label).toBe('Fruit_apple');
            expect(encodedCols[1].label).toBe('Fruit_banana');

            expect(encodedCols[0].values).toEqual([1, 0, 1]);
            expect(encodedCols[1].values).toEqual([0, 1, 0]);
        });

        it('should use cache for subsequent calls of oneHotEncoded', () => {
            const cleanCol = new StringColumn(['apple', 'banana'], 'Fruit');
            const firstCall = cleanCol.oneHotEncoded;
            const secondCall = cleanCol.oneHotEncoded;

            expect(firstCall).toBe(secondCall);
        });

        it('should throw an error during oneHotEncoded if column contains null values', () => {
            expect(() => column.oneHotEncoded).toThrowError(
                'Cannot perform one-hot encoding on column "FruitColumn" containing missing or null values.'
            );
        });
    });
});