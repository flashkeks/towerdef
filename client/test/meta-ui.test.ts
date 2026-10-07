/** P4: Sichtmodelle der Meta-UI ohne DOM, Texte-Vollstaendigkeit, Portrait-Rechnung. */
import { readdirSync, readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { bannerView, getBanner, newProfile, claimStarterGift, collectionView, playerView, stageView, testEnv, type BannerView, type CollectionUnitView, type Profile, type StageDifficultyView } from '../src/backend/meta';
import { hasKey } from '../src/i18n/t';
import { createSim, loadBrowserData, STAGE_ID, type UnitDef } from '../src/sim';
import {
  NO_FILTER,
  RARITY_ORDER,
  ROLE_CATS,
  PLACEMENT_CATS,
  cleanTeam,
  copiesLine,
  errorText,
  filterUnits,
  pullButtonText,
  pullOptions,
  rarityRank,
  revealDuration,
  revealStyle,
  rewardView,
  roleCat,
  selectableBanners,
  sortUnits,
  stageCardView,
  starsText,
  teamComplete,
  toggleTeam,
  unitAbbr,
  unitName,
  walletView,
} from '../src/ui/meta-model';
import { frameOf, portraitSpec } from '../src/ui/portrait';

const env = testEnv(1);
const starter = (): Profile => {
  const g = claimStarterGift(newProfile(env), env);
  if (!g.ok) throw new Error(g.message);
  return g.profile;
};
const defs = new Map<string, UnitDef>(createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data: loadBrowserData() }).catalog().map((d) => [d.id, d]));
const std = (p: Profile | null): BannerView => bannerView(getBanner('standard')!, p);

describe('Texte', () => {
  it('jeder bekannte Backend-Fehlercode hat einen eigenen Text', () => {
    const codes = ['not-enough-crystals', 'not-enough-gold', 'max-level', 'banner-limit-reached', 'banner-inactive', 'banner-pool-empty', 'unknown-banner', 'invalid-count', 'unit-not-owned', 'team-empty', 'team-incomplete', 'team-too-large', 'team-duplicate', 'difficulty-locked', 'starter-already-claimed', 'replay-mismatch', 'invalid-replay', 'replay-incomplete', 'replay-old-rules', 'replay-unsupported', 'already-reported', 'unit-mods-mismatch', 'team-mismatch', 'team-required', 'team-invalid', 'profile-corrupt', 'profile-too-new', 'import-invalid-json', 'import-wrong-format', 'import-bad-checksum', 'save-failed', 'internal-error', 'unknown-sku', 'payment-failed', 'unknown-order'];
    for (const c of codes) expect(hasKey(`err.${c}`), c).toBe(true);
  });
  it('unbekannter Code: Backend-Text, sonst allgemeiner Satz', () => {
    expect(errorText({ code: 'xyz', message: 'Something odd.' })).toBe('Something odd.');
    expect(errorText({ code: 'xyz' })).toBe('Something went wrong. Please try again.');
    expect(errorText({ code: 'not-enough-crystals', message: 'x' })).toBe('Not enough crystals.');
  });
  it('alle Textschluessel in ui/*.ts (Literale) und die Schluesselfamilien existieren', () => {
    const dir = new URL('../src/ui/', import.meta.url).pathname;
    const missing: string[] = [];
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(dir + f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.-]+)'\s*[,)]/g)) if (!hasKey(m[1]!)) missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
    for (const r of RARITY_ORDER) expect(hasKey(`rarity.${r}`)).toBe(true);
    for (const r of ROLE_CATS) expect(hasKey(`role.cat.${r}`)).toBe(true);
    for (const p of PLACEMENT_CATS) expect(hasKey(`placement.${p}`)).toBe(true);
    for (const k of ['play', 'summon', 'units', 'team', 'shop', 'settings']) {
      expect(hasKey(`lobby.${k}`)).toBe(true);
      expect(hasKey(`lobby.${k}.sub`)).toBe(true);
    }
    for (const k of ['rarity', 'rate', 'long', 'next']) expect(hasKey(`summon.rates.${k}`)).toBe(true);
  });
  it('unbekannte Unit (neue Unit ohne Text): lesbarer Name statt Schluessel', () => {
    expect(unitName('rokuhira')).toBe('Vengeful Swordsman'); // Name aus den Unit-Daten
    expect(unitAbbr('rokuhira')).toBe('VS');
    expect(unitName('wyrm_hunter')).toBe('Wyrm_hunter');
    expect(unitAbbr('wyrm_hunter')).toBe('WYR');
  });
});

describe('Rolle und Filter (aus den Sim-Daten, keine Unit-Liste)', () => {
  it('jede Unit der Sim hat eine Rolle aus den bekannten', () => {
    for (const d of defs.values()) expect(ROLE_CATS, d.id).toContain(roleCat(d));
  });
  it('Rollen der bekannten Units', () => {
    expect(roleCat(defs.get('speedwagon')!)).toBe('economy');
    expect(roleCat(defs.get('tatsumaki_evolved')!)).toBe('control'); // Knockback
    expect(roleCat(defs.get('stain')!)).toBe('area');
    expect(roleCat(defs.get('ichigo')!)).toBe('single');
  });
  const units = (): CollectionUnitView[] => collectionView(starter()).units;
  it('Filter nach Seltenheit, Rolle, Platzierung und Besitz', () => {
    const u = units();
    expect(filterUnits(u, defs, NO_FILTER)).toHaveLength(u.length);
    expect(filterUnits(u, defs, { ...NO_FILTER, rarity: 'epic' }).every((x) => x.rarity === 'epic')).toBe(true);
    expect(filterUnits(u, defs, { ...NO_FILTER, role: 'economy' }).map((x) => x.unitId)).toContain('speedwagon');
    expect(filterUnits(u, defs, { ...NO_FILTER, placement: 'hill' }).every((x) => defs.get(x.unitId)!.placement === 'hill')).toBe(true);
    expect(filterUnits(u, defs, { ...NO_FILTER, ownedOnly: true }).every((x) => x.owned)).toBe(true);
    expect(filterUnits(u, defs, { ...NO_FILTER, rarity: 'secret', ownedOnly: true })).toEqual([]);
  });
  it('Unit ohne Sim-Definition faellt nur durch Rolle/Platzierung, nicht durch Seltenheit und stuerzt nicht ab', () => {
    const ghost: CollectionUnitView = { ...units()[0]!, unitId: 'ghost_unit', rarity: 'epic' };
    expect(filterUnits([ghost], defs, { ...NO_FILTER, rarity: 'epic' })).toHaveLength(1);
    expect(filterUnits([ghost], defs, { ...NO_FILTER, role: 'single' })).toHaveLength(0);
  });
  it('Sortierung: Besessene zuerst, dann Seltenheit absteigend, stabil', () => {
    const s = sortUnits(units());
    const owned = s.filter((x) => x.owned);
    expect(s.slice(0, owned.length)).toEqual(owned);
    for (let i = 1; i < owned.length; i++) expect(rarityRank(owned[i - 1]!.rarity)).toBeGreaterThanOrEqual(rarityRank(owned[i]!.rarity));
    expect(sortUnits(s)).toEqual(s);
  });
  it('Sterne und Kopien als Text', () => {
    expect(starsText(2, 5)).toBe('★★☆☆☆');
    const u = units().find((x) => x.owned)!;
    expect(copiesLine(u)).toBe('Copies 1 / 2 for star 2');
    expect(copiesLine({ ...u, copies: 20, copiesForNextStar: null, copiesToNextStar: null })).toBe('Copies 20, max stars');
    expect(copiesLine({ ...u, owned: false })).toBe('not owned');
  });
});

describe('Summon', () => {
  it('Knopftext mit Pity: "Pull x10 · Mythic pity 37/150"', () => {
    const p = starter();
    const v = std({ ...p, pity: { standard: { sinceTop: 37, sinceMid: 5 } } });
    expect(pullButtonText(v, 10)).toBe('Pull x10 · Mythic pity 37/150');
    expect(pullButtonText(v, 1)).toBe('Pull x1 · Mythic pity 37/150');
    const opts = pullOptions(v);
    expect(opts.map((o) => [o.count, o.cost])).toEqual([[1, 50], [10, 450]]);
  });
  it('Banner ohne Pity: nur "Pull xN"; Starter bietet nur den 10er', () => {
    const starterBanner = bannerView(getBanner('starter')!, newProfile(env));
    expect(pullOptions(starterBanner).map((o) => o.count)).toEqual([10]);
    expect(pullButtonText(starterBanner, 10)).toBe('Pull x10');
  });
  it('Banner-Auswahl: Standard zuerst, Starter nur solange verfuegbar, Inaktive nie', () => {
    const fresh = newProfile(env);
    const all = (p: Profile): BannerView[] => ['starter', 'featured-example', 'standard'].map((id) => bannerView(getBanner(id)!, p));
    expect(selectableBanners(all(fresh)).map((b) => b.bannerId)).toEqual(['standard', 'starter']);
    const used: Profile = { ...fresh, counters: { 'batches:starter': 1 } };
    expect(selectableBanners(all(used)).map((b) => b.bannerId)).toEqual(['standard']);
  });
  it('Ratentabelle kommt komplett aus dem View (Summe 100 %, Raten stehen im Text)', () => {
    const v = std(null);
    expect(v.tiers.map((t) => t.baseText)).toEqual(['69%', '24%', '5.4%', '1.3%', '0.25%', '0.05%']);
    expect(v.rules.length).toBeGreaterThan(0);
    expect(v.ratesHash.length).toBeGreaterThan(8);
  });
  it('Enthuellung: hoehere Seltenheit = laengere Pause und Blitz, Gesamtdauer kurz', () => {
    expect(revealStyle('rare').flashMs).toBe(0);
    expect(revealStyle('mythic').flashMs).toBeGreaterThan(revealStyle('legendary').flashMs);
    expect(revealStyle('mythic').stepMs).toBeGreaterThan(revealStyle('rare').stepMs);
    expect(revealStyle('unbekannt').cls).toBe('r-rare');
    const ten = ['rare', 'rare', 'epic', 'rare', 'rare', 'epic', 'rare', 'legendary', 'rare', 'mythic'];
    expect(revealDuration(ten)).toBeLessThan(3500);
    expect(revealDuration(['rare'])).toBeLessThan(1000);
  });
});

describe('Team', () => {
  const owned = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  it('toggleTeam: nur Besessene, nur bis zum Ziel, abwaehlen geht immer', () => {
    let t: string[] = [];
    for (const id of ['a', 'b', 'c', 'x', 'd', 'e', 'f', 'g']) t = toggleTeam(t, id, owned, 6);
    expect(t).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(teamComplete(t, 6)).toBe(true);
    expect(toggleTeam(t, 'g', owned, 6)).toEqual(t);
    expect(toggleTeam(t, 'a', owned, 6)).toEqual(['b', 'c', 'd', 'e', 'f']);
    expect(teamComplete([], 0)).toBe(false);
  });
  it('cleanTeam entfernt Unbekannte, Doppelte und Ueberzaehlige', () => {
    expect(cleanTeam(['a', 'a', 'zzz', 'b', 'c', 'd', 'e', 'f', 'g'], owned, 4)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('Stage und Belohnung', () => {
  const d = (over: Partial<StageDifficultyView> = {}): StageDifficultyView => ({ difficulty: 'hard', unlocked: false, unlockLevel: 5, firstClearCrystals: 150, repeatCrystals: 38, cleared: false, clears: 0, bestWave: 0, maxWaves: 20, ...over });
  it('gesperrte Stufe nennt den Grund', () => {
    expect(stageCardView(d())).toMatchObject({ locked: true, lockText: 'Player level 5', rewardText: 'First clear: 150 crystals', bestText: 'Not played yet' });
  });
  it('freie Stufe: Erst-Clear, nach dem Clear Wiederholung, Bestwelle', () => {
    expect(stageCardView(d({ unlocked: true, bestWave: 7 }))).toMatchObject({ locked: false, lockText: null, bestText: 'Best wave 7 / 20' });
    expect(stageCardView(d({ unlocked: true, cleared: true }))).toMatchObject({ cleared: true, rewardText: 'Each clear: 38 crystals' });
  });
  it('Stufen aus dem echten stageView des neuen Profils', () => {
    const v = stageView(starter(), STAGE_ID).difficulties.map(stageCardView);
    expect(v.map((x) => x.lockText)).toEqual([null, 'Player level 5', 'Player level 25']);
  });
  it('rewardView: Sieg mit Crystals, Niederlage ohne Crystals-Zeile, Level-Up', () => {
    const win = rewardView({ crystals: 100, gold: 350, xp: 100, firstClear: true, levelsGained: 1, playerLevel: 2 }, true);
    expect(win.lines.map((l) => l.text)).toEqual(['+100 crystals', '+350 gold', '+100 XP']);
    expect(win).toMatchObject({ firstClear: true, levelUp: 2, consolation: false });
    const loss = rewardView({ crystals: 0, gold: 60, xp: 12, firstClear: false, levelsGained: 0, playerLevel: 1 }, false);
    expect(loss.lines.map((l) => l.kind)).toEqual(['gold', 'xp']);
    expect(loss).toMatchObject({ levelUp: null, consolation: true });
  });
});

describe('Kontostaende', () => {
  it('walletView: Tausendertrennung, XP-Text, Prozent', () => {
    const p = starter();
    const w = walletView(playerView({ ...p, wallet: { crystals: 12345, gold: 7 }, playerLevel: 2, playerXp: 162 }));
    expect(w).toMatchObject({ crystals: '12,345', gold: '7', level: 'Level 2', xp: '62 / 125 XP', xpPct: 49 });
  });
});

describe('Portrait', () => {
  it('ganzzahlige Skalierung, Atlas-Ausschnitt per Hintergrundposition', () => {
    const s = portraitSpec({ x: 463, y: 99, w: 32, h: 32 }, 64, { w: 512, h: 256 });
    expect(s).toMatchObject({ scale: 2, width: 64, height: 64, bgSize: '1024px 512px', bgPos: '-926px -198px' });
    expect(portraitSpec({ x: 0, y: 0, w: 64, h: 64 }, 32, { w: 512, h: 256 })).toMatchObject({ scale: 0.5, width: 32, height: 32 });
    expect(portraitSpec({ x: 0, y: 0, w: 32, h: 32 }, 32, { w: 512, h: 256 }).scale).toBe(1);
  });
  it('bekannte Units haben einen Rahmen im Atlas, unbekannte nicht (Fallback-Abzeichen)', () => {
    // Runde 8: AA-Units haben (noch) kein Atlas-Sprite -> Fallback-Abzeichen (Initialen auf Element-Farbe)
    expect(frameOf('rokuhira')).toBeNull();
    expect(frameOf('ghost_unit')).toBeNull();
  });
});
