# Modelo de dados — LocaCare

> Nomenclatura: pt-BR, `snake_case`.

## Tabelas

### 1) `clientes`
- `id` (uuid, PK)
- `nome_completo` (text, obrigatório)
- `cpf_cnpj` (text, opcional)
- `data_nascimento` (date, opcional)
- `telefone_whatsapp` (text, obrigatório)
- `email` (text, opcional)
- `cidade` (text, obrigatório)
- `bairro` (text, opcional)
- `logradouro` (text, opcional)
- `numero` (text, opcional)
- `complemento` (text, opcional)
- `cep` (text, opcional)
- `observacoes` (text, opcional)
- `criado_em` / `atualizado_em` (timestamptz)

### 2) `poltronas`
- `id` (uuid, PK)
- `nome` (text)
- `descricao` (text)
- `cor` (text)
- `material` (text)
- `codigo_interno` (text)
- `status` (enum `status_poltrona`: `disponivel`, `em_locacao`, `manutencao`, `inativo`)
- `criado_em` / `atualizado_em`

### 3) `planos_locacao`
- `id` (uuid, PK)
- `nome_plano` (text)
- `dias_duracao` (int)
- `preco_base` (numeric)
- `ativo` (boolean)
- `criado_em` / `atualizado_em`

### 4) `locacoes`
- `id` (uuid, PK)
- `cliente_id` (uuid, FK → `clientes.id`)
- `poltrona_id` (uuid, FK → `poltronas.id`, opcional)
- `plano_locacao_id` (uuid, FK → `planos_locacao.id`, opcional)
- `origem_lead` (enum `origem_lead`: `site`, `whatsapp`, `indicacao`, `clinica_parceira`, `outro`)
- `status_locacao` (enum `status_locacao`)
- `data_inicio_prevista` / `data_fim_prevista` (date)
- `data_inicio_real` / `data_fim_real` (date)
- `valor_total` (numeric)
- `observacoes` (text)
- `criado_em` / `atualizado_em`

### 5) `depoimentos`
- `id` (uuid, PK)
- `nome_cliente` (text)
- `cidade` (text)
- `texto_depoimento` (text)
- `ordem_exibicao` (int)
- `publicado` (boolean)
- `criado_em` / `atualizado_em`

### 6) `faqs`
- `id` (uuid, PK)
- `pergunta` (text)
- `resposta` (text)
- `ordem_exibicao` (int)
- `publicado` (boolean)
- `criado_em` / `atualizado_em`

### 7) `conteudos_site`
- `id` (uuid, PK)
- `chave` (text, único) — exemplo: `como_funciona`
- `titulo` (text)
- `conteudo` (jsonb) — estrutura flexível (ex.: passos)
- `publicado` (boolean)
- `criado_em` / `atualizado_em`

### 8) `usuarios`
- `id` (uuid, PK)
- `user_id` (uuid, único, ref. autenticação)
- `nome` (text)
- `email` (text)
- `criado_em` / `atualizado_em`

### 9) `user_roles`
- `id` (uuid, PK)
- `user_id` (uuid, ref. autenticação)
- `role` (enum `app_role`: `admin`, `atendimento`, `logistica`)
- `criado_em`

## Relacionamentos

- `locacoes.cliente_id` → `clientes.id`
- `locacoes.poltrona_id` → `poltronas.id`
- `locacoes.plano_locacao_id` → `planos_locacao.id`

---

## Conteúdos editáveis

- Depoimentos e FAQ são tabelas próprias.
- “Como funciona” fica em `conteudos_site` com `chave = 'como_funciona'`.
