// Link de WhatsApp da artista para produtos com "preço sob consulta".
// O número vem de VITE_WHATSAPP_NUMBER (somente dígitos, com DDI, ex.: 5551999998888).

const RAW_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;

// Mantém apenas dígitos — tolera números cadastrados com +, espaços ou traços.
export const whatsappNumber = (RAW_NUMBER ?? "").replace(/\D/g, "");

export const hasWhatsapp = whatsappNumber.length > 0;

// Monta a URL wa.me com mensagem pré-preenchida citando o produto.
export const buildWhatsappLink = (productName: string): string => {
  const text = `Olá! Tenho interesse na obra "${productName}" e gostaria de saber o valor.`;
  const base = `https://wa.me/${whatsappNumber}`;
  return `${base}?text=${encodeURIComponent(text)}`;
};
