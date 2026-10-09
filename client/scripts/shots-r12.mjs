// Bilder fuer Runde 12 (Reiter, Powers, Store, Ergebnis, Lautstaerke): npm run build && node scripts/shots-r12.mjs
// ?debug schaltet alles frei und haelt das Profil nur im Speicher. -> docs/r12/*.png
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r12');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve();
const browser = await launch();
const VIEW = { width: 1600, height: 900 };
let code = 0;
const errorsAll = [];

async function open(ctx, q = '?debug&seed=7', diff = 'medium') {
  const page = await ctx.newPage();
  errorsAll.push(watchErrors(page));
  await page.goto(url + q);
  await page.waitForSelector('.app-play', { timeout: 20000 });
  return page;
}
async function startMatch(page, diff = 'medium') {
  await page.click(`.diff[data-diff="${diff}"]`);
  await page.click('.app-play');
  await page.waitForSelector('.m-canvas', { timeout: 20000 });
  await page.waitForTimeout(500);
}
const placeAt = (page, type, i) => page.evaluate(([ty, k]) => {
  const g = __dw.game, pts = [];
  for (let y = 30; y < 340; y += 14) for (let x = 30; x < 620; x += 14) if (g.canPlace(ty, x * 1000, y * 1000).ok) pts.push([x, y]);
  const [x, y] = pts[Math.floor(pts.length * k)];
  return g.apply({ type: 'place', tower: ty, x: x * 1000, y: y * 1000 }).id;
}, [type, i]);

try {
  const ctx = await browser.newContext({ viewport: VIEW });

  // 1) Store: ein paar Embers geben, kaufen, Bild
  {
    const page = await open(ctx);
    await page.screenshot({ path: `${out}/startseite.png` });
    await page.click('.navbtn:has-text("Store")');
    await page.waitForSelector('.scard');
    await page.waitForTimeout(400);
    await page.click('.scard[data-power="lanternOil"] .sc-buy');
    await page.waitForTimeout(150);
    await page.click('.scard[data-power="instaWarden"] .sc-var[data-variant="frostcaller"]');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/store.png` });
    console.log('store ok, embers', await page.textContent('.chip.embers .ember-n'));
    await page.close();
  }

  // 2) Match: Reiter
  {
    const page = await open(ctx);
    await startMatch(page);
    await page.evaluate(() => __dw.game.sandbox.setCash(3000));
    await placeAt(page, 'ranger', 0.3); await placeAt(page, 'bombardier', 0.6); await placeAt(page, 'wren', 0.5);
    await page.evaluate(() => { const g = __dw.game; g.state.powers['goldDrop'] = 3; g.state.powers['lanternBomb'] = 2; g.state.powers['caltrops'] = 1; g.state.powers['frostTrap'] = 2; g.state.powers['timeWarp'] = 1; g.state.powers['extraLives'] = 1; g.state.powers['instaWarden:ranger'] = 1; g.state.powers['instaWarden:frostcaller'] = 2; g.state.powers['heroBoost'] = 1; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/reiter-towers.png` });
    await page.keyboard.press('Tab');
    await page.waitForSelector('.pw-slot');
    await page.waitForTimeout(200);
    // eine Power "benutzt": Gold Drop
    await page.click('.pw-slot[data-power="goldDrop"]');
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/reiter-powers.png` });
    await page.keyboard.press('Tab');
    await page.waitForSelector('.wv-row');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/reiter-wave.png` });
    // Wave-Reiter in einer Boss-Runde: Vorschau umstellen
    await page.evaluate(() => { __dw.game.state.round = 19; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/reiter-wave-boss.png` });
    await page.evaluate(() => { __dw.game.state.round = 0; });
    await page.close();
  }

  // 3) Einsatz: Bombe, Falle (Ziel, Vorschau, Wirkung)
  {
    const page = await open(ctx);
    await startMatch(page);
    await placeAt(page, 'ranger', 0.3);
    await page.evaluate(() => { const g = __dw.game; for (const k of ['lanternBomb', 'caltrops', 'frostTrap', 'timeWarp']) g.state.powers[k] = 3; });
    await page.keyboard.press('Tab');
    await page.waitForSelector('.pw-slot');
    const rect = await page.evaluate(() => { const r = document.querySelector('.m-canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const at = (mx, my) => [rect.x + (mx / 640) * rect.w, rect.y + (my / 360) * rect.h];
    // Falle auf dem Weg: Vorschau gruen
    await page.click('.pw-slot[data-power="frostTrap"]');
    await page.mouse.move(...at(70, 92));
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/power-falle-vorschau.png` });
    // Vorschau rot: neben dem Weg
    await page.mouse.move(...at(200, 170));
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/power-falle-rot.png` });
    await page.mouse.move(...at(70, 92));
    await page.mouse.click(...at(70, 92));
    await page.waitForTimeout(100);
    // Krahenfuesse
    await page.click('.pw-slot[data-power="caltrops"]');
    await page.mouse.move(...at(120, 200));
    await page.mouse.click(...at(120, 200));
    await page.waitForTimeout(500);
    // Runde starten, Gegner in die Fallen laufen lassen; Bombe zielen
    await page.keyboard.press(' ');
    await page.waitForFunction(() => __dw.game.state.enemies.length > 4, null, { timeout: 15000 });
    await page.waitForTimeout(2500);
    await page.click('.pw-slot[data-power="lanternBomb"]');
    const target = await page.evaluate(() => { const e = __dw.game.state.enemies[Math.floor(__dw.game.state.enemies.length / 2)] ?? __dw.game.state.enemies[0]; return [e.x / 1000, e.y / 1000]; });
    await page.mouse.move(...at(target[0], target[1]));
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${out}/power-bombe-ziel.png` });
    await page.mouse.click(...at(target[0], target[1]));
    await page.waitForTimeout(160);
    await page.screenshot({ path: `${out}/power-einsatz.png` });
    // Zeitblase
    await page.click('.pw-slot[data-power="timeWarp"]');
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/power-timewarp.png` });
    console.log('traps', await page.evaluate(() => JSON.stringify(__dw.game.state.traps.map((t) => [t.kind, t.charges]))));
    await page.close();
  }

  // 4) Ergebnis: eine Partie in Runde 3 verlieren/verlassen mit eingesetzter Power
  {
    const page = await open(ctx, '?debug&seed=3');
    await startMatch(page, 'easy');
    await page.evaluate(() => { const g = __dw.game; g.state.powers['goldDrop'] = 2; g.state.powers['extraLives'] = 1; g.apply({ type: 'power', power: 'goldDrop' }); g.apply({ type: 'power', power: 'extraLives' }); });
    await page.evaluate(() => {
      const g = __dw.game; g.sandbox.setCash(20000);
      for (let i = 0; i < 6; i++) {
        const pts = [];
        for (let y = 30; y < 340; y += 12) for (let x = 30; x < 620; x += 12) if (g.canPlace('ranger', x * 1000, y * 1000).ok) pts.push([x, y]);
        const [x, y] = pts[Math.floor(pts.length * (0.1 + i * 0.15))];
        const r = g.apply({ type: 'place', tower: i % 2 ? 'bombardier' : 'ranger', x: x * 1000, y: y * 1000 });
        for (let k = 0; k < 6; k++) for (const p of [0, 1, 2]) g.apply({ type: 'upgrade', towerId: r.id, path: p });
      }
      g.apply({ type: 'autoStart', on: true });
      g.apply({ type: 'startRound' });
      __dw.match.skip(60 * 150);
    });
    await page.keyboard.press('Escape');
    await page.waitForSelector('.m-overlay .m-quit');
    await page.click('.m-overlay .m-quit');
    await page.waitForSelector('.res-body', { timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('.result')?.dataset.done === '1', null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/ergebnis-embers.png` });
    console.log('embers', await page.textContent('.em-gain'), await page.textContent('.pw-used'));
    await page.close();
  }

  // 5) Lautstaerke: Match-Pop-over und Einstellungen
  {
    const page = await open(ctx);
    await startMatch(page);
    await page.click('.m-vol .vol-btn');
    await page.waitForSelector('.vol-pop:not(.hidden)');
    await page.fill('.vol-row[data-kind="music"] input', '25');
    await page.dispatchEvent('.vol-row[data-kind="music"] input', 'input');
    await page.fill('.vol-row[data-kind="sfx"] input', '0');
    await page.dispatchEvent('.vol-row[data-kind="sfx"] input', 'input');
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/lautstaerke.png` });
    await page.close();
  }
  const bad = errorsAll.flat();
  console.log('konsolenfehler:', JSON.stringify(bad));
  if (bad.length) code = 1;
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
  stop();
}
process.exit(code);
