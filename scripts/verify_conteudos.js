
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const { Client } = pg;

const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:WnVqgwTZEsSJc7Yv@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function verify() {
  console.log("Checking conteudos tables...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check tables
    const tables = ['depoimentos', 'faqs', 'conteudos_site'];
    for (const t of tables) {
        const res = await client.query(`SELECT to_regclass('public.${t}')`);
        if (res.rows[0].to_regclass) {
            console.log(`✅ Table '${t}' exists.`);
        } else {
            console.error(`❌ Table '${t}' DOES NOT EXIST.`);
        }
    }

    // Check RLS policies
    const policies = await client.query(`select * from pg_policies where tablename in ('depoimentos', 'faqs', 'conteudos_site')`);
    console.log("Policies found:", policies.rows.map(p => `${p.tablename}: ${p.policyname} (${p.cmd})`).join("\n"));

    // Check if 'como_funciona' exists
    const como = await client.query(`select id, chave from public.conteudos_site where chave = 'como_funciona'`);
    if (como.rows.length > 0) {
        console.log("✅ 'como_funciona' record found.");
    } else {
        console.log("⚠️ 'como_funciona' record NOT found (will be created by frontend).");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

verify();
