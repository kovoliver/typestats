import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';
import NumberColumn from '../../core/dataStructures/NumberColumn';
import StringColumn from '../../core/dataStructures/StringColumn';
import BoolColumn from '../../core/dataStructures/BoolColumn';

describe('Table - Metadata & Type Conversion', () => {
    let sampleData: any[][];
    let colInfos: ColInfo[];

    beforeEach(() => {
        sampleData = [
            [1, 2, 3],
            ['true', 'false', 'true'],
            ['apple', 'banana', 'cherry']
        ];
        colInfos = [
            { label: 'age', type: 'number' },
            { label: 'isStudent', type: 'string' },
            { label: 'fruit', type: 'string' }
        ];
    });

    it('should initialize table correctly with inferred/provided column types', () => {
        const table = new Table(sampleData, colInfos);
        expect(table.rowCount).toBe(3);
        expect(table.getCol('age')).toBeInstanceOf(NumberColumn);
    });

    it('should rename a label using setLabel and throw if target already exists or is empty', () => {
        const table = new Table(sampleData, colInfos);
        table.setLabel('age', 'user_age');
        expect(table.getCol('user_age').label).toBe('user_age');

        expect(() => table.setLabel('user_age', '')).toThrow('The new label must be a non-empty string!');
        expect(() => table.setLabel('user_age', 'fruit')).toThrow('already exists');
    });

    it('should set multiple labels at once with setLabels', () => {
        const table = new Table(sampleData, colInfos);
        table.setLabels(['age', 'fruit'], ['new_age', 'new_fruit']);
        expect(table.getCol('new_age')).toBeDefined();
        expect(table.getCol('new_fruit')).toBeDefined();
    });

    it('should throw when setLabels receives mismatched lengths', () => {
        const table = new Table(sampleData, colInfos);
        expect(() => table.setLabels(['age'], ['label1', 'label2'])).toThrow();
    });

    it('should explicitly convert column types via toNumberCol, toStringCol, toBoolCol', () => {
        const table = new Table(sampleData, colInfos);
        
        table.toBoolCol('isStudent');
        expect(table.getCol('isStudent')).toBeInstanceOf(BoolColumn);

        table.toStringCol('age');
        expect(table.getCol('age')).toBeInstanceOf(StringColumn);

        table.toNumberCol('age');
        expect(table.getCol('age')).toBeInstanceOf(NumberColumn);
    });

    it('should throw error when getting a column with invalid or non-existing identifier', () => {
        const table = new Table(sampleData, colInfos);
        expect(() => table.getCol('non_existing')).toThrow();
        expect(() => table.getCol(-1)).toThrow();
        expect(() => table.getCol(99)).toThrow();
    });
});