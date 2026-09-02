import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

const dataset = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
];

const infos: ColInfo[] = [
    { label: 'id', type: 'number' },
    { label: 'code', type: 'string' }
];

const table = new Table(dataset, infos);

// 1. Console display views (head, tail, print slice)
console.log('--- First 3 Rows (head) ---');
table.head(3);

console.log('--- Last 3 Rows (tail) ---');
table.tail(3);

console.log('--- Displaying Specific Range [2, 5) ---');
table.print(2, 5);

// 2. Export as an array of plain JavaScript objects (JSON friendly)
const jsObjects = table.toObject();
console.log('Exported Objects (First Item):', jsObjects[0]);

// 3. Export as a CSV formatted string
const csvContent = table.toCSV(';');
console.log('Exported CSV Output:\n', csvContent);

// 4. Export as a 2D raw array matrix
const rawMatrix = table.toMatrix();
console.log('Exported Matrix (2D Array):', rawMatrix);