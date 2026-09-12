import Table from "../dataStructures/Table.js";
import { ColInfo, ColType } from "../types/types.js";
import { getColType } from "../utils/utils.js";
import { 
    processCSVStreamLines, processNDJSONLines, 
    processNDJSONStreamLines, 
    processParsedJSONData, readClientChunks 
} from "./ioutils.js";

/**
 * Asynchronously fetches and parses a CSV dataset from a web URL or HTTP endpoint
 * into a {@link Table} instance in client-side / browser environments.
 *
 * @param url - The HTTP/HTTPS URL or endpoint of the CSV file to fetch.
 * @param separator - The column delimiter character (e.g., `,`, `;`, `\t`). Defaults to `;`.
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
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
export async function getTableFromCSVAPI(
    url: string,
    separator: string = ';',
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string,
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const stream = readClientChunks(url, chunkSize, 50);
        const { tableData, colInfos } = await processCSVStreamLines(
            stream,
            separator,
            skippedHeaders,
            invalidLine,
            quoteChar
        );

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
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
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
export async function getTableFromJSONAPI(
    url: string,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }

        const rawData: any = await response.json();
        const { cols, colInfos } = processParsedJSONData(rawData, skippedHeaders, invalidLine, chunkSize);

        return new Table(cols, colInfos, true);
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
 * @param skippedHeaders Optional array of column names/headers to exclude from processing. Defaults to an empty array.
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
export async function getTableFromNDJSONAPI(
    url: string,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): Promise<Table> {
    try {
        const stream = readClientChunks(url, chunkSize, 50);
        const { tableData, colInfos } = await processNDJSONStreamLines(
            stream,
            skippedHeaders,
            invalidLine
        );

        return new Table(tableData, colInfos, true);
    } catch (err) {
        console.error('Error fetching NDJSON on client:', err);
        throw err;
    }
}