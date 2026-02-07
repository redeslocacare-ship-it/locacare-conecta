-- Ajuste de segurança: evitar policy permissiva (WITH CHECK (true))

-- Substitui a policy pública de inserção em clientes por uma com validações básicas.
-- Obs.: validações completas serão feitas também no frontend.

drop policy if exists "Site cria clientes" on public.clientes;

create policy "Site cria clientes"
on public.clientes
for insert
with check (
  -- Campos mínimos obrigatórios
  nome_completo is not null
  and length(trim(nome_completo)) between 2 and 100
  and telefone_whatsapp is not null
  and length(trim(telefone_whatsapp)) between 8 and 20
  and cidade is not null
  and length(trim(cidade)) between 2 and 80

  -- Campos opcionais com limites
  and (email is null or length(trim(email)) <= 255)
  and (bairro is null or length(trim(bairro)) <= 120)
  and (logradouro is null or length(trim(logradouro)) <= 160)
  and (numero is null or length(trim(numero)) <= 20)
  and (cep is null or length(trim(cep)) <= 20)
);
