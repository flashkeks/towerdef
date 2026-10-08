# Wunschliste Match-Ton und -Effekte (Runde 10 / P2)

Stand 08.10.2026. Aus der Agent-Umgebung sind kenney.nl, opengameart.org und freesound.org gesperrt (Proxy 403), deshalb ist **nichts** heruntergeladen;
der Match-Ton wird synthetisiert (`src/audio/recipes*.ts`). Die Homelab-Seite kann die Dateien holen und nach `client/public/sfx/` legen, **ohne Code zu aendern**:

1. Dateien als `.ogg` (oder `.wav`/`.mp3`) nach `client/public/sfx/`.
2. Liste `client/public/sfx/index.json` (liegt als leeres `{}` schon da, damit der Browser keinen 404 meldet; einfach fuellen) mit ID -> Dateiname, z. B. `{ "hit.fire": "fire-whoosh.ogg", "crit": "crit.ogg" }` (oder ein Array von IDs, dann gilt `<id>.ogg`).
3. Jede genannte ID ersetzt den synthetisierten Klang; fehlt eine ID, bleibt die Synthese. Ein Fehlschlag beim Laden ist still (`src/audio/samples.ts`).

Lizenz und Herkunft der geholten Dateien in `client/assets/ATTRIBUTIONS.md` eintragen (Kenney = CC0).

## Quellen (Seiten, die Zip-Adressen stehen dort unter „Download“)

| Paket | Seite | Lizenz | Geeignet fuer |
|---|---|---|---|
| Kenney Impact Sounds | https://kenney.nl/assets/impact-sounds | CC0 | `place`, `kill`, `hit.slash`, `hit.blast`, `hit.shell`, `hit.dark`, Treffer |
| Kenney Interface Sounds | https://kenney.nl/assets/interface-sounds | CC0 | `upgrade`, `sell`, `error`, `windowOpen`, `windowClose` |
| Kenney RPG Audio | https://kenney.nl/assets/rpg-audio | CC0 | `sell` (Muenzen), `hit.slash` (Klinge), `kill`, `place` (Schritt/Aufsetzen) |
| Kenney Digital Audio | https://kenney.nl/assets/digital-audio | CC0 | `hit.tracer`, `hit.bolt`, `hit.line`, `hit.magic`, `crit` |
| Kenney Sci-fi Sounds | https://kenney.nl/assets/sci-fi-sounds | CC0 | `hit.lightning`, `hit.line`, `cutin`, `bossEnter`, `bossCast` |
| Kenney Music Jingles | https://kenney.nl/assets/music-jingles | CC0 | `win`, `lose`, `wave`, `bossDeath` |
| Kenney Particle Pack (Grafik) | https://kenney.nl/assets/particle-pack | CC0 | Vorlage fuer Splitter-Formen (Funken, Rauch, Sterne); **noch nicht angebunden**, die Splitter sind Pixi-Zeichnungen in `src/game/figures.ts` (`particle()`), ein Austausch braeuchte eine kleine Anbindung unter `public/fx/` |
| freesound (CC0-Filter) | https://freesound.org/search/?f=license%3A%22Creative+Commons+0%22 | CC0 | Elementklaenge: Feuer-Zischen, Wasser-Tropfen, Eis-Klirren, Blitz-Knistern, Wind-Wusch |
| OpenGameArt (Sound-Effekte, CC0) | https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=13&field_art_licenses_tid%5B%5D=4 | CC0 | Zauber-/Elementklaenge, wenn Kenney nicht reicht |

## IDs, die Dateien bekommen koennen (alle optional, Dauer kurz)

Match (neu in Runde 10, `logic-match.ts`): `hit.fire`, `hit.water`, `hit.ice`, `hit.lightning`, `hit.air`, `hit.light`, `hit.dark`, `hit.rose`, `hit.magic` (Schuesse, dezent, unter 0,3 s), `crit` (kurz, hell, unter 0,25 s), `cutin` (Faehigkeits-Ansage: Aufbau, dann Schlag, ca. 0,7 s), `bossDeath` (ca. 1,5 s).

Bestand (`logic.ts`): `place` (mit Aufschlag nach ca. 0,2 s), `upgrade`, `sell`, `error`, `hit.slash`, `hit.tracer`, `hit.shell`, `hit.bolt`, `hit.blast`, `hit.cone`, `hit.line`, `kill`, `leak`, `wave`, `frost`, `nuke`, `bossEnter`, `bossPhase`, `bossWarn`, `bossCast`, `bossBreak`, `windowOpen`, `windowClose`, `wardBreak`, `win`, `lose`.

Hinweis: Menue-Klaenge (Hover, Klick, Beschwoeren) gehoeren zu P3 und haben dort eigene IDs (`recipes-ui.ts`); die Liste gilt fuer alle IDs aus `RECIPES`.
