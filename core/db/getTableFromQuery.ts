import Table from '../dataStructures/Table.js';
import { DbConnection } from '../types/interfaces.js';
import { ColInfo, ColType } from '../types/types.js';
import { isBool, isNumeric, isDate, firstNTypeCheck } from '../utils/utils.js';
import { getDbStream, makeDBChunk } from './dbUtils.js';

export async function getTableFromQuery(
    conn: DbConnection,
    sql: string,
    params?: any[]
): Promise<Table> {
    try {
        const stream = await getDbStream(sql, conn, params);
        const cols: any[][] = [];
        const colInfos: ColInfo[] = [];
        let labels: string[] = [];
        let labelCount = 0;
        let firstRow = true;

        for await (const chunk of makeDBChunk(stream!)) {
            const chunkSize = chunk.length;
            if (chunkSize === 0) continue;

            if (firstRow) {
                labels = Object.keys(chunk[0]);
                labelCount = labels.length;

                for (let i = 0; i < labelCount; i++) {
                    cols.push([]);
                    const label = labels[i];
                    const sampleValues = chunk.slice(0, 50).map(row => row[label]);

                    let type: ColType = 'string';
                    if (firstNTypeCheck(sampleValues, 10, isNumeric)) {
                        type = 'number';
                    } else if (firstNTypeCheck(sampleValues, 10, isBool)) {
                        type = 'bool';
                    } else if (firstNTypeCheck(sampleValues, 10, isDate)) {
                        type = 'date';
                    }

                    colInfos.push({ label, type });
                }

                firstRow = false;
            }

            for (let c = 0; c < labelCount; c++) {
                const label = labels[c];
                const targetCol = cols[c];

                for (let r = 0; r < chunkSize; r++) {
                    targetCol.push(chunk[r][label]);
                }
            }
        }

        return new Table(cols, colInfos, true);
    } catch (err) {
        console.error('Error executing query or parsing Table:', err);
        throw err;
    }
}