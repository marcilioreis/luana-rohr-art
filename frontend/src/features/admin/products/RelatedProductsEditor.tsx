import { useState } from "react";
import { toast } from "sonner";
import {
  useGetAdminRelatedQuery,
  useGetAdminProductsQuery,
  useSetAdminRelatedMutation,
} from "../../products/productsApi";
import type { AdminRelatedProduct } from "../../products/products.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface InnerProps {
  productId: number;
  initial: AdminRelatedProduct[];
  options: { id: number; name: string; active: boolean }[];
}

// Lista editável; o estado inicial vem do servidor. O componente é remontado
// via `key` (ver RelatedProductsEditor) quando os dados mudam, evitando useEffect.
function RelatedEditorInner({ productId, initial, options }: InnerProps) {
  const [selected, setSelected] = useState<AdminRelatedProduct[]>(initial);
  const [setRelated, { isLoading: saving }] = useSetAdminRelatedMutation();

  const selectedIds = new Set(selected.map((s) => s.id));
  const available = options.filter(
    (o) => o.id !== productId && !selectedIds.has(o.id),
  );

  const dirty =
    selected.length !== initial.length ||
    selected.some((s, i) => s.id !== initial[i]?.id);

  const add = (id: number) => {
    const opt = options.find((o) => o.id === id);
    if (!opt) return;
    setSelected((cur) => [
      ...cur,
      { id: opt.id, name: opt.name, slug: "", active: opt.active },
    ]);
  };

  const remove = (id: number) =>
    setSelected((cur) => cur.filter((s) => s.id !== id));

  const handleSave = async () => {
    try {
      await setRelated({
        id: productId,
        relatedIds: selected.map((s) => s.id),
      }).unwrap();
      toast.success("Produtos relacionados salvos.");
    } catch {
      toast.error("Erro ao salvar produtos relacionados.");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Escolha obras para sugerir nesta página. A relação é mútua (aparece nas
        duas PDPs) e completada automaticamente quando faltam sugestões.
      </p>

      {selected.length > 0 ? (
        <ul className="space-y-2" data-testid="related-selected">
          {selected.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <span>
                {s.name}
                {!s.active && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (inativo — não aparece na loja)
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => remove(s.id)}
                aria-label={`Remover ${s.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum relacionado fixado — a loja usa o preenchimento automático.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="related-add">Adicionar produto</Label>
        <select
          id="related-add"
          value=""
          data-testid="related-add"
          onChange={(e) => {
            if (e.target.value) add(Number(e.target.value));
          }}
          disabled={available.length === 0}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
        >
          <option value="">
            {available.length === 0
              ? "— Nenhum produto disponível —"
              : "— Selecionar produto —"}
          </option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {!o.active ? " (inativo)" : ""}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty}
        data-testid="related-save"
      >
        {saving ? "Salvando..." : "Salvar relacionados"}
      </Button>
    </div>
  );
}

export default function RelatedProductsEditor({
  productId,
}: {
  productId: number;
}) {
  const { data: related, isLoading } = useGetAdminRelatedQuery(productId);
  const { data: allProducts = [] } = useGetAdminProductsQuery();

  if (isLoading || !related) {
    return (
      <p className="text-sm text-muted-foreground">Carregando relacionados…</p>
    );
  }

  return (
    <RelatedEditorInner
      key={related.map((r) => r.id).join(",")}
      productId={productId}
      initial={related}
      options={allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        active: p.active,
      }))}
    />
  );
}
