-- ============================================
-- MIGRATION: Setup completo LocaCare (sem recriar enums)
-- ============================================

-- 1. ENUMS (apenas os que faltam)
DO $$ BEGIN
  CREATE TYPE public.origem_lead AS ENUM ('site', 'whatsapp', 'indicacao', 'clinica_parceira', 'outro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_locacao AS ENUM ('lead', 'orcamento_enviado', 'aguardando_pagamento', 'confirmada', 'em_entrega', 'em_uso', 'em_coleta', 'finalizada', 'cancelada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_poltrona AS ENUM ('disponivel', 'em_locacao', 'manutencao', 'inativo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABELAS

-- Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  telefone_whatsapp TEXT NOT NULL,
  email TEXT,
  cpf_cnpj TEXT,
  data_nascimento DATE,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT NOT NULL,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Poltronas
CREATE TABLE IF NOT EXISTS public.poltronas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_interno TEXT,
  cor TEXT,
  material TEXT,
  status status_poltrona NOT NULL DEFAULT 'disponivel',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Planos de locação
CREATE TABLE IF NOT EXISTS public.planos_locacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_plano TEXT NOT NULL,
  dias_duracao INTEGER NOT NULL,
  preco_base NUMERIC NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locações
CREATE TABLE IF NOT EXISTS public.locacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  poltrona_id UUID REFERENCES public.poltronas(id),
  plano_locacao_id UUID REFERENCES public.planos_locacao(id),
  status_locacao status_locacao NOT NULL DEFAULT 'lead',
  origem_lead origem_lead NOT NULL DEFAULT 'site',
  data_inicio_prevista DATE,
  data_fim_prevista DATE,
  data_inicio_real DATE,
  data_fim_real DATE,
  valor_total NUMERIC,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conteúdos do site (dinâmicos)
CREATE TABLE IF NOT EXISTS public.conteudos_site (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  titulo TEXT,
  conteudo JSONB NOT NULL DEFAULT '{}'::JSONB,
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem_exibicao INTEGER NOT NULL DEFAULT 0,
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Depoimentos
CREATE TABLE IF NOT EXISTS public.depoimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  cidade TEXT,
  texto_depoimento TEXT NOT NULL,
  ordem_exibicao INTEGER NOT NULL DEFAULT 0,
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários (perfil administrativo)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  nome TEXT,
  email TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles dos usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. FUNÇÃO HELPER (has_role) - Security Definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4. FUNÇÃO E TRIGGER PARA ATUALIZAR atualizado_em
CREATE OR REPLACE FUNCTION public.atualizar_atualizado_em()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_clientes_atualizado_em ON public.clientes;
CREATE TRIGGER trigger_clientes_atualizado_em
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_poltronas_atualizado_em ON public.poltronas;
CREATE TRIGGER trigger_poltronas_atualizado_em
  BEFORE UPDATE ON public.poltronas
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_planos_atualizado_em ON public.planos_locacao;
CREATE TRIGGER trigger_planos_atualizado_em
  BEFORE UPDATE ON public.planos_locacao
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_locacoes_atualizado_em ON public.locacoes;
CREATE TRIGGER trigger_locacoes_atualizado_em
  BEFORE UPDATE ON public.locacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_conteudos_atualizado_em ON public.conteudos_site;
CREATE TRIGGER trigger_conteudos_atualizado_em
  BEFORE UPDATE ON public.conteudos_site
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_faqs_atualizado_em ON public.faqs;
CREATE TRIGGER trigger_faqs_atualizado_em
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_depoimentos_atualizado_em ON public.depoimentos;
CREATE TRIGGER trigger_depoimentos_atualizado_em
  BEFORE UPDATE ON public.depoimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trigger_usuarios_atualizado_em ON public.usuarios;
CREATE TRIGGER trigger_usuarios_atualizado_em
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_atualizado_em();

-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poltronas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos_site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- POLICIES: Clientes
DROP POLICY IF EXISTS "Site cria clientes" ON public.clientes;
CREATE POLICY "Site cria clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (
    nome_completo IS NOT NULL
    AND LENGTH(TRIM(nome_completo)) >= 2
    AND LENGTH(TRIM(nome_completo)) <= 100
    AND telefone_whatsapp IS NOT NULL
    AND LENGTH(TRIM(telefone_whatsapp)) >= 8
    AND LENGTH(TRIM(telefone_whatsapp)) <= 20
    AND cidade IS NOT NULL
    AND LENGTH(TRIM(cidade)) >= 2
    AND LENGTH(TRIM(cidade)) <= 80
    AND (email IS NULL OR LENGTH(TRIM(email)) <= 255)
    AND (bairro IS NULL OR LENGTH(TRIM(bairro)) <= 120)
    AND (logradouro IS NULL OR LENGTH(TRIM(logradouro)) <= 160)
    AND (numero IS NULL OR LENGTH(TRIM(numero)) <= 20)
    AND (cep IS NULL OR LENGTH(TRIM(cep)) <= 20)
  );

DROP POLICY IF EXISTS "Equipe gerencia clientes" ON public.clientes;
CREATE POLICY "Equipe gerencia clientes"
  ON public.clientes FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendimento'));

-- POLICIES: Poltronas
DROP POLICY IF EXISTS "Equipe lê poltronas" ON public.poltronas;
CREATE POLICY "Equipe lê poltronas"
  ON public.poltronas FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendimento') OR has_role(auth.uid(), 'logistica'));

DROP POLICY IF EXISTS "Admin ou logistica gerencia poltronas" ON public.poltronas;
CREATE POLICY "Admin ou logistica gerencia poltronas"
  ON public.poltronas FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'logistica'));

-- POLICIES: Planos
DROP POLICY IF EXISTS "Leitura pública de planos ativos" ON public.planos_locacao;
CREATE POLICY "Leitura pública de planos ativos"
  ON public.planos_locacao FOR SELECT
  USING (ativo = TRUE);

DROP POLICY IF EXISTS "Equipe gerencia planos" ON public.planos_locacao;
CREATE POLICY "Equipe gerencia planos"
  ON public.planos_locacao FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendimento'));

-- POLICIES: Locações
DROP POLICY IF EXISTS "Site cria locacoes lead" ON public.locacoes;
CREATE POLICY "Site cria locacoes lead"
  ON public.locacoes FOR INSERT
  WITH CHECK (status_locacao = 'lead' AND origem_lead = 'site');

DROP POLICY IF EXISTS "Equipe gerencia locacoes" ON public.locacoes;
CREATE POLICY "Equipe gerencia locacoes"
  ON public.locacoes FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendimento') OR has_role(auth.uid(), 'logistica'));

-- POLICIES: Conteúdos
DROP POLICY IF EXISTS "Leitura pública de conteudos_site publicados" ON public.conteudos_site;
CREATE POLICY "Leitura pública de conteudos_site publicados"
  ON public.conteudos_site FOR SELECT
  USING (publicado = TRUE);

-- POLICIES: FAQs
DROP POLICY IF EXISTS "Leitura pública de faqs publicados" ON public.faqs;
CREATE POLICY "Leitura pública de faqs publicados"
  ON public.faqs FOR SELECT
  USING (publicado = TRUE);

-- POLICIES: Depoimentos
DROP POLICY IF EXISTS "Leitura pública de depoimentos publicados" ON public.depoimentos;
CREATE POLICY "Leitura pública de depoimentos publicados"
  ON public.depoimentos FOR SELECT
  USING (publicado = TRUE);

-- POLICIES: Usuários
DROP POLICY IF EXISTS "Usuario seleciona seu usuario" ON public.usuarios;
CREATE POLICY "Usuario seleciona seu usuario"
  ON public.usuarios FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin seleciona usuarios" ON public.usuarios;
CREATE POLICY "Admin seleciona usuarios"
  ON public.usuarios FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin altera usuarios" ON public.usuarios;
CREATE POLICY "Admin altera usuarios"
  ON public.usuarios FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- POLICIES: Roles
DROP POLICY IF EXISTS "Admins gerenciam roles" ON public.user_roles;
CREATE POLICY "Admins gerenciam roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 6. INSERIR FAQs INICIAIS
INSERT INTO public.faqs (pergunta, resposta, ordem_exibicao, publicado)
SELECT * FROM (VALUES
  ('Qual o prazo de entrega em Goiânia?', 'Na maioria dos casos entregamos em até 24h em Goiânia e região metropolitana (sujeito à disponibilidade e endereço). Agendamos com você por WhatsApp.', 1, TRUE),
  ('A poltrona ajuda a levantar sozinha?', 'Sim. A função lift inclina a poltrona para facilitar levantar com mais segurança e menos esforço — ideal no pós-operatório e para mobilidade reduzida.', 2, TRUE),
  ('Como funciona o aluguel e a retirada?', 'Você solicita o orçamento, confirmamos datas e endereço, fazemos a entrega e instalação, damos suporte durante o uso e ao final agendamos a coleta.', 3, TRUE),
  ('Quais formas de pagamento vocês aceitam?', 'Aceitamos as principais formas de pagamento. Confirme opções disponíveis no atendimento (Pix, cartão, etc.).', 4, TRUE),
  ('Precisa de montagem/instalação?', 'A entrega já inclui instalação e orientação rápida de uso. Você recebe instruções para ajustes de reclinação e acionamento do lift.', 5, TRUE)
) AS v(pergunta, resposta, ordem_exibicao, publicado)
WHERE NOT EXISTS (SELECT 1 FROM public.faqs LIMIT 1);
