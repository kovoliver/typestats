import Table from '../dataStructures/Table.js';
import { DbConnection } from '../types/interfaces.js';
import { ColInfo, ColType } from '../types/types.js';
import { getColType } from '../utils/utils.js';
import { getDbStream, makeDBChunk } from './dbUtils.js';

/**
 * Executes an SQL query against a database connection and transforms the result set
 * directly into a {@link Table} instance.
 *
 * @param conn - An active {@link DbConnection} instance.
 * @param sql - The SQL query string to be executed.
 * @param params - Optional parameter array for parameterized SQL queries.
 *
 * @returns A Promise that resolves to a newly instantiated {@link Table} object populated with query results.
 *
 * @throws {@link Error} If query execution fails or the connection encounters a network/protocol error.
 */
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

                    let type: ColType = getColType(sampleValues);

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