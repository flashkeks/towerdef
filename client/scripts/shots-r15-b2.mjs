// Screenshots Runde 15 B2 (Pixel-Gegner). Aufruf: node scripts/shots-r15-b2.mjs [gegner bosse fx]
// Startet Vite, oeffnet /sprite-sheet.html?sheet=b2-NAME in Chromium und speichert docs/r15/b2-NAME.png.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r15');
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.R15B2_PORT ?? 5315);
const base = `http://127.0.0.1:${PORT}`;
const want = process.argv.slice(2);
const SHEETS = ['gegner', 'bosse', 'fx'];

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.R15B2_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;
try {
  for (const name of want.length ? want : SHEETS) {
    const page = await browser.newPage({ viewport: { width: 3000, height: 1200 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${base}/sprite-sheet.html?sheet=b2-${name}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 }).catch(() => errs.push('nicht bereit'));
    const el = await page.$('#out canvas');
    if (el) await el.screenshot({ path: resolve(outDir, `b2-${name}.png`) });
    if (errs.length) { console.error(name, errs.join('\n')); code = 1; } else console.log('ok', name);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
process.exit(code);
