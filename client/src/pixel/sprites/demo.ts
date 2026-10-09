/** Mini-Szene fuer das Angriffs-Video (nur Screenshots): jeder Turm schiesst, Projektil fliegt, Gegner platzt. Keine Sim, nur die Sprite-API. */
import * as api from './index';
import type { EnemyType, ProjectileKind, Tiers } from './index';

const W = 400, H = 225, K = 3;
const out = document.getElementById('out') as HTMLElement;
const cv = document.createElement('canvas');
cv.width = W * K; cv.height = H * K;
out.appendChild(cv);
const g = cv.getContext('2d') as CanvasRenderingContext2D;
g.imageSmoothingEnabled = false;
const layer = document.createElement('canvas');
layer.width = W; layer.height = H;
const L = layer.getContext('2d') as CanvasRenderingContext2D;
L.imageSmoothingEnabled = false;

const PATH_Y = 120;
interface En { type: EnemyType; x: number; hp: number; hit: number; slow: number; stun: number; camo: boolean; stage: number; id: number }
interface Pr { kind: ProjectileKind; x: number; y: number; tx: number; ty: number; t: number; dur: number; target: En | null; owner: number; arc: boolean; vx: number; vy: number }
interface Fx { make: (f: number) => api.Sprite; x: number; y: number; f: number; n: number; rate: number; tick: number }
interface Txt { s: string; x: number; y: number; t: number }
const CHILD: Partial<Record<EnemyType, EnemyType>> = { gold: 'green', green: 'blue', blue: 'red' };

let tick = 0, nid = 1;
const ens: En[] = [], prs: Pr[] = [], fxs: Fx[] = [], txts: Txt[] = [];
const rnd = ((s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(7);

interface Tw { x: number; y: number; kind: 'ranger' | 'bomb' | 'frost' | 'hero'; tiers: Tiers; lvl: number; cd: number; atk: number; facing: number; pk: ProjectileKind; every: number; range: number; shots: number }
const towers: Tw[] = [
  { x: 52, y: 78, kind: 'ranger', tiers: [3, 2, 0], lvl: 0, cd: 20, atk: -1, facing: 7, pk: 'arrow', every: 34, range: 90, shots: 0 },
  { x: 118, y: 172, kind: 'bomb', tiers: [0, 3, 2], lvl: 0, cd: 40, atk: -1, facing: 1, pk: 'bomb', every: 80, range: 100, shots: 0 },
  { x: 190, y: 78, kind: 'frost', tiers: [2, 0, 3], lvl: 0, cd: 30, atk: -1, facing: 7, pk: 'frost', every: 70, range: 100, shots: 0 },
  { x: 262, y: 172, kind: 'hero', tiers: [0, 0, 0], lvl: 12, cd: 50, atk: -1, facing: 1, pk: 'lantern', every: 50, range: 100, shots: 0 },
  { x: 334, y: 78, kind: 'ranger', tiers: [0, 0, 5], lvl: 0, cd: 80, atk: -1, facing: 7, pk: 'starBolt', every: 140, range: 110, shots: 0 },
];

function spawn(type: EnemyType, camo = false): void { ens.push({ type, x: -10, hp: type === 'brute' ? 4 : 1, hit: 0, slow: 0, stun: 0, camo, stage: 0, id: nid++ }); }
const speed: Record<EnemyType, number> = { red: 0.55, blue: 0.7, green: 0.9, gold: 1.5, ironshell: 0.6, ember: 1.0, brute: 0.6, leviathan: 0.3 };

function pop(e: En): void {
  fxs.push({ make: (f) => api.popShards(e.type, f), x: e.x, y: PATH_Y - 6, f: 0, n: 6, rate: 3, tick: 0 });
  txts.push({ s: '+1', x: e.x, y: PATH_Y - 14, t: 0 });
  const c = CHILD[e.type];
  if (c) { e.type = c; e.hp = 1; e.hit = 0; }
  else if (e.type === 'ironshell' || e.type === 'ember') { e.type = 'gold'; e.hp = 1; }
  else if (e.type === 'brute') { e.type = 'ironshell'; e.hp = 1; }
  else e.hp = 0;
}
function damage(e: En, d: number): void {
  e.hit = 3;
  e.hp -= d;
  if (e.type === 'brute') e.stage = e.hp <= 1 ? 2 : e.hp <= 2 ? 1 : 0;
  if (e.hp <= 0) pop(e);
}
function explosionAt(x: number, y: number, r: number): void {
  fxs.push({ make: (f) => api.explosion('bomb', f, r), x, y, f: 0, n: 5, rate: 3, tick: 0 });
  for (const e of ens.slice()) if (Math.hypot(e.x - x, PATH_Y - 6 - y) < r + 6) { damage(e, 1); if (e.hp > 0) e.stun = 40; }
}

function step(): void {
  tick++;
  const T = tick % 900;
  if (T === 1) { ens.length = 0; prs.length = 0; }
  const wave: [number, EnemyType, boolean?][] = [
    [10, 'green'], [30, 'blue'], [50, 'gold'], [70, 'green'], [95, 'green', true], [130, 'ironshell'], [160, 'ember'], [185, 'blue'], [200, 'gold'],
    [250, 'brute'], [280, 'green'], [310, 'ironshell'], [340, 'gold'], [360, 'ember'], [400, 'brute'], [430, 'blue'], [450, 'green'], [470, 'gold'], [490, 'red'],
  ];
  for (const [t, ty, c] of wave) if (T === t) spawn(ty, !!c);
  for (const e of ens) {
    if (e.hit > 0) e.hit--;
    if (e.stun > 0) { e.stun--; continue; }
    e.x += speed[e.type] * (e.slow > 0 ? 0.5 : 1) * 0.8;
    if (e.slow > 0) e.slow--;
  }
  for (let i = ens.length - 1; i >= 0; i--) if (ens[i].hp <= 0 || ens[i].x > W + 10) ens.splice(i, 1);
  // Tuerme
  for (const t of towers) {
    t.cd--;
    if (t.atk >= 0) {
      t.atk++;
      if (t.atk === 8) fire(t);
      if (t.atk > 20) t.atk = -1;
    } else if (t.cd <= 0) {
      let best: En | null = null, bd = 1e9;
      for (const e of ens) {
        if (e.camo && t.kind !== 'hero' && !(t.kind === 'frost' && t.tiers[2] >= 2) && !(t.kind === 'ranger' && t.tiers[2] >= 2)) continue;
        const d = Math.hypot(e.x - t.x, PATH_Y - t.y);
        if (d < t.range && e.x > 0 && d < bd) { best = e; bd = d; }
      }
      if (best) {
        const dx = best.x - t.x, dy = PATH_Y - 6 - t.y;
        t.facing = api.dir8(dx, dy);
        t.atk = 0; t.cd = t.every;
        (t as Tw & { tg?: En }).tg = best;
      }
    }
  }
  for (const p of prs) {
    p.t++;
    if (p.arc) { /* Bogen */ }
    p.x += p.vx; p.y += p.vy;
    if (p.t >= p.dur) {
      p.t = 9999;
      if (p.kind === 'bomb') explosionAt(p.tx, p.ty, 28);
      else if (p.kind === 'frost') {
        fxs.push({ make: (f) => api.nova(f, 18), x: p.tx, y: p.ty, f: 0, n: 4, rate: 4, tick: 0 });
        for (const e of ens) if (Math.hypot(e.x - p.tx, PATH_Y - 6 - p.ty) < 22) { if (e.type !== 'ember') { e.slow = 90; damage(e, 1); } else e.hit = 3; }
      } else if (p.target && ens.includes(p.target)) {
        if (p.target.type === 'ironshell' && (p.kind === 'arrow')) { txts.push({ s: 'TINK', x: p.target.x, y: PATH_Y - 16, t: 0 }); }
        else if (p.kind === 'starBolt') { for (const e of ens) if (Math.abs(e.x - p.tx) < 26) damage(e, 4); fxs.push({ make: (f) => api.explosion('star', f, 22), x: p.tx, y: p.ty, f: 0, n: 5, rate: 3, tick: 0 }); }
        else damage(p.target, p.kind === 'lantern' ? 2 : 1);
      }
    }
  }
  for (let i = prs.length - 1; i >= 0; i--) if (prs[i].t >= 9999) prs.splice(i, 1);
  for (const f of fxs) { f.tick++; if (f.tick % f.rate === 0) f.f++; }
  for (let i = fxs.length - 1; i >= 0; i--) if (fxs[i].f >= fxs[i].n) fxs.splice(i, 1);
  for (const t of txts) t.t++;
  for (let i = txts.length - 1; i >= 0; i--) if (txts[i].t > 30) txts.splice(i, 1);
}

function fire(t: Tw): void {
  const tg = (t as Tw & { tg?: En }).tg;
  if (!tg) return;
  const m = t.kind === 'hero' ? api.heroMuzzle(t.lvl, t.facing) : api.towerMuzzle(t.kind === 'ranger' ? 'ranger' : t.kind === 'bomb' ? 'bombardier' : 'frostcaller', t.tiers, t.facing);
  const sx = t.x + m.x, sy = t.y + m.y;
  const lead = tg.x + speed[tg.type] * 0.8 * (t.kind === 'bomb' ? 22 : 6);
  const tx = t.kind === 'frost' && t.tiers[2] >= 3 ? tg.x : lead, ty = PATH_Y - 6;
  if (t.kind === 'frost' && t.tiers[2] >= 3) {
    // Kettenblitz: sofort, Pixel-Linie ueber bis zu 3 Gegner
    const near = ens.filter((e) => e.x > 0 && Math.hypot(e.x - sx, PATH_Y - sy) < 140).sort((a, b) => b.x - a.x).slice(0, 4);
    const pts: [number, number][] = [[sx, sy]];
    for (const e of near) pts.push([e.x, PATH_Y - 6]);
    const sp = api.boltLine(pts, tick);
    fxs.push({ make: () => sp, x: 0, y: 0, f: 0, n: 1, rate: 7, tick: 0 });
    for (const e of near) damage(e, 1);
    return;
  }
  const dist = Math.hypot(tx - sx, ty - sy);
  const sp = t.pk === 'bomb' ? 3.4 : t.pk === 'starBolt' ? 8 : t.pk === 'lantern' ? 5 : t.pk === 'frost' ? 4 : 7;
  const dur = Math.max(2, Math.round(dist / sp));
  const n = t.kind === 'ranger' && t.tiers[0] >= 3 ? 3 : 1;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 0.2;
    const a = Math.atan2(ty - sy, tx - sx) + off;
    const vx = Math.cos(a) * dist / dur, vy = Math.sin(a) * dist / dur;
    prs.push({ kind: t.pk, x: sx, y: sy, tx: sx + vx * dur, ty: sy + vy * dur, t: 0, dur, target: tg, owner: 0, arc: t.pk === 'bomb', vx, vy });
  }
  t.shots++;
}

const GR: string[] = ['#3e8948', '#63c74d', '#265c42'];
function drawBg(): void {
  L.fillStyle = GR[0]; L.fillRect(0, 0, W, H);
  const r = ((s) => () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296))(99);
  for (let i = 0; i < 380; i++) { L.fillStyle = r() > 0.5 ? GR[1] : GR[2]; L.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1 + (r() > 0.7 ? 1 : 0), 1); }
  L.fillStyle = '#b86f50'; L.fillRect(0, PATH_Y - 14, W, 28);
  L.fillStyle = '#ead4aa'; L.fillRect(0, PATH_Y - 14, W, 2); L.fillRect(0, PATH_Y + 12, W, 2);
  L.fillStyle = '#c28569'; for (let x = 0; x < W; x += 9) L.fillRect(x + ((x * 7) % 5), PATH_Y - 8 + ((x * 3) % 14), 3, 1);
}
function put(s: api.Sprite, x: number, y: number): void { L.drawImage(s.canvas, Math.round(x - s.ax), Math.round(y - s.ay)); }

function draw(): void {
  drawBg();
  const items: { y: number; f: () => void }[] = [];
  for (const t of towers) {
    const fr = t.atk >= 0 ? (['atk0', 'atk1', 'atk2', 'atk3'] as const)[Math.min(3, Math.floor(t.atk / 4) === 1 && t.atk < 8 ? 1 : t.atk < 5 ? 0 : t.atk < 8 ? 1 : t.atk < 12 ? 2 : 3)] : (['idle0', 'idle1', 'idle2', 'idle3'] as const)[Math.floor(tick / 10) % 4];
    items.push({ y: t.y, f: () => {
      put(api.shadowSprite(18, 6), t.x, t.y - 2);
      if (t.kind === 'hero') put(api.heroSprite(t.lvl, t.facing, fr), t.x, t.y);
      else put(api.towerSprite(t.kind === 'ranger' ? 'ranger' : t.kind === 'bomb' ? 'bombardier' : 'frostcaller', t.tiers, t.facing, fr), t.x, t.y);
    } });
  }
  for (const e of ens) {
    const frame = Math.floor(tick / (e.type === 'gold' ? 4 : 8)) % 4;
    items.push({ y: PATH_Y, f: () => {
      put(api.shadowSprite(e.type === 'brute' ? 16 : 10, 4), e.x, PATH_Y + 1);
      put(api.enemySprite(e.type, frame, { camo: e.camo, hitFlash: e.hit > 0, damageStage: e.stage }), e.x, PATH_Y + 2);
      if (e.slow > 0) put(api.statusFx('slow', Math.floor(tick / 6), e.type), e.x, PATH_Y - 18);
      if (e.stun > 0) put(api.statusFx('stun', Math.floor(tick / 6), e.type), e.x, PATH_Y - 18);
    } });
  }
  items.sort((a, b) => a.y - b.y).forEach((i) => i.f());
  for (const p of prs) {
    const d16 = api.dir16(p.vx, p.vy);
    let yy = p.y;
    if (p.kind === 'bomb') yy -= Math.sin((p.t / p.dur) * Math.PI) * 38;
    put(api.projectileSprite(p.kind, p.kind === 'bomb' ? (tick >> 1) % 16 : d16), p.x, yy);
  }
  for (const f of fxs) put(f.make(f.f), f.x, f.y);
  for (const t of txts) put(api.pixelText(t.s, t.s === 'TINK' ? 'silver' : 'yellow'), t.x, t.y - t.t * 0.4);
  g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(layer, 0, 0, W * K, H * K);
}

(window as unknown as { __ready: boolean }).__ready = true;
let last = performance.now(), acc = 0;
function loop(now: number): void {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
(window as unknown as { __demo: { advance: (n: number) => void } }).__demo = { advance: (n: number) => { for (let i = 0; i < n; i++) step(); draw(); } };
