// Replay-Abnahme (Runde 5 / P2): spielt im echten Browser eine Runde, exportiert die Replay-Datei (Download abgefangen)
// und laesst `npm run replay -- DATEI` in sim/ nachspielen. Gruen = gleicher End-Hash.
//   npm run build && SMOKE_PORT=4302 node scripts/replay-check.mjs [--full] [--out DATEI]
// Standard: bis Welle 3 spielen, pausieren, ueber den Pause-Knopf herunterladen (Zwischenstand, `complete: false`).
// --full: bis zum Ende spielen (Sieg oder Niederlage), Text in "What felt bad?" tippen, ueber den End-Bildschirm laden.
// Runde 6: Replay-Format v2, platziert wird mit ECHTEN Mausklicks auf freie Positionen (Stellen lesend aus `placementGrid`/`canPlace`,
// `scripts/lib/mouse.mjs`), Upgrades per Klick auf die Unit + Taste U, Wellenruf per Taste N, Tempo per Knopf, Pause per Leertaste.
// `evaluate` liest nur Zustand. Download und Textfeld ebenfalls ueber echte Klicks. Hash des Browser-Laufs == Hash des Nachspielens.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { clickWorld, readSpots } from './lib/mouse.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const simDir = resolve(root, '../sim');
const full = process.argv.includes('--full');
const outIdx = process.argv.indexOf('--out');
const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const URL_ = `http://127.0.0.1:${PORT}/`;
const outDir = mkdtempSync(join(tmpdir(), 'replay-check-'));
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
const stopServer = () => {
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    /* schon weg */
  }
};
process.on('exit', stopServer);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; ; i++) {
  try {
    if ((await fetch(URL_)).ok) break;
  } catch {
    /* noch nicht oben */
  }
  if (i > 60) throw new Error('vite preview startet nicht');
  await sleep(250);
}

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

let file = null;
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL_);
  await page.click('.menu-play'); // P6: Hauptmenue -> Stufe -> Team
  await page.click('.diff[data-difficulty="normal"]');
  await page.click('.team-go');
  await page.waitForSelector('canvas.board');
  await page.click('.btn.speed[data-speed="3"]');

  // Ein "Mensch": kauft nach Plan, baut aus, ruft Wellen frueh, wechselt Tempo und pausiert kurz. Nur Maus und Tastatur.
  const PLAN = ['striker', 'gunner', 'striker', 'blaster', 'gunner', 'banner', 'striker', 'frost'];
  const read = () =>
    page.evaluate(() => {
      const s = window.__duskwardens.session();
      const st = s.sim.state;
      return {
        over: s.over,
        wave: st.wave,
        phase: st.phase,
        coins: st.players[0].coins,
        enemies: st.enemies.length,
        units: st.units.map((u) => ({ id: u.id, x: u.x, y: u.y, up: s.sim.upgradeCost(u.id) })),
        cost: Object.fromEntries(s.sim.catalog().map((d) => [d.id, d.placeCost])),
        order: [...document.querySelectorAll('.unit-btn')].map((b) => b.dataset.unit),
      };
    });
  let planIdx = 0;
  const tickPlay = async () => {
    const st = await read();
    if (st.over) return { over: true, wave: st.wave };
    // naechste Unit des Plans: gelesene freie Stelle, echter Klick
    const want = PLAN[planIdx % PLAN.length];
    if (!st.order.includes(want)) planIdx++;
    else if (st.coins >= st.cost[want]) {
      const spots = await readSpots(page, want, 3);
      if (spots.length === 0) planIdx++;
      else {
        await page.keyboard.press(String(st.order.indexOf(want) + 1));
        for (const sp of spots) {
          await clickWorld(page, sp[0], sp[1]);
          await sleep(50);
          if ((await read()).units.length > st.units.length) break;
        }
        await page.keyboard.press('Escape');
        planIdx++;
      }
    }
    for (const u of st.units) {
      if (u.up !== null && st.coins >= u.up + 40) {
        await clickWorld(page, u.x, u.y); // Unit anklicken, dann U
        await page.keyboard.press('u');
        await page.keyboard.press('Escape');
        break;
      }
    }
    if (st.enemies === 0 && st.phase !== 'over') await page.keyboard.press('n');
    return { over: false, wave: st.wave };
  };

  const limit = Date.now() + (full ? 8 * 60_000 : 120_000);
  let info = { over: false, wave: 0 };
  let toggled = false;
  while (Date.now() < limit) {
    info = await tickPlay();
    if (info.over) break;
    if (!full && info.wave >= 3) break;
    if (!toggled && info.wave >= 2) {
      // Pause/Weiter und Tempowechsel gehoeren in die Aufzeichnung
      await page.keyboard.press('Space');
      await sleep(300);
      await page.keyboard.press('Space');
      await page.click('.btn.speed[data-speed="2"]');
      await page.click('.btn.speed[data-speed="3"]');
      toggled = true;
    }
    await sleep(400);
  }

  let download;
  if (full) {
    check(info.over, `Runde zu Ende (Welle ${info.wave})`);
    await page.waitForSelector('.replay-feedback');
    await page.fill('.replay-feedback', 'Test: the first boss felt unfair.');
    [download] = await Promise.all([page.waitForEvent('download'), page.click('.replay-download')]);
  } else {
    check(!info.over && info.wave >= 3, `Welle ${info.wave} erreicht, Runde laeuft noch`);
    await page.keyboard.press('Space');
    await page.waitForSelector('.replay-pause-download:not(.hidden)');
    [download] = await Promise.all([page.waitForEvent('download'), page.click('.replay-pause-download')]);
  }
  const name = download.suggestedFilename();
  file = outIdx > 0 ? resolve(process.argv[outIdx + 1]) : resolve(outDir, name);
  await download.saveAs(file);
  check(/^duskwardens-normal-(win|loss|pause)-\d{4}-\d{2}-\d{2}\.json$/.test(name), `Dateiname passt (${name})`);
  check(errors.length === 0, `keine Seitenfehler${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally {
  await browser.close();
}

const rec = JSON.parse(readFileSync(file, 'utf8'));
check(rec.format === 'towerdef-replay' && rec.formatVersion === 2 && rec.commands.length > 0, `Datei: ${rec.commands.length} Befehle, ${rec.waves.length} Wellen, complete=${rec.complete}`);
const places = rec.commands.filter((c) => c.cmd.type === 'place');
check(places.length >= 3 && places.every((c) => Number.isInteger(c.cmd.x) && Number.isInteger(c.cmd.y) && c.cmd.slot === undefined), `Format v2: ${places.length} Platzierungen mit x/y (Milli-Tiles), ${places.filter((c) => c.ok).length} angenommen`);
check(rec.controls.some((c) => c.type === 'speed') && rec.controls.some((c) => c.type === 'pause'), 'Tempo- und Pause-Wechsel aufgezeichnet');
if (full) check(rec.complete && rec.result && rec.feedback.includes('unfair'), `Ergebnis ${rec.result}, Freitext in der Datei`);

const r = spawnSync('npx', ['tsx', 'scripts/replay.ts', file], { cwd: simDir, encoding: 'utf8' });
console.log(r.stdout);
check(r.status === 0, `replay: End-Hash stimmt (Exit ${r.status}) ${r.stderr}`);

stopServer();
console.log(failures.length ? `\n${failures.length} Fehler` : `\nReplay-Abnahme gruen: ${file}`);
process.exit(failures.length ? 1 : 0);
