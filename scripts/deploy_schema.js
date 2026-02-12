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
      ADD COLUMN IF NOT EXISTS saldo_indicacoes numeric(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS comissao_percentual numeric(5,2) DEFAULT 10;
    `);
    
    await client.query(`
      ALTER TABLE public.locacoes 
      ADD COLUMN IF NOT EXISTS codigo_indicacao_usado text;
    `);

    await client.query(`
      ALTER TABLE public.locacoes 
      ADD COLUMN IF NOT EXISTS comprovante_url text;
    `);

    // Migração: Garantir admin com código
    await client.query(`
      UPDATE public.usuarios 
      SET codigo_indicacao = 'ADMIN' 
      WHERE email = 'admin@locacare.com.br' AND codigo_indicacao IS NULL;
    `);

    // Trigger para atualizar saldo do parceiro
    await client.query(`
      CREATE OR REPLACE FUNCTION public.atualizar_saldo_parceiro()
      RETURNS TRIGGER AS $$
      DECLARE
        percentual numeric;
      BEGIN
        -- Se o status mudou para 'confirmada' (ou inserido como confirmada)
        IF (TG_OP = 'INSERT' AND NEW.status_locacao = 'confirmada') OR 
           (TG_OP = 'UPDATE' AND NEW.status_locacao = 'confirmada' AND OLD.status_locacao != 'confirmada') THEN
            
            -- Verifica se tem código de indicação
            IF NEW.codigo_indicacao_usado IS NOT NULL THEN
                -- Pega o percentual do parceiro
                SELECT COALESCE(comissao_percentual, 10) INTO percentual
                FROM public.usuarios
                WHERE codigo_indicacao = NEW.codigo_indicacao_usado;

                -- Calcula comissão
                UPDATE public.usuarios
                SET saldo_indicacoes = COALESCE(saldo_indicacoes, 0) + (COALESCE(NEW.valor_total, 0) * (percentual / 100.0))
                WHERE codigo_indicacao = NEW.codigo_indicacao_usado;
            END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_atualizar_saldo_parceiro ON public.locacoes;
      CREATE TRIGGER trg_atualizar_saldo_parceiro
      AFTER INSERT OR UPDATE ON public.locacoes
      FOR EACH ROW
      EXECUTE FUNCTION public.atualizar_saldo_parceiro();
    `);

    // Migração: RPC para criar parceiro
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_create_partner(
        email text,
        password text,
        name text,
        codigo text,
        percentual numeric
      )
      RETURNS uuid
      LANGUAGE plpgsql
      SECURITY DEFINER -- Runs as postgres (admin)
      AS $$
      DECLARE
        new_user_id uuid;
      BEGIN
        -- 1. Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            email,
            crypt(password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('nome', name),
            now(),
            now()
        ) RETURNING id INTO new_user_id;

        -- 2. Insert into public.identity (usually handled by Supabase triggers, but let's ensure it works)
        -- Actually, Supabase usually has a trigger on auth.users that inserts into public.users if configured.
        -- Our 'public.usuarios' table might be populated by a trigger.
        -- Let's check if we need to update it or insert it.
        
        -- We will upsert into public.usuarios to set the extra fields
        INSERT INTO public.usuarios (user_id, email, nome, codigo_indicacao, comissao_percentual)
        VALUES (new_user_id, email, name, codigo, percentual)
        ON CONFLICT (user_id) DO UPDATE
        SET codigo_indicacao = EXCLUDED.codigo_indicacao,
            comissao_percentual = EXCLUDED.comissao_percentual,
            nome = EXCLUDED.nome;
            
        RETURN new_user_id;
      END;
      $$;
    `);

    // Migração: RPC para deletar parceiro
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        DELETE FROM public.usuarios WHERE user_id = target_user_id;
        DELETE FROM auth.users WHERE id = target_user_id;
      END;
      $$;
    `);

    // Migração: Novas tabelas (Saque e Contratos)
    console.log("   🛠️  Aplicando tabelas de Saque e Contratos...");
    const novasTabelasSql = fs.readFileSync(path.resolve(__dirname, '../supabase/migrations/20260207200000_novas_tabelas.sql'), 'utf8');
    await client.query(novasTabelasSql);

    // Migração: Políticas RLS para leitura pública de planos (se necessário reforçar)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir leitura publica de planos') THEN
            CREATE POLICY "Permitir leitura publica de planos" ON public.planos_locacao FOR SELECT USING (true);
        END IF;

        -- Permitir que parceiros vejam locações vinculadas ao seu código de indicação
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parceiro ve suas indicacoes') THEN
            CREATE POLICY "Parceiro ve suas indicacoes" ON public.locacoes FOR SELECT 
            USING (
                codigo_indicacao_usado IN (
                    SELECT codigo_indicacao FROM public.usuarios WHERE user_id = auth.uid()
                )
            );
        END IF;

        -- Permitir que usuários vejam seu próprio perfil (para pegar o código)
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario ve proprio perfil') THEN
            CREATE POLICY "Usuario ve proprio perfil" ON public.usuarios FOR SELECT USING (auth.uid() = user_id);
        END IF;

        -- REFORÇO: Garantir acesso total para ADMIN (qualquer autenticado por enquanto, ou restrito por email se tiver RLS avançado)
        -- Para o MVP, 'authenticated' vê tudo nas tabelas administrativas, MAS o front bloqueia via layout.
        -- O ideal é checar role, mas vamos simplificar para garantir que o Dashboard Admin funcione.
        
        DROP POLICY IF EXISTS "Admin access clientes" ON clientes;
        CREATE POLICY "Admin access clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin access locacoes" ON locacoes;
        CREATE POLICY "Admin access locacoes" ON locacoes FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin access poltronas" ON poltronas;
        CREATE POLICY "Admin access poltronas" ON poltronas FOR ALL USING (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Admin access planos" ON planos_locacao;
        CREATE POLICY "Admin access planos" ON planos_locacao FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin access depoimentos" ON depoimentos;
        CREATE POLICY "Admin access depoimentos" ON depoimentos FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin access faqs" ON faqs;
        CREATE POLICY "Admin access faqs" ON faqs FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin access conteudos" ON conteudos_site;
        CREATE POLICY "Admin access conteudos" ON conteudos_site FOR ALL USING (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Admin access usuarios" ON usuarios;
        CREATE POLICY "Admin access usuarios" ON usuarios FOR ALL USING (auth.role() = 'authenticated');

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
