import BoolColumn from '../../core/dataStructures/BoolColumn';

console.log('=== BOOL COLUMN DEMO ===\n');

// 1. Flexible initialization (supports 1/0, 'true'/'false', 'on'/'off')
const rawFlags = [true, false, 1, 0, 'true', 'no', 'on', 'off', null];
const flags = new BoolColumn(rawFlags, 'IsActive');

console.log(`Column Label: ${flags.label}`);
console.log(`Parsed Values:`, flags.values);
console.log(`Valid items: ${flags.countValid()}, Missing items: ${flags.countMissing()}\n`);

// 2. Ratios and counts
console.log('--- Counts & Ratios ---');
console.log(`Count True: ${flags.countTrue()}`);
console.log(`Count False: ${flags.countFalse()}`);
console.log(`True Ratio (Class Balance): ${(flags.trueRatio() * 100).toFixed(1)}%`);
console.log(`False Ratio: ${(flags.falseRatio() * 100).toFixed(1)}%\n`);

// 3. Conversion to NumberColumn (true -> 1, false -> 0, missing -> NaN)
console.log('--- Conversion to NumberColumn ---');
const numCol = flags.toNumberColumn();
console.log(`Numeric Column Label: ${numCol.label}`);
console.log(`Numeric Values (preserving NaNs):`, numCol.values, '\n');

// 4. Inversion and element-wise logical operations
console.log('--- Bitwise & Logical Operations ---');
const colA = new BoolColumn([true, true, false, false], 'A');
const colB = new BoolColumn([true, false, true, false], 'B');

console.log(`Col A:`, colA.values);
console.log(`Col B:`, colB.values);
console.log(`A AND B:`, colA.and(colB).values);
console.log(`A OR B: `, colA.or(colB).values);
console.log(`A XOR B:`, colA.xor(colB).values);

colA.invert();
console.log(`Col A (Inverted):`, colA.values);