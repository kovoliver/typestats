import { DbConnection } from "../types/interfaces.js";

export async function getDbStream(
    sql: string,
    conn: DbConnection,
    params?: any[]
): Promise<AsyncIterable<any>> {
    switch (conn.engine) {
        case 'mysql': {
            const connection = await conn.nativePool.getConnection();
            const stream = (connection.connection || connection).query(sql, params).stream();

            stream.on('end', () => connection.release());
            stream.on('error', () => connection.release());
            return stream;
        }
        case 'postgresql': {
            const { default: QueryStream } = await import('pg-query-stream');
            const client = await conn.nativePool.connect();
            const queryStream = new QueryStream(sql, params);
            const stream = client.query(queryStream);
            stream.on('end', () => client.release());
            stream.on('error', () => client.release());
            return stream;
        }
        case 'mssql': {
            return (async function* () {
                const request = conn.nativePool.request();
                request.stream = true;

                if (params && params.length > 0) {
                    params.forEach((param, index) => {
                        request.input(`p${index}`, param);
                    });
                }

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
                    notify();
                });

                request.on('done', () => {
                    done = true;
                    notify();
                });

                request.query(sql);

                while (true) {
                    if (error) {
                        throw error;
                    }

                    while (queue.length > 0) {
                        yield queue.shift();
                    }

                    if (done && queue.length === 0) {
                        break;
                    }

                    await new Promise<void>((resolve) => {
                        resolveNext = resolve;
                    });
                }
            })();
        }

        default:
            throw new Error('The provided database engine is invalid!');
    }
}

export async function* makeDBChunk(
    stream: AsyncIterable<any>,
    chunkSize: number = 50_000
) {
    let chunk: any[] = [];

    for await (const row of stream) {
        chunk.push(row);

        if (chunk.length === chunkSize) {
            yield chunk;
            chunk = [];
        }
    }

    if (chunk.length > 0) yield chunk;
}