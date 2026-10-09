// Leistungsprobe: Bot bis Runde N, dann 3x Tempo; misst Bildzeiten (rAF) und Zahl der Pixi-Texturen.
// Aufruf: npm run build && node scripts/perf-r11-p3.mjs [runde=18]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';
const target = Number(process.argv[2] ?? 18);
const { url, stop } = await serve(4188);
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
const errors = watchErrors(page);
await page.goto(url + '?debug&diff=medium&seed=5');
await page.waitForSelector('.m-canvas');
await page.addScriptTag({ content: readFileSync(resolve(root, 'scripts/bot-page.js'), 'utf8') });
await page.evaluate((n) => window.__bot(n), target - 1);
await page.evaluate(() => { __dw.game.sandbox?.setCash?.(99999); __dw.match.setSpeed(3); __dw.game.apply({ type: 'startRound' }); });
await page.evaluate(() => { __dw.match.perf.length = 0; });
const res = await page.evaluate(() => new Promise((done) => {
  const dts = []; let last = performance.now(); let maxEn = 0;
  const t0 = last;
  const loop = (n) => {
    dts.push(n - last); last = n; maxEn = Math.max(maxEn, __dw.game.state.enemies.length);
    if (n - t0 < 6000) requestAnimationFrame(loop); else {
      dts.sort((a, b) => a - b);
      done({ frames: dts.length, medianMs: dts[dts.length >> 1], p95Ms: dts[Math.floor(dts.length * 0.95)], maxMs: dts[dts.length - 1], maxEnemies: maxEn, round: __dw.game.state.round });
    }
  };
  requestAnimationFrame(loop);
}));
const pf = await page.evaluate(() => { const a = __dw.match.perf; const avg = (i) => +(a.reduce((x, r) => x + r[i], 0) / a.length).toFixed(2); return { simMs: avg(0), syncMs: avg(1), renderMs: avg(2), stepsPerFrame: avg(3) }; });
console.log(JSON.stringify(pf));
console.log(JSON.stringify(res), errors.length ? errors : 'keine Fehler');
stop(); await browser.close(); process.exit(0);
