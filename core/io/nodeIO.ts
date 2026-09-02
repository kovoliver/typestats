import { readFile } from 'fs/promises';
import Table from "../dataStructures/Table.js";
import { processCSVData, processJSONData } from './ioutils.js';

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
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
): Promise<Table> {
    try {
        const fileBuffer = await readFile(filePath, { encoding: 'utf-8' });
        const text = fileBuffer.trim();

        const { cols, colInfos } = processCSVData(
            text, separator, invalidLine
        );

        return new Table(cols, colInfos);
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
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the file reading fails, JSON parsing fails, or the dataset is not a non-empty array of objects.
 */
export async function getJSONFromNode(
    filePath: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
): Promise<Table> {
    try {
        const fileBuffer = await readFile(filePath, { encoding: 'utf-8' });
        const data = JSON.parse(fileBuffer);
        const { cols, colInfos } = processJSONData(data, invalidLine);

        return new Table(cols, colInfos);
    } catch (err) {
        console.error('Error reading JSON in Node:', err);
        throw err;
    }
}