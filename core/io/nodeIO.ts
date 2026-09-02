import { readFile } from 'fs/promises';
import Table from "../dataStructures/Table";
import { ColInfo } from "../types";

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

        if (text.length === 0) {
            throw new Error('The provided CSV file is empty!');
        }

        const lines = text.split(/\r?\n/);

        if (lines.length === 1) {
            throw new Error('The provided CSV file only has a header row!');
        }

        const head = lines.shift();
        const labels = head!.trim().split(separator).map(l => l.trim());
        const colInfos: ColInfo[] = labels.map(label => ({ label }));

        const cols: any[][] = Array.from({ length: labels.length }, () => []);

        for (const [i, line] of lines.entries()) {
            if (!line.trim()) continue;

            const row: any[] = line.trim().split(separator);
            const lineDiff = labels.length - row.length;

            if (lineDiff < 0) {
                throw new Error('The header line contains too few columns!');
            }

            if (lineDiff > 0) {
                switch (invalidLine) {
                    case 'impute':
                        row.push(...new Array(lineDiff).fill(null));
                        break;
                    case 'drop':
                        continue;
                    case 'throw':
                        throw new Error(`Line ${i + 1} is invalid!`);
                }
            }

            for (let j = 0; j < labels.length; j++) {
                const val = row[j] ? row[j].trim() : '';
                cols[j].push(val === '' ? null : val);
            }
        }

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
export async function getJSONFromNode(filePath: string): Promise<Table> {
    try {
        const fileBuffer = await readFile(filePath, { encoding: 'utf-8' });
        const data = JSON.parse(fileBuffer);

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('The JSON file must contain a non-empty array of objects!');
        }

        const labels = Object.keys(data[0]);
        const colInfos: ColInfo[] = labels.map(label => ({ label }));

        const cols: any[][] = labels.map(label =>
            data.map(row => row[label] ?? null)
        );

        return new Table(cols, colInfos);
    } catch (err) {
        console.error('Error reading JSON in Node:', err);
        throw err;
    }
}