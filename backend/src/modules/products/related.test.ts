import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickRelatedIds } from './related.logic.js';

// productId = 1 em todos os casos (o "dono" é sempre excluído).

test('manual tem prioridade e preserva a ordem dos estágios', () => {
  const manual = [5, 3];
  const collection = [9, 8];
  const result = pickRelatedIds(1, [manual, collection], 4);
  assert.deepEqual(result, [5, 3, 9, 8]);
});

test('preenche por coleção quando o manual não atinge o limite', () => {
  const manual = [5];
  const collection = [9, 8, 7];
  const result = pickRelatedIds(1, [manual, collection], 4);
  assert.deepEqual(result, [5, 9, 8, 7]);
});

test('cascata completa: manual → coleção → destaques → recentes', () => {
  const result = pickRelatedIds(1, [[5], [8], [12], [20, 21]], 4);
  assert.deepEqual(result, [5, 8, 12, 20]);
});

test('exclui o próprio produto mesmo se aparecer num estágio', () => {
  const result = pickRelatedIds(1, [[1, 2], [1, 3]], 4);
  assert.deepEqual(result, [2, 3]);
});

test('deduplica ids entre e dentro de estágios', () => {
  // 3 aparece no manual e na coleção; 8 aparece duas vezes no mesmo estágio
  const result = pickRelatedIds(1, [[3, 5], [3, 8, 8, 9]], 10);
  assert.deepEqual(result, [3, 5, 8, 9]);
});

test('respeita o limite, cortando estágios de menor prioridade', () => {
  const result = pickRelatedIds(1, [[5, 6], [7, 8, 9]], 3);
  assert.deepEqual(result, [5, 6, 7]);
});

test('limite 0 retorna lista vazia', () => {
  assert.deepEqual(pickRelatedIds(1, [[5, 6]], 0), []);
});

test('todos os estágios vazios retorna lista vazia', () => {
  assert.deepEqual(pickRelatedIds(1, [[], [], []], 4), []);
});

test('bidirecional: id reverso é só mais um candidato no estágio manual', () => {
  // resolveRelated normaliza as duas direções num único estágio "manual";
  // aqui garantimos que a ordem recebida é respeitada e deduplicada.
  const manualBidirecional = [2, 4, 2];
  const result = pickRelatedIds(1, [manualBidirecional, [10]], 4);
  assert.deepEqual(result, [2, 4, 10]);
});
