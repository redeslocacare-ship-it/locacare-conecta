# Especificação de Design (desktop-first)

## Global Styles (tokens)
- Background: #0B1220 (base) e superfícies #111B2E
- Texto: #E6EAF2 (primário), #A7B0C0 (secundário)
- Acento/Marca: usar cor principal da logomarca como `--brand` (ex: #2D6BFF) e derivados para hover/focus
- Tipografia: font-sans (ex: Inter/Roboto)
  - H1 28–32px / 700
  - H2 20–24px / 600
  - Body 14–16px / 400
  - Mono (logs) 12–13px
- Botões: radius 10px; foco visível (outline 2px `--brand`); hover com leve elevação (shadow)
- Espaçamento: grid 8px; containers com max-width 1200px

## Página: Login
### Layout
- Coluna única central (Flexbox), card de 420–480px.

### Meta Information
- Title: "Login | LocaCare Conecta"
- Description: "Acesse o LocaCare Conecta com sua conta."

### Estrutura
1. Header compacto
   - Logomarca (símbolo + wordmark) 36–44px de altura, com área de respiro.
2. Card de autenticação
   - Título (H1) "Entrar"
   - Campos: email, senha
   - CTA primário: "Entrar"
   - Link secundário: "Esqueci minha senha"
   - Área de erro: mensagem curta + detalhe colapsável

### Interações/Estados
- Loading no CTA; bloqueio de múltiplos submits; validação de email.

## Página: Dashboard (/)
### Layout
- Estrutura híbrida: header fixo + conteúdo em grid (CSS Grid 12 colunas).

### Meta Information
- Title: "Dashboard | LocaCare Conecta"
- Description: "Visão geral e atalhos principais."

### Estrutura
1. Header (altura 64–72px)
   - Logomarca em destaque à esquerda (prioridade visual):
     - Wordmark com peso 700 e tracking ajustado
     - Subtítulo opcional (caption): ambiente atual (dev/stg/prod)
   - Navegação: Dashboard, Sincronização
   - Área do usuário: nome + menu (Sair)
2. Hero/Resumo (topo do conteúdo)
   - H1 curto + texto auxiliar
   - Cards de status (3–4): estado geral, última sincronização (se disponível), alertas
3. Área de conteúdo
   - Blocos em cards: instruções rápidas, links úteis, avisos de integração

### Responsividade (secundária)
- Em <= 768px: header quebra para 2 linhas; cards viram lista.

## Página: Sincronização & Configurações (/sync)
### Layout
- Duas colunas (Grid): esquerda (ações/config), direita (logs/relatório). Em telas menores vira stack.

### Meta Information
- Title: "Sincronização | LocaCare Conecta"
- Description: "Executar sincronização e ajustar ambiente Supabase."

### Estrutura
1. Seção: Ambiente Supabase
   - Seletor de ambiente (dev/stg/prod)
   - Checklist de validação (ex: conectado, ferramentas instaladas)
   - Mensagens de correção com comandos sugeridos (sem exibir tokens/keys)
2. Seção: Executar sincronização
   - Botão primário "Iniciar sincronização"
   - Estado: em execução / sucesso / falha
   - Proteção anti-dupla execução: indicador de lock ativo + ação "Limpar lock" (Admin)
3. Seção: Resiliência a travamentos
   - Configs: timeout por etapa, nº de retries, backoff
   - Heartbeat/monitor: status "ativo" vs "possível travamento" + instrução
4. Painel: Logs e relatório
   - Log em fonte mono, com filtros (Erros / Tudo)
   - Botão "Copiar relatório" e timestamp

### Interações/Estados
- Cada etapa mostra progresso (stepper): health check → gerar types → git add/commit → git push → final.
- Erros sempre com ação recomendada (ex: executar login do Supabase) e retry explícito.
