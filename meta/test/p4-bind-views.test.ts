/** P4: Replay an das Profil binden (Luecke aus P5) und die Sichtmodelle der Meta-UI. */
import { beforeAll, describe, expect, it } from 'vitest';
import { runMatch } from '../../sim/src/bots/index';
import { botTuning } from '../../sim/src/bots/util';
import {
  KIND,
  MAX_PLAYER_LEVEL,
  UNIT_CATALOG,
  balanceOf,
  book,
  claimStarterGift,
  collectionView,
  levelUp,
  newProfile,
  playerView,
  pullHistoryView,
  rewardFromReplay,
  stageView,
  testEnv,
  unitModsFor,
  xpToReach,
  type Profile,
} from '../src';

const ALL = UNIT_CATALOG.map((u) => u.id);
const env = () => testEnv(5);

/** Echtes Replay eines Bot-Laufs, der `only` kauft und mit genau diesen Mods gespielt hat (der Hash gilt also fuer die Mods im Kopf). */
function replayWith(o: { unitMods: unknown[]; team: string[] | null; only: string[] }): Record<string, any> {
  const commands: unknown[] = [];
  const saved = botTuning.banned;
  botTuning.banned = ALL.filter((u) => !o.only.includes(u));
  try {
    const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 3, bots: ['greedy@normal'], unitMods: o.unitMods as never, onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok }) });
    return {
      format: 'towerdef-replay', formatVersion: 3, gameVersion: 'test', stage: 'standard20', difficulty: 'normal', players: 1, seed: 3,
      team: o.team, unitMods: o.unitMods, cards: [], complete: true, result: r.result, endTick: r.ticks, endHash: r.hash, endWave: r.endWave, commands, controls: [], waves: [], feedback: '',
    };
  } finally {
    botTuning.banned = saved;
  }
}

function starterProfile(): Profile {
  const e = env();
  const s = claimStarterGift(newProfile(e), e);
  if (!s.ok) throw new Error(s.message);
  return s.profile;
}
/** Starter plus Gold und Striker auf Level 5. */
function leveledProfile(): Profile {
  const e = env();
  let p = book(starterProfile(), { currency: 'gold', delta: 1000, kind: KIND.grant, refType: 'test', refId: 'g' }, e);
  if (!p.ok) throw new Error(p.message);
  let prof = p.profile;
  for (let i = 0; i < 4; i++) {
    const r = levelUp(prof, 'striker', e);
    if (!r.ok) throw new Error(r.message);
    prof = r.profile;
  }
  return prof;
}

const bind = { bindToProfile: true } as const;
let honest: Record<string, any>;
let leveled: Profile;

beforeAll(() => {
  leveled = leveledProfile();
  honest = replayWith({ unitMods: unitModsFor(leveled, leveled.team), team: leveled.team, only: ['striker'] });
}, 120_000);

describe('reportMatch-Luecke: Replay muss zum Profil passen (bindToProfile)', () => {
  it('ehrliches Replay (Mods und Team wie im Profil) wird belohnt', () => {
    expect(leveled.units.striker!.level).toBe(5);
    const r = rewardFromReplay(leveled, honest, env(), bind);
    expect(r.ok).toBe(true);
  });

  it('Mods im Kopf besser als das Profil (Selbstbedienung mit Level 40) -> unit-mods-mismatch, nichts gebucht', () => {
    const fresh = starterProfile();
    const boosted = leveled.team.map((unit) => ({ player: 0, unit, lvlBp: 21750 }));
    const mine = replayWith({ unitMods: boosted, team: fresh.team, only: ['striker'] });
    // das Replay ist in sich stimmig (Hash gilt fuer die Mods im Kopf) ...
    expect(rewardFromReplay(fresh, mine, env()).ok).toBe(true);
    // ... aber gegen das Profil gebunden gibt es nichts
    const r = rewardFromReplay(fresh, mine, env(), bind);
    expect(r).toMatchObject({ ok: false, code: 'unit-mods-mismatch' });
    expect(balanceOf(fresh, 'gold')).toBe(0);
  });

  it('Mods fehlen (leere Liste) obwohl das Profil Mods verlangt -> unit-mods-mismatch', () => {
    const neutral = replayWith({ unitMods: [], team: leveled.team, only: ['striker'] });
    expect(rewardFromReplay(leveled, neutral, env(), bind)).toMatchObject({ ok: false, code: 'unit-mods-mismatch' });
  });

  it('Kopf-Mods nur umsortiert -> trotzdem gleich (Reihenfolge egal)', () => {
    const rev = { ...honest, unitMods: [...honest.unitMods].reverse() };
    expect(rewardFromReplay(leveled, rev, env(), bind).ok).toBe(true);
  });

  it('kein Team im Kopf -> team-required; mit Team ohne Bindung bleibt es wie bisher', () => {
    expect(rewardFromReplay(leveled, { ...honest, team: null }, env(), bind)).toMatchObject({ ok: false, code: 'team-required' });
    expect(rewardFromReplay(leveled, { ...honest, team: null }, env()).ok).toBe(true);
  });

  it('Team im Kopf ist nicht das gespeicherte Team -> team-mismatch', () => {
    const other = leveled.team.slice(1);
    expect(rewardFromReplay(leveled, { ...honest, team: other }, env(), bind)).toMatchObject({ ok: false, code: 'team-mismatch' });
    // Menge zaehlt, nicht die Reihenfolge
    expect(rewardFromReplay(leveled, { ...honest, team: [...leveled.team].reverse() }, env(), bind).ok).toBe(true);
  });

  it('nicht besessene Unit im Team -> unit-not-owned; Duplikate -> team-invalid', () => {
    expect(rewardFromReplay(leveled, { ...honest, team: [...leveled.team.slice(1), 'titan'] }, env(), bind)).toMatchObject({ ok: false, code: 'unit-not-owned' });
    expect(rewardFromReplay(leveled, { ...honest, team: [leveled.team[0], leveled.team[0]] }, env(), bind)).toMatchObject({ ok: false, code: 'team-invalid' });
  });

  it('Unit platziert, die nicht im Team steht -> team-invalid', () => {
    // Team = gespeichertes Team ohne Striker, der Bot setzt aber Striker
    const p: Profile = { ...leveled, team: leveled.team.filter((u) => u !== 'striker') };
    const stray = replayWith({ unitMods: unitModsFor(p, p.team), team: p.team, only: ['striker'] });
    expect(rewardFromReplay(p, stray, env(), bind)).toMatchObject({ ok: false, code: 'team-invalid' });
  });
});

describe('Sichtmodelle', () => {
  it('playerView: XP-Balken, Salden, Team-Ziel', () => {
    const p = starterProfile();
    const v = playerView(p);
    expect(v).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNext: 100, xpPct: 0, crystals: 450, gold: 0, starterGiftAvailable: false, teamTarget: 6 });
    const mid = playerView({ ...p, playerLevel: 2, playerXp: xpToReach(2) + 62 });
    expect(mid).toMatchObject({ level: 2, xpIntoLevel: 62, xpForNext: 125, xpPct: 49 });
    expect(playerView({ ...p, playerLevel: MAX_PLAYER_LEVEL, playerXp: 99999 })).toMatchObject({ xpPct: 100, xpForNext: 0 });
    const empty = playerView(newProfile(env()));
    expect(empty).toMatchObject({ starterGiftAvailable: true, teamTarget: 0, ownedCount: 0 });
  });

  it('collectionView: alle Katalog-Units, nicht Besessene grau, Kosten und Sterne', () => {
    const v = collectionView(leveled);
    expect(v.units.map((u) => u.unitId)).toEqual(UNIT_CATALOG.map((u) => u.id));
    expect(v.total).toBe(UNIT_CATALOG.length);
    const striker = v.units.find((u) => u.unitId === 'striker')!;
    expect(striker).toMatchObject({ owned: true, level: 5, stars: 1, copiesToNextStar: 1, levelUpCost: 80, inTeam: true });
    expect(striker.powerBp).toBe(11000);
    expect(striker.powerBonusPct).toBe(10);
    const titan = v.units.find((u) => u.unitId === 'titan')!;
    expect(titan).toMatchObject({ owned: false, level: 0, levelUpCost: null, canLevelUp: false, stars: 0 });
    expect(collectionView({ ...leveled, wallet: { ...leveled.wallet, gold: 0 } }).units.find((u) => u.unitId === 'striker')!.canLevelUp).toBe(false);
  });

  it('stageView: Sperrgruende, Erst-Clear, Bestwelle', () => {
    const p = starterProfile();
    const v = stageView(p, 'standard20');
    expect(v.difficulties.map((d) => [d.difficulty, d.unlocked, d.unlockLevel])).toEqual([['normal', true, 1], ['hard', false, 5], ['nightmare', false, 25]]);
    expect(v.difficulties[0]).toMatchObject({ firstClearCrystals: 100, repeatCrystals: 25, cleared: false, bestWave: 0, maxWaves: 20 });
    const cleared: Profile = { ...p, playerLevel: 5, stages: { standard20: { normal: { clears: 2, firstClearAt: 'x', bestWave: 20 }, hard: { clears: 0, firstClearAt: null, bestWave: 7 } } } };
    const w = stageView(cleared, 'standard20').difficulties;
    expect(w[0]).toMatchObject({ cleared: true, clears: 2, bestWave: 20 });
    expect(w[1]).toMatchObject({ unlocked: true, cleared: false, bestWave: 7, firstClearCrystals: 150 });
  });

  it('pullHistoryView: neueste zuerst, begrenzt', () => {
    const p = starterProfile();
    const rec = (i: number) => ({ id: `p${i}`, bannerId: 'standard', ratesVersion: 'v', batchId: 'b', idx: i, rollBp: 1, rarity: 'rare', unitId: 'striker', isNew: false, pityBefore: 0, pityAfter: 0, pityForced: null, costCrystals: 50, createdAt: 't' });
    const q: Profile = { ...p, pullHistory: [1, 2, 3, 4, 5].map(rec) };
    expect(pullHistoryView(q, 3).map((h) => h.id)).toEqual(['p5', 'p4', 'p3']);
    expect(pullHistoryView(q, 0)).toEqual([]);
    expect(pullHistoryView(q).length).toBe(5);
  });
});
