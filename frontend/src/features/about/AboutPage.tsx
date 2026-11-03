import { Link } from "react-router-dom";
import { Mandala } from "@/components/brand/Mandala";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
        <Mandala
          strokeWidth={1.5}
          className="pointer-events-none absolute -right-24 -top-16 h-96 w-96 text-primary/5"
        />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            a artista
          </p>
          <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
            Luana Rohr
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Artista visual, ilustradora e agente de cultura. Arte autoral entre
            a aquarela, o traço minimalista e as mandalas.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.4fr]">
        {/* Retrato da artista */}
        <div className="flex items-start justify-center">
          <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl border bg-accent/30 shadow-sm">
            <img
              src="/luana.jpg"
              alt="Retrato de Luana Rohr"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <Mandala className="absolute -right-3 -top-3 h-14 w-14 text-brand-red/80" />
          </div>
        </div>

        {/* Texto */}
        <article className="space-y-4 text-muted-foreground">
          <p>
            <strong className="text-foreground">Luana Rohr</strong> é artista
            visual e ilustradora. Seu trabalho transita entre a aquarela, o
            traço minimalista, os retratos abstratos e as mandalas — sempre
            buscando traduzir emoções, e posições, em cores e formas.
          </p>
          <p>
            Para além do ateliê, atua com{" "}
            <strong className="text-foreground">
              política cultural e processos participativos
            </strong>
            , acreditando que arte e território caminham juntos. Cada estampa
            carrega esse gesto: autoral, afetivo e com posição.
          </p>
          <p>
            Cada camiseta nasce de uma ilustração original, impressa em algodão
            de qualidade e produzida em{" "}
            <strong className="text-foreground">pequenas tiragens</strong>. Ao
            vestir uma peça, você leva um pedaço de arte autoral — e apoia
            diretamente o trabalho independente de uma artista.
          </p>

          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">
              Como funciona a compra
            </p>
            <p className="mt-1">
              Você monta o pedido e gera um{" "}
              <strong className="text-foreground">PIX “copia e cola”</strong>{" "}
              com o valor exato. Assim que confirmamos o pagamento, preparamos
              tudo com carinho. Simples e à vista — sem gateway, sem
              complicação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button asChild>
              <Link to="/loja">Ver a loja</Link>
            </Button>
            <a
              href="https://www.instagram.com/luanarohrart/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              @luanarohrart
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
