// Gemeinsame Helfer fuer perf.mjs und shots-p5.mjs: Preview-Server, Chromium, Runde ueber die Session-Schnittstelle aufbauen.
// Erlaubt (run.md Abschnitt 4, P5): Die Runde wird hier ueber `window.__duskwardens.session()` aufgebaut (Aufbau/Schnellvorlauf per Sim-Befehl),
// das Messen und Fotografieren laeuft danach im normalen Echtzeit-Takt der Seite.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startServer(port) {
  const url = `http://127.0.0.1:${port}/`;
  const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore', detached: true });
  const stop = () => {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      /* weg */
    }
  };
  process.on('exit', stop);
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* noch nicht oben */
    }
    await sleep(250);
  }
  return { url, stop };
}

export async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM ?? '/opt/pw-browsers/chromium' });
  }
}

/** Menue -> Normal -> Team -> Spielfeld (echte Klicks), danach Zugriff auf die Session. */
export async function openRun(page, url, difficulty = 'normal') {
  await page.goto(url);
  await page.waitForSelector('.menu-play, .diff[data-difficulty="normal"]');
  if (await page.locator('.menu-play').isVisible().catch(() => false)) await page.locator('.menu-play').click();
  await page.waitForSelector(`.diff[data-difficulty="${difficulty}"]`);
  await page.locator(`.diff[data-difficulty="${difficulty}"]`).click();
  await page.waitForSelector('.team-go, canvas.board', { state: 'attached' });
  if (await page.locator('.team-go').isVisible().catch(() => false)) await page.locator('.team-go').click();
  await page.waitForSelector('canvas.board');
  // Ersthinweise stoeren auf Screenshots
  await page.evaluate(() => {
    try {
      localStorage.setItem('dw.hints', JSON.stringify({ off: true }));
    } catch {
      /* egal */
    }
  });
}

/** Im Browser: Units setzen (Muenzen und Leben aufgestockt, nur Testaufbau), optional hochruesten. Gibt die Anzahl gesetzter Units zurueck. */
export function buildTeam(page, { units, level = 0 }) {
  return page.evaluate(
    ({ units, level }) => {
      const s = window.__duskwardens.session();
      const st = s.sim.state;
      st.godMode = true;
      st.players[0].coins = 10_000_000;
      let placed = 0;
      for (const id of units) {
        // Freie Platzierung: Raster-Kandidaten der Sim, beste Pfadabdeckung zuerst
        const spots = [...s.sim.placementGrid(id)].sort((a, b) => s.sim.coverage(b.x, b.y, 3500) - s.sim.coverage(a.x, a.y, 3500));
        for (const sp of spots) {
          const r = s.sim.apply(0, { type: 'place', unitId: id, x: sp.x, y: sp.y });
          if (r.ok) {
            placed++;
            for (let i = 0; i < level; i++) s.sim.apply(0, { type: 'upgrade', entityId: r.entityId });
            break;
          }
        }
      }
      return placed;
    },
    { units, level },
  );
}

/** Im Browser: ohne Zeichnen vorspulen, bis Welle `wave` laeuft (jede Welle sofort rufen, sobald das Feld leer ist oder nach `maxTicksPerWave`). */
export function fastForward(page, wave, { stopAtBossTelegraph = false } = {}) {
  return page.evaluate(
    ({ wave }) => {
      const s = window.__duskwardens.session();
      const st = s.sim.state;
      let guard = 0;
      while (st.wave < wave && !s.over && guard++ < 400000) {
        if (st.phase === 'prep' || st.enemies.length === 0) s.sim.apply(0, { type: 'skipWave' });
        s.sim.step(1);
        s.sim.drainEvents();
      }
      return { wave: st.wave, tick: st.tick, enemies: st.enemies.length, over: s.over };
    },
    { wave },
  );
}
