# Referenzdaten (JSON)

Maschinenlesbare Fassung der recherchierten **Anime-Adventures-Daten**. Sie dienen nur als Referenz für die System-Rekonstruktion und sind **nicht** als Spielinhalt für unser Spiel gedacht: Die Namen sind fremde IP.

| Datei | Inhalt |
|---|---|
| `units.json` | **vollständige** Unit-Datenbank (561 Einträge), 1.098 Angriffsdefinitionen, 22 Effekte; erzeugt mit [`tools/aa-research/build_units.py`](../../../tools/aa-research/build_units.py) aus S65/S66/S67/S71. Eigene Konventionen im `_meta`-Block; pro Unit ein `meta`-Objekt (origin/confidence/source) |
| `traits.json` | Trait-Pool (12 Traits inkl. Unique) mit Roll-Chancen und Effekten, Reroll-Kosten, Regeln, LEGACY-Pool vor 2022-12 und Änderungshistorie |
| `banners.json` | Banner, Raten und Pity-Regeln getrennt nach LEGACY und RR, berechnete Erwartungswerte |
| `enemies.json` | 20 Gegner-Modifikatoren, 144 Bosse (alle Welten/Acts, Legend Stages), Boss-Angriffe, CC-Immunitäten, Dungeon-Curses |
| `maps.json` | 22 Story-Welten (LEGACY/RR-Namen, Laufzeiten), Legend Stages, Raids, weitere Maps, Platzierungsregeln |
| `waves.json` | Wave-Anzahlen je Modus, belegte Wave-Ereignisse, Infinite-Gem-Schema, Vorlage, DESIGN-Generator |
| `items.json` | Merchant-Preise, Crafting-Rezepte, XP-Food, Kapseln mit Wahrscheinlichkeiten, Limits, Boosts, Storage, Trade-Tax, Gamepässe (VERIFIED), 219 Evolutionsrezepte |

Konventionen:
- `null` = **UNKNOWN**
- `provenance` / `confidence` / `sources` wie in [../README.md](../README.md#kennzeichnung) und [../sources.md](../sources.md)

Das kanonische Schema für **unser** Spiel steht in [../technical-reconstruction.md](../technical-reconstruction.md#datenmodell).
