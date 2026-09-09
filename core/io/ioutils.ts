import { ColInfo, ColType } from "../types/types.js";
import { writeFile } from 'fs/promises';
import fs from 'node:fs';
import readline from 'node:readline';
import { parseBool, parseDate, parseNumber, parseString } from "../utils/utils.js";

export function parseValue(val: unknown, type: ColType | undefined): any {
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

export function processJSONDataChunk(
    chunk: any[],
    labels: string[],
    cols: any[][],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
) {
    const validLength = labels.length;

    for (let i = 0; i < chunk.length; i++) {
        const row = chunk[i];

        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Invalid row at index ${i}`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) cols[j].push(null);
                    continue;
            }
        }

        if (invalidLine === 'throw') {
            const rowKeys = Object.keys(row);

            if (rowKeys.length > validLength) {
                throw new Error(`Row contains unexpected properties!`);
            }
        }

        let hasMissing = false;

        for (let j = 0; j < validLength; j++) {
            const val = row[labels[j]];

            if (val === undefined) {
                hasMissing = true;
                break;
            }
        }

        if (hasMissing) {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Row is missing required columns!`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) {
                        const val = row[labels[j]];
                        cols[j].push(val !== undefined && val !== null ? val : null);
                    }
                    break;
            }
        } else {
            for (let j = 0; j < validLength; j++) {
                const val = row[labels[j]];
                cols[j].push(val !== null ? val : null);
            }
        }
    }
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

export async function* readClientChunks(
    url: string,
    chunkSize: number = 50000,
    firstChunkSize: number = 50
) {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let chunk: string[] = [];
    let currentLimit = firstChunkSize;
    let partialLine = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            if (partialLine.length > 0) {
                chunk.push(partialLine);
            }
            break;
        }

        const textChunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + textChunk).split(/\r?\n/);
        partialLine = lines.pop() ?? '';

        for (const line of lines) {
            chunk.push(line);

            if (chunk.length === currentLimit) {
                yield chunk;
                chunk = [];
                currentLimit = chunkSize;
            }
        }
    }

    if (chunk.length > 0) {
        yield chunk;
    }
}