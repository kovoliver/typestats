import Table from "../dataStructures/Table.js";
import { ColInfo, ColType } from "../types/types.js";
import { getColType } from "../utils/utils.js";
import { processCSVData, processJSONDataChunk, readClientChunks } from "./ioutils.js";

/**
 * Asynchronously fetches and parses a CSV dataset from a web URL or HTTP endpoint
 * into a {@link Table} instance in client-side / browser environments.
 *
 * @param url - The HTTP/HTTPS URL or endpoint of the CSV file to fetch.
 * @param separator - The column delimiter character (e.g., `,`, `;`, `\t`). Defaults to `;`.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 * @param quoteChar - Optional character used to enclose fields containing special characters (e.g., `"` or `'`).
 * @param chunkSize - The number of rows processed per chunk during parsing. Defaults to `50_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the HTTP request fails, the file is empty, or a row structure is invalid (when `invalidLine` is set to `'throw'`).
 */
export async function getCSVFromClient(
    url: string,
    separator: string = ';',
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string,
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const tableData: any[][] = [];
        let labels: string[] | null = null;
        let colTypes: ColType[] = [];
        let isTypeDetermined = false;

        for await (let lines of readClientChunks(url, chunkSize, 50)) {
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
                    colTypes[i] = getColType(unprocessed[i]) ?? 'string';
                }
                isTypeDetermined = true;

                const typedFirstChunk = processCSVData(
                    lines,
                    separator,
                    labels.length,
                    colTypes,
                    invalidLine,
                    quoteChar
                );

                for (let i = 0; i < typedFirstChunk.length; i++) {
                    tableData[i].push(...typedFirstChunk[i]);
                }
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
            type: colTypes[i]
        }));

        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error fetching CSV on client:', err);
        throw err;
    }
}

/**
 * Asynchronously fetches and converts a JSON dataset from a web URL or HTTP endpoint
 * into a {@link Table} instance in client-side / browser environments.
 *
 * @param url - The HTTP/HTTPS URL or endpoint returning a JSON array of objects.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 * @param chunkSize - The number of objects processed per chunk during parsing. Defaults to `50_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the HTTP response is not OK, or if the parsed JSON is not a non-empty array of objects.
 */
export async function getJSONFromClient(
    url: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50000
): Promise<Table> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }

        const rawData: any = await response.json();

        console.log('API Response structure:', {
            isArr: Array.isArray(rawData),
            type: typeof rawData,
            keys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : null
        });

        let data: any[] = [];

        if (Array.isArray(rawData)) {
            data = rawData;
        } else if (rawData && typeof rawData === 'object') {
            for (const key of Object.keys(rawData)) {
                if (Array.isArray(rawData[key])) {
                    data = rawData[key];
                    break;
                }
            }
        }

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error(`The JSON data must be a non-empty array of objects! Received type: ${typeof rawData}`);
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
        console.error('Error fetching JSON on client:', err);
        throw err;
    }
}

/**
 * Asynchronously fetches and streams a Newline Delimited JSON (NDJSON) dataset from a web URL or HTTP endpoint
 * into a {@link Table} instance in client-side / browser environments.
 *
 * @param url - The HTTP/HTTPS URL or endpoint of the NDJSON stream/file.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header:
 *   - `'impute'`: Appends `null` values to pad incomplete rows to match the header length.
 *   - `'drop'`: Skips incomplete rows entirely.
 *   - `'throw'`: Throws an {@link Error} immediately upon encountering an invalid row.
 *   Defaults to `'impute'`.
 * @param chunkSize - The number of lines processed per chunk during streaming. Defaults to `50_000`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the HTTP request fails, NDJSON parsing fails, or a line structure is invalid.
 */
export async function getNDJSONFromClient(
    url: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50000
): Promise<Table> {
    const cols: any[][] = [];
    let labels: string[] = [];
    let isInitialized = false;

    for await (const rawLines of readClientChunks(url, chunkSize, 50)) {
        const jsonChunk: any[] = [];

        for (let i = 0; i < rawLines.length; i++) {
            if (rawLines[i].trim().length > 0) {
                jsonChunk.push(JSON.parse(rawLines[i]));
            }
        }

        if (jsonChunk.length === 0) continue;

        if (!isInitialized) {
            labels = Object.keys(jsonChunk[0]);

            for (let i = 0; i < labels.length; i++) {
                cols.push([]);
            }

            isInitialized = true;
        }

        processJSONDataChunk(jsonChunk, labels, cols, invalidLine);
    }

    const colInfos: ColInfo[] = labels.map(label => ({ label }));
    return new Table(cols, colInfos);
}