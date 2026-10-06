import { parentPort } from 'node:worker_threads';
import { quickSortTable } from './utils.js';

parentPort?.on('message', (data) => {
    const { table, type, leftIdx, rightIdx, indices, controlBuffer } = data;

    quickSortTable(table, type, leftIdx, rightIdx, indices);

    Atomics.store(controlBuffer, 0, 1);
    Atomics.notify(controlBuffer, 0, 1);
});