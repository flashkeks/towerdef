/**
 * Crossover-Werkzeug (Runde 8 / P6).
 *
 *   npm run crossover                  schreibt sim/data/units/crossover.json (aus crossover-spec.ts + Median-Kurven der AA-Units)
 *                                      und ergaenzt client/public/aa/manifest.json laeuft ueber `npm run aa-import`
 *   npm run crossover:check            schreibt nichts: Datei == Spec? Jeder Wert im AA-Band P5..P95 der Seltenheit? Exit 1 sonst
 *   npm run crossover:vorlage RARITY   druckt die Median-Stufenkurve einer Seltenheit (Rare Epic Legendary Mythic Secret) als Vorlage
 *
 * Das Band wird gegen die tatsaechliche Datei geprueft, auch fuer von Hand ergaenzte Figuren (docs/aa-import/neue-unit.md).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { UnitFileSchema } from '../../sim/src/data/schema';
import { FIGURES, type Figure } from './crossover-spec';
import { LEGENDS } from './legends-spec';
import { fileURLToPath } from 'node:url';
import { FIELDS, VORLAGE_RARITIES, bandErrors, buildVorlagen, type RawUnit, type Vorlage } from './vorlage';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readUnits = (rel: string): { units: RawUnit[]; attacks: Record<string, unknown> } => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));

/** Zwei Figuren-Saetze, gleiches Werkzeug: Crossover (Runde 8, `source: "custom"`) und Legends of Earth (Runde 10, `source: "legends"`, Flag `--legends`). */
const SETS = {
  crossover: { out: 'sim/data/units/crossover.json', figures: FIGURES, source: 'custom', ref: 'Runde 8 / P6: Crossover-Figuren (Pop-Kultur, Memes). Quelle tools/aa-import/crossover-spec.ts, Werte aus der Median-Stufenkurve je Seltenheit (tools/aa-import/vorlage.ts). Neue Figuren: docs/aa-import/neue-unit.md.' },
  legends: { out: 'sim/data/units/legends.json', figures: LEGENDS, source: 'legends', ref: 'Runde 10 / P1: Legends of Earth (Promis und Internet-Groessen, Banner `legends`). Quelle tools/aa-import/legends-spec.ts, Werte aus der Median-Stufenkurve je Seltenheit (tools/aa-import/vorlage.ts). Anleitung: docs/aa-import/neue-unit.md.' },
} as const;
type SetName = keyof typeof SETS;
const FIGUREN = JSON.parse(readFileSync(resolve(ROOT, 'docs/aa-import/figuren.json'), 'utf8')).figuren as { id: string; name: string; series: string }[];
const round = (v: number, step: number): number => Math.round(v / step) * step;
const clean = (n: number): number => Number(n.toFixed(4));

function levelValues(f: Figure, v: Vorlage, i: number): { cost: number; damage: number; spa: number; range: number } {
  const m = v.median[i]!;
  const small = f.rarity === 'Rare' || f.rarity === 'Epic';
  return {
    cost: round(m.cost * (f.cost ?? 1), 25),
    damage: clean(Math.max(small ? 0.5 : 5, round(m.damage * f.dmg, small ? 0.5 : 5))),
    spa: clean(Math.max(0.25, round(m.spa * f.spa, 0.25))),
    range: Math.max(1, Math.round(m.range * f.range)),
  };
}

export function buildFile(set: SetName = 'crossover'): { ref: string; units: Record<string, unknown>[]; attacks: Record<string, unknown>; summons: Record<string, unknown> } {
  const { figures, source, ref } = SETS[set];
  const aa = readUnits('sim/data/units/aa.json');
  const vorlagen = buildVorlagen(aa.units);
  const attacks: Record<string, unknown> = {};
  const summons: Record<string, unknown> = {};
  const units = figures.map((f) => {
    const v = vorlagen[f.rarity]!;
    const stages = [...f.stages].sort((a, b) => a.from - b.from);
    if (stages[0]!.from !== 0) throw new Error(`${f.id}: erste Stufe muss bei 0 beginnen`);
    for (const s of stages) attacks[`${f.id}:${s.key}`] = s.attack;
    for (const [id, a] of Object.entries(f.extraAttacks ?? {})) attacks[id] = a;
    for (const [id, sm] of Object.entries(f.summons ?? {})) summons[id] = sm;
    const levels = Array.from({ length: v.levels }, (_, i) => {
      const l: Record<string, unknown> = { level: i, ...levelValues(f, v, i) };
      const st = stages.find((s) => s.from === i);
      if (st) {
        l.attack = `${f.id}:${st.key}`;
        l.note = st.title;
      }
      return l;
    });
    const fig = FIGUREN.find((x) => x.id === f.id);
    if (!fig) throw new Error(`figuren.json: kein Eintrag fuer ${f.id}`);
    if (fig.name !== f.name) throw new Error(`${f.id}: Name in figuren.json (${fig.name}) weicht von der Spec (${f.name}) ab`);
    const u: Record<string, unknown> = { id: f.id, name: f.name, series: fig.series, rarity: f.rarity, placement: f.placement };
    if (f.damageType) u.damageType = f.damageType;
    if (f.elements) u.elements = f.elements;
    if (f.critChance) u.critChance = f.critChance;
    if (f.critDamage) u.critDamage = f.critDamage;
    if (f.footprint) u.footprint = f.footprint;
    if (f.hitsAir) u.hitsAir = true;
    u.flavor = f.flavor;
    u.imageQuery = f.imageQuery;
    u.source = source;
    if (f.abilities) u.abilities = f.abilities;
    if (f.aura) u.aura = f.aura;
    u.levels = levels;
    return u;
  });
  return { ref, units, attacks, summons };
}

export function stringify(f: ReturnType<typeof buildFile>): string {
  const lines: string[] = ['{', `"ref": ${JSON.stringify(f.ref)},`, '"units": ['];
  f.units.forEach((u, i) => lines.push(JSON.stringify(u) + (i < f.units.length - 1 ? ',' : '')));
  lines.push('],', '"attacks": {');
  const ids = Object.keys(f.attacks);
  ids.forEach((id, i) => lines.push(`${JSON.stringify(id)}: ${JSON.stringify(f.attacks[id])}${i < ids.length - 1 ? ',' : ''}`));
  const sids = Object.keys(f.summons);
  if (sids.length) {
    lines.push('},', '"summons": {');
    sids.forEach((id, i) => lines.push(`${JSON.stringify(id)}: ${JSON.stringify(f.summons[id])}${i < sids.length - 1 ? ',' : ''}`));
  }
  lines.push('}', '}', '');
  return lines.join('\n');
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--vorlage')) {
    const rarity = VORLAGE_RARITIES.find((r) => r.toLowerCase() === (args.find((a) => !a.startsWith('--')) ?? '').toLowerCase());
    if (!rarity) {
      console.error(`Seltenheit angeben: ${VORLAGE_RARITIES.join(' ')}`);
      process.exit(2);
    }
    const v = buildVorlagen(readUnits('sim/data/units/aa.json').units)[rarity]!;
    console.log(`// ${rarity}: ${v.levels} Stufen, Median aus ${v.samples} AA-Units (Band P5..P95 in Klammern)`);
    console.log(JSON.stringify(v.median.map((m, i) => ({ level: i, cost: m.cost, damage: m.damage, spa: m.spa, range: m.range, band: Object.fromEntries(FIELDS.map((k) => [k, v.band[i]![k].map((x) => Number(x.toFixed(2)))])) })), null, 1));
    return;
  }
  const set: SetName = args.includes('--legends') ? 'legends' : 'crossover';
  const OUT = SETS[set].out;
  const file = buildFile(set);
  const text = stringify(file);
  UnitFileSchema.parse(JSON.parse(text)); // Selbsttest: P1-Schema ohne Umformung
  const p = resolve(ROOT, OUT);
  if (args.includes('--check')) {
    let bad = 0;
    if (!existsSync(p) || readFileSync(p, 'utf8') !== text) {
      console.log(`veraltet (weicht von crossover-spec.ts ab; von Hand ergaenzt? dann nur das Band pruefen): ${OUT}`);
      bad++;
    }
    const actual = existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as { units: RawUnit[] }) : { units: [] };
    const errs = bandErrors(actual.units, buildVorlagen(readUnits('sim/data/units/aa.json').units));
    for (const e of errs) console.log(e);
    console.log(`${actual.units.length} ${set}-Figuren, ${errs.length} Band-Verstoesse`);
    if (bad || errs.length) process.exit(1);
    return;
  }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
  console.log(`geschrieben: ${OUT} (${file.units.length} Figuren, ${Object.keys(file.attacks).length} Angriffe)`);
}

main();
