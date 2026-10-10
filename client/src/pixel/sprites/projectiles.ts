/** Projektile in 16 Richtungen (0 = rechts, gegen den Uhrzeigersinn, 22,5 Grad je Schritt). Mittelpunkt = Anker. */
import { flake, spark } from './parts';
import type { PalName } from '../palette';
import { Surface } from './surface';
import type { ProjectileKind } from './types';

export const PROJ_SIZE = 25;
const C = 12;

export function projectileRaster(kind: ProjectileKind, dir16: number, spin = 0): { rows: string[]; ax: number; ay: number } {
  const s = new Surface(PROJ_SIZE, PROJ_SIZE);
  const a = (((dir16 % 16) + 16) % 16) * (Math.PI / 8);
  const ux = Math.cos(a), uy = -Math.sin(a);
  const nx = -uy, ny = ux;
  const P = (t: number, w = 0): [number, number] => [C + ux * t + nx * w, C + uy * t + ny * w];
  const L = (t0: number, t1: number, w: number, col: Parameters<Surface['line']>[4], th = 1) => {
    const p = P(t0, w), q = P(t1, w);
    s.line(p[0], p[1], q[0], q[1], col, th);
  };
  switch (kind) {
    case 'arrow': {
      L(-3, 2, 0, 'sand');
      const tip = P(3.2); s.px(tip[0], tip[1], 'white');
      const t2 = P(2.2); s.px(t2[0], t2[1], 'silver');
      for (const w of [-1, 1]) { const f = P(-3, w); s.px(f[0], f[1], 'red'); const g = P(-2, w); s.px(g[0], g[1], 'red'); }
      break;
    }
    case 'bigArrow': {
      // Sky-Splitter-Pfeil: goldene Spur, dicker Schaft, leuchtende Spitze
      for (let i = 1; i <= 7; i++) { const q = P(-5 - i * 0.9, 0); s.px(q[0], q[1], i < 3 ? 'yellow' : i < 5 ? 'amber' : 'orange'); }
      L(-5, 4, 0, 'yellow', 1);
      L(-4, 3, 1, 'amber', 1);
      const tip = P(6); s.px(tip[0], tip[1], 'white');
      L(3, 5, 0, 'white'); L(3, 4, 1, 'yellow'); L(3, 4, -1, 'yellow');
      for (const w of [-2, 2]) { const f = P(-5, w); s.px(f[0], f[1], 'white'); const g = P(-4, w * 0.7); s.px(g[0], g[1], 'white'); }
      break;
    }
    case 'bolt': {
      L(-5, 3, 0, 'bark', 1);
      L(-4, 3, 0.7, 'wood');
      L(2, 5, 0, 'silver'); L(2, 4, 1, 'stone'); L(2, 4, -1, 'stone');
      const tip = P(5.5); s.px(tip[0], tip[1], 'white');
      for (const w of [-1, 1]) { const f = P(-5, w); s.px(f[0], f[1], 'red'); const g = P(-4, w); s.px(g[0], g[1], 'crimson'); }
      break;
    }
    case 'starBolt': {
      for (let i = 1; i <= 6; i++) { const q = P(-5 - i, 0); s.px(q[0], q[1], i < 3 ? 'ice' : 'sky'); }
      L(-5, 3, 0, 'sand'); L(-4, 3, 1, 'wood');
      for (const [t, w] of [[4, 0], [5, 0], [3, 1], [3, -1], [4, 1], [4, -1]] as [number, number][]) { const q = P(t, w); s.px(q[0], q[1], t === 4 && w === 0 ? 'white' : 'yellow'); }
      const tip = P(7); s.px(tip[0], tip[1], 'yellow');
      for (const [t, w] of [[4, 3], [4, -3], [1, 2], [1, -2]] as [number, number][]) { const q = P(t, w); s.px(q[0], q[1], 'white'); }
      break;
    }
    case 'bomb': {
      s.ball(C, C, 2.8, 2.8, ['ink', 'night', 'dusk']);
      s.px(C - 1, C - 1, 'stone');
      // Lunte kreist mit `spin`
      const fa = (spin / 16) * Math.PI * 2 - Math.PI / 2;
      const fx = C + Math.cos(fa) * 3.5, fy = C + Math.sin(fa) * 3.5;
      s.px(fx, fy, 'tan');
      s.px(C + Math.cos(fa) * 4.6, C + Math.sin(fa) * 4.6, spin % 2 ? 'yellow' : 'orange');
      break;
    }
    case 'frag': {
      s.px(C, C, 'yellow'); s.px(C - 1, C, 'amber'); s.px(C + 1, C, 'amber'); s.px(C, C - 1, 'amber'); s.px(C, C + 1, 'amber');
      const q = P(-3); s.px(q[0], q[1], 'orange');
      break;
    }
    case 'frost': {
      for (let i = 1; i <= 6; i++) { const q = P(-2 - i, (i % 2 ? 0.3 : -0.3)); s.px(q[0], q[1], i < 3 ? 'ice' : i < 5 ? 'sky' : 'navy'); }
      s.ball(C, C, 2.8, 2.8, ['sky', 'ice', 'white']);
      s.px(C - 1, C - 1, 'white');
      break;
    }
    case 'shard': {
      L(-3, 3, 0, 'ice');
      L(-1, 2, 1, 'sky'); L(-1, 2, -1, 'sky');
      const tip = P(4); s.px(tip[0], tip[1], 'white');
      const f = P(0); s.px(f[0], f[1], 'white');
      break;
    }
    case 'snipe': {
      // sehr schneller Bolzen: duenner dunkler Schaft, helle Spitze, lange Leuchtspur (gelb -> orange, gestrichelt)
      for (let i = 1; i <= 7; i++) { const q = P(-4 - i * 1.15, 0); if (i % 3 !== 0) s.px(q[0], q[1], i < 3 ? 'white' : i < 5 ? 'yellow' : 'orange'); }
      L(-4, 4, 0, 'sand'); L(1, 4, 0, 'silver'); L(-3, 1, 0.8, 'dusk');
      const tip = P(5); s.px(tip[0], tip[1], 'white'); const t2 = P(4); s.px(t2[0], t2[1], 'silver');
      for (const w of [-1, 1]) { const f = P(-4, w); s.px(f[0], f[1], 'red'); }
      break;
    }
    case 'snipeHeavy': {
      // schwerer Eisenbolzen (magic): dicker Schaft, Eisenspitze, eisblaue Spur
      for (let i = 1; i <= 8; i++) { const q = P(-4 - i * 1.2, (i % 2 ? 0.4 : -0.4)); if (i % 4 !== 0) s.px(q[0], q[1], i < 3 ? 'white' : i < 6 ? 'ice' : 'sky'); }
      L(-4, 3, 0, 'wood'); L(-4, 3, 0.9, 'bark');
      L(2, 5, 0, 'stone'); L(2, 4, 1, 'slate'); L(2, 4, -1, 'slate');
      const tip = P(6); s.px(tip[0], tip[1], 'white'); const t2 = P(5); s.px(t2[0], t2[1], 'silver');
      for (const w of [-1.4, 1.4]) { const f = P(-4, w); s.px(f[0], f[1], 'red'); const g = P(-3, w); s.px(g[0], g[1], 'crimson'); }
      break;
    }
    case 'snipeGold': {
      // Lanternbreaker: goldener Lichtbolzen mit weissem Kern und Funkenspur
      for (let i = 1; i <= 9; i++) { const q = P(-5 - i * 0.95, ((i * 7) % 5 - 2) * 0.5); s.px(q[0], q[1], i < 3 ? 'white' : i < 6 ? 'yellow' : 'amber'); }
      L(-6, 4, 0, 'white'); L(-6, 3, 1, 'yellow'); L(-6, 3, -1, 'yellow'); L(-4, 1, 2, 'amber'); L(-4, 1, -2, 'amber');
      const tip = P(7); s.px(tip[0], tip[1], 'white'); const t2 = P(5.5, 1); s.px(t2[0], t2[1], 'yellow'); const t3 = P(5.5, -1); s.px(t3[0], t3[1], 'yellow');
      break;
    }
    case 'splinter': {
      // Splitter: winzige Metallscherbe
      L(-2, 2, 0, 'silver'); const tip = P(3); s.px(tip[0], tip[1], 'white'); const f = P(-1, 1); s.px(f[0], f[1], 'stone'); const g = P(-3); s.px(g[0], g[1], 'amber');
      break;
    }
    case 'thorn': {
      // Dorn: brauner Schaft, helle Spitze, zwei Widerhaken, gruener Federbusch
      L(-4, 2, 0, 'bark'); L(-3, 1, 0.8, 'wood');
      for (const w of [-1, 1]) { const f = P(-4, w); s.px(f[0], f[1], 'leaf'); const g = P(-3, w * 1.5); s.px(g[0], g[1], 'grass'); const b = P(1, w); s.px(b[0], b[1], 'silver'); }
      const t1 = P(3); s.px(t1[0], t1[1], 'white'); const t2 = P(2); s.px(t2[0], t2[1], 'silver');
      break;
    }
    case 'thornMagic': {
      // Grove Guardian: Dorn mit Leuchtspur (magic, trifft Ironshell)
      for (let i = 1; i <= 6; i++) { const q = P(-4 - i * 1.1, ((i * 5) % 3 - 1) * 0.5); if (i % 3 !== 0) s.px(q[0], q[1], i < 3 ? 'white' : i < 5 ? 'leaf' : 'grass'); }
      L(-4, 2, 0, 'leaf'); L(-3, 2, 0.9, 'amber'); L(-3, 2, -0.9, 'amber');
      for (const w of [-1, 1]) { const b = P(0, w * 1.6); s.px(b[0], b[1], 'yellow'); }
      const t1 = P(4); s.px(t1[0], t1[1], 'white'); const t2 = P(3); s.px(t2[0], t2[1], 'yellow');
      break;
    }
    case 'potion': case 'potionGold': {
      // Flasche im Bogen: `spin` = Drehung 0..15 (22,5 Grad je Schritt), Hals zeigt in Drehrichtung
      const gold = kind === 'potionGold';
      const a2 = (spin / 16) * Math.PI * 2;
      const hx = Math.cos(a2), hy = -Math.sin(a2);
      const liq: [PalName, PalName, PalName] = gold ? ['rust', 'amber', 'yellow'] : ['grass', 'leaf', 'yellow'];
      // Tropfspur
      for (let i = 1; i <= 3; i++) { const q = [C - hx * (5 + i * 1.5) + (i % 2 ? 1 : -1), C - hy * (5 + i * 1.5) + 1]; s.px(q[0], q[1], i < 2 ? liq[2] : liq[0]); }
      s.ball(C, C, 3.6, 3.6, ['stone', 'silver', 'white']);
      s.ball(C, C, 2.8, 2.8, liq);
      const nk = [C + hx * 4.2, C + hy * 4.2], nk2 = [C + hx * 5.8, C + hy * 5.8];
      s.line(C + hx * 2.5, C + hy * 2.5, nk[0], nk[1], 'silver', 2); s.px(nk2[0], nk2[1], gold ? 'yellow' : 'wood'); s.px(nk2[0] + hx, nk2[1] + hy, gold ? 'amber' : 'bark');
      s.px(C - 1, C - 1, 'white');
      if (gold) { s.px(C + 4, C - 4, 'white'); s.px(C - 4, C + 3, 'yellow'); }
      break;
    }
    case 'nail': {
      // Nagel (Tinker, Sentries): kurzer Eisenschaft, helle Spitze, Kopf mit Messingpunkt, kleine Funkenspur
      for (let i = 1; i <= 3; i++) { const q = P(-3 - i, (i % 2 ? 0.3 : -0.3)); if (i !== 2) s.px(q[0], q[1], i < 2 ? 'yellow' : 'amber'); }
      L(-3, 2, 0, 'stone'); L(-3, 1, 0.8, 'slate');
      const hd = P(-3.5); s.px(hd[0], hd[1], 'amber');
      const tip = P(3.2); s.px(tip[0], tip[1], 'white'); const t2 = P(2.4); s.px(t2[0], t2[1], 'silver');
      break;
    }
    case 'lantern': {
      for (let i = 1; i <= 6; i++) { const q = P(-3 - i, ((spin + i) % 3 - 1) * 0.6); s.px(q[0], q[1], i < 3 ? 'orange' : i < 5 ? 'red' : 'crimson'); }
      s.ball(C, C, 3, 3, ['orange', 'amber', 'yellow']);
      s.px(C, C, 'white'); s.px(C - 1, C - 1, 'white');
      const q = P(1, 3); s.px(q[0], q[1], 'yellow'); const r = P(-2, -3); s.px(r[0], r[1], 'amber');
      break;
    }
  }
  void flake; void spark;
  return { rows: s.toRows(), ax: C, ay: C };
}
