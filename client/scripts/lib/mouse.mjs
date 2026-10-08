// Gemeinsame Helfer fuer Smoke und Replay-Abnahme (Runde 6, freie Platzierung): freie Stellen LESEN (`evaluate`, ohne Spielaktion)
// und per echter Maus anklicken. Karte: Sim-Koordinate (Milli-Tiles) x -> Pixel b.x + (x/1000 + 0.5) * tile, tile = Canvas-Breite / Spalten der Stage (17 bei Welt 1-3, sonst Zonenbreite).

/**
 * Freie Stellen fuer eine Unit, beste zuerst (liest nur Sim-Zustand). Kandidaten = `placementGrid` (Halbkachel-Raster),
 * gueltig nur, wenn `canPlace` auch an vier um 30 Milli-Tiles versetzten Punkten `null` liefert: so trifft der Mausklick trotz
 * Pixelrundung sicher (Berueren zaehlt nie als Treffer, aber 10 Milli-Tiles daneben koennten ueberlappen).
 * `ignoreCoins`: auch Stellen, die nur an zu wenig Muenzen scheitern (fuer den Test des Muenz-Toasts).
 * Rang: Pfadabdeckung (Reichweite 3500), Farms (2x2) umgekehrt (abseits des Pfads).
 */
export function readSpots(page, unitId, n = 6, { ignoreCoins = false } = {}) {
  return page.evaluate(
    ({ unitId, n, ignoreCoins }) => {
      const s = window.__duskwardens.session();
      const sim = s.sim;
      const def = sim.catalog().find((d) => d.id === unitId);
      const sign = def.footprint === 2 ? -1 : 1;
      const okAt = (x, y) => {
        const r = sim.canPlace(0, unitId, x, y);
        return r === null || (ignoreCoins && r === 'not-enough-coins');
      };
      const robust = (p) => [[0, 0], [30, 30], [-30, 30], [30, -30], [-30, -30]].every(([dx, dy]) => okAt(p.x + dx, p.y + dy));
      return [...sim.placementGrid(unitId)]
        .filter(robust)
        .sort((a, b) => sign * (sim.coverage(b.x, b.y, 3500) - sim.coverage(a.x, a.y, 3500)) || a.x - b.x || a.y - b.y)
        .slice(0, n)
        .map((p) => [p.x, p.y]);
    },
    { unitId, n, ignoreCoins },
  );
}

/** Bildschirmpunkt einer Sim-Koordinate aus dem Layout des Canvas. */
export async function worldToScreen(page, x, y) {
  const b = await page.locator('canvas.board').boundingBox();
  const cols = await page.evaluate(() => window.__duskwardens.renderer().ctx.cols);
  const tile = b.width / cols;
  return { x: b.x + (x / 1000 + 0.5) * tile, y: b.y + (y / 1000 + 0.5) * tile };
}

/** Echte Maus: hinfahren (Geist folgt) und klicken. `shift` haelt Shift gedrueckt. */
export async function clickWorld(page, x, y, { shift = false, button = 'left', hoverMs = 40 } = {}) {
  const p = await worldToScreen(page, x, y);
  await page.mouse.move(p.x, p.y);
  await new Promise((r) => setTimeout(r, hoverMs));
  if (shift) await page.keyboard.down('Shift');
  try {
    await page.mouse.click(p.x, p.y, { button });
  } finally {
    if (shift) await page.keyboard.up('Shift');
  }
}

/** Zustand des Geists (liest `session.ghost()`): `{ ok, reason, unitId, x, y }` oder null. */
export const readGhost = (page) => page.evaluate(() => window.__duskwardens.session().ghost());

/** Ein Punkt auf dem Pfad (Mitte der Polylinie, Milli-Tiles), aus den Stichproben der Sim. */
export const readPathPoint = (page) =>
  page.evaluate(() => {
    const p = window.__duskwardens.session().sim.pathSamples();
    const m = p[Math.floor(p.length / 2)];
    return [m.x, m.y];
  });
