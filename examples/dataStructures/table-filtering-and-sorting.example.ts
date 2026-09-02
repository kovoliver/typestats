import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';

const storeData = [
    ['Laptop', 'Mouse', 'Keyboard', 'Monitor'],
    ['Electronics', 'Accessories', 'Accessories', 'Electronics'],
    [1200, 25, 45, 300],
    [5, 50, 30, 0]
];

const infos: ColInfo[] = [
    { label: 'product', type: 'string' },
    { label: 'category', type: 'string' },
    { label: 'price', type: 'number' },
    { label: 'stock', type: 'number' }
];

const table = new Table(storeData, infos);

// 1. Simple single-condition filtering (where)
const inStock = table.where('stock', stock => stock > 0);

// 2. Logical AND filtering across multiple columns (whereAll)
const expensiveElectronics = table.whereAll(
    ['category', 'price'],
    [cat => cat === 'Electronics', price => price > 200]
);

// 3. Logical OR filtering across multiple columns (whereAny)
const cheapOrInStock = table.whereAny(
    ['price', 'stock'],
    [price => price < 30, stock => stock > 40]
);

// 4. Sort table rows in descending order
const sortedByPrice = table.orderByDesc('price');

// 5. Group table rows by category (groupBy -> GroupedTable)
const grouped = table.groupBy('category');

console.log('=== Products Sorted by Price Descending ===');
sortedByPrice.print();

console.log('=== Grouping Aggregations ===');
console.log('Category Counts:', grouped.count().toObject());