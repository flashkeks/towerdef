/**
 * Zuordnungstabelle AA-Unit -> echte Figur (Runde 10 / P1), Quelle: `docs/aa-import/figuren.json`.
 * Von Hand gepflegt (anders als aa.json). Der Importer baut daraus das Bild-Manifest und bricht ab, wenn die Tabelle nicht stimmt.
 */
import { readFileSync } from 'node:fs';

export interface Figur {
  id: string;
  /** Name der Unit in AA (`nameRR`), nur noch in den Daten sichtbar */
  aaName: string;
  /** echter Name, wie Fans ihn kennen (AniList-Schreibweise) */
  name: string;
  series: string;
  /** Form derselben Figur ("Super Saiyan Blue", "Gear 4 (Boundman)") */
  form?: string;
  /** Suchbegriff fuer AniList; leer bei Crossover-Figuren (die haben `imageQuery`) */
  anilistQuery: string;
  /** nur Crossover: Wikipedia-Suchhinweis */
  imageQuery?: string;
  /** "umgemünzt von …", "unsicher" */
  note?: string;
}

export function loadFiguren(path: string): Figur[] {
  return JSON.parse(readFileSync(path, 'utf8')).figuren as Figur[];
}

/** Liefert Fehlertexte (leer = in Ordnung). `begruendet` = (name, form)-Paare, die doppelt vorkommen duerfen. */
export function checkFiguren(figuren: Figur[], aaIds: string[], crossoverIds: string[]): string[] {
  const errs: string[] = [];
  const want = [...aaIds, ...crossoverIds];
  const seen = new Set<string>();
  for (const f of figuren) {
    if (seen.has(f.id)) errs.push(`doppelte ID: ${f.id}`);
    seen.add(f.id);
  }
  for (const id of want) if (!seen.has(id)) errs.push(`fehlt: ${id}`);
  const wantSet = new Set(want);
  for (const f of figuren) if (!wantSet.has(f.id)) errs.push(`unbekannte ID: ${f.id}`);
  const cross = new Set(crossoverIds);
  const pair = new Map<string, string>();
  for (const f of figuren) {
    if (!f.name?.trim() || !f.series?.trim()) errs.push(`Name/Serie leer: ${f.id}`);
    if (cross.has(f.id)) {
      if (!f.imageQuery) errs.push(`Crossover ohne imageQuery: ${f.id}`);
    } else if (!f.anilistQuery?.trim()) errs.push(`anilistQuery leer: ${f.id}`);
    const key = `${f.name}\u0000${f.form ?? ''}`;
    const prev = pair.get(key);
    if (prev) errs.push(`gleiche (name, form) bei ${prev} und ${f.id}: ${f.name} / ${f.form ?? '-'}`);
    else pair.set(key, f.id);
  }
  return errs;
}
