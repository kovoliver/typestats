import Table from "../dataStructures/Table";
import { ColInfo } from "../types";

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

        const text = (await response.text()).trim();

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
export async function getJSONFromClient(url: string): Promise<Table> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('The fetched JSON must be a non-empty array of objects!');
        }

        const labels = Object.keys(data[0]);
        const colInfos: ColInfo[] = labels.map(label => ({ label }));

        const cols: any[][] = labels.map(label =>
            data.map(row => row[label] ?? null)
        );

        return new Table(cols, colInfos);
    } catch (err) {
        console.error('Error fetching JSON on client:', err);
        throw err;
    }
}