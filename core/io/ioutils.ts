import { ColInfo, ColType } from "../types/types.js";
import { writeFile } from 'fs/promises';
import fs from 'node:fs';
import readline from 'node:readline';
import { getColType, isEmpty, parseValue } from "../utils/utils.js";
import Table from "../dataStructures/Table.js";

export function processCSVData(
    lines: string[],
    separator: string,
    validLength: number,
    originalLength: number,
    colTypes: (ColType | undefined)[],
    skipHeaders: number[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string
) {
    const cols: any[][] = Array.from({ length: validLength }, () => []);
    const skipSet = new Set(skipHeaders);

    for (let line of lines) {
        if (line.length === 0) continue;

        if (quoteChar) {
            if (line.startsWith(quoteChar)) line = line.substring(1);
            if (line.endsWith(quoteChar)) line = line.substring(0, line.length - 1);
        }

        let start = 0;
        let delimIdx = line.indexOf(separator);
        let srcCol = 0;
        let targetCol = 0;

        while (delimIdx !== -1 && srcCol < originalLength) {
            if (!skipSet.has(srcCol)) {
                const rawVal = line.substring(start, delimIdx);
                cols[targetCol].push(parseValue(rawVal, colTypes[targetCol]));
                targetCol++;
            }

            srcCol++;
            start = delimIdx + separator.length;
            delimIdx = line.indexOf(separator, start);
        }

        if (srcCol < originalLength) {
            if (!skipSet.has(srcCol)) {
                const rawVal = line.substring(start);
                cols[targetCol].push(parseValue(rawVal, colTypes[targetCol]));
                targetCol++;
            }

            srcCol++;
        }

        if (targetCol < validLength) {
            switch (invalidLine) {
                case 'drop':
                    for (let c = 0; c < targetCol; c++) {
                        cols[c].pop();
                    }
                    break;

                case 'throw':
                    throw new Error(
                        `Invalid CSV row length: Expected ${validLength} columns, but received ${targetCol}. Row content: "${line}"`
                    );

                case 'impute':
                    while (targetCol < validLength) {
                        cols[targetCol].push(parseValue(null, colTypes[targetCol]));
                        targetCol++;
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
    colInfos: ColInfo[],
    skippedHeaders: Set<string>,
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
                    throw new Error(`Invalid row structure at index ${i}`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) cols[j].push(null);
                    continue;
            }
        }

        if (invalidLine === 'throw') {
            const rowKeysCount = Object.keys(row).filter(key => !skippedHeaders.has(key)).length;
            if (rowKeysCount > validLength) {
                throw new Error(`Row at index ${i} contains unexpected properties!`);
            }
        }

        let hasMissing = false;
        const tempValues: any[] = new Array(validLength);

        for (let j = 0; j < validLength; j++) {
            const rawVal = row[labels[j]];
            const parsedVal = parseValue(rawVal, colInfos[j].type);

            if (isEmpty(parsedVal)) {
                hasMissing = true;

                if (invalidLine === 'drop' || invalidLine === 'throw') {
                    break;
                }
            } else {
                tempValues[j] = parsedVal;
            }
        }

        if (hasMissing) {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Row at index ${i} is missing required or valid column values!`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) {
                        cols[j].push(tempValues[j]);
                    }
                    break;
            }
        } else {
            for (let j = 0; j < validLength; j++) {
                cols[j].push(tempValues[j]);
            }
        }
    }
}

export function processNDJSONLines(
    lines: string[],
    labels: string[],
    colTypes: ColType[],
    cols: any[][],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
): void {
    const validLength = labels.length;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;

        let row: any;
        try {
            row = JSON.parse(line);
        } catch {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Invalid JSON syntax at line ${i + 1}: "${line}"`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) cols[j].push(null);
                    continue;
            }
        }

        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Invalid row structure at line ${i + 1}`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) cols[j].push(null);
                    continue;
            }
        }

        if (invalidLine === 'throw') {
            const rowKeysCount = Object.keys(row).length;

            if (rowKeysCount > validLength) {
                throw new Error(`Row at line ${i + 1} contains unexpected properties!`);
            }
        }

        let hasMissing = false;
        const tempValues: any[] = new Array(validLength);

        for (let j = 0; j < validLength; j++) {
            const rawVal = row[labels[j]];
            const parsedVal = parseValue(rawVal, colTypes[j]);

            if (isEmpty(parsedVal)) {
                hasMissing = true;
                if (invalidLine === 'drop' || invalidLine === 'throw') {
                    break;
                }
            }
            tempValues[j] = parsedVal;
        }

        if (hasMissing) {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Row at line ${i + 1} is missing required or valid column values!`);
                case 'impute':
                    for (let j = 0; j < validLength; j++) {
                        cols[j].push(tempValues[j]);
                    }
                    break;
            }
        } else {
            for (let j = 0; j < validLength; j++) {
                cols[j].push(tempValues[j]);
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

export async function processCSVStreamLines(
    chunkStream: AsyncIterable<string[]>,
    separator: string = ';',
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    quoteChar?: string
): Promise<{ tableData: any[][]; colInfos: ColInfo[] }> {
    const tableData: any[][] = [];
    let labels: string[] | null = null;
    let colTypes: ColType[] = [];
    let isTypeDetermined = false;
    let skippedHeaderIndices: number[] = [];
    let filteredLabels: string[] = [];

    const skipSet = new Set(skippedHeaders.map(h => h.trim()));

    for await (let lines of chunkStream) {
        if (lines.length === 0) continue;

        if (labels === null) {
            let headerLine: string | undefined = lines.shift();
            if (!headerLine) continue;

            if (quoteChar) {
                if (headerLine.startsWith(quoteChar)) headerLine = headerLine.substring(1);
                if (headerLine.endsWith(quoteChar)) headerLine = headerLine.substring(0, headerLine.length - 1);
            }

            labels = headerLine.split(separator).map(l => l.trim().replace(/^["']|["']$/g, ''));
            filteredLabels = labels.filter(l => !skipSet.has(l));

            skippedHeaderIndices = labels
                .map((label, i) => (skipSet.has(label) ? i : -1))
                .filter(index => index !== -1);

            if (labels.length === 0) {
                throw new Error('Invalid header line!');
            }

            for (let c = 0; c < filteredLabels.length; c++) {
                tableData.push([]);
            }
        }

        if (lines.length === 0) continue;

        const unprocessed = processCSVData(
            lines,
            separator,
            filteredLabels.length,
            labels.length,
            colTypes,
            skippedHeaderIndices,
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
                filteredLabels.length,
                labels.length,
                colTypes,
                skippedHeaderIndices,
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
        throw new Error('The provided CSV file or stream is empty!');
    }

    const colInfos: ColInfo[] = filteredLabels.map((label, i) => ({
        label,
        type: colTypes[i]
    }));

    return { tableData, colInfos };
}

export function processParsedJSONData(
    rawData: any,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute',
    chunkSize: number = 50_000
): { cols: any[][]; colInfos: ColInfo[] } {
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

    const skipSet = new Set(skippedHeaders.map(h => h.trim()));
    const firstRow = data[0];

    if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) {
        throw new Error('First element of JSON array must be an object!');
    }

    const labels = Object.keys(firstRow).filter(l => !skipSet.has(l.trim()));

    if (labels.length === 0) {
        throw new Error('No valid headers remaining after applying skippedHeaders filter!');
    }

    const cols: any[][] = Array.from({ length: labels.length }, () => []);
    const sampleSize = Math.min(data.length, 50);

    const colInfos: ColInfo[] = labels.map(label => {
        const sampleValues = data.slice(0, sampleSize).map(row => row[label]);
        return {
            label,
            type: getColType(sampleValues) ?? 'string'
        };
    });

    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        processJSONDataChunk(chunk, labels, cols, colInfos, skipSet, invalidLine);
    }

    return { cols, colInfos };
}

export async function processNDJSONStreamLines(
    chunkStream: AsyncIterable<string[]>,
    skippedHeaders: string[] = [],
    invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
): Promise<{ tableData: any[][]; colInfos: ColInfo[] }> {
    const tableData: any[][] = [];
    let labels: string[] = [];
    let colTypes: ColType[] = [];
    let isInitialized = false;
    const skipSet = new Set(skippedHeaders.map(h => h.trim()));

    for await (const rawLines of chunkStream) {
        if (rawLines.length === 0) continue;

        if (!isInitialized) {
            const sampleRows: any[] = [];
            let firstValidObj: any = null;

            for (const line of rawLines) {
                const trimmed = line.trim();
                if (trimmed.length === 0) continue;
                try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        if (!firstValidObj) firstValidObj = parsed;
                        sampleRows.push(parsed);
                        if (sampleRows.length >= 100) break;
                    }
                } catch {

                }
            }

            if (!firstValidObj) {
                if (invalidLine === 'throw') {
                    throw new Error('Failed to initialize NDJSON headers: No valid JSON object found.');
                }
                continue;
            }

            labels = Object.keys(firstValidObj).filter(l => !skipSet.has(l.trim()));

            if (labels.length === 0) {
                throw new Error('No valid headers remaining after applying skippedHeaders filter!');
            }

            colTypes = labels.map(label => {
                const sampleValues = sampleRows.map(row => row[label]);
                return getColType(sampleValues) ?? 'string';
            });

            for (let i = 0; i < labels.length; i++) {
                tableData.push([]);
            }

            isInitialized = true;
        }

        processNDJSONLines(rawLines, labels, colTypes, tableData, invalidLine);
    }

    if (!isInitialized) {
        throw new Error('The provided NDJSON file is empty or contains no valid data!');
    }

    const colInfos: ColInfo[] = labels.map((label, i) => ({
        label,
        type: colTypes[i]
    }));

    return { tableData, colInfos };
}