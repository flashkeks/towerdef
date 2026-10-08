/**
 * Optionale Klang-Dateien (Runde 10 / P2): Liegt unter `/sfx/index.json` eine Liste, ersetzt jede darin genannte Datei den synthetisierten Klang
 * mit derselben ID. Ohne Liste (lokal, ohne die Homelab-Seite) bleibt alles synthetisiert; ein kaputter Eintrag wird uebersprungen.
 *
 * Die Datei `public/sfx/index.json` liegt leer (`{}`) im Repo, damit kein 404 in der Konsole steht (der Smoke-Test prueft das).
 * Format der Liste: Objekt `{ "hit.fire": "hit.fire.ogg", "crit": "crit.ogg", ... }` (ID -> Dateiname unter `/sfx/`) oder Array von IDs
 * (dann gilt `<id>.ogg`). Die ID-Namen stehen in `logic.ts` (`SoundId`) und `logic-match.ts` (`MatchSoundId`).
 * Die Homelab-Seite legt Dateien und Liste nach `client/public/sfx/` (siehe Wunschliste in `docs/STATUS.md`).
 */

/** Liste lesen: ID -> Dateiname (rein, getestet). */
export function parseSampleIndex(json: unknown): Map<string, string> {
  const out = new Map<string, string>();
  const ok = (s: unknown): s is string => typeof s === 'string' && /^[A-Za-z0-9._-]+$/.test(s) && !s.includes('..');
  if (Array.isArray(json)) {
    for (const id of json) if (ok(id)) out.set(id, `${id}.ogg`);
  } else if (json && typeof json === 'object') {
    for (const [id, file] of Object.entries(json as Record<string, unknown>)) if (ok(id) && ok(file)) out.set(id, file);
  }
  return out;
}

/** Alle Dateien der Liste laden und dekodieren. Stilles Scheitern: gibt eine leere Karte zurueck. */
export async function loadSamples(ctx: AudioContext, base = '/sfx/'): Promise<Map<string, AudioBuffer>> {
  const out = new Map<string, AudioBuffer>();
  if (typeof fetch === 'undefined') return out;
  try {
    const r = await fetch(`${base}index.json`, { headers: { accept: 'application/json' } });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return out;
    const index = parseSampleIndex(await r.json());
    await Promise.all(
      [...index].map(async ([id, file]) => {
        try {
          const res = await fetch(`${base}${file}`);
          if (!res.ok) return;
          out.set(id, await ctx.decodeAudioData(await res.arrayBuffer()));
        } catch {
          /* Datei fehlt oder ist kaputt: der synthetisierte Klang bleibt */
        }
      }),
    );
  } catch {
    /* keine Liste */
  }
  return out;
}
