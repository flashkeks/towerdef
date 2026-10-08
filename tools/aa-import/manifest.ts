/**
 * Bild-Manifest: je Unit-ID der erwartete Dateiname im AA-Wiki (`nameRR` mit `_` statt Leerzeichen, `.png`), die Shiny-Variante
 * (`<Name>_(Shiny).png`, nur bei `shinyVariant`) und der Pfad, unter dem die Preview das verkleinerte Bild ausliefert.
 * Die Bilder holt die Homelab-Seite (run.md Abschnitt 5); dieses Manifest ist ihre Vorgabe.
 */
export interface ManifestEntry {
  name: string;
  rarity: string;
  /** erwarteter Dateiname im Wiki (nur `source: "aa"`) */
  wiki?: string;
  /** Suchhinweis fuer die Bild-Beschaffung (nur `source: "custom"`, Crossover P6) */
  imageQuery?: string;
  /** Shiny-Datei, falls die Unit eine Shiny-Variante hat */
  wikiShiny?: string;
  /** Auslieferungspfad der Preview (256 x 256, transparent) */
  path: string;
  source: 'aa' | 'custom';
}

/** `Sword Queen (Knight)` -> `Sword_Queen_(Knight).png` */
export const wikiFile = (name: string, suffix = ''): string => `${name.trim().replace(/\s+/g, '_')}${suffix}.png`;

export function buildManifest(units: any[], custom: any[] = []): { ref: string; units: Record<string, ManifestEntry> } {
  const out: Record<string, ManifestEntry> = {};
  for (const u of units) {
    const e: ManifestEntry = { name: u.nameRR, rarity: u.rarity, wiki: wikiFile(u.nameRR), path: `/aa/units/${u.id}.webp`, source: 'aa' };
    if (u.shinyVariant) e.wikiShiny = wikiFile(u.nameRR, '_(Shiny)');
    out[u.id] = e;
  }
  // Crossover-Figuren (sim/data/units/crossover.json): kein Wiki-Bild, stattdessen Suchhinweis
  for (const u of custom) out[u.id] = { name: u.name, rarity: u.rarity, imageQuery: u.imageQuery, path: `/aa/units/${u.id}.webp`, source: 'custom' };
  return { ref: 'Runde 8 / P2, erzeugt von tools/aa-import. Vorgabe fuer die Bild-Beschaffung (Homelab); Crossover-Figuren (P6) tragen source "custom" und imageQuery.', units: out };
}
