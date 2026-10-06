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
| Units (8) | `units/striker`, `units/gunner`, `units/blaster`, `units/banner`, `units/farm` (64×64), `units/lancer`, `units/frost`, `units/titan` |
| Gegner (8 Typen × 2 Geh-Frames) | `enemies/TYP_0`, `enemies/TYP_1` mit TYP = `grunt`, `runner`, `brute`, `flyer`, `splitter`, `splitter_child`, `elite`, `boss` |
| Boden-Schatten Flieger | `enemies/shadow` |

Atlas (aus den Quellbildern gebaut, ebenfalls eigen): `assets/atlas/atlas.png`, `assets/atlas/atlas.json`.

Hinweis: Das sind Platzhalter im Styleguide-Raster (schlicht, einheitlich), keine Endgrafik. Austausch gegen Packs oder Handzeichnung: Quellbild gleichen Namens ersetzen
(Präfix `ph_` aus dem Styleguide wird nicht verwendet, weil die Namen im Atlas stabil bleiben sollen) und `npm run assets` bzw. nur `node scripts/build-atlas.mjs` laufen lassen.

## Schriften, Töne, Musik

Noch keine eingebunden.
