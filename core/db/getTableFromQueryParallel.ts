import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { DbConnection } from '../types/interfaces.js';
import { ColInfo, ColType } from '../types/types.js';
import Table from '../dataStructures/Table.js';
import { getDbStream, makeDBChunk } from './dbUtils.js';
import { getColType } from '../utils/utils.js';

const WORKER_PATH_DB = new URL('./dbWorker.js', import.meta.url);

/**
 * Executes an SQL query and transforms large result sets into a {@link Table} instance
 * using parallel worker threads for chunked data transformation.
 *
 * @param conn - An active {@link DbConnection} instance.
 * @param sql - The SQL query string to be executed.
 * @param params - Optional parameter array for parameterized SQL queries.
 * @param poolSize - Number of worker threads to spawn for data transformation. Defaults to CPU core count (`os.cpus().length`).
 * @param chunkSize - The number of database rows processed per worker chunk. Defaults to `100_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If query execution fails, memory allocation limits are exceeded, or worker execution fails.
 */
export async function getTableFromQueryP(
    conn: DbConnection,
    sql: string,
    params?: any[],
    poolSize: number = os.cpus().length,
    chunkSize: number = 100_000
): Promise<Table> {
    try {
        const stream = await getDbStream(sql, conn, params);
        const workers: Worker[] = [];
        const idleWorkers: Worker[] = [];

        for (let i = 0; i < poolSize; i++) {
            const w = new Worker(WORKER_PATH_DB);
            workers.push(w);
            idleWorkers.push(w);
        }

        let labels: string[] = [];
        let validLength = 0;
        let firstRow = true;
        const colInfos: ColInfo[] = [];

        const pendingPromisifiedChunks: Promise<any[][]>[] = [];

        const dispatchChunk = (chunkData: Record<string, any>[]): Promise<any[][]> => {
            return new Promise((resolve, reject) => {
                const getWorker = () => {
                    const w = idleWorkers.pop();
                    if (w) {
                        const cleanup = () => {
                            w.off('message', onMsg);
                            w.off('error', onErr);
                            idleWorkers.push(w);
                        };

                        const onMsg = (cols: any[][]) => {
                            cleanup();
                            resolve(cols);
                        };

                        const onErr = (err: any) => {
                            cleanup();
                            reject(err);
                        };

                        w.once('message', onMsg);
                        w.once('error', onErr);

                        w.postMessage({
                            chunk: chunkData,
                            labels
                        });
                    } else {
                        setTimeout(getWorker, 2);
                    }
                };
                getWorker();
            });
        };

        for await (const chunk of makeDBChunk(stream!, chunkSize)) {
            if (chunk.length === 0) continue;

            if (firstRow) {
                labels = Object.keys(chunk[0]);
                validLength = labels.length;

                for (let i = 0; i < validLength; i++) {
                    const label = labels[i];
                    const sampleValues = chunk.slice(0, 50).map((row: any) => row[label]);

                    let type: ColType = getColType(sampleValues);
                    colInfos.push({ label, type });
                }

                firstRow = false;
            }

            pendingPromisifiedChunks.push(dispatchChunk(chunk));
        }

        const results = await Promise.all(pendingPromisifiedChunks);
        workers.forEach(w => w.terminate());

        const tableData: any[][] = Array.from({ length: validLength }, () => []);

        for (const workerCols of results) {
            for (let c = 0; c < validLength; c++) {
                tableData[c].push(...workerCols[c]);
            }
        }

        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error executing query or parsing Table in parallel:', err);
        throw err;
    }
}