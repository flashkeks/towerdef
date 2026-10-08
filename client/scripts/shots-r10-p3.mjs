// Runde 10 / P3: Beschwoeren, Pakete, Rueckmeldung (1600x900). Braucht dist/ (npm run build). Schreibt client/docs/r10/p3-*.png.
// Port: SHOT_PORT (Standard 4470), Ziel: SHOT_DIR. Alles ueber echte Klicks auf einem frischen Profil:
//  - "Daily Pack" = das Starter-Paket (12 Units + Crystals): Aufbau, verdeckte Karten, einzeln aufdecken, Rampenlicht, Uebersicht (p3-daily-*)
//  - echter 10er-Zug im Summon (Crystals ueber den Mock-Shop): Aufbau, verdeckte Karten, Enthuellung, Uebersicht (p3-10pull-*)
//  - Einzelzug, Level-Up-Stempel, Einstellungen mit Menue-Musik (p3-single-*, p3-levelup, p3-settings)
//  - Farbstufen des Aufbaus Blau -> Lila -> Gold -> Regenbogen und die Secret-Enthuellung mit einem festen Ergebnis ueber das Debug-Fenster
//    `window.__ui.openPrizes` (rechnet nichts, bucht nichts): p3-secret-*
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { closeReveal, launch, root, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4470);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r10');
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p3-${name}.png`) });
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/\/aa\/(units\/|index\.json)/.test(m.location()?.url ?? '')) errors.push(m.text());
  });
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  await sleep(1200);
  await shot(page, 'lobby');

  // ---- Daily Pack (Starter-Paket) durchgeklickt ------------------------------------------------------------------------
  await page.locator('.starter-claim').click();
  await page.waitForSelector('.reveal');
  await sleep(700);
  await shot(page, 'daily-1-charge');
  await page.mouse.click(800, 120); // Aufbau ueberspringen
  await page.waitForSelector('.reveal[data-phase="cards"]');
  await sleep(1200);
  await shot(page, 'daily-2-cards-face-down');
  const flip = async () => {
    await page.locator('.pk-card:not(.flipped)').first().click();
    await sleep(900);
    if (await page.locator('.rv-spot.in').count()) {
      await shot(page, 'daily-spotlight');
      await page.mouse.click(800, 450);
      await sleep(300);
    }
  };
  await flip();
  await shot(page, 'daily-3-first-flipped');
  await flip();
  await flip();
  await shot(page, 'daily-4-three-flipped');
  const n = await page.locator('.pk-card').count();
  // bis auf die letzten drei einzeln aufdecken, dann "Reveal all" fuer den Rest
  while ((await page.locator('.pk-card:not(.flipped)').count()) > 3) await flip();
  await shot(page, 'daily-5-last-three');
  await page.locator('.rv-all').click();
  await page.waitForSelector('.rv-summary', { timeout: 15000 });
  await sleep(1500);
  await shot(page, 'daily-6-summary');
  console.log(`Daily Pack: ${n} Karten einzeln aufgedeckt, Uebersicht ${await page.locator('.rv-sum-cell').count()}`);
  await page.locator('.reveal-done').click();
  await page.waitForSelector('.starter-card.done');
  await sleep(1500);
  await shot(page, 'daily-7-lobby-after');

  // ---- Crystals ueber den Mock-Shop, dann echter 10er-Zug -----------------------------------------------------------------
  await page.evaluate(async () => {
    const b = window.__ui.backend();
    const key = () => crypto.randomUUID();
    const cat = await b.shopCatalog();
    const sku = cat.products[cat.products.length - 1].sku;
    for (let i = 0; i < 3; i++) {
      const r = await b.buy(sku, key());
      if (r.ok && r.order.status === 'pending') await b.refreshOrder(r.order.orderId, key());
    }
  });
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-summon').click();
  await page.waitForSelector('.pull-btn[data-count="10"]');
  await sleep(1200);
  await shot(page, '10pull-0-summon');
  await page.locator('.pull-btn[data-count="10"]').click();
  await page.waitForSelector('.reveal');
  await sleep(450);
  await shot(page, '10pull-1-charge');
  await page.waitForSelector('.reveal.rumble', { timeout: 6000 }).catch(() => {});
  await sleep(250);
  await shot(page, '10pull-2-charge-rumble');
  await page.waitForSelector('.reveal[data-phase="cards"]', { timeout: 8000 });
  await sleep(1300);
  await shot(page, '10pull-3-cards-face-down');
  await page.locator('.pk-card:not(.flipped)').first().click();
  await sleep(900);
  await shot(page, '10pull-4-one-flipped');
  // einzeln durchklicken bis die letzte Karte (beste Seltenheit) das Rampenlicht oeffnet
  while ((await page.locator('.pk-card:not(.flipped)').count()) > 1) {
    await page.locator('.pk-card:not(.flipped)').first().click();
    await sleep(500);
    if (await page.locator('.rv-spot.in').count()) {
      await page.mouse.click(800, 450);
      await sleep(250);
    }
  }
  await page.locator('.pk-card:not(.flipped)').first().click();
  await sleep(1300);
  await shot(page, '10pull-5-reveal-best');
  await page.mouse.click(800, 450);
  await page.waitForSelector('.rv-summary', { timeout: 8000 });
  await sleep(1500);
  await shot(page, '10pull-6-summary');
  await page.locator('.reveal-done').click();
  await page.waitForSelector('.reveal', { state: 'detached' });

  // Einzelzug
  await page.locator('.pull-btn[data-count="1"]').click();
  await page.waitForSelector('.reveal');
  await sleep(700);
  await page.mouse.click(800, 120);
  await page.waitForSelector('.reveal[data-phase="single"]');
  await sleep(1400);
  await shot(page, 'single-reveal');
  await page.locator('.reveal-done').click();
  await page.waitForSelector('.reveal', { state: 'detached' });

  // ---- Feste Ergebnisse: Farbstufen und Secret ---------------------------------------------------------------------------------
  const secret = () =>
    page.evaluate(() => {
      const mk = (unitId, rarity, isNew, shiny) => ({ kind: 'unit', unitId, rarity, isNew, ...(shiny ? { shiny: true } : {}) });
      void window.__ui.openPrizes([mk('goku_ssj3', 'Mythic', true), mk('genos', 'Rare', true), mk('krillin', 'Epic', false), mk('jotaro', 'Legendary', true), mk('law', 'Rare', false), mk('luffy', 'Rare', true), mk('naruto', 'Secret', true, true), mk('ichigo', 'Epic', true), { kind: 'currency', currency: 'crystals', amount: 300 }, mk('tanjiro', 'Rare', false)]);
    });
  await secret();
  await sleep(350);
  await shot(page, 'secret-1-charge-blue');
  await sleep(750);
  await shot(page, 'secret-2-charge-purple');
  await sleep(750);
  await shot(page, 'secret-3-charge-gold');
  await sleep(850);
  await shot(page, 'secret-4-charge-rainbow-rumble');
  await page.waitForSelector('.reveal[data-phase="cards"]', { timeout: 8000 });
  await sleep(250);
  await shot(page, 'secret-5-burst');
  await sleep(1500);
  await shot(page, 'secret-6-cards');
  await page.locator('.pk-card:not(.flipped)').last().click();
  await sleep(1200);
  await shot(page, 'secret-7-reveal-shiny');
  await closeReveal(page);

  // ---- Menue: Level-Up-Stempel, Einstellungen -------------------------------------------------------------------------------------
  await page.evaluate(() => document.querySelector('.meta-head .menu-back')?.click());
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile[data-owned="true"]');
  await page.locator('.unit-tile[data-owned="true"]').first().click();
  await sleep(400);
  await page.evaluate(() => {
    // Gold fuer den Level-Up gibt es nur aus Matches: hier wird der Stempel direkt gezeigt (dieselbe Funktion wie nach einem echten Level-Up)
    window.__ui.celebrate?.({ kind: 'levelup', title: 'Level up!', sub: 'Jotaro reached level 2', ms: 4000 });
  });
  await sleep(900);
  await shot(page, 'levelup');
  await page.evaluate(() => document.querySelector('.meta-head .menu-back')?.click());
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-settings').click();
  await page.waitForSelector('.settings-grid');
  await sleep(600);
  await shot(page, 'settings-menu-music');

  console.log(errors.length ? `Fehler: ${errors.slice(0, 3).join(' | ')}` : 'keine Konsolenfehler');
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
  stop();
}
