import { describe, it, expect } from 'vitest';
import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

describe('Table fillNa & fillNaNumeric Integration Tests', () => {
    const getDataset = () => {
        const mockData: any[][] = [
            ['Alice', null, 'Charlie', ''],               // Name (string - null & empty string)
            [10, 20, null, NaN],                           // Age (number - null & NaN)
            [true, null, false, true]                      // IsActive (bool - null)
        ];

        const mockColInfos: ColInfo[] = [
            { label: 'Name', type: 'string' },
            { label: 'Age', type: 'number' },
            { label: 'IsActive', type: 'bool' }
        ];

        return { mockData, mockColInfos };
    };

    describe('1. Constant Imputation via fillNa()', () => {
        it('should fill missing numeric values with constant replacement', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const filled = table.fillNa('Age', 0);

            expect(filled.getCol('Age').values).toEqual([10, 20, 0, 0]);
            expect(filled.rowCount).toBe(4);
            expect(filled).toBeInstanceOf(Table);
        });

        it('should fill missing string values with constant replacement', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const filled = table.fillNa('Name', 'Unknown');

            expect(filled.getCol('Name').values).toEqual(['Alice', 'Unknown', 'Charlie', 'Unknown']);
        });

        it('should fill missing boolean values with constant replacement', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const filled = table.fillNa('IsActive', false);

            expect(filled.getCol('IsActive').values).toEqual([true, false, false, true]);
        });

        it('should maintain strict immutability (original table remains untouched)', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            table.fillNa('Age', 999);

            // A NumberColumn a null-t is NaN-ná alakítja a prepareData során,
            // így az eredeti táblázat 2. és 3. indexén is NaN-nak kell maradnia
            expect(Number.isNaN(table.getCol('Age').values[2] as number)).toBe(true);
            expect(Number.isNaN(table.getCol('Age').values[3] as number)).toBe(true);
        });

        it('should throw strict error when type mismatch occurs', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            // Számos oszlopba szöveget próbálunk tölteni
            expect(() => table.fillNa('Age', 'N/A')).toThrow(
                'You must provide a numeric replacement value for numeric columns!'
            );

            // Boolean oszlopba számot próbálunk tölteni
            expect(() => table.fillNa('IsActive', 1)).toThrow(
                'You must provide a boolean replacement value (true/false) for boolean columns!'
            );

            // Szöveges oszlopba booleant próbálunk tölteni
            expect(() => table.fillNa('Name', true)).toThrow(
                'You must provide a string replacement value for string columns!'
            );
        });
    });

    describe('2. Statistical Imputation via fillNaNumeric()', () => {
        it('should impute numeric missing values using MEAN strategy', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            // Érvényes értékek: 10 és 20 -> Mean = 15
            const filled = table.fillNaNumeric('Age', 'MEAN');

            expect(filled.getCol('Age').values).toEqual([10, 20, 15, 15]);
        });

        it('should impute numeric missing values using MEDIAN strategy', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            // Érvényes értékek: 10 és 20 -> Median = 15
            const filled = table.fillNaNumeric('Age', 'MEDIAN');

            expect(filled.getCol('Age').values).toEqual([10, 20, 15, 15]);
        });

        it('should throw error when calling fillNaNumeric on non-numeric columns', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            expect(() => table.fillNaNumeric('Name', 'MEAN')).toThrow(
                'Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!'
            );

            expect(() => table.fillNaNumeric('IsActive', 'MEDIAN')).toThrow(
                'Statistical imputation (MEAN, MEDIAN, MODE) is only applicable to numeric columns!'
            );
        });
    });

    describe('3. Method Chaining Capability', () => {
        it('should support chaining multiple fillNa and fillNaNumeric calls cleanly', () => {
            const { mockData, mockColInfos } = getDataset();
            const table = new Table(mockData, mockColInfos);

            const fullyCleaned = table
                .fillNaNumeric('Age', 'MEAN')
                .fillNa('Name', 'Anonymous')
                .fillNa('IsActive', false);

            expect(fullyCleaned.getCol('Name').values).toEqual(['Alice', 'Anonymous', 'Charlie', 'Anonymous']);
            expect(fullyCleaned.getCol('Age').values).toEqual([10, 20, 15, 15]);
            expect(fullyCleaned.getCol('IsActive').values).toEqual([true, false, false, true]);
        });
    });
});