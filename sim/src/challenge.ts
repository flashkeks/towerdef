/**
 * Runde 16 E (10.10.2026): Challenge-Regelwerk. Reine Daten, deterministisch, serialisierbar (JSON und Code `DW1-...`).
 * Die Regeln selbst laufen in `game.ts` (`GameOptions.rules`); hier stehen Typ, Pruefung, Code und die Rueckfuehrung der Modi.
 * Spielersichtbare Texte (Fehlermeldungen, Namen) sind Englisch.
 *
 * Tuerme, Helden und Gegner werden aus den Daten gelesen (`DATA.towers`, `DATA.hero`, `DATA.enemies`), nie hart kodiert.
 * Im Code stehen sie als Index in der Schluessel-Reihenfolge der JSON-Dateien: **die Dateien sind append-only**
 * (neue Tuerme/Helden/Gegner ans Ende), sonst aendert sich die Bedeutung alter Codes.
 */
import { DATA } from './data.js';
import { LIST_ROUNDS } from './freeplay.js';
import { DEFLATION_BACK, MODES, type ModeInfo } from './modes.js';
import type { Difficulty, EnemyType, HeroType, ModeId, Tiers, TowerType } from './types.js';

/** Eine Gruppe einer eigenen Welle (wie `RoundData.groups`, nur mit den Merkmalen, die der Editor kennt). */
export interface ChallengeGroup {
  type: EnemyType;
  /** Anzahl 1..999. */
  n: number;
  camo?: boolean;
  regrow?: boolean;
  fortified?: boolean;
  /** Start der Gruppe nach Rundenbeginn in ms (Raster 100). Vorgabe 0. */
  startMs?: number;
  /** Abstand zwischen zwei Gegnern in ms (Raster 10). Vorgabe 500. */
  gapMs?: number;
}

export interface ChallengeRules {
  map: string;
  difficulty: Difficulty;
  /** Seed des Matches (gleich fuer alle, die den Code spielen). */
  seed: number;
  /** Erste gespielte Runde (1..LIST_ROUNDS). */
  startRound: number;
  /** Letzte Runde = Sieg. Mit `waves` immer `startRound + waves.length - 1`. */
  endRound: number;
  /** Erlaubte Tuerme; `null` = alle. */
  towers: TowerType[] | null;
  /** `none` = Held gesperrt, `any` = jeder Held erlaubt, sonst genau dieser. */
  hero: 'none' | 'any' | HeroType;
  /** Hoechststufe je Pfad A/B/C (0..5, 5 = keine Grenze). */
  maxTier: Tiers;
  /** Startgeld; `null` = Wert der Schwierigkeit (plus Wissensbaum, falls erlaubt). */
  startCash: number | null;
  /** Leben; `null` = Wert der Schwierigkeit. */
  lives: number | null;
  /** Einkommen (Pops, Rundenbonus, Markets) in Prozent, 100 = normal, 0 = keines. */
  incomePct: number;
  noSell: boolean;
  noPowers: boolean;
  /** Wissensbaum-Boni (`GameOptions.mods`) werden ignoriert. */
  noKnowledge: boolean;
  /** Gegner-HP in Prozent (Huelle, auch Bosse). */
  hpPct: number;
  /** Gegner-Tempo in Prozent. */
  speedPct: number;
  /** Eigene Wellen: Runde `startRound + i` spielt `waves[i]`. `null` = Rundenliste des Spiels. */
  waves: ChallengeGroup[][] | null;
}

export const CHALLENGE_PREFIX = 'DW1';
export const CHALLENGE_LIMITS = {
  cash: [0, 999_999], lives: [1, 9_999], income: [0, 300], factor: [10, 1000], waves: 120, groups: 12, count: 999,
} as const;

export class ChallengeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChallengeError';
  }
}

const towerIds = (): TowerType[] => Object.keys(DATA.towers) as TowerType[];
const heroIds = (): HeroType[] => Object.keys(DATA.hero) as HeroType[];
const enemyIds = (): EnemyType[] => Object.keys(DATA.enemies) as EnemyType[];
export const challengeTowers = towerIds;
export const challengeHeroes = heroIds;
export const challengeEnemies = enemyIds;
const isHeroId = (t: string): boolean => t in DATA.hero;
const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

/** Alle Karten der Sim (ohne die Testkarte `bare`). */
export const challengeMaps = (): string[] => Object.keys(DATA.maps).filter((m) => m !== 'bare');

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const inRange = (v: unknown, lo: number, hi: number): v is number => isInt(v) && v >= lo && v <= hi;

/** Grundregeln: alles normal, Meadow/Medium, R1 bis zur Endrunde. */
export function defaultRules(map = 'meadow', difficulty: Difficulty = 'medium', seed = 1): ChallengeRules {
  return {
    map, difficulty, seed, startRound: 1, endRound: DATA.difficulties[difficulty].endRound,
    towers: null, hero: 'any', maxTier: [5, 5, 5], startCash: null, lives: null, incomePct: 100,
    noSell: false, noPowers: false, noKnowledge: false, hpPct: 100, speedPct: 100, waves: null,
  };
}

/**
 * Prueft und ergaenzt Regeln (fehlende Felder bekommen die Vorgabe). Wirft `ChallengeError` mit englischer Meldung.
 * Gibt immer eine frische, unabhaengige Kopie zurueck.
 */
export function normalizeRules(input: Partial<ChallengeRules>): ChallengeRules {
  const d = defaultRules(input.map ?? 'meadow', input.difficulty ?? 'medium', input.seed ?? 1);
  const r: ChallengeRules = { ...d, ...input } as ChallengeRules;
  if (!challengeMaps().includes(r.map)) throw new ChallengeError(`Unknown map "${String(r.map)}".`);
  if (!DIFFS.includes(r.difficulty)) throw new ChallengeError('Unknown difficulty.');
  if (!inRange(r.seed, 0, 0xffffffff)) throw new ChallengeError('Bad seed.');
  const waves = r.waves ?? null;
  if (waves) {
    if (waves.length < 1 || waves.length > CHALLENGE_LIMITS.waves) throw new ChallengeError(`Custom waves: 1 to ${CHALLENGE_LIMITS.waves} rounds.`);
  }
  if (!inRange(r.startRound, 1, LIST_ROUNDS)) throw new ChallengeError(`Start round must be between 1 and ${LIST_ROUNDS}.`);
  const endRound = waves ? r.startRound + waves.length - 1 : r.endRound;
  if (!inRange(endRound, r.startRound, waves ? 9999 : LIST_ROUNDS)) throw new ChallengeError('End round must not be before the start round.');
  let towers: TowerType[] | null = null;
  if (r.towers) {
    const known = towerIds();
    for (const t of r.towers) if (!known.includes(t)) throw new ChallengeError(`Unknown tower "${String(t)}".`);
    towers = known.filter((t) => r.towers!.includes(t));
    if (towers.length === 0) throw new ChallengeError('Allow at least one tower.');
    if (towers.length === known.length) towers = null;
  }
  if (r.hero !== 'none' && r.hero !== 'any' && !isHeroId(r.hero)) throw new ChallengeError('Unknown hero.');
  if (!Array.isArray(r.maxTier) || r.maxTier.length !== 3 || !r.maxTier.every((v) => inRange(v, 0, 5))) throw new ChallengeError('Max tier must be 0 to 5 per path.');
  const [cLo, cHi] = CHALLENGE_LIMITS.cash;
  if (r.startCash !== null && !inRange(r.startCash, cLo, cHi)) throw new ChallengeError('Bad starting gold.');
  const [lLo, lHi] = CHALLENGE_LIMITS.lives;
  if (r.lives !== null && !inRange(r.lives, lLo, lHi)) throw new ChallengeError('Bad lives.');
  if (!inRange(r.incomePct, ...CHALLENGE_LIMITS.income)) throw new ChallengeError('Bad income.');
  if (!inRange(r.hpPct, ...CHALLENGE_LIMITS.factor) || !inRange(r.speedPct, ...CHALLENGE_LIMITS.factor)) throw new ChallengeError('Bad enemy factors.');
  const ids = enemyIds();
  const nw = waves?.map((rd) => {
    if (!Array.isArray(rd) || rd.length > CHALLENGE_LIMITS.groups) throw new ChallengeError(`A wave has 0 to ${CHALLENGE_LIMITS.groups} groups.`);
    return rd.map((g): ChallengeGroup => {
      if (!ids.includes(g.type)) throw new ChallengeError(`Unknown enemy "${String(g.type)}".`);
      if (!inRange(g.n, 1, CHALLENGE_LIMITS.count)) throw new ChallengeError('Group size must be 1 to 999.');
      const startMs = g.startMs ?? 0, gapMs = g.gapMs ?? 500;
      if (!inRange(startMs, 0, 60_000) || !inRange(gapMs, 10, 10_000)) throw new ChallengeError('Bad group timing.');
      return { type: g.type, n: g.n, ...(g.camo ? { camo: true } : {}), ...(g.regrow ? { regrow: true } : {}), ...(g.fortified ? { fortified: true } : {}), startMs: Math.round(startMs / 100) * 100, gapMs: Math.round(gapMs / 10) * 10 };
    });
  }) ?? null;
  return {
    map: r.map, difficulty: r.difficulty, seed: r.seed, startRound: r.startRound, endRound, towers, hero: r.hero,
    maxTier: [...r.maxTier] as Tiers, startCash: r.startCash, lives: r.lives, incomePct: r.incomePct,
    noSell: !!r.noSell, noPowers: !!r.noPowers, noKnowledge: !!r.noKnowledge, hpPct: r.hpPct, speedPct: r.speedPct, waves: nw,
  };
}

/** Darf dieser Turm / Held gebaut werden? (Ohne Regeln: immer ja.) */
export function rulesAllow(rules: ChallengeRules | undefined, type: TowerType | HeroType): boolean {
  if (!rules) return true;
  if (isHeroId(type)) return rules.hero === 'any' || rules.hero === type;
  return !rules.towers || rules.towers.includes(type as TowerType);
}

/** Obergrenze fuer `path` (0..2) dieses Turms. */
export const rulesTierCap = (rules: ChallengeRules | undefined, path: number): number => (rules ? rules.maxTier[path] : 5);

/** Alle Regeln, die vom Normalspiel abweichen, als kurze englische Zeilen (Chip, Startseite, Ergebnis). */
export function describeRules(rules: ChallengeRules): string[] {
  const out: string[] = [];
  const dd = DATA.difficulties[rules.difficulty];
  out.push(`Rounds ${rules.startRound} to ${rules.endRound}`);
  if (rules.towers) out.push(`Towers: ${rules.towers.map((t) => DATA.towers[t].name).join(', ')}`);
  if (rules.hero === 'none') out.push('No hero');
  else if (rules.hero !== 'any') out.push(`Hero: ${DATA.hero[rules.hero].name}`);
  if (rules.maxTier.some((v) => v < 5)) {
    const [a, b, c] = rules.maxTier;
    out.push(a === b && b === c ? `Max tier ${a}` : `Max tier ${a}/${b}/${c}`);
  }
  if (rules.startCash !== null) out.push(`${rules.startCash} starting gold`);
  if (rules.lives !== null && rules.lives !== dd.lives) out.push(`${rules.lives} lives`);
  if (rules.incomePct === 0) out.push('No income');
  else if (rules.incomePct !== 100) out.push(`${rules.incomePct}% income`);
  if (rules.noSell) out.push('No selling');
  if (rules.noPowers) out.push('No powers');
  if (rules.noKnowledge) out.push('No knowledge bonuses');
  if (rules.hpPct !== 100) out.push(`Enemy HP ${rules.hpPct}%`);
  if (rules.speedPct !== 100) out.push(`Enemy speed ${rules.speedPct}%`);
  if (rules.waves) out.push('Custom waves');
  return out;
}

// ---------------------------------------------------------------- Modi als Sonderfaelle

/**
 * Die bestehenden Modi als Regelwerk (Runde 15). `createGame({ mode })` bleibt unveraendert, die Gleichheit der Spielwerte
 * pruefen die Tests (`sim/test/challenge.test.ts`). Ausnahme: der interne Bruchrest des Half-Cash-Einkommens liegt in
 * anderen Einheiten (Hash weicht ab, Gold nicht).
 */
export function modeRules(mode: ModeId, map: string, difficulty: Difficulty, seed = 1): ChallengeRules {
  const m: ModeInfo = MODES[mode];
  const dd = DATA.difficulties[difficulty];
  const r = defaultRules(map, difficulty, seed);
  if (m.towers) r.towers = [...m.towers];
  if (!m.hero) r.hero = 'none';
  if (!m.powers) r.noPowers = true;
  if (mode === 'half-cash') { r.startCash = Math.floor(dd.startCash / 2); r.incomePct = 50; }
  if (mode === 'deflation') { r.startCash = 20_000; r.incomePct = 0; r.startRound = dd.endRound - DEFLATION_BACK; }
  return normalizeRules(r);
}

// ---------------------------------------------------------------- Code

const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

class Writer {
  b: number[] = [];
  u(v: number): void {
    let x = v;
    while (x >= 128) { this.b.push((x % 128) | 128); x = Math.floor(x / 128); }
    this.b.push(x);
  }
}
class Reader {
  i = 0;
  constructor(readonly b: number[]) {}
  u(): number {
    let v = 0, mul = 1;
    for (let k = 0; k < 6; k++) {
      if (this.i >= this.b.length) throw new ChallengeError('This code is cut off.');
      const x = this.b[this.i++];
      v += (x & 127) * mul;
      if (x < 128) return v;
      mul *= 128;
    }
    throw new ChallengeError('This code is damaged.');
  }
  get done(): boolean { return this.i >= this.b.length; }
}

/** CRC-16/CCITT-FALSE. */
function crc16(bytes: number[]): number {
  let c = 0xffff;
  for (const x of bytes) {
    c ^= x << 8;
    for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c;
}

const F_SELL = 1, F_POWERS = 2, F_KNOW = 4, F_TOWERS = 8, F_WAVES = 16, F_CASH = 32, F_LIVES = 64;
const KNOWN_FLAGS = F_SELL | F_POWERS | F_KNOW | F_TOWERS | F_WAVES | F_CASH | F_LIVES;

function toBytes(r: ChallengeRules): number[] {
  const w = new Writer();
  const flags = (r.noSell ? F_SELL : 0) | (r.noPowers ? F_POWERS : 0) | (r.noKnowledge ? F_KNOW : 0) | (r.towers ? F_TOWERS : 0) | (r.waves ? F_WAVES : 0) | (r.startCash !== null ? F_CASH : 0) | (r.lives !== null ? F_LIVES : 0);
  w.u(flags);
  w.u(r.map.length);
  for (let i = 0; i < r.map.length; i++) w.u(r.map.charCodeAt(i));
  w.u(DIFFS.indexOf(r.difficulty));
  w.u(r.startRound);
  if (!r.waves) w.u(r.endRound);
  if (r.towers) {
    const ids = towerIds();
    const bytes: number[] = new Array(Math.ceil(ids.length / 7)).fill(0);
    ids.forEach((t, i) => { if (r.towers!.includes(t)) bytes[Math.floor(i / 7)] |= 1 << i % 7; });
    w.u(bytes.length);
    for (const x of bytes) w.u(x);
  }
  w.u(r.hero === 'none' ? 0 : r.hero === 'any' ? 1 : 2 + heroIds().indexOf(r.hero));
  w.u(r.maxTier[0] + 6 * r.maxTier[1] + 36 * r.maxTier[2]);
  if (r.startCash !== null) w.u(r.startCash);
  if (r.lives !== null) w.u(r.lives);
  w.u(r.incomePct);
  w.u(r.hpPct);
  w.u(r.speedPct);
  w.u(r.seed);
  if (r.waves) {
    const ids = enemyIds();
    w.u(r.waves.length);
    for (const rd of r.waves) {
      w.u(rd.length);
      for (const g of rd) {
        w.u(ids.indexOf(g.type));
        w.u(g.n);
        w.u((g.camo ? 1 : 0) | (g.regrow ? 2 : 0) | (g.fortified ? 4 : 0));
        w.u((g.startMs ?? 0) / 100);
        w.u((g.gapMs ?? 500) / 10);
      }
    }
  }
  return w.b;
}

function fromBytes(bytes: number[]): ChallengeRules {
  const rd = new Reader(bytes);
  const flags = rd.u();
  if (flags & ~KNOWN_FLAGS) throw new ChallengeError('This code needs a newer version of the game.');
  const mapLen = rd.u();
  if (mapLen < 1 || mapLen > 32) throw new ChallengeError('This code is damaged.');
  let map = '';
  for (let i = 0; i < mapLen; i++) map += String.fromCharCode(rd.u());
  const di = rd.u();
  if (di > 2) throw new ChallengeError('Unknown difficulty in this code.');
  const startRound = rd.u();
  const endRound = flags & F_WAVES ? startRound : rd.u();
  let towers: TowerType[] | null = null;
  if (flags & F_TOWERS) {
    const ids = towerIds();
    const n = rd.u();
    if (n < 1 || n > 16) throw new ChallengeError('This code is damaged.');
    const set: TowerType[] = [];
    for (let k = 0; k < n; k++) {
      const x = rd.u();
      for (let bit = 0; bit < 7; bit++) {
        if (!(x & (1 << bit))) continue;
        const t = ids[k * 7 + bit];
        if (!t) throw new ChallengeError('This code uses a tower this version does not have.');
        set.push(t);
      }
    }
    towers = set;
  }
  const hv = rd.u();
  let hero: ChallengeRules['hero'] = 'none';
  if (hv === 1) hero = 'any';
  else if (hv >= 2) {
    const id = heroIds()[hv - 2];
    if (!id) throw new ChallengeError('This code uses a hero this version does not have.');
    hero = id;
  }
  const mt = rd.u();
  if (mt >= 216) throw new ChallengeError('This code is damaged.');
  const maxTier: Tiers = [mt % 6, Math.floor(mt / 6) % 6, Math.floor(mt / 36)];
  const startCash = flags & F_CASH ? rd.u() : null;
  const lives = flags & F_LIVES ? rd.u() : null;
  const incomePct = rd.u(), hpPct = rd.u(), speedPct = rd.u(), seed = rd.u();
  let waves: ChallengeGroup[][] | null = null;
  if (flags & F_WAVES) {
    const ids = enemyIds();
    const nw = rd.u();
    if (nw > CHALLENGE_LIMITS.waves) throw new ChallengeError('This code is damaged.');
    waves = [];
    for (let i = 0; i < nw; i++) {
      const ng = rd.u();
      if (ng > CHALLENGE_LIMITS.groups) throw new ChallengeError('This code is damaged.');
      const groups: ChallengeGroup[] = [];
      for (let k = 0; k < ng; k++) {
        const type = ids[rd.u()];
        if (!type) throw new ChallengeError('This code uses an enemy this version does not have.');
        const n = rd.u(), f = rd.u(), startMs = rd.u() * 100, gapMs = rd.u() * 10;
        groups.push({ type, n, ...(f & 1 ? { camo: true } : {}), ...(f & 2 ? { regrow: true } : {}), ...(f & 4 ? { fortified: true } : {}), startMs, gapMs });
      }
      waves.push(groups);
    }
  }
  if (!rd.done) throw new ChallengeError('This code is damaged.');
  return normalizeRules({
    map, difficulty: DIFFS[di], seed, startRound, endRound, towers, hero, maxTier, startCash, lives, incomePct, hpPct, speedPct,
    noSell: !!(flags & F_SELL), noPowers: !!(flags & F_POWERS), noKnowledge: !!(flags & F_KNOW), waves,
  });
}

/** Regeln -> `DW1-XXXXX-XXXXX-...` (Crockford-Base32 in Fuenfergruppen, 16-Bit-Pruefsumme). */
export function encodeChallenge(rules: ChallengeRules): string {
  const r = normalizeRules(rules);
  const bytes = toBytes(r);
  const sum = crc16([...CHALLENGE_PREFIX].map((c) => c.charCodeAt(0)).concat(bytes));
  bytes.push(sum >> 8, sum & 255);
  let bits = 0, acc = 0, s = '';
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) { s += ALPHA[(acc >> (bits - 5)) & 31]; bits -= 5; }
    acc &= (1 << bits) - 1;
  }
  if (bits > 0) s += ALPHA[(acc << (5 - bits)) & 31];
  return `${CHALLENGE_PREFIX}-${s.match(/.{1,5}/g)!.join('-')}`;
}

/** Code -> Regeln. Wirft `ChallengeError` (englisch) bei Tippfehlern, abgeschnittenen, fremden oder neueren Codes. */
export function decodeChallenge(code: string): ChallengeRules {
  const raw = String(code ?? '').trim().toUpperCase().replace(/[\s-]+/g, '');
  if (!raw) throw new ChallengeError('Enter a challenge code.');
  if (!raw.startsWith('DW')) throw new ChallengeError('This is not a Duskwardens challenge code.');
  const ver = raw.slice(0, 3);
  if (ver !== CHALLENGE_PREFIX) {
    if (/^DW\d$/.test(ver)) throw new ChallengeError('This code needs a newer version of the game.');
    throw new ChallengeError('This is not a Duskwardens challenge code.');
  }
  const body = raw.slice(3).replace(/O/g, '0').replace(/[IL]/g, '1');
  const bytes: number[] = [];
  let acc = 0, bits = 0;
  for (const ch of body) {
    const v = ALPHA.indexOf(ch);
    if (v < 0) throw new ChallengeError(`The code contains a character that is not allowed: "${ch}".`);
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) { bytes.push((acc >> (bits - 8)) & 255); bits -= 8; acc &= (1 << bits) - 1; }
  }
  if (acc !== 0) throw new ChallengeError('This code is damaged.');
  if (bytes.length < 4) throw new ChallengeError('This code is too short.');
  const sum = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
  const payload = bytes.slice(0, -2);
  if (crc16([...CHALLENGE_PREFIX].map((c) => c.charCodeAt(0)).concat(payload)) !== sum) throw new ChallengeError('This code has a typo or is cut off (checksum does not match).');
  return fromBytes(payload);
}

/** Wie `decodeChallenge`, aber ohne Ausnahme. */
export function tryDecodeChallenge(code: string): { ok: true; rules: ChallengeRules } | { ok: false; error: string } {
  try { return { ok: true, rules: decodeChallenge(code) }; } catch (e) { return { ok: false, error: e instanceof ChallengeError ? e.message : 'This code is damaged.' }; }
}

/** Link `?challenge=CODE` an eine Basisadresse (ohne bestehende Query). */
export const challengeLink = (code: string, base = ''): string => `${base}?challenge=${encodeURIComponent(code)}`;
/** Code aus einer Query (`?challenge=...`) oder `null`. */
export function challengeFromQuery(search: string): string | null {
  const v = new URLSearchParams(search).get('challenge');
  return v && v.trim() ? v.trim() : null;
}
