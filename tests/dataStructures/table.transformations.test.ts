import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';

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

    describe('applyColumn', () => {
        it('should transform column values in-place', () => {
            table.applyColumn('a', val => (val as number) * 10);
            expect(table.getCol('a').values).toEqual([100, 200, 300]);
        });

        it('should work using column index identifier', () => {
            table.applyColumn(2, val => String(val).toUpperCase());
            expect(table.getCol('firstName').values).toEqual(['JOHN', 'JANE', 'BOB']);
        });

        it('should automatically change column type if function changes target data type', () => {
            table.applyColumn('firstName', val => String(val).length);
            
            expect(table.getCol('firstName').values).toEqual([4, 4, 3]);
            expect(table.colInfos.find(info => info.label === 'firstName')?.type).toBe('number');
        });

        it('should preserve NaN values in numeric columns during transformation', () => {
            const nullData = [[10, null, NaN]];
            const nullInfos: ColInfo[] = [{ label: 'val', type: 'number' }];
            const nullTable = new Table(nullData, nullInfos);

            nullTable.applyColumn('val', val => (val as number) + 5);

            const values = nullTable.getCol('val').values;
            expect(values[0]).toBe(15);
            expect(Number.isNaN(values[1])).toBe(true);
            expect(Number.isNaN(values[2])).toBe(true);
        });

        it('should preserve null values in string columns during transformation', () => {
            const stringData = [['hello', null, undefined]];
            const stringInfos: ColInfo[] = [{ label: 'text', type: 'string' }];
            const stringTable = new Table(stringData, stringInfos);

            stringTable.applyColumn('text', val => String(val).toUpperCase());

            const values = stringTable.getCol('text').values;
            expect(values[0]).toBe('HELLO');
            expect(values[1]).toBeNull();
            expect(values[2]).toBeNull();
        });

        it('should throw an error if the transformation function fails', () => {
            expect(() => {
                table.applyColumn('a', () => {
                    throw new Error('Unexpected Error');
                });
            }).toThrow('The transformation function failed on column "a"!');
        });
    });
});