import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

describe('Table - Column Transformations & Operations', () => {
    let table: Table;

    beforeEach(() => {
        const data = [
            [10, 20, 30],
            [2, 4, 5],
            ['John', 'Jane', 'Bob'],
            ['Doe', 'Smith', 'Builder']
        ];
        const infos: ColInfo[] = [
            { label: 'a', type: 'number' },
            { label: 'b', type: 'number' },
            { label: 'firstName', type: 'string' },
            { label: 'lastName', type: 'string' }
        ];
        table = new Table(data, infos);
    });

    it('should transform a column values via mapColumn', () => {
        const mapped = table.mapColumn('a', 'a_double', val => (val as number) * 2);
        expect(mapped.getCol('a_double').values).toEqual([20, 40, 60]);
    });

    it('should combine numeric columns using arithmetic operations (+, -, *, /)', () => {
        const added = table.combineColumns(['a', 'b'], '+', 'sum');
        expect(added.getCol('sum').values).toEqual([12, 24, 35]);

        const divided = table.combineColumns(['a', 'b'], '/', 'div');
        expect(divided.getCol('div').values).toEqual([5, 5, 6]);
    });

    it('should handle division by zero in combineColumns by assigning NaN', () => {
        const zeroData = [[10], [0]];
        const zeroInfos: ColInfo[] = [
            { label: 'num', type: 'number' },
            { label: 'denom', type: 'number' }
        ];
        const zeroTable = new Table(zeroData, zeroInfos);

        const result = zeroTable.combineColumns(['num', 'denom'], '/', 'res');
        expect(Number.isNaN(result.getCol('res').values[0])).toBe(true);
    });

    it('should merge string columns with a specified separator via mergeColumns', () => {
        const merged = table.mergeColumns(['firstName', 'lastName'], ' ', 'fullName');
        expect(merged.getCol('fullName').values).toEqual(['John Doe', 'Jane Smith', 'Bob Builder']);
    });
});