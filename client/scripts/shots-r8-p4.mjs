// Runde 8 / P4: Screenshots des neuen Interface (Lobby, Summon, Enthuellung Mythic/Secret, 10er-Uebersicht, Sammlung, Detail, Match-HUD).
// Braucht dist/ (npm run build). Schreibt client/docs/r8/p4-*.png. Port: SHOT_PORT (Standard 4443). SHOT_DIR aendert das Ziel.
// Echte Daten (550 AA-Units aus sim/data/units/aa.json). Der Fortschritt wird teils ueber das Backend im Browser vorbereitet (`window.__ui.backend()`:
// Mock-Kauf fuer Crystals, Zuege fuer Units), das Fotografieren laeuft ueber echte Klicks.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, fastForward, launch, root, sleep, startServer, closeReveal } from './lib/drive.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4443);
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r8');
mkdirSync(OUT, { recursive: true });
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p4-${name}.png`) });
try {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('.lobby:not(.loading)');
  await sleep(1200);
  await shot(page, 'lobby-fresh');
  await page.locator('.starter-claim').click();
  await closeReveal(page);
  await page.waitForSelector('.starter-card.done');
  // Vorbereitung ueber das Backend: Crystals (Mock-Shop) und ein paar Zuege, damit die Sammlung gefuellt ist und Evolution/Trait zu sehen sind
  const prep = await page.evaluate(async () => {
    const b = window.__ui.backend();
    const key = () => crypto.randomUUID();
    const cat = await b.shopCatalog();
    const sku = cat.products[cat.products.length - 1].sku;
    for (let i = 0; i < 4; i++) {
      const r = await b.buy(sku, key());
      if (r.ok && r.order.status === 'pending') await b.refreshOrder(r.order.orderId, key());
    }
    let pulls = 0;
    for (let i = 0; i < 12; i++) {
      const v = await b.bannerViews();
      const std = v.views.find((x) => x.kind === 'standard');
      const r = await b.pull(std.bannerId, 10, key());
      if (!r.ok) break;
      pulls++;
    }
    const pv = await b.playerView();
    return { pulls, owned: pv.player.ownedCount, crystals: pv.player.crystals };
  });
  console.log('Vorbereitung', JSON.stringify(prep));
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await sleep(1800);
  await shot(page, 'lobby');

  // Summon
  await page.locator('.lobby-summon').click();
  await page.waitForSelector('.pull-btn[data-count="10"]');
  await sleep(1500);
  await shot(page, 'summon');

  // Enthuellung mit echtem 10er-Zug
  await page.locator('.pull-btn[data-count="10"]').click();
  await page.waitForSelector('.reveal');
  await sleep(700);
  await shot(page, 'reveal-gate');
  await page.mouse.click(800, 60);
  await page.waitForSelector('.reveal.finished');
  await sleep(600);
  await shot(page, 'pull10');
  await sleep(350);
  await page.locator('.reveal-done').click();

  // Mythic und Secret ueber den Debug-Zugriff (gibt es im Zufallszug selten)
  const ids = await page.evaluate(() => [...document.querySelectorAll('.hist-item')].length);
  console.log('Verlauf', ids);
  for (const [rarity, id] of [['mythic', 'goku_ssj3'], ['secret', 'ichigo']]) {
    await page.evaluate(([r, u]) => {
      window.__ui.openReveal({ pulls: [{ unitId: u, rarity: r, isNew: true }] });
    }, [rarity, id]);
    await page.waitForSelector('.rv-spot.in', { timeout: 8000 });
    await sleep(900);
    await shot(page, `reveal-${rarity}`);
    await page.mouse.click(800, 60);
    await sleep(500);
    await page.mouse.click(800, 60);
    await page.waitForSelector('.reveal', { state: 'detached' });
  }
  await page.evaluate(() => {
    const u = ['ichigo', 'goku_ssj3', 'krillin', 'monet', 'emilia', 'stain', 'ichigo', 'goku_ssj3', 'monet', 'ichigo'];
    const r = ['rare', 'epic', 'mythic', 'rare', 'legendary', 'rare', 'secret', 'epic', 'rare', 'mythic'];
    window.__ui.openReveal({ pulls: u.map((unitId, i) => ({ unitId, rarity: r[i], isNew: i % 3 === 0 })) });
  });
  await page.waitForSelector('.reveal');
  await sleep(300);
  await page.mouse.click(800, 60);
  await page.waitForSelector('.reveal.finished');
  await sleep(900);
  await shot(page, 'pull10-mix');
  await sleep(350);
  await page.locator('.reveal-done').click();

  // Sammlung
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile');
  await sleep(1000);
  await shot(page, 'collection');
  console.log('Karten im DOM', await page.locator('.unit-tile').count(), 'von', await page.locator('.unit-grid').getAttribute('data-count'));
  console.log('Seltenheits-Chips', await page.locator('.filter-btn[data-group="rarity"]').count() - 1);
  // eine besessene Unit mit Evolution und Trait suchen (Detail zeigt Kosten, Zutaten, Reroll)
  const owned = page.locator('.unit-tile[data-owned="true"]');
  const n = await owned.count();
  let found = false;
  for (let i = 0; i < n && !found; i++) {
    await owned.nth(i).click();
    await sleep(120);
    found = (await page.locator('.ud-evolve').count()) > 0;
  }
  console.log('Detail mit Evolution gefunden:', found);
  await sleep(300);
  await page.locator('.unit-detail').evaluate((e) => (e.scrollTop = 250));
  await shot(page, 'unit-detail');
  if (!(await page.locator('.ud-reroll').isDisabled())) {
    await page.locator('.ud-reroll').click();
    await sleep(350);
    await shot(page, 'unit-reroll');
    await page.waitForSelector('.ud-trait-badge.has', { timeout: 6000 }).catch(() => {});
    await sleep(500);
    await page.locator('.unit-detail').evaluate((e) => (e.scrollTop = 250));
    await shot(page, 'unit-detail-trait');
  }
  await page.locator('.filter-btn[data-group="rarity"][data-value="secret"]').click();
  await page.locator('.unit-sort').selectOption('dps');
  await page.locator('.vgrid').evaluate((e) => (e.scrollTop = 600));
  await sleep(700);
  await shot(page, 'collection-filtered');

  // Team, Stufen
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-team').click();
  await page.waitForSelector('.team-slot');
  // Nach dem Zug kann das Team unvollstaendig sein (Ziel = min(6, Besitz)): auffuellen und speichern
  for (let i = 0; i < 8 && (await page.locator('.team-save').isDisabled()); i++) {
    await page.locator('.team-pick .unit-tile:not(.picked)').first().click();
    await sleep(150);
  }
  await sleep(500);
  await shot(page, 'team');
  await page.locator('.team-save').click();
  await sleep(400);
  await page.locator('.meta-head .menu-back').click();
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  await sleep(700);
  await shot(page, 'world');
  await page.locator('.act-card[data-stage="greenie-1"]').click();
  await page.waitForSelector('.stage-card');
  await sleep(500);
  await shot(page, 'stage');
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  await page.evaluate(() => localStorage.setItem('dw.hints', JSON.stringify({ off: true })));
  const placed = await buildTeam(page, { units: ['goku_ssj3', 'goku_ssj3', 'monet', 'ichigo', 'krillin'], level: 2 });
  console.log('gesetzt', placed);
  await fastForward(page, 9);
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.apply(0, { type: 'skipWave' });
    s.setSpeed(1);
    const u = s.sim.state.units.find((x) => x.defId === 'goku_ssj3') ?? s.sim.state.units[0];
    s.selectedUnit = u.id;
  });
  await sleep(1200);
  await shot(page, 'match-hud');
  console.log('Fehler:', errors);
} finally {
  await browser.close();
  stop();
}
