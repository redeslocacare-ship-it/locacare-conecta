
import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) throw new Error('Defina SUPABASE_DB_URL no ambiente antes de rodar este script.');

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
