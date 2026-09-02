import Table from '../../core/dataStructures/Table';
import { ColInfo } from '../../core/types/types';

const messyData = [
    [10, 12, NaN, 14, 500],             // Numeric column containing outlier and NaN
    ['Apple', null, 'Pear', 'Plum', 'Peach']
];

const infos: ColInfo[] = [
    { label: 'price', type: 'number' },
    { label: 'fruit', type: 'string' }
];

const table = new Table(messyData, infos);

// 1. Drop rows with missing values
const cleanRows = table.dropNa('price');

// 2. Remove outliers using Tukey's IQR method
const noOutliersIqr = table.dropOutliersIqr('price', 1.5);

// 3. Remove outliers using fixed boundary thresholds
const noOutliersBounds = table.dropOutliers('price', { min: 0, max: 100 });

// 4. Impute missing numeric values using column mean
const imputedMean = table.fillNaNumeric('price', 'MEAN');

// 5. Fill missing values with literal constant replacements
const fullyCleaned = table
    .fillNa('price', 0)
    .fillNa('fruit', 'Unknown');

console.log('=== Cleaned and Imputed Table ===');
fullyCleaned.print();