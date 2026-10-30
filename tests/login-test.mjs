import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

console.log('Navegando para localhost:5173...');
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/hajel-before-login.png' });

console.log('Preenchendo credenciais...');
await page.fill('input[type="email"], input[placeholder*="email"], input[name="email"]', 'emaildomarcilio@gmail.com');
await page.fill('input[type="password"], input[name="password"]', 'M@rs6272');
await page.screenshot({ path: '/tmp/hajel-filled.png' });

console.log('Clicando em Entrar...');
await page.click('button[type="submit"], button:has-text("Entrar")');

try {
  await page.waitForURL('**/surveys**', { timeout: 10000 });
  console.log('✅ Login OK — redirecionado para:', page.url());
} catch {
  console.log('⚠️ Sem redirecionamento esperado. URL atual:', page.url());
}

await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/hajel-after-login.png' });

await browser.close();
