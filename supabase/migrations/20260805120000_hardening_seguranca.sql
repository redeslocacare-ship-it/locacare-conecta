-- ============================================================================
-- Hardening de segurança — LocaCare
--
-- Contexto: a API PostgREST/GoTrue é pública por natureza (a anon key aparece
-- no bundle do navegador). Toda a autorização precisa viver no banco.
--
-- Corrige:
--  1. RPCs SECURITY DEFINER com EXECUTE para `anon` (troca de senha de
--     qualquer usuário, exclusão de usuários e criação de parceiros sem login).
--  2. Policies `ALL ... USING (auth.role() = 'authenticated')` — qualquer conta
--     autenticada lia/escrevia tudo, inclusive `user_roles` (auto-promoção a
--     admin) e o PII completo de `clientes`.
--  3. Leitura pública de `poltronas` (inventário) e de planos inativos.
--  4. Lead público gravando direto em `clientes`/`locacoes` — agora passa por
--     uma função com validação, sem expor as tabelas ao papel `anon`.
--  5. search_path mutável em funções SECURITY DEFINER.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Helper de autorização
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'::app_role
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. RPCs administrativas: revogar do anon e exigir admin por dentro
-- ---------------------------------------------------------------------------
revoke all on function public.admin_update_password(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_delete_user(uuid) from public, anon, authenticated;
revoke all on function public.admin_create_partner(text, text, text, text, numeric) from public, anon, authenticated;
revoke all on function public.has_role(uuid, app_role) from public, anon;

create or replace function public.admin_update_password(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if new_password is null or length(new_password) < 8 then
    raise exception 'A senha deve ter ao menos 8 caracteres' using errcode = '22023';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  alvo uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  -- Aceita tanto o id de auth.users quanto o id da linha em public.usuarios
  select coalesce(
    (select u.id from auth.users u where u.id = target_user_id),
    (select p.user_id from public.usuarios p where p.id = target_user_id)
  ) into alvo;

  if alvo is null then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;

  if alvo = auth.uid() then
    raise exception 'Não é possível excluir a própria conta' using errcode = '42501';
  end if;

  delete from public.user_roles where user_id = alvo;
  delete from public.usuarios   where user_id = alvo;
  delete from auth.users        where id = alvo;
end;
$$;

create or replace function public.admin_create_partner(
  email text, password text, name text, codigo text, percentual numeric
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $$
declare
  new_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if email is null or email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido' using errcode = '22023';
  end if;
  if password is null or length(password) < 8 then
    raise exception 'A senha deve ter ao menos 8 caracteres' using errcode = '22023';
  end if;
  if percentual is null or percentual < 0 or percentual > 100 then
    raise exception 'Percentual de comissão inválido' using errcode = '22023';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
    'authenticated', 'authenticated', lower(trim(email)),
    extensions.crypt(password, extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('nome', name), now(), now(),
    '', '', '', ''
  ) returning id into new_user_id;

  insert into public.usuarios (user_id, email, nome, codigo_indicacao, comissao_percentual)
  values (new_user_id, lower(trim(email)), name, nullif(upper(trim(codigo)), ''), percentual)
  on conflict (user_id) do update
    set codigo_indicacao = excluded.codigo_indicacao,
        comissao_percentual = excluded.comissao_percentual,
        nome = excluded.nome;

  return new_user_id;
end;
$$;

grant execute on function public.admin_update_password(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_create_partner(text, text, text, text, numeric) to authenticated;
grant execute on function public.has_role(uuid, app_role) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Triggers com search_path fixo (evita hijack via schema no search_path)
-- ---------------------------------------------------------------------------
alter function public.atualizar_saldo_parceiro() set search_path to 'public';
alter function public.update_updated_at_column() set search_path to 'public';

-- ---------------------------------------------------------------------------
-- 3. Captação de lead pública — sem expor `clientes`/`locacoes` ao anon
-- ---------------------------------------------------------------------------
create or replace function public.criar_pre_reserva(
  p_nome text,
  p_telefone text,
  p_email text default null,
  p_cidade text default null,
  p_bairro text default null,
  p_observacoes text default null,
  p_data_inicio date default null,
  p_codigo_indicacao text default null,
  p_plano_id uuid default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  novo_cliente uuid;
  plano_valido uuid;
begin
  if p_nome is null or length(trim(p_nome)) < 3 or length(p_nome) > 120 then
    raise exception 'Nome inválido' using errcode = '22023';
  end if;
  if p_telefone is null or length(regexp_replace(p_telefone, '\D', '', 'g')) not between 10 and 13 then
    raise exception 'Telefone inválido' using errcode = '22023';
  end if;
  if p_email is not null and (length(p_email) > 160 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'E-mail inválido' using errcode = '22023';
  end if;

  -- Só aceita plano que exista e esteja ativo
  select id into plano_valido from public.planos_locacao
  where id = p_plano_id and ativo = true;

  insert into public.clientes (nome_completo, telefone_whatsapp, email, cidade, bairro, observacoes)
  values (
    trim(p_nome),
    trim(p_telefone),
    nullif(lower(trim(p_email)), ''),
    nullif(left(trim(coalesce(p_cidade, '')), 80), ''),
    nullif(left(trim(coalesce(p_bairro, '')), 80), ''),
    nullif(left(coalesce(p_observacoes, ''), 1000), '')
  )
  returning id into novo_cliente;

  insert into public.locacoes (
    cliente_id, poltrona_id, plano_locacao_id, origem_lead, status_locacao,
    data_inicio_prevista, codigo_indicacao_usado
  ) values (
    novo_cliente, null, plano_valido, 'site', 'lead',
    p_data_inicio, nullif(left(upper(trim(coalesce(p_codigo_indicacao, ''))), 40), '')
  );
end;
$$;

revoke all on function public.criar_pre_reserva(text, text, text, text, text, text, date, text, uuid) from public;
grant execute on function public.criar_pre_reserva(text, text, text, text, text, text, date, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Policies — derruba tudo que era permissivo e recria no mínimo privilégio
-- ---------------------------------------------------------------------------
drop policy if exists "Admin access clientes"              on public.clientes;
drop policy if exists "Admin access conteudos"             on public.conteudos_site;
drop policy if exists "Admin access depoimentos"           on public.depoimentos;
drop policy if exists "Admin access faqs"                  on public.faqs;
drop policy if exists "Admin access locacoes"              on public.locacoes;
drop policy if exists "Admin access planos"                on public.planos_locacao;
drop policy if exists "Admin access poltronas"             on public.poltronas;
drop policy if exists "Admin access user_roles"            on public.user_roles;
drop policy if exists "Admin access usuarios"              on public.usuarios;
drop policy if exists "Permitir leitura publica de planos" on public.planos_locacao;
drop policy if exists "Leitura pública de poltronas"       on public.poltronas;
drop policy if exists "Parceiro ve suas indicacoes"        on public.locacoes;
drop policy if exists "Usuario ve proprio perfil"          on public.usuarios;
drop policy if exists "Leitura pública de conteudos"       on public.conteudos_site;
drop policy if exists "Leitura pública de depoimentos"     on public.depoimentos;
drop policy if exists "Leitura pública de faqs"            on public.faqs;
drop policy if exists "Leitura pública de planos"          on public.planos_locacao;
drop policy if exists "Admin gerencia contratos"           on public.contratos;

-- clientes: PII. Nenhum acesso direto para anon; leads entram pela RPC.
create policy "clientes: admin gerencia" on public.clientes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- locacoes: admin gerencia; parceiro só enxerga as próprias indicações.
create policy "locacoes: admin gerencia" on public.locacoes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "locacoes: parceiro ve suas indicacoes" on public.locacoes
  for select to authenticated using (
    codigo_indicacao_usado is not null
    and codigo_indicacao_usado in (
      select u.codigo_indicacao from public.usuarios u where u.user_id = auth.uid()
    )
  );

-- contratos
create policy "contratos: admin gerencia" on public.contratos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Conteúdo público: leitura anônima apenas do que está publicado.
create policy "conteudos: leitura publica" on public.conteudos_site
  for select to anon, authenticated using (publicado = true);
create policy "conteudos: admin gerencia" on public.conteudos_site
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "depoimentos: leitura publica" on public.depoimentos
  for select to anon, authenticated using (publicado = true);
create policy "depoimentos: admin gerencia" on public.depoimentos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "faqs: leitura publica" on public.faqs
  for select to anon, authenticated using (publicado = true);
create policy "faqs: admin gerencia" on public.faqs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- planos: só os ativos ficam visíveis publicamente (preço/estratégia interna protegidos)
create policy "planos: leitura publica dos ativos" on public.planos_locacao
  for select to anon, authenticated using (ativo = true);
create policy "planos: admin gerencia" on public.planos_locacao
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- poltronas: inventário é dado interno.
create policy "poltronas: admin gerencia" on public.poltronas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_roles: nunca gravável pelo próprio usuário (impede auto-promoção).
create policy "user_roles: usuario ve o proprio papel" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "user_roles: admin gerencia" on public.user_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- usuarios: parceiro lê o próprio perfil (não altera saldo nem comissão).
create policy "usuarios: ve proprio perfil" on public.usuarios
  for select to authenticated using (user_id = auth.uid());
create policy "usuarios: admin gerencia" on public.usuarios
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- solicitacoes_saque: mantém regras próprias, com WITH CHECK explícito.
drop policy if exists "Admin gerencia saques" on public.solicitacoes_saque;
create policy "saques: admin gerencia" on public.solicitacoes_saque
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Garantia final: nenhum privilégio de tabela sobrando para anon
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select on public.faqs, public.depoimentos, public.conteudos_site, public.planos_locacao to anon;

commit;
