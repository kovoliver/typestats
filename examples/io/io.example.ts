import { getCSVFromClient, getJSONFromClient } from '../../core/io/clientIO';
import { getCSVFromNode, getJSONFromNode } from '../../core/io/nodeIO';

async function runExamples() {
    console.log('🚀 === TypeStats I/O Usage Examples ===\n');

    try {
        // ----------------------------------------------------
        // 1. Client-Side CSV Loading (Browser / HTTP Endpoint)
        // ----------------------------------------------------
        console.log('--- 1. Client-Side CSV Loading ---');
        const clientCsvUrl = 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv';
        const clientCsvTable = await getCSVFromClient(clientCsvUrl, ',');
        
        console.log(`Loaded ${clientCsvTable.rowCount} rows from client CSV.`);
        clientCsvTable.print(0, 5); // Display first 5 rows


        // ----------------------------------------------------
        // 2. Client-Side JSON Loading (Browser / HTTP Endpoint)
        // ----------------------------------------------------
        console.log('\n--- 2. Client-Side JSON Loading ---');
        const clientJsonUrl = 'https://raw.githubusercontent.com/vega/vega-datasets/main/data/cars.json';
        const clientJsonTable = await getJSONFromClient(clientJsonUrl);
        
        console.log(`Loaded ${clientJsonTable.rowCount} rows from client JSON.`);
        clientJsonTable.print(0, 5, 4); // Display first 5 rows, limit to 4 columns


        // ----------------------------------------------------
        // 3. Backend Node.js CSV Loading (Local Filesystem)
        // ----------------------------------------------------
        console.log('\n--- 3. Backend Node.js CSV Loading ---');
        const localCsvPath = './sampleData/users_dataset.csv';
        const nodeCsvTable = await getCSVFromNode(localCsvPath, ';', 'impute');
        
        console.log(`Loaded ${nodeCsvTable.rowCount} rows from local CSV.`);
        nodeCsvTable.print(0, 5, 5); // Display first 5 rows, limit to 5 columns


        // ----------------------------------------------------
        // 4. Backend Node.js JSON Loading (Local Filesystem)
        // ----------------------------------------------------
        console.log('\n--- 4. Backend Node.js JSON Loading ---');
        const localJsonPath = './sampleData/products_dataset.json';
        const nodeJsonTable = await getJSONFromNode(localJsonPath);
        
        console.log(`Loaded ${nodeJsonTable.rowCount} rows from local JSON.`);
        nodeJsonTable.print(0, 5, 6); // Display first 5 rows, limit to 6 columns

    } catch (error) {
        console.error('❌ An error occurred during dataset loading:', error);
    }
}

runExamples();