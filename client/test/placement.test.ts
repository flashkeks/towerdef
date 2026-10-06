import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { hasKey, t } from '../src/i18n/t';
import { HINTS_KEY, hintsOff, hintStep, setHintsOff, type KeyValueStore } from '../src/ui/hints-store';
import { Session } from '../src/game/session';
import { createSim, loadBrowserData, STAGE_ID, type Command } from '../src/sim';
import { failureToast, mismatchText, needOf, slotAt, slotFit, slotType } from '../src/view/placement';
import { reachMilli, statValues, upgradeEffect } from '../src/view/unit-info';

const data = loadBrowserData();
const defs = data.units.units;
const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
const catalog = sim.catalog();
const slots = sim.slots();

describe('Slot-Typen', () => {
  it('Karte: 13 Boden, 10 Huegel, 3 gross', () => {
    const n = { ground: 0, hill: 0, large: 0 };
    for (const s of slots) n[slotType(s)]++;
    expect(n).toEqual({ ground: 13, hill: 10, large: 3 });
  });
  it('needOf: Farm gross, Gunner Huegel, Striker Boden', () => {
    const by = Object.fromEntries(catalog.map((d) => [d.id, d]));
    expect(needOf(by.farm)).toBe('large');
    expect(needOf(by.gunner)).toBe('hill');
    expect(needOf(by.striker)).toBe('ground');
  });
});

describe('slotFit gegen die Sim', () => {
  it('stimmt fuer jede Unit auf jedem Slot mit den Sim-Gruenden ueberein', () => {
    for (const d of catalog) {
      for (const s of slots) {
        const fresh = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
        (fresh.state.players[0] as { coins: number }).coins = 1_000_000;
        const fit = slotFit(d, s, true);
        const r = fresh.apply(0, { type: 'place', unitId: d.id, slot: s.id });
        if (fit.ok) expect(r.ok, `${d.id}@${s.id}`).toBe(true);
        else expect(r, `${d.id}@${s.id}`).toEqual({ ok: false, reason: fit.reason === 'kind' ? 'slot-kind' : 'slot-size' });
      }
    }
  });
  it('belegt kommt zuerst', () => {
    expect(slotFit(catalog[0], slots[0], false)).toMatchObject({ ok: false, reason: 'occupied' });
  });
  it('Texte nennen Unit und Slot-Typ', () => {
    const gunner = catalog.find((d) => d.id === 'gunner')!;
    const fit = slotFit(gunner, slots[0], true);
    expect(fit.ok).toBe(false);
    if (!fit.ok) expect(mismatchText('Gunner', fit)).toBe('Gunner needs a hill slot.');
    const farm = catalog.find((d) => d.id === 'farm')!;
    const f2 = slotFit(farm, slots[0], true);
    if (!f2.ok) expect(mismatchText('Farm', f2)).toBe('Farm needs a large (2x2) slot.');
  });
  it('slotAt trifft Slots (auch gross) und sonst nichts', () => {
    const ss = [{ id: 1, x: 2, y: 3, size: 1 }, { id: 2, x: 15, y: 2.5, size: 2 }];
    expect(slotAt(ss, 2.3, 3.4)).toBe(1);
    expect(slotAt(ss, 15.9, 3.4)).toBe(2);
    expect(slotAt(ss, 5, 5)).toBeNull();
  });
});

describe('Fehler-Toasts', () => {
  const ctx = { name: 'Gunner', def: catalog.find((d) => d.id === 'gunner'), cost: 300, coins: 120, cap: 5, teamUnits: 60, teamSlots: 6 };
  const place: Command = { type: 'place', unitId: 'gunner', slot: 0 };
  it('jeder Platzier-Grund hat einen vorhandenen Schluessel und nennt Zahlen/Namen', () => {
    for (const reason of ['not-enough-coins', 'slot-kind', 'slot-size', 'slot-occupied', 'cap-reached', 'team-limit', 'team-slots']) {
      const spec = failureToast(place, reason, ctx);
      expect(hasKey(spec.key), `${reason} -> ${spec.key}`).toBe(true);
    }
    expect(t(failureToast(place, 'not-enough-coins', ctx).key, failureToast(place, 'not-enough-coins', ctx).params)).toBe('Not enough coins: Gunner costs 300, you have 120.');
    expect(failureToast(place, 'slot-kind', ctx).key).toBe('toast.need.hill');
    expect(failureToast(place, 'cap-reached', ctx).params).toMatchObject({ cap: 5 });
  });
  it('Upgrade ohne Muenzen nennt Kosten', () => {
    const spec = failureToast({ type: 'upgrade', entityId: 1 }, 'not-enough-coins', { ...ctx, cost: 450 });
    expect(t(spec.key, spec.params)).toBe('Not enough coins: upgrade costs 450, you have 120.');
  });
  it('unbekannter Grund -> Schluessel error.X (Session faellt dann auf generic)', () => {
    expect(failureToast({ type: 'skipWave' }, 'no-next-wave', ctx).key).toBe('error.no-next-wave');
  });
  it('Session: Toast mit Grund und Zeigerposition; Klicks ins Leere reagieren immer', () => {
    const s = new Session('normal', 1);
    const tk = (): string | undefined => s.toast?.key;
    s.pointer = { x: 100, y: 80 };
    (s.sim.state.players[0] as { coins: number }).coins = 10;
    s.choosePlacing('striker');
    s.clickSlot(0);
    expect(s.toast?.key).toBe('toast.poor');
    expect(s.toast?.at).toEqual({ x: 100, y: 80 });
    (s.sim.state.players[0] as { coins: number }).coins = 5000;
    s.choosePlacing('gunner');
    s.clickSlot(0);
    expect(s.toast?.key).toBe('toast.need.hill');
    s.toast = null;
    s.clickEmpty(); // Platzieren aktiv
    expect(tk()).toBe('toast.hint.not-slot');
    s.cancel();
    s.toast = null;
    s.clickEmpty(); // nichts gewaehlt
    expect(tk()).toBe('toast.hint.empty');
    s.toast = null;
    s.clickSlot(1); // freier Slot ohne Unit-Wahl
    expect(tk()).toBe('toast.hint.pick-unit');
    s.choosePlacing('striker');
    s.clickSlot(1);
    s.clickSlot(1);
    expect(s.selectedUnit).not.toBeNull();
    s.clickEmpty(); // Auswahl aufheben
    expect(s.selectedUnit).toBeNull();
    s.choosePlacing('striker');
    s.clickSlot(1); // belegt -> waehlt die Unit
    expect(s.selectedUnit).not.toBeNull();
  });
  it('alle neuen Texte stehen in en.ts', () => {
    for (const k of ['toast.need.ground', 'toast.need.hill', 'toast.need.large', 'toast.occupied', 'toast.poor', 'toast.cap', 'hint.1', 'hint.2', 'hint.3', 'help.title']) expect(k in en, k).toBe(true);
  });
});

describe('Ersthinweise', () => {
  const mem = (): KeyValueStore & { map: Map<string, string> } => {
    const map = new Map<string, string>();
    return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
  };
  it('Standard: an; nach Abschalten aus; wieder an', () => {
    const st = mem();
    expect(hintsOff(st)).toBe(false);
    setHintsOff(true, st);
    expect(st.map.get(HINTS_KEY)).toBe('1');
    expect(hintsOff(st)).toBe(true);
    setHintsOff(false, st);
    expect(hintsOff(st)).toBe(false);
  });
  it('kaputter oder fehlender Speicher wirft nie', () => {
    const bad: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(hintsOff(bad)).toBe(false);
    expect(() => setHintsOff(true, bad)).not.toThrow();
    expect(hintsOff(null)).toBe(false);
    expect(() => setHintsOff(true, null)).not.toThrow();
  });
  it('Schritte: Unit waehlen, Slot klicken, Welle starten, fertig', () => {
    expect(hintStep({ phase: 'prep', placing: false, units: 0 })).toBe(1);
    expect(hintStep({ phase: 'prep', placing: true, units: 0 })).toBe(2);
    expect(hintStep({ phase: 'prep', placing: false, units: 1 })).toBe(3);
    expect(hintStep({ phase: 'prep', placing: true, units: 1 })).toBe(3);
    expect(hintStep({ phase: 'wave', placing: false, units: 0 })).toBe('done');
  });
});

describe('Unit-Anzeige', () => {
  it('Upgrade-Wirkung alt -> neu, leer auf Max', () => {
    const striker = catalog.find((d) => d.id === 'striker')!;
    const rows = upgradeEffect(striker, 0);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.from).not.toBe(r.to);
    expect(rows.map((r) => r.key)).toContain('stat.damage');
    expect(upgradeEffect(striker, striker.maxLevel)).toEqual([]);
  });
  it('Reichweite: Angreifer Level-Wert, Banner Aura, Farm keine', () => {
    const by = Object.fromEntries(catalog.map((d) => [d.id, d]));
    expect(reachMilli(by.striker, 0)).toBe(by.striker.levels[0].rangeMilli);
    expect(reachMilli(by.banner, 0)).toBe(by.banner.aura!.radiusMilli);
    expect(reachMilli(by.farm, 0)).toBe(0);
    expect(statValues(by.farm, 0)[0].key).toBe('stat.yield');
  });
  it('alle Units haben anzeigbare Werte auf jeder Stufe', () => {
    for (const d of defs) {
      const def = catalog.find((c) => c.id === d.id)!;
      for (let l = 0; l <= def.maxLevel; l++) expect(statValues(def, l).length, `${d.id}@${l}`).toBeGreaterThan(0);
    }
  });
});
