import StringColumn from '../../core/dataStructures/StringColumn';

console.log('=== STRING COLUMN DEMO ===\n');

// 1. Initialization with missing values and auto-conversions
const rawCategories = ['Laptop', 'Phone', 'Tablet', 'Laptop', 101, null, 'undefined', 'Phone'];
const categories = new StringColumn(rawCategories, 'DeviceType');

console.log(`Column Label: ${categories.label}`);
console.log(`Parsed Values:`, categories.values);
console.log(`Unique categories:`, categories.unique(), '\n');

// 2. Cleaning and sorting
console.log('--- Cleaning & Sorting ---');
categories.removeEmptyRows();
console.log(`Cleaned Values:`, categories.values);

categories.orderAsc();
console.log(`Sorted Ascending:`, categories.values, '\n');

// 3. Label Encoding (Transforming categorical string values into integers)
console.log('--- Feature Engineering: Label Encoding ---');
const labelEncodedCol = categories.labelEncode();
console.log(`Encoded Column Label: ${labelEncodedCol.label}`);
console.log(`Encoded Values (NumberColumn):`, labelEncodedCol.values, '\n');

// 4. One-Hot Encoding (Cached matrix generation)
console.log('--- Feature Engineering: One-Hot Encoding ---');
const oneHotCols = categories.oneHotEncoded;

console.log(`Generated ${oneHotCols.length} One-Hot columns:`);
oneHotCols.forEach(col => {
    console.log(`- ${col.label}:`, col.values);
});