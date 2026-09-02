import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

const data = [
    ['Alice', 'Bob', 'Charlie'],
    [25, 30, 35],
    ['Developer', 'Designer', 'Manager']
];

const infos: ColInfo[] = [
    { label: 'name', type: 'string' },
    { label: 'age', type: 'number' },
    { label: 'role', type: 'string' }
];

const table = new Table(data, infos);

// 1. Select specific columns (select)
const namesAndRoles = table.select('name', 'role');

// 2. Drop a column (drop)
const noAge = table.drop('age');

// 3. Add a new column to the beginning (addColumnFirst)
const withId = table.addColumnFirst(
    [1, 2, 3],
    { label: 'id', type: 'number' }
);

// 4. Add a new column to the end (addColumnLast)
const withSalary = withId.addColumnLast(
    [50000, 60000, 75000],
    { label: 'salary', type: 'number' }
);

// 5. Insert a new column at a specific index (addColumnAt)
const finalTable = withSalary.addColumnAt(
    [true, true, false],
    { label: 'full_time', type: 'bool' },
    2
);

console.log('=== Final Manipulated Table ===');
finalTable.print();