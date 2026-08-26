import {
  mean,
  median,
  mode,
  variance,
  std,
  range,
  iqr,
  q1,
  q3,
  skewness,
  excessKurtosis,
  rsd
} from '../../core/statistics/univariate';

// Sample dataset
const data: number[] = [12, 15, 12, 18, 22, 15, 30, 12, 25, 18];

console.log('=== Central Tendency & Position ===\n');
console.log('Mean:', mean(data, 2));
console.log('Median:', median(data));
console.log('Mode(s):', mode(data));
console.log('Q1 (25th Percentile):', q1(data));
console.log('Q3 (75th Percentile):', q3(data));

console.log('\n=== Dispersion & Spread ===');
console.log('Range:', range(data));
console.log('Interquartile Range (IQR):', iqr(data));
console.log('Population Variance:', variance(data, false, 2));
console.log('Sample Variance:', variance(data, true, 2));
console.log('Population Standard Deviation:', std(data, false, 2));
console.log('Sample Standard Deviation:', std(data, true, 2));
console.log('Relative Standard Deviation (RSD / CV):', rsd(data, true, 4));

console.log('\n=== Shape Measures ===');
console.log('Skewness:', skewness(data, true, 3));
console.log('Excess Kurtosis:', excessKurtosis(data, true, 3));