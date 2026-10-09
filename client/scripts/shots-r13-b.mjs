// Screenshots Runde 13 B (Pixel-Grafik). Aufruf: node scripts/shots-r13-b.mjs [alt market longshot held fx icons proj ...]
// Startet Vite, oeffnet /sprite-sheet.html?sheet=NAME in Chromium und speichert docs/r13/b-*.png.
// Parameter je Blatt: "tower:ranger" -> Blatt `tower`, t=ranger, Datei b-tower-ranger.png.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r13');
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.R13B_PORT ?? 5198);
const base = `http://127.0.0.1:${PORT}`;
const want = process.argv.slice(2);

// Blattname im Skript -> Seitenparameter
const PAGE = { fx: 'fxr13', proj: 'projr13' };
const SHEETS = {
  alt: 'b-tuerme-alt.png',
  market: 'b-market.png',
  longshot: 'b-longshot.png',
  held: 'b-held.png',
  fx: 'b-fx.png',
  icons: 'b-icons.png',
  proj: 'b-projektile.png',
  frames: 'b-frames.png',
};

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.R13B_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;
try {
  const names = want.length ? want : Object.keys(SHEETS);
  for (const spec of names) {
    const [name, arg] = spec.split(':');
    const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${base}/sprite-sheet.html?sheet=${PAGE[name] ?? name}${arg ? `&t=${arg}` : ''}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 }).catch(() => errs.push('nicht bereit'));
    const el = await page.$('#out canvas');
    if (el) await el.screenshot({ path: resolve(outDir, arg ? `b-${name}-${arg}.png` : (SHEETS[name] ?? `b-${name}.png`)) });
    if (errs.length) { console.error(name, errs.join('\n')); code = 1; } else console.log('ok', name);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
process.exit(code);
