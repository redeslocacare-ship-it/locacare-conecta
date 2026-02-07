-- Schema base LocaCare (idempotente)

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'atendimento', 'logistica');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_poltrona') THEN
    CREATE TYPE public.status_poltrona AS ENUM ('disponivel', 'em_locacao', 'manutencao', 'inativo');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origem_lead') THEN
    CREATE TYPE public.origem_lead AS ENUM ('site', 'whatsapp', 'indicacao', 'clinica_parceira', 'outro');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_locacao') THEN
    CREATE TYPE public.status_locacao AS ENUM (
      'lead',
      'orcamento_enviado',
      'aguardando_pagamento',
      'confirmada',
      'em_entrega',
      'em_uso',
      'em_coleta',
      'finalizada',
      'cancelada'
    );
  END IF;
END
$$;

-- 2) Funções utilitárias
CREATE OR REPLACE FUNCTION public.atualizar_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 3) Tabelas
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf_cnpj text,
  data_nascimento date,
  telefone_whatsapp text NOT NULL,
  email text,
  cidade text NOT NULL,
  bairro text,
  logradouro text,
  numero text,
  complemento text,
  cep text,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poltronas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text,
  material text,
  codigo_interno text,
  status public.status_poltrona NOT NULL DEFAULT 'disponivel',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planos_locacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_plano text NOT NULL,
  dias_duracao int NOT NULL,
  preco_base numeric NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.locacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  poltrona_id uuid REFERENCES public.poltronas(id) ON DELETE SET NULL,
  plano_locacao_id uuid REFERENCES public.planos_locacao(id) ON DELETE SET NULL,
  origem_lead public.origem_lead NOT NULL DEFAULT 'site',
  status_locacao public.status_locacao NOT NULL DEFAULT 'lead',
  data_inicio_prevista date,
  data_fim_prevista date,
  data_inicio_real date,
  data_fim_real date,
  valor_total numeric,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.depoimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL,
  cidade text,
  texto_depoimento text NOT NULL,
  ordem_exibicao int NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta text NOT NULL,
  resposta text NOT NULL,
  ordem_exibicao int NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conteudos_site (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL,
  titulo text,
  conteudo jsonb NOT NULL DEFAULT '{}'::jsonb,
  publicado boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conteudos_site_chave_key'
  ) THEN
    ALTER TABLE public.conteudos_site
      ADD CONSTRAINT conteudos_site_chave_key UNIQUE (chave);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome text,
  email text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 4) RLS + Políticas (idempotente)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poltronas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_locacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos_site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clientes' AND policyname='Equipe gerencia clientes') THEN
    CREATE POLICY "Equipe gerencia clientes"
    ON public.clientes
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'atendimento'::public.app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clientes' AND policyname='Site cria clientes') THEN
    CREATE POLICY "Site cria clientes"
    ON public.clientes
    FOR INSERT
    WITH CHECK (
      (nome_completo IS NOT NULL)
      AND (length(trim(nome_completo)) >= 2)
      AND (length(trim(nome_completo)) <= 100)
      AND (telefone_whatsapp IS NOT NULL)
      AND (length(trim(telefone_whatsapp)) >= 8)
      AND (length(trim(telefone_whatsapp)) <= 20)
      AND (cidade IS NOT NULL)
      AND (length(trim(cidade)) >= 2)
      AND (length(trim(cidade)) <= 80)
      AND ((email IS NULL) OR (length(trim(email)) <= 255))
      AND ((bairro IS NULL) OR (length(trim(bairro)) <= 120))
      AND ((logradouro IS NULL) OR (length(trim(logradouro)) <= 160))
      AND ((numero IS NULL) OR (length(trim(numero)) <= 20))
      AND ((cep IS NULL) OR (length(trim(cep)) <= 20))
    );
  END IF;

  -- locacoes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='locacoes' AND policyname='Equipe gerencia locacoes') THEN
    CREATE POLICY "Equipe gerencia locacoes"
    ON public.locacoes
    FOR ALL
    USING (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'atendimento'::public.app_role)
      OR public.has_role(auth.uid(), 'logistica'::public.app_role)
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='locacoes' AND policyname='Site cria locacoes lead') THEN
    CREATE POLICY "Site cria locacoes lead"
    ON public.locacoes
    FOR INSERT
    WITH CHECK (
      status_locacao = 'lead'::public.status_locacao
      AND origem_lead = 'site'::public.origem_lead
    );
  END IF;

  -- poltronas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poltronas' AND policyname='Admin ou logistica gerencia poltronas') THEN
    CREATE POLICY "Admin ou logistica gerencia poltronas"
    ON public.poltronas
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'logistica'::public.app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poltronas' AND policyname='Equipe lê poltronas') THEN
    CREATE POLICY "Equipe lê poltronas"
    ON public.poltronas
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'atendimento'::public.app_role)
      OR public.has_role(auth.uid(), 'logistica'::public.app_role)
    );
  END IF;

  -- planos_locacao
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='planos_locacao' AND policyname='Equipe gerencia planos') THEN
    CREATE POLICY "Equipe gerencia planos"
    ON public.planos_locacao
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'atendimento'::public.app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='planos_locacao' AND policyname='Leitura pública de planos ativos') THEN
    CREATE POLICY "Leitura pública de planos ativos"
    ON public.planos_locacao
    FOR SELECT
    USING (ativo = true);
  END IF;

  -- conteudos_site / depoimentos / faqs (leitura pública de publicados)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conteudos_site' AND policyname='Leitura pública de conteudos_site publicados') THEN
    CREATE POLICY "Leitura pública de conteudos_site publicados"
    ON public.conteudos_site
    FOR SELECT
    USING (publicado = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='depoimentos' AND policyname='Leitura pública de depoimentos publicados') THEN
    CREATE POLICY "Leitura pública de depoimentos publicados"
    ON public.depoimentos
    FOR SELECT
    USING (publicado = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='faqs' AND policyname='Leitura pública de faqs publicados') THEN
    CREATE POLICY "Leitura pública de faqs publicados"
    ON public.faqs
    FOR SELECT
    USING (publicado = true);
  END IF;

  -- usuarios
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='usuarios' AND policyname='Admin altera usuarios') THEN
    CREATE POLICY "Admin altera usuarios"
    ON public.usuarios
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='usuarios' AND policyname='Admin seleciona usuarios') THEN
    CREATE POLICY "Admin seleciona usuarios"
    ON public.usuarios
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='usuarios' AND policyname='Usuario seleciona seu usuario') THEN
    CREATE POLICY "Usuario seleciona seu usuario"
    ON public.usuarios
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- user_roles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins gerenciam roles') THEN
    CREATE POLICY "Admins gerenciam roles"
    ON public.user_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END
$$;

-- 5) Triggers de atualizado_em (cria apenas se existir a tabela e não existir o trigger)
DO $$
DECLARE
  t text;
  trig text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clientes',
    'poltronas',
    'planos_locacao',
    'locacoes',
    'depoimentos',
    'faqs',
    'conteudos_site',
    'usuarios'
  ]
  LOOP
    trig := 'trg_' || t || '_atualizado_em';

    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = t
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = trig
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em()'
        , trig, t
      );
    END IF;
  END LOOP;
END
$$;
