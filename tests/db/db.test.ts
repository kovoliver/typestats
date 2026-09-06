import { describe, it, expect, afterAll } from 'vitest';
import { createConnection } from '../../core/db/connectionPool';
import { getTableFromQuery } from '../../core/db/getTableFromQuery';
import { DbEngineType, DbConnection } from '../../core/types';
import Table from '../../core/dataStructures/Table';
import dotenv from 'dotenv';
dotenv.config();

describe('Database Integration Tests (Local RDBMS)', () => {
    const connections: DbConnection[] = [];

    afterAll(async () => {
        for (const conn of connections) {
            await conn.close();
        }
    });

    it('should fetch data and convert to Table from local MySQL', async () => {
        const conn = await createConnection({
            engine: DbEngineType.mysql,
            host: process.env.MYSQL_HOST ?? '',
            port: parseInt(process.env.MYSQL_PORT ?? '3306'),
            user: process.env.MYSQL_USER ?? '',
            password: process.env.MYSQL_PASSWORD ?? '',
            database: process.env.MYSQL_DATABASE ?? '',
        });
        connections.push(conn);

        const table = await getTableFromQuery(conn, 'SELECT * FROM sales_data');

        expect(table).toBeInstanceOf(Table);
        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.table.length).toBeGreaterThan(0);
    });

    it('should fetch data and convert to Table from local PostgreSQL', async () => {
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

        expect(table).toBeInstanceOf(Table);
        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.table.length).toBeGreaterThan(0);
    });

    it('should fetch data and convert to Table from local MSSQL', async () => {
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

        expect(table).toBeInstanceOf(Table);
        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.table.length).toBeGreaterThan(0);
    });
});