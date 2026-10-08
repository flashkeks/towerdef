// Smoke-Test: baut nichts, startet `vite preview` auf dem vorhandenen dist/ und treibt es mit Playwright (Chromium).
// Je Aufloesung (1280x720, 1920x1080, 2560x1440) wird eine ganze Stage (Act 1 der ersten Welt, Normal) nur mit echten Mausklicks
// (`page.mouse.click` auf aus dem Layout berechnete Koordinaten) und Tastatur gespielt, bis Sieg oder Niederlage.
// Runde 6 (freie Platzierung): geklickt wird auf FREIE POSITIONEN im Feld. Die Stellen kommen lesend aus `placementGrid`/`canPlace`
// der Sim (`scripts/lib/mouse.mjs`), umgerechnet ueber das Kartenmass (Canvas-Breite / 17 Kacheln). `evaluate` liest nur Zustand
// (zum Planen und Pruefen, auch den Geist `session.ghost()`), loest nie eine Spielaktion aus.
// Runde 7 (P4): VOR dem Match der ganze Meta-Kreislauf mit echten Mausklicks: neues Profil -> Lobby -> Starter-Geschenk -> 10er-Zug (Enthuellung,
// Ratentabelle, Pity) -> Team aus der Sammlung -> Stage Normal (gesperrte Stufen mit Grund) -> Match -> Belohnung -> Lobby -> Unit leveln ->
// zweites Match mit den Level-Mods (Replay wird ans Profil gebunden) -> SEITE NEU LADEN -> Salden, Sammlung, Pity noch da. Nur bei 1280x720
// zusaetzlich Export (Download) -> Reset (mit Bestaetigung) -> Import (Dateiwahl) -> derselbe Stand; Ladefehler und Speicher-Warnung in eigenen Seiten.
// Voll gespielt wird nur 1280x720 (SMOKE_FULL=1920x1080,... fuer mehr); die anderen Aufloesungen spielen nach dem Meta-Kreislauf ein kurzes Match
// (Ruf aller Wellen ohne Verteidigung = schnelle Niederlage, zahlt trotzdem Gold und XP), damit die Laufzeit im Rahmen bleibt.
// Dazu: Klick auf den Pfad zeigt Toast mit Grund, falsche Zone, Rand, Ueberlappung, Shift+Klick, Rechtsklick/Esc, Mobil-Sperre.
// Umgebung: SMOKE_PORT (Standard 4173), SMOKE_RES=1280x720,... (Auswahl), SMOKE_MAX_S (Zeitlimit je Stage, Standard 900).
// Aufruf: npm run build && npm run smoke   (Chromium-Pfad: PLAYWRIGHT_BROWSERS_PATH bzw. SMOKE_CHROMIUM)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { clickWorld, readGhost, readPathPoint, readSpots, worldToScreen } from './lib/mouse.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = resolve(root, 'docs', 'r10');
mkdirSync(docs, { recursive: true });
const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const URL_ = `http://127.0.0.1:${PORT}/`;
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) failures.push(msg);
};

if (!existsSync(resolve(root, 'dist/index.html'))) {
  console.error('dist/ fehlt: erst `npm run build`.');
  process.exit(2);
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
// npx startet vite als Kind: die ganze Prozessgruppe beenden, sonst bleibt der Preview-Server haengen
const stopServer = () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    /* schon weg */
  }
};
process.on('exit', stopServer);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(URL_);
      if (r.ok) return;
    } catch {
      /* noch nicht oben */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('vite preview startet nicht');
}

async function launch() {
  // Keine GL-Flags: mit erzwungenem ANGLE/SwiftShader liefert der Screenshot ein leeres Canvas (Kompositor-Artefakt, Canvas selbst ist intakt).
  const args = [];
  try {
    return await chromium.launch({ args });
  } catch (e) {
    const exe = process.env.SMOKE_CHROMIUM ?? '/opt/pw-browsers/chromium';
    console.log(`Standard-Chromium nicht startbar, nehme ${exe}`);
    return await chromium.launch({ executablePath: exe, args });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


// SMOKE_ONLY=sweep: nur den Interaktions-Durchgang (schneller Lauf beim Arbeiten an Knoepfen)
const ONLY = process.env.SMOKE_ONLY ?? '';
const RESOLUTIONS = ONLY ? [] : (process.env.SMOKE_RES ?? '1280x720,1920x1080,2560x1440').split(',').map((r) => r.split('x').map(Number));
const MAX_STAGE_S = Number(process.env.SMOKE_MAX_S ?? 900);
const FULL = (process.env.SMOKE_FULL ?? '1280x720').split(',');
const shotDir = docs;

/**
 * Spielplan: Reihenfolge der Units. Runde 8: das Starter-Team besteht aus allen Rare/Epic des Katalogs plus Goku SSJ3 (Mythic, Huegel);
 * nur Goku haelt in AA-Werten die Stage, die Rares sind fuer Tooltips, Toasts und Tests da. Plan: Goku, so oft es passt.
 */
const PLAN = ['goku_ssj3', 'goku_ssj3', 'goku_ssj3', 'goku_ssj3', 'goku_ssj3', 'goku_ssj3', 'goku_ssj3', 'goku_ssj3'];

async function playStage(browser, [W, H]) {
  const tag = `${W}x${H}`;
  const log = (m) => console.log(`[${tag}] ${m}`);
  const ok = (cond, msg) => check(cond, `${tag}: ${msg}`);
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    // fehlende Portrait-Bilder (/aa/units/...) sind erwartet: lokal liegen keine, die UI faellt auf die Ersatzkarte zurueck
    if (m.type() === 'error' && !/\/aa\/(units\/|index\.json)/.test(m.location()?.url ?? '')) errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    if (!/\/aa\/(units\/|index\.json)/.test(r.url())) errors.push(`requestfailed: ${r.url()}`);
  });

  // ---- Lesen (kein Spielen): Zustand fuer Planung und Pruefung ----------------------------------------------------
  const snap = () =>
    page.evaluate(() => {
      const s = window.__duskwardens?.session();
      if (!s) return null;
      const st = s.sim.state;
      const cat = s.sim.catalog();
      return {
        tick: st.tick, wave: st.wave, phase: st.phase, over: s.over, result: st.result, lives: st.lives, maxLives: st.maxLives,
        coins: st.players[0].coins, enemies: st.enemies.length, kills: st.stats.kills, placing: s.placing, selected: s.selectedUnit, paused: s.paused, speed: s.speed,
        units: st.units.map((u) => ({ id: u.id, def: u.defId, level: u.level, x: u.x, y: u.y, up: s.sim.upgradeCost(u.id) })),
        defs: Object.fromEntries(cat.map((d) => [d.id, { cost: d.placeCost, placement: d.placement, footprint: d.footprint, maxLevel: d.maxLevel }])),
        order: [...document.querySelectorAll('.unit-btn')].map((b) => b.dataset.unit),
      };
    });
  const toastText = async () => {
    const t = page.locator('.toast:not(.hidden)');
    return (await t.count()) ? ((await t.first().textContent()) ?? '') : '';
  };

  // ---- Handeln (nur Maus und Tastatur) ----------------------------------------------------------------------------
  const center = async (selector) => {
    await page.locator(selector).first().scrollIntoViewIfNeeded().catch(() => {}); // nur Layout: Elemente in Scroll-Bereichen sichtbar machen
    const b = await page.locator(selector).first().boundingBox();
    if (!b) throw new Error(`kein Layout fuer ${selector}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const clickSel = async (selector, opts) => {
    const c = await center(selector);
    await page.mouse.move(c.x, c.y);
    await page.mouse.click(c.x, c.y, opts);
  };
  const clickAt = (x, y, opts) => clickWorld(page, x, y, opts);
  /** Klick auf eine gesetzte Unit (Mitte). */
  const clickUnit = (u, opts) => clickWorld(page, u.x, u.y, opts);
  const press = (k) => page.keyboard.press(k);
  /** Eine verdeckte Karte per Mausklick aufdecken; ein Rampenlicht (ab Legendary) danach per Klick schliessen. */
  const flipOne = async () => {
    const n = await page.locator('.pk-card.flipped').count();
    await clickSel('.pk-card:not(.flipped)');
    await sleep(350);
    if (await page.locator('.rv-spot.in').count()) {
      await page.mouse.click(W / 2, H / 2);
      await sleep(250);
    }
    return (await page.locator('.pk-card.flipped').count()) - n;
  };
  const pickKey = async (def, s) => {
    await press(String(s.order.indexOf(def) + 1));
    await sleep(250); // die Seitenleiste aendert beim Waehlen die Breite (Brett verschiebt sich): erst danach klicken
  };

  const full = FULL.includes(tag);
  const shot = (name) => (W === 1280 ? page.screenshot({ path: resolve(shotDir, `p3-smoke-${name}.png`) }) : Promise.resolve());
  const text = async (selector) => ((await page.locator(selector).first().textContent().catch(() => '')) ?? '').trim();
  const wallet = () =>
    page.evaluate(() => {
      const w = document.querySelector('.wallet');
      return w ? { crystals: Number(w.dataset.crystals), gold: Number(w.dataset.gold), level: Number(w.dataset.level) } : null;
    });
  const waitWallet = async (pred, what) => {
    try {
      await page.waitForFunction((src) => {
        const w = document.querySelector('.wallet');
        return !!w && new Function('w', `return ${src}`)({ crystals: Number(w.dataset.crystals), gold: Number(w.dataset.gold), level: Number(w.dataset.level) });
      }, pred, { timeout: 5000 });
    } catch {
      /* die Pruefung danach meldet den Ist-Wert */
    }
    return wallet();
  };
  /** Navigation innerhalb der Meta-Bildschirme, immer mit der Maus. */
  const toLobby = async () => {
    if (!(await page.locator('.lobby:not(.loading)').count())) await clickSel('.meta-head .menu-back');
    await page.waitForSelector('.lobby:not(.loading)');
  };
  const go = async (what) => {
    await toLobby();
    await clickSel(`.lobby-${what}`);
  };
  /** Rushmatch: gar nichts bauen (oder nur eine Unit) und alle Wellen rufen = schnelle Niederlage. */
  const rush = async (placeFirst) => {
    await clickSel('.btn.speed[data-speed="3"]');
    if (placeFirst) {
      const s0 = await snap();
      const unit = ['jotaro', 'law'].find((u) => s0.order.includes(u));
      const spots = await readSpots(page, unit, 2);
      await pickKey(unit, s0);
      await clickAt(...spots[0]);
      await sleep(120);
    }
    const t1 = Date.now();
    while (!(await snap()).over && Date.now() - t1 < 300000) {
      await press('n');
      await sleep(120);
    }
  };
  const readCollection = () =>
    page.evaluate(() => [...document.querySelectorAll('.unit-tile')].map((e) => `${e.dataset.unit}:${e.dataset.owned}:${e.querySelector('.ut-sub')?.textContent}`));

  await page.goto(URL_);
  await page.waitForSelector('.lobby:not(.loading)');
  ok((await page.title()) === 'Duskwardens', `Titel = Duskwardens (ist: ${await page.title()})`);

  // ---- Lobby (neues Profil) -------------------------------------------------------------------------------------------
  ok((await page.locator('.lobby-btn').count()) === 6, 'Lobby: Play, Summon, Units, Team, Shop, Settings');
  ok(await page.locator('.testbuild').isVisible(), `Hinweis "Test build, progress is stored in this browser only" sichtbar: "${await text('.testbuild')}"`);
  ok((await page.locator('.memory-warning').count()) === 0, 'kein Warnhinweis, solange der Browser speichert');
  ok(await page.locator('.starter-claim').isVisible(), 'Starter-Geschenk als sichtbarer Knopf');
  let w = await wallet();
  ok(w && w.crystals === 0 && w.gold === 0 && w.level === 1, `neues Profil: 0 Crystals, 0 Gold, Level 1 (${JSON.stringify(w)})`);
  ok(await page.locator('.lobby-play').isDisabled(), 'Play gesperrt, solange es keine Units gibt');
  await clickSel('.starter-claim');
  await page.waitForSelector('.reveal');
  ok((await page.locator('.reveal[data-phase="charge"]').count()) === 1 && (await page.locator('.rv-portal').count()) === 1, 'Starter-Paket: Aufbau mit Portal laeuft');
  await page.mouse.click(W / 2, 120); // Klick ueberspringt den Aufbau
  await page.waitForSelector('.reveal[data-phase="cards"]');
  const starterN = await page.locator('.pk-card').count();
  ok(starterN >= 7 && (await page.locator('.pk-card.flipped').count()) === 0, `Starter-Paket: ${starterN} Karten verdeckt (Crystals + Units)`);
  // Fehler aus Runde 9: nur der erste Gewinn war zu sehen. Jetzt deckt jeder Klick genau EINE Karte auf.
  await flipOne();
  ok((await page.locator('.pk-card.flipped').count()) === 1 && (await page.locator('.rv-count').textContent())?.includes(`${starterN - 1} of ${starterN}`), `Starter-Paket: ein Klick = eine Karte (aufgedeckt 1 von ${starterN})`);
  await flipOne();
  await press('Space'); // naechste verdeckte Karte per Taste
  await sleep(200);
  ok((await page.locator('.pk-card.flipped').count()) === 3, 'Starter-Paket: zweiter Klick und Leertaste decken je eine weitere auf (3)');
  ok((await page.locator('.rv-summary').count()) === 0, 'Starter-Paket: Uebersicht erst, wenn alles offen ist');
  await clickSel('.rv-all');
  await page.waitForSelector('.rv-summary', { timeout: 15000 });
  ok((await page.locator('.rv-sum-cell').count()) === starterN && (await page.locator('.rv-sum-cell.r-mythic').count()) >= 1, `Starter-Paket: Uebersicht zeigt alle ${starterN} Gewinne (auch der Mythic)`);
  await sleep(900);
  await shot('starter-summary');
  await clickSel('.reveal-done');
  await page.waitForSelector('.reveal', { state: 'detached' });
  await page.waitForSelector('.starter-card.done');
  w = await waitWallet('w.crystals === 450');
  ok(w.crystals === 450, `Starter-Geschenk: 450 Crystals (${w.crystals})`);
  ok((await page.locator('.starter-units .strip-unit').count()) >= 5 && (await page.locator('.team-strip .strip-unit').count()) === 6, 'Starter-Units und Team (6) in der Lobby sichtbar');
  ok(!(await page.locator('.lobby-play').isDisabled()), 'Play frei nach dem Geschenk');
  await shot('lobby');

  // ---- Summon: Raten sichtbar, Pity auf dem Knopf, 10er-Zug mit Enthuellung ------------------------------------------------
  await go('summon');
  await page.waitForSelector('.pull-btn[data-count="10"]');
  ok(await page.locator('.rates-table').isVisible(), 'Ratentabelle direkt auf dem Bildschirm sichtbar (nichts aufzuklappen)');
  const rates = await page.locator('.rates-table tr.tier .base').allTextContents();
  ok(rates.join(',') === '69%,24%,5.4%,1.3%,0.25%,0.05%', `Raten 69/24/5.4/1.3/0.25/0.05 % (${rates.join(',')})`);
  ok(/Starting values/.test(await text('.start-values')) && /Rates version/.test(await text('.rates-version')), 'Hinweis "Startwerte" und Ratenversion sichtbar');
  ok(/Pull x10 · Mythic pity 0\/150/.test(await text('.pull-btn[data-count="10"] strong')), `Pity-Zaehler auf dem Knopf: "${await text('.pull-btn[data-count="10"] strong')}"`);
  ok((await page.locator('.pity-row').count()) === 2 && /Mythic or better: 0 \/ 150/.test(await text('.pity-top')), 'Pity-Zeilen (Mythic, Legendary oder besser) sichtbar');
  await page.waitForSelector('.banner-tab[data-banner="legends"]', { timeout: 8000 }).catch(() => {}); // Banner kommen asynchron, unter Last fehlte der letzte Tab
  const tabNames = await page.locator('.banner-tab').allTextContents();
  ok(tabNames.length === 5, `Banner: Standard, Starter, Special, Crossover und Legends of Earth (solange verfuegbar) (ist: ${tabNames.join(' / ')})`);
  await clickSel('.pull-btn[data-count="10"]');
  await page.waitForSelector('.reveal');
  ok(await page.evaluate(() => document.querySelector('.pull-btn[data-count="10"]').disabled), 'Knopf waehrend des Zugs gesperrt');
  ok((await page.locator('.reveal[data-phase="charge"]').count()) === 1 && ['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive'].includes(await page.locator('.reveal').getAttribute('data-best')), 'Zug: Aufbau (Portal) laeuft, beste Seltenheit steht schon fest');
  await sleep(500);
  await shot('charge');
  await page.mouse.click(W / 2, 80); // Klick ueberspringt den Aufbau
  await page.waitForSelector('.reveal[data-phase="cards"]');
  ok((await page.locator('.pk-card').count()) === 10 && (await page.locator('.pk-card.flipped').count()) === 0, 'Zug: 10 verdeckte Karten');
  await shot('cards');
  await flipOne();
  ok((await page.locator('.pk-card.flipped').count()) === 1 && /9 of 10/.test((await page.locator('.rv-count').textContent()) ?? ''), 'Zug: ein Klick deckt genau eine Karte auf (1 von 10, Zaehler "9 of 10")');
  await sleep(500);
  await shot('flip');
  await clickSel('.rv-all');
  await page.waitForSelector('.rv-summary', { timeout: 15000 });
  ok((await page.locator('.rv-sum-cell').count()) === 10, 'Zug: Uebersicht zeigt alle 10 Gewinne');
  const sumRar = await page.locator('.rv-sum-cell').evaluateAll((els) => els.map((e) => ['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive'].findIndex((r) => e.classList.contains(`r-${r}`))));
  ok(sumRar.every((v, i) => i === 0 || v >= sumRar[i - 1]), `Zug: Uebersicht aufsteigend, hoechste Seltenheit zuletzt (${sumRar.join(',')})`);
  await sleep(900);
  await shot('reveal');
  await clickSel('.reveal-done');
  await page.waitForSelector('.reveal', { state: 'detached' });
  ok((await page.locator('.hist-item').count()) === 10, `Ziehungsverlauf zeigt 10 Zuege (${await page.locator('.hist-item').count()})`);
  w = await waitWallet('w.crystals === 0');
  ok(w.crystals === 0, `450 Crystals ausgegeben (${w.crystals})`);
  const pityBtn = await text('.pull-btn[data-count="10"] strong');
  ok(/Mythic pity (\d+)\/150/.test(pityBtn), `Pity nach dem Zug: "${pityBtn}"`);
  await shot('summon');
  await clickSel('.pull-btn[data-count="1"]');
  await page.waitForSelector('.flash.error');
  ok(/Not enough crystals/.test(await text('.flash.error')) && (await page.locator('.reveal').count()) === 0, `Fehlercode als Toast: "${await text('.flash.error')}"`);

  // ---- Units: Raster, Filter, Level-Up gesperrt ohne Gold ----------------------------------------------------------------
  await go('units');
  await page.waitForSelector('.unit-tile');
  const countTxt = await text('.unit-count');
  const [, ownedN, totalN] = /(\d+) \/ (\d+) owned/.exec(countTxt) ?? [];
  // Raster ist virtuell (nur der sichtbare Ausschnitt steht im DOM): Gesamtzahl steht in data-count
  ok(Number(totalN) > 0 && Number(await page.locator('.vgrid').getAttribute('data-count')) === Number(totalN) && (await page.locator('.unit-tile').count()) > 0, `alle ${totalN} Units im Raster (virtuell), ${ownedN} besessen`);
  ok(Number(totalN) === Number(ownedN) || (await page.locator('.unit-tile[data-owned="false"]').count()) > 0, 'nicht besessene Units grau markiert ("not owned")');
  await clickSel('.filter-btn[data-group="rarity"][data-value="epic"]');
  ok((await page.locator('.unit-tile').count()) > 0 && (await page.locator('.unit-tile:not(.r-epic)').count()) === 0, 'Filter Seltenheit = Epic');
  await clickSel('.filter-btn[data-group="rarity"][data-value=""]');
  await clickSel('.unit-tile[data-owned="true"]');
  ok((await page.locator('.levelup').isDisabled()) && /40 gold/.test(await text('.ud-why')), `Level-Up ohne Gold gesperrt, mit Grund: "${await text('.ud-why')}"`);
  ok((await page.locator('.ud-stats dd').count()) >= 4 && (await page.locator('.ud-tags .utag, .ud-role').count()) >= 1, 'Detailansicht: Werte, Rolle, Symbole');

  // ---- Team aus der Sammlung -----------------------------------------------------------------------------------------------
  await go('team');
  await page.waitForSelector('.team-slot.filled');
  ok((await page.locator('.team-slot.filled').count()) === 6, 'Team: 6 Slots belegt (Starter: 12 AA-Units, die ersten sechs)');
  const firstSlot = await page.locator('.team-slot.filled').first().getAttribute('data-unit');
  await clickSel('.team-slot.filled');
  ok((await page.locator('.team-slot.filled').count()) === 5 && (await page.locator('.team-save').isDisabled()), 'Slot leeren: 5 von 6, Speichern gesperrt');
  await page.locator(`.team-pick .unit-tile[data-unit="${firstSlot}"]`).scrollIntoViewIfNeeded(); // Raster ist lang: Kachel kann unter dem Rand liegen
  await clickSel(`.team-pick .unit-tile[data-unit="${firstSlot}"]`);
  await sleep(150);
  // Ziel = min(6, Besitz): hat der Zug eine neue Unit gebracht, fehlt noch eine (Zufall) -> auffuellen
  for (let i = 0; i < 3 && (await page.locator('.team-save').isDisabled()); i++) {
    await clickSel('.team-pick .unit-tile:not(.picked)');
    await sleep(150);
  }
  const slotsTotal = await page.locator('.team-slot').count();
  ok((await page.locator('.team-slot.filled').count()) === slotsTotal && !(await page.locator('.team-save').isDisabled()), `Unit aus der Sammlung gewaehlt: ${slotsTotal} von ${slotsTotal}`);
  await shot('team');
  await clickSel('.team-save');
  await page.waitForSelector('.flash.good');
  ok(/Team saved/.test(await text('.flash.good')), 'Team gespeichert');

  // ---- Stage-Auswahl -----------------------------------------------------------------------------------------------------------
  await go('play');
  await page.waitForSelector('.act-card');
  ok((await page.locator('.world-tab').count()) >= 3 && (await page.locator('.act-card').count()) === 7, 'Weltkarte: mindestens 3 Welten, 6 Acts + Infinite');
  ok(!(await page.locator('.act-card[data-stage="greenie-1"]').isDisabled()) && (await page.locator('.act-card[data-stage="greenie-2"]').isDisabled()) && (await page.locator('.act-card[data-stage="greenie-infinite"]').isDisabled()), 'Nur Act 1 offen, Act 2 und Infinite gesperrt');
  ok(/Clear act 1 first/.test(await text('.act-card[data-stage="greenie-2"] .lock-reason')) && (await page.locator('.world-tab[data-world="walled-city"]').isDisabled()), 'Sperrgruende sichtbar, Welt 2 gesperrt');
  await shot('world');
  await clickSel('.act-card[data-stage="greenie-1"]');
  await page.waitForSelector('.stage-card');
  ok((await page.locator('.diff').count()) === 3, 'Stufenwahl Normal/Hard/Nightmare sichtbar');
  ok((await page.locator('.stage-card[data-difficulty="hard"]').isDisabled()) && /Player level 5/.test(await text('.stage-card[data-difficulty="hard"] .lock-reason')), 'Hard gesperrt: "Player level 5"');
  ok((await page.locator('.stage-card[data-difficulty="nightmare"]').isDisabled()) && /Player level 25/.test(await text('.stage-card[data-difficulty="nightmare"] .lock-reason')), 'Nightmare gesperrt: "Player level 25"');
  ok(/First clear: 80 crystals/.test(await text('.stage-card[data-difficulty="normal"] .stage-reward')) && /Not played yet/.test(await text('.stage-card[data-difficulty="normal"] .stage-best')), 'Normal: Erst-Clear-Belohnung und Bestwelle sichtbar');
  await shot('stage');
  await clickSel('.stage-card[data-difficulty="normal"]');
  await page.waitForSelector('canvas.board');
  ok((await page.locator('.overlay.hidden').count()) >= 1 && !(await page.locator('.dialog.wide').isVisible().catch(() => false)), 'Overlay verschwindet nach Stufenwahl');
  const sess = await page.evaluate(() => {
    const x = window.__duskwardens.session();
    return { team: x.team, mods: x.unitMods.length, defs: x.teamCatalog().length };
  });
  ok(sess.team?.length >= 5 && sess.mods === sess.team.length && sess.defs === sess.team.length, `Session mit Team (${sess.team?.length}) und Unit-Mods (${sess.mods}) aus dem Profil`);

  // ---- Layout: alles im Fenster, keine Slot-Knoepfe mehr --------------------------------------------------------------
  const lay = await page.evaluate(() => {
    const c = document.querySelector('canvas.board').getBoundingClientRect();
    const shop = document.querySelector('.shop').getBoundingClientRect();
    const hud = document.querySelector('.hud').getBoundingClientRect();
    return { board: [c.left, c.top, c.right, c.bottom], shopBottom: shop.bottom, hudTop: hud.top, vw: innerWidth, vh: innerHeight, slots: document.querySelectorAll('.slot, .slots').length, scrollH: document.documentElement.scrollHeight };
  });
  ok(lay.slots === 0, `keine Slot-Knoepfe im DOM (ist: ${lay.slots})`);
  ok(lay.board[0] >= 0 && lay.board[2] <= lay.vw && lay.board[1] >= lay.hudTop && lay.board[3] <= lay.vh, `Spielfeld liegt im Fenster ${JSON.stringify(lay.board.map(Math.round))}`);
  ok(lay.shopBottom <= lay.vh + 1 && lay.scrollH <= lay.vh + 1, `Unit-Leiste sichtbar, keine Seiten-Scrollleiste (Shop-Ende ${Math.round(lay.shopBottom)} von ${lay.vh})`);
  const ver = (await page.locator('.version').textContent()) ?? '';
  ok(/build \S+ - \d{4}-\d\d-\d\d/.test(ver), `Version unten rechts: "${ver}"`);
  const vb = await page.locator('.version').boundingBox();
  ok(vb && vb.x + vb.width > W - 250 && vb.y + vb.height > H - 40, 'Version liegt unten rechts');

  // ---- Ersthinweise, Hilfe ----------------------------------------------------------------------------------------
  ok((await page.locator('.hints:not(.hidden)').count()) === 1 && /Tip 1 of 3/.test((await page.locator('.hints').textContent()) ?? ''), 'Ersthinweis 1 von 3 sichtbar');
  await press('?');
  ok(await page.locator('.help:not(.hidden)').isVisible(), 'Hilfe oeffnet mit ?');
  ok(/1-\d/.test((await page.locator('.help').textContent()) ?? '') && /Esc/.test((await page.locator('.help').textContent()) ?? ''), 'Hilfe listet Tastenkuerzel');
  await press('Escape');
  ok(!(await page.locator('.help:not(.hidden)').count()), 'Esc schliesst die Hilfe');
  await press('h');
  await clickSel('.help-close');
  ok(!(await page.locator('.help:not(.hidden)').count()), 'H oeffnet, Knopf schliesst');

  // ---- Freie Platzierung: Geist, Gruende, keine toten Klicks --------------------------------------------------------------
  let s = await snap();
  const toastAfter = async (fn, re, what) => {
    await fn();
    await sleep(250);
    const t = await toastText();
    ok(re.test(t), `${what}: Toast "${t}"`);
  };
  const hillUnit = ['krillin', 'goku_ssj3'].find((u) => s.order.includes(u));
  const groundUnit = ['jotaro', 'law'].find((u) => s.order.includes(u));
  const hybridUnit = ['rikka_evo', 'monet'].find((u) => s.order.includes(u)); // im Starter-Team keiner: Block entfaellt
  await toastAfter(() => clickAt(3000, 3000), /Nothing here/, 'Klick ins Leere ohne Unit-Wahl');
  await pickKey(hillUnit, s);
  await sleep(100);
  ok((await snap()).placing === hillUnit, 'Zifferntaste waehlt die Huegel-Unit');
  ok(/Tip 2 of 3/.test((await page.locator('.hints').textContent()) ?? ''), 'Ersthinweis 2 von 3');
  const hillSpots = await readSpots(page, hillUnit, 4);
  const groundSpots = await readSpots(page, groundUnit, 6);
  ok(hillSpots.length >= 2 && groundSpots.length >= 4, `freie Stellen gelesen (Huegel ${hillSpots.length}, Boden ${groundSpots.length})`);
  const pathPt = await readPathPoint(page);
  // Geist: gruen auf passender Flaeche, rot mit Grund sonst (Maus hinfahren, Zustand lesen, Screenshot)
  const hover = async (x, y) => {
    const p = await worldToScreen(page, x, y);
    await page.mouse.move(p.x, p.y);
    await sleep(120);
    return readGhost(page);
  };
  let g = await hover(...hillSpots[0]);
  ok(g && g.ok && g.reason === null, `Geist gruen auf freiem Huegel (${JSON.stringify(g)})`);
  await page.screenshot({ path: resolve(root, 'docs', 'r8', `p1-smoke-ghost-green-${tag}.png`) });
  g = await hover(...groundSpots[0]);
  ok(g && !g.ok && g.reason === 'wrong-zone', `Geist rot auf Boden mit Huegel-Unit: ${g?.reason}`);
  g = await hover(pathPt[0], pathPt[1]);
  ok(g && !g.ok && g.reason === 'on-path', `Geist rot auf dem Pfad: ${g?.reason}`);
  await page.screenshot({ path: resolve(root, 'docs', 'r8', `p1-smoke-ghost-red-${tag}.png`) });
  g = await hover(-450, 5500);
  ok(g && !g.ok && g.reason === 'out-of-bounds', `Geist rot am Kartenrand: ${g?.reason}`);
  // Klicks an roten Stellen: Toast mit Grund, nichts wird gesetzt, keine toten Klicks
  await toastAfter(() => clickAt(pathPt[0], pathPt[1]), /enemy path/, 'Klick auf den Pfad');
  ok((await snap()).units.length === 0 && (await snap()).placing === hillUnit, 'Pfad-Klick setzt nichts, Wahl bleibt');
  await toastAfter(() => clickAt(...groundSpots[0]), /needs a hill/, 'Huegel-Unit auf Boden');
  await toastAfter(() => clickAt(-450, 5500), /edge of the map/, 'Klick am Kartenrand');
  await toastAfter(() => clickAt(6500, 0), /Trees and rocks/, 'Klick auf Baum/Fels');
  await clickAt(3000, 3000, { button: 'right' });
  await sleep(100);
  ok((await snap()).placing === null, 'Rechtsklick bricht das Platzieren ab');
  await pickKey(groundUnit, s);
  await press('Escape');
  await sleep(100);
  ok((await snap()).placing === null, 'Esc bricht das Platzieren ab');
  // Hybrid und Farm, solange die Startmuenzen reichen (Geist liest auch `not-enough-coins`)
  if (hybridUnit) {
    await pickKey(hybridUnit, s);
    const hy = (await readSpots(page, hybridUnit, 1))[0];
    g = await hover(...hy);
    ok(g && g.ok, `Hybrid-Unit ${hybridUnit}: Geist gruen auf freier Stelle`);
    await press('Escape');
  }
  if (s.order.includes('speedwagon')) {
    await pickKey('speedwagon', s);
    const fs = await readSpots(page, 'speedwagon', 2);
    ok(fs.length > 0, `Farm findet Platz (${fs.length} Stellen)`);
    g = await hover(...fs[0]);
    ok(g && g.ok, `Farm (AA: 1x1): Geist gruen auf freier Stelle (${JSON.stringify(g)})`);
    await press('Escape');
  }

  // Setzen per Klick auf freie Stelle: Unit steht dort, Wahl ist verbraucht
  await pickKey(groundUnit, s);
  const first = groundSpots[0];
  await clickAt(...first);
  await sleep(150);
  s = await snap();
  const placedU = s.units.find((u) => u.def === groundUnit);
  ok(!!placedU && Math.hypot(placedU.x - first[0], placedU.y - first[1]) < 60, `Klick setzt ${groundUnit} an die Mausposition (${placedU?.x},${placedU?.y} fuer ${first})`);
  ok(s.placing === null, 'ohne Shift ist die Wahl nach dem Setzen verbraucht');
  // Ueberlappung: knapp neben der gesetzten Unit (ausserhalb ihres Auswahlkreises, innerhalb der Mindestabstands)
  await pickKey(groundUnit, s);
  await toastAfter(() => clickAt(first[0] + 650, first[1]), /Too close to another unit/, 'Klick knapp neben einer Unit');
  const hoverOv = await hover(first[0] + 650, first[1]);
  ok(hoverOv && !hoverOv.ok && hoverOv.reason === 'overlap', `Geist rot bei Ueberlappung: ${hoverOv?.reason}`);
  // Klick auf die gesetzte Unit waehlt sie (auch im Platzier-Modus)
  await clickUnit(placedU);
  await sleep(100);
  s = await snap();
  ok(s.selected === placedU.id && s.placing === null, 'Klick auf eine gesetzte Unit waehlt sie');
  await press('Escape');
  // Shift+Klick: dieselbe Unit nochmal, ohne neu zu waehlen
  await pickKey(groundUnit, s);
  const more = [];
  for (let i = 0; i < 2; i++) {
    const sp = (await readSpots(page, groundUnit, 1))[0]; // je Klick frisch lesen: eine alte Stelle koennte inzwischen belegt sein
    more.push(sp);
    await clickAt(...sp, { shift: true });
    await sleep(100);
  }
  s = await snap();
  ok(s.units.filter((u) => u.def === groundUnit).length === 1 + more.length && s.placing === groundUnit, `Shift+Klick setzt weitere ${groundUnit} ohne neue Wahl (${s.units.length} Units, Wahl ${s.placing})`);
  await press('Escape');
  // ---- Die Stage: nur Mausklicks und Tasten -----------------------------------------------------------------------
  await clickSel('.btn.speed[data-speed="3"]');
  const stats = { place: 0, upgrade: 0, wave: 0, rejected: 0, sell: 0 };
  let planIdx = 0;
  let lastWave = -1;
  let toldPoor = false;
  const t0 = Date.now();
  let stuck = 0;
  // nur die vollen Aufloesungen spielen die ganze Stage; die anderen spielen bis Welle 8 echt (damit Wellen gehalten werden und
  // die Belohnung Gold bringt: belohnt werden seit Runde 7 nur gehaltene, nicht gerufene Wellen) und rufen dann den Rest (schnelle Niederlage)
  while (true) {
    s = await snap();
    if (!s) throw new Error('keine Session');
    if (s.over) break;
    if (!full && s.wave >= 8) break;
    if ((Date.now() - t0) / 1000 > MAX_STAGE_S) {
      log(`Zeitlimit ${MAX_STAGE_S}s erreicht (Welle ${s.wave}, Leben ${s.lives})`);
      break;
    }
    if (s.wave !== lastWave) {
      lastWave = s.wave;
      log(`Welle ${s.wave}/${s.total ?? 15}, Leben ${s.lives}/${s.maxLives}, Muenzen ${s.coins}, Units ${s.units.length}, ${Math.round((Date.now() - t0) / 1000)}s`);
    }
    let acted = false;
    // 1) naechste Unit des Plans platzieren: freie Stelle lesen, echter Mausklick dorthin
    const want = PLAN[planIdx];
    if (want && !s.order.includes(want)) planIdx++; // nicht im Team
    else if (want) {
      const d = s.defs[want];
      const spots = s.coins >= d.cost ? await readSpots(page, want, 4) : [];
      if (s.coins >= d.cost && spots.length === 0) planIdx++; // kein Platz mehr fuer diese Sorte
      else if (s.coins >= d.cost) {
        await pickKey(want, s);
        let done = false;
        for (const sp of spots) {
          await clickAt(...sp);
          await sleep(60);
          if ((await snap()).units.length > s.units.length) {
            done = true;
            break;
          }
          stats.rejected++;
          log(`Klick abgelehnt bei ${sp}: ${await toastText()}`);
        }
        if (!done) await press('Escape');
        stats.place += done ? 1 : 0;
        planIdx++;
        acted = true;
      } else if (!toldPoor && s.units.length >= 3) {
        // Muenzen reichen nicht: der Versuch muss den Grund nennen (Stellen ohne Muenzpruefung lesen)
        toldPoor = true;
        const poorSpots = await readSpots(page, want, 1, { ignoreCoins: true });
        if (poorSpots.length > 0) {
          await pickKey(want, s);
          await clickAt(...poorSpots[0]);
          await sleep(120);
          const raced = (await snap()).units.length > s.units.length; // Muenzen kamen zwischen Lesen und Klick herein: dann wurde eben gesetzt
          const tt = await toastText();
          ok(raced || /Not enough coins: .+ costs \d+, you have \d+/.test(tt), `zu wenig Muenzen: Toast "${tt}"${raced ? ' (Muenzen kamen dazwischen, gesetzt)' : ''}`);
          await press('Escape');
        }
      }
    }
    // 2) sonst upgraden (niedrigste Stufe zuerst), nachdem der Plan bis zur Haelfte steht oder Geld uebrig ist
    if (!acted && (planIdx >= 4 || s.units.length >= 4)) {
      const ups = s.units.filter((u) => u.up !== null && s.coins >= u.up && (planIdx >= PLAN.length || s.coins >= u.up + (s.defs[PLAN[planIdx]]?.cost ?? 0) * 0.3)).sort((a, b) => s.defs[b.def].cost - s.defs[a.def].cost || a.level - b.level || a.up - b.up);
      if (ups[0]) {
        await clickUnit(ups[0]);
        await page.waitForSelector('.btn.upgrade:not([disabled])', { timeout: 3000 }).catch(() => {});
        await clickSel('.btn.upgrade');
        stats.upgrade++;
        acted = true;
      }
    }
    // 3) Welle frueher rufen, wenn das Feld leer ist (Maus) oder nach dem Aufbau
    if (!acted && s.units.length >= 2 && s.enemies <= (s.wave < 10 ? 3 : 0) && s.phase !== 'over') {
      if (stats.wave % 2 === 0) await clickSel('.btn.start');
      else await press('n');
      stats.wave++;
      acted = true;
    }
    if (!acted) {
      stuck++;
      await sleep(150);
    } else {
      await sleep(30);
    }
  }
  if (!full) await rush(false);
  const fin = await snap();
  log(`Ende: ${fin.result ?? 'Zeitlimit'} bei Welle ${fin.wave}, Leben ${fin.lives}, Platzieren ${stats.place} (abgelehnt ${stats.rejected}), Upgrades ${stats.upgrade}, Wellenrufe ${stats.wave}, ${Math.round((Date.now() - t0) / 1000)}s${full ? '' : ' (kurzes Match)'}`);
  ok(fin.over, `Stage laeuft bis Sieg oder Niederlage durch (Ergebnis: ${fin.result}, Welle ${fin.wave})`);
  if (full) {
    ok(stats.place >= 4 && stats.upgrade >= 3, `echte Maus-Aktionen: ${stats.place} Platzierungen, ${stats.upgrade} Upgrades`);
    ok(stats.rejected <= 2, `Klicks auf gelesene freie Stellen werden angenommen (abgelehnt: ${stats.rejected})`);
    ok(fin.units.length > 0 || fin.result === 'loss', `Units auf dem Feld oder Niederlage (${fin.units.length})`);
    ok(fin.kills > 20, `Units haben Gegner besiegt (${fin.kills})`);
  }
  await page.waitForSelector('.dialog.end', { timeout: 5000 }).catch(() => {});
  ok(await page.locator('.dialog.end').isVisible(), 'Ergebnis-Bildschirm erscheint');
  log(`Ergebnis: ${await page.locator('.dialog.end .title').textContent()} - ${await page.locator('.dialog.end .result-stats').textContent()}`);

  // ---- Belohnung (aus dem nachgerechneten Replay) ---------------------------------------------------------------------------
  await page.waitForSelector('.reward-box[data-state="ok"], .reward-box[data-state="error"]', { timeout: 30000 });
  ok((await page.locator('.reward-box').getAttribute('data-state')) === 'ok', `Belohnung gemeldet und verbucht (Zustand: ${await page.locator('.reward-box').getAttribute('data-state')} ${await text('.reward-error')})`);
  const rewardOf = () =>
    page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.reward-line')].map((e) => [e.classList[1], Number(e.dataset.value)])));
  const r1 = await rewardOf();
  const won = fin.result === 'win';
  ok(r1.gold > 0 && r1.xp > 0, `Gold und XP sichtbar (${JSON.stringify(r1)})`);
  ok(won ? r1.crystals === 80 && (await page.locator('.reward-firstclear').count()) === 1 : r1.crystals === undefined && /gold and XP count/.test(await text('.reward-consolation')), won ? 'Sieg: 80 Crystals und Erst-Clear-Hinweis' : 'Niederlage: Gold und XP, keine Crystals, freundlicher Hinweis');
  await shot('result');
  await clickSel('.dialog.end .btn.menu');
  await page.waitForSelector('.lobby:not(.loading)');
  w = await waitWallet(`w.gold === ${r1.gold}`);
  ok(w.gold === r1.gold && w.crystals === (r1.crystals ?? 0), `zurueck in der Lobby, Salden = Belohnung (${JSON.stringify(w)})`);

  // ---- Unit leveln (Gold aus dem Match), zweites Match mit den Level-Mods --------------------------------------------------
  await go('units');
  await page.waitForSelector('.unit-tile');
  await clickSel('.unit-tile[data-unit="jotaro"]');
  const goldBefore = (await wallet()).gold;
  ok(!(await page.locator('.levelup').isDisabled()), `Level-Up frei mit ${goldBefore} Gold`);
  await clickSel('.levelup');
  w = await waitWallet(`w.gold === ${goldBefore - 40}`);
  ok(w.gold === goldBefore - 40 && /Level 2 \/ 40/.test(await text('.ud-level')), `Jotaro Level 2 fuer 40 Gold (Gold ${w.gold}, ${await text('.ud-level')})`);
  ok(/Collection bonus: \+\d+(\.\d+)?% damage/.test(await text('.ud-power')), `Sammlungs-Bonus sichtbar: "${await text('.ud-power')}"`);
  await shot('units');
  await go('play');
  await page.waitForSelector('.act-card[data-stage="greenie-1"]');
  await clickSel('.act-card[data-stage="greenie-1"]');
  await page.waitForSelector('.stage-card[data-difficulty="normal"]:not([disabled])');
  ok(/Each clear: 20 crystals|First clear: 80 crystals/.test(await text('.stage-card[data-difficulty="normal"] .stage-reward')) && /Best wave \d+ \/ 15/.test(await text('.stage-card[data-difficulty="normal"] .stage-best')), `Stage zeigt Belohnung und Bestwelle: "${await text('.stage-card[data-difficulty="normal"] .stage-reward')}", "${await text('.stage-card[data-difficulty="normal"] .stage-best')}"`);
  await clickSel('.stage-card[data-difficulty="normal"]');
  await page.waitForSelector('canvas.board');
  const mods2 = await page.evaluate(() => window.__duskwardens.session().unitMods.find((m) => m.unit === 'jotaro')?.lvlBp);
  ok(mods2 > 10000, `zweites Match: Jotaro-Mod aus dem Level (lvlBp ${mods2})`);
  await rush(true);
  await page.waitForSelector('.reward-box[data-state="ok"], .reward-box[data-state="error"]', { timeout: 30000 });
  ok((await page.locator('.reward-box').getAttribute('data-state')) === 'ok', `zweites Match mit Level-Mods wird belohnt (Replay passt zum Profil; ${await text('.reward-error')})`);
  await clickSel('.dialog.end .btn.menu');
  await page.waitForSelector('.lobby:not(.loading)');

  // ---- Seite neu laden: Stand bleibt --------------------------------------------------------------------------------------------
  const readState = async () => {
    const st = { wallet: await wallet() };
    await go('summon');
    await page.waitForSelector('.pull-btn[data-count="10"]');
    await page.waitForSelector('.hist-item');
    st.pity = await text('.pull-btn[data-count="10"] strong');
    st.history = await page.locator('.hist-item').count();
    await go('units');
    await page.waitForSelector('.unit-tile');
    st.units = await readCollection();
    await toLobby();
    return st;
  };
  const before = await readState();
  await page.reload();
  await page.waitForSelector('.lobby:not(.loading)');
  await waitWallet(`w.gold === ${before.wallet.gold}`);
  ok((await page.locator('.starter-claim').count()) === 0, 'nach dem Neuladen: Starter-Geschenk bleibt abgeholt');
  const after = await readState();
  ok(JSON.stringify(after.wallet) === JSON.stringify(before.wallet), `Neuladen: Salden gleich (${JSON.stringify(before.wallet)} -> ${JSON.stringify(after.wallet)})`);
  ok(after.pity === before.pity && after.history === before.history && after.history === 10, `Neuladen: Pity und Verlauf gleich ("${before.pity}", ${after.history} Zuege)`);
  const diffUnits = after.units.filter((u, i) => u !== before.units[i]).slice(0, 3);
  ok(JSON.stringify(after.units) === JSON.stringify(before.units) && after.units.some((u) => u.startsWith('jotaro:true:Lv 2')), `Neuladen: Sammlung und Level gleich (Jotaro Lv 2)${diffUnits.length ? ` - Unterschied: ${diffUnits.join(' | ')} (vorher ${before.units.length}, nachher ${after.units.length} Karten)` : ''}`);

  // ---- Export -> Reset -> Import (nur 1280x720) ------------------------------------------------------------------------------
  if (W === 1280) {
    await go('settings');
    await page.waitForSelector('.save-section');
    const [dl] = await Promise.all([page.waitForEvent('download'), clickSel('.save-export')]);
    const file = resolve(tmpdir(), `dw-smoke-save-${process.pid}.json`);
    await dl.saveAs(file);
    ok(/^duskwardens-save-\d{8}\.json$/.test(dl.suggestedFilename()), `Export: Datei-Download ${dl.suggestedFilename()}`);
    await clickSel('.save-reset');
    await page.waitForSelector('.confirm-layer');
    await clickSel('.confirm-no');
    ok((await page.locator('.confirm-layer').count()) === 0 && (await page.locator('.save-section').count()) === 1, 'Reset: Abbrechen im Bestaetigungsdialog aendert nichts');
    await clickSel('.save-reset');
    await page.waitForSelector('.confirm-layer');
    await clickSel('.confirm-yes');
    await page.waitForSelector('.lobby:not(.loading)');
    w = await waitWallet('w.crystals === 0 && w.gold === 0');
    ok(w.crystals === 0 && w.gold === 0 && (await page.locator('.starter-claim').count()) === 1, 'Reset: leeres Profil, Starter-Geschenk wieder da');
    await clickSel('.lobby-settings');
    await page.waitForSelector('.save-section');
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), clickSel('.save-import')]);
    await fc.setFiles(file);
    await page.waitForSelector('.confirm-layer');
    await clickSel('.confirm-yes');
    await page.waitForSelector('.lobby:not(.loading)');
    await waitWallet(`w.gold === ${before.wallet.gold}`);
    const restored = await readState();
    ok(JSON.stringify(restored) === JSON.stringify(before), 'Import: derselbe Stand wie vor dem Export (Salden, Sammlung, Pity, Verlauf)');
  }

  ok(errors.length === 0, `keine Konsolenfehler${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}

/** Randfaelle der Lobby in eigenen Seiten: kaputter oder zu neuer Stand (Meldung, Import/Reset, nichts wird ungefragt ueberschrieben) und gesperrter Speicher. */
async function edgeCases(browser) {
  const open = async (init) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await page.addInitScript(init);
    await page.goto(URL_);
    return { ctx, page, errors };
  };
  const cases = [
    ['kaputter Stand', `localStorage.setItem('dw.meta.profile.a', 'kein json')`, 'profile-corrupt'],
    ['Stand aus neuerer Version', `localStorage.setItem('dw.meta.profile.a', JSON.stringify({ app: 'dw-meta', rev: 3, profile: { schemaVersion: 99 } }))`, 'profile-too-new'],
  ];
  for (const [label, init, code] of cases) {
    const { ctx, page, errors } = await open(init);
    await page.waitForSelector('.load-error');
    check((await page.locator('.load-error').getAttribute('data-code')) === code, `${label}: Meldung statt Absturz (${code})`);
    check((await page.locator('.load-import').isVisible()) && (await page.locator('.load-reset').isVisible()), `${label}: Optionen Import und Reset sichtbar`);
    const raw = await page.evaluate(() => localStorage.getItem('dw.meta.profile.a'));
    check(raw !== null && raw.length > 0 && (await page.locator('.lobby').count()) === 0, `${label}: Stand bleibt unangetastet, keine Lobby`);
    const b = await page.locator('.load-reset').boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForSelector('.confirm-layer');
    const yes = await page.locator('.confirm-yes').boundingBox();
    check((await page.locator('.load-error').count()) === 1, `${label}: Reset fragt erst nach`);
    await page.mouse.click(yes.x + yes.width / 2, yes.y + yes.height / 2);
    await page.waitForSelector('.lobby:not(.loading)');
    check((await page.locator('.starter-claim').count()) === 1, `${label}: nach Reset frische Lobby`);
    check(errors.length === 0, `${label}: keine Seitenfehler${errors.length ? ': ' + errors[0] : ''}`);
    await ctx.close();
  }
  // Speicher gesperrt (privates Fenster o. a.): Spiel laeuft, Warnung sichtbar
  const blocked = `Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); }, configurable: true });`;
  const { ctx, page, errors } = await open(blocked);
  await page.waitForSelector('.lobby:not(.loading)');
  check(await page.locator('.memory-warning').isVisible(), `Speicher gesperrt: Warnung "${((await page.locator('.memory-warning').textContent()) ?? '').trim()}"`);
  check(/lost on reload/.test((await page.locator('.memory-warning').textContent()) ?? '') && (await page.locator('.testbuild').isVisible()), 'Warnung nennt "progress will be lost on reload", Testhinweis bleibt');
  check(errors.length === 0, `Speicher gesperrt: keine Seitenfehler${errors.length ? ': ' + errors[0] : ''}`);
  await ctx.close();
}

/**
 * Runde 9 / P3: Legend Stages, Raids, Raid-Shop und Material mit echten Klicks (1280x720). Ein Speicherstand mit geschafften Acts von Planet Greenie,
 * 200 Raid-Marken und 20 Crystallite wird vor dem Laden in den localStorage geschrieben (nur beim ersten Laden).
 */
async function modesCase(browser) {
  const ok = (cond, msg) => check(cond, `Modi: ${msg}`);
  const stages = Object.fromEntries([1, 2, 3, 4, 5, 6].map((a) => [`greenie-${a}`, { normal: { clears: 1, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave: a <= 3 ? 15 : 20 } }]));
  const profile = {
    schemaVersion: 3, id: 'smoke-modes-0001', displayName: 'Warden', createdAt: '2026-10-08T00:00:00.000Z', playerLevel: 1, playerXp: 0,
    wallet: { crystals: 0, gold: 0 }, ledger: [], units: { goku_ssj3: { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: '2026-10-08T00:00:00.000Z' } }, team: ['goku_ssj3'],
    pity: {}, pullHistory: [], stages, settings: {}, flags: { starterGiftClaimed: true }, counters: {}, idem: {}, inventory: { raidMarks: 200, materials: { crystallite: 20 } },
  };
  const env = JSON.stringify({ app: 'dw-meta', rev: 1, profile });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/\/aa\/(units\/|index\.json)/.test(m.location()?.url ?? '')) errors.push(`console: ${m.text()}`);
  });
  await page.addInitScript((e) => {
    try {
      if (!localStorage.getItem('dw.modes.smoke')) {
        localStorage.setItem('dw.modes.smoke', '1');
        localStorage.setItem('dw.meta.profile.a', e);
        localStorage.setItem('dw.hints', JSON.stringify({ off: true }));
      }
    } catch { /* egal */ }
  }, env);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) ?? '').trim();
  await page.goto(URL_);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.waitForFunction(() => document.querySelector('.wallet')?.getAttribute('data-raid') === '200');
  ok(true, 'Brieftasche zeigt 200 Raid-Marken');

  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  ok((await page.locator('.mode-btn').count()) === 3, 'Weltkarte hat Umschalter Story / Legend Stages / Raids');
  await page.locator('.mode-btn[data-mode="legend"]').click();
  await page.waitForSelector('.mode-panel[data-mode="legend"]');
  ok((await page.locator('.world-tab').count()) === 8, 'Legend Stages: 8 Eintraege');
  ok((await page.locator('.world-tab[data-world="space-center"]').isDisabled()) === false && (await page.locator('.world-tab[data-world="spirit-invasion"]').isDisabled()), 'Space Center (Host Greenie) offen, Spirit Invasion gesperrt');
  ok((await page.locator('.mode-panel .act-card').count()) === 3 && !(await page.locator('.act-card[data-stage="legend-space-center-1"]').isDisabled()) && (await page.locator('.act-card[data-stage="legend-space-center-2"]').isDisabled()), 'Space Center: 3 Acts, nur Act 1 offen');
  ok(/Physical 40/.test(await txt('.affin.resist')) && /Magic \+30%/.test(await txt('.affin.weak')), `Resistenz und Schwaeche sichtbar (${await txt('.affin.resist')} / ${await txt('.affin.weak')})`);
  ok(/Disc Fragment/.test(await txt('.mode-drop')), 'Material der Legend Stage genannt');
  await page.locator('.mode-btn[data-mode="raids"]').click();
  await page.waitForSelector('.mode-panel[data-mode="raid"]');
  ok((await page.locator('.world-tab').count()) === 11, 'Raids: 11 Eintraege');
  ok(!(await page.locator('.world-tab[data-world="sacred-planet"]').isDisabled()) && (await page.locator('.world-tab[data-world="future-city"]').isDisabled()), 'Sacred Planet (Greenie, Act 3 geschafft) offen, Future City gesperrt');
  await page.locator('.world-tab[data-world="sacred-planet"]').click();
  await page.waitForSelector('.mode-panel[data-id="sacred-planet"]');
  ok((await page.locator('.mode-panel .act-card').count()) === 5 && /Guaranteed after 10 clears/.test(await txt('.guarantee-text')), 'Sacred Planet: 5 Acts, Garantie nach 10 Siegen');

  await page.locator('.act-card[data-stage="raid-sacred-planet-1"]').click();
  await page.waitForSelector('.stage-card');
  ok(/Sacred Planet - Act 1/i.test(await txt('h1')) && /55 Raid Marks/.test(await txt('.stage-card[data-difficulty="normal"] .stage-reward.extra')), `Stufenwahl des Raids: Titel und Marken (${await txt('.stage-card[data-difficulty="normal"] .stage-reward.extra')})`);
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  const run = await page.evaluate(() => ({ stage: window.__duskwardens.session().stageId, waves: window.__duskwardens.session().totalWaves, hud: document.querySelector('.hud')?.textContent ?? '' }));
  ok(run.stage === 'raid-sacred-planet-1' && run.waves === 20 && /Raid/.test(run.hud), `Raid-Match laeuft: ${run.stage}, ${run.waves} Wellen, Anzeige "Raid"`);
  await sleep(1500);
  // Legend-Stage-Match: laeuft ohne Absturz an
  await page.goto(URL_);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  await page.locator('.mode-btn[data-mode="legend"]').click();
  await page.locator('.act-card[data-stage="legend-space-center-1"]').click();
  await page.waitForSelector('.stage-card');
  await page.locator('.stage-card[data-difficulty="normal"]').click();
  await page.waitForSelector('canvas.board');
  const lrun = await page.evaluate(() => ({ stage: window.__duskwardens.session().stageId, aff: window.__duskwardens.session().sim.state.wave }));
  ok(lrun.stage === 'legend-space-center-1', 'Legend-Stage-Match laeuft an');

  // Raid-Shop
  await page.goto(URL_);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-play').click();
  await page.waitForSelector('.act-card');
  await page.locator('.mode-shop').click();
  await page.waitForSelector('.rs-card');
  ok((await page.locator('.rs-card').count()) >= 20 && (await txt('.rs-balance-num')) === '200', `Raid-Shop: ${await page.locator('.rs-card').count()} Angebote, Kontostand ${await txt('.rs-balance-num')}`);
  await page.locator('.rs-card[data-offer="gold-1"] .rs-buy').click();
  await page.waitForFunction(() => document.querySelector('.rs-balance-num')?.textContent === '185');
  ok(true, 'Kauf: Raid-Marken 200 -> 185');
  await page.waitForFunction(() => document.querySelector('.wallet')?.getAttribute('data-gold') === '2000');
  ok(true, 'Kauf: 2000 Gold in der Brieftasche');

  // Evolution mit Material
  await page.goto(URL_);
  await page.waitForSelector('.lobby:not(.loading)');
  await page.locator('.lobby-units').click();
  await page.waitForSelector('.unit-tile');
  await page.locator('.unit-tile[data-unit="goku_ssj3"]').click();
  await page.waitForSelector('.ud-evo .ud-material');
  ok(/Crystallite 15\/15/.test(await txt('.ud-material')) && (await page.locator('.ud-material.ok').count()) === 1, `Evolution nennt das Material: "${await txt('.ud-material')}"`);
  ok(errors.length === 0, `keine Seitenfehler${errors.length ? ': ' + errors[0] : ''}`);
  await ctx.close();
}


/**
 * Runde 10 / P3: Interaktions-Durchgang. Ein reich gefuellter Speicherstand (Crystals, Gold, Raid-Marken, Material, Units) und JEDER Knopf der Meta-Bildschirme
 * wird einmal mit der Maus gedrueckt. Pro Knopf gilt: es muss etwas Sichtbares passieren (DOM aendert sich, Dialog, Meldung, Bildschirmwechsel) und ein Klang
 * angefordert werden (`window.__uiSounds`, auch ohne laufendes Audio). Knoepfe ohne sichtbare Reaktion stehen am Ende als Liste in der Ausgabe.
 * Gleich aussehende Knoepfe (Raster) werden je Art hoechstens zweimal gedrueckt. Nur 1280x720.
 */
async function interactionCase(browser) {
  const ok = (cond, msg) => check(cond, `Durchgang: ${msg}`);
  const stages = Object.fromEntries([1, 2, 3, 4, 5, 6].map((a) => [`greenie-${a}`, { normal: { clears: 1, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave: 20 } }]));
  const mk = () => ({ level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: '2026-10-08T00:00:00.000Z' });
  const at = '2026-10-08T00:00:00.000Z';
  const profile = {
    schemaVersion: 3, id: 'smoke-sweep-0001', displayName: 'Warden', createdAt: at, playerLevel: 1, playerXp: 0,
    wallet: { crystals: 3000, gold: 5000 },
    ledger: [
      { id: 'L000001', currency: 'crystals', delta: 3000, kind: 'grant', refType: 'smoke', refId: 'c', createdAt: at },
      { id: 'L000002', currency: 'gold', delta: 5000, kind: 'grant', refType: 'smoke', refId: 'g', createdAt: at },
    ],
    units: Object.fromEntries(['goku_ssj3', 'genos', 'krillin', 'jotaro', 'law', 'speedwagon'].map((u) => [u, mk()])),
    team: ['goku_ssj3', 'genos', 'krillin', 'jotaro', 'law', 'speedwagon'],
    pity: {}, pullHistory: [], stages, settings: {}, flags: { starterGiftClaimed: true }, counters: {}, idem: {}, inventory: { raidMarks: 300, materials: { crystallite: 20 } },
  };
  const env = JSON.stringify({ app: 'dw-meta', rev: 1, profile });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/\/aa\/(units\/|index\.json)/.test(m.location()?.url ?? '')) errors.push(`console: ${m.text()}`);
  });
  page.on('filechooser', (fc) => void fc.setFiles([])); // Import: Dateiwahl ohne Datei = Abbruch
  await page.addInitScript((e) => {
    try {
      if (!localStorage.getItem('dw.sweep.smoke')) {
        localStorage.setItem('dw.sweep.smoke', '1');
        localStorage.setItem('dw.meta.profile.a', e);
        localStorage.setItem('dw.hints', JSON.stringify({ off: true }));
      }
    } catch { /* egal */ }
  }, env);

  const screens = [
    { name: 'Lobby', root: '.lobby:not(.loading)', open: async () => {} },
    { name: 'Summon', root: '.screen.summon', open: () => page.locator('.lobby-summon').click() },
    { name: 'Units', root: '.screen.units', open: () => page.locator('.lobby-units').click(), prep: async () => { await page.locator('.unit-tile[data-owned="true"]').first().click(); await sleep(400); } },
    { name: 'Team', root: '.screen.team', open: () => page.locator('.lobby-team').click() },
    { name: 'Shop', root: '.screen.shopscr', open: () => page.locator('.lobby-shop').click() },
    { name: 'Settings', root: '.screen.settings', open: () => page.locator('.lobby-settings').click() },
    { name: 'Credits', root: '.screen.credits', open: () => page.locator('.menu-credits').click() },
    { name: 'World map', root: '.screen.world', open: () => page.locator('.lobby-play').click() },
    { name: 'Raid shop', root: '.screen.raidshopscr', open: async () => { await page.locator('.lobby-play').click(); await page.waitForSelector('.mode-shop'); await page.locator('.mode-shop').click(); } },
  ];
  const home = async () => {
    await page.goto(URL_);
    await page.waitForSelector('.lobby:not(.loading)');
  };
  /** Immer frisch von der Lobby aus (Neuladen), damit die Knopf-Nummern je Durchgang gleich bleiben. */
  const enter = async (s) => {
    await home();
    await s.open();
    await page.waitForSelector(s.root);
    await sleep(500);
    if (s.prep) await s.prep();
  };
  /** Knoepfe des Bildschirms mit Kennung; je gleicher Art hoechstens zwei. */
  const buttons = (s) =>
    page.evaluate((root) => {
      const rootEl = document.querySelector(root);
      const seen = {};
      const out = [];
      const all = [...rootEl.querySelectorAll('button:not([disabled]), summary, [role="button"]:not([aria-disabled="true"])')];
      all.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || Number(cs.opacity) < 0.1 || cs.pointerEvents === 'none') return; // versteckte Randpfeile u. a. zaehlen nicht
        if (el.matches('.menu-back, .save-reset, .active, .banner-tab[aria-selected="true"]')) return; // Zurueck ist Navigation (anderswo geprueft); Reset hat eigenen Test
        const sig = (el.className || el.tagName).toString().split(/\s+/).filter((c) => !/^(r-|active|selected|picked|flipped|on|off|in-team)/.test(c)).join('.') + '|' + (el.parentElement?.className ?? '');
        seen[sig] = (seen[sig] ?? 0) + 1;
        if (seen[sig] > 2) return;
        const label = (el.getAttribute('aria-label') || el.textContent || el.title || '').trim().replace(/\s+/g, ' ').slice(0, 40);
        out.push({ i, label: label || (el.className || '').toString().split(' ')[0] || el.tagName, cls: (el.className || '').toString().split(' ').slice(0, 3).join('.') });
      });
      return out;
    }, s.root);
  const closeLayers = async () => {
    for (let k = 0; k < 6; k++) {
      if (await page.locator('.reveal').count()) await page.keyboard.press('Escape');
      else if (await page.locator('.confirm-layer').count()) await page.locator('.confirm-no').click();
      else break;
      await sleep(250);
    }
  };
  const report = [];
  for (const s of screens) {
    await enter(s);
    const list = await buttons(s);
    ok(list.length > 0 || s.name === 'Credits', `${s.name}: ${list.length} Knoepfe gefunden`);
    for (const b of list) {
      await enter(s);
      const handle = (await page.evaluateHandle(({ root, i }) => [...document.querySelector(root).querySelectorAll('button:not([disabled]), summary, [role="button"]:not([aria-disabled="true"])')][i] ?? null, { root: s.root, i: b.i })).asElement();
      if (!handle) continue;
      await page.evaluate(() => {
        document.querySelectorAll('.flash').forEach((e) => e.remove());
        window.__sweep = { mut: 0 };
        window.__sweepObs?.disconnect();
        window.__sweepObs = new MutationObserver((list) => {
          for (const m of list) if (!(m.target instanceof Element && m.target.closest('.flashes') && m.type === 'childList' && m.addedNodes.length === 0)) window.__sweep.mut++;
        });
        window.__sweepObs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ['class', 'style', 'disabled', 'data-count', 'data-phase', 'data-value', 'aria-pressed', 'aria-selected', 'open'] });
        window.__sweep.s0 = window.__uiSounds?.n ?? 0;
        window.__sweep.root = document.querySelector('.screen, .lobby')?.className ?? '';
      });
      try {
        await handle.scrollIntoViewIfNeeded({ timeout: 2000 });
        await handle.click({ timeout: 4000 });
      } catch (e) {
        report.push({ screen: s.name, label: b.label, note: `nicht klickbar (${String(e.message).split('\n')[0]})`, visual: false, sound: false, bad: true });
        continue;
      }
      await sleep(550);
      const r = await page.evaluate(() => ({
        mut: window.__sweep.mut,
        sounds: (window.__uiSounds?.n ?? 0) - window.__sweep.s0,
        layers: ['.reveal', '.confirm-layer', '.flash', '.celebrate'].filter((q) => document.querySelector(q)),
        screenChanged: (document.querySelector('.screen, .lobby')?.className ?? '') !== window.__sweep.root,
      }));
      const visual = r.mut > 0 || r.layers.length > 0 || r.screenChanged;
      report.push({ screen: s.name, label: b.label, visual, sound: r.sounds > 0, layers: r.layers, bad: !visual });
      await closeLayers();
    }
  }
  const bad = report.filter((x) => x.bad);
  console.log(`Interaktions-Durchgang: ${report.length} Knoepfe, ${report.filter((x) => x.visual).length} mit sichtbarer Reaktion, ${report.filter((x) => x.sound).length} mit Klang`);
  for (const x of report) console.log(`   ${x.visual ? 'sicht' : '  -- '} ${x.sound ? 'ton' : '   '}  ${x.screen} / ${x.label}${x.layers?.length ? `  -> ${x.layers.join(' ')}` : ''}${x.note ? `  ${x.note}` : ''}`);
  ok(report.length >= 40, `mindestens 40 Knoepfe gedrueckt (${report.length})`);
  ok(bad.length === 0, `jeder Knopf reagiert sichtbar${bad.length ? `; ohne Reaktion: ${bad.map((x) => `${x.screen}/${x.label}`).join(', ')}` : ''}`);
  ok(report.filter((x) => !x.sound).length === 0, `jeder Knopf macht einen Klang${report.some((x) => !x.sound) ? `; stumm: ${report.filter((x) => !x.sound).map((x) => `${x.screen}/${x.label}`).join(', ')}` : ''}`);
  ok(errors.length === 0, `keine Seitenfehler${errors.length ? ': ' + errors[0] : ''}`);
  await ctx.close();
}

try {
  await waitForServer();
  {
    const browser = await launch();
    try {
      if (!ONLY) {
        await edgeCases(browser);
        await modesCase(browser);
      }
      if (!ONLY || ONLY === 'sweep') await interactionCase(browser);
    } catch (e) {
      console.error(e);
      failures.push(`Randfaelle: ${e}`);
    } finally {
      await browser.close();
    }
  }
  // Eigener Browser je Aufloesung (nach laengerem WebGL-Betrieb haengt in dieser Sandbox sonst die GPU).
  // Standard nacheinander (parallel verlangsamt die Sim im Software-Renderer); SMOKE_PARALLEL=1 spielt alle zugleich.
  const one = async (res) => {
    const browser = await launch();
    try {
      await playStage(browser, res);
    } catch (e) {
      console.error(e);
      failures.push(`${res.join('x')}: ${e}`);
    } finally {
      await browser.close();
    }
  };
  if (process.env.SMOKE_PARALLEL === '1') await Promise.all(RESOLUTIONS.map(one));
  else for (const res of RESOLUTIONS) await one(res);

  // ---- Mobil 390 x 844, Touch -----------------------------------------------------------------------------------
  // eigener Browser: nach dem WebGL-Lauf haengt in dieser Sandbox sonst das naechste goto()
  const mobileBrowser = await launch();
  if (!ONLY) {
    const ctx = await mobileBrowser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const scripts = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.js')) scripts.push(r.url());
    });
    await page.goto(URL_);
    await page.waitForSelector('.gate');
    check((await page.title()) === 'Duskwardens', 'Mobil: Titel = Duskwardens');
    check((await page.locator('canvas').count()) === 0, 'Mobil: kein Canvas im DOM');
    check((await page.locator('.diff').count()) === 0, 'Mobil: keine Stufenwahl');
    const text = await page.locator('.gate').innerText();
    check(/Desktop only/.test(text) && /Duskwardens needs a mouse/.test(text), 'Mobil: Hinweistext');
    check(!scripts.some((u) => /main-/.test(u)), `Mobil: Spiel-Bundle nicht geladen (${scripts.map((u) => u.split('/').pop()).join(', ')})`);
    check(errors.length === 0, 'Mobil: keine Seitenfehler');
    await ctx.close();
  }

  await mobileBrowser.close();
} catch (e) {
  console.error(e);
  failures.push(String(e));
} finally {
  stopServer();
}

if (failures.length) {
  console.error(`\n${failures.length} Pruefung(en) fehlgeschlagen`);
  process.exit(1);
}
console.log('\nSmoke gruen. Screenshots: client/docs/r10/p3-smoke-*.png');
