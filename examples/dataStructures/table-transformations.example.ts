import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types';

const data = [
    ['John', 'Jane'],
    ['Doe', 'Smith'],
    [100, 200],
    [1.27, 1.27]
];

const infos: ColInfo[] = [
    { label: 'first_name', type: 'string' },
    { label: 'last_name', type: 'string' },
    { label: 'net_price', type: 'number' },
    { label: 'vat_multiplier', type: 'number' }
];

const table = new Table(data, infos);

// 1. Transform column values using a mapping function (mapColumn)
const withUppercase = table.mapColumn('first_name', 'first_name_upper', val =>
    String(val).toUpperCase()
);

// 2. Perform arithmetic operations across numeric columns (combineColumns)
const withGrossPrice = withUppercase.combineColumns(
    ['net_price', 'vat_multiplier'],
    '*',
    'gross_price'
);

// 3. Concatenate string columns with a custom separator (mergeColumns)
const finalTable = withGrossPrice.mergeColumns(
    ['first_name', 'last_name'],
    ' ',
    'full_name'
);

console.log('=== Transformed and Derived Columns ===');
finalTable.print();