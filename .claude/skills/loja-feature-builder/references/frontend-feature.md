# Esqueleto Frontend — feature slice (RTK Query + lazyPage)

Exemplo: feature que consome `PATCH /api/products/:id/archive`.

## 1. Tipos — `features/products/products.types.ts`
```ts
export interface ArchiveProductResponse {
  message: string;
}
```

## 2. API slice — `features/products/productsApi.ts`
Injeta no `api` base (de `lib/api.ts`), que já trata Bearer + refresh.
```ts
import { api } from '../../lib/api';
import type { ArchiveProductResponse } from './products.types';

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    archiveProduct: builder.mutation<ArchiveProductResponse, number>({
      query: (id) => ({
        url: `/products/${id}/archive`,
        method: 'PATCH',
      }),
      // invalida a lista admin e a vitrine pública
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminProduct', id },
        'AdminProduct',
        'Product',
      ],
    }),
  }),
});

export const { useArchiveProductMutation } = productsApi;
```
Use as tags já registradas no `api` base: `Product`, `AdminProduct`, `Order`,
`AdminOrder`, `Cart`, `AdminUser`, `AdminRole`. Nomes de endpoint não podem colidir
entre slices diferentes injetados no mesmo `api`.

## 3. Componente — props tipadas, shadcn, sem `any`
```tsx
import { Button } from '@/components/ui/button';
import { useArchiveProductMutation } from './productsApi';
import { toast } from 'sonner';

interface ArchiveButtonProps {
  productId: number;
}

export function ArchiveButton({ productId }: ArchiveButtonProps) {
  const [archive, { isLoading }] = useArchiveProductMutation();

  const handleClick = async () => {
    try {
      await archive(productId).unwrap();
      toast.success('Produto desativado');
    } catch {
      toast.error('Falha ao desativar o produto');
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Desativando...' : 'Desativar'}
    </Button>
  );
}
```

## 4. Página com lazyPage — `routes/index.tsx`
```tsx
import { lazyPage } from '../components/common/LazyPage';

const AdminProductList = lazyPage(
  () => import('../features/admin/products/AdminProductList'),
);
// ...registrar dentro de <AdminRoute> (admin) ou <StoreLayout> (loja/conta)
// conforme a permissão/visibilidade.
```

## Padrões a respeitar
- Inicialização de estado por `key` (remontagem), não `useEffect`.
- Moeda sempre via `utils/format.ts` (`formatBRL`); datas via `formatDate`/`formatDateTime`.
- Carrinho é client-side em `cart/cartSlice.ts` (persistido em localStorage).
- PIX: renderize o QR no frontend com `qrcode.react` a partir do `pixPayload` retornado
  pela API (o payload/CRC é calculado no backend).
- Polling de export: `setInterval` ≤ 2s com limite de tentativas (~3 falhas), depois aborta.
- `React.memo` só em componentes comprovadamente pesados.
