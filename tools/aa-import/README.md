# tools/aa-import (Runde 8 / P2)

Wiederholbarer Importer: `docs/anime-adventures/data/*.json` -> Spieldaten. Aufruf im Repo-Wurzelverzeichnis:

```bash
npm run aa-import          # schreibt alle Zieldateien neu
npm run aa-import:check    # schreibt nichts, Exit 1 wenn eine Datei nicht zur Quelle passt
```

| Ziel | Inhalt |
|---|---|
| `sim/data/units/aa.json` | 550 Units + Angriffs-Katalog im P1-Format (`docs/aa-import/format.md`), eine Unit je Zeile. Zusatzfelder `support` (`full`/`limited`/`hidden`) und `supportNotes` |
| `meta/data/aa/evolutions.json` | 219 Evolutionsrezepte (Ziel(e), benoetigte Units, AA-Materialaufwand nur zur Information, `blocked`) |
| `meta/data/aa/traits.json` | 12 Traits in Basispunkten, Wurf-Gewichte, Stufen |
| `client/public/aa/manifest.json` | je Unit-ID echter Name, Serie, Form, `anilistQuery` (aus `docs/aa-import/figuren.json`, `source: "anilist"`), dazu Wiki-Dateiname als Rueckfall (`nameRR` mit `_`, `.png`, Shiny-Variante) und Pfad `/aa/units/<id>.webp`; Crossover: `source: "custom"` + `imageQuery` |
| `docs/aa-import/report.md` | Bericht: voll / eingeschraenkt / ausgeblendet mit Gruenden |

- **Figuren** (Runde 10 / P1): `docs/aa-import/figuren.json` ist die **von Hand gepflegte** Zuordnung AA-Unit -> echte Figur (`{ id, aaName, name, series, form?, anilistQuery, note? }`, Crossover zusaetzlich `imageQuery`). `figuren.ts` prueft sie (genau ein Eintrag je Unit, keine doppelte `(name, form)`), der Importer bricht sonst ab. `note: "umgemünzt von …"` = generische oder doppelte Unit auf eine bekannte Figur umgestellt, `note: "unsicher"` = Zuordnung nicht gesichert. Werte, Angriffe, IDs bleiben unberuehrt.

Dateien: `index.ts` (Ablauf), `support.ts` (Einstufung und Gruende), `kits.ts` (Runde 9: Faehigkeiten, Auren, Beschwoerungen, Zweitangriffe-Ausnahmen, Animations-Spawner), `evolutions.ts`, `traits.ts`, `manifest.ts`, `report.ts`.

## Regeln

- **Nichts wird umgerechnet** (Maßstab `docs/aa-import/massstab.md`). Der Importer waehlt aus, benennt um (`nameRR` -> `name`, `secondaryDamageTypes` -> `elements`, `true_damage` -> `true`), laesst vererbte `attack`-Werte weg und prueft die fertige Datei mit `UnitFileSchema`.
- `kind: "summon"` (11 Eintraege) ist keine Unit (561 - 11 = 550), sondern ein Wesen im Katalog `summons` von `aa.json` (Runde 9, Zahlen aus `kits.ts`). Dort stehen auch die Angriffe der Kits (`kit:*`) und Ergaenzungen fuer Angriffe ohne Details (`giselle:three`, `carrot:two`).
- **Kits** (Runde 9 / P1): die AA-Rohdaten kennen nur Marken (`active_attack`, `spawn_unit`, `aura_buff`), keine Wirkungszahlen. `kits.ts` ergaenzt sie als Datensatz (`abilities`, `aura`), `index.ts` schreibt Zweitangriffe (`also`) fuer Units mit mehreren Angriffen. Einstufung: ein Kit loest die Gruende `handles`, `leaves` bleiben (die Unit bleibt `limited`); Animations-Spawner (`COSMETIC_SPAWN`) zaehlen als voll.
- **Ausgeblendet** (`support: "hidden"`): keine Stufe greift an, kein Farm-Ertrag und kein Kit (Faehigkeit/Aura). Die Unit bleibt im Datensatz; Meta nimmt sie aus Gacha und Sammlung (ausser sie wird besessen).
- **Eingeschraenkt** (`limited`): spielbar, aber Aktiv-Faehigkeit, Beschwoerung, Aura, Heilung usw. fehlen (`supportNotes`).
- Handgepflegte Banner und Kosten liegen **nicht** hier: `meta/data/banners/*.json`, `meta/data/unit-costs.json`.
- `aa.json` nicht von Hand aendern. Neue Figuren (Crossover, P6) kommen in eine eigene Datei `sim/data/units/crossover.json`.

## Nach einem Lauf pruefen

```bash
cd sim && npx vitest run test/units-data.test.ts test/aa-import.test.ts test/smoke.test.ts
cd ../meta && npx vitest run
```

## Crossover (Runde 8 / P6)

`vorlage.ts` (Median-Stufenkurve und Band P5..P95 je Seltenheit aus `aa.json`), `crossover-spec.ts` (die 25 Figuren), `crossover.ts` (Schreiben/Prüfen). `npm run crossover`, `npm run crossover:check`, `npm run crossover:vorlage -- Mythic`. Der Importer ergänzt das Bild-Manifest um die Crossover-Figuren (`source: "custom"`, `imageQuery`). Anleitung: `docs/aa-import/neue-unit.md`.
