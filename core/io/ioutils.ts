import { ColInfo, ColType } from "../types/types.js";
import { writeFile } from 'fs/promises';
import fs from 'node:fs';
import readline from 'node:readline';
import { parseBool, parseDate, parseNumber, parseString } from "../utils/utils.js";

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

function parseValue(val: unknown, type: ColType | undefined): any {
    if (type === undefined) return val;
    switch (type) {
        case 'number': return parseNumber(val);
        case 'bool': return parseBool(val);
        case 'date': return parseDate(val);
        default: return parseString(val);
    }
}

export function processCSVData(
    lines: string[],
    separator: string,
    validLength: number,
    colTypes: (ColType | undefined)[],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string
) {
    const cols: any[][] = Array.from({ length: validLength }, () => []);

    for (let line of lines) {
        if (line.length === 0) continue;

        if (quoteChar) {
            if (line.startsWith(quoteChar)) line = line.substring(1);
            if (line.endsWith(quoteChar)) line = line.substring(0, line.length - 1);
        }

        let start = 0;
        let delimIdx = line.indexOf(separator);
        let col = 0;

        while (delimIdx !== -1 && col < validLength) {
            const rawVal = line.substring(start, delimIdx);
            cols[col].push(parseValue(rawVal, colTypes[col]));

            start = delimIdx + separator.length;
            delimIdx = line.indexOf(separator, start);
            col++;
        }

        if (col < validLength) {
            const rawVal = line.substring(start);
            cols[col].push(parseValue(rawVal, colTypes[col]));
            col++;
        }

        if (delimIdx !== -1 && invalidLine === 'throw') {
            throw new Error(
                `Invalid CSV row length: Expected ${validLength} columns, but received more. Row content: "${line}"`
            );
        }

        if (col < validLength) {
            switch (invalidLine) {
                case 'drop':
                    for (let c = 0; c < col; c++) {
                        cols[c].pop();
                    }
                    break;

                case 'throw':
                    throw new Error(
                        `Invalid CSV row length: Expected ${validLength} columns, but received ${col}. Row content: "${line}"`
                    );

                case 'impute':
                    while (col < validLength) {
                        cols[col].push(parseValue(null, colTypes[col]));
                        col++;
                    }
                    break;
            }
        }
    }

    return cols;
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

export async function* readInChunks(
    filePath: string,
    chunkSize: number = 50000,
    firstChunkSize: number = 50
) {
    const fileStream = fs.createReadStream(filePath, {
        encoding: 'utf-8',
        highWaterMark: 64 * 1024
    });

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let chunk: string[] = [];
    let currentLimit = firstChunkSize;

    for await (const line of rl) {
        chunk.push(line);

        if (chunk.length === currentLimit) {
            yield chunk;
            chunk = [];
            currentLimit = chunkSize;
        }
    }

    if (chunk.length > 0) {
        yield chunk;
    }
}