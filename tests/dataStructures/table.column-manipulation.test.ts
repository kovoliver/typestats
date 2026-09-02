import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';

describe('Table - Column Manipulation', () => {
    let table: Table;

    beforeEach(() => {
        const data = [
            [10, 20],
            ['A', 'B'],
            [true, false]
        ];
        const infos: ColInfo[] = [
            { label: 'colA', type: 'number' },
            { label: 'colB', type: 'string' },
            { label: 'colC', type: 'bool' }
        ];
        table = new Table(data, infos);
    });

    it('should select specific columns and return a new Table instance', () => {
        const selected = table.select('colA', 'colC');
        expect(selected.rowCount).toBe(2);
        expect(selected.getCol('colA')).toBeDefined();
        expect(() => selected.getCol('colB')).toThrow();
    });

    it('should throw when select is called with no identifiers', () => {
        expect(() => table.select()).toThrow('At least one column identifier must be provided');
    });

    it('should drop specified columns', () => {
        const dropped = table.drop('colB');
        expect(dropped.getCol('colA')).toBeDefined();
        expect(dropped.getCol('colC')).toBeDefined();
        expect(() => dropped.getCol('colB')).toThrow();
    });

    it('should add a column to the beginning (addColumnFirst)', () => {
        const newColData = [100, 200];
        const info: ColInfo = { label: 'firstCol', type: 'number' };
        const result = table.addColumnFirst(newColData, info);

        expect(result.getCol(0).label).toBe('firstCol');
        expect(result.getCol('colA')).toBeDefined();
    });

    it('should add a column to the end (addColumnLast)', () => {
        const newColData = ['x', 'y'];
        const info: ColInfo = { label: 'lastCol', type: 'string' };
        const result = table.addColumnLast(newColData, info);

        expect(result.getCol(3).label).toBe('lastCol');
    });

    it('should add a column at a specific index (addColumnAt)', () => {
        const newColData = [false, true];
        const info: ColInfo = { label: 'middleCol', type: 'bool' };
        const result = table.addColumnAt(newColData, info, 1);

        expect(result.getCol(1).label).toBe('middleCol');
    });

    it('should throw an error if added column length does not match row count', () => {
        const invalidData = [1];
        const info: ColInfo = { label: 'invalid', type: 'number' };
        expect(() => table.addColumnLast(invalidData, info)).toThrow();
    });
});