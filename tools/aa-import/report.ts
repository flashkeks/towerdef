/** Bericht `docs/aa-import/report.md` aus den Import-Ergebnissen (deterministisch, keine Zeitstempel). */
import type { EvoRecipe } from './evolutions';
import { NOTE_TEXT, type Support } from './support';
import type { TraitDef } from './traits';

const RARITIES = ['Rare', 'Epic', 'Legendary', 'Mythic', 'Secret', 'Exclusive'];

export interface ReportInput {
  results: { unit: any; support: Support }[];
  skipped: { id: string; reason: string }[];
  evolutions: { recipes: EvoRecipe[] };
  traits: { traits: TraitDef[] };
  attackCount: number;
  nullAttacks: number;
  /** Kits (Runde 9 / P1): Unit-ID -> wie sie modelliert ist, Art (Fähigkeit/Aura/Beschwörung/Zweitangriff). */
  kits: { id: string; name: string; kinds: string[]; how: string; level: string }[];
  summons: { id: string; name: string; mode: string }[];
}

export function buildReport(i: ReportInput): string {
  const n = i.results.length;
  const lvl = (l: string) => i.results.filter((r) => r.support.level === l);
  const full = lvl('full');
  const limited = lvl('limited');
  const hidden = lvl('hidden');
  const playable = full.length + limited.length;
  const pct = (x: number) => ((x / n) * 100).toFixed(1).replace('.', ',') + ' %';
  const L: string[] = [];
  L.push('# AA-Import: Bericht (Runde 8 / P2, Runde 9 / P1)', '');
  L.push('Erzeugt von `tools/aa-import` (`npm run aa-import`), nicht von Hand pflegen: der Lauf schreibt diese Datei neu. Quelle: `docs/anime-adventures/data/*.json`.', '');
  L.push('## Ergebnis', '');
  L.push(`**${n} Units importiert** nach \`sim/data/units/aa.json\`, **${playable} spielbar (${pct(playable)})**, ${hidden.length} ausgeblendet (${pct(hidden.length)}). Ziel war >= 95 %.`, '');
  L.push('| Stufe | Units | Bedeutung |', '|---|---:|---|');
  L.push(`| voll unterstuetzt (\`full\`) | ${full.length} | alles, was die Daten sagen, wird gerechnet |`);
  L.push(`| mit Einschraenkungen (\`limited\`) | ${limited.length} | spielbar, ein Teil des Kits fehlt (Gruende unten) |`);
  L.push(`| ausgeblendet (\`hidden\`) | ${hidden.length} | kein Angriff und kein Einkommen: nicht ziehbar, nicht in der Sammlung. Datensatz bleibt, Flag \`support: "hidden"\` |`);
  L.push(`| als Beschwoerung | ${i.skipped.length} | AA \`kind: "summon"\`: Wesen mit eigenem Koerper, keine Units; stehen im Katalog \`summons\` von \`aa.json\` (\`format.md\`) |`);
  L.push('', `Das sind ${n + i.skipped.length} Eintraege in \`units.json\` (561): ${n} Units plus ${i.skipped.length} Beschwoerungen. Angriffe: ${i.attackCount} im Katalog der Datei, davon ${i.nullAttacks} ohne Details in AA (\`null\`, greifen als \`single\` an). Katalog \`summons\`: ${i.summons.length} Wesen (${i.summons.map((x) => x.id).join(', ')}).`, '');

  L.push('## Nach Seltenheit', '', '| Seltenheit | importiert | voll | eingeschraenkt | ausgeblendet |', '|---|---:|---:|---:|---:|');
  for (const r of RARITIES) {
    const g = i.results.filter((x) => x.unit.rarity === r);
    const c = (l: string) => g.filter((x) => x.support.level === l).length;
    L.push(`| ${r} | ${g.length} | ${c('full')} | ${c('limited')} | ${c('hidden')} |`);
  }

  L.push('', '## Einschraenkungen (spielbar, aber mit Luecke)', '', '| Grund | Units | Was fehlt |', '|---|---:|---|');
  const counts = new Map<string, number>();
  for (const r of limited) for (const nn of r.support.notes) counts.set(nn, (counts.get(nn) ?? 0) + 1);
  for (const [k, v] of [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) L.push(`| \`${k}\` | ${v} | ${NOTE_TEXT[k] ?? k} |`);
  L.push('', 'Eine Unit kann mehrere Gruende haben. Die Luecken stehen je Unit als `supportNotes` im Datensatz; die Erklaerung der Sim-Seite in `unsupported.md`.', '');

  L.push('## Ausgeblendet', '', '| ID | Name | Seltenheit | Grund |', '|---|---|---|---|');
  for (const r of hidden) L.push(`| \`${r.unit.id}\` | ${r.unit.nameRR} | ${r.unit.rarity} | ${r.support.notes[0]} |`);

  L.push('', '## Kits: Faehigkeiten, Auren, Beschwoerungen, Zweitangriffe (Runde 9 / P1)', '');
  L.push(`${i.kits.length} Units tragen ein Kit aus \`tools/aa-import/kits.ts\` (Namen und Abklingzeiten AA, Wirkung und Staerke DESIGN, siehe \`unsupported.md\`). Zweitangriffe (\`also\`) bekommen ausserdem alle Units, deren AA-Daten mehrere Angriffe fuehren.`, '', '| Unit | Stufe | Art | Modelliert als |', '|---|---|---|---|');
  for (const k of i.kits) L.push(`| \`${k.id}\` | ${k.level} | ${k.kinds.join(', ')} | ${k.how} |`);
  L.push('', '## Felder und Effekte', '');
  L.push('- **Uebernommen** je Unit: `id name rarity placement damageType elements critChance critDamage spawnCap spawnCapGlobal unsellable limited hideFromBanner rateupBannerOnly shinyVariant evolvedFrom`, je Stufe `level cost damage spa range attack farm note`, Angriffe 1:1 (`aoe radius angle width hits dot special`).');
  L.push('- **Entfallen** (Sim kennt sie nicht): `dps dpsWithDot cumulativeCost maxDps totalCost extra meta nameModule nameLegacy inLegacy cooldownField knockbackPoints health speed legacyLevels`. `evolution` wandert in `meta/data/aa/evolutions.json`. `extra` ist der Grund fuer fast alle Einschraenkungen (Aktiv-Faehigkeiten, Beschwoerer, Auren).');
  L.push('- **Effekte:** alle 22 Effekte der Quelle stehen im Katalog `sim/data/effects.json`; `unknownEffects` meldet nichts (Test `aa-import.test.ts`). Parameter-Annahmen: `unsupported.md`.');
  L.push('- **Nicht modelliert** (No-op): Heilung, Kosten-Rabatt-Auren, Kill-Boni, Fallen-Obergrenzen, Einheiten-Schild, Segen/Shiny, `spawnCap` (gelesen, nicht durchgesetzt). Aktiv-Faehigkeiten, Beschwoerungen, Auren und Zweitangriffe sind seit Runde 9 / P1 Teil des Baukastens (Abschnitt Kits).');

  const blocked = i.evolutions.recipes.filter((r) => r.blocked);
  L.push('', '## Evolutionen, Traits', '');
  L.push(`- **Evolutionen:** ${i.evolutions.recipes.length} Rezepte nach \`meta/data/aa/evolutions.json\` (${i.evolutions.recipes.filter((r) => r.to.length > 1).length} mit Zufalls-Ziel). ${blocked.length ? `Gesperrt (\`blocked\`): ${blocked.map((b) => b.from).join(', ')}.` : 'Keins gesperrt.'} AA-Materialien (Star Fruits, Items, Takedowns) werden nicht uebernommen, die Kosten stehen in \`meta/data/evolution-costs.json\` (Gold + Crystals nach Seltenheit).`);
  L.push(`- **Traits:** ${i.traits.traits.length} nach \`meta/data/aa/traits.json\`. Wirkung im Match: Schaden, Reichweite, Tempo (Unit-Mod), Yen nur fuer die genannten Farm-Units. No-op: ${[...new Set(i.traits.traits.flatMap((t) => t.noop ?? []))].join('; ')}.`);
  L.push('');
  return L.join('\n');
}
