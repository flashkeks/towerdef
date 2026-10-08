/** Runde 9, P4: keine Texte aus der alten Welt ("Grenzgilde im Nebelriss", Runde-1-7-Units) und jeder im Code genutzte Textschluessel existiert. */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { hasKey } from '../src/i18n/t';

const OLD_WORLD = /\b(rift|terrace|guild|hollow|nebel|grenz|riftwatch)\b|\b(striker|blaster|gunner|titan|lancer|frost)\b/i;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('Texte ohne alte Welt', () => {
  it('kein sichtbarer Text nennt Rift, Terrasse, Gilde oder die alten Units', () => {
    for (const [k, v] of Object.entries(en)) expect(OLD_WORLD.test(v), `${k}: ${v}`).toBe(false);
  });

  it('Lobby-Untertitel und Play-Kachel passen zum Anime-Multiversum', () => {
    expect(en['start.tagline']).toMatch(/anime/i);
    expect(en['lobby.play.sub']).toMatch(/world/i);
  });

  it('jeder literal verwendete Schluessel t("...") im Client-Code ist in en.ts definiert', () => {
    const missing: string[] = [];
    for (const f of files('src')) {
      if (f.endsWith('en.ts')) continue;
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'([a-z0-9_.-]+\.[a-z0-9_.-]+)'/gi)) if (!hasKey(m[1]!)) missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
});
