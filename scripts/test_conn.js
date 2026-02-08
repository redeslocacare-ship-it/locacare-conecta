import pg from 'pg';
const { Client } = pg;

const password = 'WnVqgwTZEsSJc7Yv';
const project = 'wwltjlnlutnuypmkwbuy';

const configs = [
    {
        name: 'Pooler (6543)',
        str: `postgresql://postgres.${project}:${password}@aws-1-us-east-1.pooler.supabase.com:6543/postgres`
    },
    {
        name: 'Direct (5432)',
        str: `postgresql://postgres.${project}:${password}@db.${project}.supabase.co:5432/postgres`
    }
];

async function test() {
    for (const conf of configs) {
        console.log(`\nTesting ${conf.name}...`);
        const client = new Client({
            connectionString: conf.str,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log(`✅ Success! Connected to ${conf.name}`);
            const res = await client.query('SELECT version()');
            console.log(`   Version: ${res.rows[0].version}`);
            await client.end();
        } catch (err) {
            console.error(`❌ Failed ${conf.name}:`, err.message);
        }
    }
}

test();
