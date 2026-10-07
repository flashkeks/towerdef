import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '../src/i18n/en';
import { parseMarkdown } from '../src/ui/markdown';
import { formatDuration, MvpTracker } from '../src/ui/mvp';
import { DEFAULT_SETTINGS, getSettings, HINTS_KEY, resetHints, resetSettingsCache, sanitize, setSetting, SETTINGS_KEY, TEAM_KEY } from '../src/ui/settings';
import { DEFAULT_TEAM, isComplete, loadTeam, normalizeTeam, saveTeam, TEAM_SIZE, toggleUnit } from '../src/ui/team';
import { loadBrowserData } from '../src/sim';

const IDS = ['striker', 'gunner', 'blaster', 'banner', 'farm', 'lancer', 'frost', 'titan'];

function fakeStorage(init: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as Storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetSettingsCache();
});

describe('Einstellungen', () => {
  it('ohne localStorage: Standardwerte, Setzen wirkt in der Sitzung', () => {
    resetSettingsCache();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    setSetting('master', 0.3);
    expect(getSettings().master).toBe(0.3);
    expect(() => resetHints()).not.toThrow();
  });
  it('kaputtes JSON faellt auf Standard', () => {
    vi.stubGlobal('localStorage', fakeStorage({ [SETTINGS_KEY]: '{nope' }));
    resetSettingsCache();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });
  it('falsche Typen und Bereiche werden bereinigt', () => {
    const s = sanitize({ master: 7, sfx: 'laut', music: -1, damageNumbers: 'ja', defaultSpeed: 9 });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, master: 1, music: 0 });
    expect(sanitize(null)).toEqual(DEFAULT_SETTINGS);
  });
  it('speichert und liest zurueck', () => {
    const st = fakeStorage();
    vi.stubGlobal('localStorage', st);
    resetSettingsCache();
    setSetting('defaultSpeed', 3);
    setSetting('damageNumbers', false);
    resetSettingsCache();
    expect(getSettings()).toMatchObject({ defaultSpeed: 3, damageNumbers: false });
    expect(st.getItem(SETTINGS_KEY)).toContain('"defaultSpeed":3');
  });
  it('werfender Speicher bricht nichts', () => {
    const boom = () => {
      throw new Error('gesperrt');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
    resetSettingsCache();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(() => setSetting('sfx', 0.5)).not.toThrow();
    expect(() => resetHints()).not.toThrow();
    expect(getSettings().sfx).toBe(0.5);
  });
  it('Hinweise zuruecksetzen loescht den Hinweis-Schluessel', () => {
    const st = fakeStorage({ [HINTS_KEY]: '{"seen":true}' });
    vi.stubGlobal('localStorage', st);
    resetHints();
    expect(st.getItem(HINTS_KEY)).toBeNull();
  });
});

describe('Team-Auswahl', () => {
  it('Standardteam hat genau 6 gueltige Units', () => {
    expect(DEFAULT_TEAM).toHaveLength(TEAM_SIZE);
    expect(DEFAULT_TEAM.every((id) => IDS.includes(id))).toBe(true);
    expect(normalizeTeam(undefined, IDS)).toEqual([...DEFAULT_TEAM]);
  });
  it('Standardteam passt zu den Sim-Daten', () => {
    const ids = loadBrowserData().units.units.map((u) => u.id);
    expect(ids).toHaveLength(8);
    expect(normalizeTeam(null, ids)).toHaveLength(6);
  });
  it('toggle: hinzufuegen bis 6, dann ignoriert, abwaehlen geht immer', () => {
    let team: string[] = [];
    for (const id of IDS) team = toggleUnit(team, id);
    expect(team).toEqual(IDS.slice(0, 6));
    expect(isComplete(team)).toBe(true);
    expect(toggleUnit(team, 'titan')).toEqual(team);
    expect(toggleUnit(team, 'striker')).toHaveLength(5);
    expect(isComplete(toggleUnit(team, 'striker'))).toBe(false);
  });
  it('normalize verwirft Unbekannte, Doppelte und falsche Groessen', () => {
    expect(normalizeTeam(['striker', 'striker', 'x', 'gunner', 'blaster', 'banner', 'farm', 'lancer'], IDS)).toEqual(['striker', 'gunner', 'blaster', 'banner', 'farm', 'lancer']);
    expect(normalizeTeam(['striker', 'gunner'], IDS)).toEqual([...DEFAULT_TEAM]);
    expect(normalizeTeam('kaputt', IDS)).toEqual([...DEFAULT_TEAM]);
  });
  it('letzte Wahl wird gemerkt', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    const pick = ['farm', 'lancer', 'frost', 'titan', 'striker', 'gunner'];
    saveTeam(pick);
    expect(loadTeam(IDS)).toEqual(pick);
    vi.stubGlobal('localStorage', fakeStorage({ [TEAM_KEY]: '[1,2' }));
    expect(loadTeam(IDS)).toEqual([...DEFAULT_TEAM]);
  });
});

describe('MVP', () => {
  const place = (unitId: number, unit: string) => ({ type: 'place', tick: 1, player: 0, unitId, unit, x: unitId * 1000, y: 3000, cost: 1 }) as const;
  const dmg = (unitId: number, amount: number) => ({ type: 'damage', tick: 2, unitId, owner: 0, amount }) as const;
  it('keiner ohne Schaden', () => {
    const m = new MvpTracker();
    m.consume([place(1, 'striker')]);
    expect(m.mvp()).toBeNull();
  });
  it('summiert ueber Ereignis-Stapel, hoechster Schaden gewinnt', () => {
    const m = new MvpTracker();
    m.consume([place(1, 'striker'), place(2, 'gunner'), dmg(1, 100), dmg(2, 60)]);
    m.consume([dmg(2, 70), dmg(1, 20)]);
    expect(m.mvp()).toEqual({ unit: 'gunner', entityId: 2, damage: 130 });
  });
  it('verkaufte Unit zaehlt weiter; Gleichstand: kleinere Id', () => {
    const m = new MvpTracker();
    m.consume([place(5, 'blaster'), place(3, 'frost'), dmg(5, 50), dmg(3, 50), { type: 'sell', tick: 3, player: 0, unitId: 5, refund: 1 }]);
    expect(m.mvp()?.unit).toBe('frost');
  });
  it('Dauer m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(20 * 125)).toBe('2:05');
  });
});

describe('Markdown und Strings', () => {
  it('Ueberschrift, Tabelle, Liste, Absatz', () => {
    const b = parseMarkdown('# A\n\ntext\nweiter\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\n- eins\n- zwei\n');
    expect(b.map((x) => x.kind)).toEqual(['h', 'p', 'table', 'ul']);
    expect(b[1]).toEqual({ kind: 'p', text: 'text weiter' });
    expect(b[2]).toEqual({ kind: 'table', head: ['x', 'y'], rows: [['1', '2']] });
  });
  it('jede Unit hat Rolle und Kurzinfo', () => {
    for (const id of IDS) {
      expect(en).toHaveProperty(`role.${id}`);
      expect(en).toHaveProperty(`team.info.${id}`);
    }
  });
});
