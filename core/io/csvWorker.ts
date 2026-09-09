import { parentPort } from 'node:worker_threads';
import { parseValue } from './ioutils.js';
import { WorkerData } from '../types/types.js';

parentPort?.on('message', (data: WorkerData) => {
    const { lines, separator, validLength, colTypes, invalidLine, quoteChar } = data;
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

        if (col < validLength) {
            switch (invalidLine) {
                case 'drop':
                    for (let c = 0; c < col; c++) cols[c].pop();
                    break;
                case 'throw':
                    throw new Error(`Invalid CSV row length`);
                case 'impute':
                    while (col < validLength) {
                        cols[col].push(parseValue(null, colTypes[col]));
                        col++;
                    }
                    break;
            }
        }
    }

    parentPort?.postMessage(cols);
});