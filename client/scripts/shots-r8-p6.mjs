// Runde 8 / P6: Screenshots der Crossover-Figuren: Banner im Summon, Sammlung + Detail, Match mit Crossover-Figuren.
// Braucht dist/ (npm run build). Schreibt client/docs/r8/p6-*.png. Port: SHOT_PORT (Standard 4446).
// Das Profil wird nach dem Starter-Geschenk im localStorage mit allen 25 Crossover-Figuren und Crystals aufgestockt (nur Testaufbau).
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4446);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r8');
mkdirSync(OUT, { recursive: true });
const ids = JSON.parse(readFileSync(resolve(root, '../sim/data/units/crossover.json'), 'utf8')).units.map((u) => u.id);
const TEAM = ['x_rick', 'x_shrek', 'x_ironman', 'x_gandalf', 'x_wick', 'x_pikachu'];
const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(600);
  // Summon: Crossover-Banner
  await page.locator('.lobby-summon').click();
  await page.waitForSelector('.banner-tab[data-banner="crossover"]');
  await page.locator('.banner-tab[data-banner="crossover"]').click();
  await sleep(500);
  await page.screenshot({ path: resolve(OUT, 'p6-summon-crossover.png') });
  // Profil aufstocken
  await page.evaluate(({ ids, team }) => {
    let best = null;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) {
      const o = JSON.parse(localStorage.getItem(k));
      if (!best || o.rev > best.rev) best = o;
    }
    const p = best.profile;
    const book = (currency, delta) => {
      p.ledger.push({ id: `L9${String(p.ledger.length + 1).padStart(5, '0')}`, currency, delta, kind: 'grant', refType: 'test', refId: `p6-${currency}`, createdAt: '2026-10-07T00:00:00.000Z' });
      p.wallet[currency] += delta;
    };
    book('crystals', 4550);
    book('gold', 50000);
    for (const id of ids) p.units[id] = { level: 3, xp: 0, copies: 2, stars: 1, firstObtainedAt: '2026-10-07T00:00:00.000Z' };
    p.team = team;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) localStorage.setItem(k, JSON.stringify({ app: 'dw-meta', rev: best.rev + 5, profile: p }));
  }, { ids, team: TEAM });
  await page.evaluate(() => indexedDB.deleteDatabase('dw-meta'));
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-summon').click();
  await page.waitForSelector('.banner-tab[data-banner="crossover"]');
  await page.locator('.banner-tab[data-banner="crossover"]').click();
  await page.waitForSelector('.pull-btn[data-count="10"]');
  await page.locator('.pull-btn[data-count="10"]').click();
  await page.waitForSelector('.reveal');
  await sleep(500);
  await page.mouse.click(800, 60);
  await page.waitForSelector('.reveal.finished');
  await sleep(400);
  await page.screenshot({ path: resolve(OUT, 'p6-summon-10pull.png') });
  await page.locator('.reveal-done').click();
  await page.waitForSelector('.reveal', { state: 'detached' });
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  // Sammlung + Detail
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile');
  const tile = page.locator('.unit-tile', { hasText: 'Rick Astley' }).first();
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
  await sleep(400);
  await page.screenshot({ path: resolve(OUT, 'p6-units-detail-rick.png') });
  await page.locator('.unit-tile', { hasText: 'Iron Man' }).first().click();
  await sleep(300);
  await page.screenshot({ path: resolve(OUT, 'p6-units-detail-ironman.png') });
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  // Match
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card, .diff');
  if (await page.locator('.act-card').first().isVisible().catch(() => false)) await page.locator('.act-card').first().click();
  await page.waitForSelector('.diff[data-difficulty="normal"]:not([disabled])');
  await page.locator('.diff[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  const placed = await buildTeam(page, { units: [...TEAM, 'x_rick', 'x_shrek'], level: 3 });
  console.log('Units gesetzt', placed);
  await fastForward(page, 6);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.apply(0, { type: 'skipWave' });
    s.setSpeed(1);
  });
  await sleep(2200);
  await page.screenshot({ path: resolve(OUT, 'p6-match-crossover.png') });
} finally {
  await browser.close();
  stop();
}
