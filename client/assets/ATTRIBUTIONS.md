# Attributions

Stand: 06.10.2026 (Runde 5, P4). **Alle bisher eingebundenen Bilder sind eigene Werke** (code-generiert), keine Fremdquellen.
Die geplanten CC0-Packs (Kenney Tiny Town/Dungeon, OGA Tiny Creatures, Pixel Frog Tiny Swords, siehe `docs/design/asset-sources.md`) waren aus der Agent-Umgebung
nicht erreichbar (Proxy 403 auf kenney.nl, opengameart.org, itch.io; nicht umgangen, keine Spiegel). Sie sind offene Spur in `docs/STATUS.md`. Sobald ein Pack
eingebunden wird: Quelle, Lizenz, Abrufdatum und Bearbeitung hier eintragen und den Lizenztext unter `assets/licenses/` ablegen.

## Eigene Werke (Pixel-Sprites, code-generiert)

| Quelle | Lizenz | Urheber | Abruf | Bearbeitung |
|---|---|---|---|---|
| `scripts/lib/tiles.mjs`, `units.mjs`, `enemies.mjs` (Formen und Pixelmatrizen im Code), Palette nach `docs/design/art-styleguide.md` §4 | eigen (Projektlizenz des Repos) | Claude (Anthropic) im Auftrag von Max/Flashkeks | entf. (nicht heruntergeladen) | `node scripts/gen-sprites.mjs` erzeugt die Quellbilder, `node scripts/build-atlas.mjs` packt sie |

Erzeugte Quellbilder (`assets/src/`, PNG, 1:1) — alle **eigen**:

| Gruppe | Dateien |
|---|---|
| Gras | `tiles/grass_0` bis `tiles/grass_3` |
| Pfad (16 Kantenmasken, Bit N=1, O=2, S=4, W=8) | `tiles/path_0000` bis `tiles/path_1111` |
| Slot-Untergründe | `tiles/slot_ground` (Steinplatte), `tiles/slot_hill` (Sockel mit Frontmauer), `tiles/slot_big` (Holzdeck 2×2, 64×64) |
| Deko | `tiles/deco_bush`, `tiles/deco_rock`, `tiles/deco_flowers`, `tiles/deco_tree` |
| Spawn, Basis | `tiles/spawn` (Nebelriss), `tiles/base` (Gildentor) |
| Units (14) | `units/striker`, `units/gunner`, `units/blaster`, `units/banner`, `units/farm` (64×64), `units/lancer`, `units/frost`, `units/titan`; Runde 7: `units/warden`, `units/mortar`, `units/broker`, `units/stormcaller`, `units/seer`, `units/weaver` (alle code-generiert, eigenes Werk) |
| Gegner (8 Typen × 2 Geh-Frames) | `enemies/TYP_0`, `enemies/TYP_1` mit TYP = `grunt`, `runner`, `brute`, `flyer`, `splitter`, `splitter_child`, `elite`, `boss` |
| Boden-Schatten Flieger | `enemies/shadow` |

Atlas (aus den Quellbildern gebaut, ebenfalls eigen): `assets/atlas/atlas.png`, `assets/atlas/atlas.json`.

Hinweis: Das sind Platzhalter im Styleguide-Raster (schlicht, einheitlich), keine Endgrafik. Austausch gegen Packs oder Handzeichnung: Quellbild gleichen Namens ersetzen
(Präfix `ph_` aus dem Styleguide wird nicht verwendet, weil die Namen im Atlas stabil bleiben sollen) und `npm run assets` bzw. nur `node scripts/build-atlas.mjs` laufen lassen.

## Schriften, Töne, Musik

Noch keine eingebunden.

## Ton (Runde 5, P5): alles eigen, zur Laufzeit erzeugt

Die geplanten CC0-Tonpacks (Kenney Impact/Interface/RPG Audio, Music Jingles) waren aus der Session nicht erreichbar (Proxy 403 auf kenney.nl, nicht umgangen,
offene Spur in `docs/STATUS.md`). Stattdessen gibt es **keine Audiodateien im Repo**: alle Klänge und die Musik entstehen zur Laufzeit per WebAudio
(Oszillator/Rauschen, Frequenzlauf, Hüllkurve, sfxr-artig). Quelle der Rezepte: `src/audio/recipes.ts`, Abspiel-Motor `src/audio/engine.ts`.

| Quelle | Lizenz | Urheber | Abruf | Bearbeitung |
|---|---|---|---|---|
| `src/audio/recipes.ts` (26 Klang-Rezepte, 1 Musik-Loop), `src/audio/engine.ts` | eigen (Projektlizenz des Repos) | Claude (Anthropic) im Auftrag von Max/Flashkeks | entf. (nicht heruntergeladen) | Synthese zur Laufzeit, keine Fremdsamples |

Klänge (alle **eigen**): `place`, `upgrade`, `sell`, `error`, `hit.slash`, `hit.tracer`, `hit.shell`, `hit.bolt`, `hit.blast`, `hit.cone`, `hit.line`, `kill`, `leak`, `wave`, `frost`, `nuke`,
`bossEnter`, `bossPhase`, `bossWarn`, `bossCast`, `bossBreak`, `windowOpen`, `windowClose`, `wardBreak`, `win`, `lose`. Musik: ein erzeugter a-Moll-Loop (8 Takte, 84 BPM: Bass, Arpeggio, Fläche).

## Schriften und Icons (Runde 8, P4: Interface-Neubau)

Laut Kurswechsel 07.10.2026 zählt die Lizenz hier nicht als Hürde; trotzdem ist die Herkunft festgehalten.

| Quelle | Lizenz | Abruf | Verwendung |
|---|---|---|---|
| **Cinzel** (Natanael Gama), Google Fonts, `fonts.gstatic.com`, woff2 latin, variabel 500-900 | SIL Open Font License 1.1 | 07.10.2026 | Display-Schrift (`src/ui/kit/fonts/cinzel-500-900.woff2`) |
| **Manrope** (Mikhail Sharanda), Google Fonts, woff2 latin, variabel 400-800 | SIL OFL 1.1 | 07.10.2026 | UI-Schrift (`manrope-400-800.woff2`) |
| **Rajdhani** (Indian Type Foundry), Google Fonts, woff2 latin, 500/600/700 | SIL OFL 1.1 | 07.10.2026 | Zahlen und Werte (`rajdhani-*.woff2`) |
| Icons (`src/ui/kit/icons.ts`), eigene Pfade im Strichstil von Feather/Lucide (MIT/ISC) | eigen, Stil nach Feather/Lucide | - | Menü, Elemente, HUD |
| Ersatzfiguren, Siegel, Wappen, Hintergrund (`src/ui/kit/art.ts`) | eigen (Code) | - | Karten ohne Bild, Lobby, Enthüllung |
