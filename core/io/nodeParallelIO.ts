import fs from 'node:fs';
import readline from 'node:readline';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import Table from '../dataStructures/Table.js';
import { ColInfo, ColType } from '../types/types.js';
import { getColType } from '../utils/utils.js';

const WORKER_PATH_CSV = new URL('./csvWorker.js', import.meta.url);
const WORKER_PATH_JSON = new URL('./jsonWorker.js', import.meta.url);

/**
 * Asynchronously parses a local CSV file using worker threads / parallel processing
 * into a {@link Table} instance in Node.js backend environments.
 *
 * @param filePath - The absolute or relative path to the local CSV file on the filesystem.
 * @param separator - The column delimiter character (e.g., `,`, `;`, `\t`). Defaults to `;`.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header. Defaults to `'impute'`.
 * @param quoteChar - Optional character used to enclose fields containing special characters.
 * @param poolSize - Number of worker threads to spawn for parallel processing. Defaults to CPU core count (`os.cpus().length`).
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If file reading fails, worker thread initialization fails, or row structure is invalid.
 */
export async function getCSVFromNodeParallel(
    filePath: string,
    separator: string = ';',
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string,
    poolSize: number = os.cpus().length
): Promise<Table> {
    try {
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        const firstChunk: string[] = [];

        for await (const line of rl) {
            if (line.trim().length > 0) firstChunk.push(line);

            if (firstChunk.length >= 51) {
                rl.close();
                fileStream.destroy();
                break;
            }
        }

        if (firstChunk.length === 0) throw new Error('CSV file is empty');

        const headerLine = firstChunk.shift()!;
        const labels = headerLine.split(separator).map(l => l.trim());
        const validLength = labels.length;

        const sampleCols: string[][] = Array.from({ length: validLength }, () => []);

        for (const line of firstChunk) {
            const row = line.split(separator);
            for (let c = 0; c < validLength; c++) sampleCols[c].push(row[c] ?? '');
        }

        const colTypes: ColType[] = sampleCols.map(c => getColType(c));

        const workers: Worker[] = [];
        const idleWorkers: Worker[] = [];

        for (let i = 0; i < poolSize; i++) {
            const w = new Worker(WORKER_PATH_CSV);
            workers.push(w);
            idleWorkers.push(w);
        }

        const tableData: any[][] = Array.from({ length: validLength }, () => []);
        const pendingPromisifiedChunks: Promise<any[][]>[] = [];

        const dispatchChunk = (lines: string[]): Promise<any[][]> => {
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
                            lines,
                            separator,
                            validLength,
                            colTypes: [...colTypes],
                            invalidLine,
                            quoteChar
                        });
                    } else {
                        setTimeout(getWorker, 2);
                    }
                };
                getWorker();
            });
        };

        const fullStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
        const fullRl = readline.createInterface({ input: fullStream, crlfDelay: Infinity });

        let isHeaderSkipped = false;
        let chunk: string[] = [];
        const chunkSize = 50000;

        for await (const line of fullRl) {
            if (!isHeaderSkipped) {
                isHeaderSkipped = true;
                continue;
            }

            chunk.push(line);

            if (chunk.length === chunkSize) {
                pendingPromisifiedChunks.push(dispatchChunk(chunk));
                chunk = [];
            }
        }

        if (chunk.length > 0) {
            pendingPromisifiedChunks.push(dispatchChunk(chunk));
        }

        const results = await Promise.all(pendingPromisifiedChunks);

        workers.forEach(w => w.terminate());

        for (const workerCols of results) {
            for (let c = 0; c < validLength; c++) {
                tableData[c].push(...workerCols[c]);
            }
        }

        const colInfos: ColInfo[] = labels.map((label, i) => ({ label, type: colTypes[i] }));
        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error in multi-threaded CSV parsing:', err);
        throw err;
    }
}

/**
 * Asynchronously parses a local NDJSON file using worker threads / parallel processing
 * into a {@link Table} instance in Node.js backend environments.
 *
 * @param filePath - The absolute or relative path to the local NDJSON file on the filesystem.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header. Defaults to `'impute'`.
 * @param poolSize - Number of worker threads to spawn for parallel processing. Defaults to CPU core count (`os.cpus().length`).
 * @param chunkSize - The number of lines handled per worker chunk. Defaults to `50_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If file reading fails, worker thread execution fails, or line formatting is invalid.
 */
export async function getNDJSONFromNodeParallel(
    filePath: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    poolSize: number = os.cpus().length,
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let labels: string[] = [];
        for await (const line of rl) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
                const firstObj = JSON.parse(trimmed);
                labels = Object.keys(firstObj);
                rl.close();
                fileStream.destroy();
                break;
            }
        }

        if (labels.length === 0) throw new Error('NDJSON file is empty or invalid');
        const validLength = labels.length;

        const workers: Worker[] = [];
        const idleWorkers: Worker[] = [];

        for (let i = 0; i < poolSize; i++) {
            const w = new Worker(WORKER_PATH_JSON);
            workers.push(w);
            idleWorkers.push(w);
        }

        const tableData: any[][] = Array.from({ length: validLength }, () => []);
        const pendingPromisifiedChunks: Promise<any[][]>[] = [];

        const dispatchChunk = (lines: string[]): Promise<any[][]> => {
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
                            lines,
                            labels,
                            invalidLine
                        });
                    } else {
                        setTimeout(getWorker, 2);
                    }
                };
                getWorker();
            });
        };

        const fullStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
        const fullRl = readline.createInterface({ input: fullStream, crlfDelay: Infinity });

        let chunk: string[] = [];

        for await (const line of fullRl) {
            if (line.trim().length === 0) continue;

            chunk.push(line);

            if (chunk.length === chunkSize) {
                pendingPromisifiedChunks.push(dispatchChunk(chunk));
                chunk = [];
            }
        }

        if (chunk.length > 0) {
            pendingPromisifiedChunks.push(dispatchChunk(chunk));
        }

        const results = await Promise.all(pendingPromisifiedChunks);

        workers.forEach(w => w.terminate());

        for (const workerCols of results) {
            for (let c = 0; c < validLength; c++) {
                tableData[c].push(...workerCols[c]);
            }
        }

        const colInfos: ColInfo[] = labels.map((label, i) => ({ label, type:getColType(tableData[i]) }));
        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error in multi-threaded NDJSON parsing:', err);
        throw err;
    }
}

/**
 * Converts a standard JSON array file into a memory-efficient Newline Delimited JSON (NDJSON) file on the filesystem.
 *
 * @param inputPath - The absolute or relative path to the source JSON file.
 * @param outputPath - The target path where the converted NDJSON file will be saved.
 *
 * @returns A Promise that resolves when the file conversion is completed.
 *
 * @throws {@link Error} If the input file cannot be read, contains invalid JSON, or writing to the output path fails.
 */
export async function convertJSONToNDJSON(
    inputPath: string,
    outputPath: string
): Promise<void> {
    const readStream = fs.createReadStream(inputPath, { encoding: 'utf-8' });
    const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: readStream, crlfDelay: Infinity });

    for await (let line of rl) {
        line = line.trim();

        if (line === '[' || line === ']') continue;

        if (line.endsWith(',')) {
            line = line.slice(0, -1);
        }

        if (line.length > 0) {
            writeStream.write(line + '\n');
        }
    }

    writeStream.end();
}