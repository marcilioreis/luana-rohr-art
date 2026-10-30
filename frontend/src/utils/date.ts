// Substitui espaço por T e remove microssegundos se necessário
export const formatDateToIsoString = (dateStr: string) => {
  try {
    const isoString = dateStr.replace(" ", "T").split(".")[0];
    return new Date(isoString).toLocaleDateString();
  } catch {
    return "Data inválida";
  }
};

// Função auxiliar para parsing seguro de data vinda do backend (formato "YYYY-MM-DD HH:mm:ss")
export const parseBackendDate = (dateStr: string): Date => {
  // substitui espaço por 'T' para compatibilidade com ISO
  return new Date(dateStr.replace(" ", "T"));
};

export const parseISOToLocalDate = (isoString: string): Date | undefined => {
  if (!isoString) return undefined;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return undefined;

  // Cria um objeto Date no fuso local utilizando o ano, mês, dia e horas representados em UTC
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  );
};
