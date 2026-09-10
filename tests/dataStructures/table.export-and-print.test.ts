import { describe, it, expect, beforeEach, vi } from 'vitest';
import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';

describe('Table - Export & Console Printing', () => {
    let table: Table;

    beforeEach(() => {
        const data = [
            [1, 2],
            ['Alice', 'Bob']
        ];
        const infos: ColInfo[] = [
            { label: 'id', type: 'number' },
            { label: 'name', type: 'string' }
        ];
        table = new Table(data, infos);
    });

    it('should export table as array of objects via toObject', () => {
        const obj = table.toObject();
        expect(obj).toEqual([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ]);
    });

    it('should export table as CSV string with separator via toCSV', () => {
        const csv = table.toCSV(';');
        expect(csv).toBe("id;name\n1;Alice\n2;Bob\n");
    });

    it('should export table as raw matrix via toMatrix', () => {
        const matrix = table.toMatrix();
        expect(matrix).toEqual([
            [1, 'Alice'],
            [2, 'Bob']
        ]);
    });

    it('should call console.table on print/head/tail without throwing', () => {
        const spy = vi.spyOn(console, 'table').mockImplementation(() => { });

        table.print();
        table.head(1);
        table.tail(1);

        expect(spy).toHaveBeenCalledTimes(3);
        spy.mockRestore();
    });

    it('should format DateColumn values in console.table as Date or DateTime based on time component presence', () => {
        const spy = vi.spyOn(console, 'table');

        const dateOnly = new Date('2025-10-10T00:00:00.000Z');
        const dateTime = new Date('2025-10-10T05:10:12.000Z');

        const dateData = [
            [1, 2],
            [dateOnly, dateTime]
        ];

        const dateInfos: ColInfo[] = [
            { label: 'id', type: 'number' },
            { label: 'timestamp', type: 'date' }
        ];

        const dateTable = new Table(dateData, dateInfos);

        dateTable.print();

        expect(spy).toHaveBeenCalledWith({
            0: { id: 1, timestamp: '2025-10-10' },
            1: { id: 2, timestamp: '2025-10-10 05:10:12' }
        });

        spy.mockRestore();
    });

    it('Should calculate covariance matrix correctly', () => {
        const infos: ColInfo[] = [
            { label: 'col_1', type: 'number' },
            { label: 'col_2', type: 'number' },
            { label: 'col_3', type: 'number' },
            { label: 'col_4', type: 'number' },
            { label: 'col_5', type: 'number' },
            { label: 'col_6', type: 'number' },
            { label: 'col_7', type: 'number' },
            { label: 'col_8', type: 'number' },
            { label: 'col_9', type: 'number' },
            { label: 'col_10', type: 'number' }
        ];

        const data = [
            [42.8, 17.3, 89.1, 5.4, 63.0],
            [104.2, 88.6, 91.0, 112.5, 76.1],
            [-3.2, 0.5, 12.8, -8.1, 4.3],
            [550, 420, 680, 310, 590],
            [0.12, 0.85, 0.43, 0.91, 0.27],
            [15.8, 22.4, 19.1, 31.0, 27.5],
            [1002, 998, 1015, 1007, 1011],
            [7.4, 6.8, 8.1, 7.9, 6.5],
            [144, 256, 312, 189, 405],
            [3.14, 2.71, 1.41, 1.73, 0.57]
        ];

        table = new Table(data, infos);
        const result = table.covariance(['col_1', 'col_2', 'col_3', 'col_4'], true);

        const expectedCovariance = [
            [1149.537, -264.102, 241.2885, 4815.5],
            [-264.102, 200.927, -75.896, -1187.0],
            [241.2885, -75.896, 62.623, 991.75],
            [4815.5, -1187.0, 991.75, 21250.0]
        ];

        result.forEach((row: number[], i: number) => {
            row.forEach((val: number, j: number) => {
                expect(val).toBeCloseTo(expectedCovariance[i][j], 3);
            });
        });
    });
});