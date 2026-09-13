import { parentPort } from 'node:worker_threads';
import { DBWorkerData } from '../types/types.js';

parentPort?.on('message', (data: DBWorkerData) => {
    const { chunk, labels } = data;
    const chunkSize = chunk.length;
    const labelCount = labels.length;

    const cols: any[][] = Array.from({ length: labelCount }, () => []);

    for (let c = 0; c < labelCount; c++) {
        const label = labels[c];
        const targetCol = cols[c];

        for (let r = 0; r < chunkSize; r++) {
            targetCol.push(chunk[r][label]);
        }
    }

    parentPort?.postMessage(cols);
});