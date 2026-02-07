-- ===================================================================
-- LocaCare - Modelo de dados inicial (pt-BR / snake_case)
-- ===================================================================

create extension if not exists pgcrypto;

-- ===================================================================
-- 1) ENUMS
-- ===================================================================

do $$ begin
  create type public.status_poltrona as enum ('disponivel','em_locacao','manutencao','inativo');
exception when duplicate_object then null; end $$;


do $$ begin
  create type public.status_locacao as enum (
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
exception when duplicate_object then null; end $$;


do $$ begin
  create type public.origem_lead as enum ('site','whatsapp','indicacao','clinica_parceira','outro');
exception when duplicate_object then null; end $$;


do $$ begin
  create type public.app_role as enum ('admin','atendimento','logistica');
exception when duplicate_object then null; end $$;

-- ===================================================================
-- 2) FUNÇÕES UTILITÁRIAS
-- ===================================================================

create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- ===================================================================
-- 3) PAPÉIS (SEGURANÇA) - CRIAR ANTES DA FUNÇÃO has_role
-- ===================================================================

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  criado_em timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _role
  );
$$;

-- ===================================================================
-- 4) TABELAS DO NEGÓCIO
-- ===================================================================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  cpf_cnpj text,
  data_nascimento date,
  telefone_whatsapp text not null,
  email text,
  cidade text not null,
  bairro text,
  logradouro text,
  numero text,
  complemento text,
  cep text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_clientes_nome on public.clientes using gin (to_tsvector('portuguese', coalesce(nome_completo,'')));
create index if not exists idx_clientes_telefone on public.clientes (telefone_whatsapp);

create trigger trg_clientes_atualizado_em
before update on public.clientes
for each row
execute function public.atualizar_atualizado_em();

alter table public.clientes enable row level security;

create table if not exists public.poltronas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  cor text,
  material text,
  codigo_interno text,
  status public.status_poltrona not null default 'disponivel',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_poltronas_status on public.poltronas (status);
create index if not exists idx_poltronas_codigo_interno on public.poltronas (codigo_interno);

create trigger trg_poltronas_atualizado_em
before update on public.poltronas
for each row
execute function public.atualizar_atualizado_em();

alter table public.poltronas enable row level security;

create table if not exists public.planos_locacao (
  id uuid primary key default gen_random_uuid(),
  nome_plano text not null,
  dias_duracao integer not null,
  preco_base numeric(12,2) not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_planos_locacao_ativo on public.planos_locacao (ativo);

create trigger trg_planos_locacao_atualizado_em
before update on public.planos_locacao
for each row
execute function public.atualizar_atualizado_em();

alter table public.planos_locacao enable row level security;

create table if not exists public.locacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  poltrona_id uuid references public.poltronas(id) on delete set null,
  plano_locacao_id uuid references public.planos_locacao(id) on delete set null,
  origem_lead public.origem_lead not null default 'site',
  status_locacao public.status_locacao not null default 'lead',
  data_inicio_prevista date,
  data_fim_prevista date,
  data_inicio_real date,
  data_fim_real date,
  valor_total numeric(12,2),
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_locacoes_status on public.locacoes (status_locacao);
create index if not exists idx_locacoes_cliente on public.locacoes (cliente_id);
create index if not exists idx_locacoes_datas on public.locacoes (data_inicio_prevista, data_fim_prevista);

create trigger trg_locacoes_atualizado_em
before update on public.locacoes
for each row
execute function public.atualizar_atualizado_em();

alter table public.locacoes enable row level security;

-- Conteúdos do site
create table if not exists public.depoimentos (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  cidade text,
  texto_depoimento text not null,
  ordem_exibicao integer not null default 0,
  publicado boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_depoimentos_publicado_ordem on public.depoimentos (publicado, ordem_exibicao);

create trigger trg_depoimentos_atualizado_em
before update on public.depoimentos
for each row
execute function public.atualizar_atualizado_em();

alter table public.depoimentos enable row level security;

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null,
  resposta text not null,
  ordem_exibicao integer not null default 0,
  publicado boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_faqs_publicado_ordem on public.faqs (publicado, ordem_exibicao);

create trigger trg_faqs_atualizado_em
before update on public.faqs
for each row
execute function public.atualizar_atualizado_em();

alter table public.faqs enable row level security;

create table if not exists public.conteudos_site (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  titulo text,
  conteudo jsonb not null default '{}'::jsonb,
  publicado boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_conteudos_site_chave on public.conteudos_site (chave);

create trigger trg_conteudos_site_atualizado_em
before update on public.conteudos_site
for each row
execute function public.atualizar_atualizado_em();

alter table public.conteudos_site enable row level security;

-- Metadados de usuários administrativos
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text,
  email text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger trg_usuarios_atualizado_em
before update on public.usuarios
for each row
execute function public.atualizar_atualizado_em();

alter table public.usuarios enable row level security;

-- ===================================================================
-- 5) POLÍTICAS RLS
-- ===================================================================

-- 5.1) Conteúdos públicos: leitura apenas do que estiver publicado

drop policy if exists "Leitura pública de depoimentos publicados" on public.depoimentos;
create policy "Leitura pública de depoimentos publicados"
on public.depoimentos
for select
using (publicado = true);


drop policy if exists "Leitura pública de faqs publicados" on public.faqs;
create policy "Leitura pública de faqs publicados"
on public.faqs
for select
using (publicado = true);


drop policy if exists "Leitura pública de conteudos_site publicados" on public.conteudos_site;
create policy "Leitura pública de conteudos_site publicados"
on public.conteudos_site
for select
using (publicado = true);

-- 5.2) user_roles: somente admin

drop policy if exists "Admins gerenciam roles" on public.user_roles;
create policy "Admins gerenciam roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 5.3) usuarios: admin vê tudo; usuário vê seu próprio registro

drop policy if exists "Admin seleciona usuarios" on public.usuarios;
drop policy if exists "Usuario seleciona seu usuario" on public.usuarios;
drop policy if exists "Admin altera usuarios" on public.usuarios;

create policy "Admin seleciona usuarios"
on public.usuarios
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Usuario seleciona seu usuario"
on public.usuarios
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admin altera usuarios"
on public.usuarios
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 5.4) clientes: admin/atendimento CRUD

drop policy if exists "Equipe gerencia clientes" on public.clientes;
create policy "Equipe gerencia clientes"
on public.clientes
for all
to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
)
with check (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
);

-- 5.5) poltronas: leitura para equipe; alteração para admin/logistica

drop policy if exists "Equipe lê poltronas" on public.poltronas;
drop policy if exists "Admin ou logistica gerencia poltronas" on public.poltronas;

create policy "Equipe lê poltronas"
on public.poltronas
for select
to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
  or public.has_role(auth.uid(),'logistica')
);

create policy "Admin ou logistica gerencia poltronas"
on public.poltronas
for all
to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'logistica')
)
with check (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'logistica')
);

-- 5.6) planos_locacao: leitura pública apenas se ativo=true; CRUD para admin/atendimento

drop policy if exists "Leitura pública de planos ativos" on public.planos_locacao;
create policy "Leitura pública de planos ativos"
on public.planos_locacao
for select
using (ativo = true);


drop policy if exists "Equipe gerencia planos" on public.planos_locacao;
create policy "Equipe gerencia planos"
on public.planos_locacao
for all
to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
)
with check (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
);

-- 5.7) locacoes: CRUD para equipe (admin/atendimento/logistica)

drop policy if exists "Equipe gerencia locacoes" on public.locacoes;
create policy "Equipe gerencia locacoes"
on public.locacoes
for all
to authenticated
using (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
  or public.has_role(auth.uid(),'logistica')
)
with check (
  public.has_role(auth.uid(),'admin')
  or public.has_role(auth.uid(),'atendimento')
  or public.has_role(auth.uid(),'logistica')
);

-- ===================================================================
-- 6) CAPTAÇÃO PÚBLICA (LEADS DO SITE)
-- ===================================================================

-- Site cria clientes (sem SELECT público)
drop policy if exists "Site cria clientes" on public.clientes;
create policy "Site cria clientes"
on public.clientes
for insert
with check (true);

-- Site cria locações em status 'lead' e origem 'site'
drop policy if exists "Site cria locacoes lead" on public.locacoes;
create policy "Site cria locacoes lead"
on public.locacoes
for insert
with check (status_locacao = 'lead' and origem_lead = 'site');
