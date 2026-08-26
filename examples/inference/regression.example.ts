import Regression from '../../core/inference/Regression';

console.log('=== 1. Linear Regression (y = b0 + b1 * x) ===');

// Datasets: Independent variable (x) and Dependent variable (y)
const xVals: number[] = [1, 2, 3, 4, 5, 6];
const yValsLinear: number[] = [2.5, 3.8, 5.1, 6.4, 7.9, 9.2];

// Instantiate the Regression model
const linearReg = new Regression(xVals, yValsLinear);
const { b0: intercept, b1: slope } = linearReg.linear();

console.log('Intercept (b0):', intercept);
console.log('Slope (b1):', slope);
console.log(`Fitted Model Equation: y = ${intercept.toFixed(4)} + ${slope.toFixed(4)} * x`);


console.log('\n=== 2. Exponential Regression (y = b0 * b1^x) ===');

// Strictly positive values for exponential model fitting
const yValsExp: number[] = [3.2, 7.1, 15.8, 35.2, 79.1, 175.4];

const expReg = new Regression(xVals, yValsExp);
const expParams = expReg.exponential();

console.log('Scale Factor (b0):', expParams.b0);
console.log('Growth Base (b1):', expParams.b1);
console.log(`Fitted Model Equation: y = ${expParams.b0.toFixed(4)} * (${expParams.b1.toFixed(4)} ^ x)`);


console.log('\n=== 3. Power Regression (y = b0 * x^b1) ===');

// Strictly positive x and y values for log-log transformation
const xValsPower: number[] = [1, 2, 4, 8, 16, 32];
const yValsPower: number[] = [2.0, 5.6, 16.0, 45.2, 128.0, 362.0];

const powerReg = new Regression(xValsPower, yValsPower);
const powerParams = powerReg.power();

console.log('Proportionality Constant (b0):', powerParams.b0);
console.log('Exponent (b1):', powerParams.b1);
console.log(`Fitted Model Equation: y = ${powerParams.b0.toFixed(4)} * (x ^ ${powerParams.b1.toFixed(4)})`);