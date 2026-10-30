# Checklist de Segurança

## Validação e sanitização
- [ ] Todas as entradas do usuário são validadas com Zod (ou equivalente).
- [ ] Dados de saída são escapados para evitar XSS (nomes de produto, observações do pedido).
- [ ] Parâmetros de rota e query são tipados e validados (`validateParams`/`validateQuery`).

## Autenticação e autorização
- [ ] GET público de produto (PLP/PDP) não exige auth; gestão de produto exige `product:manage`.
- [ ] Rotas de pedido rodam `authenticate` + `loadPermissions`; gestão/relatórios exigem
      `order:manage`/`order:view`.
- [ ] Detalhe de pedido checa posse (cliente só vê o próprio) ou `req.isAdmin`.
- [ ] Admin não tem permissões implícitas sensíveis além do atalho `req.isAdmin` (confirme intenção).

## Regras de negócio (integridade)
- [ ] Baixa de estoque é atômica e nunca deixa `stock` negativo (409 se insuficiente).
- [ ] Transições de status passam por `isValidTransition` (nenhuma transição arbitrária).
- [ ] Preços vêm do servidor (`variant.price ?? basePrice`), nunca confiando no valor do cliente.
- [ ] Payload PIX/valor é calculado no backend (CRC16 correto); o cliente só renderiza o QR.

## Injeção de código
- [ ] Consultas ao banco usam Drizzle ORM (parametrizadas) — não concatenam strings SQL.
- [ ] Comandos shell não são executados com dados do usuário.

## Filas e jobs (BullMQ — fila order-exports)
- [ ] Dados sensíveis não são logados no worker.
- [ ] Jobs têm tratamento de falha (atualizam status `falha`).
- [ ] Conexão Redis usa TLS quando em produção (Upstash).

## Uploads e armazenamento (R2/S3 via StorageProvider)
- [ ] Imagens são validadas por tipo e tamanho.
- [ ] URLs pré-assinadas têm expiração curta (máximo 1 hora).
- [ ] Nomes de arquivos são sanitizados (evitar path traversal).

## Logs e auditoria
- [ ] Ações críticas (criação/edição de produto, mudança de status, confirmação de
      pagamento, alteração de permissões) são registradas em `audit_logs`.
- [ ] Logs não contêm senhas, tokens ou dados sensíveis.
