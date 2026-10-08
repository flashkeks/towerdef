import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/audio/recipes';
import { RateLimiter, soundsFor } from '../src/audio/logic';
import { ELEMENT_SHOT_SOUNDS, shotGain, shotSoundFor } from '../src/audio/logic-match';
import { MATCH_RECIPES } from '../src/audio/recipes-match';
import { hitStyle, type HitStyle } from '../src/view/feel';
import {
  attackLook,
  detailFactor,
  dropIn,
  ELEMENT_LOOKS,
  ENEMY_LOOKS,
  enemyLook,
  guessCrit,
  idleBob,
  lookOf,
  pipCount,
  projectileShape,
  rarityLook,
  turnToward,
  unitLook,
  wrapAngle,
  type LookKey,
} from '../src/view/look';
import { cutInModel } from '../src/ui/cutin';
import { DEFAULT_SETTINGS, sanitize } from '../src/ui/settings';
import { createSim, loadBrowserData, STAGE_ID } from '../src/sim';
import type { SimEvent } from '../src/sim';

const data = loadBrowserData();
const defs = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data }).catalog();
const STYLES: HitStyle[] = ['slash', 'tracer', 'shell', 'bolt', 'blast', 'cone', 'line', 'full'];

describe('Aussehen: Elemente und Seltenheit', () => {
  it('jedes Element hat Farben, Splitterart und Symbol', () => {
    for (const [k, l] of Object.entries(ELEMENT_LOOKS)) {
      expect(l.key).toBe(k);
      expect(l.main).toBeGreaterThan(0);
      expect(l.light).toBeGreaterThan(0);
      expect(l.particle.length).toBeGreaterThan(0);
      expect(l.icon.length).toBeGreaterThan(0);
    }
  });
  it('lookOf: bekannte Schluessel, sonst physisch', () => {
    expect(lookOf('fire').key).toBe('fire');
    expect(lookOf('quatsch').key).toBe('physical');
    expect(lookOf(undefined).key).toBe('physical');
  });
  it('alle Units der Daten haben ein bestimmendes Element (erstes Element, sonst Schadensart)', () => {
    for (const d of defs) {
      const l = unitLook(d);
      expect(ELEMENT_LOOKS[l.key as LookKey], d.id).toBeDefined();
      if (d.elements[0] && d.elements[0] in ELEMENT_LOOKS) expect(l.key).toBe(d.elements[0]);
    }
  });
  it('Seltenheits-Ringe: breiter und lebendiger nach oben, unbekannt = Rare', () => {
    expect(rarityLook('Mythic').live).toBe(true);
    expect(rarityLook('Rare').live).toBe(false);
    expect(rarityLook('Secret').width).toBeGreaterThanOrEqual(rarityLook('Rare').width);
    expect(rarityLook('Unbekannt')).toBe(rarityLook('Rare'));
    for (const d of defs) expect(rarityLook(d.rarity).a, d.id).toBeGreaterThan(0);
  });
});

describe('Aussehen: Gegner', () => {
  it('jeder Gegner-Typ der Daten hat eine eigene Figur, der Boss traegt ein Namensbanner', () => {
    const types = (data.enemies as { archetypes: { id: string }[] }).archetypes.map((a) => a.id);
    expect(types.length).toBeGreaterThanOrEqual(8);
    for (const id of types) expect(ENEMY_LOOKS[id], id).toBeDefined();
    expect(enemyLook('boss').banner).toBe(true);
    expect(enemyLook('grunt').banner).toBe(false);
    expect(enemyLook('boss').radius).toBeGreaterThan(enemyLook('elite').radius);
    expect(enemyLook('elite').radius).toBeGreaterThan(enemyLook('grunt').radius);
    expect(enemyLook('unbekannt')).toBe(ENEMY_LOOKS.grunt);
  });
  it('Gegner-Typen unterscheiden sich in der Form', () => {
    const shapes = new Set(Object.values(ENEMY_LOOKS).map((l) => l.shape));
    expect(shapes.size).toBe(Object.keys(ENEMY_LOOKS).length);
  });
});

describe('Angriffs-Grafik je Form x Element', () => {
  it('jede Form x jedes Element ergibt eine Grafik mit Form und Splittern', () => {
    for (const style of STYLES) {
      for (const key of Object.keys(ELEMENT_LOOKS)) {
        const l = attackLook(style, { elements: key === 'physical' || key === 'magic' || key === 'true' ? [] : [key], damageType: key === 'magic' ? 'magic' : key === 'true' ? 'true' : 'physical' });
        expect(l.shape, `${style}/${key}`).toBeTruthy();
        expect(l.particles).toBeGreaterThan(0);
        expect(l.element.key).toBe(key);
      }
    }
  });
  it('Formen: Hieb = Bogen, Kegel = Faecher, Linie = Strahl, Kreis/Bahn = Welle', () => {
    const phys = { elements: [], damageType: 'physical' as const };
    expect(attackLook('slash', phys).shape).toBe('arc');
    expect(attackLook('cone', phys).shape).toBe('fan');
    expect(attackLook('line', phys).shape).toBe('beam');
    expect(attackLook('blast', phys).shape).toBe('wave');
    expect(attackLook('full', phys).shape).toBe('wave');
    expect(attackLook('tracer', phys).shape).toBe('bullet');
  });
  it('Geschosse nach Element: Blitz zackig, Eis Splitter, Wind Sichel, Feuer/Wasser Kugel, Rose Blaetter', () => {
    expect(projectileShape('lightning', false)).toBe('bolt');
    expect(projectileShape('ice', false)).toBe('shard');
    expect(projectileShape('air', false)).toBe('blade');
    expect(projectileShape('fire', false)).toBe('orb');
    expect(projectileShape('water', false)).toBe('orb');
    expect(projectileShape('rose', false)).toBe('petal');
    expect(projectileShape('physical', false)).toBe('bullet');
    expect(projectileShape('lightning', true)).toBe('bolt');
  });
  it('alle Units: Stil aus den Daten, Grafik ohne Ausnahme, Flaechen sind schwer', () => {
    let n = 0;
    for (const d of defs) {
      for (let lv = 0; lv < d.levels.length; lv++) {
        const s = hitStyle(d, lv);
        if (!s) continue;
        const l = attackLook(s, d);
        expect(l.shape, d.id).toBeTruthy();
        n++;
      }
    }
    expect(n).toBeGreaterThan(1000);
    expect(attackLook('blast', { elements: [], damageType: 'physical' }).heavy).toBe(true);
    expect(attackLook('slash', { elements: [], damageType: 'physical' }).heavy).toBe(false);
  });
});

describe('Krit-Schaetzung, Deckel, Bewegung', () => {
  it('Krit: nur mit Crit-Chance und deutlich ueber dem Grundschaden', () => {
    expect(guessCrit(1000, 1000, 0, 15000)).toBe(false);
    expect(guessCrit(1000, 1000, 5000, 15000)).toBe(false);
    expect(guessCrit(1500, 1000, 5000, 15000)).toBe(true);
    expect(guessCrit(1300, 1000, 5000, 15000)).toBe(true);
    expect(guessCrit(1100, 1000, 5000, 15000)).toBe(false);
    expect(guessCrit(5000, 0, 5000, 15000)).toBe(false);
    expect(guessCrit(2000, 1000, 5000, 10000)).toBe(false);
  });
  it('Detail-Faktor: voll bei Ruhe, faellt bei Auslastung, nie unter 0,25', () => {
    expect(detailFactor(5, 90, 10, 260)).toBe(1);
    expect(detailFactor(90, 90, 100, 260)).toBeLessThan(0.5);
    expect(detailFactor(90, 90, 260, 260)).toBeLessThan(0.3);
    expect(detailFactor(900, 90, 2600, 260)).toBe(0.25);
    expect(detailFactor(0, 0, 0, 0)).toBe(1);
    let prev = 1;
    for (let l = 0; l <= 90; l += 10) {
      const f = detailFactor(l, 90, 0, 260);
      expect(f).toBeLessThanOrEqual(prev);
      prev = f;
    }
  });
  it('Pips: hoechstens acht, nie negativ', () => {
    expect(pipCount(0)).toBe(0);
    expect(pipCount(3)).toBe(3);
    expect(pipCount(12)).toBe(8);
    expect(pipCount(-2)).toBe(0);
  });
  it('Blickrichtung dreht auf dem kuerzesten Weg und kommt an', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
    expect(turnToward(0, 1, 0.3)).toBeCloseTo(0.3, 5);
    expect(turnToward(0, 1, 5)).toBe(1);
    // ueber die -PI/PI-Naht: von 3 nach -3 ist kurz (positiv weiter), nicht lang
    const r = turnToward(3, -3, 0.2);
    expect(Math.abs(wrapAngle(r - 3))).toBeCloseTo(0.2, 5);
  });
  it('Wippen ist klein und je Unit versetzt; Aufsetzen endet ruhig', () => {
    for (let t = 0; t < 5000; t += 250) expect(Math.abs(idleBob(t, 3))).toBeLessThanOrEqual(0.025 + 1e-9);
    expect(idleBob(400, 1)).not.toBe(idleBob(400, 2));
    const start = dropIn(0);
    const end = dropIn(1);
    expect(start.lift).toBeGreaterThan(0.3);
    expect(start.scale).toBeGreaterThan(1.3);
    expect(end.scale).toBe(1);
    expect(end.lift).toBe(0);
    expect(end.squash).toBeCloseTo(1, 6);
    expect(dropIn(0.8).squash).toBeLessThan(1);
    expect(dropIn(-1).scale).toBe(dropIn(0).scale);
  });
});

describe('Match-Ton', () => {
  it('jedes Element hat einen Schuss-Klang mit gueltigem Rezept; jeder Klang des Matches ist abspielbar', () => {
    for (const [el, id] of Object.entries(ELEMENT_SHOT_SOUNDS)) {
      expect(el in ELEMENT_LOOKS, el).toBe(true);
      expect(RECIPES[id], id).toBeDefined();
    }
    for (const [id, voices] of Object.entries(MATCH_RECIPES)) {
      expect(RECIPES[id as keyof typeof RECIPES], id).toBe(voices);
      for (const v of voices) {
        expect(v.dur, id).toBeGreaterThan(0.02);
        expect(v.dur, id).toBeLessThan(2);
        expect(v.vol, id).toBeGreaterThan(0);
        expect(v.vol, id).toBeLessThanOrEqual(0.5);
        expect(v.f0, id).toBeGreaterThan(20);
        expect(v.f1, id).toBeGreaterThan(20);
      }
    }
  });
  it('Einzelziel mit Element klingt nach dem Element, physisch und Flaeche nach dem Stil', () => {
    expect(shotSoundFor('tracer', 'fire')).toBe('hit.fire');
    expect(shotSoundFor('slash', 'ice')).toBe('hit.ice');
    expect(shotSoundFor('tracer', 'physical')).toBe('hit.tracer');
    expect(shotSoundFor('blast', 'fire')).toBe('hit.blast');
    expect(shotSoundFor('full', 'light')).toBe('hit.blast');
    expect(shotSoundFor('cone', 'ice')).toBe('hit.cone');
    expect(shotSoundFor('line', undefined)).toBe('hit.line');
    for (const s of STYLES) for (const el of Object.keys(ELEMENT_LOOKS)) expect(RECIPES[shotSoundFor(s, el)], `${s}/${el}`).toBeDefined();
  });
  it('Elementklaenge sind leiser als der Stilklang, alle Schuesse teilen den Treffer-Topf', () => {
    expect(shotGain('tracer', 'fire')).toBeLessThan(shotGain('tracer', 'physical'));
    const lim = new RateLimiter();
    expect(lim.allow('hit.fire', 0)).toBe(true);
    expect(lim.allow('hit.water', 10)).toBe(false);
    expect(lim.allow('hit.water', 200)).toBe(true);
  });
  it('Faehigkeits-Ansage hat einen eigenen Klang, automatische bleiben stumm', () => {
    const ev = (e: Record<string, unknown>): SimEvent => e as unknown as SimEvent;
    expect(soundsFor(ev({ type: 'ability', unitId: 1, owner: 0, ability: 'a', name: 'X', auto: false }))).toEqual(['cutin']);
    expect(soundsFor(ev({ type: 'ability', unitId: 1, owner: 0, ability: 'a', name: 'X', auto: true }))).toEqual([]);
    const lim = new RateLimiter();
    expect(lim.allow('cutin', 0)).toBe(true);
    expect(lim.allow('cutin', 100)).toBe(false);
  });
});

describe('Faehigkeits-Ansage und Einstellung', () => {
  it('Ansage nur fuer ausgeloeste Faehigkeiten, mit Element-Farben der Unit', () => {
    const gojo = defs.find((d) => d.id === 'gojo_evolved')!;
    const units = [{ id: 7, defId: gojo.id }];
    const m = cutInModel(units, defs, { unitId: 7, name: 'Domain Expansion', auto: false });
    expect(m).not.toBeNull();
    expect(m!.ability).toBe('Domain Expansion');
    expect(m!.unitId).toBe('gojo_evolved');
    expect(m!.main).toMatch(/^#[0-9a-f]{6}$/);
    expect(cutInModel(units, defs, { unitId: 7, name: 'x', auto: true })).toBeNull();
    expect(cutInModel(units, defs, { unitId: 99, name: 'x', auto: false })).toBeNull();
  });
  it('Bildschirmruckeln ist an und abschaltbar, kaputte Werte fallen auf den Standard', () => {
    expect(DEFAULT_SETTINGS.screenShake).toBe(true);
    expect(sanitize({ screenShake: false }).screenShake).toBe(false);
    expect(sanitize({ screenShake: 'nein' }).screenShake).toBe(true);
    expect(sanitize(null).screenShake).toBe(true);
  });
});
