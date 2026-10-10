// Bilderblatt Runde 16 TP (Riverkeeper). Aufruf: node scripts/shots-r16-tp-riverkeeper.mjs
// Startet Vite auf eigenem Port (TP_RK_PORT, Standard 5261), oeffnet /sprite-sheet.html?sheet=tp-rk-* und speichert docs/r16/tp-riverkeeper*.png.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r16');
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.TP_RK_PORT ?? 5261);
const base = `http://127.0.0.1:${PORT}`;
const SHEETS = { 'tp-rk-paths': 'tp-riverkeeper-pfade.png', 'tp-rk-dirs': 'tp-riverkeeper-richtungen.png', 'tp-rk-frames': 'tp-riverkeeper-frames.png', 'tp-rk-icons': 'tp-riverkeeper-icons.png' };

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.TP_RK_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;
try {
  for (const [name, file] of Object.entries(SHEETS)) {
    const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${base}/sprite-sheet.html?sheet=${name}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 }).catch(() => errs.push('nicht bereit'));
    const el = await page.$('#out canvas');
    if (el) await el.screenshot({ path: resolve(outDir, file) });
    if (errs.length) { console.error(name, errs.join('\n')); code = 1; } else console.log('ok', file);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
process.exit(code);
