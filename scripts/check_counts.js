
import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:WnVqgwTZEsSJc7Yv@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000
  });

  try {
    await client.connect();
    const tables = ['locacoes', 'clientes', 'poltronas', 'planos_locacao'];
    
    for (const t of tables) {
        const res = await client.query(`SELECT count(*) FROM public.${t}`);
        console.log(`📊 ${t}: ${res.rows[0].count} registros`);
    }
  } catch (err) {
    console.error("Erro:", err);
  } finally {
    await client.end();
  }
}

check();
