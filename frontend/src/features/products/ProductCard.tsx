import { Link } from "react-router-dom";
import type { ProductListItem } from "./products.types";
import { formatBRL } from "@/utils/format";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link to={`/produto/${product.slug}`} className="group block h-full">
      {/* art-card / art-card__img: hover-zoom sutil (1.02) + elevação azul,
          só em ponteiro fino. Em mobile vira "press"; ver efeito 5 no index.css. */}
      <Card className="art-card overflow-hidden h-full border-border/60">
        <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
          {product.image ? (
            <img
              src={product.image.url}
              alt={product.image.alt ?? product.name}
              className="art-card__img h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Sem imagem
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium leading-tight line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-2 text-lg font-semibold text-brand-red">
            {product.priceOnRequest
              ? "Sob consulta"
              : formatBRL(product.basePrice)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
