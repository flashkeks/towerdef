/**
 * Bild-Manifest: je Unit-ID der echte Name, die Serie und der AniList-Suchbegriff (`anilistQuery`, Runde 10 / P1, aus
 * `docs/aa-import/figuren.json`), dazu als Rueckfall der Dateiname im AA-Wiki (`nameRR` mit `_`, `.png`), die Shiny-Variante
 * und der Pfad, unter dem die Preview das verkleinerte Bild ausliefert. Crossover-Figuren tragen `source: "custom"` und `imageQuery`.
 * Die Bilder holt die Homelab-Seite (run.md Abschnitt 4); dieses Manifest ist ihre Vorgabe.
 */
import type { Figur } from './figuren';

export interface ManifestEntry {
  /** echter Name der Figur (Anzeige) */
  name: string;
  /** Serie der Figur (Anzeige, Filter) */
  series: string;
  /** Form derselben Figur ("Super Saiyan Blue"), falls es eine ist */
  form?: string;
  rarity: string;
  /** Suchbegriff fuer AniList (nur `source: "anilist"`) */
  anilistQuery?: string;
  /** Rueckfall: erwarteter Dateiname im AA-Wiki (nur `source: "anilist"`, Roblox-Bild, nur im Notfall) */
  wiki?: string;
  /** Suchhinweis fuer die Bild-Beschaffung (nur `source: "custom"`, Crossover P6) */
  imageQuery?: string;
  /** Shiny-Datei, falls die Unit eine Shiny-Variante hat */
  wikiShiny?: string;
  /** Auslieferungspfad der Preview (256 x 256, transparent) */
  path: string;
  source: 'anilist' | 'custom';
}

/** `Sword Queen (Knight)` -> `Sword_Queen_(Knight).png` */
export const wikiFile = (name: string, suffix = ''): string => `${name.trim().replace(/\s+/g, '_')}${suffix}.png`;

export function buildManifest(units: any[], custom: any[], figuren: Figur[]): { ref: string; units: Record<string, ManifestEntry> } {
  const byId = new Map(figuren.map((f) => [f.id, f]));
  const out: Record<string, ManifestEntry> = {};
  for (const u of units) {
    const f = byId.get(u.id);
    if (!f) throw new Error(`figuren.json: kein Eintrag fuer ${u.id}`);
    const e: ManifestEntry = { name: f.name, series: f.series, ...(f.form ? { form: f.form } : {}), rarity: u.rarity, anilistQuery: f.anilistQuery, wiki: wikiFile(u.nameRR), path: `/aa/units/${u.id}.webp`, source: 'anilist' };
    if (u.shinyVariant) e.wikiShiny = wikiFile(u.nameRR, '_(Shiny)');
    out[u.id] = e;
  }
  // Crossover-Figuren (sim/data/units/crossover.json): kein AniList-Bild, stattdessen Suchhinweis (Wikipedia)
  for (const u of custom) {
    const f = byId.get(u.id);
    if (!f) throw new Error(`figuren.json: kein Eintrag fuer ${u.id}`);
    out[u.id] = { name: u.name, series: f.series, rarity: u.rarity, imageQuery: u.imageQuery, path: `/aa/units/${u.id}.webp`, source: 'custom' };
  }
  return { ref: 'Runde 10 / P1, erzeugt von tools/aa-import aus docs/aa-import/figuren.json. Vorgabe fuer die Bild-Beschaffung (Homelab): AniList-Suche per anilistQuery (source "anilist"), Wikipedia per imageQuery (source "custom", Crossover); wiki = Rueckfall (AA-Wiki, Roblox-Bild).', units: out };
}
