import { parentPort } from 'node:worker_threads';
import { processChunkValues } from './chunkProcessor.js';
import { ColInfo } from '../types/types.js';

interface WorkerTaskPayload {
    values: any[][];
    colInfos: ColInfo[];
    chunkIndex: number;
}

if (parentPort) {
    parentPort.on('message', (payload: WorkerTaskPayload) => {
        const { values, colInfos, chunkIndex } = payload;
        const result = processChunkValues(values, colInfos, chunkIndex);
        parentPort?.postMessage(result);
    });
}