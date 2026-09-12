import fs from 'node:fs';
import readline from 'node:readline';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import Table from '../dataStructures/Table.js';
import { ColInfo, ColType } from '../types/types.js';
import { getColType } from '../utils/utils.js';
import { processCSVData, readInChunks } from './ioutils.js';

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
export async function getTableFromCSVP(
    filePath: string,
    separator: string = ';',
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string,
    poolSize: number = os.cpus().length
): Promise<Table> {
    try {
        let labels: string[] | null = null;
        let filteredLabels: string[] = [];
        let skippedHeaderIndices: number[] = [];
        let colTypes: ColType[] = [];

        const skipSet = new Set(skippedHeaders.map(h => h.trim()));
        const workers: Worker[] = [];
        const idleWorkers: Worker[] = [];

        for (let i = 0; i < poolSize; i++) {
            const w = new Worker(WORKER_PATH_CSV);
            workers.push(w);
            idleWorkers.push(w);
        }

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
                            validLength: filteredLabels.length,
                            totalRawCols: labels!.length,
                            colTypes: [...colTypes],
                            skippedHeaderIndices,
                            invalidLine,
                            quoteChar
                        });
                    } else {
                        setTimeout(getWorker);
                    }
                };
                getWorker();
            });
        };

        for await (let lines of readInChunks(filePath, 50000, 51)) {
            if (lines.length === 0) continue;

            if (labels === null) {
                let headerLine = lines.shift();
                if (!headerLine) continue;

                if (quoteChar) {
                    if (headerLine.startsWith(quoteChar)) headerLine = headerLine.substring(1);
                    if (headerLine.endsWith(quoteChar)) headerLine = headerLine.substring(0, headerLine.length - 1);
                }

                labels = headerLine.split(separator).map(l => l.trim().replace(/^["']|["']$/g, ''));
                filteredLabels = labels.filter(l => !skipSet.has(l));

                skippedHeaderIndices = labels
                    .map((label, i) => (skipSet.has(label) ? i : -1))
                    .filter(index => index !== -1);

                if (filteredLabels.length === 0) {
                    throw new Error('No valid headers remaining after applying skippedHeaders filter!');
                }
            }

            if (lines.length === 0) continue;

            if (colTypes.length === 0) {
                const rawSampleCols = processCSVData(
                    lines,
                    separator,
                    filteredLabels.length,
                    labels.length,
                    [],
                    skippedHeaderIndices,
                    invalidLine,
                    quoteChar
                );

                colTypes = rawSampleCols.map(c => getColType(c) ?? 'string');
            }

            pendingPromisifiedChunks.push(dispatchChunk(lines));
        }

        if (labels === null) {
            throw new Error('CSV file is empty');
        }

        const results = await Promise.all(pendingPromisifiedChunks);
        workers.forEach(w => w.terminate());

        const validLength = filteredLabels.length;
        const tableData: any[][] = Array.from({ length: validLength }, () => []);

        for (const workerCols of results) {
            for (let c = 0; c < validLength; c++) {
                tableData[c].push(...workerCols[c]);
            }
        }

        const colInfos: ColInfo[] = filteredLabels.map((label, i) => ({
            label,
            type: colTypes[i]
        }));

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
export async function getTableFromNDJSONP(
    filePath: string,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    poolSize: number = os.cpus().length,
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const skipSet = new Set(skippedHeaders.map(h => h.trim()));
        const sampleStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
        const sampleRl = readline.createInterface({ input: sampleStream, crlfDelay: Infinity });

        const sampleRows: any[] = [];
        let rawLabels: string[] = [];

        for await (const line of sampleRl) {
            const trimmed = line.trim();
            if (trimmed.length === 0) continue;

            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    if (rawLabels.length === 0) {
                        rawLabels = Object.keys(parsed);
                    }
                    sampleRows.push(parsed);
                    if (sampleRows.length >= 200) {
                        sampleRl.close();
                        sampleStream.destroy();
                        break;
                    }
                }
            } catch {

            }
        }

        const filteredLabels = rawLabels.filter(l => !skipSet.has(l.trim()));

        if (filteredLabels.length === 0) {
            throw new Error('NDJSON file is empty, invalid, or all headers were skipped!');
        }

        const validLength = filteredLabels.length;

        const colTypes: ColType[] = filteredLabels.map(label => {
            const values = sampleRows.map(row => row[label]);
            return getColType(values) ?? 'string';
        });

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
                            labels: filteredLabels,
                            colTypes,
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

        const colInfos: ColInfo[] = filteredLabels.map((label, i) => ({
            label,
            type: colTypes[i]
        }));

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