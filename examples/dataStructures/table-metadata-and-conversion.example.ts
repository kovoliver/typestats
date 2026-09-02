import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

// Initial data matrix and column information
const rawData = [
    [101, 102, 103],
    ['1', '0', '1'],
    ['12.5', '34.0', '99.9']
];

const colInfos: ColInfo[] = [
    { label: 'id', type: 'number' },
    { label: 'active_str', type: 'string' },
    { label: 'score_str', type: 'string' }
];

const table = new Table(rawData, colInfos);

// 1. Rename a single column
table.setLabel('id', 'user_id');

// 2. Rename multiple columns at once
table.setLabels(['active_str', 'score_str'], ['is_active', 'score']);

// 3. Convert column types explicitly
table.toBoolCol('is_active');   // String -> BoolColumn
table.toNumberCol('score');     // String -> NumberColumn

console.log('=== Renamed and Converted Columns ===');
table.print();