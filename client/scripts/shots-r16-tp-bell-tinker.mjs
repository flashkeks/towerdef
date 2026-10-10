// Bilderbogen Runde 16 TP (Bellringer, Tinker, Sentry, Icons, Effekte). Aufruf: node scripts/shots-r16-tp-bell-tinker.mjs [bogen ...]
// Startet Vite, oeffnet /sprite-sheet.html?sheet=NAME in Chromium und speichert docs/r16/NAME-Datei.png (Bogen -> Datei siehe SHEETS).
// Port: R16TP_PORT (Standard 5262), Chromium: R16TP_CHROMIUM oder /opt/pw-browsers/chromium.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r16');
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.R16TP_PORT ?? 5262);
const base = `http://127.0.0.1:${PORT}`;
const want = process.argv.slice(2);

// Bogenname (Seitenparameter) -> Datei
const SHEETS = {
  'tp-bellringer': 'tp-bellringer.png',
  'tp-bellringer-cross': 'tp-bellringer-cross.png',
  'tp-bellringer-icons': 'tp-bellringer-icons.png',
  'tp-tinker': 'tp-tinker.png',
  'tp-tinker-cross': 'tp-tinker-cross.png',
  'tp-tinker-dirs': 'tp-tinker-dirs.png',
  'tp-tinker-icons': 'tp-tinker-icons.png',
  'tp-sentry': 'tp-sentry.png',
  'tp-fx': 'tp-fx.png',
};

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.R16TP_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;
try {
  const names = want.length ? want : Object.keys(SHEETS);
  for (const name of names) {
    const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    const [sheet, qs] = name.split('?');
    await page.goto(`${base}/sprite-sheet.html?sheet=${sheet}${qs ? '&' + qs : ''}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 }).catch(() => errs.push('nicht bereit'));
    const el = await page.$('#out canvas');
    if (el) await el.screenshot({ path: resolve(outDir, process.env.R16TP_OUT ?? SHEETS[name] ?? `${name}.png`) });
    if (errs.length) { console.error(name, errs.join('\n')); code = 1; } else console.log('ok', name);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
process.exit(code);
