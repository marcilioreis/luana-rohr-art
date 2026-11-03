import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetProductsQuery, useGetCollectionsQuery } from "./productsApi";
import ProductCard from "./ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const colecao = params.get("colecao");
  const [search, setSearch] = useState("");

  const { data: collections = [] } = useGetCollectionsQuery();
  const collection = collections.find((c) => c.slug === colecao) ?? null;

  // Filtro de coleção é feito no servidor (?collection=slug).
  const { data: products = [], isLoading } = useGetProductsQuery({
    search: search || undefined,
    collection: colecao || undefined,
  });

  const setColecao = (slug: string | null) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("colecao", slug);
    else next.delete("colecao");
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">
            {collection ? collection.title : "Loja"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {collection
              ? (collection.subtitle ?? "")
              : "Camisetas com arte exclusiva de Luana Rohr"}
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

      {/* Chips de coleção (dados reais) */}
      {collections.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Chip active={!colecao} onClick={() => setColecao(null)}>
            Todas
          </Chip>
          {collections.map((c) => (
            <Chip
              key={c.slug}
              active={colecao === c.slug}
              accent={c.accent}
              onClick={() => setColecao(c.slug)}
            >
              {c.title}
            </Chip>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
          data-testid="product-grid"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">
            {collection
              ? "Ainda não há peças nesta coleção."
              : "Nenhuma camiseta encontrada."}
          </p>
          {collection && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setColecao(null)}
            >
              Ver todas as camisetas
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  accent = "blue",
  onClick,
  children,
}: {
  active: boolean;
  accent?: "blue" | "red";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? accent === "red"
            ? "border-brand-red bg-brand-red text-white"
            : "border-primary bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}
