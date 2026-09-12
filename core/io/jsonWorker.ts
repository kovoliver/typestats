import { parentPort } from 'node:worker_threads';
import type { JSONWorkerPayload } from '../types/types.js';
import { processNDJSONLines } from '../io/ioutils.js';

parentPort?.on('message', (data: JSONWorkerPayload) => {
    const { lines, labels, colTypes, invalidLine } = data;
    const cols: any[][] = Array.from({ length: labels.length }, () => []);

    processNDJSONLines(lines, labels, colTypes, cols, invalidLine);
    parentPort?.postMessage(cols);
});