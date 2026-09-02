import { describe, it, expect } from 'vitest';
import { getCSVFromClient, getJSONFromClient } from '../../core/io/clientIO';
import { getCSVFromNode, getJSONFromNode } from '../../core/io/nodeIO';

describe('Client I/O (clientIO.ts)', () => {
    it('should fetch and parse a remote CSV file from a live Web URL', async () => {
        const csvUrl = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv';
        const table = await getCSVFromClient(csvUrl, ',');

        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.getCol('sepal_length')).toBeDefined();
        expect(table.getCol('species')).toBeDefined();

        console.log('\n--- 🌐 CLIENT CSV TEST (Iris dataset head) ---');
        table.head(3);
    });

    it('should fetch and parse a remote JSON file from a live Web URL', async () => {
        const jsonUrl = 'https://raw.githubusercontent.com/vega/vega-datasets/main/data/cars.json';
        const table = await getJSONFromClient(jsonUrl);

        expect(table.rowCount).toBeGreaterThan(0);
        expect(table.getCol('Miles_per_Gallon')).toBeDefined();
        expect(table.getCol('Name')).toBeDefined();

        console.log('\n--- 🌐 CLIENT JSON TEST (Cars dataset head) ---');
        table.head(3);
    });

    it('should throw an error when fetching from an invalid URL', async () => {
        const invalidUrl = 'https://raw.githubusercontent.com/non_existent_file_12345.json';

        await expect(getJSONFromClient(invalidUrl)).rejects.toThrow();
    });
});

describe('Node.js Backend I/O (nodeIO.ts)', () => {
    it('should read and parse local CSV file using sampleData/users_dataset.csv', async () => {
        const csvPath = './sampleData/users_dataset.csv';
        const table = await getCSVFromNode(csvPath, ';', 'impute');

        expect(table.rowCount).toBe(100);
        expect(table.getCol('first_name')).toBeDefined();
        expect(table.getCol('annual_income')).toBeDefined();

        console.log('\n--- 🖥️ NODE CSV TEST (users_dataset.csv head) ---');
        table.head(3);
    });

    it('should read and parse local JSON file using sampleData/products_dataset.json', async () => {
        const jsonPath = './sampleData/products_dataset.json';
        const table = await getJSONFromNode(jsonPath);

        expect(table.rowCount).toBe(100);
        expect(table.getCol('product_name')).toBeDefined();
        expect(table.getCol('price')).toBeDefined();

        console.log('\n--- 🖥️ NODE JSON TEST (products_dataset.json head) ---');
        table.head(3);
    });

    it('should throw an error when local file path is invalid', async () => {
        const invalidPath = './sampleData/non_existent_file.json';
        await expect(getJSONFromNode(invalidPath)).rejects.toThrow();
    });
});