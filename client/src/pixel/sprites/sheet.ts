/** Testseite fuer Sprite-Boegen (nur Entwicklung/Screenshots, wird nicht ins Spiel gebundelt). */
import * as api from './index';
import type { Tiers, TowerType, TowerFrame } from './index';

const q = new URLSearchParams(location.search);
const which = q.get('sheet') ?? 'towers';
const arg = q.get('t');
const out = document.getElementById('out') as HTMLElement;
const GRASS = '#3e8948', PANEL = '#262b44';

function mk(w: number, h: number, bg = PANEL): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  return { c, g };
}
function blit(g: CanvasRenderingContext2D, s: api.Sprite, x: number, y: number, k: number): void {
  g.drawImage(s.canvas, x - s.ax * k, y - s.ay * k, s.canvas.width * k, s.canvas.height * k);
}
function label(g: CanvasRenderingContext2D, t: string, x: number, y: number, col = '#c0cbdc', font = '12px monospace'): void {
  g.fillStyle = col; g.font = font; g.fillText(t, x, y);
}
function tile(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col = GRASS): void {
  g.fillStyle = col; g.fillRect(x, y, w, h);
}

const NAMES: Record<TowerType, string[][]> = {
  ranger: [
    ['Base', 'Sharp Tips', "Hunter's Arrows", 'Triple Shot', 'Arrowstorm', 'Sky Splitter'],
    ['Base', 'Quick Draw', 'Quicker Draw', 'Repeater', 'Volley Captain', 'Thousand Arrows'],
    ['Base', 'Longbow', 'Eagle Eye', 'Ballista', 'Siege Ballista', 'Starfall Ballista'],
  ],
  bombardier: [
    ['Base', 'Bigger Bombs', 'Heavy Shells', 'Shellcracker', 'Siege Mortar', 'Doomsday Keg'],
    ['Base', 'Quick Fuse', 'Long Barrel', 'Cluster Bombs', 'Clusterstorm', 'Bombardment'],
    ['Base', 'Wide Range', 'Ringing Blast', 'Concussion Shells', 'Thunder Cannon', 'Earthshaker'],
  ],
  frostcaller: [
    ['Base', 'Chill', 'Frost Aura', 'Blizzard', 'Glacier Heart', 'Absolute Zero'],
    ['Base', 'Frost Nova', 'Brittle Ice', 'Ice Shards', 'Glacial Spike', "Winter's Wrath"],
    ['Base', 'Spark', 'Storm Sight', 'Chain Lightning', 'Tempest', 'Stormcaller'],
  ],
  market: [
    ['Stall', 'Busy Stalls', 'Night Market', 'Trade Hall', 'Merchant Guild', 'Golden Exchange'],
    ['Stall', 'Coin Purse', 'Lockbox', 'Lantern Bank', 'Grant Office', 'Treasury'],
    ['Stall', 'Watchpost', 'Lookout Bell', 'Drum Hall', 'Armory', 'Lantern Capital'],
  ],
  longshot: [
    ['Base', 'Iron Bolt', 'Piercing Bolt', 'Deadeye', 'Giantslayer', 'Lanternbreaker'],
    ['Base', 'Night Scope', 'Quick Reload', 'Repeater', 'Volley Squad', 'Lantern Legion'],
    ['Base', 'Shrapnel', 'Ricochet', 'Supply Drop', 'Elite Sniper', 'Crippling Shot'],
  ],
};
const MIX: Tiers[] = [[3, 2, 0], [0, 2, 4], [2, 0, 5], [4, 0, 2], [0, 3, 2], [1, 1, 1], [5, 2, 0], [2, 5, 0]];

function sheetTowers(types: TowerType[]): HTMLCanvasElement {
  const K = 3, CW = 100 * K, CH = 84 * K, cols = 8;
  const rowsPer = 4;
  const { c, g } = mk(cols * CW + 20, types.length * (rowsPer * CH + 34) + 10);
  types.forEach((type, ti) => {
    const y0 = ti * (rowsPer * CH + 34);
    label(g, `${type.toUpperCase()}`, 10, y0 + 18, '#fee761', 'bold 16px monospace');
    for (let p = 0; p < 3; p++)
      for (let t = 0; t <= 5; t++) {
        const tiers: Tiers = [0, 0, 0]; tiers[p] = t;
        const x = 10 + t * CW, y = y0 + 28 + p * CH;
        tile(g, x, y, CW - 4, CH - 4);
        blit(g, api.towerSprite(type, tiers, 0, 'idle0'), x + 50 * K, y + 76 * K, K);
        label(g, `${'ABC'[p]}${t} ${NAMES[type][p][t]}`, x + 4, y + 14, '#ffffff');
      }
    // zwei Reihen mit Blickrichtungen + Angriff am Ende der Pfadzeilen
    for (let p = 0; p < 3; p++) {
      const tiers: Tiers = [0, 0, 0]; tiers[p] = 4 + (p === 1 ? 1 : 0);
      for (let k = 0; k < 2; k++) {
        const x = 10 + (6 + k) * CW, y = y0 + 28 + p * CH;
        tile(g, x, y, CW - 4, CH - 4);
        blit(g, api.towerSprite(type, tiers, k === 0 ? 5 : 2, k === 0 ? 'atk1' : 'idle1'), x + 50 * K, y + 76 * K, K);
        label(g, `${tiers.join('-')} ${k ? 'N idle' : 'SW atk'}`, x + 4, y + 14, '#ffffff');
      }
    }
    MIX.forEach((tiers, i) => {
      const x = 10 + i * CW, y = y0 + 28 + 3 * CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, i % 8, 'idle0'), x + 50 * K, y + 76 * K, K);
      label(g, tiers.join('-'), x + 4, y + 14, '#ffffff');
    });
  });
  return c;
}

function sheetFrames(): HTMLCanvasElement {
  // alle 8 Frames und alle 8 Blickrichtungen eines Turms je Typ
  const K = 3, CW = 100 * K, CH = 84 * K;
  const types: TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
  const { c, g } = mk(8 * CW + 20, types.length * 2 * CH + 20);
  const frames: TowerFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3'];
  types.forEach((type, ti) => {
    const tiers: Tiers = ti === 0 ? [3, 2, 0] : ti === 1 ? [0, 4, 0] : [2, 0, 3];
    frames.forEach((fr, i) => {
      const x = 10 + i * CW, y = 10 + ti * 2 * CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, 0, fr), x + 50 * K, y + 76 * K, K);
      label(g, fr, x + 4, y + 12, '#fff');
    });
    for (let d = 0; d < 8; d++) {
      const x = 10 + d * CW, y = 10 + ti * 2 * CH + CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, d, 'atk1'), x + 50 * K, y + 76 * K, K);
      label(g, `facing ${d}`, x + 4, y + 12, '#fff');
    }
  });
  return c;
}

function sheetHero(): HTMLCanvasElement {
  const K = 3, CW = 100 * K, CH = 84 * K;
  const { c, g } = mk(8 * CW + 20, 4 * CH + 20);
  const lv = [1, 5, 10, 15, 20];
  lv.forEach((l, i) => {
    const x = 10 + i * CW, y = 10;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.heroSprite(l, 0, 'idle0'), x + 50 * K, y + 76 * K, K);
    label(g, `Level ${l}`, x + 4, y + 14, '#fff');
    tile(g, x, y + CH, CW - 4, CH - 4);
    blit(g, api.heroSprite(l, 7, 'atk1'), x + 50 * K, y + CH + 76 * K, K);
    label(g, `L${l} atk`, x + 4, y + CH + 14, '#fff');
  });
  const fr = api.HERO_FRAMES;
  fr.forEach((f, i) => {
    const x = 10 + i * CW, y = 10 + 2 * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.heroSprite(20, 0, f), x + 50 * K, y + 76 * K, K);
    label(g, `L20 ${f}`, x + 4, y + 14, '#fff');
  });
  for (let d = 0; d < 8; d++) {
    const x = 10 + d * CW, y = 10 + 3 * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.heroSprite(10, d, 'idle0'), x + 50 * K, y + 76 * K, K);
    label(g, `L10 facing ${d}`, x + 4, y + 14, '#fff');
  }
  return c;
}

function sheetEnemies(): HTMLCanvasElement {
  const types = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute'] as const;
  const K = 4;
  const { c, g } = mk(1700, 1020);
  tile(g, 0, 0, 1700, 1020);
  types.forEach((t, i) => {
    label(g, t, 20 + i * 235, 20, '#fff');
    for (let f = 0; f < 4; f++) blit(g, api.enemySprite(t, f), 30 + i * 235 + f * 56, 100, K);
  });
  label(g, 'Gloom Brute: Risse 0 / 1 / 2 (Camo darunter), Treffer-Blitz, Shade/Camo-Flimmer je Typ', 20, 150, '#fff');
  for (let k = 0; k < 3; k++) blit(g, api.enemySprite('brute', 0, { damageStage: k }), 70 + k * 140, 260, K);
  for (let k = 0; k < 3; k++) blit(g, api.enemySprite('brute', 0, { damageStage: k, camo: true }), 70 + k * 140, 380, K);
  blit(g, api.enemySprite('red', 0, { hitFlash: true }), 520, 260, K); blit(g, api.enemySprite('ironshell', 1, { hitFlash: true }), 580, 260, K); blit(g, api.enemySprite('brute', 1, { hitFlash: true }), 650, 260, K);
  (['red', 'blue', 'green', 'gold', 'ironshell', 'ember'] as const).forEach((t, i) => blit(g, api.enemySprite(t, i, { camo: true }), 520 + i * 60, 380, K));
  label(g, 'Dusk Leviathan: Platten 0..3 gefallen, Camo', 20, 440, '#fff');
  for (let k = 0; k < 4; k++) blit(g, api.enemySprite('leviathan', k, { damageStage: k }), 110 + k * 330, 590, 3);
  blit(g, api.enemySprite('leviathan', 1, { camo: true }), 1440, 590, 3);
  // Schichtleiter nebeneinander im Spielmassstab (x2)
  label(g, 'Spielmassstab x2 / x3', 20, 700, '#fff');
  ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute'].forEach((t, i) => blit(g, api.enemySprite(t as 'red', 1), 60 + i * 60, 780, 3));
  ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute'].forEach((t, i) => blit(g, api.enemySprite(t as 'red', 1), 560 + i * 40, 780, 2));
  blit(g, api.enemySprite('leviathan', 0), 1000, 790, 1);
  // Pop-Frames
  label(g, 'Platzen (6 Frames): red blue green gold ironshell ember brute', 20, 830, '#fff');
  (['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute'] as const).forEach((t, i) => {
    for (let f = 0; f < 6; f++) blit(g, api.popShards(t, f), 25 + f * 54 + (i % 4) * 330 * 0, 870 + Math.floor(i / 1) * 0, 1);
  });
  return c;
}

function sheetEnemiesPop(): HTMLCanvasElement {
  const K = 3;
  const types = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute', 'leviathan'] as const;
  const { c, g } = mk(6 * 100 + 40, types.length * 100 + 20);
  types.forEach((t, i) => {
    label(g, t, 8, 20 + i * 100, '#fff');
    for (let f = 0; f < 6; f++) { tile(g, 90 + f * 100, 4 + i * 100, 96, 96); blit(g, api.popShards(t, f), 138 + f * 100, 52 + i * 100, K); }
  });
  return c;
}

function sheetIcons(): HTMLCanvasElement {
  const K = 4, S = 16 * K + 6;
  const types = api.TOWER_TYPES;
  const colW = 5 * S + 40;
  const { c, g } = mk(types.length * colW + 20, 3 * S + 290);
  types.forEach((t, ti) => {
    const x0 = 10 + ti * colW;
    label(g, t, x0, 14, '#fee761', 'bold 13px monospace');
    for (let p = 0; p < 3; p++) for (let n = 1; n <= 5; n++) blit(g, api.iconUpgrade(t, p as 0, n), x0 + (n - 1) * S, 24 + p * S, K);
  });
  const y = 3 * S + 50;
  label(g, 'Abilities', 10, y, '#fff');
  api.ABILITIES.forEach((a, i) => blit(g, api.iconAbility(a), 10 + i * S, y + 12, K));
  label(g, 'Portraits (Turm-Leiste) x3, Wren', 10, y + 110, '#fff');
  types.forEach((t, i) => { tile(g, 10 + i * 140, y + 120, 130, 110, '#3e8948'); blit(g, api.towerPortrait(t), 10 + i * 140 + 65, y + 210, 3); });
  tile(g, 10 + 5 * 140, y + 120, 130, 110, '#3e8948'); blit(g, api.heroPortrait(), 10 + 5 * 140 + 65, y + 210, 3);
  return c;
}

function sheetFx(): HTMLCanvasElement {
  const { c, g } = mk(1700, 1240);
  let y = 10;
  const row = (title: string, count: number, make: (f: number) => api.Sprite, k: number, cell: number, bg = '#2f3f5a'): void => {
    label(g, title, 10, y + 12, '#fff');
    for (let f = 0; f < count; f++) {
      tile(g, 10 + f * cell, y + 18, cell - 4, cell - 4, bg);
      blit(g, make(f), 10 + f * cell + (cell - 4) / 2, y + 18 + (cell - 4) / 2, k);
    }
    y += cell + 26;
  };
  row('bomb (r24)', 5, (f) => api.explosion('bomb', f), 3, 170);
  row('mini (r12) + star (r32)', 5, (f) => api.explosion('mini', f), 4, 110);
  y -= 0;
  row('star', 5, (f) => api.explosion('star', f), 2, 140);
  row('quake', 5, (f) => api.explosion('quake', f), 2, 220);
  row('nova r16 / r40', 4, (f) => api.nova(f, 16), 4, 100);
  row('nova r40', 4, (f) => api.nova(f, 40), 2, 110);
  row('puff buy / A / B / C', 6, (f) => api.puff(f, null), 3, 150);
  row('puff A', 6, (f) => api.puff(f, 0), 3, 150);
  row('puff B', 6, (f) => api.puff(f, 1), 3, 150);
  return c;
}

function sheetFx2(): HTMLCanvasElement {
  const { c, g } = mk(1700, 1500);
  let y = 10;
  const row = (title: string, count: number, make: (f: number) => api.Sprite, k: number, cell: number, bg = '#2f3f5a'): void => {
    label(g, title, 10, y + 12, '#fff');
    for (let f = 0; f < count; f++) {
      tile(g, 10 + f * cell, y + 18, cell - 4, cell - 4, bg);
      blit(g, make(f), 10 + f * cell + (cell - 4) / 2, y + 18 + (cell - 4) / 2, k);
    }
    y += cell + 26;
  };
  row('leak', 6, (f) => api.leakFx(f), 3, 130);
  for (const k of ['slow', 'stun', 'burn', 'reveal'] as const) row(`status ${k}`, 4, (f) => api.statusFx(k, f), 6, 100);
  row('freeze: red / ironshell / brute / leviathan', 4, (f) => api.statusFx('freeze', 0, (['red', 'ironshell', 'brute', 'leviathan'] as const)[f]), 3, 250);
  row('flare r40', 6, (f) => api.flareFx(f, 40), 2, 180);
  row('boss plate', 8, (f) => api.bossPlate(f, 1), 3, 220);
  label(g, 'dawnbeam', 10, y + 12, '#fff'); for (let f = 0; f < 4; f++) blit(g, api.dawnBeam(300, f), 10, y + 40 + f * 52, 2);
  y += 240;
  label(g, 'arrow rain (r68)', 10, y + 12, '#fff'); for (let f = 0; f < 3; f++) { tile(g, 10 + f * 340, y + 18, 336, 336, '#3e8948'); blit(g, api.arrowRainFx(f, 68), 10 + f * 340 + 168, y + 18 + 168, 2); }
  return c;
}

function sheetProj(): HTMLCanvasElement {
  const kinds = api.PROJECTILE_KINDS;
  const K = 4;
  const { c, g } = mk(16 * 26 * K * 0.4 + 100, kinds.length * 100 + 40, GRASS);
  const cell = 26 * K * 0.4 + 30;
  kinds.forEach((k, i) => {
    label(g, k, 6, 52 + i * 100, '#fff');
    for (let d = 0; d < 16; d++) blit(g, api.projectileSprite(k, d), 90 + d * 66, 50 + i * 100, 3);
  });
  void cell;
  return c;
}

function sheetZoom(): HTMLCanvasElement {
  // Nahaufnahme einer Pfadreihe: t=TYP-PFAD (z. B. ranger-0), Stufen 0..5 nebeneinander, x6, auf die Figur zugeschnitten
  const [tp, pp] = (arg ?? 'ranger-0').split('-');
  const type = tp as TowerType, path = Number(pp ?? 0);
  const K = 5, CW = 76 * K, CH = 100 * K;
  const { c, g } = mk(6 * CW, CH);
  for (let t = 0; t <= 5; t++) {
    const x = t * CW;
    tile(g, x, 0, CW - 4, CH);
    const tiers: Tiers = [0, 0, 0]; tiers[path] = t;
    blit(g, api.towerSprite(type, tiers, 0, 'idle1'), x + 48 * K, 73 * K, K);
    label(g, `${'ABC'[path]}${t}`, x + 6, 16, '#ffffff');
  }
  return c;
}

/** Raster aus Sprites: Zelle w x h (in Bildschirm-px), Anker des Sprites unten (6 px Rand) in der Mitte. */
function grid(g: CanvasRenderingContext2D, x0: number, y0: number, items: { sp: api.Sprite; label: string }[], cols: number, cw: number, ch: number, K: number, bg = GRASS, dy = 6): void {
  items.forEach((it, i) => {
    const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * ch;
    tile(g, x, y, cw - 4, ch - 4, bg);
    blit(g, it.sp, x + (cw - 4) / 2 - 0 * K, y + ch - 4 - dy * K, K);
    label(g, it.label, x + 5, y + 14, '#ffffff');
  });
}
const tiersOf = (p: number, t: number): Tiers => { const r: Tiers = [0, 0, 0]; r[p] = t; return r; };

function sheetPaths(type: TowerType, K: number, cw: number, ch: number, facing = 0, frame: TowerFrame = 'idle1'): HTMLCanvasElement {
  const mixes: Tiers[] = [[3, 2, 0], [0, 2, 4], [2, 0, 5], [4, 0, 2], [0, 3, 2], [1, 1, 1], [5, 2, 0], [2, 5, 0]];
  const rows = 4;
  const { c, g } = mk(6 * cw + 20, rows * ch + 20);
  const items: { sp: api.Sprite; label: string }[] = [];
  for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) items.push({ sp: api.towerSprite(type, tiersOf(p, t), facing, frame), label: `${'ABC'[p]}${t} ${NAMES[type][p][t]}` });
  grid(g, 10, 10, items, 6, cw, ch, K);
  mixes.slice(0, 6).forEach((m, i) => {
    const x = 10 + i * cw, y = 10 + 3 * ch;
    tile(g, x, y, cw - 4, ch - 4);
    blit(g, api.towerSprite(type, m, facing, frame), x + (cw - 4) / 2, y + ch - 4 - 6 * K, K);
    label(g, `mix ${m.join('-')}`, x + 5, y + 14, '#ffffff');
  });
  return c;
}

function withFrames(base: HTMLCanvasElement, rows: { type: TowerType; tiers: Tiers; facing: number }[], K: number, cw: number, ch: number, frames: TowerFrame[]): HTMLCanvasElement {
  const { c, g } = mk(Math.max(base.width, frames.length * cw + 20), base.height + rows.length * ch + 10);
  g.drawImage(base, 0, 0);
  rows.forEach((r, k) => {
    frames.forEach((f, i) => {
      const x = 10 + i * cw, y = base.height + k * ch - 10;
      tile(g, x, y, cw - 4, ch - 4);
      blit(g, api.towerSprite(r.type, r.tiers, r.facing, f), x + (cw - 4) / 2, y + ch - 4 - 6 * K, K);
      label(g, `${r.tiers.join('-')} ${f}`, x + 5, y + 14, '#ffffff');
    });
  });
  return c;
}

function sheetMarket(): HTMLCanvasElement {
  const K = 3, CW = 84 * K, CH = 76 * K;
  const base = sheetPaths('market', K, CW, CH);
  return withFrames(base, [
    { type: 'market', tiers: [0, 0, 0], facing: 0 }, { type: 'market', tiers: [5, 0, 0], facing: 0 },
    { type: 'market', tiers: [0, 5, 0], facing: 0 }, { type: 'market', tiers: [0, 0, 5], facing: 0 },
  ], K, CW, CH, ['idle0', 'idle1', 'idle2', 'idle3']);
}

function sheetLongshot(): HTMLCanvasElement {
  const K = 3, CW = 100 * K, CH = 76 * K;
  const base = sheetPaths('longshot', K, CW, CH);
  // Angriff (4 Frames) und 8 Blickrichtungen
  const { c, g } = mk(Math.max(base.width, 8 * 70 * K + 20), base.height + 3 * (CH) + 10);
  g.drawImage(base, 0, 0);
  const y1 = base.height - 10;
  const atk: Tiers[] = [[1, 0, 0], [0, 3, 0], [5, 0, 0]];
  atk.forEach((t, k) => {
    (['atk0', 'atk1', 'atk2', 'atk3'] as TowerFrame[]).forEach((f, i) => {
      const x = 10 + i * CW, y = y1 + k * CH;
      if (x + CW > c.width) return;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite('longshot', t, 0, f), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
      label(g, `${t.join('-')} ${f}`, x + 5, y + 14, '#ffffff');
    });
  });
  const y2 = y1 + 3 * CH;
  const { c: c2, g: g2 } = mk(c.width, y2 + 2 * CH + 10);
  g2.drawImage(c, 0, 0);
  for (let d = 0; d < 8; d++) {
    const cw = 70 * K, x = 10 + d * cw, y = y2;
    tile(g2, x, y, cw - 4, CH - 4);
    blit(g2, api.towerSprite('longshot', [3, 2, 0], d, 'atk1'), x + (cw - 4) / 2, y + CH - 4 - 6 * K, K);
    label(g2, `3-2-0 facing ${d}`, x + 5, y + 14, '#ffffff');
    tile(g2, x, y + CH, cw - 4, CH - 4);
    blit(g2, api.towerSprite('longshot', [0, 5, 0], d, 'idle2'), x + (cw - 4) / 2, y + 2 * CH - 4 - 6 * K, K);
    label(g2, `0-5-0 facing ${d}`, x + 5, y + CH + 14, '#ffffff');
  }
  return c2;
}

function sheetAlt(): HTMLCanvasElement {
  // Vorher (R11, mit Plattform) gegen nachher (R13) fuer Ranger/Bombardier/Frostcaller: je Pfad eine alte Reihe, dann die neuen
  const K = 3, CW = 100 * K, CH = 70 * K;
  const types: TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
  const per = 4 * CH + 40;
  const { c, g } = mk(6 * CW + 20, types.length * per + 20);
  const old = new Image();
  const draw = (): void => {
    types.forEach((type, ti) => {
      const y0 = 10 + ti * per;
      label(g, `${type.toUpperCase()}  -  oben: Runde 11 (Plattform), darunter Runde 13 Pfad A / B / C`, 10, y0 + 12, '#fee761', 'bold 14px monospace');
      // alte Reihe (Pfad A) aus dem R11-Bild: Zellen 228 x 268, Abstand 232, Blockhoehe 1122
      for (let t = 0; t <= 5; t++) {
        const sx = 10 + t * 232, sy = ti * 1122 + 28;
        const x = 10 + t * CW, y = y0 + 20;
        tile(g, x, y, CW - 4, CH - 4);
        const sc = (CH - 4) / 268;
        g.drawImage(old, sx, sy, 228, 268, x + (CW - 4 - 228 * sc) / 2, y, 228 * sc, 268 * sc);
        label(g, `R11 A${t}`, x + 5, y + 14, '#ffffff');
      }
      for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) {
        const x = 10 + t * CW, y = y0 + 20 + (p + 1) * CH;
        tile(g, x, y, CW - 4, CH - 4);
        blit(g, api.towerSprite(type, tiersOf(p, t), 0, 'idle1'), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
        label(g, `${'ABC'[p]}${t} ${NAMES[type][p][t]}`, x + 5, y + 14, '#ffffff');
      }
    });
  };
  return new Promise<HTMLCanvasElement>((res) => {
    old.onload = () => { draw(); res(c); };
    old.onerror = () => { draw(); res(c); };
    old.src = '/docs/r11/p2-tuerme.png';
  }) as unknown as HTMLCanvasElement;
}

function sheetFxR13(): HTMLCanvasElement {
  const { c, g } = mk(1900, 1220);
  let y = 10;
  const row = (title: string, count: number, make: (f: number) => api.Sprite, k: number, cw: number, ch: number, bg = '#3e8948', foot = false): void => {
    label(g, title, 10, y + 12, '#fff');
    for (let f = 0; f < count; f++) {
      tile(g, 10 + f * cw, y + 18, cw - 4, ch - 4, bg);
      blit(g, make(f), 10 + f * cw + (cw - 4) / 2, foot ? y + 18 + ch - 4 - 8 * k : y + 18 + (ch - 4) / 2, k);
    }
    y += ch + 24;
  };
  row('Muenzflug (Market, Rundenende) 8 Frames', 8, (f) => api.fx.coinRise(f), 3, 150, 230, '#3e8948', true);
  row('Bank-Truhe (Withdraw) 6 Frames', 6, (f) => api.fx.bankChest(f), 4, 140, 170, '#3e8948', true);
  row('Grant 8 Frames', 8, (f) => api.fx.grant(f), 3, 180, 180);
  row('Supply Drop 12 Frames (fallen, landen, oeffnen)', 12, (f) => api.fx.supplyDrop(f), 3, 150, 190, '#3e8948', true);
  label(g, 'Aura-Ring A / B / C (r 52), Focus 4 Frames, Boss-Markierung 4 Frames, Ricochet', 10, y + 12, '#fff');
  const yy = y + 18;
  [0, 1, 2].forEach((p, i) => { tile(g, 10 + i * 240, yy, 236, 236); blit(g, api.fx.auraRing(52, 1, p as 0), 10 + i * 240 + 118, yy + 118, 2); });
  for (let f = 0; f < 4; f++) { tile(g, 750 + f * 150, yy, 146, 146); blit(g, api.fx.focus(f), 750 + f * 150 + 73, yy + 73, 3); }
  for (let f = 0; f < 4; f++) { tile(g, 750 + f * 150, yy + 150, 146, 146); blit(g, api.fx.bossMark(f), 750 + f * 150 + 73, yy + 223, 4); }
  tile(g, 1370, yy, 400, 296);
  blit(g, api.fx.ricochet([[40, 140], [120, 60], [210, 150], [300, 80]], 0), 1385, yy + 20, 1.2);
  return c;
}

function sheetProjR13(): HTMLCanvasElement {
  const kinds = ['snipe', 'snipeHeavy', 'snipeGold', 'splinter'] as const;
  const { c, g } = mk(16 * 70 + 150, kinds.length * 100 + 20, GRASS);
  kinds.forEach((k, i) => {
    label(g, k, 6, 52 + i * 100, '#fff');
    for (let d = 0; d < 16; d++) blit(g, api.projectileSprite(k, d), 130 + d * 70, 50 + i * 100, 3);
  });
  return c;
}

const sheets: Record<string, () => HTMLCanvasElement> = {
  zoom: sheetZoom,
  towers: () => sheetTowers(['ranger', 'bombardier', 'frostcaller']),
  tower: () => sheetTowers([(arg as TowerType) ?? 'ranger']),
  frames: sheetFrames,
  hero: sheetHero,
  held: sheetHero,
  enemies: sheetEnemies,
  pop: sheetEnemiesPop,
  icons: sheetIcons,
  fx: sheetFx,
  fx2: sheetFx2,
  proj: sheetProj,
  alt: sheetAlt,
  market: sheetMarket,
  longshot: sheetLongshot,
  fxr13: sheetFxR13,
  projr13: sheetProjR13,
};
if (which === 'demo') {
  void import('./demo');
} else {
  void Promise.resolve((sheets[which] ?? sheets.towers)()).then((cv) => {
    out.appendChild(cv);
    (window as unknown as { __ready: boolean }).__ready = true;
  });
}
