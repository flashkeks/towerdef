/**
 * AA-Importer (Runde 8 / P2). Liest `docs/anime-adventures/data/*.json` und schreibt, wiederholbar und deterministisch:
 *
 *   sim/data/units/aa.json           alle importierbaren Units + ihr Angriffs-Katalog (Format: docs/aa-import/format.md)
 *   meta/data/aa/evolutions.json     Evolutionsrezepte (items.json -> evolutionRecipes), reduziert auf das, was Meta braucht
 *   meta/data/aa/traits.json         die 12 Traits, in Basispunkten, mit Wurf-Gewichten und Stufen
 *   client/public/aa/manifest.json   Bild-Manifest (Wiki-Dateiname + Pfad je Unit-ID)
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
import { buildManifest } from './manifest';
import { buildReport } from './report';
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
function stringifyUnitFile(f: { ref: string; units: unknown[]; attacks: Record<string, unknown> }): string {
  const lines: string[] = ['{', `"ref": ${JSON.stringify(f.ref)},`, '"units": ['];
  f.units.forEach((u, i) => lines.push(JSON.stringify(u) + (i < f.units.length - 1 ? ',' : '')));
  lines.push('],', '"attacks": {');
  const ids = Object.keys(f.attacks);
  ids.forEach((id, i) => lines.push(`${JSON.stringify(id)}: ${JSON.stringify(f.attacks[id])}${i < ids.length - 1 ? ',' : ''}`));
  lines.push('}', '}', '');
  return lines.join('\n');
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

  const units: Record<string, unknown>[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const usedAttacks = new Set<string>();
  const results: { unit: any; support: Support }[] = [];

  for (const u of all) {
    if (u.kind !== 'unit') {
      skipped.push({ id: u.id, reason: `kind=${u.kind} (Beschwoerung mit eigenem Koerper, keine Unit)` });
      continue;
    }
    const support = classify(u, attacksRaw);
    results.push({ unit: u, support });
    const rec: Record<string, unknown> = {};
    for (const k of UNIT_KEYS) {
      const src = k === 'name' ? u.nameRR : k === 'elements' ? u.secondaryDamageTypes : u[k];
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
    rec.support = support.level;
    if (support.notes.length) rec.supportNotes = support.notes;
    rec.levels = (u.levels as any[]).map((l) => {
      const o: Record<string, unknown> = {};
      for (const k of LEVEL_KEYS) if (l[k] !== null && l[k] !== undefined && l[k] !== '') o[k] = l[k];
      if (l.level > 0 && o.attack === (u.levels[l.level - 1] as any).attack) delete o.attack; // erbt vom Vorwert
      return o;
    });
    for (const l of u.levels as any[]) if (l.attack) usedAttacks.add(l.attack);
    units.push(rec);
  }

  const attacks: Record<string, unknown> = {};
  for (const id of [...usedAttacks].sort()) {
    const a = attacksRaw[id];
    attacks[id] = a === undefined || a === null ? null : clean(a as Record<string, unknown>);
  }

  const file = { ref: 'Runde 8 / P2: tools/aa-import aus docs/anime-adventures/data/units.json (S65/S66/S67). Nicht von Hand aendern, `npm run aa-import` schreibt die Datei neu.', units, attacks };
  // Selbsttest: die Datei muss das P1-Schema ohne Umformung bestehen
  UnitFileSchema.parse(JSON.parse(stringifyUnitFile(file)));

  const supportById = new Map(results.map((r) => [r.unit.id as string, r.support.level]));
  const evolutions = buildEvolutions(read('items.json'), new Set(units.map((u) => u.id as string)), (id) => supportById.get(id));
  const traits = buildTraits(read('traits.json'));
  const manifest = buildManifest(results.map((r) => r.unit));
  const report = buildReport({ results, skipped, evolutions, traits, attackCount: Object.keys(attacks).length, nullAttacks: Object.values(attacks).filter((a) => a === null).length });

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
