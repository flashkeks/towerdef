// Runde 10 / P1: Screenshots der echten Namen: Sammlung nach Serie gefiltert (Naruto, One Piece, Dragon Ball, Legends of Earth),
// Unit-Detail mit echtem Namen, Standard-Banner, Promi-Banner "Legends of Earth" samt 10er-Zug.
// Braucht dist/ (npm run build). Schreibt client/docs/r10/p1-*.png. Port: SHOT_PORT (Standard 4492).
// Das Profil wird nach dem Starter-Geschenk im localStorage mit Units dieser Serien und Crystals aufgestockt (nur Testaufbau).
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4492);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r10');
mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(readFileSync(resolve(root, 'public/aa/manifest.json'), 'utf8')).units;
const SERIES = ['Naruto', 'One Piece', 'Dragon Ball', 'Legends of Earth'];
const ids = Object.entries(manifest).filter(([, e]) => SERIES.includes(e.series)).map(([id]) => id);
// eine Handvoll besessen (Rest grau, "not owned"), damit man beides sieht
const owned = ['kakashi', 'minato', 'goku_ssb', 'goku_ssj3', 'p_trump', 'p_musk', 'p_rock', 'p_merkel', 'p_messi'].filter((id) => manifest[id]);
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p1-${name}.png`) });
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(600);
  await page.evaluate(({ owned }) => {
    let best = null;
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) {
      const o = JSON.parse(localStorage.getItem(k));
      if (!best || o.rev > best.rev) best = o;
    }
    const p = best.profile;
    const book = (currency, delta) => {
      p.ledger.push({ id: `L9${String(p.ledger.length + 1).padStart(5, '0')}`, currency, delta, kind: 'grant', refType: 'test', refId: `r10p1-${currency}`, createdAt: '2026-10-08T00:00:00.000Z' });
      p.wallet[currency] += delta;
    };
    book('crystals', 4550);
    book('gold', 50000);
    owned.forEach((id, i) => (p.units[id] = { level: 3 + (i % 4), xp: 0, copies: 2, stars: 1, firstObtainedAt: '2026-10-08T00:00:00.000Z' }));
    for (const k of ['dw.meta.profile.a', 'dw.meta.profile.b']) localStorage.setItem(k, JSON.stringify({ app: 'dw-meta', rev: best.rev + 5, profile: p }));
  }, { owned });
  await page.evaluate(() => indexedDB.deleteDatabase('dw-meta'));
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');

  // Sammlung nach Serie
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile');
  const pick = async (series) => {
    await page.locator('select.unit-series').selectOption(series);
    await sleep(500);
  };
  await pick('Naruto');
  await page.locator('.unit-tile', { hasText: 'Kakashi Hatake' }).first().click();
  await sleep(400);
  await shot(page, 'collection-naruto');
  await pick('One Piece');
  await sleep(200);
  await shot(page, 'collection-onepiece');
  await pick('Dragon Ball');
  await page.locator('.unit-tile', { hasText: 'Super Saiyan Blue' }).first().click();
  await sleep(400);
  await shot(page, 'collection-dragonball');
  await shot(page, 'unit-detail-goku');
  await pick('Legends of Earth');
  await page.locator('.unit-tile', { hasText: 'Donald Trump' }).first().click();
  await sleep(400);
  await shot(page, 'collection-legends');
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');

  // Banner: Standard und Legends of Earth
  await page.locator('.lobby-summon').click();
  await page.waitForSelector('.banner-tab[data-banner="standard"]');
  await page.locator('.banner-tab[data-banner="standard"]').click();
  await sleep(500);
  await shot(page, 'banner-standard');
  await page.waitForSelector('.banner-tab[data-banner="legends"]');
  await page.locator('.banner-tab[data-banner="legends"]').click();
  await sleep(500);
  await shot(page, 'banner-legends');
  await page.waitForSelector('.pull-btn[data-count="10"]');
  await page.locator('.pull-btn[data-count="10"]').click();
  await page.waitForSelector('.reveal');
  await sleep(500);
  await page.mouse.click(800, 60);
  await page.waitForSelector('.reveal.finished');
  await sleep(400);
  await shot(page, 'legends-pull10');
  console.log('ok', ids.length, 'Units der Serien');
} finally {
  await browser.close();
  stop();
}
