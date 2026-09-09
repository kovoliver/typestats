import { ColInfo, ColType, ChunkResult } from '../types/types.js';
import { toNumberArray, toBoolArray, toDateArray, toStringArray } from '../utils/utils.js';
import { firstNTypeCheck, isBool, isNumeric, isDate } from '../utils/utils.js';

export function getColType(col: any[], colType?: ColType): ColType {
    if (colType) return colType;

    if (firstNTypeCheck(col, 10, isBool)) return 'bool';
    if (firstNTypeCheck(col, 10, isNumeric)) return 'number';
    if (firstNTypeCheck(col, 10, isDate)) return 'date';

    return 'string';
}

export function processChunkValues(
    values: any[][],
    colInfos: ColInfo[],
    chunkIndex: number
): ChunkResult {
    const colCount = values.length;
    const processedValues: any[][] = new Array(colCount);
    const resolvedTypes: ColType[] = new Array(colCount);

    for (let i = 0; i < colCount; i++) {
        const rawCol = values[i];
        const type = colInfos[i]?.type ?? getColType(rawCol);
        resolvedTypes[i] = type;

        switch (type) {
            case 'number':
                processedValues[i] = toNumberArray(rawCol);
                break;
            case 'bool':
                processedValues[i] = toBoolArray(rawCol);
                break;
            case 'date':
                processedValues[i] = toDateArray(rawCol);
                break;
            case 'string':
            default:
                processedValues[i] = toStringArray(rawCol);
                break;
        }
    }

    return {
        processedValues,
        colTypes: resolvedTypes,
        chunkIndex,
    };
}