import { ColInfo } from "../types/types.js";
import { writeFile } from 'fs/promises';

export function processCSVData(
    text: string,
    separator: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
) {
    text = text.trim();

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

    return {
        cols,
        colInfos
    }
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
    content: string
): Promise<void> {
    try {
        await writeFile(path, content, {
            encoding: 'utf-8',
            flag: 'wx'
        });
    } catch (err: any) {
        if (err.code === 'EEXIST') {
            throw new Error(`The given path (${path}) already exists!`);
        }

        throw err;
    }
}