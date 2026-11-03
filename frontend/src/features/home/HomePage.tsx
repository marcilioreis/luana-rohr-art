import { Link } from "react-router-dom";
import {
  useGetProductsQuery,
  useGetCollectionsQuery,
  useGetFeaturedProductQuery,
} from "../products/productsApi";
import ProductCard from "../products/ProductCard";
import { Mandala } from "@/components/brand/Mandala";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data: products, isLoading } = useGetProductsQuery();
  const { data: collections = [] } = useGetCollectionsQuery();
  const { data: featuredProduct } = useGetFeaturedProductQuery();
  const highlights = products?.slice(0, 4) ?? [];
  // Destaque escolhido no admin; fallback para o produto mais recente.
  const featured = featuredProduct ?? highlights[0];

  return (
    <div>
      {/* Hero — artwork-forward */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
        <Mandala
          strokeWidth={1.5}
          className="pointer-events-none absolute -left-28 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 text-primary/5"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              arte autoral · edições limitadas
            </p>
            <h1 className="text-4xl font-medium tracking-tight md:text-6xl">
              Arte autoral que você veste
            </h1>
            <p className="mx-auto mt-5 max-w-md text-muted-foreground md:mx-0">
              Estampas exclusivas criadas à mão por Luana Rohr — aquarela, traço
              minimalista e mandalas, com muito gesto em cada peça.
            </p>
            <div className="mt-8 flex justify-center gap-3 md:justify-start">
              <Button asChild size="lg">
                <Link to="/loja">Ver a loja</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/sobre">Sobre a artista</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <Mandala className="pointer-events-none absolute -right-5 -top-5 z-10 h-20 w-20 text-brand-red/70" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted shadow-sm">
              {featured?.image ? (
                <img
                  src={featured.image.url}
                  alt={featured.image.alt ?? featured.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Mandala className="h-40 w-40 text-primary/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Coleções curatoriais */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-medium tracking-tight">Coleções</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entradas pela obra — não só pelo produto.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.slug}
              to={`/loja?colecao=${c.slug}`}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <Mandala
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 h-32 w-32 transition-transform duration-500 group-hover:rotate-45",
                  c.accent === "red" ? "text-brand-red/15" : "text-primary/15",
                )}
              />
              <div className="relative">
                <h3 className="font-heading text-xl">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.subtitle}
                </p>
                <span
                  className={cn(
                    "mt-4 inline-block text-sm font-medium",
                    c.accent === "red" ? "text-brand-red" : "text-primary",
                  )}
                >
                  Ver coleção →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-medium tracking-tight">Destaques</h2>
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

      {/* Faixa manifesto */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <Mandala
          strokeWidth={1.5}
          className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 text-primary-foreground/10"
        />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="font-heading text-2xl leading-snug md:text-3xl">
            “Cada peça carrega um gesto político e um traço de mão.”
          </p>
          <p className="mt-4 text-sm text-primary-foreground/70">
            Arte independente, impressa em pequenas tiragens.
          </p>
        </div>
      </section>

      {/* A artista + Instagram */}
      <section className="border-t bg-accent/20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              a artista
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">
              Luana Rohr
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground md:mx-0">
              Artista visual e agente de cultura — aquarela, traço minimalista,
              retratos abstratos e mandalas. Arte que atravessa política
              cultural e processos participativos.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/sobre">Conhecer a artista</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <a
              href="https://www.instagram.com/luanarohrart/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card px-10 py-8 text-center transition-shadow hover:shadow-md"
            >
              <Mandala className="h-16 w-16 text-primary transition-transform duration-700 group-hover:rotate-90" />
              <span className="font-heading text-lg">@luanarohrart</span>
              <span className="text-sm text-muted-foreground">
                Acompanhe o processo no Instagram
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
