// src/shared/shipping/shipping.ts
// ============================================================================
// FRETE POR REGIÃO (UF) — FONTE ÚNICA DA VERDADE.
// Para mudar o valor do frete, altere os números em SHIPPING_FEES abaixo.
// O checkout é server-authoritative: o valor enviado pelo cliente é IGNORADO
// e o frete é recalculado aqui a partir da UF do endereço de entrega.
// ============================================================================

export type ShippingRegion = 'norte' | 'nordeste' | 'centro_oeste' | 'sudeste' | 'sul';

// Tarifa (R$) por região. Mude aqui para reajustar o frete.
export const SHIPPING_FEES: Record<ShippingRegion, number> = {
  norte: 45,
  nordeste: 35,
  centro_oeste: 30,
  sudeste: 20,
  sul: 25,
};

// Fallback quando a UF não é reconhecida (nunca deixa o frete zerado).
export const DEFAULT_SHIPPING_FEE = SHIPPING_FEES.sudeste;

const UF_TO_REGION: Record<string, ShippingRegion> = {
  // Norte
  AC: 'norte',
  AP: 'norte',
  AM: 'norte',
  PA: 'norte',
  RO: 'norte',
  RR: 'norte',
  TO: 'norte',
  // Nordeste
  AL: 'nordeste',
  BA: 'nordeste',
  CE: 'nordeste',
  MA: 'nordeste',
  PB: 'nordeste',
  PE: 'nordeste',
  PI: 'nordeste',
  RN: 'nordeste',
  SE: 'nordeste',
  // Centro-Oeste
  DF: 'centro_oeste',
  GO: 'centro_oeste',
  MT: 'centro_oeste',
  MS: 'centro_oeste',
  // Sudeste
  ES: 'sudeste',
  MG: 'sudeste',
  RJ: 'sudeste',
  SP: 'sudeste',
  // Sul
  PR: 'sul',
  RS: 'sul',
  SC: 'sul',
};

export const getRegionForUf = (uf: string): ShippingRegion | null =>
  UF_TO_REGION[uf.trim().toUpperCase()] ?? null;

// Frete autoritativo usado no checkout. UF desconhecida → fallback (não bloqueia a venda).
export const getShippingFee = (uf: string): number => {
  const region = getRegionForUf(uf);
  return region ? SHIPPING_FEES[region] : DEFAULT_SHIPPING_FEE;
};

export interface ShippingQuote {
  uf: string;
  region: ShippingRegion | null;
  fee: number;
}

// Cotação para exibição no frontend (antes de finalizar).
export const quoteShipping = (uf: string): ShippingQuote => {
  const u = uf.trim().toUpperCase();
  const region = getRegionForUf(u);
  return { uf: u, region, fee: region ? SHIPPING_FEES[region] : DEFAULT_SHIPPING_FEE };
};
