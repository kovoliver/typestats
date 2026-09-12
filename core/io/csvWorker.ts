import { parentPort } from 'node:worker_threads';
import { processCSVData } from './ioutils.js';
import { WorkerData } from '../types/types.js';

parentPort?.on('message', (data: WorkerData) => {
    const {
        lines,
        separator,
        validLength,
        totalRawCols,
        colTypes,
        skippedHeaderIndices = [],
        invalidLine = 'impute',
        quoteChar
    } = data;

    const cols = processCSVData(
        lines,
        separator,
        validLength,
        totalRawCols,
        colTypes,
        skippedHeaderIndices,
        invalidLine,
        quoteChar
    );

    parentPort?.postMessage(cols);
});