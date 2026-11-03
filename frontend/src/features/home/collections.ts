// Coleções curatoriais — estáticas no frontend (sem backend por enquanto).
// Entradas temáticas pela obra (adaptação elegante das "pautas"). Os tiles
// levam a /loja?colecao=<slug>; a PLP ignora o parâmetro hoje e passará a
// filtrar por ele quando as coleções virarem dados (Fase 4+).

export interface Collection {
  slug: string;
  title: string;
  subtitle: string;
  accent: "blue" | "red";
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "mandalas",
    title: "Mandalas",
    subtitle: "Geometria e meditação em cada traço.",
    accent: "blue",
  },
  {
    slug: "manifesto",
    title: "Manifesto",
    subtitle: "Arte que toma posição.",
    accent: "red",
  },
  {
    slug: "pinturas",
    title: "Pinturas",
    subtitle: "Do quadro para a camiseta.",
    accent: "blue",
  },
];
