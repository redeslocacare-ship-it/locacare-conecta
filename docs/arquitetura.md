# Arquitetura — LocaCare

## Visão geral

O sistema é dividido em duas experiências:

1. **Site público** (rota `/`) focado em conversão.
2. **Dashboard administrativo** (rota `/admin`) protegido por autenticação.

O backend é integrado à aplicação, oferecendo:

- Banco de dados PostgreSQL
- Autenticação (e-mail/senha)
- Regras de segurança via RLS

---

## Organização de pastas (principais)

- `src/pages/`
  - `Index.tsx` — Home pública
  - `Auth.tsx` — Login/Cadastro
  - `admin/` — Páginas do painel
- `src/components/locacare/` — Componentes do site público
- `src/components/auth/` — Proteção de rotas
- `src/contexts/` — Contextos (ex.: Auth)
- `src/hooks/` — Hooks de dados (conteúdo público etc.)
- `src/lib/` — Utilitários e validações

---

## Fluxos principais

### 1) Criação de lead (pré-reserva)

- Origem: Home pública (`PreReservaForm`)
- Validação: `src/lib/validacoes.ts`
- Operações:
  1. `INSERT` em `clientes`
  2. `INSERT` em `locacoes` com `status_locacao = 'lead'` e `origem_lead = 'site'`

### 2) Gestão administrativa

- O acesso ao `/admin` exige sessão autenticada.
- Os módulos usam TanStack Query para:
  - Listagem (SELECT)
  - Criação (INSERT)
  - Atualização (UPDATE)

---

## Observação sobre papéis (roles)

Por segurança, papéis **não** ficam em um campo na tabela de usuários.

- Enum: `app_role` (`admin`, `atendimento`, `logistica`)
- Tabela: `user_roles` (associação user_id → role)
- Função: `public.has_role(user_id, role)` (SECURITY DEFINER)

As políticas RLS consultam `has_role(...)` para permitir acesso.
