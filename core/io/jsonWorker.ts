import { parentPort } from 'node:worker_threads';
import { JSONWorkerData } from '../types/types.js';

parentPort?.on('message', (data: JSONWorkerData) => {
    const { lines, labels, invalidLine } = data;
    const validLength = labels.length;
    const cols: any[][] = Array.from({ length: validLength }, () => []);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;

        let row: any;
        try {
            row = JSON.parse(line);
        } catch (err) {
            switch (invalidLine) {
                case 'drop':
                    continue;
                case 'throw':
                    throw new Error(`Invalid JSON line at index ${i}`);
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
                    throw new Error(`Invalid object structure at index ${i}`);
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

    parentPort?.postMessage(cols);
});