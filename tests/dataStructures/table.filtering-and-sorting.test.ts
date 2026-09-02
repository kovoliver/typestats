import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';
import GroupedTable from '../../core/dataStructures/GroupedTable';

describe('Table - Filtering, Sorting & Grouping', () => {
    let table: Table;

    beforeEach(() => {
        const data = [
            [1, 2, 3, 4],
            ['A', 'B', 'A', 'B'],
            [10, 20, 30, 40]
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
        expect(filtered.getCol('id').values).toEqual([3, 4]);
    });

    it('should filter with logical AND using whereAll', () => {
        const filtered = table.whereAll(
            ['category', 'score'],
            [cat => cat === 'A', score => score > 10]
        );
        expect(filtered.rowCount).toBe(1);
        expect(filtered.getCol('id').values).toEqual([3]);
    });

    it('should filter with logical OR using whereAny', () => {
        const filtered = table.whereAny(
            ['category', 'score'],
            [cat => cat === 'B', score => score === 10]
        );
        expect(filtered.rowCount).toBe(3);
    });

    it('should sort table in ascending and descending order', () => {
        const asc = table.orderByAsc('score');
        expect(asc.getCol('score').values).toEqual([10, 20, 30, 40]);

        const desc = table.orderByDesc('score');
        expect(desc.getCol('score').values).toEqual([40, 30, 20, 10]);
    });

    it('should group table by given column(s) and return GroupedTable instance', () => {
        const grouped = table.groupBy('category');
        expect(grouped).toBeInstanceOf(GroupedTable);
    });
});