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
    return s.substring(start, end);
}

export function processCSVData(
    text: string,
    separator: string,
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string
) {
    if (!text || text.length === 0) {
        throw new Error('The provided CSV file is empty!');
    }

    const quoteCode = quoteChar ? quoteChar.charCodeAt(0) : -1;
    const sepLen = separator.length;
    const quotes = quoteChar ? [quoteChar] : [];

    let firstLineEnd = text.indexOf('\n');
    if (firstLineEnd === -1) firstLineEnd = text.length;

    let headLine = text.substring(0, firstLineEnd);
    if (headLine.endsWith('\r')) headLine = headLine.slice(0, -1);

    const labels = headLine.split(separator).map(l => trim(l, quotes));
    const labelCount = labels.length;
    const colInfos = labels.map(label => ({ label }));
    const estimatedRows = Math.max(100, Math.ceil(text.length / (headLine.length || 50)));
    const cols: (string | null)[][] = Array.from({ length: labelCount }, () => new Array(estimatedRows));

    let lineIdx = 0;
    let lineStart = firstLineEnd + 1;
    const textLen = text.length;

    while (lineStart < textLen) {
        let lineEnd = text.indexOf('\n', lineStart);
        if (lineEnd === -1) lineEnd = textLen;

        let endPos = lineEnd;
        if (endPos > lineStart && text.charCodeAt(endPos - 1) === 13) {
            endPos--;
        }

        if (endPos > lineStart) {
            let pos = lineStart;
            let col = 0;

            while (pos <= endPos && col < labelCount) {
                let sepIndex = text.indexOf(separator, pos);
                if (sepIndex === -1 || sepIndex > endPos) {
                    sepIndex = endPos;
                }

                const raw = text.substring(pos, sepIndex);
                const value = fastTrimField(raw, quoteCode);

                cols[col][lineIdx] = value === '' ? null : value;
                col++;

                pos = sepIndex + sepLen;
                if (sepIndex === endPos) break;
            }

            if (col < labelCount) {
                if (invalidLine === 'throw') {
                    throw new Error(`Line ${lineIdx + 2} is invalid!`);
                }
                while (col < labelCount) {
                    cols[col][lineIdx] = null;
                    col++;
                }
            }

            lineIdx++;
        }

        lineStart = lineEnd + 1;
    }

    for (let c = 0; c < labelCount; c++) {
        cols[c].length = lineIdx;
    }

    return { cols, colInfos };
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