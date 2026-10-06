import { Worker } from 'node:worker_threads';
import { partition, quickSortTable } from './utils.js';
import { TableData } from '../types/types.js';

const workerPool: Worker[] = [];

for (let i = 0; i < 4; i++) {
    const w = new Worker(new URL('./quickSortWorker.js', import.meta.url));
    w.unref();
    workerPool.push(w);
}

let workerIndex = 0;

function getNextWorker(): Worker {
    const w = workerPool[workerIndex];
    workerIndex = (workerIndex + 1) % workerPool.length;
    return w;
}

function createSharedIndices(length: number): Uint32Array {
    const sab = new SharedArrayBuffer(length * Uint32Array.BYTES_PER_ELEMENT);
    const indices = new Uint32Array(sab);

    for (let k = 0; k < length; k++) {
        indices[k] = k;
    }

    return indices;
}

function dispatchWorkerSync(
    table: TableData,
    type: 'asc' | 'desc',
    leftIdx: number,
    rightIdx: number,
    indices: Uint32Array
): void {
    const controlSab = new SharedArrayBuffer(4);
    const controlBuffer = new Int32Array(controlSab);

    const worker = getNextWorker();

    worker.postMessage({
        table,
        type,
        leftIdx,
        rightIdx,
        indices,
        controlBuffer
    });

    Atomics.wait(controlBuffer, 0, 0);
}

export function quickSortTableParallelSync(
    table: TableData,
    type: 'asc' | 'desc',
    leftIdx: number,
    rightIdx: number,
    indices: Uint32Array | null = null,
    threshold = 20_000
): Uint32Array {
    if (process.env.VITEST || (rightIdx - leftIdx < threshold)) {
        return quickSortTable(table, type, leftIdx, rightIdx, indices);
    }

    const rowNumbers = table[0].length;

    if (indices === null) {
        indices = createSharedIndices(rowNumbers);
    }

    if (leftIdx >= rightIdx) return indices;

    const { i, j } = partition(table, type, leftIdx, rightIdx, indices);

    if (leftIdx < j) {
        if (j - leftIdx > threshold) {
            dispatchWorkerSync(table, type, leftIdx, j, indices);
        } else {
            quickSortTable(table, type, leftIdx, j, indices);
        }
    }

    if (i < rightIdx) {
        if (rightIdx - i > threshold) {
            dispatchWorkerSync(table, type, i, rightIdx, indices);
        } else {
            quickSortTable(table, type, i, rightIdx, indices);
        }
    }

    return indices;
}