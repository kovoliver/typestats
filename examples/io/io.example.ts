import { getCSVFromClient } from '../../core/io/clientIO';

async function main() {
    console.log('🚀 Fetching and parsing sample CSV dataset...\n');
    const table = await getCSVFromClient('./sampleData/users_dataset.csv', ';', 'impute');

    if (!table) {
        console.error('❌ Failed to load the table.');
        return;
    }

    console.log(`✅ Table loaded successfully! Total rows: ${table.rowCount}\n`);

    console.log('--- 📊 FIRST 5 ROWS (HEAD) ---');
    table.head(5);

    console.log('\n--- 📊 LAST 5 ROWS (TAIL) ---');
    table.tail(5);
}

main().catch(err => {
    console.error('An error occurred during execution:', err);
});