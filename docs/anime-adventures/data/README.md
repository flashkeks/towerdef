# Referenzdaten (JSON)

Maschinenlesbare Fassung der recherchierten **Anime-Adventures-Daten**. Sie dienen nur als Referenz für die System-Rekonstruktion und sind **nicht** als Spielinhalt für unser Spiel gedacht: Die Namen sind fremde IP.

| Datei | Inhalt |
|---|---|
| `units.json` | **vollständige** Unit-Datenbank (561 Einträge), 1.098 Angriffsdefinitionen, 22 Effekte; erzeugt mit [`tools/aa-research/build_units.py`](../../../tools/aa-research/build_units.py) aus S65/S66/S67/S71. Eigene Konventionen im `_meta`-Block; pro Unit ein `meta`-Objekt (origin/confidence/source) |
| `traits.json` | Trait-Pool mit Roll-Gewichten und Effekten, Reroll-Kosten |
| `banners.json` | Banner und Raten getrennt nach LEGACY und Re-Release |
| `enemies.json` | Enemy-Modifikatoren, bekannte Bosse, CC-Cooldowns |
| `maps.json` | Story-Welten (LEGACY/RR-Namen, Map-Laufzeiten), Legend Stages, Raids |
| `waves.json` | bekannte Wave-Fakten, leere Tabellenvorlage, DESIGN-Generator |
| `items.json` | Shop-Preise, Rezepte, Storage, Trade-Tax, Gamepasses, Evolution-Rezepte |

Konventionen:
- `null` = **UNKNOWN**
- Wertepaare `[min, max]` geben die Wiki-Spannen wieder
- `provenance` / `confidence` / `sources` wie in [../README.md](../README.md#kennzeichnung) und [../sources.md](../sources.md)

Das kanonische Schema für **unser** Spiel steht in [../technical-reconstruction.md](../technical-reconstruction.md#datenmodell).
