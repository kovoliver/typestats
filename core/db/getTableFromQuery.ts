import Table from '../dataStructures/Table.js';
import { processJSONDataChunk } from '../io/ioutils.js';
import { DbConnection } from '../types/interfaces.js';

// export async function getTableFromQuery(
//     conn: DbConnection,
//     sql: string,
//     params?: any[],
//     invalidLine: 'drop' | 'throw' | 'impute' = 'impute'
// ): Promise<Table> {
//     try {
//         const rawRows = await conn.execQuery(sql, params);

//         if (!rawRows || rawRows.length === 0) {
//             throw new Error('The query returned no results to construct a Table instance.');
//         }

//         const { cols, colInfos } = processJSONDataChunk(rawRows, invalidLine);

//         return new Table(cols, colInfos);
//     } catch (err) {
//         console.error('Error executing query or parsing Table:', err);
//         throw err;
//     }
// }