import { Link } from "react-router-dom";
import { useGetProductsQuery } from "../products/productsApi";
import ProductCard from "../products/ProductCard";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/common/Skeleton";

export default function HomePage() {
  const { data: products, isLoading } = useGetProductsQuery();
  const highlights = products?.slice(0, 4) ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Arte autoral que você veste
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Camisetas com estampas exclusivas criadas à mão por Luana Rohr.
            Edições limitadas, algodão de qualidade e muito amor em cada traço.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/loja">Ver a loja</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/sobre">Sobre a artista</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Destaques</h2>
          <Link to="/loja" className="text-sm text-primary hover:underline">
            Ver tudo →
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {highlights.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
