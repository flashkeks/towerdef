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
  longshot: [
    ['Base', 'Iron Bolt', 'Piercing Bolt', 'Deadeye', 'Giantslayer', 'Lanternbreaker'],
    ['Base', 'Night Scope', 'Quick Reload', 'Repeater', 'Volley Squad', 'Lantern Legion'],
    ['Base', 'Shrapnel', 'Ricochet', 'Supply Drop', 'Elite Sniper', 'Crippling Shot'],
  ],
  market: [
    ['Base', 'Busy Stalls', 'Night Market', 'Trade Hall', 'Merchant Guild', 'Golden Exchange'],
    ['Base', 'Coin Purse', 'Lockbox', 'Lantern Bank', 'Grant Office', 'Treasury'],
    ['Base', 'Watchpost', 'Lookout Bell', 'Drum Hall', 'Armory', 'Lantern Capital'],
  ],
};
const MIX: Tiers[] = [[3, 2, 0], [0, 2, 4], [2, 0, 5], [4, 0, 2], [0, 3, 2], [1, 1, 1], [5, 2, 0], [2, 5, 0]];

function sheetTowers(types: TowerType[]): HTMLCanvasElement {
  const K = 4, CW = 58 * K, CH = 68 * K, cols = 8;
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
        blit(g, api.towerSprite(type, tiers, 0, 'idle0'), x + 29 * K, y + 56 * K, K);
        label(g, `${'ABC'[p]}${t} ${NAMES[type][p][t]}`, x + 4, y + 14, '#ffffff');
      }
    // zwei Reihen mit Blickrichtungen + Angriff am Ende der Pfadzeilen
    for (let p = 0; p < 3; p++) {
      const tiers: Tiers = [0, 0, 0]; tiers[p] = 4 + (p === 1 ? 1 : 0);
      for (let k = 0; k < 2; k++) {
        const x = 10 + (6 + k) * CW, y = y0 + 28 + p * CH;
        tile(g, x, y, CW - 4, CH - 4);
        blit(g, api.towerSprite(type, tiers, k === 0 ? 5 : 2, k === 0 ? 'atk1' : 'idle1'), x + 29 * K, y + 56 * K, K);
        label(g, `${tiers.join('-')} ${k ? 'N idle' : 'SW atk'}`, x + 4, y + 14, '#ffffff');
      }
    }
    MIX.forEach((tiers, i) => {
      const x = 10 + i * CW, y = y0 + 28 + 3 * CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, i % 8, 'idle0'), x + 29 * K, y + 56 * K, K);
      label(g, tiers.join('-'), x + 4, y + 14, '#ffffff');
    });
  });
  return c;
}

function sheetFrames(): HTMLCanvasElement {
  // alle 8 Frames und alle 8 Blickrichtungen eines Turms je Typ
  const K = 3, CW = 58 * K, CH = 68 * K;
  const types: TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
  const { c, g } = mk(8 * CW + 20, types.length * 2 * CH + 20);
  const frames: TowerFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3'];
  types.forEach((type, ti) => {
    const tiers: Tiers = ti === 0 ? [3, 2, 0] : ti === 1 ? [0, 4, 0] : [2, 0, 3];
    frames.forEach((fr, i) => {
      const x = 10 + i * CW, y = 10 + ti * 2 * CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, 0, fr), x + 29 * K, y + 56 * K, K);
      label(g, fr, x + 4, y + 12, '#fff');
    });
    for (let d = 0; d < 8; d++) {
      const x = 10 + d * CW, y = 10 + ti * 2 * CH + CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, d, 'atk1'), x + 29 * K, y + 56 * K, K);
      label(g, `facing ${d}`, x + 4, y + 12, '#fff');
    }
  });
  return c;
}

function sheetHero(): HTMLCanvasElement {
  const K = 4, CW = 58 * K, CH = 68 * K;
  const { c, g } = mk(10 * CW + 20, 4 * CH + 20);
  const lv = [1, 5, 10, 15, 20];
  lv.forEach((l, i) => {
    const x = 10 + i * CW, y = 10;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.heroSprite(l, 0, 'idle0'), x + 29 * K, y + 56 * K, K);
    label(g, `Level ${l}`, x + 4, y + 14, '#fff');
    tile(g, x, y + CH, CW - 4, CH - 4);
    blit(g, api.heroSprite(l, 7, 'atk1'), x + 29 * K, y + CH + 56 * K, K);
    label(g, `L${l} atk`, x + 4, y + CH + 14, '#fff');
  });
  const fr = api.HERO_FRAMES;
  fr.forEach((f, i) => {
    const x = 10 + i * CW, y = 10 + 2 * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.heroSprite(20, 0, f), x + 29 * K, y + 56 * K, K);
    label(g, `L20 ${f}`, x + 4, y + 14, '#fff');
  });
  for (let d = 0; d < 8; d++) {
    const x = 10 + d * CW, y = 10 + 3 * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.heroSprite(10, d, 'idle0'), x + 29 * K, y + 56 * K, K);
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
  const { c, g } = mk(5 * S + 220, 9 * S + 130 + 60);
  (['ranger', 'bombardier', 'frostcaller'] as const).forEach((t, ti) => {
    for (let p = 0; p < 3; p++) {
      const y = 20 + (ti * 3 + p) * S;
      label(g, `${t} ${'ABC'[p]}`, 10, y + 36, '#fff');
      for (let n = 1; n <= 5; n++) {
        const x = 130 + (n - 1) * S;
        blit(g, api.iconUpgrade(t, p as 0, n), x, y, K);
      }
    }
  });
  const y = 20 + 9 * S + 10;
  label(g, 'Abilities / Portraits', 10, y + 20, '#fff');
  (['arrowRain', 'absoluteZero', 'flare', 'dawnbreak'] as const).forEach((a, i) => blit(g, api.iconAbility(a), 130 + i * S, y, K));
  (['ranger', 'bombardier', 'frostcaller'] as const).forEach((t, i) => blit(g, api.towerPortrait(t), 450 + i * 80, y + 60, 2));
  blit(g, api.heroPortrait(), 450 + 3 * 80, y + 60, 2);
  // Ziffern
  label(g, 'Font:', 10, y + 130, '#fff');
  ['+12', '-3', '1.5K', '420 / 1000', 'ROUND 20', '+$150'].forEach((t, i) => blit(g, api.pixelText(t, i % 2 ? 'yellow' : 'white'), 130 + i * 120, y + 140, 4));
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
  // Nahaufnahme: Stufe 0 / 3 / 5 jedes Pfads eines Typs (arg), x8
  const type = ((arg ?? 'ranger') as TowerType);
  const K = 8, CW = 56 * K, CH = 64 * K;
  const items: Tiers[] = [[0, 0, 0], [3, 0, 0], [5, 0, 0], [0, 3, 0], [0, 0, 3], [0, 0, 5]];
  const { c, g } = mk(3 * CW, 2 * CH);
  items.forEach((t, i) => {
    const x = (i % 3) * CW, y = Math.floor(i / 3) * CH;
    tile(g, x, y, CW, CH);
    blit(g, api.towerSprite(type, t, 0, 'idle0'), x + 27 * K, y + 54 * K, K);
  });
  return c;
}
const sheets: Record<string, () => HTMLCanvasElement> = {
  zoom: sheetZoom,
  towers: () => sheetTowers(['ranger', 'bombardier', 'frostcaller']),
  tower: () => sheetTowers([(arg as TowerType) ?? 'ranger']),
  frames: sheetFrames,
  hero: sheetHero,
  enemies: sheetEnemies,
  pop: sheetEnemiesPop,
  icons: sheetIcons,
  fx: sheetFx,
  fx2: sheetFx2,
  proj: sheetProj,
};
if (which === 'demo') {
  void import('./demo');
} else {
  out.appendChild((sheets[which] ?? sheets.towers)());
  (window as unknown as { __ready: boolean }).__ready = true;
}
