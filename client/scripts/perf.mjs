// Performance-Messung (P5): volles Feld, Welle 19, 3x, alle Effekte an, Chromium 1920x1080. Zaehlt Frames per requestAnimationFrame.
// Aufbau ueber die Session-Schnittstelle (run.md P5 erlaubt das): 8 Units gesetzt, Welle 19 ohne Zeichnen vorgespult, dann normaler Echtzeit-Takt.
// Aufruf: npm run build && node scripts/perf.mjs   (PERF_SECONDS=15, PERF_LEVEL=2, SMOKE_PORT)
// Headless-Chromium rendert mit SwiftShader (Software, kein GPU): die Werte sind eine Untergrenze fuer echte Rechner.
import { buildTeam, fastForward, launch, openRun, sleep, startServer } from './lib/drive.mjs';

const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const SECONDS = Number(process.env.PERF_SECONDS ?? 15);
const LEVEL = Number(process.env.PERF_LEVEL ?? 2);
const W = 1920;
const H = 1080;

const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openRun(page, url);
  const placed = await buildTeam(page, { units: ['striker', 'gunner', 'blaster', 'lancer', 'frost', 'titan', 'blaster', 'gunner'], level: LEVEL });
  const ff = await fastForward(page, 18);
  // Welle 19 im normalen Takt starten, 3x
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.setSpeed(3);
    s.sim.apply(0, { type: 'skipWave' });
  });
  await sleep(4000); // einlaufen lassen, damit das Feld voll ist
  const res = await page.evaluate(
    (seconds) =>
      new Promise((resolve) => {
        const s = window.__duskwardens.session();
        // JS-Zeit je Frame (ohne GPU/Raster): zeigt, ob der Rechenanteil in ein 60-fps-Budget (16,7 ms) passt
        const js = { fx: 0, entities: 0, overlay: 0, sim: 0, n: 0 };
        const r = window.__duskwardens.renderer();
        const wrap = (obj, name, key) => {
          const o = obj[name].bind(obj);
          obj[name] = (...a) => {
            const t = performance.now();
            const v = o(...a);
            js[key] += performance.now() - t;
            return v;
          };
        };
        wrap(r.fx, 'update', 'fx');
        wrap(r.entities, 'sync', 'entities');
        wrap(r.overlay, 'drawAbove', 'overlay');
        wrap(s, 'advance', 'sim');
        const o2 = r.fx.update;
        r.fx.update = (...a) => {
          js.n++;
          return o2(...a);
        };
        const deltas = [];
        const enemies = [];
        let last = performance.now();
        const t0 = last;
        let nextSample = t0 + 1000;
        const tick = (now) => {
          deltas.push(now - last);
          last = now;
          if (now >= nextSample) {
            enemies.push(s.sim.state.enemies.length);
            nextSample += 1000;
          }
          if (now - t0 < seconds * 1000) requestAnimationFrame(tick);
          else {
            deltas.sort((a, b) => a - b);
            const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            const p = (q) => deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * q))];
            resolve({
              frames: deltas.length,
              fps: +(1000 / avg).toFixed(1),
              p50ms: +p(0.5).toFixed(1),
              p95ms: +p(0.95).toFixed(1),
              p99ms: +p(0.99).toFixed(1),
              over20ms: +((deltas.filter((d) => d > 20).length / deltas.length) * 100).toFixed(1),
              jsMsPerFrame: { fx: +(js.fx / js.n).toFixed(2), entities: +(js.entities / js.n).toFixed(2), overlay: +(js.overlay / js.n).toFixed(2), simAdvance: +(js.sim / js.n).toFixed(2) },
              wave: s.sim.state.wave,
              tick: s.sim.state.tick,
              units: s.sim.state.units.length,
              enemiesMin: Math.min(...enemies),
              enemiesMax: Math.max(...enemies),
              enemiesAvg: +(enemies.reduce((a, b) => a + b, 0) / Math.max(1, enemies.length)).toFixed(0),
              gpu: (() => {
                const gl = document.createElement('canvas').getContext('webgl');
                const ext = gl?.getExtension('WEBGL_debug_renderer_info');
                return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a';
              })(),
            });
          }
        };
        requestAnimationFrame(tick);
      }),
    SECONDS,
  );
  console.log(JSON.stringify({ viewport: `${W}x${H}`, speed: 3, seconds: SECONDS, unitsPlaced: placed, unitLevel: LEVEL, fastForward: ff, ...res, errors }, null, 1));
} finally {
  await browser.close();
  stop();
}
