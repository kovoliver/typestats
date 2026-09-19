import { describe, it, expect, afterAll } from 'vitest';
import { getTableFromCSV, getTableFromJSON, getTableFromNDJSON } from '../../core/io/nodeIO';
import { getTableFromCSVP } from '../../core/io';
import { createConnection } from '../../core/db/connectionPool';
import { getTableFromQuery } from '../../core/db/getTableFromQuery';
import { DbEngineType } from '../../core/types';
import Table from '../../core/dataStructures/Table';
import { DbConnection } from '../../core/types/interfaces';
import dotenv from 'dotenv';

dotenv.config();

function assertDateColumnStoresOnlyNumbersOrNull(table: Table, colLabel: string): void {
    const colIndex = table.colInfos.findIndex(info => info.label === colLabel);
    if (colIndex === -1) {
        throw new Error(`"${colLabel}" is missing!`);
    }

    const rawMatrix = table.originalTable;
    const rawColumnValues = rawMatrix[colIndex];

    for (let i = 0; i < rawColumnValues.length; i++) {
        const val = rawColumnValues[i];
        
        const isValidType = val === null || (typeof val === 'number' && !Number.isNaN(val));
        expect(
            isValidType,
            `Expected raw internal Table value for date column "${colLabel}" to be number or null, but received: ${typeof val} (${val}) at index ${i}`
        ).toBe(true);
    }
}

describe('Strict Storage Verification: Date columns must store ONLY numbers (timestamps) or null', () => {
    const connections: DbConnection[] = [];

    afterAll(async () => {
        for (const conn of connections) {
            await conn.close();
        }
    });

    it('should store ONLY number/null in date column when parsed via getTableFromCSV (Node.js)', async () => {
        const csvPath = './sampleData/date_test_dataset.csv';
        const table = await getTableFromCSV(csvPath, ';');

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });

    it('should store ONLY number/null in date column when parsed via getTableFromCSVP (Worker Pool)', async () => {
        const csvPath = './sampleData/date_test_dataset.csv';
        const table = await getTableFromCSVP(csvPath, ';');

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });

    it('should store ONLY number/null in date column when parsed via getTableFromJSON (Node.js)', async () => {
        const jsonPath = './sampleData/date_test_dataset.json';
        const table = await getTableFromJSON(jsonPath);

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });

    it('should store ONLY number/null in date column when parsed via getTableFromNDJSON (Node.js)', async () => {
        const ndjsonPath = './sampleData/date_test_dataset.ndjson';
        const table = await getTableFromNDJSON(ndjsonPath);

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });

    it('should store ONLY number/null in date column when parsed from MySQL database (sales_data table)', async () => {
        const conn = await createConnection({
            engine: DbEngineType.mysql,
            host: process.env.MYSQL_HOST ?? 'localhost',
            port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
            user: process.env.MYSQL_USER ?? 'root',
            password: process.env.MYSQL_PASSWORD ?? '',
            database: process.env.MYSQL_DATABASE ?? 'typestats_test',
        });
        connections.push(conn);

        const table = await getTableFromQuery(conn, 'SELECT * FROM sales_data');

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });

    it('should store ONLY number/null in date column when parsed from PostgreSQL database (sales_data table)', async () => {
        const conn = await createConnection({
            engine: DbEngineType.postgresql,
            host: process.env.PG_HOST ?? 'localhost',
            port: parseInt(process.env.PG_PORT ?? '5432', 10),
            user: process.env.PG_USER ?? 'postgres',
            password: process.env.PG_PASSWORD ?? 'a',
            database: process.env.PG_DATABASE ?? 'typestats_test',
        });
        connections.push(conn);

        const table = await getTableFromQuery(conn, 'SELECT * FROM sales_data');

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });

    it('should store ONLY number/null in date column when parsed from MSSQL database (sales_data table)', async () => {
        const conn = await createConnection({
            engine: DbEngineType.mssql,
            host: process.env.MSSQL_HOST ?? 'localhost',
            port: parseInt(process.env.MSSQL_PORT ?? '1433', 10),
            user: process.env.MSSQL_USER ?? 'sa',
            password: process.env.MSSQL_PASSWORD ?? 'asdf',
            database: process.env.MSSQL_DATABASE ?? 'typestats_test',
        });
        connections.push(conn);

        const table = await getTableFromQuery(conn, 'SELECT * FROM sales_data');

        assertDateColumnStoresOnlyNumbersOrNull(table, 'created_at');
    });
});