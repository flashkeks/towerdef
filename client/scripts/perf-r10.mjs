// Runde 10 / P2: Leistungsbeleg fuer das Match mit Figuren und Angriffs-Grafik: 30 Units im Dauerfeuer, >= 80 Gegner auf dem Feld, 1920x1080.
// Aufbau ueber die Session-Schnittstelle (Testaufbau, wie lib/drive.mjs): 30 Units gesetzt (6 Typen x 5), Wellen gestapelt, bis 80 Gegner stehen,
// dann Frames per requestAnimationFrame zaehlen, dazu die JS-Zeit je Frame (Effekte, Figuren) und die Obergrenzen der Effekt-Pools.
// Aufruf: npm run build && node scripts/perf-r10.mjs   (PERF_SECONDS=15, PERF_ENEMIES=80, PERF_SPEED=1, SHOT_PORT)
// Headless-Chromium rendert mit SwiftShader (Software, kein GPU): die Werte sind eine Untergrenze fuer echte Rechner.
import { buildTeam, launch, sleep, startServer } from './lib/drive.mjs';
import { setupRun } from './lib/profile.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4495);
const SECONDS = Number(process.env.PERF_SECONDS ?? 15);
const ENEMIES = Number(process.env.PERF_ENEMIES ?? 80);
const SPEED = Number(process.env.PERF_SPEED ?? 1);
const W = 1920;
const H = 1080;
const TEAM = ['sanji', 'honey', 'kakashi', 'tatsumaki', 'ulquiorra_evolved', 'tanjiro'];

const { url, stop } = await startServer(PORT);
const browser = await launch();
try {
  const page = await setupRun(browser, url, TEAM, { width: W, height: H });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const placed = await buildTeam(page, { units: [...TEAM, ...TEAM, ...TEAM, ...TEAM, ...TEAM], level: 0 });
  // Wellen stapeln, bis genug Gegner auf dem Feld stehen (ohne Zeichnen); Leben bleiben dank godMode
  const stacked = await page.evaluate((target) => {
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    st.godMode = true;
    let guard = 0;
    while (st.enemies.length < target && !s.over && guard++ < 60000) {
      if (guard % 25 === 0) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
      s.sim.drainEvents();
    }
    return { enemies: st.enemies.length, wave: st.wave, ticks: guard };
  }, ENEMIES);
  await page.evaluate((speed) => window.__duskwardens.session().setSpeed(speed), SPEED);
  await sleep(1500);
  const res = await page.evaluate(
    (seconds) =>
      new Promise((resolve) => {
        const s = window.__duskwardens.session();
        const r = window.__duskwardens.renderer();
        const js = { fx: 0, entities: 0, sim: 0, n: 0 };
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
        wrap(s, 'advance', 'sim');
        const o2 = r.fx.update;
        r.fx.update = (...a) => {
          js.n++;
          return o2(...a);
        };
        const deltas = [];
        const enemies = [];
        const fxMax = { effects: 0, particles: 0, numbers: 0 };
        let last = performance.now();
        const t0 = last;
        let nextSample = t0 + 500;
        const tick = (now) => {
          deltas.push(now - last);
          last = now;
          if (now >= nextSample) {
            enemies.push(s.sim.state.enemies.length);
            const a = r.fx.active;
            for (const k of Object.keys(fxMax)) fxMax[k] = Math.max(fxMax[k], a[k]);
            nextSample += 500;
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
              jsMsPerFrame: { fx: +(js.fx / js.n).toFixed(2), entities: +(js.entities / js.n).toFixed(2), simAdvance: +(js.sim / js.n).toFixed(2) },
              wave: s.sim.state.wave,
              units: s.sim.state.units.length,
              enemiesMin: Math.min(...enemies),
              enemiesMax: Math.max(...enemies),
              fxPeak: fxMax,
              views: r.entities.counts,
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
  console.log(JSON.stringify({ viewport: `${W}x${H}`, speed: SPEED, seconds: SECONDS, unitsPlaced: placed, stacked, ...res, errors }, null, 1));
} finally {
  await browser.close();
  stop();
}
