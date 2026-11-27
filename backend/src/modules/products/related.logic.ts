// Lógica pura da cascata de produtos relacionados — sem dependências de db/redis,
// para ser testável isoladamente (ver related.test.ts).

/**
 * Merge priorizado de estágios de candidatos.
 * Percorre `stages` na ordem dada, pulando o próprio produto e qualquer id já
 * escolhido (dedupe entre e dentro de estágios), e corta ao atingir `limit`.
 *
 * @param productId id do produto "dono" (sempre excluído do resultado)
 * @param stages    listas de ids candidatos, da maior para a menor prioridade
 * @param limit     máximo de itens no resultado
 */
export const pickRelatedIds = (
  productId: number,
  stages: number[][],
  limit: number
): number[] => {
  const picked: number[] = [];
  const seen = new Set<number>([productId]);
  for (const stage of stages) {
    for (const id of stage) {
      if (picked.length >= limit) return picked;
      if (!seen.has(id)) {
        seen.add(id);
        picked.push(id);
      }
    }
  }
  return picked;
};
