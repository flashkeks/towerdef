/**
 * AA-Importer (Runde 8 / P2). Liest `docs/anime-adventures/data/*.json` und schreibt, wiederholbar und deterministisch:
 *
 *   sim/data/units/aa.json           alle importierbaren Units + ihr Angriffs-Katalog (Format: docs/aa-import/format.md)
 *   meta/data/aa/evolutions.json     Evolutionsrezepte (items.json -> evolutionRecipes), reduziert auf das, was Meta braucht
 *   meta/data/aa/traits.json         die 12 Traits, in Basispunkten, mit Wurf-Gewichten und Stufen
 *   client/public/aa/manifest.json   Bild-Manifest (Name, Serie, anilistQuery aus docs/aa-import/figuren.json + Wiki-Rueckfall + Pfad je Unit-ID; Crossover-Figuren mit source "custom" + imageQuery)
 *   docs/aa-import/report.md         Bericht: voll / mit Einschraenkungen / ausgeblendet, Gruende
 *
 * Aufruf: `npm run aa-import` im Repo-Wurzelverzeichnis (= `cd sim && npx tsx ../tools/aa-import/index.ts`).
 * `--check` schreibt nichts und meldet nur, ob die Dateien auf dem Stand der Quelle sind (Exit 1 sonst).
 *
 * Nichts wird umgerechnet: Yen, Schaden, SPA und Studs bleiben AA-Zahlen (docs/aa-import/massstab.md).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UnitFileSchema } from '../../sim/src/data/schema';
import { buildEvolutions } from './evolutions';
import { checkFiguren, loadFiguren } from './figuren';
import { buildManifest } from './manifest';
import { buildReport } from './report';
import { ATTACK_FX, COSMETIC_SPAWN, KIT_ATTACKS, KITS, ROTATION_EXTRA, SUMMONS } from './kits';
import { classify, type Support } from './support';
import { buildTraits } from './traits';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = resolve(ROOT, 'docs/anime-adventures/data');
const read = (f: string): any => JSON.parse(readFileSync(resolve(SRC, f), 'utf8'));

/** Felder, die ein Unit-Datensatz aus AA uebernimmt (alles andere - dps, cumulativeCost, extra, meta ... - entfaellt). */
const UNIT_KEYS = ['id', 'name', 'rarity', 'placement', 'damageType', 'elements', 'critChance', 'critDamage', 'spawnCap', 'spawnCapGlobal', 'unsellable', 'limited', 'hideFromBanner', 'rateupBannerOnly', 'shinyVariant', 'evolvedFrom'] as const;
const LEVEL_KEYS = ['level', 'cost', 'damage', 'spa', 'range', 'attack', 'farm', 'note'] as const;

const clean = (o: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''));

/** Eine Unit pro Zeile: Datei bleibt diff-freundlich und klein (kein Einrueckungs-Ballast). */
function stringifyUnitFile(f: { ref: string; units: unknown[]; attacks: Record<string, unknown>; summons: Record<string, unknown> }): string {
  const lines: string[] = ['{', `"ref": ${JSON.stringify(f.ref)},`, '"units": ['];
  f.units.forEach((u, i) => lines.push(JSON.stringify(u) + (i < f.units.length - 1 ? ',' : '')));
  lines.push('],', '"attacks": {');
  const ids = Object.keys(f.attacks);
  ids.forEach((id, i) => lines.push(`${JSON.stringify(id)}: ${JSON.stringify(f.attacks[id])}${i < ids.length - 1 ? ',' : ''}`));
  lines.push('},', '"summons": {');
  const sids = Object.keys(f.summons);
  sids.forEach((id, i) => lines.push(`${JSON.stringify(id)}: ${JSON.stringify(f.summons[id])}${i < sids.length - 1 ? ',' : ''}`));
  lines.push('}', '}', '');
  return lines.join('\n');
}

const has2 = (extra: Record<string, unknown> | null | undefined, ...keys: string[]): boolean => !!extra && keys.some((k) => k in extra);
const asList = (v: unknown): unknown[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/** Kit-Angriffe, die irgendein Kit (Fähigkeit, Beschwörung) nennt. */
function usedByKits(id: string): boolean {
  const abil = Object.values(KITS).flatMap((k) => k.abilities ?? []);
  return abil.some((a) => a.attack === id) || Object.values(SUMMONS).some((sm) => sm.attack === id || sm.endAttack === id);
}

/**
 * Zweitangriffe (Runde 9 / P1): wer in AA mehrere Angriffe führt, wechselt zwischen ihnen. Je Stufe laufen die bisher freigeschalteten Angriffe
 * (`also`) neben dem Angriff der Stufe im Wechsel mit; `always` (AA `secondary_attacks`) läuft von Stufe 0 an mit.
 * `also` wird nur geschrieben, wenn es sich gegenüber der Vorstufe ändert (die Sim erbt es).
 */
function addRotation(levels: Record<string, unknown>[], raw: any[], always: string[], used: Set<string>): void {
  const seen: string[] = [];
  let prev = '';
  let cur: string | null = null;
  raw.forEach((l, k) => {
    if (l.attack) cur = l.attack;
    if (cur && !seen.includes(cur)) seen.push(cur);
    const also = [...new Set([...always, ...seen.filter((a) => a !== cur)])].filter((a) => a !== cur);
    const key = JSON.stringify(also);
    if (key !== prev && (also.length > 0 || prev !== '')) levels[k].also = also;
    prev = key;
    for (const a of also) used.add(a);
  });
}

export interface ImportedUnit {
  id: string;
  name: string;
  rarity: string;
  support: Support;
}

function main(): void {
  const check = process.argv.includes('--check');
  const raw = read('units.json');
  const all = raw.units as any[];
  const attacksRaw = raw.attacks as Record<string, unknown>;

  const figuren = loadFiguren(resolve(ROOT, 'docs/aa-import/figuren.json'));
  const figById = new Map(figuren.map((f) => [f.id, f]));
  const units: Record<string, unknown>[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const usedAttacks = new Set<string>();
  const results: { unit: any; support: Support }[] = [];

  for (const u of all) {
    if (u.kind !== 'unit') {
      skipped.push({ id: u.id, reason: `kind=${u.kind} (Beschwoerung mit eigenem Koerper, keine Unit)` });
      continue;
    }
    const kit = KITS[u.id];
    const flaggedRotation = ROTATION_EXTRA.has(u.id) || has2(u.extra, 'secondary_attacks', '_attacks');
    const support = classify(u, attacksRaw, {
      active: !!(kit?.abilities?.length || kit?.aura),
      handles: kit?.handles,
      leaves: kit?.leaves,
      cosmetic: COSMETIC_SPAWN.has(u.id),
      rotation: flaggedRotation || !!kit?.alsoAlways,
    });
    results.push({ unit: u, support });
    const rec: Record<string, unknown> = {};
    for (const k of UNIT_KEYS) {
      const src = k === 'name' ? (figById.get(u.id)?.name ?? u.nameRR) : k === 'elements' ? u.secondaryDamageTypes : u[k];
      if (src === null || src === undefined) continue;
      if (k === 'elements' && Array.isArray(src) && src.length === 0) continue;
      if (k === 'damageType') {
        const dt = src === 'true_damage' ? 'true' : src;
        if (dt !== 'physical') rec[k] = dt;
        continue;
      }
      if ((k === 'limited' || k === 'hideFromBanner' || k === 'rateupBannerOnly' || k === 'shinyVariant' || k === 'unsellable' || k === 'spawnCapGlobal') && src === false) continue;
      rec[k] = src;
    }
    // Runde 10 / P1: echter Name, Serie, Form aus figuren.json (der AA-Name steht dort als `aaName`); Werte/Kits unveraendert
    const fig = figById.get(u.id);
    if (fig) {
      rec.series = fig.series;
      if (fig.form) rec.form = fig.form;
    }
    rec.support = support.level;
    if (support.notes.length) rec.supportNotes = support.notes;
    rec.levels = (u.levels as any[]).map((l) => {
      const o: Record<string, unknown> = {};
      for (const k of LEVEL_KEYS) if (l[k] !== null && l[k] !== undefined && l[k] !== '') o[k] = l[k];
      if (l.level > 0 && o.attack === (u.levels[l.level - 1] as any).attack) delete o.attack; // erbt vom Vorwert
      return o;
    });
    for (const l of u.levels as any[]) if (l.attack) usedAttacks.add(l.attack);
    if (flaggedRotation || kit?.alsoAlways) addRotation(rec.levels as Record<string, unknown>[], u.levels as any[], kit?.alsoAlways ?? [], usedAttacks);
    if (kit?.abilities) {
      rec.abilities = kit.abilities;
      for (const a of kit.abilities) if (typeof a.attack === 'string') usedAttacks.add(a.attack);
    }
    if (kit?.aura) rec.aura = kit.aura;
    units.push(rec);
  }

  // Beschwörungen (Kits) brauchen ihre Angriffe im Katalog
  for (const sm of Object.values(SUMMONS)) for (const k of ['attack', 'endAttack'] as const) if (typeof sm[k] === 'string') usedAttacks.add(sm[k] as string);
  const attacks: Record<string, unknown> = {};
  for (const id of [...usedAttacks].sort()) {
    const a = KIT_ATTACKS[id] ?? attacksRaw[id];
    const base = a === undefined || a === null ? null : clean(a as Record<string, unknown>);
    const fx = ATTACK_FX[id];
    attacks[id] = base && fx ? { ...base, special: [...asList(base.special), ...asList(fx)] } : base;
  }
  for (const [id, a] of Object.entries(KIT_ATTACKS)) if (!(id in attacks) && usedByKits(id)) attacks[id] = a;

  const file = { ref: 'Runde 8 / P2, Runde 9 / P1: tools/aa-import aus docs/anime-adventures/data/units.json (S65/S66/S67) plus Kits (tools/aa-import/kits.ts: Faehigkeiten, Auren, Beschwoerungen). Nicht von Hand aendern, `npm run aa-import` schreibt die Datei neu.', units, attacks, summons: SUMMONS };
  // Selbsttest: die Datei muss das P1-Schema ohne Umformung bestehen
  UnitFileSchema.parse(JSON.parse(stringifyUnitFile(file)));

  const supportById = new Map(results.map((r) => [r.unit.id as string, r.support.level]));
  const evolutions = buildEvolutions(read('items.json'), new Set(units.map((u) => u.id as string)), (id) => supportById.get(id));
  const traits = buildTraits(read('traits.json'));
  // Eigene Figuren (Crossover Runde 8, Legends of Earth Runde 10): kein AniList-Bild, Bild per Wikipedia (`imageQuery`)
  const customUnits = (rel: string): any[] => (existsSync(resolve(ROOT, rel)) ? (JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8')).units as any[]) : []);
  const crossover = [...customUnits('sim/data/units/crossover.json'), ...customUnits('sim/data/units/legends.json')];
  const figErrs = checkFiguren(figuren, units.map((u) => u.id as string), crossover.map((u) => u.id as string));
  if (figErrs.length) {
    console.error(`docs/aa-import/figuren.json stimmt nicht:\n  ${figErrs.join('\n  ')}`);
    process.exit(1);
  }
  const manifest = buildManifest(results.map((r) => r.unit), crossover, figuren);
  const kitRows = units
    .filter((u) => KITS[u.id as string] || (u.levels as any[]).some((l) => l.also))
    .map((u) => {
      const k = KITS[u.id as string];
      const kinds: string[] = [];
      if ((u.abilities as any[] | undefined)?.some((a) => a.trigger !== 'auto' && !('summon' in a && a.trigger === 'auto'))) kinds.push('Knopf');
      if ((u.abilities as any[] | undefined)?.some((a) => a.summon)) kinds.push('Beschwoerung');
      if ((u.abilities as any[] | undefined)?.some((a) => a.trigger === 'auto' && !a.summon)) kinds.push('automatisch');
      if (u.aura) kinds.push('Aura');
      if ((u.levels as any[]).some((l) => l.also)) kinds.push('Zweitangriff');
      return { id: u.id as string, name: u.name as string, kinds: [...new Set(kinds)], how: k?.how ?? 'Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe)', level: u.support as string };
    });
  const report = buildReport({
    results,
    skipped,
    evolutions,
    traits,
    attackCount: Object.keys(attacks).length,
    nullAttacks: Object.values(attacks).filter((a) => a === null).length,
    kits: kitRows,
    summons: Object.entries(SUMMONS).map(([id, s]) => ({ id, name: s.name as string, mode: s.mode as string })),
  });

  const out: [string, string][] = [
    ['sim/data/units/aa.json', stringifyUnitFile(file)],
    ['meta/data/aa/evolutions.json', JSON.stringify(evolutions, null, 1) + '\n'],
    ['meta/data/aa/traits.json', JSON.stringify(traits, null, 1) + '\n'],
    ['client/public/aa/manifest.json', JSON.stringify(manifest, null, 0).replace(/\},"/g, '},\n"') + '\n'],
    ['docs/aa-import/report.md', report],
  ];
  let stale = 0;
  for (const [rel, text] of out) {
    const p = resolve(ROOT, rel);
    if (check) {
      if (!existsSync(p) || readFileSync(p, 'utf8') !== text) {
        console.log(`veraltet: ${rel}`);
        stale++;
      }
      continue;
    }
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
    console.log(`geschrieben: ${rel} (${(text.length / 1024).toFixed(0)} KB)`);
  }
  const by = { full: 0, limited: 0, hidden: 0 };
  for (const r of results) by[r.support.level]++;
  console.log(`Units: ${units.length} (voll ${by.full}, eingeschraenkt ${by.limited}, ausgeblendet ${by.hidden}), uebersprungen ${skipped.length}, Angriffe ${Object.keys(attacks).length}`);
  if (check && stale) process.exit(1);
}

main();
