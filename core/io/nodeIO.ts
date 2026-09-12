import fs from 'node:fs';
import readline from 'node:readline';
import { readFile } from 'fs/promises';
import Table from "../dataStructures/Table.js";
import {
    processCSVStreamLines,
    processNDJSONStreamLines,
    processParsedJSONData, readInChunks
} from './ioutils.js';
import { writeTableFile } from './ioutils.js';
import { ColInfo } from '../types/types.js';
import { getColType, isEmpty, parseValue } from '../utils/utils.js';

/**
 * Asynchronously reads and parses a local CSV file directly from the filesystem
 * into a {@link Table} instance in Node.js backend environments.
 *
 * @param filePath - The absolute or relative path to the local CSV file on the filesystem.
 * @param separator - The column delimiter character (e.g., `,`, `;`, `\t`). Defaults to `;`.
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 * @param quoteChar - Optional character used to enclose fields containing special characters (e.g., `"` or `'`).
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the file reading fails, the file is empty, or a row structure is invalid (when `invalidLine` is set to `'throw'`).
 */
export async function getTableFromCSV(
    filePath: string,
    separator: string = ';',
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string,
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const stream = readInChunks(filePath, chunkSize, 50);

        const { tableData, colInfos } = await processCSVStreamLines(
            stream,
            separator,
            skippedHeaders,
            invalidLine,
            quoteChar
        );

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
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 * @param chunkSize - The number of items processed per chunk. Defaults to `50_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the file reading fails, JSON parsing fails, or the dataset is not a non-empty array of objects.
 */
export async function getTableFromJSON(
    filePath: string,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const isNDJSON = filePath.endsWith('.ndjson') || filePath.endsWith('.jsonl');

        if (isNDJSON) {
            return await getTableFromNDJSON(filePath, skippedHeaders, invalidLine, chunkSize);
        }

        const fileContent = await readFile(filePath, { encoding: 'utf-8' });
        const rawData: any = JSON.parse(fileContent);
        const { cols, colInfos } = processParsedJSONData(rawData, skippedHeaders, invalidLine, chunkSize);

        return new Table(cols, colInfos, true);
    } catch (err) {
        console.error('Error reading JSON in Node:', err);
        throw err;
    }
}

/**
 * Asynchronously reads and parses a local Newline Delimited JSON (NDJSON) file line by line
 * into a {@link Table} instance in Node.js backend environments.
 *
 * @param filePath - The absolute or relative path to the local NDJSON file on the filesystem.
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 * @param chunkSize - The number of lines processed per chunk during file reading. Defaults to `50_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the file reading fails, an NDJSON line is malformed, or the file is empty.
 */
export async function getTableFromNDJSON(
    filePath: string,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const stream = readInChunks(filePath, chunkSize, 50);
        const { tableData, colInfos } = await processNDJSONStreamLines(
            stream,
            skippedHeaders,
            invalidLine
        );

        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error reading NDJSON in Node:', err);
        throw err;
    }
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

export async function readExcel(path: string, sheetIndex: number = 0)
    : Promise<{ headers: any[], rows: any[][] }> {

    let XLSX;

    try {
        const xlsxModule = await import('xlsx');
        XLSX = xlsxModule.default || xlsxModule;
    } catch {
        throw new Error('The "xlsx" package is required to read Excel files. Please install it using: npm i xlsx');
    }

    if (!fs.existsSync(path)) {
        throw new Error(`File not found at path: "${path}".`);
    }

    const workbook = XLSX.readFile(path, {
        cellDates: true,
        raw: false,
    });

    const sheetName = workbook.SheetNames[sheetIndex];

    if (!sheetName) {
        throw new Error(`Sheet at index ${sheetIndex} not found.`);
    }

    const worksheet = workbook.Sheets[sheetName];

    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
        defval: null
    });

    if (rawData.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = rawData[0].filter(h => !isEmpty(h) ? String(h).trim() : false);
    const rows: any[][] = rawData.slice(1);

    return { headers, rows };
}

/**
 * Reads an Excel (.xls / .xlsx) sheet and converts it into a `Table` instance.
 * 
 * Automatically detects column data types using a small row sample and converts cell values 
 * using `parseValue`. Supports excluding specified column headers from the resulting dataset.
 * 
 * @param path File system path or URL to the Excel file.
 * @param sheetIndex Zero-based index of the target sheet to read. Defaults to `0`.
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
 * @returns A Promise resolving to a fully initialized and type-determined `Table` instance.
 * @throws {Error} If the specified Excel sheet is empty, missing headers, or contains no data rows.
 */
export async function getTableFromXLS(
    path: string,
    sheetIndex: number = 0,
    skippedHeaders: string[] = []
): Promise<Table> {
    const { headers: rawHeaders, rows } = await readExcel(path, sheetIndex);

    if (!rawHeaders || rawHeaders.length === 0) {
        throw new Error('Excel sheet contains no headers.');
    }

    if (!rows || rows.length === 0) {
        throw new Error('Excel sheet contains no data rows.');
    }

    const headers = rawHeaders.map(h => String(h).trim().replace(/^["']|["']$/g, ''));
    const skipSet = new Set(skippedHeaders.map(h => h.trim()));

    const validHeaderIndices: number[] = [];
    const filteredHeaders: string[] = [];

    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (!skipSet.has(header)) {
            validHeaderIndices.push(i);
            filteredHeaders.push(header);
        }
    }

    const validLength = filteredHeaders.length;

    if (validLength === 0) {
        throw new Error('No valid headers remaining after applying skippedHeaders filter!');
    }

    const sampleSize = Math.min(rows.length, 50);
    const sampleCols: any[][] = Array.from({ length: validLength }, () => []);

    for (let r = 0; r < sampleSize; r++) {
        const row = rows[r];
        for (let targetIdx = 0; targetIdx < validLength; targetIdx++) {
            const srcIdx = validHeaderIndices[targetIdx];
            sampleCols[targetIdx].push(row[srcIdx] ?? null);
        }
    }

    const colInfo: ColInfo[] = filteredHeaders.map((label, i) => ({
        label,
        type: getColType(sampleCols[i]) ?? 'string'
    }));

    const tableData: any[][] = Array.from({ length: validLength }, () => []);

    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];

        for (let targetIdx = 0; targetIdx < validLength; targetIdx++) {
            const srcIdx = validHeaderIndices[targetIdx];
            const rawVal = row[srcIdx] ?? null;
            const parsedValue = parseValue(rawVal, colInfo[targetIdx].type);
            tableData[targetIdx].push(parsedValue);
        }
    }

    return new Table(tableData, colInfo, true);
}