import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useGetProductBySlugQuery } from "./productsApi";
import type { ProductVariant } from "./products.types";
import { useAppDispatch } from "@/app/hooks";
import { addItem } from "../cart/cartSlice";
import { formatBRL } from "@/utils/format";
import { buildWhatsappLink, hasWhatsapp } from "@/utils/whatsapp";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Skeleton from "@/components/common/Skeleton";

// Valores que significam "este eixo não se aplica" (compat. com dados antigos
// cadastrados como "N/A" antes do eixo virar opcional).
const NON_AXIS_VALUES = new Set(["", "n/a", "na", "-", "—", "nao aplicavel"]);
const isRealAxisValue = (v: string | null | undefined): v is string =>
  v != null && !NON_AXIS_VALUES.has(v.trim().toLowerCase());

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const { data: product, isLoading, isError } = useGetProductBySlugQuery(slug!);

  const [activeImage, setActiveImage] = useState(0);
  const [sizeOverride, setSize] = useState<string | null>(null);
  const [colorOverride, setColor] = useState<string | null>(null);

  // Eixos de variação só aparecem se tiverem valor "real". Valores sentinela
  // (vazio, "N/A", "-") são tratados como "eixo ausente" — assim peças únicas
  // (quadros, gravuras, mandalas) não mostram um seletor vazio ao cliente.
  const sizes = useMemo(
    () =>
      Array.from(new Set(product?.variants.map((v) => v.size) ?? [])).filter(
        isRealAxisValue,
      ),
    [product],
  );
  const colors = useMemo(
    () =>
      Array.from(new Set(product?.variants.map((v) => v.color) ?? [])).filter(
        isRealAxisValue,
      ),
    [product],
  );
  const hasSizeAxis = sizes.length > 0;
  const hasColorAxis = colors.length > 0;

  // Seleção automática: usa a escolha do usuário se houver; senão, cai no
  // primeiro valor disponível (vale para uma única variação ou várias —
  // sempre defaulta para o primeiro). Eixo ausente fica em null.
  const color = hasColorAxis ? (colorOverride ?? colors[0]) : null;
  const size = useMemo(() => {
    if (!hasSizeAxis) return null;
    if (sizeOverride) return sizeOverride;
    // primeiro tamanho com estoque para a cor atual; senão, o primeiro tamanho
    const inStock = sizes.find((s) =>
      product?.variants.some(
        (v) =>
          v.size === s && (!hasColorAxis || v.color === color) && v.stock > 0,
      ),
    );
    return inStock ?? sizes[0];
  }, [hasSizeAxis, sizeOverride, hasColorAxis, color, sizes, product]);

  const selectedVariant: ProductVariant | undefined = product?.variants.find(
    (v) =>
      (!hasSizeAxis || v.size === size) && (!hasColorAxis || v.color === color),
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

  // Rótulos dos eixos configuráveis por produto (ex.: "Dimensões" / "Material").
  const sizeLabel = product.customStyle?.sizeLabel?.trim() || "Tamanho";
  const colorLabel = product.customStyle?.colorLabel?.trim() || "Cor";

  const handleAdd = () => {
    if (!selectedVariant) {
      toast.error("Selecione as opções do produto.");
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
        // Usa o eixo derivado (null quando ausente) para não vazar sentinelas
        // como "N/A" de produtos ainda não sanitizados para o carrinho/pedido.
        color: hasColorAxis ? selectedVariant.color : null,
        unitPrice: price,
        image: product.images[0]?.url ?? null,
        quantity: 1,
        maxStock: selectedVariant.stock,
      }),
    );
    toast.success("Adicionado ao carrinho!");
  };

  // Para a cor selecionada, quais tamanhos têm estoque (ignora o eixo cor se ausente)
  const isSizeAvailable = (s: string) =>
    product.variants.some(
      (v) =>
        v.size === s && (!hasColorAxis || v.color === color) && v.stock > 0,
    );

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
            {product.priceOnRequest ? "Sob consulta" : formatBRL(price)}
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

          {/* Cor / Material — só aparece se o produto tiver esse eixo */}
          {!product.priceOnRequest && hasColorAxis && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{colorLabel}</p>
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
          )}

          {/* Tamanho / Dimensões — só aparece se o produto tiver esse eixo */}
          {!product.priceOnRequest && hasSizeAxis && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">{sizeLabel}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const available = isSizeAvailable(s);
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
          )}

          {product.priceOnRequest ? (
            <div className="mt-6">
              {hasWhatsapp ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-[#25D366] text-white hover:bg-[#1da851]"
                  data-testid="whatsapp-cta"
                >
                  <a
                    href={buildWhatsappLink(product.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Consultar valor no WhatsApp
                  </a>
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Entre em contato para consultar o valor desta obra.
                </p>
              )}
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Peça sob consulta · valor e condições combinados diretamente com
                a artista
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* A obra — narrativa da estampa */}
      {product.description && (
        <section className="mx-auto mt-14 max-w-3xl border-t pt-10">
          <h2 className="font-heading text-xl">A obra</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {product.description}
          </p>
        </section>
      )}
    </div>
  );
}
