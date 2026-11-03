// Busca de endereço por CEP via ViaCEP (API pública, sem chave, com CORS).
// https://viacep.com.br/ws/{cep}/json/

export interface CepAddress {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

// Mantém apenas os 8 dígitos do CEP.
export const normalizeCep = (cep: string): string =>
  cep.replace(/\D/g, "").slice(0, 8);

export const isValidCep = (cep: string): boolean =>
  normalizeCep(cep).length === 8;

// Retorna o endereço ou null (CEP inexistente). Lança em falha de rede.
export async function fetchAddressByCep(
  cepInput: string,
): Promise<CepAddress | null> {
  const cep = normalizeCep(cepInput);
  if (cep.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) throw new Error("Falha ao consultar o CEP");

  const data = (await res.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    cep: data.cep ?? cepInput,
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: (data.uf ?? "").toUpperCase(),
  };
}
