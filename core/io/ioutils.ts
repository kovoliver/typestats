import { ColInfo } from "../types/types.js";
import { writeFile } from 'fs/promises';
import { trim } from "../utils/utils.js";

function isWhitespaceCode(c: number): boolean {
    return c === 32 || c === 9 || c === 13 || c === 10 || c === 12 || c === 11;
}

function fastTrimField(s: string, quoteCode: number): string {
    let start = 0;
    let end = s.length;

    while (start < end && isWhitespaceCode(s.charCodeAt(start))) start++;
    if (quoteCode !== -1 && start < end && s.charCodeAt(start) === quoteCode) start++;

    while (end > start && isWhitespaceCode(s.charCodeAt(end - 1))) end--;
    if (quoteCode !== -1 && end > start && s.charCodeAt(end - 1) === quoteCode) end--;

    if (start === 0 && end === s.length) return s;
    return (' ' + s.slice(start, end)).slice(1);
}

function countFields(line: string, separator: string): number {
    let count = 1;
    let pos = 0;
    while (true) {
        const idx = line.indexOf(separator, pos);
        if (idx === -1) return count;
        count++;
        pos = idx + separator.length;
    }
}

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
    const quoteCode = quoteChar ? quoteChar.charCodeAt(0) : -1;
    const sepLen = separator.length;

    const labels = head.split(separator).map(l => trim(l, quotes));
    const labelCount = labels.length;
    const colInfos = labels.map(label => ({ label }));

    const cols: (string | null)[][] = Array.from({ length: labelCount }, () => []);

    const lineCount = lines.length;
    for (let i = 0; i < lineCount; i++) {
        const line = lines[i];
        if (isBlank(line)) continue;

        const fieldCount = countFields(line, separator);
        const lineDiff = labelCount - fieldCount;

        if (lineDiff < 0) {
            throw new Error(`The header line contains too few columns! (Line ${i + 2})`);
        }

        if (lineDiff > 0) {
            if (invalidLine === 'drop') continue;
            if (invalidLine === 'throw') throw new Error(`Line ${i + 2} is invalid!`);
        }

        let col = 0;
        let pos = 0;
        const len = line.length;

        while (col < fieldCount) {
            const sepIndex = line.indexOf(separator, pos);
            const end = sepIndex === -1 ? len : sepIndex;
            const raw = line.slice(pos, end);
            const value = fastTrimField(raw, quoteCode);

            cols[col].push(value === '' ? null : value);
            col++;
            pos = end + sepLen;
        }

        while (col < labelCount) {
            cols[col].push(null);
            col++;
        }
    }

    return { cols, colInfos };
}

function isBlank(s: string): boolean {
    for (let k = 0; k < s.length; k++) {
        const c = s.charCodeAt(k);
        if (c !== 32 && c !== 9 && c !== 13 && c !== 10) return false;
    }
    return true;
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