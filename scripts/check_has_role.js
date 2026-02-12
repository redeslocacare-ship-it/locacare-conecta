
import pg from 'pg';

const { Client } = pg;
const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:WnVqgwTZEsSJc7Yv@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function checkFunction() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'has_role';
    `);
    
    if (res.rows.length > 0) {
      console.log("✅ Function 'has_role' exists.");
    } else {
      console.log("❌ Function 'has_role' DOES NOT exist.");
    }
  } catch (err) {
    console.error("Error checking function:", err);
  } finally {
    await client.end();
  }
}

checkFunction();
