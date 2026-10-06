// Smoke-Test: baut nichts, startet `vite preview` auf dem vorhandenen dist/ und treibt es mit Playwright (Chromium).
// Runde 5 P1: Je Aufloesung (1280x720, 1920x1080, 2560x1440) wird eine ganze Stage (W1-W20, Normal) nur mit echten
// Mausklicks (`page.mouse.click` auf aus dem Layout berechnete Koordinaten) und Tastatur gespielt, bis Sieg oder Niederlage.
// `evaluate` liest nur Zustand (zum Planen und Pruefen), loest nie eine Spielaktion aus.
// Umgebung: SMOKE_PORT (Standard 4173), SMOKE_RES=1280x720,... (Auswahl), SMOKE_MAX_S (Zeitlimit je Stage, Standard 900).
// Aufruf: npm run build && npm run smoke   (Chromium-Pfad: PLAYWRIGHT_BROWSERS_PATH bzw. SMOKE_CHROMIUM)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = resolve(root, 'docs');
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


const RESOLUTIONS = (process.env.SMOKE_RES ?? '1280x720,1920x1080,2560x1440').split(',').map((r) => r.split('x').map(Number));
const MAX_STAGE_S = Number(process.env.SMOKE_MAX_S ?? 900);

/** Spielplan: Reihenfolge der Units (Katalog-Tasten 1-8: striker, gunner, blaster, banner, farm, lancer, frost, titan). */
const PLAN = ['striker', 'gunner', 'striker', 'blaster', 'gunner', 'frost', 'blaster', 'lancer', 'striker', 'gunner', 'titan', 'blaster', 'lancer', 'gunner', 'banner'];
// danach reihum weiter, bis keine Unit mehr passt oder das Limit greift
for (let i = 0; i < 3; i++) PLAN.push('striker', 'blaster', 'gunner', 'lancer', 'frost', 'titan', 'banner');

async function playStage(browser, [W, H]) {
  const tag = `${W}x${H}`;
  const log = (m) => console.log(`[${tag}] ${m}`);
  const ok = (cond, msg) => check(cond, `${tag}: ${msg}`);
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));

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
        units: st.units.map((u) => ({ id: u.id, def: u.defId, level: u.level, slot: u.slot, up: s.sim.upgradeCost(u.id) })),
        slots: s.sim.slots().map((x) => ({ id: x.id, kind: x.kind, size: x.size, free: x.free, cov: x.coverageByRange(3500) })),
        defs: Object.fromEntries(cat.map((d) => [d.id, { cost: d.placeCost, cap: d.cap, placement: d.placement, footprint: d.footprint, maxLevel: d.maxLevel }])),
        order: [...document.querySelectorAll('.unit-btn')].map((b) => b.dataset.unit),
      };
    });
  const toastText = async () => {
    const t = page.locator('.toast:not(.hidden)');
    return (await t.count()) ? ((await t.first().textContent()) ?? '') : '';
  };

  // ---- Handeln (nur Maus und Tastatur) ----------------------------------------------------------------------------
  const center = async (selector) => {
    const b = await page.locator(selector).first().boundingBox();
    if (!b) throw new Error(`kein Layout fuer ${selector}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const clickSel = async (selector, opts) => {
    const c = await center(selector);
    await page.mouse.move(c.x, c.y);
    await page.mouse.click(c.x, c.y, opts);
  };
  const clickSlot = (id, opts) => clickSel(`.slot[data-slot="${id}"]`, opts);
  /** Spielfeld-Koordinate (Kacheln) in Bildschirmpixel, berechnet aus dem Layout des Canvas. */
  const boardPoint = async (tx, ty) => {
    const b = await page.locator('canvas.board').boundingBox();
    const tile = b.width / 17;
    return { x: b.x + (tx + 0.5) * tile, y: b.y + (ty + 0.5) * tile };
  };
  const clickBoard = async (tx, ty, opts) => {
    const p = await boardPoint(tx, ty);
    await page.mouse.move(p.x, p.y);
    await page.mouse.click(p.x, p.y, opts);
  };
  const press = (k) => page.keyboard.press(k);
  const pickKey = async (def, s) => press(String(s.order.indexOf(def) + 1));

  await page.goto(URL_);
  // ab P6: Hauptmenue vor der Stufenwahl
  await page.waitForSelector('.menu-play, .diff[data-difficulty="normal"]');
  if (await page.locator('.menu-play').isVisible().catch(() => false)) await clickSel('.menu-play');
  await page.waitForSelector('.diff[data-difficulty="normal"]');
  ok((await page.title()) === 'Duskwardens', `Titel = Duskwardens (ist: ${await page.title()})`);
  ok((await page.locator('.diff').count()) === 3, 'Stufenwahl Normal/Hard/Nightmare sichtbar');
  await clickSel('.diff[data-difficulty="normal"]');
  // ab P6: Team-Wahl vor dem Spiel (6 aus 8 vorbelegt)
  await page.waitForSelector('.team-go, canvas.board', { state: 'attached' });
  if (await page.locator('.team-go').isVisible().catch(() => false)) await clickSel('.team-go');
  await page.waitForSelector('canvas.board');
  ok((await page.locator('.overlay.hidden').count()) >= 1 && !(await page.locator('.dialog.start').isVisible()), 'Start-Overlay verschwindet nach Stufenwahl');

  // ---- Layout: alles im Fenster, Slots ueber dem Canvas -----------------------------------------------------------
  const lay = await page.evaluate(() => {
    const c = document.querySelector('canvas.board').getBoundingClientRect();
    const outside = [...document.querySelectorAll('.slot')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.left < c.left - 1 || r.top < c.top - 1 || r.right > c.right + 1 || r.bottom > c.bottom + 1;
    }).length;
    const shop = document.querySelector('.shop').getBoundingClientRect();
    const hud = document.querySelector('.hud').getBoundingClientRect();
    return { outside, board: [c.left, c.top, c.right, c.bottom], shopBottom: shop.bottom, hudTop: hud.top, vw: innerWidth, vh: innerHeight, n: document.querySelectorAll('.slot').length, scrollH: document.documentElement.scrollHeight };
  });
  ok(lay.outside === 0, `alle Slot-Knoepfe liegen ueber dem Spielfeld (ausserhalb: ${lay.outside})`);
  ok(lay.n === 26, `26 Slot-Knoepfe (ist: ${lay.n})`);
  ok(lay.board[0] >= 0 && lay.board[2] <= lay.vw && lay.board[1] >= lay.hudTop && lay.board[3] <= lay.vh, `Spielfeld liegt im Fenster ${JSON.stringify(lay.board.map(Math.round))}`);
  ok(lay.shopBottom <= lay.vh + 1 && lay.scrollH <= lay.vh + 1, `Unit-Leiste sichtbar, keine Seiten-Scrollleiste (Shop-Ende ${Math.round(lay.shopBottom)} von ${lay.vh})`);
  const types = await page.evaluate(() => {
    const n = { ground: 0, hill: 0, large: 0 };
    document.querySelectorAll('.slot').forEach((e) => n[e.dataset.type]++);
    return n;
  });
  ok(types.ground === 13 && types.hill === 10 && types.large === 3, `Slot-Typen sichtbar markiert: ${JSON.stringify(types)}`);
  const ver = (await page.locator('.version').textContent()) ?? '';
  ok(/build \S+ - \d{4}-\d\d-\d\d/.test(ver), `Version unten rechts: "${ver}"`);
  const vb = await page.locator('.version').boundingBox();
  ok(vb && vb.x + vb.width > W - 250 && vb.y + vb.height > H - 40, 'Version liegt unten rechts');

  // ---- Ersthinweise, Hilfe ----------------------------------------------------------------------------------------
  ok((await page.locator('.hints:not(.hidden)').count()) === 1 && /Tip 1 of 3/.test((await page.locator('.hints').textContent()) ?? ''), 'Ersthinweis 1 von 3 sichtbar');
  await press('?');
  ok(await page.locator('.help:not(.hidden)').isVisible(), 'Hilfe oeffnet mit ?');
  ok(/1-8/.test((await page.locator('.help').textContent()) ?? '') && /Esc/.test((await page.locator('.help').textContent()) ?? ''), 'Hilfe listet Tastenkuerzel');
  await press('Escape');
  ok(!(await page.locator('.help:not(.hidden)').count()), 'Esc schliesst die Hilfe');
  await press('h');
  await clickSel('.help-close');
  ok(!(await page.locator('.help:not(.hidden)').count()), 'H oeffnet, Knopf schliesst');

  // ---- Keine toten Klicks: jede Reaktion sichtbar ------------------------------------------------------------------
  let s = await snap();
  const toastAfter = async (fn, re, what) => {
    await fn();
    await sleep(120);
    const t = await toastText();
    ok(re.test(t), `${what}: Toast "${t}"`);
  };
  await toastAfter(() => clickSlot(0), /Pick a unit/, 'Klick auf freien Slot ohne Unit-Wahl');
  await toastAfter(() => clickBoard(0.2, 10.3), /Nothing here/, 'Klick ins Leere (nichts gewaehlt)');
  const hillUnit = ['gunner', 'titan'].find((u) => s.order.includes(u));
  const groundUnit = ['striker', 'blaster'].find((u) => s.order.includes(u));
  await pickKey(hillUnit, s);
  await sleep(100);
  ok((await snap()).placing === hillUnit, 'Zifferntaste waehlt die Huegel-Unit');
  ok((await page.locator('.slot.free').count()) === 10 && (await page.locator('.slot.nofit').count()) === 16, 'Platzier-Modus: 10 Huegel leuchten, 16 andere grau');
  ok(/Tip 2 of 3/.test((await page.locator('.hints').textContent()) ?? ''), 'Ersthinweis 2 von 3');
  const nofitSlot = await center('.slot[data-slot="0"]');
  await page.mouse.move(nofitSlot.x, nofitSlot.y);
  await sleep(150);
  ok(/needs a hill slot/.test((await page.locator('.slot[data-slot="0"] .why').textContent()) ?? ''), 'unpassender Slot nennt den Grund beim Darueberfahren');
  await page.screenshot({ path: resolve(docs, `screenshot-p1-placing-${tag}.png`) });
  await toastAfter(() => clickSlot(0), /needs a hill slot/, 'falscher Slot-Typ');
  ok((await snap()).units.length === 0, 'falscher Slot-Typ platziert nichts');
  await toastAfter(() => clickBoard(0.2, 10.3), /Not a slot/, 'Klick ins Leere im Platzier-Modus');
  await clickSel('.slot[data-slot="23"]', { button: 'right' });
  await sleep(100);
  ok((await snap()).placing === null, 'Rechtsklick bricht das Platzieren ab');
  await pickKey(groundUnit, s);
  await press('Escape');
  await sleep(100);
  ok((await snap()).placing === null, 'Esc bricht das Platzieren ab');
  if (s.order.includes('farm')) {
    await pickKey('farm', s);
    await toastAfter(() => clickSlot(8), /Farm needs a large/, 'Farm auf kleinem Slot');
    await clickSlot(23);
    await sleep(150);
    ok((await snap()).units.some((u) => u.def === 'farm' && u.slot === 23), 'Farm auf grossem Slot wird platziert');
    await press('Escape');
  }

  // ---- Die Stage: nur Mausklicks und Tasten -----------------------------------------------------------------------
  await clickSel('.btn.speed[data-speed="3"]');
  const stats = { place: 0, upgrade: 0, wave: 0, rejected: 0, sell: 0 };
  let planIdx = 0;
  let lastWave = -1;
  let toldPoor = false;
  const t0 = Date.now();
  let stuck = 0;
  while (true) {
    s = await snap();
    if (!s) throw new Error('keine Session');
    if (s.over) break;
    if ((Date.now() - t0) / 1000 > MAX_STAGE_S) {
      log(`Zeitlimit ${MAX_STAGE_S}s erreicht (Welle ${s.wave}, Leben ${s.lives})`);
      break;
    }
    if (s.wave !== lastWave) {
      lastWave = s.wave;
      log(`Welle ${s.wave}/20, Leben ${s.lives}/${s.maxLives}, Muenzen ${s.coins}, Units ${s.units.length}, ${Math.round((Date.now() - t0) / 1000)}s`);
    }
    let acted = false;
    // 1) naechste Unit des Plans platzieren
    const want = PLAN[planIdx];
    if (want && !s.order.includes(want)) planIdx++; // nicht im Team
    else if (want) {
      const d = s.defs[want];
      const count = s.units.filter((u) => u.def === want).length;
      if (count >= d.cap) planIdx++;
      else {
        const fits = s.slots.filter((x) => x.free && (d.placement === 'hybrid' || d.placement === x.kind) && d.footprint <= x.size).sort((a, b) => b.cov - a.cov);
        if (fits.length === 0) planIdx++;
        else if (s.coins >= d.cost) {
          await pickKey(want, s);
          await clickSlot(fits[0].id);
          stats.place++;
          planIdx++;
          acted = true;
        } else if (!toldPoor && s.units.length >= 3) {
          // Muenzen reichen nicht: der Versuch muss den Grund nennen
          toldPoor = true;
          await pickKey(want, s);
          await toastAfter(() => clickSlot(fits[0].id), /Not enough coins: \w+ costs \d+, you have \d+/, 'zu wenig Muenzen');
          await press('Escape');
        }
      }
    }
    // 2) sonst upgraden (niedrigste Stufe zuerst), nachdem der Plan bis zur Haelfte steht oder Geld uebrig ist
    if (!acted && (planIdx >= 4 || s.units.length >= 4)) {
      const ups = s.units.filter((u) => u.up !== null && s.coins >= u.up && (planIdx >= PLAN.length || s.coins >= u.up + (s.defs[PLAN[planIdx]]?.cost ?? 0) * 0.3)).sort((a, b) => a.level - b.level || a.up - b.up);
      if (ups[0]) {
        await clickSlot(ups[0].slot);
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
  const fin = await snap();
  log(`Ende: ${fin.result ?? 'Zeitlimit'} bei Welle ${fin.wave}, Leben ${fin.lives}, Platzieren ${stats.place}, Upgrades ${stats.upgrade}, Wellenrufe ${stats.wave}, ${Math.round((Date.now() - t0) / 1000)}s`);
  ok(fin.over, `Stage laeuft bis Sieg oder Niederlage durch (Ergebnis: ${fin.result}, Welle ${fin.wave})`);
  ok(stats.place >= 4 && stats.upgrade >= 3, `echte Maus-Aktionen: ${stats.place} Platzierungen, ${stats.upgrade} Upgrades`);
  ok(fin.units.length > 0 || fin.result === 'loss', `Units auf dem Feld oder Niederlage (${fin.units.length})`);
  ok(fin.kills > 20, `Units haben Gegner besiegt (${fin.kills})`);
  if (fin.over) {
    await page.waitForSelector('.dialog.end', { timeout: 5000 }).catch(() => {});
    ok(await page.locator('.dialog.end').isVisible(), 'Ergebnis-Bildschirm erscheint');
    log(`Ergebnis: ${await page.locator('.dialog.end .title').textContent()} - ${await page.locator('.dialog.end .stats').textContent()}`);
  }
  ok(errors.length === 0, `keine Konsolenfehler${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}

try {
  await waitForServer();
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
  {
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
console.log('\nSmoke gruen. Screenshots: client/docs/screenshot-p1-placing-*.png');
