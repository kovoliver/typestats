import NumberColumn from '../../core/dataStructures/NumberColumn';

console.log('=== NUMBER COLUMN DEMO ===\n');

// 1. Initialization with raw mixed data (requires cleaning)
const rawPrices = [1200, 1500, 1100, 4500, '1300', null, NaN, 1400];
const prices = new NumberColumn(rawPrices, 'ProductPrice');

console.log(`Column Label: ${prices.label}`);
console.log(`Original Values:`, prices.values);
console.log(`Valid entries count: ${prices.countValid()}`);
console.log(`Missing entries count: ${prices.countMissing()}\n`);

// 2. Univariate descriptive statistics
console.log('--- Descriptive Statistics ---');
console.log(`Min price: ${prices.min()}`);
console.log(`Max price: ${prices.max()}`);
console.log(`Mean price: ${prices.mean().toFixed(2)}`);
console.log(`Median: ${prices.median()}`);
console.log(`IQR (Interquartile Range): ${prices.iqr()}`);
console.log(`Skewness: ${prices.skewness().toFixed(4)}\n`);

// 3. Data cleaning: purging NaNs / nulls and sorting
console.log('--- Cleaning & Sorting ---');
prices.removeEmptyRows();
console.log(`Values after removing empty rows:`, prices.values);

prices.orderDesc();
console.log(`Values in descending order:`, prices.values, '\n');

// 4. Bivariate analysis and regression modeling
console.log('--- Regression & Correlation ---');
const salesVolume = new NumberColumn([100, 80, 110, 20, 90, 85], 'SalesVolume');

console.log(`Correlation between Price and Volume: ${prices.correlation(salesVolume).toFixed(4)}`);

const reg = prices.linearRegression(salesVolume);
console.log(`Linear Regression fit: Y = ${reg.b0.toFixed(2)} + (${reg.b1.toFixed(2)} * X)\n`);

// 5. Time-series trend fitting
console.log('--- Time-Series Trends ---');
const trendSeries = new NumberColumn([10, 15, 22, 35, 50], 'GrowthSeries');
console.log(`Linear Trend fit:`, trendSeries.linearTrend());
console.log(`Polynomial (Degree 2) Trend fit:`, trendSeries.polynomialTrend(2));