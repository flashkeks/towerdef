# Challenges (Issue #4) — Runde 16 E, 10.10.2026

Wie BTD6-Challenges: ein Regelwerk über einem normalen Match, als Code teilbar, dazu eine Tages-Challenge mit
Embers-Belohnung. Kein Server — alles offline und deterministisch; Bestenliste über Spieler hinweg ist Issue #5.

## Regelwerk (`sim/src/challenge.ts`)

`ChallengeRules` ersetzt Karte, Schwierigkeit und Seed eines Matches; Modi und Challenge schließen sich aus
(`createGame` wirft). Felder:

| Feld | Bedeutung |
|---|---|
| `map`, `difficulty`, `seed` | wie ein normales Match; Seed ist fest, damit alle dasselbe spielen |
| `startRound`, `endRound` | gespielte Spanne aus der Rundenliste (1..120), `endRound` = Sieg |
| `towers` | erlaubte Türme, `null` = alle |
| `hero` | `none` (gesperrt), `any` (Held des Spielers), oder ein bestimmter Held — der schlägt dann die Wahl des Spielers |
| `maxTier` | Höchststufe je Pfad A/B/C (5 = keine Grenze) |
| `startCash`, `lives` | `null` = Wert der Schwierigkeit |
| `incomePct` | Einkommen in % (Pops, Rundenbonus, Markets), 0 = keines |
| `noSell`, `noPowers`, `noKnowledge` | Schalter |
| `hpPct`, `speedPct` | Gegner-HP und -Tempo in % |
| `waves` | eigene Wellen (Gruppen mit Typ, Anzahl, camo/regrow/fortified, Start, Abstand) statt Rundenliste |

Die sechs Zusatzmodi aus Runde 15 lassen sich als Regelwerk ausdrücken (`modeRules`), Tests prüfen, dass Modus und
Regelwerk gleich laufen.

## Code und Link

`DW1-XXXXX-XXXXX-...` (Base32 ohne verwechselbare Zeichen, Prüfsumme). Türme, Helden und Gegner stehen als **Index in der
Schlüssel-Reihenfolge von `DATA.towers`, `DATA.hero` (`sim/src/data.ts`) und der Gegnerliste** im Code. Diese Reihenfolgen
sind damit **append-only** — neue Einträge ans Ende, nie umsortieren, sonst ändern alte Codes ihre Bedeutung. Runde 16 T hat Riverkeeper, Bellringer,
Tinker hinten an die Türme und Bram, Sela hinten an die Helden gehängt; Codes von davor bleiben gültig.

Link: `?challenge=CODE` öffnet die Challenges-Seite mit dem Code (kaputte Codes zeigen die Meldung dort).

## Tages-Challenge (`meta/src/challenge.ts`)

- Aus dem UTC-Datum (FNV-Hash → PRNG), offline, für alle gleich. Würfe in fester Reihenfolge.
- Ignoriert Wissensbaum und Powers (`noKnowledge`, `noPowers`), damit alle gleich spielen.
- Spätere Startrunde → Startgeld nach Bot-Messung (`wealthBefore`, 85 %), 0 % Einkommen → 10 Runden mit 20.000.
- **Seit Runde 16 T:** Wassertürme nur auf Karten mit Wasser, und immer mindestens ein angreifender Landturm
  (Market und Bellringer greifen nicht an; ohne weiteren Wurf aus der gemischten Liste nachgerückt). Test über 3.000 Tage.
- Belohnung: 40 Embers für den ersten Sieg je UTC-Tag (`DAILY_EMBERS`).
- Bestwerte je Tag (30 Tage) und je eigenem Code (50): höchste Runde, Sieg, und bei Siegen je Kennzahl das Minimum
  (Gold ausgegeben, Leben verloren, Zeit).

## Oberfläche (Client)

- Startseite: Knopf **Challenges** in der Fußleiste, Abzeichen „1“, solange die Tagesbelohnung offen ist.
- **Hub** (`screens/challenges.ts`): links die gewählte Challenge (Tages-Challenge oder Code) mit Vorschau, Regeln,
  Bestwerten und Start; rechts „Today's challenge“, „Create challenge“, Code-Eingabe.
- **Editor** (`screens/challenge-edit.ts`): alle Felder außer eigenen Wellen, Code und Link live, „Test play“. Ohne
  Scrollen bei 1280×720 mit zehn Türmen und drei Helden.
- **Match**: Regel-Chip in der Kopfleiste, gesperrte Türme/Held ausgegraut („Not in this challenge“), kein Freeplay.
- **Ergebnis** (`screens/challenge-result.ts`): Runden, Gold, Leben, Zeit mit Bestwerten, Regeln, Code kopieren,
  „Edit challenge“, „Again“.

Bilder: `client/docs/r16/e-*.png` (`npm run build && node scripts/shots-r16-e.mjs`).

## Offen

- Eigene Wellen gibt es im Regelwerk und im Code, aber noch nicht im Editor (Wellen-Editor = eigener Schritt).
- Bestenliste über Spieler hinweg braucht einen Server → Issue #5.
