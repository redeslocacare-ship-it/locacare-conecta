import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Connection string from cre.txt
const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:LocaCare%402026@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
  console.log("🔌 Conectando ao Banco de Dados...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase connection
  });

  try {
    await client.connect();
    console.log("✅ Conectado com sucesso.");

    const schemaPath = path.resolve(__dirname, '../supabase/schema_full.sql');
    console.log(`📖 Lendo schema de: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
        throw new Error("Arquivo de schema não encontrado!");
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log("🚀 Executando migração SQL...");
    // Split commands safely? For now, let's try executing the whole block.
    // pg driver can handle multiple statements in one query usually.
    
    await client.query(sql);
    
    console.log("✅ Schema aplicado com sucesso!");
    console.log("   As tabelas devem estar visíveis no Dashboard agora.");

  } catch (err) {
    console.error("❌ Erro ao aplicar schema:", err);
  } finally {
    await client.end();
  }
}

deploy();
