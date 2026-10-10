/** Sprite-Boegen Runde 15 B2 (nur Entwicklung/Screenshots): Gegner, Bosse, Effekte. Eingebunden von sheet.ts. */
import * as api from './index';
import type { EnemyType } from './types';

const GRASS = '#3e8948', PANEL = '#262b44';
function mk(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.fillStyle = PANEL; g.fillRect(0, 0, w, h);
  return { c, g };
}
function blit(g: CanvasRenderingContext2D, s: api.Sprite, x: number, y: number, k: number): void {
  g.drawImage(s.canvas, x - s.ax * k, y - s.ay * k, s.canvas.width * k, s.canvas.height * k);
}
function label(g: CanvasRenderingContext2D, t: string, x: number, y: number): void {
  g.fillStyle = '#fff'; g.font = '12px monospace'; g.fillText(t, x, y);
}
function tile(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col = GRASS): void {
  g.fillStyle = col; g.fillRect(x, y, w, h);
}

export function sheetGegnerR15(): HTMLCanvasElement {
  const { c, g } = mk(1700, 1340);
  tile(g, 0, 0, 1700, 1340);
  // Zeile 1: Lauf-Frames
  label(g, 'pink (4 Frames)', 20, 18); label(g, 'frostling', 420, 18); label(g, 'crystal', 820, 18);
  for (let f = 0; f < 4; f++) {
    blit(g, api.enemySprite('pink', f), 50 + f * 96, 110, 4);
    blit(g, api.enemySprite('frostling', f), 450 + f * 96, 110, 4);
    blit(g, api.enemySprite('crystal', f), 850 + f * 150, 160, 3);
  }
  // Zeile 2: Risse, Treffer-Blitz, Camo
  label(g, 'Crystal Brute: Risse 0 / 1 / 2 / 3 | Camo darunter | Treffer-Blitz | Camo je Typ', 20, 215);
  for (let k = 0; k < 4; k++) {
    blit(g, api.enemySprite('crystal', 0, { damageStage: k }), 80 + k * 150, 330, 3);
    blit(g, api.enemySprite('crystal', 0, { damageStage: k, camo: true }), 80 + k * 150, 450, 3);
  }
  blit(g, api.enemySprite('pink', 0, { hitFlash: true }), 700, 330, 4);
  blit(g, api.enemySprite('frostling', 1, { hitFlash: true }), 800, 330, 4);
  blit(g, api.enemySprite('crystal', 1, { hitFlash: true }), 920, 330, 3);
  blit(g, api.enemySprite('gloomship', 1, { hitFlash: true }), 1120, 340, 2);
  blit(g, api.enemySprite('pink', 0, { camo: true }), 700, 450, 4);
  blit(g, api.enemySprite('frostling', 1, { camo: true }), 800, 450, 4);
  // Zeile 3: Gloomship
  label(g, 'Gloomship: Stufen 0 / 1 / 2, Camo, Frame 0-3 (Anker = Bodenpunkt, Schatten darunter)', 20, 560);
  for (let k = 0; k < 3; k++) {
    blit(g, api.fx.gloomShadow(k), 130 + k * 260, 770, 3);
    blit(g, api.enemySprite('gloomship', k, { damageStage: k }), 130 + k * 260, 770, 3);
  }
  blit(g, api.fx.gloomShadow(2), 910, 770, 3);
  blit(g, api.enemySprite('gloomship', 1, { camo: true }), 910, 770, 3);
  for (let f = 0; f < 4; f++) blit(g, api.enemySprite('gloomship', f), 1200 + (f % 2) * 170, 640 + Math.floor(f / 2) * 100 + 40, 2);
  // Zeile 4: Merkmale
  label(g, 'Merkmale: normal | Regrow | Fortified | beide | beide + Camo  (je Typ)', 20, 850);
  const types: EnemyType[] = ['red', 'green', 'pink', 'frostling', 'ironshell', 'ember', 'brute', 'crystal', 'gloomship'];
  types.forEach((t, row) => {
    const big = t === 'gloomship' || t === 'crystal';
    const k = big ? 1 : 2;
    const x0 = 40 + (row % 3) * 560, y0 = 930 + Math.floor(row / 3) * 130;
    const variants: api.EnemySpriteOpts[] = [{}, { regrow: true }, { fortified: true }, { regrow: true, fortified: true }, { regrow: true, fortified: true, camo: true }];
    variants.forEach((o, i) => blit(g, api.enemySprite(t, 1, o), x0 + i * (big ? 100 : 64), y0 + (big ? 50 : 40) * (big ? 1 : 1) - 8, k));
    label(g, t, x0 - 30, y0 - 22);
  });
  return c;
}

export function sheetBosseR15(): HTMLCanvasElement {
  const { c, g } = mk(1700, 1500);
  tile(g, 0, 0, 1700, 1500);
  label(g, 'Frost Wyrm: Phase 0 (4 Frames) | Phase 1 (<66 %) | Phase 2 (<33 %)  -- Rahmen max 80 x 64', 20, 16);
  for (let f = 0; f < 4; f++) blit(g, api.enemySprite('wyrm', f), 130 + f * 320, 150, 3);
  for (let k = 1; k <= 2; k++) blit(g, api.enemySprite('wyrm', 0, { damageStage: k }), 130 + (k - 1) * 320, 330, 3);
  blit(g, api.enemySprite('wyrm', 1, { hitFlash: true }), 770, 330, 3);
  blit(g, api.enemySprite('wyrm', 1, { regrow: true, fortified: true }), 1090, 330, 3);
  label(g, 'Ember Colossus: Platten 0..4 gefallen', 20, 440);
  for (let k = 0; k <= 4; k++) blit(g, api.enemySprite('colossus', k % 4, { damageStage: k }), 110 + k * 330, 660, 3);
  label(g, 'Colossus Lauf-Frames 0-3 | Treffer-Blitz | Regrow+Fortified | Camo', 20, 780);
  for (let f = 0; f < 4; f++) blit(g, api.enemySprite('colossus', f, { damageStage: 0 }), 70 + f * 175, 1010, 2);
  blit(g, api.enemySprite('colossus', 1, { hitFlash: true }), 780, 1010, 2);
  blit(g, api.enemySprite('colossus', 1, { regrow: true, fortified: true }), 960, 1010, 2);
  blit(g, api.enemySprite('colossus', 2, { camo: true, damageStage: 2 }), 1140, 1010, 2);
  label(g, 'Spielmassstab x2 : Glims, Brute, Crystal, Gloomship, Wyrm, Colossus, Leviathan', 20, 1100);
  const lineup: EnemyType[] = ['pink', 'frostling', 'brute', 'crystal', 'gloomship', 'wyrm', 'colossus', 'leviathan'];
  let x = 50;
  lineup.forEach((t) => {
    const s = api.enemySprite(t, 1);
    blit(g, s, x + s.ax, 1280, 2);
    x += s.canvas.width * 2 + 8;
  });
  void api;
  return c;
}

export function sheetFxR15(): HTMLCanvasElement {
  const { c, g } = mk(1700, 1500);
  tile(g, 0, 0, 1700, 1500);
  let y = 14;
  label(g, 'Regrow: Schicht waechst nach (6 Frames) - red, pink, ironshell, brute, crystal', 20, y);
  const rows: EnemyType[] = ['red', 'pink', 'ironshell', 'brute', 'crystal'];
  rows.forEach((t, row) => {
    const x0 = 20 + (row % 3) * 560, y0 = y + 12 + Math.floor(row / 3) * 120;
    for (let f = 0; f < 6; f++) {
      tile(g, x0 + f * 90, y0, 86, 100, '#4a9a55');
      blit(g, api.enemySprite(t, 1, { regrow: true }), x0 + f * 90 + 43, y0 + 86, t === 'crystal' ? 1 : 2);
      blit(g, api.fx.regrow(t, f), x0 + f * 90 + 43, y0 + 86, t === 'crystal' ? 1 : 2);
    }
  });
  y += 270;
  label(g, 'Platzen der neuen Typen (6 Frames): pink frostling crystal gloomship', 20, y);
  (['pink', 'frostling', 'crystal', 'gloomship'] as EnemyType[]).forEach((t, row) => {
    for (let f = 0; f < 6; f++) { tile(g, 20 + f * 100 + (row % 2) * 640, y + 10 + Math.floor(row / 2) * 130, 96, 126, '#4a9a55'); blit(g, api.fx.popShards(t, f), 68 + f * 100 + (row % 2) * 640, y + 70 + Math.floor(row / 2) * 130, 2); }
  });
  y += 290;
  label(g, 'Gloomship-Absturz (8 Frames)', 20, y);
  for (let f = 0; f < 8; f++) { tile(g, 20 + f * 205, y + 10, 200, 190, '#4a9a55'); blit(g, api.fx.gloomCrash(f), 120 + f * 205, y + 170, 2); }
  y += 220;
  label(g, 'Frosthauch (8 Frames, Radius 60) mit Wyrm im Zentrum | Turm eingefroren (4 Frames) mit Ranger / Thornweaver', 20, y);
  for (let f = 0; f < 8; f++) { tile(g, 20 + f * 168, y + 10, 164, 120, '#4a9a55'); blit(g, api.enemySprite('wyrm', f, {}), 100 + f * 168, y + 90, 1); blit(g, api.fx.frostBreath(f), 100 + f * 168, y + 70, 1); }
  y += 150;
  for (let f = 0; f < 4; f++) {
    tile(g, 20 + f * 160, y, 150, 180, '#4a9a55');
    blit(g, api.towerSprite('ranger', [0, 0, 0], 0, 'idle0'), 95 + f * 160, y + 150, 2);
    blit(g, api.fx.towerFrozen(f), 95 + f * 160, y + 150, 2);
  }
  tile(g, 680, y, 150, 180, '#4a9a55'); blit(g, api.towerSprite('thornweaver', [0, 0, 0], 0, 'idle0'), 755, y + 150, 2); blit(g, api.fx.towerFrozen(1), 755, y + 150, 2);
  tile(g, 840, y, 150, 180, '#4a9a55'); blit(g, api.towerSprite('alchemist', [0, 0, 0], 0, 'idle0'), 915, y + 150, 2); blit(g, api.fx.towerFrozen(2), 915, y + 150, 2);
  tile(g, 1000, y, 150, 180, '#4a9a55'); blit(g, api.fx.towerFrozen(0), 1075, y + 150, 4);
  y += 200;
  label(g, 'Lava-Stampfer (6 Frames, Radius 80) mit Colossus', 20, y);
  for (let f = 0; f < 6; f++) { tile(g, 20 + f * 280, y + 10, 276, 200, '#4a9a55'); blit(g, api.fx.stomp(f), 158 + f * 280, y + 110, 1); blit(g, api.enemySprite('colossus', f, {}), 158 + f * 280, y + 110, 1); }
  y += 230;
  label(g, 'Boss-Tod: Frost Wyrm (10 Frames) / Ember Colossus (10 Frames)', 20, y);
  (['wyrm', 'colossus'] as const).forEach((k, row) => {
    for (let f = 0; f < 10; f++) { tile(g, 20 + f * 168, y + 10 + row * 140, 164, 136, '#4a9a55'); blit(g, api.fx.bossDeath(k, f), 102 + f * 168, y + 128 + row * 140, 1); }
  });
  return c;
}
