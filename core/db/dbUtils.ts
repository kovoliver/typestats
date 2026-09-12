import { Readable } from 'stream';
import { DbConnection } from "../types/interfaces.js";
import { ColInfo, ColType, DbStreamResult } from "../types/types.js";

export function mapMysqlTypeToColType(typeCode: number): ColType {
    if ([1, 2, 3, 4, 5, 8, 9, 246].includes(typeCode)) return 'number';
    if ([7, 10, 11, 12, 13, 14].includes(typeCode)) return 'date';
    return 'string';
}

export function mapPgTypeToColType(oid: number): ColType {
    if ([20, 21, 23, 700, 701, 1700].includes(oid)) return 'number';
    if (oid === 16) return 'bool';
    if ([1082, 1114, 1184].includes(oid)) return 'date';
    return 'string';
}

export function mapMssqlTypeToColType(typeName: string): ColType {
    const name = typeName.toLowerCase();
    if ([
        'int', 'bigint', 'smallint', 'tinyint',
        'decimal', 'numeric', 'float',
        'real', 'money', 'smallmoney'
    ].includes(name)) {
        return 'number';
    }
    if (name === 'bit') return 'bool';
    if (['date', 'datetime', 'datetime2', 'smalldatetime', 'time'].includes(name)) return 'date';
    return 'string';
}

export async function getDbStream(
    sql: string,
    conn: DbConnection,
    params?: any[]
): Promise<DbStreamResult> {
    switch (conn.engine) {
        case 'mysql': {
            const connection = await conn.nativePool.getConnection();
            const rawStream = (connection.connection || connection).query(sql, params).stream();

            let resolveMeta: (meta: ColInfo[]) => void;
            const colInfosPromise = new Promise<ColInfo[]>((res) => { resolveMeta = res; });

            rawStream.on('fields', (fields: any[]) => {
                const colInfos: ColInfo[] = fields.map((f) => ({
                    label: f.name,
                    type: mapMysqlTypeToColType(f.type)
                }));
                resolveMeta(colInfos);
            });

            rawStream.on('end', () => connection.release());
            rawStream.on('error', () => {
                resolveMeta([]);
                connection.release();
            });

            const stream = Readable.from(rawStream);
            return { stream, colInfosPromise };
        }

        case 'postgresql': {
            const { default: QueryStream } = await import('pg-query-stream');
            const client = await conn.nativePool.connect();
            const queryStream = new QueryStream(sql, params);
            const pgStream = client.query(queryStream);

            let resolveMeta: (meta: ColInfo[]) => void;
            let isMetaResolved = false;
            const colInfosPromise = new Promise<ColInfo[]>((res) => { resolveMeta = res; });

            const safeResolveMeta = (meta: ColInfo[]) => {
                if (!isMetaResolved) {
                    isMetaResolved = true;
                    resolveMeta(meta);
                }
            };

            const extractFields = (): any[] | undefined => {
                return (queryStream as any)._result?.fields
                    ?? (queryStream as any).cursor?._result?.fields;
            };

            let released = false;
            const release = () => {
                if (!released) {
                    released = true;
                    client.release();
                }
            };

            const asyncStream = (async function* () {
                const queue: any[] = [];
                let error: any = null;
                let done = false;
                let resolveNext: (() => void) | null = null;

                const notify = () => {
                    if (resolveNext) {
                        const resolve = resolveNext;
                        resolveNext = null;
                        resolve();
                    }
                };

                pgStream.on('data', (row: any) => {
                    if (!isMetaResolved) {
                        const fields = extractFields();

                        if (fields && fields.length > 0) {
                            const colInfos: ColInfo[] = fields.map((f: any) => ({
                                label: f.name,
                                type: mapPgTypeToColType(f.dataTypeID)
                            }));
                            safeResolveMeta(colInfos);
                        }
                    }
                    
                    queue.push(row);
                    notify();
                });

                pgStream.on('error', (err: any) => {
                    error = err;
                    safeResolveMeta([]);
                    notify();
                });

                pgStream.on('end', () => {
                    done = true;
                    safeResolveMeta([]);
                    notify();
                });

                pgStream.on('close', () => {
                    done = true;
                    notify();
                });

                try {
                    while (true) {
                        if (error) throw error;
                        while (queue.length > 0) yield queue.shift();
                        if (done && queue.length === 0) break;

                        await new Promise<void>((resolve) => { resolveNext = resolve; });
                    }
                } finally {
                    release();
                }
            })();

            return { stream: asyncStream, colInfosPromise };
        }

        case 'mssql': {
            const request = conn.nativePool.request();
            request.stream = true;

            if (params && params.length > 0) {
                params.forEach((param, index) => {
                    request.input(`p${index}`, param);
                });
            }

            let resolveMeta: (meta: ColInfo[]) => void;
            const colInfosPromise = new Promise<ColInfo[]>((res) => { resolveMeta = res; });

            request.on('recordset', (columns: Record<string, any>) => {
                const colInfos: ColInfo[] = Object.keys(columns).map((colName) => ({
                    label: colName,
                    type: mapMssqlTypeToColType(columns[colName].type.name)
                }));
                resolveMeta(colInfos);
            });

            const asyncStream = (async function* () {
                const queue: any[] = [];
                let error: any = null;
                let done = false;
                let resolveNext: (() => void) | null = null;

                const notify = () => {
                    if (resolveNext) {
                        const resolve = resolveNext;
                        resolveNext = null;
                        resolve();
                    }
                };

                request.on('row', (row: never) => {
                    queue.push(row);
                    notify();
                });

                request.on('error', (err: never) => {
                    error = err;
                    resolveMeta([]);
                    notify();
                });

                request.on('done', () => {
                    done = true;
                    notify();
                });

                request.query(sql);

                while (true) {
                    if (error) throw error;
                    while (queue.length > 0) yield queue.shift();
                    if (done && queue.length === 0) break;

                    await new Promise<void>((resolve) => { resolveNext = resolve; });
                }
            })();

            return { stream: asyncStream, colInfosPromise };
        }

        default:
            throw new Error('The provided database engine is invalid!');
    }
}

export async function* makeDBChunk(
    stream: AsyncIterable<any> | Readable,
    chunkSize: number = 50_000
) {
    let chunk: any[] = [];

    for await (const row of stream as AsyncIterable<any>) {
        chunk.push(row);

        if (chunk.length === chunkSize) {
            yield chunk;
            chunk = [];
        }
    }

    if (chunk.length > 0) yield chunk;
}