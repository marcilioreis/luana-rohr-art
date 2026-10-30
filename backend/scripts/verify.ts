// scripts/verify.ts — verificação end-to-end em processo (RBAC, PIX, status, export, graphql).
import 'dotenv/config';
import app from '../src/app.js';
import { startExportWorker } from '../src/shared/queue/export.worker.js';

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;

let failures = 0;
const check = (label: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${label}${extra ? ` — ${extra}` : ''}`);
  if (!cond) failures++;
};

const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
const signIn = async (email: string, password: string): Promise<string> => {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email, password }),
  });
  if (!res.headers.get('set-auth-token')) {
    console.log('   sign-in debug:', res.status, (await res.text()).slice(0, 200));
  }
  return res.headers.get('set-auth-token') || '';
};
const authH = (t: string) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });

async function main() {
  startExportWorker();
  const server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 500));

  const admin = await signIn('admin@luanarohr.art', 'admin12345');
  check('admin sign-in retornou token', admin.length > 0);

  // cliente comum
  const cliEmail = `cli2${Date.now()}@t.com`;
  await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: cliEmail, password: 'cliente12345', name: 'Cliente' }),
  });
  const cli = await signIn(cliEmail, 'cliente12345');

  // RBAC
  const r1 = await fetch(`${BASE}/api/orders`, { headers: authH(cli) });
  check('cliente NÃO lista pedidos admin (403)', r1.status === 403, `status=${r1.status}`);
  const r2 = await fetch(`${BASE}/api/products`, {
    method: 'POST',
    headers: authH(cli),
    body: JSON.stringify({ name: 'x', basePrice: 10 }),
  });
  check('cliente NÃO cria produto (403)', r2.status === 403, `status=${r2.status}`);
  const r3 = await fetch(`${BASE}/api/orders/mine`, { headers: authH(cli) });
  check('cliente acessa /orders/mine (200)', r3.status === 200, `status=${r3.status}`);

  // GraphQL (admin)
  const gq = await fetch(`${BASE}/graphql`, {
    method: 'POST',
    headers: authH(admin),
    body: JSON.stringify({ query: '{ salesSummary { totalOrders totalRevenue paidOrders } ordersByStatus { status count } }' }),
  });
  const gqJson = await gq.json();
  check('graphql salesSummary responde', !!gqJson?.data?.salesSummary, JSON.stringify(gqJson?.data ?? gqJson));

  // Export (BullMQ end-to-end)
  const expRes = await fetch(`${BASE}/api/orders/exports`, {
    method: 'POST',
    headers: authH(admin),
    body: JSON.stringify({ format: 'csv' }),
  });
  const { exportId } = (await expRes.json()) as { exportId: number };
  let exportDone = false;
  for (let i = 0; i < 20; i++) {
    const st = await fetch(`${BASE}/api/orders/exports/${exportId}/status`, { headers: authH(admin) });
    const stJson = (await st.json()) as { status: string };
    if (stJson.status === 'concluido') { exportDone = true; break; }
    if (stJson.status === 'falha') break;
    await new Promise((r) => setTimeout(r, 500));
  }
  check('exportação concluída via BullMQ', exportDone, `exportId=${exportId}`);

  server.close();
  console.log(failures === 0 ? '\n🎉 Todos os testes passaram' : `\n⚠️ ${failures} falha(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
