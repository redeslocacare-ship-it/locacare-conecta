# Fluxos de uso — LocaCare

## 1) Fluxo do cliente (site público)

1. Acessa a Home.
2. Vê benefícios, planos (se cadastrados) e conteúdo.
3. Preenche o formulário **Contato / Pré-reserva**.
4. O sistema registra no banco:
   - Cliente
   - Locação em status **lead**
5. A LocaCare entra em contato pelo WhatsApp/telefone/e-mail.

## 2) Fluxo do atendente (dashboard)

1. Acessa `/auth` e faz login.
2. Entra no `/admin`.
3. Verifica indicadores na **Visão geral**.
4. Em **Locações**, filtra por status (ex.: `lead`) e inicia atendimento.
5. Atualiza o status conforme o workflow:
   - `lead` → `orcamento_enviado` → `aguardando_pagamento` → `confirmada` → `em_entrega` → `em_uso` → `em_coleta` → `finalizada`
   - ou `cancelada` quando aplicável
6. Em **Conteúdos do site**, atualiza depoimentos/FAQ e o texto de “Como funciona”.

---

## Observação sobre papéis

O acesso completo às tabelas é controlado por **papéis (roles)**, atribuídos no banco.

Papéis suportados:
- `admin`
- `atendimento`
- `logistica`

As políticas de segurança (RLS) validam isso no backend.
