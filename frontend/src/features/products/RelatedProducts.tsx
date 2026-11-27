import { useGetRelatedProductsQuery } from "./productsApi";
import ProductCard from "./ProductCard";
import Skeleton from "@/components/common/Skeleton";
import { Reveal } from "@/components/common/Reveal";

export default function RelatedProducts({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useGetRelatedProductsQuery(slug);

  // Erro ou lista vazia: não renderiza nada (o fallback do backend torna o
  // vazio raro, mas mantemos a seção silenciosa quando não há o que mostrar).
  if (isError || (!isLoading && (!data || data.length === 0))) return null;

  return (
    <Reveal as="section" className="mx-auto mt-14 border-t pt-10">
      <h2 className="font-heading text-xl">Produtos relacionados</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Confira outras obras que podem te interessar.
      </p>

      <div
        className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
        data-testid="related-grid"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          : data!.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </Reveal>
  );
}
