---
description: Prepara um commit com mensagem no padrão convencional do projeto
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git log:*), Bash(git commit:*)
argument-hint: "[escopo opcional, ex: backend]"
---

Prepare um commit para as mudanças atuais.

1. Rode `git status` e `git diff HEAD` (e `git diff --staged`) para entender o que mudou.
2. Veja `git log --oneline -10` para casar o estilo do histórico.
3. Agrupe as mudanças logicamente. Se houver mudanças não relacionadas, sugira commits separados.
4. Gere a mensagem no formato convencional da loja:
   `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` — com escopo opcional
   (`feat(backend): ...`). Escopo sugerido: $ARGUMENTS
   Exemplo: `feat(backend): gera PIX copia e cola no checkout`.
5. Mostre a mensagem proposta e peça confirmação antes de executar `git commit`.

Não inclua arquivos sensíveis (`.env`, chaves, exports/backups). O hook de pre-commit
(`.husky/pre-commit` + lint-staged) roda lint/format — se falhar, corrija antes de recomitar.
