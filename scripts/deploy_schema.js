import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection string from cre.txt
// Nota: Em produção real, isso deveria vir de variável de ambiente, mas para este script local mantemos a consistência com cre.txt
const connectionString = 'postgresql://postgres.wwltjlnlutnuypmkwbuy:WnVqgwTZEsSJc7Yv@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

async function deploy() {
  console.log("🚀 [DB DEPLOY] Iniciando atualização do banco de dados...");
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000 // 20 segundos
  });

  try {
    await client.connect();
    console.log("   ✅ Conectado ao Supabase.");

    // 1. Aplicar Schema Base (se tabelas críticas não existirem)
    // Vamos verificar se a tabela 'usuarios' existe para decidir se rodamos o schema full
    const checkTable = await client.query("SELECT to_regclass('public.usuarios')");
    
    if (!checkTable.rows[0].to_regclass) {
        console.log("   📦 Tabela 'usuarios' não encontrada. Aplicando schema completo...");
        const schemaPath = path.resolve(__dirname, '../supabase/schema_full.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(sql);
            console.log("   ✅ Schema base aplicado.");
        } else {
            console.warn("   ⚠️ Arquivo schema_full.sql não encontrado. Pulando base.");
        }
    } else {
        console.log("   ℹ️ Schema base já parece estar aplicado.");
    }

    // 2. Aplicar Migrações Incrementais (Idempotentes)
    console.log("   🛠️  Verificando atualizações de estrutura (Referral, etc)...");
    
    // Migração: Código de Indicação
    await client.query(`
      ALTER TABLE public.usuarios 
      ADD COLUMN IF NOT EXISTS codigo_indicacao text UNIQUE,
      ADD COLUMN IF NOT EXISTS saldo_indicacoes numeric(12,2) DEFAULT 0;
    `);
    
    await client.query(`
      ALTER TABLE public.locacoes 
      ADD COLUMN IF NOT EXISTS codigo_indicacao_usado text;
    `);

    // Migração: Garantir admin com código
    await client.query(`
      UPDATE public.usuarios 
      SET codigo_indicacao = 'ADMIN' 
      WHERE email = 'admin@locacare.com.br' AND codigo_indicacao IS NULL;
    `);

    // Migração: Políticas RLS para leitura pública de planos (se necessário reforçar)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir leitura publica de planos') THEN
            CREATE POLICY "Permitir leitura publica de planos" ON public.planos_locacao FOR SELECT USING (true);
        END IF;
      END $$;
    `);

    console.log("   ✅ Todas as migrações aplicadas com sucesso!");

  } catch (err) {
    console.error("   ❌ ERRO NO DEPLOY DO BANCO:", err);
    process.exit(1); // Falha no script
  } finally {
    await client.end();
  }
}

deploy();
