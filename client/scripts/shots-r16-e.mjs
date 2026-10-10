// Bilder Runde 16 E (Taegliche Challenge, Editor, Code): npm run build && node scripts/shots-r16-e.mjs
// Ergebnis: docs/r16/e-*.png. ?debug stellt window.__app und (im Match) window.__dw bereit.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, serve, watchErrors } from './lib-serve.mjs';

const out = resolve(root, 'docs/r16');
mkdirSync(out, { recursive: true });
const { url, stop } = await serve(Number(process.env.SMOKE_PORT ?? 4173));
const browser = await launch();
const VIEW = { width: 1280, height: 720 };
const errorsAll = [];
const shot = (page, name) => page.screenshot({ path: `${out}/e-${name}.png` });

async function open(q = '?debug&seed=7') {
  const page = await browser.newPage({ viewport: VIEW });
  errorsAll.push(watchErrors(page));
  await page.goto(url + q);
  await page.waitForSelector('.maptile, .challenges', { timeout: 20000 });
  return page;
}

// 1. Startseite mit Knopf, Hub
let page = await open();
await page.waitForTimeout(2500);
await page.waitForTimeout(300);
await shot(page, 'start');
await page.click('.navbtn:has-text("Challenges")');
await page.waitForSelector('.challenges .ch-name');
await page.waitForTimeout(500);
await shot(page, 'hub');

// 2. Code eingeben: kaputt, dann gueltig
await page.fill('.challenges .ch-code-row input', 'DW1-ABCDE-FGHJK');
await page.click('.ch-code-row button');
await page.waitForTimeout(150);
await shot(page, 'code-fehler');
console.log('err:', await page.textContent('.ch-err'));

// 3. Editor
await page.click('[data-act="create"]');
await page.waitForSelector('.ch-edit .ed-grid');
await page.waitForTimeout(400);
await shot(page, 'editor');
const fits = await page.evaluate(() => { const s = document.querySelector('.dw-screens'); const e = document.querySelector('.ch-edit'); return { screens: [s.scrollHeight, s.clientHeight], edit: [e.scrollHeight, e.clientHeight] }; });
console.log('editor fits', JSON.stringify(fits));
// Regeln setzen: nur 2 Tuerme, T3, kein Verkaufen, Start R10
await page.click('.ed-tile[data-tower="bombardier"]');
await page.click('.ed-tile[data-tower="frostcaller"]');
await page.click('.ed-tile[data-tower="longshot"]');
await page.click('.ed-tile[data-tower="market"]');
await page.click('.ed-tile[data-tower="thornweaver"]');
await page.click('.ed-col:nth-child(2) .card:last-child .seg button:has-text("T3")');
await page.click('.ed-sw:has-text("No selling")');
await page.click('.ed-sw:has-text("No powers")');
await page.fill('input[aria-label="Start round"]', '10');
await page.fill('input[aria-label="End round"]', '25');
await page.fill('input[aria-label="Starting gold"]', '4000');
await page.waitForTimeout(200);
await shot(page, 'editor-regeln');
const code = await page.inputValue('.ed-foot input');
console.log('code', code);

// Ungueltig
await page.fill('input[aria-label="End round"]', '5');
await page.waitForTimeout(100);
await shot(page, 'editor-fehler');
await page.fill('input[aria-label="End round"]', '25');

// 4. Test play -> Match
await page.click('[data-act="test-play"]');
await page.waitForSelector('.m-canvas', { timeout: 40000 });
await page.waitForTimeout(800);
await shot(page, 'match-chip');
// Sperren: Longshot-Karte, Verkaufsknopf
const locked = await page.evaluate(() => [...document.querySelectorAll('.m-card')].map((c) => [c.querySelector('.m-card-n')?.textContent, c.classList.contains('locked')]));
console.log('cards', JSON.stringify(locked));
await page.evaluate(() => { const g = __dw.game; const p = (() => { for (let y = 40000; y < 340000; y += 10000) for (let x = 40000; x < 600000; x += 10000) if (g.canPlace('ranger', x, y).ok) return { x, y }; })(); const r = g.apply({ type: 'place', tower: 'ranger', x: p.x, y: p.y }); __dw.match.select(r.id); });
await page.waitForTimeout(500);
await shot(page, 'match-gesperrt');
const sellRes = await page.evaluate(() => { const g = __dw.game; return g.apply({ type: 'sell', towerId: g.state.towers[0].id }); });
console.log('sell', JSON.stringify(sellRes));

// 5. Ergebnis: Sieg erzwingen
await page.evaluate(() => { const g = __dw.game; g.sandbox.setCash(100000); g.state.lives = 100000; });
for (let i = 0; i < 3000 && (await page.evaluate(() => __dw.game.state.phase)) !== 'won'; i++) {
  await page.evaluate(() => { const g = __dw.game; if (g.state.enemies.length === 0 && g.state.groups.length === 0 && g.state.phase !== 'won') g.apply({ type: 'startRound' }); for (const e of g.state.enemies.slice()) g.sandbox.hurt(e.id, 1e9); __dw.match.skip(30); });
}
console.log('phase', await page.evaluate(() => [__dw.game.state.phase, __dw.game.state.round, __dw.game.info.maxRound]));
await page.waitForSelector('.ov-box.won', { timeout: 5000 });
console.log('freeplay button:', await page.locator('[data-act="freeplay"]').count());
await shot(page, 'match-sieg');
await page.click('[data-act="finish"]');
await page.waitForSelector('.challenge-result', { timeout: 10000 });
await page.waitForTimeout(300);
await shot(page, 'ergebnis');
await page.close();

// 6. Link mit Code
page = await open('?debug&seed=7&challenge=' + encodeURIComponent(code));
await page.waitForSelector('.challenges .ch-name');
await page.waitForTimeout(600);
await shot(page, 'link-code');
await page.close();
page = await open('?debug&seed=7&challenge=DW1-KAPUTT');
await page.waitForSelector('.challenges .ch-name');
console.log('link err:', await page.textContent('.ch-err'));
await shot(page, 'link-fehler');
await page.close();

const errs = errorsAll.flat();
await browser.close();
stop();
if (errs.length) { console.error('Browser-Fehler:', errs.slice(0, 5)); process.exitCode = 1; }
