import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';
import GroupedTable from '../../core/dataStructures/GroupedTable';

describe('Table - Filtering, Sorting & Grouping', () => {
    let table: Table;

    beforeEach(() => {
        const data = [
            new Float64Array([1, 2, 3, 4]),
            ['A', 'B', 'A', 'B'],
            new Float64Array([10, 20, 30, 40])
        ];

        const infos: ColInfo[] = [
            { label: 'id', type: 'number' },
            { label: 'category', type: 'string' },
            { label: 'score', type: 'number' }
        ];
        
        table = new Table(data, infos);
    });

    it('should filter rows based on single condition with where', () => {
        const filtered = table.where('score', val => val > 20);
        expect(filtered.rowCount).toBe(2);
        expect(filtered.getCol('id').values).toEqual(new Float64Array([3, 4]));
    });

    it('should filter rows based on two columns with where using logical AND', () => {
        const filtered = table.where(
            ['category', 'score'],
            (cat, score) => cat === 'A' && score > 10
        );

        expect(filtered.rowCount).toBe(1);
        expect(filtered.getCol('id').values).toEqual(new Float64Array([3]));
    });

    it('should filter rows based on two columns with where using logical OR', () => {
        const filtered = table.where(
            ['category', 'score'],
            (cat, score) => cat === 'B' || score === 10
        );

        expect(filtered.rowCount).toBe(3);
    });

    it('should filter rows based on three columns with where using complex logic', () => {
        const filtered = table.where(
            ['id', 'category', 'score'],
            (id, cat, score) => id < 4 && cat === 'A' && score >= 10
        );

        expect(filtered.rowCount).toBe(2);
        expect(filtered.getCol('id').values).toEqual(new Float64Array([1, 3]));
    });

    it('should sort table in ascending and descending order', () => {
        const asc = table.orderByAsc('score');
        expect(asc.getCol('score').values).toEqual(new Float64Array([10, 20, 30, 40]));

        const desc = table.orderByDesc('score');
        expect(desc.getCol('score').values).toEqual(new Float64Array([40, 30, 20, 10]));
    });

    it('should group table by given column(s) and return GroupedTable instance', () => {
        const grouped = table.groupBy('category');
        expect(grouped).toBeInstanceOf(GroupedTable);
    });
});