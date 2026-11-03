import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useGetProductBySlugQuery } from "./productsApi";
import type { ProductVariant } from "./products.types";
import { useAppDispatch } from "@/app/hooks";
import { addItem } from "../cart/cartSlice";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Skeleton from "@/components/common/Skeleton";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { data: product, isLoading, isError } = useGetProductBySlugQuery(slug!);

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  const sizes = useMemo(
    () => Array.from(new Set(product?.variants.map((v) => v.size) ?? [])),
    [product],
  );
  const colors = useMemo(
    () => Array.from(new Set(product?.variants.map((v) => v.color) ?? [])),
    [product],
  );

  const selectedVariant: ProductVariant | undefined = product?.variants.find(
    (v) => v.size === size && v.color === color,
  );

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/loja" className="mt-4 inline-block text-primary underline">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  const price = selectedVariant?.price ?? product.basePrice;
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;

  const handleAdd = () => {
    if (!selectedVariant) {
      toast.error("Selecione tamanho e cor.");
      return;
    }
    if (selectedVariant.stock <= 0) {
      toast.error("Variante sem estoque.");
      return;
    }
    dispatch(
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
        unitPrice: price,
        image: product.images[0]?.url ?? null,
        quantity: 1,
        maxStock: selectedVariant.stock,
      }),
    );
    toast.success("Adicionado ao carrinho!");
  };

  // Para a cor selecionada, quais tamanhos têm estoque
  const isComboAvailable = (s: string, c: string) =>
    product.variants.some((v) => v.size === s && v.color === c && v.stock > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/loja"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Voltar para a loja
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Galeria */}
        <div>
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
            {product.images[activeImage] ? (
              <img
                src={product.images[activeImage].url}
                alt={product.images[activeImage].alt ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-12 overflow-hidden rounded border-2 ${
                    i === activeImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-brand-red">
            {formatBRL(price)}
          </p>
          {product.tags && product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className={
                    /limit/i.test(t)
                      ? "border-brand-red/30 bg-brand-red/10 text-brand-red"
                      : undefined
                  }
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}

          {/* Cor */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Cor</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={color === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setColor(c)}
                  data-testid={`color-${c}`}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* Tamanho */}
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const available = !color || isComboAvailable(s, color);
                return (
                  <Button
                    key={s}
                    type="button"
                    variant={size === s ? "default" : "outline"}
                    size="sm"
                    disabled={!available}
                    onClick={() => setSize(s)}
                    data-testid={`size-${s}`}
                  >
                    {s}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <Button
              size="lg"
              className="w-full"
              onClick={handleAdd}
              disabled={outOfStock}
              data-testid="add-to-cart"
            >
              {outOfStock ? "Sem estoque" : "Adicionar ao carrinho"}
            </Button>
            {selectedVariant && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {selectedVariant.stock} em estoque
              </p>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              PIX à vista · entrega pelos Correios ou retirada combinada
            </p>
          </div>
        </div>
      </div>

      {/* A obra — narrativa da estampa */}
      {product.description && (
        <section className="mx-auto mt-14 max-w-3xl border-t pt-10">
          <h2 className="font-heading text-xl">A obra</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </section>
      )}
    </div>
  );
}
