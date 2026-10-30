import { useState } from "react";
import { useGetProductsQuery } from "./productsApi";
import ProductCard from "./ProductCard";
import { Input } from "@/components/ui/input";
import Skeleton from "@/components/common/Skeleton";
import { Search } from "lucide-react";

export default function ProductList() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useGetProductsQuery(
    search ? { search } : undefined,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loja</h1>
          <p className="text-muted-foreground">
            Camisetas com arte exclusiva de Luana Rohr
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar camisetas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="product-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
          data-testid="product-grid"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-muted-foreground">
          Nenhuma camiseta encontrada.
        </p>
      )}
    </div>
  );
}
