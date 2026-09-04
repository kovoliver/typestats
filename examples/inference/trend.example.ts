import Trend from '../../core/inference/Trend';

console.log('=== 1. Linear & Exponential Trend Fitting ===');

// Time-series dataset (e.g., monthly sales or growth numbers)
const timeSeriesData: number[] = [10, 14, 19, 25, 31, 40, 52];

// Instantiate the Trend calculator
const trend = new Trend(timeSeriesData);

console.log('Sample Size (N):', trend.N);

// Linear Trend Fitting (y = a * x + b)
const linearModel = trend.linear();
console.log('Linear Model (a * x + b):', linearModel);
console.log('Linear MSE:', trend.MSELinear());

// Exponential Trend Fitting (y = a * b^x)
const expModel = trend.exponential();
console.log('Exponential Model (a * b^x):', expModel);
console.log('Exponential MSE:', trend.MSEExponential());


console.log('\n=== 2. Logarithmic & Polynomial Trend Fitting ===');

// Logarithmic Trend Fitting (y = a * ln(x + 1) + b)
const logModel = trend.logarithmic();
console.log('Logarithmic Model:', logModel);
console.log('Logarithmic MSE:', trend.MSELogarithmic());

// Polynomial Trend Fitting (e.g., Degree 2 Quadratic: y = a0 + a1*x + a2*x^2)
const polyModelDeg2 = trend.polynomial(2);
console.log('Polynomial Model (Degree 2):', polyModelDeg2);
console.log('Polynomial MSE (Degree 2):', trend.MSEPolynomial(2));


console.log('\n=== 3. Unified MSE Comparison ===');

// Comparing MSE values across all model types using the unified MSE method
console.log('Unified MSE (LINEAR):', trend.MSE('linear'));
console.log('Unified MSE (EXPONENTIAL):', trend.MSE('exponential'));
console.log('Unified MSE (LOGARITHMIC):', trend.MSE('logarithmic'));
console.log('Unified MSE (POLYNOMIAL, degree 3):', trend.MSE('polynomial', 3));