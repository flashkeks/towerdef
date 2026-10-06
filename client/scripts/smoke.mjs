// Smoke-Test: baut nichts, startet `vite preview` auf dem vorhandenen dist/ und treibt es mit Playwright (Chromium).
// Aufruf: npm run build && npm run smoke   (Chromium-Pfad: PLAYWRIGHT_BROWSERS_PATH bzw. SMOKE_CHROMIUM)
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = resolve(root, 'docs');
mkdirSync(docs, { recursive: true });
const PORT = 4173;
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

try {
  await waitForServer();

  // ---- Screenshot (eigener Browser, vor allem anderen) ------------------------------------------------------------
  {
    const shotBrowser = await launch();
    const shotCtx = await shotBrowser.newContext({ viewport: { width: 1280, height: 800 } });
    // Screenshot auf frischer Seite, Aufbau ueber die Session-Schnittstelle statt ueber Mausklicks:
    // In der Headless-Sandbox (SwiftShader) bleibt das WebGL-Canvas nach echten Hover-/Klickfolgen im Screenshot leer,
    // obwohl die Sim laeuft. Das ist ein Umgebungsartefakt; die Klickpfade prueft der Desktop-Lauf darunter.
    const shotPage = await shotCtx.newPage();
    await shotPage.goto(URL_);
    await shotPage.click('.diff[data-difficulty="normal"]');
    await shotPage.waitForSelector('canvas.board');
    await shotPage.evaluate(() => {
      const x = window.__duskwardens.session();
      x.choosePlacing('striker');
      x.clickSlot(8);
      x.clickSlot(9);
      x.choosePlacing('gunner');
      x.clickSlot(5);
      x.cancel();
      x.setSpeed(2);
      x.startNextWave();
    });
    await sleep(9000);
    await shotPage.screenshot({ path: resolve(docs, 'screenshot-m1.png') });
    await shotBrowser.close();
  }

  // ---- Desktop 1280 x 800 (eigener Browser: nach laengerem WebGL-Betrieb haengt in dieser Sandbox die GPU)
  const browser = await launch();
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));

    await page.goto(URL_);
    await page.waitForSelector('.diff[data-difficulty="normal"]');
    check((await page.title()) === 'Duskwardens', `Titel = Duskwardens (ist: ${await page.title()})`);
    check((await page.locator('.diff').count()) === 3, 'Stufenwahl Normal/Hard/Nightmare sichtbar');
    await page.click('.diff[data-difficulty="normal"]');
    await page.waitForSelector('canvas.board');
    check((await page.locator('.overlay.hidden').count()) === 1, 'Start-Overlay verschwindet nach Stufenwahl');

    const state = () => page.evaluate(() => {
      const s = window.__duskwardens?.session();
      if (!s) return null;
      const st = s.sim.state;
      return { tick: st.tick, wave: st.wave, units: st.units.length, enemies: st.enemies.length, spawned: st.stats.spawned, kills: st.stats.kills, lives: st.lives, coins: st.players[0].coins, phase: st.phase, levels: st.units.map((u) => u.level) };
    });

    const place = async (unit, slot) => {
      const btn = page.locator(`.unit-btn[data-unit="${unit}"]`);
      if (!(await btn.evaluate((e) => e.classList.contains('active')))) await btn.click();
      await page.click(`.slot[data-slot="${slot}"]`);
    };
    await place('striker', 8);
    await place('striker', 9);
    await place('gunner', 5);
    await page.keyboard.press('Escape');
    let s = await state();
    check(s && s.units === 3, `3 Units platziert (ist: ${s?.units})`);

    // Upgrade ueber das Unit-Panel
    await page.click('.slot[data-slot="8"]');
    await page.waitForSelector('.btn.upgrade');
    await page.click('.btn.upgrade');
    s = await state();
    check(s && s.levels.some((l) => l === 1), 'Upgrade ausgefuehrt (Level 1)');

    // Wellenvorschau und Risikokarte
    check((await page.locator('.preview .rows li').count()) > 0, 'Wellenvorschau zeigt Gegnergruppen');
    await page.click('.card[data-card="thick-hide"]');
    const card = await page.evaluate(() => window.__duskwardens.session().sim.state.nextCard);
    check(card === 'thick-hide', 'Risikokarte gewaehlt (Sim-Zustand)');

    // Wellenstart, Tempo 3x, laufen lassen
    await page.click('.btn.start');
    await page.click('.btn.speed[data-speed="3"]');
    await sleep(1500);
    s = await state();
    check(s && s.wave >= 1, `Welle gestartet (Wave ${s?.wave})`);
    await sleep(6500);
    s = await state();
    console.log('Zustand nach Lauf:', JSON.stringify(s));
    check(s && s.tick > 100, `Sim laeuft (Tick ${s?.tick})`);
    check(s && s.spawned > 0, `Gegner sind erschienen (${s?.spawned})`);
    check(s && s.kills > 0, `Units haben Gegner besiegt (${s?.kills})`);
    await page.keyboard.press('Escape');
    await page.mouse.move(1140, 760);
    // Verkaufen
    await page.click('.slot[data-slot="9"]');
    await page.waitForSelector('.btn.sell');
    await page.click('.btn.sell');
    s = await state();
    check(s && s.units === 2, 'Verkauf entfernt die Unit');

    check(errors.length === 0, `keine Konsolenfehler${errors.length ? ': ' + errors.join(' | ') : ''}`);

    await ctx.close();
  }

  // ---- Mobil 390 x 844, Touch -----------------------------------------------------------------------------------
  // eigener Browser: nach dem WebGL-Lauf haengt in dieser Sandbox sonst das naechste goto()
  await browser.close();
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
    await page.screenshot({ path: resolve(docs, 'screenshot-gate.png') });
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
console.log('\nSmoke gruen. Screenshots: client/docs/screenshot-m1.png, client/docs/screenshot-gate.png');
