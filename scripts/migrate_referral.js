import pg from 'pg';
const { Client } = pg;

// Connection string from cre.txt
const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:LocaCare%402026@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function migrate() {
  console.log("🚀 Iniciando migração para Código de Indicação...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Alterar tabela usuarios
    console.log("🛠️  Alterando tabela 'usuarios'...");
    await client.query(`
      ALTER TABLE public.usuarios 
      ADD COLUMN IF NOT EXISTS codigo_indicacao text UNIQUE,
      ADD COLUMN IF NOT EXISTS saldo_indicacoes numeric(12,2) DEFAULT 0;
    `);

    // 2. Alterar tabela locacoes (para rastrear quem indicou)
    console.log("🛠️  Alterando tabela 'locacoes'...");
    await client.query(`
      ALTER TABLE public.locacoes 
      ADD COLUMN IF NOT EXISTS codigo_indicacao_usado text;
    `);

    // 3. Atualizar usuário admin com um código padrão
    console.log("👤 Gerando código para admin...");
    await client.query(`
      UPDATE public.usuarios 
      SET codigo_indicacao = 'ADMIN' 
      WHERE email = 'admin@locacare.com.br' AND codigo_indicacao IS NULL;
    `);

    console.log("✅ Migração concluída com sucesso!");

  } catch (err) {
    console.error("❌ Erro na migração:", err);
  } finally {
    await client.end();
  }
}

migrate();
