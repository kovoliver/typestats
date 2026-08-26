import FrequencyTable from '../../core/statistics/FrequencyTable';

// Class intervals: [Lower Bound, Upper Bound]
const classIntervals: [number, number][] = [
  [0, 10],
  [10, 20],
  [20, 30],
  [30, 40],
  [40, 50]
];

// Frequencies corresponding to each interval
const frequencies: number[] = [5, 12, 20, 8, 5];

// Instantiate the FrequencyTable
const freqTable = new FrequencyTable(classIntervals, frequencies);

console.log('=== Frequency Table Overview ===');
console.log('Total Population Size (N):', freqTable.frequency);
console.log('Sample Degrees of Freedom (N - 1):', freqTable.sampleFrequency);
console.log('Class Midpoints:', freqTable.midPoints);
console.log('Frequencies:', freqTable.frequencies);
console.log('Cumulative Frequencies:', freqTable.cumulativeFrequencies);
console.log('Relative Frequencies:', freqTable.relativeFrequencies);
console.log('Cumulative Relative Frequencies:', freqTable.cumulativeRelativeFrequencies);

console.log('\n=== Central Tendency & Quantiles ===');
console.log('Estimated Mean (avg):', freqTable.avg);
console.log('Estimated Mode(s):', freqTable.modes);
console.log('Estimated Median:', freqTable.median);
console.log('First Quartile (Q1):', freqTable.q1);
console.log('Third Quartile (Q3):', freqTable.q3);
console.log('Interquartile Range (IQR):', freqTable.iqr);
console.log('Custom Quantile (90th Percentile - k=90, n=100):', freqTable.kvantile(100, 90));

console.log('\n=== Dispersion & Shape Measures ===');
console.log('Total Span Range:', freqTable.range);
console.log('Sum of Squared Deviations (SSD):', freqTable.ssd);
console.log('Population Variance:', freqTable.variance);
console.log('Sample Variance:', freqTable.sampleVariance);
console.log('Population Standard Deviation:', freqTable.std);
console.log('Sample Standard Deviation:', freqTable.sampleStd);
console.log('Relative Standard Deviation (CV):', freqTable.relativeStd(false));
console.log('Skewness:', freqTable.skewness());
console.log('Excess Kurtosis:', freqTable.excessKurtosis());

console.log('\n=== Complete Aggregated Table Object ===');
console.dir(freqTable.frequencyTable, { depth: null });