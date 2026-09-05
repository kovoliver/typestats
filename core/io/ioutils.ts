import { ColInfo } from "../types/types.js";
import { writeFile } from 'fs/promises';
import { trim } from "../utils/utils.js";

export function processCSVData(
    text: string,
    separator: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string
) {
    const trimmedText = trim(text);

    if (trimmedText.length === 0) {
        throw new Error('The provided CSV file is empty!');
    }

    const lines = trimmedText.split(/\r?\n/);

    if (lines.length === 1) {
        throw new Error('The provided CSV file only has a header row!');
    }

    const head = lines.shift()!;
    const quotes = quoteChar ? [quoteChar] : [];
    
    const labels = head.split(separator).map(l => trim(l, quotes));
    const colInfos = labels.map(label => ({ label }));

    const cols: (string | null)[][] = Array.from({ length: labels.length }, () => []);

    for (const [i, line] of lines.entries()) {
        if (!line.trim()) continue;

        const row = line.split(separator);
        const lineDiff = labels.length - row.length;

        if (lineDiff < 0) {
            throw new Error(`The header line contains too few columns! (Line ${i + 2})`);
        }

        if (lineDiff > 0) {
            switch (invalidLine) {
                case 'impute':
                    while (row.length < labels.length) {
                        row.push('');
                    }
                    break;
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Line ${i + 2} is invalid!`);
            }
        }

        for (let j = 0; j < labels.length; j++) {
            const rawVal = row[j] ?? '';
            const val = trim(rawVal, quotes);
            cols[j].push(val === '' ? null : val);
        }
    }

    return {
        cols,
        colInfos
    };
}

export function processJSONData(
    data: any[],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('The JSON data must be a non-empty array of objects!');
    }

    const labels = Object.keys(data[0]);
    const colInfos: ColInfo[] = labels.map(label => ({ label }));
    const cols: any[][] = Array.from({ length: labels.length }, () => []);

    for (const [i, row] of data.entries()) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            switch (invalidLine) {
                case 'impute':
                    cols.forEach(col => col.push(null));
                    continue;
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Row ${i} is invalid!`);
            }
        }

        const rowKeys = Object.keys(row);
        const missingKeys = labels.filter(label => !(label in row));
        const extraKeys = rowKeys.filter(key => !labels.includes(key));

        if (extraKeys.length > 0 && invalidLine === 'throw') {
            throw new Error(`Row ${i} contains unexpected properties!`);
        }

        if (missingKeys.length > 0) {
            switch (invalidLine) {
                case 'impute':
                    for (let j = 0; j < labels.length; j++) {
                        const label = labels[j];
                        const val = row[label];
                        cols[j].push(val !== undefined && val !== null ? val : null);
                    }
                    break;
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Row ${i} is missing columns!`);
            }
        } else {
            for (let j = 0; j < labels.length; j++) {
                const label = labels[j];
                const val = row[label];
                cols[j].push(val !== undefined && val !== null ? val : null);
            }
        }
    }

    return {
        cols,
        colInfos
    };
}

export async function writeTableFile(
    path: string,
    content: string,
    overWrite: boolean = true
): Promise<void> {
    try {
        await writeFile(path, content, {
            encoding: 'utf-8',
            flag: overWrite ? 'w' : 'wx'
        });
    } catch (err: any) {
        if (err.code === 'EEXIST') {
            throw new Error(`The given path (${path}) already exists!`);
        }

        throw err;
    }
}