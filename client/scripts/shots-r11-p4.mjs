// Bilder fuer Runde 11 P4 (Fortschritt): node scripts/shots-r11-p4.mjs [home result knowledge tower notice settings hover]
// Startet Vite, oeffnet /p4-screens.html?scene=NAME in Chromium (1280x720) und speichert docs/r11/p4-*.png.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r11');
mkdirSync(outDir, { recursive: true });
const PORT = Number(process.env.P4_PORT ?? 5198);
const base = `http://127.0.0.1:${PORT}`;
const want = process.argv.slice(2);
const W = Number(process.env.P4_W ?? 1280), H = Number(process.env.P4_H ?? 720);

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/p4-screens.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.P4_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;

const SHOTS = {
  home: { scene: 'home', file: 'p4-start.png' },
  result: { scene: 'result', file: 'p4-ergebnis-levelup.png', after: (p) => p.waitForSelector('.result[data-done="1"]', { timeout: 15000 }) },
  knowledge: { scene: 'knowledge', file: 'p4-wissensbaum.png', after: async (p) => { await p.hover('.knode.available'); } },
  tower: { scene: 'tower', file: 'p4-turm-detail.png', after: async (p) => { await p.hover('.tpath.p1 .ttier:nth-of-type(5)'); await p.waitForTimeout(400); } },
  notice: { scene: 'notice', file: 'p4-reset-hinweis.png' },
  settings: { scene: 'settings', file: 'p4-settings.png' },
};
try {
  const names = want.length ? want : Object.keys(SHOTS);
  for (const name of names) {
    const s = SHOTS[name];
    if (!s) { console.error('unbekannt', name); code = 1; continue; }
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(`${base}/p4-screens.html?scene=${s.scene}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 20000 }).catch(() => errs.push('nicht bereit'));
    await page.waitForTimeout(500);
    if (s.after) await s.after(page).catch((e) => errs.push(String(e).slice(0, 200)));
    await page.waitForTimeout(700);
    await page.screenshot({ path: resolve(outDir, s.file) });
    if (errs.length) { console.error(name, errs.join('\n')); code = 1; } else console.log('ok', name);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
process.exit(code);
