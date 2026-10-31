// src/shared/pix/pix.ts
//
// Gerador de "PIX copia e cola" (BR Code / EMV MPM) com valor dinâmico por pedido.
// Não depende de gateway: o payload EMV e o CRC16 são implementados à mão.
// Referência: Manual de Padrões para Iniciação do PIX (Banco Central do Brasil).

export interface PixPayloadParams {
  /** Chave PIX do recebedor (e-mail, CPF/CNPJ, telefone ou chave aleatória). */
  pixKey: string;
  /** Nome do recebedor (máx. 25 caracteres, ASCII). */
  merchantName: string;
  /** Cidade do recebedor (máx. 15 caracteres, ASCII). */
  merchantCity: string;
  /** Valor da transação em reais (ex.: 99.9). */
  amount: number;
  /** Identificador da transação (txid), alfanumérico 1–25. Padrão: "***". */
  txid?: string;
}

// ---- Helpers EMV TLV ----

/** Monta um campo EMV: ID (2) + comprimento (2, zero-padded) + valor. */
export const emvField = (id: string, value: string): string => {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
};

/**
 * CRC16-CCITT (FALSE): polinômio 0x1021, valor inicial 0xFFFF.
 * Retorna 4 dígitos hexadecimais em maiúsculas.
 */
export const crc16 = (payload: string): string => {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/** Remove acentos e caracteres não-ASCII, mantendo o payload compatível com EMV. */
const sanitize = (value: string, maxLength: number): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, maxLength);

/** Mantém apenas caracteres alfanuméricos no txid (1–25). */
const sanitizeTxid = (txid: string): string => {
  const clean = txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  return clean.length > 0 ? clean : '***';
};

/**
 * Gera o payload EMV completo do "PIX copia e cola", já com o CRC16 ao final.
 */
export const buildPixPayload = (params: PixPayloadParams): string => {
  const { pixKey, merchantName, merchantCity, amount } = params;

  if (!pixKey) throw new Error('Chave PIX é obrigatória');
  if (!(amount > 0)) throw new Error('Valor do PIX deve ser maior que zero');

  const txid = sanitizeTxid(params.txid ?? '***');

  // Merchant Account Information (ID 26): GUI + chave PIX
  const merchantAccount = emvField('00', 'br.gov.bcb.pix') + emvField('01', pixKey);

  // Additional Data Field Template (ID 62): Reference Label (txid)
  const additionalData = emvField('05', txid);

  const amountStr = amount.toFixed(2);

  const payloadWithoutCrc =
    emvField('00', '01') + // Payload Format Indicator
    emvField('01', '11') + // Point of Initiation Method (11 = estático/reutilizável;
    //                        correto p/ payload sem gateway. 12 = dinâmico exige URL de PSP)
    emvField('26', merchantAccount) +
    emvField('52', '0000') + // Merchant Category Code
    emvField('53', '986') + // Moeda: BRL
    emvField('54', amountStr) + // Valor
    emvField('58', 'BR') + // País
    emvField('59', sanitize(merchantName, 25)) +
    emvField('60', sanitize(merchantCity, 15)) +
    emvField('62', additionalData) +
    '6304'; // ID + len do CRC (o valor é calculado sobre isto)

  return payloadWithoutCrc + crc16(payloadWithoutCrc);
};

/**
 * Lê a chave/recebedor do ambiente e monta o payload para um pedido.
 */
export const buildOrderPix = (amount: number, txid?: string): string =>
  buildPixPayload({
    pixKey: process.env.PIX_KEY || 'luana.rohr.art@example.com',
    merchantName: process.env.PIX_MERCHANT_NAME || 'LUANA ROHR ART',
    merchantCity: process.env.PIX_MERCHANT_CITY || 'SAO PAULO',
    amount,
    txid,
  });
