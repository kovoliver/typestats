import Table from "../dataStructures/Table";
import { ColInfo } from "../types";
import { processCSVData, processJSONData } from "./ioutils";

/**
 * Asynchronously fetches and parses a CSV dataset from a web URL or HTTP endpoint
 * into a {@link Table} instance in client-side / browser environments.
 *
 * @param url - The HTTP/HTTPS URL or endpoint of the CSV file to fetch.
 * @param separator - The column delimiter character (e.g., `,`, `;`, `\t`). Defaults to `;`.
 * @param invalidLine - Strategy for handling rows with missing columns relative to the header. Defaults to `'impute'`.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the HTTP request fails, the file is empty, or a row structure is invalid.
 */
export async function getCSVFromClient(
    url: string,
    separator: string = ';',
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
): Promise<Table> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }

        const text = await response.text();

        const { cols, colInfos } = processCSVData(
            text, separator, invalidLine
        );

        return new Table(cols, colInfos);
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
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object.
 *
 * @throws {@link Error} If the HTTP response is not OK, or if the parsed JSON is not a non-empty array of objects.
 */
export async function getJSONFromClient(
    url: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
): Promise<Table> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }

        const data = await response.json();
        const { cols, colInfos } = processJSONData(data, invalidLine);

        return new Table(cols, colInfos);
    } catch (err) {
        console.error('Error fetching JSON on client:', err);
        throw err;
    }
}