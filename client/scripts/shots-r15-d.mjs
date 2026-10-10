// Bilder Runde 15b (Runden wie BTD6: 40/60/80, Freeplay): npm run build && node scripts/shots-r15-d.mjs [menu|setup|victory|freeplay|ships]
// Ergebnis: docs/r15/d-*.png. ?debug stellt window.__app und (im Match) window.__dw bereit.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r15');
mkdirSync(out, { recursive: true });
const only = process.argv.slice(2);
const want = (k) => only.length === 0 || only.includes(k);
const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4173));
const browser = await launch();
const VIEW = { width: 1280, height: 720 };
const errorsAll = [];

async function open(q = '?debug&seed=7') {
  const page = await browser.newPage({ viewport: VIEW });
  errorsAll.push(watchErrors(page));
  await page.goto(url + q);
  await page.waitForSelector('.maptile', { timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('.maptile canvas.pv').length === 3, null, { timeout: 60000 });
  return page;
}
async function startMatch(page, { map = 'meadow', diff = 'easy' } = {}) {
  await page.click(`.maptile[data-map="${map}"]`);
  await page.waitForSelector('.app-play');
  await page.click(`.diff[data-diff="${diff}"]`);
  await page.click('.app-play');
  await page.waitForSelector('.m-canvas', { timeout: 40000 });
  await page.waitForTimeout(500);
}
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const prof = (page, patch) => page.evaluate(async (pt) => { const s = __app.store; await s.update({ ...s.profile, ...pt }); }, patch);

if (want('menu') || want('setup')) {
  const page = await open();
  await prof(page, {
    medals: { meadow: { easy: true, medium: true, hard: false }, frostfen: { easy: true, medium: false, hard: false } },
    best: { meadow: { easy: { round: 40, livesLost: 12 }, medium: { round: 60, livesLost: 31 }, hard: { round: 47, livesLost: 100 } } },
    freeplayBest: { meadow: 73, frostfen: 44 },
  });
  await page.evaluate(() => __app.go({ name: 'home' }));
  await page.waitForSelector('.maptile');
  await page.waitForFunction(() => document.querySelectorAll('.maptile canvas.pv').length === 3, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  if (want('menu')) { await shot(page, 'd-kartenwahl'); console.log('menu'); }
  if (want('setup')) {
    await page.click('.maptile[data-map="meadow"]');
    await page.waitForSelector('.app-play');
    await page.waitForTimeout(300);
    await shot(page, 'd-setup');
    console.log('setup');
  }
  await page.close();
}

if (want('victory') || want('freeplay')) {
  const page = await open();
  await startMatch(page, { map: 'frostfen', diff: 'easy' });
  // Sprung zur Endrunde (Pruefhilfe), Gegner der Runde 40 laufen lassen und abraeumen
  await page.evaluate(() => {
    const g = __dw.game;
    g.sandbox.setCash(100000);
    g.state.lives = 100000;
    g.state.round = 39;
    g.apply({ type: 'startRound' });
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => { __dw.match.speed = 0; });
  await shot(page, 'd-endrunde-40');
  for (let i = 0; i < 400 && (await page.evaluate(() => __dw.game.state.phase)) !== 'won'; i++) {
    await page.evaluate(() => { for (const e of __dw.game.state.enemies.slice()) __dw.game.sandbox.hurt(e.id, 1e9); __dw.match.skip(30); });
  }
  await page.waitForSelector('.ov-box.won [data-act="freeplay"]', { timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, 'd-sieg-freeplay-knopf');
  console.log('victory');
  if (want('freeplay')) {
    await page.click('[data-act="freeplay"]');
    // Freeplay: R41 laeuft die Liste weiter; fuer das Bild springen wir hinter die Liste (R125, Formel)
    await page.evaluate(() => {
      __dw.match.speed = 1;
      __dw.game.state.round = 124;
      __dw.game.apply({ type: 'startRound' });
    });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { __dw.match.speed = 0; });
    await shot(page, 'd-freeplay-match');
    // Wellen-Vorschau im Freeplay
    await page.click('.tab[data-tab="wave"], [data-tab="wave"]').catch(() => {});
    await page.waitForTimeout(300);
    await shot(page, 'd-freeplay-vorschau');
    console.log('freeplay');
  }
  await page.close();
}

if (want('ships')) {
  const page = await open();
  await startMatch(page, { map: 'meadow', diff: 'hard' });
  await page.evaluate(() => {
    const g = __dw.game;
    g.sandbox.setCash(100000);
    g.state.lives = 100000;
    g.sandbox.spawn('cruiser', 220000);
    g.sandbox.spawn('duskrunner', 120000);
    g.sandbox.spawn('dreadnought', 40000, false, 0, { fortified: true });
    __dw.match.speed = 1;
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { __dw.match.speed = 0; });
  await shot(page, 'd-schiffe');
  console.log('ships');
  await page.close();
}

const errs = errorsAll.flat();
await browser.close();
stop();
if (errs.length) { console.error('Browser-Fehler:', errs.slice(0, 5)); process.exitCode = 1; }
