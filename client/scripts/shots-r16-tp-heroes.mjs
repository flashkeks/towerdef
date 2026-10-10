// Bilder Runde 16 TP (Helden Bram und Sela): node scripts/shots-r16-tp-heroes.mjs [sheets] [match]
//   sheets: Bilderbogen aus sprite-sheet.html (eigener Vite-Port, TP_PORT, Standard 5263) -> docs/r16/tp-bram*.png, tp-sela*.png, tp-fx.png
//   match:  Fähigkeiten im Match (braucht `npm run build`, Port SMOKE_PORT, Standard 4273) -> docs/r16/tp-match-*.png
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/r16');
mkdirSync(outDir, { recursive: true });
const want = process.argv.slice(2);
const on = (k) => want.length === 0 || want.includes(k);
const exe = process.env.TP_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let code = 0;

// ---------------------------------------------------------------- Bilderbogen
if (on('sheets')) {
  const PORT = Number(process.env.TP_PORT ?? 5263);
  const base = `http://127.0.0.1:${PORT}`;
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
  const stop = () => { try { process.kill(-server.pid, 'SIGKILL'); } catch { /* weg */ } };
  process.on('exit', stop);
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base + '/sprite-sheet.html')).ok) break; } catch { /* noch nicht */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  const browser = await chromium.launch({ executablePath: exe });
  try {
    const SHEETS = { 'tp-bram': 'tp-bram.png', 'tp-bram-zoom': 'tp-bram-zoom.png', 'tp-sela': 'tp-sela.png', 'tp-sela-zoom': 'tp-sela-zoom.png', 'tp-fx': 'tp-fx-geschosse-icons.png' };
    for (const [sheet, file] of Object.entries(SHEETS)) {
      const page = await browser.newPage({ viewport: { width: 3000, height: 1000 } });
      const errs = [];
      page.on('pageerror', (e) => errs.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      await page.goto(`${base}/sprite-sheet.html?sheet=${sheet}`);
      await page.waitForFunction('window.__ready === true', null, { timeout: 30000 }).catch(() => errs.push('nicht bereit'));
      const el = await page.$('#out canvas');
      if (el) await el.screenshot({ path: resolve(outDir, file) });
      if (errs.length) { console.error(sheet, errs.join('\n')); code = 1; } else console.log('ok', sheet);
      await page.close();
    }
  } finally {
    await browser.close();
    stop();
  }
}

// ---------------------------------------------------------------- Fähigkeiten im Match
if (on('match')) {
  const { launch, serve, watchErrors } = await import('./lib-serve.mjs');
  const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4273));
  const browser = await launch();
  try {
    for (const hero of ['bram', 'sela']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const errs = watchErrors(page);
      await page.goto(`${url}?debug&seed=7`);
      await page.waitForSelector('.maptile[data-map="meadow"]', { timeout: 20000 });
      await page.evaluate(async (h) => { const s = __app.store; await s.update({ ...s.profile, selectedHero: h }); }, hero);
      await page.click('.maptab[data-tier="beginner"]');
      await page.waitForSelector('.maptile[data-map="meadow"]:not(.locked)');
      await page.click('.maptile[data-map="meadow"]');
      await page.waitForSelector('.app-play');
      await page.click('.diff[data-diff="medium"]');
      await page.click('.app-play');
      await page.waitForSelector('.m-canvas', { timeout: 20000 });
      await page.waitForTimeout(500);
      // Held mitten ans Wegstück setzen, Level 20 erzwingen, Gegner dazu
      const r = await page.evaluate((h) => {
        const g = __dw.game, DATA = __dw.DATA;
        g.sandbox.setCash(300000); g.state.lives = 100000;
        // Platz knapp neben dem Weg (gut 30 px vom Wegpunkt), damit Gegner in Reichweite laufen
        const path = (DATA.maps.meadow.paths && DATA.maps.meadow.paths[0]) || DATA.maps.meadow.path;
        let best = null;
        for (let i = 4; i < path.length && !best; i++) {
          const [ax, ay] = path[i];
          if (ax < 150 || ax > 520 || ay < 80 || ay > 280) continue;
          for (let a = 0; a < 16 && !best; a++) {
            const px = Math.round(ax + Math.cos(a * 0.39) * 34), py = Math.round(ay + Math.sin(a * 0.39) * 34);
            if (g.canPlace(h, px * 1000, py * 1000).ok) best = [px, py];
          }
        }
        const res = g.apply({ type: 'place', tower: h, x: best[0] * 1000, y: best[1] * 1000 });
        return { res, best };
      }, hero);
      console.log(hero, JSON.stringify(r));
      const lvl = await page.evaluate(() => {
        const g = __dw.game;
        const t = g.state.towers[0];
        t.heroXp = 1e9;
        return [t.heroLevel, g.state.abilities.map((a) => a.id)];
      });
      console.log(hero, 'vor Level-Up', JSON.stringify(lvl));
      for (let i = 0; i < 40; i++) {
        await page.evaluate(() => { const g = __dw.game; g.apply({ type: 'startRound' }); __dw.match.skip(40); for (const e of g.state.enemies.slice(0, 3)) g.sandbox.hurt(e.id, 1e9); });
        const L = await page.evaluate(() => __dw.game.state.towers[0].heroLevel);
        if (L >= 20) break;
      }
      console.log(hero, 'Level', await page.evaluate(() => [__dw.game.state.towers[0].heroLevel, __dw.game.state.abilities.map((a) => a.id)]));
      // Gegner in Reichweite der Heldin, danach je Faehigkeit ein Bild mitten im Effekt (Match wird nach K Ticks angehalten)
      await page.evaluate(() => {
        const g = __dw.game, h = g.state.towers[0], DATA = __dw.DATA;
        const keep = [];
        // Wegpunkte entlang des Weges (px) -> Fortschritt in Milli-px, nur dort spawnen, wo die Heldin sie erreicht
        const path = (DATA.maps.meadow.paths && DATA.maps.meadow.paths[0]) || DATA.maps.meadow.path;
        let acc = 0;
        for (let i = 1; i < path.length; i++) {
          const [ax, ay] = path[i - 1], [bx, by] = path[i];
          const len = Math.hypot(bx - ax, by - ay);
          for (let d = 0; d < len && keep.length < 7; d += 9) {
            const x = ax + ((bx - ax) * d) / len, y = ay + ((by - ay) * d) / len;
            if (Math.hypot(x - h.x / 1000, y - h.y / 1000) < 58) keep.push(g.sandbox.spawn('ironshell', Math.round((acc + d) * 1000)));
          }
          acc += len;
        }
        window.__keep = keep; window.__dbg = [keep.length, h.range, g.state.enemies.length];
      });
      console.log(hero, 'dbg', JSON.stringify(await page.evaluate(() => window.__dbg)));
      const rectOf = () => page.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
      const trigger = (ability, ticks) => page.evaluate(([a, k]) => {
        const g = __dw.game;
        for (const x of g.state.abilities) { x.ready = true; x.cdLeft = 0; }
        for (const e of g.state.enemies) e.hp = Math.max(e.hp, 400);
        const t0 = g.state.tick;
        const r = g.apply({ type: 'ability', ability: a });
        __dw.match.speed = 1;
        const loop = () => { if (g.state.tick >= t0 + k) { __dw.match.speed = 0; window.__frozen = true; } else requestAnimationFrame(loop); };
        window.__frozen = false;
        requestAnimationFrame(loop);
        return r;
      }, [ability, ticks]);
      const shotFx = async (name, cx, cy, w, hh) => {
        await page.waitForFunction(() => window.__frozen === true, null, { timeout: 15000 });
        await page.waitForTimeout(120);
        const rc = await rectOf();
        const k = rc.w / 640;
        const x = Math.max(rc.x, rc.x + (cx - w / 2) * k), y = Math.max(rc.y, rc.y + (cy - hh / 2) * k);
        await page.screenshot({ path: `${outDir}/${name}.png`, clip: { x, y, width: Math.min(w * k, rc.x + rc.w - x), height: Math.min(hh * k, rc.y + rc.h - y) } });
        await page.evaluate(() => { __dw.match.speed = 1; });
      };
      const heroPos = await page.evaluate(() => { const t = __dw.game.state.towers[0]; return [t.x / 1000, t.y / 1000]; });
      const plan = hero === 'bram' ? [['anvilDrop', 5, 'a'], ['anvilDrop', 14, 'b'], ['forgeOfDawn', 70, 'c']] : [['starfall', 1, 'a'], ['starfall', 6, 'b'], ['eclipse', 70, 'c']];
      for (const [ab, k, tag] of plan) {
        if (ab === 'forgeOfDawn') {
          await page.evaluate(() => { const g = __dw.game; const h = g.state.towers[0]; let n = 0; for (let py = 20; py < 345 && n < 5; py += 10) for (let px = 20; px < 625 && n < 5; px += 10) { if (Math.hypot(px - h.x / 1000, py - h.y / 1000) < 70 && Math.hypot(px - h.x / 1000, py - h.y / 1000) > 28 && g.canPlace('ranger', px * 1000, py * 1000).ok && g.apply({ type: 'place', tower: 'ranger', x: px * 1000, y: py * 1000 }).ok) { n++; px += 20; } } });
        }
        const res = await trigger(ab, k);
        console.log(hero, ab, k, JSON.stringify(res));
        await shotFx(`tp-match-${hero}-${ab}-${tag}`, ab === 'eclipse' ? 320 : heroPos[0], ab === 'eclipse' ? 180 : heroPos[1], ab === "eclipse" ? 640 : 300, ab === "eclipse" ? 360 : 200);
        // Cast-Pose der Figur (Held mitten im Bild) wird in den Bildern oben gezeigt
      }
      if (errs.length) { console.error(errs); code = 1; }
      await page.close();
    }
  } finally {
    await browser.close();
    stop();
  }
}
process.exit(code);
