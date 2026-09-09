import fs from 'node:fs';
import readline from 'node:readline';
import { readFile } from 'fs/promises';
import Table from "../dataStructures/Table.js";
import { processCSVData, processJSONDataChunk, readInChunks } from './ioutils.js';
import { writeTableFile } from './ioutils.js';
import { ColInfo, ColType } from '../types/types.js';
import { getColType } from './chunkProcessor.js';
import {
    toNumberArray,
    toBoolArray,
    toDateArray,
    toStringArray
} from '../utils/utils.js';

/**
 * Asynchronously reads and parses a local CSV file directly from the filesystem
 * into a {@link Table} instance in Node.js backend environments.
 *
 * @param filePath - The absolute or relative path to the local CSV file on the filesystem.
 * @param separator - The column delimiter character (e.g., `,`, `;`, `\t`). Defaults to `;`.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the file reading fails, the file is empty, or a row structure is invalid (when `invalidLine` is set to `'throw'`).
 */
export async function getCSVFromNode(
    filePath: string,
    separator: string = ';',
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string
): Promise<Table> {
    try {
        const tableData: any[][] = [];
        let labels: string[] | null = null;
        let colTypes: ColType[] = [];
        let isTypeDetermined = false;

        for await (let lines of readInChunks(filePath, 50000, 50)) {
            if (lines.length === 0) continue;

            if (labels === null) {
                const headerLine: string | undefined = lines.shift();
                if (!headerLine) continue;

                labels = headerLine.split(separator).map(l => l.trim());

                if (labels.length === 0) {
                    throw new Error('Invalid header line!');
                }

                for (let c = 0; c < labels.length; c++) {
                    tableData.push([]);
                }
            }

            if (lines.length === 0) continue;

            const unprocessed = processCSVData(
                lines,
                separator,
                labels.length,
                colTypes,
                invalidLine,
                quoteChar
            );

            if (!isTypeDetermined) {
                for (let i = 0; i < unprocessed.length; i++) {
                    const rawCol = unprocessed[i];
                    colTypes[i] = getColType(rawCol);

                    let processedCol: any[] = [];
                    switch (colTypes[i]) {
                        case 'number':
                            processedCol = toNumberArray(rawCol);
                            break;
                        case 'bool':
                            processedCol = toBoolArray(rawCol);
                            break;
                        case 'date':
                            processedCol = toDateArray(rawCol);
                            break;
                        default:
                            processedCol = toStringArray(rawCol);
                            break;
                    }
                    tableData[i].push(...processedCol);
                }
                isTypeDetermined = true;
            } else {
                for (let i = 0; i < unprocessed.length; i++) {
                    tableData[i].push(...unprocessed[i]);
                }
            }
        }

        if (labels === null) {
            throw new Error('The provided file is empty!');
        }

        const colInfos: ColInfo[] = labels.map((label, i) => ({
            label,
            colType: colTypes[i]
        }));

        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error reading CSV in Node:', err);
        throw err;
    }
}

/**
 * Asynchronously reads and parses a local JSON file directly from the filesystem
 * containing an array of key-value objects into a {@link Table} instance in Node.js backend environments.
 *
 * @param filePath - The absolute or relative path to the local JSON file on the filesystem.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header. Defaults to `'impute'`.
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the file reading fails, JSON parsing fails, or the dataset is not a non-empty array of objects.
 */
export async function getJSONFromNode(
    filePath: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const isNDJSON = filePath.endsWith('.ndjson') || filePath.endsWith('.jsonl');

        if (isNDJSON) {
            return await getNDJSONFromNode(filePath, invalidLine, chunkSize);
        }

        const fileContent = await readFile(filePath, { encoding: 'utf-8' });
        const data: any[] = JSON.parse(fileContent);

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('The JSON file must contain a non-empty array of objects!');
        }

        const labels = Object.keys(data[0]);
        const cols: any[][] = Array.from({ length: labels.length }, () => []);

        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            processJSONDataChunk(chunk, labels, cols, invalidLine);
        }

        const colInfos: ColInfo[] = labels.map(label => ({ label }));
        return new Table(cols, colInfos);

    } catch (err) {
        console.error('Error reading JSON in Node:', err);
        throw err;
    }
}

async function getNDJSONFromNode(
    filePath: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): Promise<Table> {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const cols: any[][] = [];
    let labels: string[] = [];
    let isInitialized = false;
    let jsonChunk: any[] = [];

    for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;

        jsonChunk.push(JSON.parse(trimmed));

        if (jsonChunk.length === chunkSize) {
            if (!isInitialized) {
                labels = Object.keys(jsonChunk[0]);
                for (let i = 0; i < labels.length; i++) cols.push([]);
                isInitialized = true;
            }

            processJSONDataChunk(jsonChunk, labels, cols, invalidLine);
            jsonChunk = [];
        }
    }

    if (jsonChunk.length > 0) {
        if (!isInitialized) {
            labels = Object.keys(jsonChunk[0]);
            for (let i = 0; i < labels.length; i++) cols.push([]);
            isInitialized = true;
        }

        processJSONDataChunk(jsonChunk, labels, cols, invalidLine);
    }

    const colInfos: ColInfo[] = labels.map(label => ({ label }));
    return new Table(cols, colInfos);
}

/**
 * Serializes the table data to a JSON string and writes it to the specified file path.
 *
 * @param path - The target file path where the JSON data will be written.
 * @param table - The table instance containing the data to be exported.
 * @returns A promise that resolves when the file has been successfully written.
 * @throws {Error} Throws an error if the specified file path already exists or if writing fails.
 */
export async function tableToJSON(
    path: string,
    table: Table,
    overWrite: boolean = true
): Promise<void> {
    await writeTableFile(path, JSON.stringify(table.toObject(), null, 2), overWrite);
}

/**
 * Converts the table data to a CSV formatted string and writes it to the specified file path.
 *
 * @param path - The target file path where the CSV data will be written.
 * @param table - The table instance containing the data to be exported.
 * @returns A promise that resolves when the file has been successfully written.
 * @throws {Error} Throws an error if the specified file path already exists or if writing fails.
 */
export async function tableToCSV(
    path: string,
    table: Table,
    overWrite: boolean = true
): Promise<void> {
    await writeTableFile(path, table.toCSV(), overWrite);
}