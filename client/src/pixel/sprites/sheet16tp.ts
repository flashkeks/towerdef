/** Bilderboegen Runde 16 TP (nur Entwicklung/Screenshots): Bellringer, Tinker, Sentry, Icons, Effekte. Wird von sheet.ts eingehaengt. */
import * as api from './index';
import type { Tiers, TowerFrame, TowerType } from './index';

const GRASS = '#3e8948', PANEL = '#262b44', PATHC = '#8a6a48';

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

export const NAMES16: Record<'bellringer' | 'tinker', string[][]> = {
  bellringer: [
    ['Base', 'Swift Chime', 'Resonant Bronze', 'Grand Peal', 'Cathedral Bells', 'Grand Carillon'],
    ['Base', 'Watch Bell', "Haggler's Bell", 'Alarm', 'Town Crier', 'Dusk Siren'],
    ['Base', 'Toll of Coin', 'Silver Bell', "Merchants' Peal", 'Bell Foundry', 'Golden Belfry'],
  ],
  tinker: [
    ['Base', 'Sentry Kit', 'Twin Sentries', 'Sentry Guns', 'Clockwork Turrets', 'Clockwork Fort'],
    ['Base', 'Caltrop Layer', 'Spiked Caltrops', 'Spike Mat', 'Heavy Spikes', 'Iron Thorn Field'],
    ['Base', 'Oiled Gears', 'Gear Sight', 'Overclock', 'Overclock Lab', 'Ultra-Overclock'],
  ],
};
const MIX: Tiers[] = [[3, 2, 0], [0, 2, 4], [2, 0, 5], [4, 0, 2], [0, 3, 2], [1, 1, 1], [5, 2, 0], [2, 5, 0], [0, 4, 2], [2, 0, 4], [0, 5, 2], [4, 2, 0]];
const FR: TowerFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3'];

/** 3 Pfade x Stufen 0..5, Idle-Frame 0 nach rechts. */
function paths(type: 'bellringer' | 'tinker', K = 3, facing = 0): HTMLCanvasElement {
  const CW = 100 * K, CH = 82 * K;
  const { c, g } = mk(6 * CW + 20, 3 * CH + 20);
  for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) {
    const tiers: Tiers = [0, 0, 0]; tiers[p] = t;
    const x = 10 + t * CW, y = 10 + p * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.towerSprite(type, tiers, facing, 'idle1'), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
    label(g, `${'ABC'[p]}${t} ${NAMES16[type][p][t]}`, x + 5, y + 14, '#fff');
  }
  return c;
}

/** Crosspaths + alle Frames von drei Looks. */
function cross(type: 'bellringer' | 'tinker', K = 3): HTMLCanvasElement {
  const CW = 100 * K, CH = 82 * K, cols = 6;
  const rowsMix = Math.ceil(MIX.length / cols);
  const looks: Tiers[] = [[5, 0, 0], [0, 5, 0], [0, 0, 5]];
  const { c, g } = mk(8 * CW + 20, (rowsMix + 3) * CH + 20);
  MIX.forEach((tiers, i) => {
    const x = 10 + (i % cols) * CW, y = 10 + Math.floor(i / cols) * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.towerSprite(type, tiers, i % 8, 'idle1'), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
    label(g, tiers.join('-'), x + 5, y + 14, '#fff');
  });
  looks.forEach((tiers, r) => FR.forEach((f, i) => {
    const x = 10 + i * CW, y = 10 + (rowsMix + r) * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.towerSprite(type, tiers, 0, f), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
    label(g, `${tiers.join('-')} ${f}`, x + 5, y + 14, '#fff');
  }));
  return c;
}

/** Tinker: 8 Richtungen fuer drei Looks, Angriff in Richtung. */
function dirs(type: TowerType, K = 3): HTMLCanvasElement {
  const CW = 80 * K, CH = 82 * K;
  const looks: Tiers[] = [[0, 0, 0], [3, 0, 0], [0, 3, 0], [0, 0, 3], [5, 0, 0], [0, 5, 0], [0, 0, 5]];
  const { c, g } = mk(8 * CW + 20, looks.length * CH + 20);
  looks.forEach((tiers, r) => {
    for (let d = 0; d < 8; d++) {
      const x = 10 + d * CW, y = 10 + r * CH;
      tile(g, x, y, CW - 4, CH - 4);
      blit(g, api.towerSprite(type, tiers, d, d % 2 ? 'atk2' : 'idle1'), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
      label(g, `${tiers.join('-')} f${d} ${d % 2 ? 'atk2' : 'idle1'}`, x + 5, y + 14, '#fff');
    }
  });
  return c;
}

function icons(type: 'bellringer' | 'tinker'): HTMLCanvasElement {
  const K = 6, S = 16 * K + 40;
  const { c, g } = mk(5 * S + 20 + 300, 3 * S + 30);
  label(g, type, 10, 14, '#fee761', 'bold 13px monospace');
  for (let p = 0; p < 3; p++) for (let n = 1; n <= 5; n++) {
    blit(g, api.iconUpgrade(type, p as 0, n), 10 + (n - 1) * S, 24 + p * S, K);
    label(g, NAMES16[type][p][n].slice(0, 15), 10 + (n - 1) * S, 24 + p * S + 16 * K + 12, '#c0cbdc', '10px monospace');
  }
  const ab = type === 'bellringer' ? 'alarm' : 'overclock';
  blit(g, api.iconAbility(ab), 5 * S + 40, 24, K); label(g, ab, 5 * S + 40, 24 + 16 * K + 12);
  tile(g, 5 * S + 40, 24 + S, 220, 170, GRASS);
  blit(g, api.towerPortrait(type), 5 * S + 150, 24 + S + 160, 4);
  return c;
}

/** Beliebige Figuren gross: ?sheet=tp-zoom&t=tinker:3-0-0,bellringer:0-5-0&f=idle1&d=0&k=6 */
function zoom(): HTMLCanvasElement {
  const q = new URLSearchParams(location.search);
  const specs = (q.get('t') ?? 'bellringer:0-0-0').split(',');
  const K = Number(q.get('k') ?? 6), fr = (q.get('f') ?? 'idle1') as TowerFrame;
  const dd = (q.get('d') ?? '0').split(',').map(Number);
  const CW = 96 * K, CH = 82 * K;
  const cells = specs.flatMap((sp) => dd.map((d) => [sp, d] as const));
  const cols = Math.min(cells.length, Math.max(1, Math.floor(2800 / CW)));
  const { c, g } = mk(cols * CW + 10, Math.ceil(cells.length / cols) * CH + 10);
  cells.forEach(([sp, d], i) => {
    const [ty, ti] = sp.split(':');
    const tiers = ti.split('-').map(Number) as Tiers;
    const x = 5 + (i % cols) * CW, y = 5 + Math.floor(i / cols) * CH;
    tile(g, x, y, CW - 4, CH - 4);
    blit(g, api.towerSprite(ty as TowerType, tiers, d, fr), x + (CW - 4) / 2, y + CH - 4 - 6 * K, K);
    label(g, `${sp} d${d} ${fr}`, x + 5, y + 14, '#fff');
  });
  return c;
}

function sentries(): HTMLCanvasElement {
  const K = 5, CW = 34 * K, CH = 32 * K;
  const { c, g } = mk(8 * CW + 20, 8 * CH + 20, GRASS);
  const frames: api.SentryFrame[] = ['b0', 'b1', 'b2', 'idle0', 'idle1', 'fire'];
  for (let look = 0; look < 5; look++) frames.forEach((f, i) => {
    const x = 10 + i * CW, y = 10 + look * CH;
    blit(g, api.sentrySprite(look, 0, f), x + CW / 2, y + CH - 8 * K, K);
    label(g, `A${look + 1} ${f}`, x + 4, y + 12, '#fff');
  });
  for (let d = 0; d < 8; d++) for (const [r, look] of [[5, 0], [6, 2], [7, 4]]) {
    const x = 10 + d * CW, y = 10 + r * CH;
    blit(g, api.sentrySprite(look, d, 'fire'), x + CW / 2, y + CH - 8 * K, K);
    label(g, `A${look + 1} f${d}`, x + 4, y + 12, '#fff');
  }
  return c;
}

function fxSheet(): HTMLCanvasElement {
  const { c, g } = mk(1700, 900, PATHC);
  let y = 10;
  label(g, 'Nagel (nail) in 16 Richtungen, x4', 10, y + 12, '#fff'); y += 18;
  for (let d = 0; d < 16; d++) { tile(g, 10 + d * 100, y, 96, 96, GRASS); blit(g, api.projectileSprite('nail', d), 58 + d * 100, y + 48, 4); }
  y += 110;
  label(g, 'Tinker-Falle (Caltrops, 6 Zacken .. 1), Overclock normal/Ultra, Alarm-Zeichen, Bauwolke', 10, y + 12, '#fff'); y += 18;
  for (let n = 1; n <= 6; n++) { tile(g, 10 + (n - 1) * 90, y, 86, 70, GRASS); blit(g, api.trapSprite('caltrops', n, 0), 53 + (n - 1) * 90, y + 40, 4); }
  for (let f = 0; f < 4; f++) { tile(g, 570 + f * 130, y, 126, 220, GRASS); blit(g, api.overclockFx(f, false), 633 + f * 130, y + 200, 3); }
  for (let f = 0; f < 4; f++) { tile(g, 1100 + f * 130, y, 126, 220, GRASS); blit(g, api.overclockFx(f, true), 1163 + f * 130, y + 200, 3); }
  y += 80;
  for (let f = 0; f < 4; f++) { tile(g, 10 + f * 90, y, 86, 90, GRASS); blit(g, api.enemySprite('red', f), 53 + f * 90, y + 80, 4); blit(g, api.alarmMarkFx(f), 53 + f * 90, y + 40, 4); }
  for (let f = 0; f < 5; f++) { tile(g, 10 + f * 130, y + 100, 126, 100, GRASS); blit(g, api.buildPuffFx(f), 73 + f * 130, y + 180, 3); }
  return c;
}

export const sheets16tp: Record<string, () => HTMLCanvasElement> = {
  'tp-zoom': zoom,
  'tp-sentry': sentries,
  'tp-fx': fxSheet,
  'tp-bellringer': () => paths('bellringer'),
  'tp-bellringer-cross': () => cross('bellringer'),
  'tp-bellringer-icons': () => icons('bellringer'),
  'tp-tinker': () => paths('tinker'),
  'tp-tinker-cross': () => cross('tinker'),
  'tp-tinker-dirs': () => dirs('tinker'),
  'tp-tinker-icons': () => icons('tinker'),
};
void PATHC; void label;
