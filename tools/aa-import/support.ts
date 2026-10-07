/**
 * Einstufung einer AA-Unit nach dem, was der Baukasten (P1) kann. Gruende und ihre Bedeutung: docs/aa-import/unsupported.md.
 *
 * - `hidden`: keine Stufe greift an (damage, spa, range > 0) und kein Farm-Ertrag: die Unit wuerde platziert und tut nichts
 *   (Buff-/Heil-/Beschwoerer-Units, reine Aktiv-Faehigkeiten). Bleibt im Datensatz, ist aber nicht ziehbar und nicht in der Sammlung.
 * - `limited`: spielbar, aber ein Teil des Kits fehlt (`notes` nennt es).
 * - `full`: alles, was die Daten sagen, wird gerechnet.
 */
export type SupportLevel = 'full' | 'limited' | 'hidden';
export interface Support {
  level: SupportLevel;
  notes: string[];
}

const has = (extra: Record<string, unknown> | null | undefined, ...keys: string[]): boolean => !!extra && keys.some((k) => k in extra);

export function fights(l: { damage?: number | null; spa?: number | null; range?: number | null }): boolean {
  return (l.damage ?? 0) > 0 && (l.spa ?? 0) > 0 && (l.range ?? 0) > 0;
}

export function classify(u: any, attacks: Record<string, unknown>): Support {
  const levels = u.levels as any[];
  const extra = (u.extra ?? null) as Record<string, unknown> | null;
  const fighting = levels.filter(fights);
  const farming = levels.filter((l) => (l.farm ?? 0) > 0);
  const notes: string[] = [];

  if (fighting.length === 0 && farming.length === 0) {
    const why: string[] = [];
    if (has(extra, 'active_attack', 'active_attack_stats', 'show_active_attack')) why.push('nur Aktiv-Faehigkeit');
    if (has(extra, 'spawn_unit', 'spawn_attack', 'spawn_script', 'delayed_spawn', 'max_spawn_units') || levels.some((l) => String(l.attack ?? '').includes('spawn'))) why.push('Beschwoerer ohne eigenen Schaden');
    if (has(extra, 'aura_buff', '_show_as_buff_unit')) why.push('Buff-Aura');
    if (has(extra, 'base_heal_amount')) why.push('Heilung');
    return { level: 'hidden', notes: [`kein Angriff, kein Einkommen (${why.join(', ') || 'Kit nicht modellierbar'})`] };
  }

  if (has(extra, 'active_attack', 'active_attack_stats')) notes.push('active-ability');
  if (has(extra, 'spawn_unit', 'spawn_attack', 'spawn_script', 'delayed_spawn', 'delayed_spawn_attack', 'max_spawn_units', 'max_spawns')) notes.push('summon');
  if (has(extra, 'aura_buff', '_show_as_buff_unit')) notes.push('aura-buff');
  if (has(extra, 'base_heal_amount')) notes.push('heal');
  if (has(extra, 'secondary_attacks', '_attacks')) notes.push('secondary-attack');
  if (has(extra, 'on_kill')) notes.push('on-kill');
  if (has(extra, 'end_of_wave') && !notes.includes('heal')) notes.push('end-of-wave');
  if (has(extra, 'max_path_units')) notes.push('trap-cap');
  if (has(extra, 'shield')) notes.push('unit-shield');
  // Stufen ohne Angriff, obwohl andere angreifen (z. B. Beschwoerer-Stufen): in diesen Stufen tut die Unit nichts
  if (fighting.length > 0 && fighting.length < levels.length && farming.length === 0) notes.push('partial-levels');
  // Angriff ohne Details im Katalog: greift als single an
  if (levels.some((l) => l.attack && (attacks[l.attack] === null || attacks[l.attack] === undefined))) notes.push('attack-details-missing');

  const uniq = [...new Set(notes)];
  return { level: uniq.length ? 'limited' : 'full', notes: uniq };
}

/** Klartext je Notiz fuer den Bericht. */
export const NOTE_TEXT: Record<string, string> = {
  'active-ability': 'Aktive Faehigkeit (Knopf, Cooldown) fehlt; die Unit greift nur normal an',
  summon: 'Beschwoerte Figuren (eigener Koerper) fehlen',
  'aura-buff': 'Buff-Aura fuer Verbuendete fehlt',
  heal: 'Heilung fehlt',
  'secondary-attack': 'Zweiter Angriff (secondary_attacks) fehlt',
  'on-kill': 'Kill-Effekt fehlt',
  'end-of-wave': 'Effekt am Wellenende fehlt',
  'trap-cap': 'Fallen-/Pfad-Obergrenze nicht modelliert',
  'unit-shield': 'Einheiten-Schild fehlt',
  'partial-levels': 'Einzelne Stufen ohne Angriff (Schaden 0 oder ohne SPA)',
  'attack-details-missing': 'Angriff ohne Details in AA: greift als single an',
};
