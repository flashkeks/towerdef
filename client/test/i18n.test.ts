import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { hasKey, t } from '../src/i18n/t';
import { loadBrowserData, STAGE_ID } from '../src/sim';

const data = loadBrowserData();

describe('Strings vollstaendig', () => {
  it('Spieltitel ist Duskwardens', () => expect(t('game.title')).toBe('Duskwardens'));

  it('jede Unit hat Namen und Kuerzel', () => {
    for (const u of data.units.units) {
      expect(hasKey(`unit.${u.id}.name`), u.id).toBe(true);
      expect(hasKey(`unit.${u.id}.abbr`), u.id).toBe(true);
      expect(hasKey(`rarity.${u.rarity}`), u.id).toBe(true);
      expect(hasKey(`placement.${u.placement}`), u.id).toBe(true);
    }
  });
  it('jeder Gegnertyp hat einen Namen', () => {
    for (const a of data.enemies.archetypes) expect(hasKey(`enemy.${a.id}.name`), a.id).toBe(true);
  });
  it('jede Risikokarte hat Name und Text', () => {
    for (const c of (data.cards?.cards ?? [])) {
      expect(hasKey(`card.${c.id}.name`), c.id).toBe(true);
      expect(hasKey(`card.${c.id}.text`), c.id).toBe(true);
    }
  });
  it('Boss-Kits: Name, Phasen, Faehigkeiten', () => {
    for (const k of (data.bosses?.kits ?? [])) {
      expect(hasKey(`boss.kit.${k.id}`), k.id).toBe(true);
      for (const p of k.phases) expect(hasKey(`boss.phase.${p.id}`), `${k.id}/${p.id}`).toBe(true);
      for (const a of k.abilities) expect(hasKey(`boss.ability.${a.id}`), `${k.id}/${a.id}`).toBe(true);
    }
  });
  it('Stufen und Zielmodi haben Namen', () => {
    for (const d of ['normal', 'hard', 'nightmare']) {
      expect(hasKey(`difficulty.${d}`)).toBe(true);
      expect(hasKey(`difficulty.${d}.desc`)).toBe(true);
    }
    for (const m of ['first', 'last', 'close', 'strongest']) expect(hasKey(`targeting.${m}`)).toBe(true);
  });
  it('Modifier der Stage und der Stufen haben Namen', () => {
    for (const w of data.stages[STAGE_ID].waves) for (const g of w.groups) for (const m of g.modifiers ?? []) expect(hasKey(`modifier.${m.split(':')[0]}`), m).toBe(true);
    for (const d of Object.values(data.difficulties)) if (typeof d === 'object') for (const m of d.modifiers.pool) expect(hasKey(`modifier.${m.id.split(':')[0]}`), m.id).toBe(true);
  });
  it('Platzhalter werden ersetzt', () => expect(t('gate.text', { title: t('game.title') })).toContain('Duskwardens needs'));
  it('Texte sind nicht leer', () => {
    for (const [k, v] of Object.entries(en)) expect(v.length, k).toBeGreaterThan(0);
  });
});

describe('Name nicht hart verdrahtet', () => {
  it('"Duskwardens" steht in src/ nur in en.ts', () => {
    const root = new URL('../src/', import.meta.url).pathname;
    const files: string[] = [];
    const walk = (d: string): void => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else files.push(p);
      }
    };
    walk(root);
    const offenders = files.filter((f) => !f.endsWith('i18n/en.ts') && /duskwardens/i.test(readFileSync(f, 'utf8')));
    // __duskwardens (Debug-Hook) ist ein Bezeichner, kein sichtbarer Text
    expect(offenders.filter((f) => !f.endsWith('main.ts'))).toEqual([]);
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(/duskwardens/i.test(html)).toBe(false);
  });
});
