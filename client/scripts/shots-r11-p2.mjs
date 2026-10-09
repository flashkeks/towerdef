// Screenshots/Animation fuer Runde 11 P2 (Pixel-Grafik). Aufruf: node scripts/shots-r11-p2.mjs [sheet ...]
// Startet Vite, oeffnet /sprite-sheet.html?sheet=NAME in Chromium und speichert docs/r11/p2-*.png.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
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
  towers: 'p2-tuerme.png',
  tower: 'p2-turm.png',
  frames: 'p2-frames.png',
  zoom: 'p2-zoom.png',
  hero: 'p2-held.png',
  enemies: 'p2-gegner.png',
  pop: 'p2-platzen.png',
  icons: 'p2-icons.png',
  fx: 'p2-fx.png',
  fx2: 'p2-fx2.png',
  proj: 'p2-projektile.png',
};

async function recordAttacks(browser) {
  // Video der Mini-Szene (jeder Turm schiesst, Projektil fliegt, Gegner platzt) als WebM, dazu ein GIF via ffmpeg.
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 675 }, recordVideo: { dir: resolve(outDir, '.video'), size: { width: 1200, height: 675 } } });
  const page = await ctx.newPage();
  await page.goto(`${base}/sprite-sheet.html?sheet=demo`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 20000 });
  await page.waitForTimeout(Number(process.env.P2_VIDEO_MS ?? 14000));
  const shot = await page.$('#out canvas');
  if (shot) await shot.screenshot({ path: resolve(outDir, 'p2-angriffe.png') });
  const v = page.video();
  await ctx.close();
  const webm = resolve(outDir, 'p2-angriffe.webm');
  await v.saveAs(webm);
  rmSync(resolve(outDir, '.video'), { recursive: true, force: true });
  try {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '1', '-i', webm, '-vf', 'fps=15,scale=600:-1:flags=neighbor,split[a][b];[a]palettegen=max_colors=48[p];[b][p]paletteuse=dither=none', resolve(outDir, 'p2-angriffe.gif')]);
  } catch (e) { console.error('GIF: ffmpeg nicht moeglich', String(e).slice(0, 120)); }
  console.log('ok angriffe');
}

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 80; i++) {
  try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
  await new Promise((r) => setTimeout(r, 250));
}
const exe = process.env.P2_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath: exe });
let code = 0;
try {
  const names = want.length ? want : Object.keys(SHEETS).filter((k) => k !== 'tower' && k !== 'zoom');
  for (const spec of names) {
    // "quick:bombardier" -> Blatt `quick`, Parameter t=bombardier, Datei p2-quick-bombardier.png
    const [name, arg] = spec.split(':');
    if (name === 'angriffe') { await recordAttacks(browser); continue; }
    const page = await browser.newPage({ viewport: { width: 2000, height: 1000 } });
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
