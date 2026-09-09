import { DbConnection } from '../types/interfaces.js';
import { DbConfig, DbEngineType } from '../types/types.js';

export async function createConnection(config: DbConfig): Promise<DbConnection> {
    switch (config.engine) {
        case DbEngineType.mysql: {
            try {
                const mysql = await import('mysql2/promise');
                const pool = mysql.createPool({
                    host: config.host,
                    port: config.port ?? 3306,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                    connectionLimit: config.connectionLimit ?? 10,
                });

                return {
                    engine: DbEngineType.mysql,
                    nativePool: pool,
                    execQuery: async (sql: string, params?: any[]) => {
                        const [rows] = await pool.query(sql, params);
                        return rows as Record<string, any>[];
                    },
                    close: async () => {
                        await pool.end();
                    },
                };
            } catch (err: any) {
                if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
                    throw new Error(
                        'To use the MySQL database engine, you must install the `mysql2` package. Installation: `npm i mysql2` lower'
                    );
                }
                throw err;
            }
        }

        case DbEngineType.postgresql: {
            try {
                const pg = await import('pg');
                const pool = new pg.Pool({
                    host: config.host,
                    port: config.port ?? 5432,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                    max: config.connectionLimit ?? 10,
                });

                return {
                    engine: DbEngineType.postgresql,
                    nativePool: pool,
                    execQuery: async (sql: string, params?: any[]) => {
                        const res = await pool.query(sql, params);
                        return res.rows as Record<string, any>[];
                    },
                    close: async () => {
                        await pool.end();
                    },
                };
            } catch (err: any) {
                if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
                    throw new Error(
                        'To use the PostgreSQL database engine, you must install the `pg` package. Installation: `npm i pg`'
                    );
                }
                throw err;
            }
        }

        case DbEngineType.mssql: {
            try {
                const mssqlModule = await import('mssql');
                const mssql = mssqlModule.default || mssqlModule;

                const pool = new mssql.ConnectionPool({
                    server: config.host,
                    port: config.port ?? 1433,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                    pool: {
                        max: config.connectionLimit ?? 10,
                    },
                    options: {
                        trustServerCertificate: true,
                    },
                });

                const connectedPool = await pool.connect();

                return {
                    engine: DbEngineType.mssql,
                    nativePool: connectedPool,
                    execQuery: async (sql: string) => {
                        const res = await connectedPool.request().query(sql);
                        return res.recordset as Record<string, any>[];
                    },
                    close: async () => {
                        await connectedPool.close();
                    },
                };
            } catch (err: any) {
                if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
                    throw new Error(
                        'To use the MSSQL database engine, you must install the `mssql` package. Installation: `npm i mssql`'
                    );
                }
                throw err;
            }
        }

        default:
            throw new Error(`Unsupported database engine: ${(config as any).engine}`);
    }
}