// Coleções curatoriais — estáticas no frontend (sem backend por enquanto).
// Entradas temáticas pela obra (adaptação elegante das "pautas"). O filtro é
// client-side: casa palavras-chave (`match`) com nome/descrição/tags do produto.
// Quando virarem dados reais, troca-se o `match` por coleção no schema.

export interface Collection {
  slug: string;
  title: string;
  subtitle: string;
  accent: "blue" | "red";
  /** Palavras-chave para casar com nome/descrição/tags do produto. */
  match: string[];
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "mandalas",
    title: "Mandalas",
    subtitle: "Geometria e meditação em cada traço.",
    accent: "blue",
    match: ["mandala"],
  },
  {
    slug: "manifesto",
    title: "Manifesto",
    subtitle: "Arte que toma posição.",
    accent: "red",
    match: ["manifesto", "polít", "crítica", "crítico", "resist"],
  },
  {
    slug: "pinturas",
    title: "Pinturas",
    subtitle: "Do quadro para a camiseta.",
    accent: "blue",
    match: ["pintura", "aquarela", "quadro", "botân", "abstrat", "retrato"],
  },
];

export const getCollection = (slug?: string | null): Collection | null =>
  COLLECTIONS.find((c) => c.slug === slug) ?? null;

export const productMatchesCollection = (
  product: {
    name: string;
    description?: string | null;
    tags?: string[] | null;
  },
  collection: Collection,
): boolean => {
  const haystack = [
    product.name,
    product.description ?? "",
    ...(product.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return collection.match.some((k) => haystack.includes(k.toLowerCase()));
};
