import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MandalaStar } from "@/components/brand/Mandala";
import { SpinningMandala } from "@/components/brand/SpinningMandala";
import { useGetProductsQuery, useGetCollectionsQuery } from "./productsApi";
import ProductCard from "./ProductCard";
import { Reveal } from "@/components/common/Reveal";
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
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
        {/* Efeito 2 — marca d'água azul (5%) girando ultra-lento */}
        <SpinningMandala className="pointer-events-none absolute -right-24 -top-16 h-96 w-96 text-primary/5">
          <MandalaStar strokeWidth={1.5} className="h-full w-full" />
        </SpinningMandala>
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl font-medium tracking-tight">
            {collection ? collection.title : "Loja"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {collection
              ? (collection.subtitle ?? "")
              : "Arte exclusiva de Luana Rohr"}
          </p>
          <div className="mt-4 mx-auto relative sm:w-72 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="product-search"
            />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Chips de coleção (dados reais) */}
        {collections.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2 ">
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
            {products.map((p, i) => (
              // Reveal + stagger de 80ms (limitado a 6 passos p/ não atrasar demais)
              <Reveal key={p.id} delay={Math.min(i, 6) * 80} className="h-full">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              {collection
                ? "Ainda não há peças nesta coleção."
                : "Nenhuma peça encontrada."}
            </p>
            {collection && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setColecao(null)}
              >
                Ver tudo
              </Button>
            )}
          </div>
        )}
      </div>
    </>
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
        "border px-4 py-1.5 text-sm transition-colors",
        active
          ? accent === "red"
            ? "border-brand-red bg-brand-red text-brand-red-foreground"
            : "border-primary bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}
