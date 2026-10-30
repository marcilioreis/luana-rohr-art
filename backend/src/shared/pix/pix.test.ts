import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPixPayload, crc16, emvField } from './pix.js';

test('crc16 CCITT-FALSE: valor de verificação padrão', () => {
  // Valor de verificação clássico do CRC-16/CCITT-FALSE para "123456789"
  assert.equal(crc16('123456789'), '29B1');
});

test('emvField monta ID + comprimento (2 dígitos) + valor', () => {
  assert.equal(emvField('00', '01'), '000201');
  assert.equal(emvField('00', 'br.gov.bcb.pix'), '0014br.gov.bcb.pix');
});

test('buildPixPayload gera payload com CRC16 conferível', () => {
  const payload = buildPixPayload({
    pixKey: 'luana.rohr.art@example.com',
    merchantName: 'Luana Rohr Art',
    merchantCity: 'Sao Paulo',
    amount: 99.9,
    txid: 'PEDIDO123',
  });

  // Começa com o Payload Format Indicator
  assert.ok(payload.startsWith('000201'));
  // Contém o GUI do PIX e o valor formatado
  assert.ok(payload.includes('br.gov.bcb.pix'));
  assert.ok(payload.includes('540599.90'));

  // O CRC são os últimos 4 caracteres; recalcular sobre o restante + "6304" confere
  const crcInformado = payload.slice(-4);
  const semCrc = payload.slice(0, -4); // inclui o "6304"
  assert.equal(crc16(semCrc), crcInformado);
});

test('buildPixPayload usa "***" quando txid é ausente', () => {
  const payload = buildPixPayload({
    pixKey: 'chave',
    merchantName: 'A',
    merchantCity: 'B',
    amount: 10,
  });
  // 62 (template) → 05 (reference label) com "***"
  assert.ok(payload.includes('6207' + '0503***'));
});

test('buildPixPayload remove acentos do nome/cidade do recebedor', () => {
  const payload = buildPixPayload({
    pixKey: 'chave',
    merchantName: 'São José',
    merchantCity: 'Brasília',
    amount: 1,
  });
  assert.ok(payload.includes('Sao Jose'));
  assert.ok(payload.includes('Brasilia'));
});

test('buildPixPayload rejeita valor não positivo', () => {
  assert.throws(() =>
    buildPixPayload({ pixKey: 'k', merchantName: 'A', merchantCity: 'B', amount: 0 })
  );
});
