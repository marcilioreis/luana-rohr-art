# Setup de Claude Code — Luana Rohr Art

Configuração de desenvolvimento para usar o Claude Code neste monorepo
(`backend/`, `frontend/`, `tests/`) da loja de camisetas **Luana Rohr Art**.
Tudo aqui é versionável e compartilhável com o time.

## O que vem incluído

```
.claude/
├── settings.json                  # permissões de ferramentas + bloqueio de segredos
├── settings.local.json.example    # preferências pessoais (copie → settings.local.json)
├── agents/                        # subagents
│   ├── code-reviewer.md
│   ├── db-migrator.md
│   └── e2e-runner.md
├── commands/                      # slash commands
│   ├── review.md
│   ├── new-feature.md
│   ├── generate-migration.md
│   ├── run-e2e.md
│   ├── codebase.md
│   └── commit.md
└── skills/                        # skills (auto-carregadas quando relevantes)
    ├── loja-feature-builder/      # + references/ (esqueletos backend/frontend)
    ├── deep-review/               # + references/ (security + performance)
    ├── fix-redis-connection/
    ├── drizzle-migrations/
    └── rbac-endpoint/
```

Mais o `CLAUDE.md` na raiz do repo (memória de projeto carregada automaticamente).

## Instalação

1. Instale o Claude Code (requer Node.js ≥ 18; o projeto usa Node 20):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
   Confirme detalhes/versão atuais na documentação oficial em https://docs.claude.com.
2. Copie o conteúdo deste pacote para a **raiz do repositório** (onde estão `backend/`,
   `frontend/`, `tests/`), preservando a pasta `.claude/` e o `CLAUDE.md`.
3. (Opcional) Crie suas preferências locais:
   ```bash
   cp .claude/settings.local.json.example .claude/settings.local.json
   ```
   `settings.local.json` é pessoal — adicione-o ao `.gitignore`.
4. Garanta que o `.gitignore` cobre segredos (já refletido em `settings.json > deny`):
   `.env`, `.env.*`, `*.pem`, `*-key.json`, `exports/`, `backups/`, `fixtures/pii/`.
5. Abra o Claude Code na raiz:
   ```bash
   claude
   ```
   Rode `/agents` para ver os subagents e `/help` para os comandos.

## Como usar

### Slash commands
- `/codebase` — relatório rápido da stack e arquitetura.
- `/new-feature adicionar cupom de desconto no checkout` — implementa de ponta a ponta.
- `/generate-migration add_coupons` — gera e revisa migration Drizzle.
- `/run-e2e specs/store.spec.ts` — sobe serviços e roda Playwright.
- `/review` — revisa mudanças não commitadas (ou passe um arquivo/commit).
- `/commit backend` — monta mensagem de commit convencional.

### Subagents
Invoque explicitamente ("use o subagent `db-migrator` para mover X") ou deixe o Claude
delegar. O `code-reviewer` tende a rodar proativamente após mudanças de código.

### Skills
Carregam sozinhas quando o contexto bate (ex.: ao mexer em Redis, a `fix-redis-connection`
entra; ao construir feature, a `loja-feature-builder`). Você também pode pedir pelo nome.

## CLAUDE.md
O `CLAUDE.md` na raiz descreve a arquitetura (módulos `products`/`orders`/`admin`, PIX
EMV/CRC16, estoque por variante, view `orders_enriched`, fila `order-exports`, RBAC) e as
convenções de código. É carregado automaticamente como memória de projeto.
