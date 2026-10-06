// Replay-Abnahme (Runde 5 / P2): spielt im echten Browser eine Runde, exportiert die Replay-Datei (Download abgefangen)
// und laesst `npm run replay -- DATEI` in sim/ nachspielen. Gruen = gleicher End-Hash.
//   npm run build && SMOKE_PORT=4302 node scripts/replay-check.mjs [--full] [--out DATEI]
// Standard: bis Welle 3 spielen, pausieren, ueber den Pause-Knopf herunterladen (Zwischenstand, `complete: false`).
// --full: bis zum Ende spielen (Sieg oder Niederlage), Text in "What felt bad?" tippen, ueber den End-Bildschirm laden.
// Spielaktionen laufen ueber die Session-Methoden (wie die UI), Download und Textfeld ueber echte Klicks.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

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
  await page.evaluate(() => window.__duskwardens.session().setSpeed(3));

  // Ein "Mensch": kauft nach Plan, baut aus, ruft Wellen frueh, wechselt Tempo und pausiert kurz. Nur Session-Methoden.
  const PLAN = ['striker', 'gunner', 'striker', 'blaster', 'gunner', 'banner', 'striker', 'frost'];
  const tickPlay = () =>
    page.evaluate((plan) => {
      const s = window.__duskwardens.session();
      const sim = s.sim;
      const st = sim.state;
      if (s.over) return { over: true, wave: st.wave };
      const slots = sim.slots();
      const defs = Object.fromEntries(sim.catalog().map((d) => [d.id, d]));
      for (const id of plan) {
        const d = defs[id];
        if (!d || st.players[0].coins < d.placeCost) continue;
        const slot = slots.find((x) => x.free && (d.placement === 'hybrid' || d.placement === x.kind) && x.size >= d.footprint && !st.units.some((u) => u.slot === x.id));
        if (!slot) continue;
        s.choosePlacing(id);
        s.clickSlot(slot.id);
        break;
      }
      s.cancel();
      for (const u of st.units) {
        const c = sim.upgradeCost(u.id);
        if (c !== null && st.players[0].coins >= c + 40) {
          s.selectedUnit = u.id;
          s.upgrade();
          break;
        }
      }
      s.cancel();
      if (st.enemies.length === 0 && st.phase !== 'over') s.startNextWave();
      return { over: false, wave: st.wave };
    }, PLAN);

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
      await page.evaluate(() => window.__duskwardens.session().setSpeed(2));
      await page.evaluate(() => window.__duskwardens.session().setSpeed(3));
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
check(rec.format === 'towerdef-replay' && rec.commands.length > 0, `Datei: ${rec.commands.length} Befehle, ${rec.waves.length} Wellen, complete=${rec.complete}`);
check(rec.controls.some((c) => c.type === 'speed') && rec.controls.some((c) => c.type === 'pause'), 'Tempo- und Pause-Wechsel aufgezeichnet');
if (full) check(rec.complete && rec.result && rec.feedback.includes('unfair'), `Ergebnis ${rec.result}, Freitext in der Datei`);

const r = spawnSync('npx', ['tsx', 'scripts/replay.ts', file], { cwd: simDir, encoding: 'utf8' });
console.log(r.stdout);
check(r.status === 0, `replay: End-Hash stimmt (Exit ${r.status}) ${r.stderr}`);

stopServer();
console.log(failures.length ? `\n${failures.length} Fehler` : `\nReplay-Abnahme gruen: ${file}`);
process.exit(failures.length ? 1 : 0);
