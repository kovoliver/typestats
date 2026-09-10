import { describe, it, expect } from 'vitest';
import { getTableFromCSVAPI, getTableFromJSONAPI } from '../../core/io/clientIO';
import { getTableFromCSV, getTableFromJSON, getTableFromXLS } from '../../core/io/nodeIO';

describe('Client I/O (clientIO.ts)', () => {
    it('should fetch and parse a remote CSV file from a live Web URL', async () => {
        const csvUrl = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv';
        const table = await getTableFromCSVAPI(csvUrl, ',');

        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.getCol('sepal_length')).toBeDefined();
        expect(table.getCol('species')).toBeDefined();

        console.log('\n--- 🌐 CLIENT CSV TEST (Iris dataset head) ---');
        table.head(3);
        table.describe();
    });

    it('should fetch and parse a remote JSON file from a live Web URL', async () => {
        const jsonUrl = 'https://raw.githubusercontent.com/vega/vega-datasets/main/data/cars.json';
        const table = await getTableFromJSONAPI(jsonUrl);

        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.getCol('Miles_per_Gallon')).toBeDefined();
        expect(table.getCol('Name')).toBeDefined();

        console.log('\n--- 🌐 CLIENT JSON TEST (Cars dataset head) ---');
        table.head(3);
        table.describe();
    });

    it('should throw an error when fetching from an invalid URL', async () => {
        const invalidUrl = 'https://raw.githubusercontent.com/non_existent_file_12345.json';

        await expect(getTableFromJSONAPI(invalidUrl)).rejects.toThrow();
    });
});

describe('Node.js Backend I/O (nodeIO.ts)', () => {
    it('should read and parse local CSV file using sampleData/users_dataset.csv', async () => {
        const csvPath = './sampleData/users_dataset.csv';
        const table = await getTableFromCSV(csvPath, ';', 'impute');

        expect(table.rowCount).toBe(100);
        expect(table.getCol('first_name')).toBeDefined();
        expect(table.getCol('annual_income')).toBeDefined();

        console.log('\n--- 🖥️ NODE CSV TEST (users_dataset.csv head) ---');
        table.head(3);
        table.describe();
    });

    it('should read and parse local JSON file using sampleData/products_dataset.json', async () => {
        const jsonPath = './sampleData/products_dataset.json';
        const table = await getTableFromJSON(jsonPath);

        expect(table.rowCount).toBe(100);
        expect(table.getCol('product_name')).toBeDefined();
        expect(table.getCol('price')).toBeDefined();

        console.log('\n--- 🖥️ NODE JSON TEST (products_dataset.json head) ---');
        table.head(3);
        table.describe();
    });

    it('should read and parse local Excel file using sampleData/excel_dataset.xlsx', async () => {
        const excelPath = './sampleData/bank_churn_messy.xlsx';
        const table = await getTableFromXLS(excelPath);

        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.getCol('CustomerId')).toBeDefined();
        expect(table.getCol('Surname')).toBeDefined();
        expect(table.getCol('CreditScore')).toBeDefined();
        expect(table.getCol('Geography')).toBeDefined();
        expect(table.getCol('Gender')).toBeDefined();
        expect(table.getCol('Age')).toBeDefined();
        expect(table.getCol('Tenure')).toBeDefined();
        expect(table.getCol('EstimatedSalary')).toBeDefined();

        console.log('\n--- 🖥️ NODE EXCEL TEST (bank_churn_messy.xlsx head) ---');
        table.head(3);
        table.describe();
    });

    it('should throw an error when local Excel file path is invalid', () => {
        const invalidPath = './sampleData/non_existent_file.xlsx';
        expect(() => getTableFromXLS(invalidPath)).toThrow();
    });
});