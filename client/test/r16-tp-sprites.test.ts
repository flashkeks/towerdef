import { describe, expect, it } from 'vitest';
import { ALARM_MARK_FRAMES, alarmMarkRaster, buildPuffRaster, BUILD_FRAMES, OC_FRAMES, overclockRaster } from '../src/pixel/fx/r16tb';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';
import { iconAbilityRaster, iconUpgradeRaster } from '../src/pixel/sprites/icons';
import { projectileRaster } from '../src/pixel/sprites/projectiles';
import { SENTRY_FRAMES, sentryRaster } from '../src/pixel/sprites/sentry';
import { towerRaster } from '../src/pixel/sprites/towers';
import { baseLook, PROJECTILE_KINDS, type Tiers, type TowerType } from '../src/pixel/sprites/types';
import { alarmMarked, bellFrameOf } from '../src/match/r16-bell';
import { sentryBlink, sentryFacing, sentryFrameOf, sentryLook, sentryShotOffset, SENTRY_BLINK_TICKS } from '../src/match/r16-tinker';
import { rangeView } from '../src/match/r13';

const sig = (rows: string[]): string => rows.join('/');
const count = (rows: string[]): number => rows.join('').replace(/\./g, '').length;
const valid = (rows: string[]): void => { expect(() => rowsToRGBA(rows)).not.toThrow(); };
const tiersOf = (p: number, t: number): Tiers => { const r: Tiers = [0, 0, 0]; r[p] = t; return r; };
const NEW: TowerType[] = ['bellringer', 'tinker'];

describe('Runde 16 TP: Bellringer und Tinker haben eigene Figuren', () => {
  it('kein Platzhalter mehr', () => {
    expect(baseLook('bellringer')).toBe('bellringer');
    expect(baseLook('tinker')).toBe('tinker');
  });
  it('alle 16 Stufen-Looks je Turm verschieden, gueltig, mit Anker im Bild', () => {
    for (const type of NEW) {
      const seen = new Set<string>();
      for (let p = 0; p < 3; p++) for (let t = 0; t <= 5; t++) {
        const r = towerRaster(type, tiersOf(p, t), 0, 'idle1');
        valid(r.rows);
        expect(count(r.rows), `${type} ${p}${t}`).toBeGreaterThan(150);
        expect(r.ay).toBeLessThan(r.rows.length);
        seen.add(sig(r.rows));
      }
      expect(seen.size, type).toBe(16);
    }
  });
  it('Stufen werden deutlich groesser: 3 > 2 und 5 am hoechsten (Pixelzahl)', () => {
    for (const type of NEW) for (let p = 0; p < 3; p++) {
      const n = (t: number): number => count(towerRaster(type, tiersOf(p, t), 0, 'idle0').rows);
      expect(n(3), `${type} ${p}`).toBeGreaterThan(n(2) + 20);
      expect(n(5), `${type} ${p}`).toBeGreaterThan(n(4));
    }
  });
  it('Crosspath: Zweitpfad aendert das Bild, Pfade unterscheiden sich', () => {
    for (const type of NEW) {
      const a = sig(towerRaster(type, [3, 0, 0], 0, 'idle0').rows);
      expect(sig(towerRaster(type, [3, 2, 0], 0, 'idle0').rows)).not.toBe(a);
      expect(sig(towerRaster(type, [3, 0, 2], 0, 'idle0').rows)).not.toBe(a);
      expect(sig(towerRaster(type, [3, 2, 0], 0, 'idle0').rows)).not.toBe(sig(towerRaster(type, [3, 0, 2], 0, 'idle0').rows));
    }
  });
  it('Bellringer: Glocke schwingt (4 Idle-Frames verschieden), dreht sich nicht, Atk-Frames schwingen weiter aus', () => {
    for (const t of [[0, 0, 0], [3, 0, 0], [0, 4, 0], [0, 0, 5]] as Tiers[]) {
      expect(new Set(['idle0', 'idle1', 'idle2', 'idle3'].map((f) => sig(towerRaster('bellringer', t, 0, f as 'idle0').rows))).size).toBe(4);
      expect(sig(towerRaster('bellringer', t, 0, 'idle1').rows)).toBe(sig(towerRaster('bellringer', t, 5, 'idle1').rows));
      expect(sig(towerRaster('bellringer', t, 0, 'atk0').rows)).not.toBe(sig(towerRaster('bellringer', t, 0, 'idle0').rows));
    }
  });
  it('Tinker: 8 Richtungen, Idle 4 + Angriff 4, Muendung im Bild und vor der Figur im Abschuss-Frame', () => {
    for (const t of [[0, 0, 0], [3, 0, 0], [0, 4, 0], [0, 0, 5]] as Tiers[]) {
      expect(new Set(Array.from({ length: 8 }, (_, f) => sig(towerRaster('tinker', t, f, 'idle0').rows))).size, `${t}`).toBe(8);
      expect(new Set(['idle0', 'idle1', 'idle2', 'idle3'].map((f) => sig(towerRaster('tinker', t, 0, f as 'idle0').rows))).size).toBe(4);
      const a = [0, 1, 2, 3].map((i) => towerRaster('tinker', t, 0, `atk${i}` as 'atk0'));
      expect(new Set(a.map((r) => sig(r.rows))).size).toBe(4);
      for (const r of a) { expect(r.ax + (r.mx ?? 0)).toBeGreaterThan(0); expect(r.ay + (r.my ?? 0)).toBeGreaterThan(0); expect(r.ax + (r.mx ?? 0)).toBeLessThan(r.rows[0].length); }
      expect(a[2].mx).toBeGreaterThan(0);
    }
  });
  it('Tinker: gespiegelte Richtungen sind Spiegelbilder', () => {
    for (const [a, b] of [[4, 0], [3, 1], [5, 7]]) {
      const l = towerRaster('tinker', [2, 1, 0], a, 'idle1').rows, r = towerRaster('tinker', [2, 1, 0], b, 'idle1').rows;
      expect(l).toEqual(r.map((row) => [...row].reverse().join('')));
    }
  });
  it('keine Plattform: Fuesse am Boden', () => {
    for (const type of NEW) {
      const r = towerRaster(type, [0, 0, 0], 0, 'idle0');
      const ys = r.rows.map((x, y) => (/[^.]/.test(x) ? y : -1)).filter((y) => y >= 0);
      expect(Math.abs(ys[ys.length - 1] - r.ay)).toBeLessThanOrEqual(4);
    }
  });
});

describe('Runde 16 TP: Icons, Geschoss', () => {
  it('30 Upgrade-Icons verschieden, 16 x 16, gefuellt', () => {
    const seen = new Set<string>();
    for (const type of NEW) for (const p of [0, 1, 2] as const) for (let t = 1; t <= 5; t++) {
      const r = iconUpgradeRaster(type, p, t);
      expect(r.rows).toHaveLength(16);
      expect(r.rows.every((x) => x.length === 16)).toBe(true);
      valid(r.rows);
      expect(count(r.rows), `${type} ${p} ${t}`).toBeGreaterThan(70);
      seen.add(sig(r.rows));
    }
    expect(seen.size).toBe(30);
  });
  it('Faehigkeits-Icons alarm und overclock eigen (nicht die Vorbilder)', () => {
    const a = iconAbilityRaster('alarm'), o = iconAbilityRaster('overclock');
    valid(a.rows); valid(o.rows);
    expect(sig(a.rows)).not.toBe(sig(iconAbilityRaster('focus').rows));
    expect(sig(o.rows)).not.toBe(sig(iconAbilityRaster('arrowRain').rows));
    expect(sig(a.rows)).not.toBe(sig(o.rows));
  });
  it('Nagel ist ein echtes Geschoss in 16 verschiedenen Richtungen', () => {
    expect(PROJECTILE_KINDS).toContain('nail');
    expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster('nail', d).rows))).size).toBe(16);
  });
});

describe('Runde 16 TP: Sentry und Effekte', () => {
  it('Sentry: 5 Looks x 6 Frames gueltig, Looks und Frames verschieden, Aufbau steigt (mehr Pixel je Frame)', () => {
    const seen = new Set<string>();
    for (let look = 0; look < 5; look++) for (const f of SENTRY_FRAMES) { const r = sentryRaster(look, 0, f); valid(r.rows); expect(count(r.rows)).toBeGreaterThan(20); seen.add(sig(r.rows)); }
    expect(seen.size).toBe(30);
    for (let look = 0; look < 5; look++) expect(count(sentryRaster(look, 0, 'b2').rows)).toBeGreaterThan(count(sentryRaster(look, 0, 'b0').rows));
  });
  it('Sentry: 8 Blickrichtungen, Muendung folgt dem Blick, Spiegelung stimmt', () => {
    expect(new Set(Array.from({ length: 8 }, (_, f) => sig(sentryRaster(2, f, 'idle0').rows))).size).toBe(8);
    expect(sentryRaster(2, 0, 'idle0').mx).toBeGreaterThan(0);
    expect(sentryRaster(2, 4, 'idle0').mx).toBeLessThan(0);
    expect(sentryRaster(2, 6, 'idle0').my).toBeGreaterThan(sentryRaster(2, 2, 'idle0').my);
  });
  it('Sentry-Logik: Look aus Stufe A, Blick zum Ziel, Aufbau -> Idle -> Feuer, Flackern vor dem Abbau', () => {
    expect([0, 1, 2, 3, 4, 5].map((a) => sentryLook([a, 0, 0]))).toEqual([0, 0, 1, 2, 3, 4]);
    expect(sentryFacing(0, 0, 10, 0)).toBe(0);
    expect(sentryFacing(0, 0, 0, -10)).toBe(2);
    expect(sentryFacing(0, 0, -10, 0)).toBe(4);
    expect(sentryFacing(0, 0, 0, 10)).toBe(6);
    expect(sentryFrameOf(0, 0, 0)).toBe('b0');
    expect(sentryFrameOf(6, 0, 0)).toBe('b1');
    expect(sentryFrameOf(30, 0, 0)).toBe('idle0');
    expect(sentryFrameOf(30, 400, 0)).toBe('idle1');
    expect(sentryFrameOf(30, 0, 50)).toBe('fire');
    expect(sentryBlink(SENTRY_BLINK_TICKS + 1, 100)).toBe(false);
    expect(sentryBlink(10, 100)).toBe(true);
    expect(sentryBlink(10, 0)).toBe(false);
  });
  it('Schuss startet an der Sentry: Versatz liegt vor dem Rohr, nicht beim Tinker', () => {
    const o = sentryShotOffset(2, 0);
    expect(o.x).toBeGreaterThan(4);
    expect(sentryShotOffset(2, 4).x).toBeLessThan(-4);
  });
  it('Alarm: Atk-Frames nur waehrend des Alarms, Marken nur bei stehenden lebenden Gegnern', () => {
    expect(bellFrameOf(1, 1000, 0)).toMatch(/^idle/);
    expect(bellFrameOf(1, 1000, 2000)).toMatch(/^atk/);
    expect(alarmMarked({ stunTicks: 30, dead: false }, 1000, 2000)).toBe(true);
    expect(alarmMarked({ stunTicks: 0, dead: false }, 1000, 2000)).toBe(false);
    expect(alarmMarked({ stunTicks: 30, dead: false }, 3000, 2000)).toBe(false);
    expect(alarmMarked({ stunTicks: 30, dead: true }, 1000, 2000)).toBe(false);
  });
  it('Bellringer zeigt wie der Market den Aura-Radius', () => {
    expect(rangeView('bellringer', 80)).toEqual({ kind: 'aura', r: 80 });
    expect(rangeView('tinker', 64)).toEqual({ kind: 'ring', r: 64 });
  });
  it('Effekt-Frames Overclock (normal, Ultra), Alarm-Zeichen, Bauwolke: gueltig und verschieden', () => {
    for (const big of [false, true]) {
      const fs = Array.from({ length: OC_FRAMES }, (_, f) => overclockRaster(f, big).rows);
      fs.forEach((r) => { valid(r); expect(count(r)).toBeGreaterThan(30); });
      expect(new Set(fs.map(sig)).size).toBe(OC_FRAMES);
    }
    expect(count(overclockRaster(0, true).rows)).toBeGreaterThan(count(overclockRaster(0, false).rows));
    const al = Array.from({ length: ALARM_MARK_FRAMES }, (_, f) => alarmMarkRaster(f).rows);
    al.forEach(valid);
    expect(new Set(al.map(sig)).size).toBeGreaterThanOrEqual(3);
    const bp = Array.from({ length: BUILD_FRAMES }, (_, f) => buildPuffRaster(f).rows);
    bp.forEach((r) => { valid(r); expect(count(r)).toBeGreaterThan(8); });
    expect(new Set(bp.map(sig)).size).toBe(BUILD_FRAMES);
  });
});
