# Esqueleto Backend — 4 camadas

Exemplo: adicionar `PATCH /api/products/:id/archive` (desativar produto).
Adapte nomes ao seu caso. Imports relativos terminam em `.js`.

## 1. Zod — `shared/validation/schemas.ts`
```ts
import { z } from 'zod';

export const archiveProductParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type ArchiveProductParams = z.infer<typeof archiveProductParamsSchema>;
```

## 2. Service — `modules/products/products.service.ts` (única camada com `db`)
```ts
import { db } from '../../shared/db/index.js';
import { products } from '../../shared/db/schema/index.js';
import { eq } from 'drizzle-orm';

export async function archiveProduct(id: number): Promise<void> {
  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) {
    throw new Error('Produto não encontrado');
  }
  await db.update(products).set({ active: false }).where(eq(products.id, id));
}
```

## 3. Controller — `modules/products/products.controller.ts` (sem `db`)
```ts
import { Request, Response, NextFunction } from 'express';
import * as service from './products.service.js';

export async function archiveProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await service.archiveProduct(id);
    return res.status(200).json({ message: 'Produto desativado' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Produto não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}
```

## 4. Route — `modules/products/products.routes.ts`
```ts
import { authenticate } from '../../shared/auth/middleware.js';
import { loadPermissions } from '../../shared/middleware/loadPermissions.js';
import { authorize } from '../../shared/middleware/rbac.js';
import { validateParams } from '../../shared/middleware/validate.js';
import { archiveProductParamsSchema } from '../../shared/validation/schemas.js';
import * as controller from './products.controller.js';

const manage = [authenticate, loadPermissions, authorize('product:manage')];

/**
 * @openapi
 * /api/products/{id}/archive:
 *   patch:
 *     summary: Desativar um produto
 *     tags: [Produtos]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produto desativado }
 *       403: { description: Sem permissão }
 *       404: { description: Produto não encontrado }
 */
router.patch(
  '/:id/archive',
  ...manage,
  validateParams(archiveProductParamsSchema),
  controller.archiveProduct
);
```

Notas:
- As rotas **públicas** de produto (GET de PLP/PDP) não levam guarda; as rotas de
  **gestão** aplicam `authenticate + loadPermissions + authorize('product:manage')`
  por rota (array `manage`). Declare as rotas de gestão **antes** de `GET /:slug` para
  evitar colisão de path.
- No módulo `orders`, `authenticate + loadPermissions` são aplicados no router inteiro
  (`router.use(...)`); o cliente acessa os próprios pedidos e as rotas admin usam
  `authorize('order:manage')`.
- Erros de domínio: lance `Error` com mensagem PT no service; traduza para status HTTP
  no controller (`Estoque insuficiente` → 409, `Transição inválida` → 400). Para erros
  inesperados, chame `next(error)` (handler central).
