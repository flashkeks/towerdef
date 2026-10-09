// Screenshots/Animation fuer Runde 11 P2 (Pixel-Grafik). Aufruf: node scripts/shots-r11-p2.mjs [sheet ...]
// Startet Vite, oeffnet /sprite-sheet.html?sheet=NAME in Chromium und speichert docs/r11/p2-*.png.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r11');
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.P2_PORT ?? 5199);
const base = `http://127.0.0.1:${PORT}`;
const want = process.argv.slice(2);

const SHEETS = {
  quick: 'p2-quick.png',
  towers: 'p2-tuerme.png',
  hero: 'p2-held.png',
  enemies: 'p2-gegner.png',
  icons: 'p2-icons.png',
  fx: 'p2-fx.png',
  proj: 'p2-projektile.png',
};

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.P2_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;
try {
  const names = want.length ? want : Object.keys(SHEETS).filter((k) => k !== 'quick');
  for (const spec of names) {
    // "quick:bombardier" -> Blatt `quick`, Parameter t=bombardier, Datei p2-quick-bombardier.png
    const [name, arg] = spec.split(':');
    if (name === 'angriffe') continue;
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${base}/sprite-sheet.html?sheet=${name}${arg ? `&t=${arg}` : ''}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 20000 }).catch(() => errs.push('nicht bereit'));
    const el = await page.$('#out canvas');
    if (el) await el.screenshot({ path: resolve(outDir, arg ? `p2-${name}-${arg}.png` : (SHEETS[name] ?? `p2-${name}.png`)) });
    if (errs.length) { console.error(name, errs.join('\n')); code = 1; }
    else console.log('ok', name);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
process.exit(code);
