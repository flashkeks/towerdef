// Runde 10 / P2: Screenshots des Matches: viele Units (Nahkampf, Fernkampf, Flaeche), Angriffe je Element, Faehigkeits-Ansage, Boss, Platzier-Vorschau.
// Braucht dist/ (npm run build). Schreibt client/docs/r10/p2-*.png. Port: SHOT_PORT (Standard 4492). Aufloesung: SHOT_W x SHOT_H (Standard 1920 x 1080).
// Das Profil wird nach dem Starter-Geschenk im localStorage mit den Test-Units und einem Team aufgestockt (nur Testaufbau, wie shots-r9-p1).
// Bilder: lokal gibt es keine Porträts (/aa/index.json fehlt), also zeigen die Screenshots die gestalteten Ersatzfiguren. Mit SHOT_PORTRAITS=1 werden
// fuer die Team-Units Stand-in-Bilder (erzeugte SVG-Gesichter) ueber /aa/units/<id>.webp eingespielt, nur um den Bildpfad im Match zu zeigen.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildTeam, launch, root, sleep, startServer } from './lib/drive.mjs';
import { setupRun } from './lib/profile.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4492);
const W = Number(process.env.SHOT_W ?? 1920);
const H = Number(process.env.SHOT_H ?? 1080);
const ONLY = process.env.SHOT_ONLY ?? '';
const OUT = process.env.SHOT_DIR ?? resolve(root, 'docs', 'r10');
mkdirSync(OUT, { recursive: true });
const TEAMS = {
  mix: ['sanji', 'honey', 'kakashi', 'tatsumaki', 'ulquiorra_evolved', 'tanjiro'],
  magic: ['nezuko', 'law', 'jotaro', 'dazai_evolved', 'goku_black', 'zoro'],
};
const { url, stop } = await startServer(PORT);
const browser = await launch();
const shot = (page, name) => page.screenshot({ path: resolve(OUT, `p2-${name}.png`) });

const setup = (team) => setupRun(browser, url, team, { width: W, height: H });

/** Vorspulen ohne Zeichnen, bis ein Gegner-Typ auf dem Feld steht (oder Welle erreicht). */
const spoolTo = (page, pred) =>
  page.evaluate((predSrc) => {
    const pred = new Function('st', `return (${predSrc})(st)`);
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    st.godMode = true;
    let guard = 0;
    while (guard++ < 200000 && !s.over && !pred(st)) {
      if ((st.phase === 'prep' || st.enemies.length === 0) && st.wave < 14) s.sim.apply(0, { type: 'skipWave' });
      s.sim.step(1);
      s.sim.drainEvents();
    }
    return { wave: st.wave, enemies: st.enemies.length, guard };
  }, pred.toString());

/** Vorspulen, bis in den letzten drei Ticks mindestens `min` Units gefeuert haben (Abklingzeit steigt): dann zeigen die naechsten Frames viele Angriffe. */
const spoolToVolley = (page, min, minEnemies = 8, fromWave = 0) =>
  page.evaluate(
    ({ min, minEnemies, fromWave }) => {
      const s = window.__duskwardens.session();
      const st = s.sim.state;
      st.godMode = true;
      const prev = new Map();
      const recent = [];
      let guard = 0;
      while (guard++ < 300000 && !s.over) {
        if ((st.phase === 'prep' || st.enemies.length === 0) && st.wave < 14) s.sim.apply(0, { type: 'skipWave' });
        s.sim.step(1);
        s.sim.drainEvents();
        let fired = 0;
        for (const u of st.units) {
          const p = prev.get(u.id);
          if (p !== undefined && u.cd > p) fired++;
          prev.set(u.id, u.cd);
        }
        recent.push(fired);
        if (recent.length > 8) recent.shift();
        if (st.wave >= fromWave && st.enemies.length >= minEnemies && recent.reduce((a, b) => a + b, 0) >= min) break;
      }
      return { wave: st.wave, enemies: st.enemies.length, fired: recent, guard };
    },
    { min, minEnemies, fromWave },
  );

/**
 * Galerie: jede Angriffsform in jedem Element nebeneinander auf leerem Feld. Der Ticker steht still, die Effekte werden von Hand getaktet
 * (gleiche Zeitpunkte in allen Zellen, unabhaengig von der Lage der Software-Grafik). Spalten = Elemente, Zeilen = Formen.
 */
async function gallery(page, name, elements, atMs) {
  const forms = [
    ['slash', 'Hieb (Nahkampf)', 1400],
    ['tracer', 'Geschoss (Fernkampf)', 4000],
    ['blast', 'Kreis', 4200],
    ['cone', 'Kegel', 2600],
    ['line', 'Linie', 2800],
  ];
  const cells = await page.evaluate(
    ({ forms, elements, atMs }) => {
      const r = window.__duskwardens.renderer();
      const T = r.tile;
      r.app.ticker.stop();
      // Dunkler Grund statt Karte, damit nur die Angriffe zu sehen sind
      r.map.container.visible = false;
      r.overlay.below.visible = false;
      r.app.renderer.background.color = 0x0b0e1d;
      const fx = r.fx;
      const cols = r.ctx.cols;
      const rows = r.ctx.rows;
      fx.reset();
      const cw = (cols - 1.6) / elements.length;
      const rh = (rows - 0.6) / forms.length;
      const wrap = document.querySelector('.boardwrap');
      wrap.querySelectorAll('.gal-label').forEach((n) => n.remove());
      const lab = (txt, x, y, cls) => {
        const d = document.createElement('div');
        d.className = 'gal-label';
        d.textContent = txt;
        d.style.cssText = `position:absolute;left:${x}px;top:${y}px;z-index:40;font:700 ${Math.round(T * 0.22)}px Rajdhani,sans-serif;color:#f1f2f7;text-shadow:0 1px 3px #000,0 0 6px #000;pointer-events:none;${cls ?? ''}`;
        wrap.append(d);
      };
      elements.forEach((el, i) => lab(el, (1.2 + i * cw + 0.15) * T, 0.05 * T));
      forms.forEach(([, label], j) => lab(label, 0.1 * T, (0.55 + j * rh + 0.1) * T, `width:${T * 1.0}px;line-height:1.05;font-size:${Math.round(T * 0.17)}px`));
      forms.forEach(([style, , range], j) => {
        elements.forEach((el, i) => {
          const y = (0.55 + j * rh + rh / 2) * T;
          const ox = (1.2 + i * cw + 0.25) * T;
          const rangeT = Math.min(range / 1000, cw - 0.55);
          const tx = ox + (style === 'cone' || style === 'line' ? rangeT * T : (cw - 0.7) * T);
          fx.demo(style, el, ox, y, tx, y, Math.round(rangeT * 1000), style === 'blast' ? 800 : 1000);
        });
      });
      // Die Zeitpunkte: dt in 1/60-Schritten bis atMs
      return { n: forms.length * elements.length };
    },
    { forms, elements, atMs },
  );
  for (const [k, t] of atMs.entries()) {
    const prev = k === 0 ? 0 : atMs[k - 1];
    await page.evaluate(({ from, to }) => {
      const r = window.__duskwardens.renderer();
      for (let ms = from; ms < to; ms += 1000 / 60) r.fx.update(1000 / 60);
      r.app.render();
    }, { from: prev, to: t });
    await sleep(150);
    await shot(page, `${name}-${k + 1}`);
  }
  await page.evaluate(() => {
    document.querySelectorAll('.gal-label').forEach((n) => n.remove());
    const r = window.__duskwardens.renderer();
    r.map.container.visible = true;
    r.overlay.below.visible = true;
    r.app.renderer.background.color = 0x2f5a3a;
    r.app.ticker.start();
  });
  return cells;
}

try {
  let page;
  if (!ONLY || ONLY === 'match') {
  // ---- Lauf 1: Mix aus Nahkampf, Fernkampf, Flaeche --------------------------------------------------------------
  page = await setup(TEAMS.mix);
  console.log('Units', await buildTeam(page, { units: [...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix, ...TEAMS.mix], level: 1 }));
  console.log(await spoolTo(page, (st) => st.wave >= 7 && st.enemies.length >= 12));
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.godMode = true;
    s.setSpeed(1);
  });
  await sleep(900);
  await shot(page, 'match-mix-1');
  await sleep(700);
  await shot(page, 'match-mix-2');
  await sleep(500);
  await shot(page, 'match-mix-3');
  console.log('fx', await page.evaluate(() => window.__duskwardens.renderer().fx.active));
  // Salve: viele Units feuern im selben Moment
  console.log('Salve', await spoolToVolley(page, 6, 8, 8));
  await sleep(70);
  await shot(page, 'attacks-volley-1');
  await sleep(110);
  await shot(page, 'attacks-volley-2');
  await sleep(150);
  await shot(page, 'attacks-volley-3');

  // Platzier-Vorschau: Unit waehlen, Maus auf eine freie, gueltige Stelle (gruen) und auf den Pfad (rot)
  await page.keyboard.press('1');
  await sleep(150);
  const spots = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    const id = s.placing;
    s.sim.state.godMode = true;
    const r = window.__duskwardens.renderer();
    const T = r.tile;
    const sp = [...s.sim.placementGrid(id)].filter((q) => !s.sim.state.units.some((u) => Math.hypot(u.x - q.x, u.y - q.y) < 1300));
    // Stelle nahe der Kartenmitte, damit der Reichweitenkreis ganz im Bild liegt
    const cx = r.ctx.cols * 0.36 * 1000;
    const cy = r.ctx.rows * 0.5 * 1000;
    sp.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
    const q = sp[0];
    return q ? { x: (q.x / 1000 + 0.5) * T, y: (q.y / 1000 + 0.5) * T, id, n: sp.length } : null;
  });
  console.log('Geist-Stelle', spots);
  const box = await page.locator('canvas.board').boundingBox();
  if (spots) await page.mouse.move(box.x + spots.x, box.y + spots.y);
  await sleep(350);
  await shot(page, 'placing-ghost');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.12);
  await sleep(250);
  await shot(page, 'placing-ghost-red');
  if (spots) {
    // Setzen: Aufsetz-Effekt. Der Ticker steht still, die Bilder werden von Hand getaktet (Zeitpunkte nach dem Klick exakt, nicht vom Screenshot abhaengig)
    await page.mouse.move(box.x + spots.x, box.y + spots.y);
    await sleep(150);
    await page.evaluate(() => {
      window.__t0 = performance.now();
      window.__frame = 0;
      window.__duskwardens.renderer().app.ticker.stop();
    });
    await page.mouse.click(box.x + spots.x, box.y + spots.y);
    const advance = (ms) =>
      page.evaluate((ms) => {
        const r = window.__duskwardens.renderer();
        const s = window.__duskwardens.session();
        const frames = Math.round(ms / 16);
        for (let i = 0; i < frames; i++) {
          window.__frame++;
          r.draw(s, window.__t0 + window.__frame * 16, 16);
        }
        r.app.render();
      }, ms);
    await advance(48);
    await shot(page, 'place-drop-1');
    await advance(112);
    await shot(page, 'place-drop-2');
    await advance(112);
    await shot(page, 'place-landed');
    await page.evaluate(() => window.__duskwardens.renderer().app.ticker.start());
  }
  await page.keyboard.press('Escape');

  // ---- Boss ------------------------------------------------------------------------------------------------------
  console.log(await spoolTo(page, (st) => st.enemies.some((e) => e.boss)));
  await sleep(500);
  await shot(page, 'boss-entrance');
  // Boss ein Stueck laufen lassen (ohne Zeichnen), dann in voller Groesse auf dem Pfad
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    for (let i = 0; i < 330 && !s.over; i++) {
      s.sim.step(1);
      s.sim.drainEvents();
    }
  });
  await sleep(700);
  await shot(page, 'boss-fight');
  await sleep(500);
  await shot(page, 'boss-fight-2');
  await page.context().close();

  // ---- Lauf 2: Fähigkeits-Ansage -----------------------------------------------------------------------------------
  page = await setup(TEAMS.magic);
  console.log('Units', await buildTeam(page, { units: [...TEAMS.magic, ...TEAMS.magic, ...TEAMS.magic, ...TEAMS.magic], level: 7 }));
  console.log(await spoolTo(page, (st) => st.wave >= 4 && st.enemies.length >= 8));
  await page.evaluate(() => {
    const s = window.__duskwardens.session();
    s.sim.state.godMode = true;
    s.setSpeed(1);
  });
  await sleep(400);
  await shot(page, 'match-magic');
  const fired = await page.evaluate(() => {
    const s = window.__duskwardens.session();
    const st = s.sim.state;
    for (const id of ['zoro', 'goku_black', 'dazai_evolved', 'law', 'jotaro', 'nezuko']) {
      const r = s.useAbilityType(id);
      if (r) return { id, r };
    }
    return null;
  });
  console.log('Faehigkeit', fired);
  // Die Ansage ist eine CSS-Animation: anhalten und auf feste Zeitpunkte stellen (Screenshots brauchen unter Software-Grafik unterschiedlich lang)
  const cutAt = async (ms, name) => {
    await page.evaluate((ms) => {
      for (const a of document.getAnimations()) {
        const t = a.effect?.target;
        if (t instanceof Element && t.closest('.cutin')) {
          a.pause();
          a.currentTime = ms;
        }
      }
    }, ms);
    await sleep(80);
    await shot(page, name);
  };
  await sleep(50);
  await cutAt(330, 'ability-cutin');
  await cutAt(620, 'ability-cutin-2');
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      const t = a.effect?.target;
      if (t instanceof Element && t.closest('.cutin')) a.play();
    }
  });
  await sleep(1600);
  await shot(page, 'ability-after');
  console.log('fx', await page.evaluate(() => window.__duskwardens.renderer().fx.active));
  await page.context().close();

  }
  if (!ONLY || ONLY === 'gallery') {
  // ---- Lauf 3: Galerie auf leerem Feld -----------------------------------------------------------------------------
  page = await setup(TEAMS.mix);
  await sleep(500);
  await gallery(page, 'gallery-a', ['physical', 'fire', 'water', 'ice', 'lightning'], [60, 140, 230]);
  await gallery(page, 'gallery-b', ['air', 'light', 'dark', 'rose', 'magic'], [60, 140, 230]);
  }
} finally {
  await browser.close();
  stop();
}
