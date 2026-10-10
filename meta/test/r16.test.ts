/**
 * Runde 16 (Paket T): Riverkeeper/Tinker/Bellringer freischalten, Helden (Auswahl, Level oder Embers), Migration, sechs neue Wissensknoten.
 * 10.10.2026, Max: „… auch mehr Helden“ (Bram Level 10 oder 1.500 Embers, Sela Level 15 oder 2.500 Embers).
 */
import { describe, expect, it } from 'vitest';
import { createGame } from '../../sim/src/index';
import {
  HEROES, KNOWLEDGE, LEVEL_UNLOCKS, applyMatch, buyHero, buyNode, exportProfile, heroLock, heroOwned, heroStore, importProfile, isTowerUnlocked, loadProfile, matchOptions,
  newProfile, nodeById, selectHero, unlockEverything, unlockLevel, xpForLevel, activeHero, type MatchResult, type Profile,
} from '../src/index';

const withLevel = (n: number, p: Profile = newProfile()): Profile => ({ ...p, playerXp: xpForLevel(n) });
const know = (p: Profile, ...ids: string[]): Profile => ({ ...p, knowledge: ids });
const res = (o: Partial<MatchResult> = {}): MatchResult => ({ matchId: 'm1', map: 'meadow', difficulty: 'medium', won: true, roundsCleared: 20, livesLost: 3, pops: { ranger: 400 }, ...o });

describe('Freischaltung der Türme', () => {
  it('Riverkeeper L4, Tinker L11, Bellringer L13; bestehende Stufen unverändert', () => {
    expect(unlockLevel('riverkeeper')).toBe(4);
    expect(unlockLevel('tinker')).toBe(11);
    expect(unlockLevel('bellringer')).toBe(13);
    expect([unlockLevel('bombardier'), unlockLevel('frostcaller'), unlockLevel('longshot'), unlockLevel('market'), unlockLevel('thornweaver'), unlockLevel('alchemist')]).toEqual([2, 4, 5, 6, 7, 9]);
    expect(isTowerUnlocked(withLevel(3), 'riverkeeper')).toBe(false);
    expect(isTowerUnlocked(withLevel(4), 'riverkeeper')).toBe(true);
    expect(isTowerUnlocked(withLevel(10), 'tinker')).toBe(false);
    expect(isTowerUnlocked(withLevel(11), 'tinker')).toBe(true);
    expect(isTowerUnlocked(withLevel(12), 'bellringer')).toBe(false);
    expect(isTowerUnlocked(withLevel(13), 'bellringer')).toBe(true);
    expect(matchOptions(withLevel(13)).unlocks.towers).toEqual(expect.arrayContaining(['riverkeeper', 'tinker', 'bellringer']));
    expect(LEVEL_UNLOCKS.filter((u) => u.kind === 'hero').map((u) => [u.id, u.level])).toEqual([['wren', 3], ['bram', 10], ['sela', 15]]);
  });

  it('Profil aus Runde 14/15 ohne die neuen Felder lädt ohne Reset und bekommt Vorgaben', () => {
    const old = JSON.parse(JSON.stringify({ ...withLevel(12), embers: 77, knowledge: ['head-start'] }));
    for (const k of ['towerXp', 'towerTiers']) { delete old[k].riverkeeper; delete old[k].bellringer; delete old[k].tinker; }
    delete old.heroes;
    delete old.selectedHero;
    old.towerXp.ranger = 333;
    const r = loadProfile(old);
    expect(r.reset).toBe(false);
    expect(r.profile.schema).toBe(11);
    expect(r.profile.towerXp.ranger).toBe(333);
    expect(r.profile.towerXp.riverkeeper).toBe(100);
    expect(r.profile.towerTiers.tinker).toEqual([0, 0, 0]);
    expect(r.profile.heroes).toEqual(['wren']);
    expect(r.profile.selectedHero).toBe('wren');
    expect(r.profile.embers).toBe(77);
    expect(r.profile.knowledge).toEqual(['head-start']);
  });

  it('Match-Ergebnis ohne die neuen Typen lässt sie unverändert; mit ihnen landen Stufen und XP im Profil', () => {
    const p = withLevel(14);
    const r = applyMatch(p, res());
    expect(r.profile.towerTiers.riverkeeper).toEqual([0, 0, 0]);
    const r2 = applyMatch(p, res({
      matchId: 'm2',
      towerTiers: { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], riverkeeper: [2, 0, 1], bellringer: [0, 3, 0], tinker: [1, 1, 1] },
      towerXp: { ranger: 100, bombardier: 100, frostcaller: 100, riverkeeper: 40, bellringer: 0, tinker: 9 },
      pops: { riverkeeper: 50, tinker: 10, bram: 5, sela: 2 },
    }));
    expect(r2.profile.towerTiers.riverkeeper).toEqual([2, 0, 1]);
    expect(r2.profile.towerTiers.bellringer).toEqual([0, 3, 0]);
    expect(r2.profile.towerXp.tinker).toBe(9);
  });
});

describe('Helden: Besitz und Auswahl', () => {
  it('Daten: Wren ab 3, Bram ab 10 oder 1.500 Embers, Sela ab 15 oder 2.500 Embers', () => {
    expect(HEROES.map((h) => [h.id, h.unlockLevel, h.embers])).toEqual([['wren', 3, null], ['bram', 10, 1500], ['sela', 15, 2500]]);
  });

  it('neues Profil: heroes [wren], selectedHero wren; Wren erst ab Level 3 besessen', () => {
    const p = newProfile();
    expect(p.heroes).toEqual(['wren']);
    expect(p.selectedHero).toBe('wren');
    expect(heroOwned(p, 'wren')).toBe(false);
    expect(heroOwned(withLevel(3), 'wren')).toBe(true);
    expect(matchOptions(p).unlocks.towers).not.toContain('wren');
    expect(matchOptions(withLevel(3)).unlocks.towers).toContain('wren');
  });

  it('Level öffnet Bram (10) und Sela (15) ohne Kauf', () => {
    expect(heroOwned(withLevel(9), 'bram')).toBe(false);
    expect(heroOwned(withLevel(10), 'bram')).toBe(true);
    expect(heroOwned(withLevel(14), 'sela')).toBe(false);
    expect(heroOwned(withLevel(15), 'sela')).toBe(true);
    expect(isTowerUnlocked(withLevel(10), 'bram')).toBe(true);
  });

  it('heroLock: Text, Preis und canBuy je nach Embers', () => {
    const p: Profile = { ...withLevel(5), embers: 1499 };
    expect(heroLock(p, 'bram')).toMatchObject({ owned: false, byLevel: false, purchased: false, unlockLevel: 10, embers: 1500, canBuy: false, text: 'Reach level 10 or buy for 1,500 Embers.' });
    expect(heroLock({ ...p, embers: 1500 }, 'bram').canBuy).toBe(true);
    expect(heroLock(p, 'sela').text).toBe('Reach level 15 or buy for 2,500 Embers.');
    expect(heroLock(p, 'wren')).toMatchObject({ owned: true, text: '', embers: null, canBuy: false });
    expect(heroLock(withLevel(1), 'wren').text).toBe('Reach level 3.');
    expect(heroLock(withLevel(10), 'bram')).toMatchObject({ owned: true, byLevel: true, text: '', canBuy: false });
  });

  it('buyHero: zieht Embers ab, Held bleibt dauerhaft; Fehler mit Code', () => {
    const p: Profile = { ...newProfile(), embers: 1600 };
    const r = buyHero(p, 'bram');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cost).toBe(1500);
    expect(r.profile.embers).toBe(100);
    expect(r.profile.heroes).toEqual(['wren', 'bram']);
    expect(heroOwned(r.profile, 'bram')).toBe(true);
    expect(heroLock(r.profile, 'bram')).toMatchObject({ owned: true, purchased: true, byLevel: false });
    // kein zweites Mal, nicht ohne Embers, Wren nicht kaufbar
    expect(buyHero(r.profile, 'bram')).toMatchObject({ ok: false, code: 'owned' });
    expect(buyHero(p, 'sela')).toMatchObject({ ok: false, code: 'not-enough-embers', message: 'Needs 2,500 Embers.' });
    expect(buyHero(p, 'wren')).toMatchObject({ ok: false, code: 'not-for-sale' });
    expect(buyHero(p, 'nobody' as never)).toMatchObject({ ok: false, code: 'unknown-hero' });
    // Eingabeprofil bleibt unverändert
    expect(p.embers).toBe(1600);
    expect(p.heroes).toEqual(['wren']);
  });

  it('bereits per Level offener Held: kein Kauf nötig (owned)', () => {
    expect(buyHero({ ...withLevel(10), embers: 9999 }, 'bram')).toMatchObject({ ok: false, code: 'owned' });
  });

  it('selectHero und activeHero: nur besessene Helden', () => {
    const p: Profile = { ...withLevel(3), embers: 2000 };
    expect(selectHero(p, 'bram')).toMatchObject({ ok: false, code: 'hero-locked' });
    const bought = buyHero(p, 'bram');
    if (!bought.ok) throw new Error('kauf');
    const s = selectHero(bought.profile, 'bram');
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.profile.selectedHero).toBe('bram');
    expect(activeHero(s.profile)).toBe('bram');
    expect(selectHero(p, 'nobody' as never)).toMatchObject({ ok: false, code: 'unknown-hero' });
    // gewählt, aber nicht (mehr) besessen: Wren
    expect(activeHero({ ...p, selectedHero: 'sela' })).toBe('wren');
  });

  it('Laden räumt auf: Unbekanntes raus, Wren immer drin, nicht besessene Auswahl -> wren', () => {
    const raw = JSON.parse(JSON.stringify({ ...withLevel(5), heroes: ['sela'], selectedHero: 'sela' }));
    const r = loadProfile(raw);
    expect(r.reset).toBe(false);
    expect(r.profile.heroes).toEqual(['wren', 'sela']);
    // Sela ist per Kauf besessen, also bleibt die Auswahl
    expect(r.profile.selectedHero).toBe('sela');
    const raw2 = JSON.parse(JSON.stringify({ ...withLevel(5), heroes: ['wren'], selectedHero: 'sela' }));
    expect(loadProfile(raw2).profile.selectedHero).toBe('wren');
    const bad = JSON.parse(JSON.stringify({ ...withLevel(5), heroes: ['wren', 'zorro'] }));
    expect(loadProfile(bad).reset).toBe(true); // unbekannte Id: Schema lehnt ab
  });

  it('heroStore: drei Zeilen mit Schloss, Auswahl und Match-Preis', () => {
    const rows = heroStore({ ...withLevel(10), embers: 2600 });
    expect(rows.map((r) => [r.meta.id, r.lock.owned, r.selected, r.matchPrice, r.lock.canBuy])).toEqual([
      ['wren', true, true, 540, false],
      ['bram', true, false, 650, false],
      ['sela', false, false, 750, true],
    ]);
  });

  it('matchOptions: alle besessenen Helden freigeschaltet, hero = Auswahl', () => {
    const p = selectHero({ ...withLevel(10) }, 'bram');
    if (!p.ok) throw new Error('auswahl');
    const o = matchOptions(p.profile);
    expect(o.hero).toBe('bram');
    expect(o.unlocks.towers).toEqual(expect.arrayContaining(['wren', 'bram']));
    expect(o.unlocks.towers).not.toContain('sela');
    expect(matchOptions(newProfile()).hero).toBe('wren');
  });

  it('Sim: Match mit Bram als Auswahl lässt nur Bram setzen', () => {
    const sel = selectHero(withLevel(10), 'bram');
    if (!sel.ok) throw new Error('auswahl');
    const o = matchOptions(sel.profile);
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, ...o });
    expect(g.info.hero).toBe('bram');
    let spot = { x: 0, y: 0 };
    g.sandbox.setCash(5000);
    for (let y = 20000; y < 340000 && !spot.x; y += 20000) for (let x = 20000; x < 620000 && !spot.x; x += 20000) if (g.canPlace('bram', x, y).ok) spot = { x, y };
    expect(g.canPlace('wren', spot.x, spot.y)).toEqual({ ok: false, reason: 'wrong-hero' });
    expect(g.apply({ type: 'place', tower: 'bram', x: spot.x, y: spot.y }).ok).toBe(true);
  });

  it('unlockEverything und unlockAll öffnen alle drei Helden', () => {
    const p = unlockEverything(newProfile());
    for (const h of ['wren', 'bram', 'sela'] as const) expect(heroOwned(p, h)).toBe(true);
    const u: Profile = { ...newProfile(), settings: { volume: 50, unlockAll: true } };
    for (const h of ['wren', 'bram', 'sela'] as const) expect(heroOwned(u, h)).toBe(true);
    expect(matchOptions(u).unlocks.towers).toEqual(expect.arrayContaining(['wren', 'bram', 'sela']));
  });

  it('Export/Import behält heroes und selectedHero', () => {
    const b = buyHero({ ...withLevel(5), embers: 3000 }, 'bram');
    if (!b.ok) throw new Error('kauf');
    const sel = selectHero(b.profile, 'bram');
    if (!sel.ok) throw new Error('auswahl');
    const back = importProfile(exportProfile(sel.profile, '2026-10-10T00:00:00Z'));
    expect(back.ok).toBe(true);
    if (back.ok) {
      expect(back.profile.heroes).toEqual(['wren', 'bram']);
      expect(back.profile.selectedHero).toBe('bram');
    }
  });
});

describe('Wissensbaum: Riverkeeper, Bellringer, Tinker', () => {
  const NEW_IDS = ['deep-water', 'barbed-line', 'loud-bells', 'silver-tongue', 'spare-parts', 'sharp-caltrops'];
  it('sechs neue Knoten im Ast Specialists, Kosten 1/2 je Turm, Folgeknoten in früherer Zeile', () => {
    const nodes = KNOWLEDGE.filter((n) => NEW_IDS.includes(n.id));
    expect(nodes).toHaveLength(6);
    expect(nodes.every((n) => n.branch === 'specialists')).toBe(true);
    expect(nodes.map((n) => n.cost)).toEqual([1, 2, 1, 2, 1, 2]);
    for (const n of nodes) for (const r of n.requires) expect(nodeById(r)!.row).toBeLessThan(n.row);
    expect(new Set(nodes.map((n) => `${n.col}/${n.row}`)).size).toBe(6);
  });

  it('Mods kommen in den Optionen an', () => {
    const p = know(withLevel(40), ...NEW_IDS);
    const m = matchOptions(p).mods;
    expect(m.rangeBp?.riverkeeper).toBe(1000);
    expect(m.pierceAdd).toEqual({ riverkeeper: 1 });
    expect(m.auraRadiusBp).toEqual({ bellringer: 1500 });
    expect(m.tollAdd).toBe(25);
    expect(m.sentryTtlBp).toBe(2500);
    expect(m.trapChargesAdd).toBe(2);
    // gemeinsam mit Sharper Arrows
    expect(matchOptions(know(withLevel(40), 'sharp-eyes', 'sharper-arrows', 'deep-water', 'barbed-line')).mods.pierceAdd).toEqual({ ranger: 1, riverkeeper: 1 });
    expect(matchOptions(withLevel(40)).mods.tollAdd).toBeUndefined();
  });

  it('kaufbar nach Voraussetzung', () => {
    const p: Profile = withLevel(40);
    expect(buyNode(p, 'barbed-line')).toMatchObject({ ok: false, code: 'locked' });
    const a = buyNode(p, 'deep-water');
    expect(a.ok).toBe(true);
    if (a.ok) expect(buyNode(a.profile, 'barbed-line').ok).toBe(true);
  });
});
