/**
 * Anzeige-Daten eines Banners (P3). `bannerView(banner, profile)` liefert alles, was die Summon-UI (P4) zeigen MUSS, bevor man Crystals ausgibt
 * (architecture 7.6 "Anzeige"): Ratentabelle je Stufe, Einzelraten je Unit, Pity-Regeln im Klartext, Pity-Stand, effektive Rate, Erwartungswerte,
 * Ratenversion samt Datei-Hash. Die UI zeigt es nur an, sie rechnet nichts.
 *
 * Quelle ist `resolveBanner(banner)` — dieselbe Struktur, aus der `rollOne` wuerfelt. Aendert sich die Datei, aendern sich Anzeige und Wurf gemeinsam.
 * Texte sind Englisch und direkt anzeigbar (Bausteine, keine Layout-Vorgabe).
 */
import { analyze, expectedPullsToHit, nextPullDist } from './banner-math';
import { batchesUsed, pullCost, resolveBanner, type BannerRates } from './gacha';
import type { Pity, Profile } from './profile';
import type { Rarity } from './catalog';

export const START_VALUES_NOTICE = 'Starting values (round 7), not calibrated. They may change; every change gets a new rates version.';

const label = (r: string): string => r.charAt(0).toUpperCase() + r.slice(1);
const article = (r: string): string => (/^[aeiou]/i.test(r) ? 'an' : 'a');
/** 70 -> "70%", 0.25 -> "0.25%", 1.2812 -> "1.28%" (hoechstens 2 Nachkommastellen, ohne ueberfluessige Nullen) */
export const pctText = (pct: number): string => `${(Math.round(pct * 100) / 100).toString()}%`;
const round3 = (x: number): number => Math.round(x * 1000) / 1000;
const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');
const fmt1 = (n: number): string => (Math.round(n * 10) / 10).toFixed(1);

export interface ViewUnit {
  unitId: string;
  /** Einzelrate pro Zug in Prozent: Stufen-Basisrate x Gewichtsanteil */
  basePct: number;
  baseText: string;
  /** Langzeit-Rate inklusive Pity/Garantie */
  effectivePct: number;
  effectiveText: string;
  featured: boolean;
}
export interface ViewTier {
  rarity: Rarity;
  label: string;
  /** Basisrate laut Datei (nach Umlegen leerer Stufen), in Basispunkten (10000 = 100 %) */
  baseBp: number;
  basePct: number;
  baseText: string;
  /** tatsaechlicher Gesamtanteil auf lange Sicht (Pity/Garantie eingerechnet) */
  effectivePct: number;
  effectiveText: string;
  /** Rate fuer den naechsten Zug beim aktuellen Pity-Stand (100 % beim garantierten Zug) */
  nextPullPct: number;
  nextPullText: string;
  /** `false`: keine Unit dieser Seltenheit im Spiel, Rate wurde umgelegt */
  populated: boolean;
  units: ViewUnit[];
}
export interface ViewPity {
  kind: 'top' | 'mid';
  rarity: Rarity;
  /** true bei `mid`: "Legendary or better" */
  orBetter: boolean;
  /** Zuege seit dem letzten Treffer */
  current: number;
  hardAt: number;
  /** Zuege bis zur Garantie (1 = der naechste Zug ist garantiert) */
  pullsUntilGuarantee: number;
  /** z. B. "Pulls since last Mythic: 37 / 150" */
  text: string;
}
export interface BannerView {
  bannerId: string;
  name: string;
  kind: BannerRates['kind'];
  active: boolean;
  status: 'ok' | 'inactive' | 'limit-reached';
  ratesVersion: string;
  /** Hash der Banner-Datei; steht auch in jeder Ziehung (`PullRecord.ratesHash`) */
  ratesHash: string;
  calibrated: boolean;
  startValuesNotice: string | null;
  prices: { single: number | null; ten: number | null };
  limits: { maxBatches: number; used: number; remaining: number } | null;
  tiers: ViewTier[];
  /** Pity-Regeln im Klartext (ein Satz je Eintrag) */
  rules: string[];
  pity: ViewPity[];
  /** Erwartungswerte; `perTop`/`perMid` auf Pity-Basis exakt berechnet */
  expected: {
    topRarity: Rarity | null;
    pullsPerTop: number | null;
    pullsToNextTop: number | null;
    crystalsPerTop: number | null;
    midRarity: Rarity | null;
    pullsPerMid: number | null;
    pullsToNextMid: number | null;
    /** Durchschnittliche Kristalle je Zug beim Einzelpreis bzw. 10er-Preis */
    crystalsPerPull: { single: number | null; ten: number | null };
    lines: string[];
  };
  featured: { unitId: string; rarity: Rarity; sharePct: number; guaranteeAfterMiss: boolean } | null;
  /** Hinweise, z. B. umgelegte leere Stufen */
  notes: string[];
}

export function bannerView(banner: BannerRates, profile: Profile | null): BannerView {
  const r = resolveBanner(banner);
  const an = analyze(r);
  const stored = profile?.pity[banner.bannerId];
  const pity: Pity = { sinceTop: stored?.sinceTop ?? 0, sinceMid: stored?.sinceMid ?? 0, ...(stored?.guaranteeFeatured !== undefined ? { guaranteeFeatured: stored.guaranteeFeatured } : {}) };
  const next = nextPullDist(r, pity);
  const used = profile ? batchesUsed(profile, banner.bannerId) : 0;
  const limits = banner.limits ? { maxBatches: banner.limits.maxBatches, used, remaining: Math.max(0, banner.limits.maxBatches - used) } : null;
  const status: BannerView['status'] = !banner.active ? 'inactive' : limits && limits.remaining === 0 ? 'limit-reached' : 'ok';

  const tiers: ViewTier[] = r.tiers.map((t, i) => {
    const basePct = t.effBp / 100;
    const effPct = round3(an.tierRate[i]! * 100);
    const nextPct = round3(next[i]! * 100);
    return {
      rarity: t.rarity,
      label: label(t.rarity),
      baseBp: t.effBp,
      basePct,
      baseText: pctText(basePct),
      effectivePct: effPct,
      effectiveText: pctText(effPct),
      nextPullPct: nextPct,
      nextPullText: pctText(nextPct),
      populated: t.total > 0,
      units: t.pool.map((u) => {
        const f = r.featured && r.featured.tierIdx === i && t.pool.length > 1 ? r.featured : null;
        const isF = !!f && f.unitId === u.unitId;
        let baseShare = t.total > 0 ? u.weight / t.total : 0;
        let effShare = baseShare;
        if (f) {
          const s = f.shareBp / 10000;
          // Langzeit-Anteil der Featured-Unit: mit Garantie nach Fehlschlag 1 / (2 - s), sonst s
          const sEff = f.guaranteeAfterMiss ? 1 / (2 - s) : s;
          const restW = t.total - (t.pool.find((x) => x.unitId === f.unitId)?.weight ?? 0);
          baseShare = isF ? s : ((1 - s) * u.weight) / restW;
          effShare = isF ? sEff : ((1 - sEff) * u.weight) / restW;
        }
        const base = basePct * baseShare;
        const eff = effPct * effShare;
        return { unitId: u.unitId, basePct: round3(base), baseText: pctText(base), effectivePct: round3(eff), effectiveText: pctText(eff), featured: r.featured?.unitId === u.unitId && r.featured.tierIdx === i };
      }),
    };
  });

  const rules: string[] = [];
  const pityView: ViewPity[] = [];
  const addPity = (kind: 'top' | 'mid', rule: typeof r.top, current: number): void => {
    if (!rule) return;
    const orBetter = kind === 'mid' || rule.idx < r.tiers.length - 1;
    const name = label(rule.rarity) + (orBetter ? ' or better' : '');
    pityView.push({ kind, rarity: rule.rarity, orBetter, current, hardAt: rule.hardAt, pullsUntilGuarantee: Math.max(1, rule.hardAt - current), text: `Pulls since last ${name}: ${current} / ${rule.hardAt}` });
    rules.push(`Guaranteed ${name} on pull ${rule.hardAt} since your last ${name}. The counter carries over between pulls, 10-pulls and sessions and resets only when you pull ${orBetter ? 'one' : 'a ' + label(rule.rarity)}.`);
  };
  addPity('top', r.top, Math.min(pity.sinceTop, (r.top?.hardAt ?? 1) - 1));
  addPity('mid', r.mid, Math.min(pity.sinceMid, (r.mid?.hardAt ?? 1) - 1));
  if (r.top || r.mid) rules.push('There is no hidden soft pity: the listed rates stay the same until the guaranteed pull.');
  if (r.batch) rules.push(`Every 10-pull contains at least one ${label(r.batch.rarity)} or better (if none dropped, the 10th pull is upgraded).`);
  if (banner.limits) rules.push(banner.limits.maxBatches === 1 ? 'One-time offer: one purchase per profile.' : `Limited offer: ${banner.limits.maxBatches} purchases per profile.`);
  if (r.featured) {
    rules.push(`Featured: ${fmtInt(r.featured.shareBp / 100)}% of ${label(banner.featured!.rarity)} results are the featured unit.` + (r.featured.guaranteeAfterMiss ? ' If you get a different one, your next one is guaranteed to be the featured unit.' : ''));
  }
  rules.push('Duplicates add a copy to that unit (more copies = more stars). No other currency or material is involved.');
  rules.push('Rates are per single pull; each pull is independent apart from the guarantees above.');

  const cSingle = r.counts.includes(1) ? pullCost(banner, 1) : null;
  const cTen = r.counts.includes(10) ? pullCost(banner, 10) : null;
  const perPull = { single: cSingle, ten: cTen !== null ? cTen / 10 : null };
  const bestPerPull = perPull.ten ?? perPull.single;
  const topIdx = r.top?.idx ?? null;
  const midIdx = r.mid?.idx ?? null;
  const rateFrom = (idx: number): number => an.tierRate.slice(idx).reduce((s, x) => s + x, 0);
  const pullsPerTop = topIdx !== null ? 1 / rateFrom(topIdx) : null;
  const pullsPerMid = midIdx !== null ? 1 / rateFrom(midIdx) : null;
  const toTop = expectedPullsToHit(r, 'top', pity);
  const toMid = expectedPullsToHit(r, 'mid', pity);
  const lines: string[] = [];
  if (r.top && pullsPerTop !== null && bestPerPull !== null) {
    const nm = label(r.top.rarity) + (r.top.idx < r.tiers.length - 1 ? ' or better' : '');
    lines.push(`On average 1 ${nm} per ${fmt1(pullsPerTop)} pulls (about ${fmtInt(pullsPerTop * bestPerPull)} Crystals${perPull.ten !== null ? ' when buying 10-pulls' : ''}); never more than ${r.top.hardAt} pulls in a row without one.`);
    if (toTop !== null) lines.push(`From your current counter: about ${fmt1(toTop)} more pulls to the next ${nm}.`);
  }
  if (r.mid && pullsPerMid !== null) {
    const nm = label(r.mid.rarity) + (r.mid.idx < r.tiers.length - 1 ? ' or better' : '');
    lines.push(`On average 1 ${nm} per ${fmt1(pullsPerMid)} pulls; never more than ${r.mid.hardAt} pulls in a row without one.`);
  }
  if (r.batch && an.upgradeChance !== null) lines.push(`About ${pctText(an.upgradeChance * 100)} of 10-pulls need the guarantee to reach ${article(r.batch.rarity)} ${label(r.batch.rarity)} or better.`);
  if (r.featured && banner.featured) {
    const s = r.featured.shareBp / 10000;
    const mythics = r.featured.guaranteeAfterMiss ? 1 + (1 - s) : 1 / s;
    if (pullsPerTop !== null) lines.push(`On average about ${fmt1(mythics * pullsPerTop)} pulls per featured unit.`);
  }

  const notes: string[] = [];
  for (const d of r.redirected) notes.push(`No ${label(d.from)} units are available yet, so the ${pctText(d.bp / 100)} for ${label(d.from)} goes to ${label(d.to)}.`);
  if (banner.tiers.some((t) => t.rarity === banner.pity.top?.rarity) && banner.pity.top && !r.top) notes.push(`The ${label(banner.pity.top.rarity)} guarantee is off because that rarity has no units yet.`);
  if (banner.pity.mid && !r.mid) notes.push(`The ${label(banner.pity.mid.rarity)} guarantee is off because that rarity has no units yet.`);

  return {
    bannerId: banner.bannerId,
    name: banner.name,
    kind: banner.kind,
    active: banner.active,
    status,
    ratesVersion: banner.ratesVersion,
    ratesHash: r.hash,
    calibrated: banner.calibrated,
    startValuesNotice: banner.calibrated ? null : START_VALUES_NOTICE,
    prices: { single: cSingle, ten: cTen },
    limits,
    tiers,
    rules,
    pity: pityView,
    expected: {
      topRarity: r.top?.rarity ?? null,
      pullsPerTop: pullsPerTop !== null ? round3(pullsPerTop) : null,
      pullsToNextTop: toTop !== null ? round3(toTop) : null,
      crystalsPerTop: pullsPerTop !== null && bestPerPull !== null ? Math.round(pullsPerTop * bestPerPull) : null,
      midRarity: r.mid?.rarity ?? null,
      pullsPerMid: pullsPerMid !== null ? round3(pullsPerMid) : null,
      pullsToNextMid: toMid !== null ? round3(toMid) : null,
      crystalsPerPull: perPull,
      lines,
    },
    featured: r.featured && banner.featured ? { unitId: r.featured.unitId, rarity: banner.featured.rarity, sharePct: r.featured.shareBp / 100, guaranteeAfterMiss: r.featured.guaranteeAfterMiss } : null,
    notes,
  };
}
