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
              src="/luana.webp"
              alt="Retrato de Luana Rohr"
              width={700}
              height={933}
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
            multimídia, natural de Arroio do Meio (RS), com trajetória artística
            independente desde 2017.
          </p>
          <p>
            Sua produção transita entre diferentes linguagens, técnicas e
            suportes, explorando o universo simbólico e as relações entre o
            consciente e o inconsciente. Das mandalas às pinturas e ilustrações
            autorais, busca traduzir emoções, inquietações e posicionamentos em
            cores e formas que convidam a outras maneiras de perceber o mundo.
          </p>
          <p>
            Sua trajetória também é atravessada por experiências coletivas,
            intervenções artísticas e processos de criação compartilhada,
            compreendendo a arte como espaço de expressão, encontro e
            transformação.
          </p>
          <p>
            Para além do ateliê, atua com{" "}
            <strong className="text-foreground">
              produção cultural, políticas públicas de cultura e processos
              participativos
            </strong>
            , acreditando que arte e território caminham juntos e que a cultura
            é um direito fundamental.
          </p>
          <p>
            Este espaço reúne obras, processos e experimentações de uma produção
            artística em constante movimento.
          </p>

          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">
              Como funciona a compra
            </p>
            <p className="mt-1">
              Você monta o pedido e gera um{" "}
              <strong className="text-foreground">PIX “copia e cola”</strong>{" "}
              com o valor exato. Assim que confirmamos o pagamento, preparamos
              tudo com carinho.
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
