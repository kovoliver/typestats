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
});