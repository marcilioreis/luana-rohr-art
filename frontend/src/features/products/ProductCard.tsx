import { Link } from "react-router-dom";
import type { ProductListItem } from "./products.types";
import { formatBRL } from "@/utils/format";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link to={`/produto/${product.slug}`} className="group block">
      <Card className="overflow-hidden h-full border-border/60 transition-shadow hover:shadow-md">
        <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
          {product.image ? (
            <img
              src={product.image.url}
              alt={product.image.alt ?? product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            {formatBRL(product.basePrice)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
