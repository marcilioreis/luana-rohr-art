# Padrões e Antipadrões de Performance

## Banco de dados
- **N+1 queries**: evite buscar relacionamentos dentro de loops (imagens por produto,
  itens por pedido). Use `leftJoin`/`inArray` ou a view `orders_enriched`.
- **Índices**: colunas usadas em `WHERE`, `ORDER BY` e `JOIN` devem ter índices
  (ex.: `order_id` em `order_items`, `product_id` em `product_variants`,
  `status`/`customer_id` em `orders`).
- **Views**: a view `orders_enriched` já agrega itens/contagens — prefira-a a montar o
  agregado em código para o painel.
- **Paginação**: use `limit`/`offset` (ou cursor) nas listagens de produtos/pedidos.

## Cache (Redis)
- Use `cacheGet` / `cacheSet` para dados frequentemente acessados (ex.: permissões do
  usuário — TTL 60s).
- Nunca armazene objetos grandes (evite JSON com centenas de KB).
- Invalide cache explicitamente após mutações (ex.: após atualizar permissões de um usuário).

## Filas (BullMQ — fila order-exports)
- **Jobs lentos** (export de pedidos) rodam em worker separado.
- Configure `maxRetriesPerRequest: null` e `enableReadyCheck: false` para evitar timeouts
  com Upstash.
- Reutilize a conexão Redis compartilhada; trate falha atualizando o status para `falha`.

## Frontend
- **Lazy loading**: todas as rotas devem usar `lazyPage()`.
- **Carrinho**: estado client-side em `cartSlice` (localStorage) — evite round-trips ao
  servidor para operações de carrinho.
- **Evite renderizações desnecessárias**: use `React.memo` apenas em componentes pesados
  (ex.: gráficos Recharts do relatório de vendas).
- **Consultas RTK Query**: utilize `providesTags` e `invalidatesTags` para evitar
  over-fetching (tags `Product`/`AdminProduct`/`Order`/`AdminOrder`).
- **Exportações**: polling com `setInterval` (máx 2s) e limite de tentativas (ex.: 3 falhas).

## Infraestrutura
- **Conexões HTTP**: use keep-alive e limite de concorrência.
- **Uploads**: prefira uploads diretos para R2 usando URLs pré-assinadas quando o volume
  crescer, evitando passar grandes payloads pelo backend.
