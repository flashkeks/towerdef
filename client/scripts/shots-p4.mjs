// P4-Screenshots: Lesbarkeits-Aufstellung (alle Archetypen und Units, 1x und 3x) und eine Spielszene.
// Braucht dist/ (npm run build). Schreibt client/docs/screenshot-p4-lineup.png und screenshot-p4-game.png.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const URL_ = `http://127.0.0.1:${PORT}/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const atlasPng = readFileSync(resolve(root, 'assets/atlas/atlas.png')).toString('base64');
const frames = JSON.parse(readFileSync(resolve(root, 'assets/atlas/atlas.json'), 'utf8')).frames;

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch { /* weg */ } };
process.on('exit', stop);
for (let i = 0; i < 60; i++) { try { if ((await fetch(URL_)).ok) break; } catch { /* noch nicht */ } await sleep(250); }

const launch = async () => {
  try { return await chromium.launch(); } catch { return await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM ?? '/opt/pw-browsers/chromium' }); }
};

try {
  // ---- Aufstellung: Quellpixel 1:1 (1x) und 3x, ohne Beschriftung ------------------------------------------------
  {
    const b = await launch();
    const page = await (await b.newContext({ viewport: { width: 1000, height: 520 } })).newPage();
    await page.setContent('<body style="margin:0;background:#4e8a45"><canvas id="c"></canvas></body>');
    await page.evaluate(async ({ png, frames }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const enemies = ['enemies/grunt_0', 'enemies/runner_0', 'enemies/brute_0', 'enemies/flyer_0', 'enemies/splitter_0', 'enemies/splitter_child_0', 'enemies/elite_0', 'enemies/boss_0'];
      const units = ['units/striker', 'units/gunner', 'units/blaster', 'units/banner', 'units/farm', 'units/lancer', 'units/frost', 'units/titan'];
      const c = document.getElementById('c');
      c.width = 1000; c.height = 520;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      let y = 8;
      for (const [row, scale] of [[[...enemies, ...units], 1], [enemies, 3], [units, 3]]) {
        let x = 8;
        let h = 0;
        for (const n of row) {
          const f = frames[n].frame;
          g.drawImage(img, f.x, f.y, f.w, f.h, x, y, f.w * scale, f.h * scale);
          x += f.w * scale + (scale === 1 ? 14 : 8);
          h = Math.max(h, f.h * scale);
        }
        y += h + 12;
      }
    }, { png: atlasPng, frames });
    await page.screenshot({ path: resolve(root, 'docs/screenshot-p4-lineup.png') });
    await b.close();
  }
  // ---- Spielszene ---------------------------------------------------------------------------------------------------
  {
    const b = await launch();
    const page = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL_);
    await page.click('.diff[data-difficulty="normal"]');
    await page.waitForSelector('canvas.board');
    await page.evaluate(() => {
      const x = window.__duskwardens.session();
      const put = (u, s) => { x.choosePlacing(u); x.clickSlot(s); };
      put('striker', 8); put('blaster', 9); put('gunner', 5);
      x.cancel();
      x.startNextWave();
      x.setSpeed(3);
    });
    await sleep(6000);
    await page.evaluate(() => {
      const x = window.__duskwardens.session();
      const put = (u, s) => { x.choosePlacing(u); x.clickSlot(s); };
      put('striker', 11); put('gunner', 14); put('frost', 12); put('lancer', 15); put('farm', 23); put('banner', 0); put('titan', 6);
      x.cancel();
      x.startNextWave();
    });
    await sleep(5000);
    await page.screenshot({ path: resolve(root, 'docs/screenshot-p4-game.png') });
    if (errors.length) console.log('Konsolenfehler:', errors.join(' | '));
    await b.close();
  }
} finally {
  stop();
}
