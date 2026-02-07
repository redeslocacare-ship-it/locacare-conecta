-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'atendimento', 'logistica');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE origem_lead AS ENUM ('site', 'whatsapp', 'indicacao', 'clinica_parceira', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_locacao AS ENUM ('lead', 'orcamento_enviado', 'aguardando_pagamento', 'confirmada', 'em_entrega', 'em_uso', 'em_coleta', 'finalizada', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status_poltrona AS ENUM ('disponivel', 'em_locacao', 'manutencao', 'inativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabelas

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cpf_cnpj TEXT,
  data_nascimento DATE,
  telefone_whatsapp TEXT NOT NULL,
  email TEXT,
  cidade TEXT NOT NULL,
  bairro TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Poltronas
CREATE TABLE IF NOT EXISTS poltronas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT,
  material TEXT,
  codigo_interno TEXT,
  status status_poltrona DEFAULT 'disponivel',
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Planos
CREATE TABLE IF NOT EXISTS planos_locacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_plano TEXT NOT NULL,
  dias_duracao INTEGER NOT NULL,
  preco_base NUMERIC NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Locações
CREATE TABLE IF NOT EXISTS locacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) NOT NULL,
  poltrona_id UUID REFERENCES poltronas(id),
  plano_locacao_id UUID REFERENCES planos_locacao(id),
  origem_lead origem_lead,
  status_locacao status_locacao DEFAULT 'lead',
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  valor_total NUMERIC,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Depoimentos
CREATE TABLE IF NOT EXISTS depoimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  cidade TEXT,
  texto_depoimento TEXT NOT NULL,
  ordem_exibicao INTEGER DEFAULT 0,
  publicado BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem_exibicao INTEGER DEFAULT 0,
  publicado BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Conteúdos Site
CREATE TABLE IF NOT EXISTS conteudos_site (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  titulo TEXT,
  conteudo JSONB,
  publicado BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Usuarios (Perfil público vinculado ao auth.users)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at (Genérico)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.atualizado_em = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers (Drop before create to avoid errors on rerun)
DROP TRIGGER IF EXISTS update_clientes_modtime ON clientes;
CREATE TRIGGER update_clientes_modtime BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_poltronas_modtime ON poltronas;
CREATE TRIGGER update_poltronas_modtime BEFORE UPDATE ON poltronas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_planos_modtime ON planos_locacao;
CREATE TRIGGER update_planos_modtime BEFORE UPDATE ON planos_locacao FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_locacoes_modtime ON locacoes;
CREATE TRIGGER update_locacoes_modtime BEFORE UPDATE ON locacoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_depoimentos_modtime ON depoimentos;
CREATE TRIGGER update_depoimentos_modtime BEFORE UPDATE ON depoimentos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_modtime ON faqs;
CREATE TRIGGER update_faqs_modtime BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_conteudos_modtime ON conteudos_site;
CREATE TRIGGER update_conteudos_modtime BEFORE UPDATE ON conteudos_site FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_usuarios_modtime ON usuarios;
CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poltronas ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos_site ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Depoimentos, FAQs, Conteudos: Leitura pública se publicado
DROP POLICY IF EXISTS "Leitura pública de depoimentos" ON depoimentos;
CREATE POLICY "Leitura pública de depoimentos" ON depoimentos FOR SELECT USING (publicado = true);

DROP POLICY IF EXISTS "Leitura pública de faqs" ON faqs;
CREATE POLICY "Leitura pública de faqs" ON faqs FOR SELECT USING (publicado = true);

DROP POLICY IF EXISTS "Leitura pública de conteudos" ON conteudos_site;
CREATE POLICY "Leitura pública de conteudos" ON conteudos_site FOR SELECT USING (publicado = true);

-- Poltronas e Planos: Leitura pública geral (ou restrita a ativo)
DROP POLICY IF EXISTS "Leitura pública de poltronas" ON poltronas;
CREATE POLICY "Leitura pública de poltronas" ON poltronas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de planos" ON planos_locacao;
CREATE POLICY "Leitura pública de planos" ON planos_locacao FOR SELECT USING (ativo = true);

-- Admin/Autenticado: Acesso total (Simplificado)
-- Em produção, refine para checar user_roles
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

DROP POLICY IF EXISTS "Admin access user_roles" ON user_roles;
CREATE POLICY "Admin access user_roles" ON user_roles FOR ALL USING (auth.role() = 'authenticated');
