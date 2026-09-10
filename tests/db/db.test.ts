import { describe, it, expect, afterAll } from 'vitest';
import { createConnection } from '../../core/db/connectionPool';
import { getTableFromQuery } from '../../core/db/getTableFromQuery';
import { DbEngineType } from '../../core/types';
import Table from '../../core/dataStructures/Table';
import dotenv from 'dotenv';
import { DbConnection } from '../../core/types/interfaces';
import { performance } from 'perf_hooks';
import { getTableFromQueryP } from '../../core/db/getTableFromQueryParallel';

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
            host: process.env.MYSQL_HOST ?? 'localhost',
            port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
            user: process.env.MYSQL_USER ?? 'root',
            password: process.env.MYSQL_PASSWORD ?? '',
            database: process.env.MYSQL_DATABASE ?? 'typestats_test',
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

    it('PERFORMANCE TEST: Large dataset streaming benchmark (MySQL - mock_data)', async () => {
        const conn = await createConnection({
            engine: DbEngineType.mysql,
            host: process.env.MYSQL_HOST ?? 'localhost',
            port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
            user: process.env.MYSQL_USER ?? 'root',
            password: process.env.MYSQL_PASSWORD ?? '',
            database: 'typestats_test',
        });
        connections.push(conn);

        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const startTime = performance.now();

        const table = await getTableFromQuery(conn, 'SELECT * FROM mock_data');

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const durationInSeconds = (endTime - startTime) / 1000;
        const rowsPerSecond = Math.round(table.rowCount / durationInSeconds);
        const memoryDiffMB = (endMemory - startMemory).toFixed(2);

        console.log('\n==================================================');
        console.log('🚀 MYSQL PERFORMANCE BENCHMARK RESULTS');
        console.log('==================================================');
        console.log(`📊 Tábla:             mock_data`);
        console.log(`🔢 Beolvasott sorok:  ${table.rowCount.toLocaleString()} db`);
        console.log(`📐 Oszlopok száma:    ${table.colCount} db`);
        console.log(`⏱️  Feldolgozási idő:  ${durationInSeconds.toFixed(3)} másodperc`);
        console.log(`⚡ Sebesség:          ${rowsPerSecond.toLocaleString()} sor/másodperc`);
        console.log(`🧠 Memória változás:  +${memoryDiffMB} MB`);
        console.log('==================================================\n');

        expect(table).toBeInstanceOf(Table);
        expect(table.rowCount).toBeGreaterThan(0);
    }, 60_000);

    it('PERFORMANCE TEST: Large dataset streaming benchmark PARALLEL (MySQL - mock_data)', async () => {
        const conn = await createConnection({
            engine: DbEngineType.mysql,
            host: process.env.MYSQL_HOST ?? 'localhost',
            port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
            user: process.env.MYSQL_USER ?? 'root',
            password: process.env.MYSQL_PASSWORD ?? '',
            database: 'typestats_test',
        });
        connections.push(conn);

        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        const startTime = performance.now();
        const table = await getTableFromQueryP(conn, 'SELECT * FROM mock_data');

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        const durationInSeconds = (endTime - startTime) / 1000;
        const rowsPerSecond = Math.round(table.rowCount / durationInSeconds);
        const memoryDiffMB = (endMemory - startMemory).toFixed(2);

        console.log('\n==================================================');
        console.log('⚡ MYSQL PARALLEL PERFORMANCE BENCHMARK RESULTS');
        console.log('==================================================');
        console.log(`📊 Tábla:             mock_data`);
        console.log(`🔢 Beolvasott sorok:  ${table.rowCount.toLocaleString()} db`);
        console.log(`📐 Oszlopok száma:    ${table.colCount} db`);
        console.log(`⏱️  Feldolgozási idő:  ${durationInSeconds.toFixed(3)} másodperc`);
        console.log(`⚡ Sebesség:          ${rowsPerSecond.toLocaleString()} sor/másodperc`);
        console.log(`🧠 Memória változás:  +${memoryDiffMB} MB`);
        console.log('==================================================\n');

        expect(table).toBeInstanceOf(Table);
        expect(table.rowCount).toBeGreaterThan(0);
    }, 60_000);
});