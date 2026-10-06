# Status (global)

Arbeitsauftrag: [`/run.md`](../run.md) (**Runde 3**: Balancing-Simulator und Game-Design-Entwurf). **Jede Sitzung liest zuerst diese Datei** und macht beim „Nächsten Schritt“ weiter.
Frühere Aufträge: [archiv/run-runde1.md](archiv/run-runde1.md) (Anime Adventures, Status in [anime-adventures/STATUS.md](anime-adventures/STATUS.md)), [archiv/run-runde2.md](archiv/run-runde2.md) (Vergleichsrecherche, Ergebnisse unten).

Letzte Aktualisierung: 2026-10-06 (Runde 3, abgeschlossen)

## Pakete Runde 3

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Archiv, Status | **erledigt** | Hauptsitzung | `run.md` Runde 1/2 → `docs/archiv/` |
| P2a | Simulationskern `sim/` | **erledigt** | 1 × Sonnet | 96 Tests grün, Determinismus-Test grün, ~236 000 Ticks/s (20 Waves in 0,08 s); 30 DESIGN-OFFEN in [offene-regeln](balancing/offene-regeln.md); Infinite noch nicht modelliert | Auftrag: Unit-IDs striker, gunner, blaster, banner, farm, lancer, frost, titan |
| P2b | Bot-Strategien | **erledigt** | 1 × Sonnet | greedy, farm, aoe, upgrade, wide, coop; vor Kalibrierung Normal solo: greedy/wide/upgrade 20/20, aoe 11/20, farm 10/20 | nach P2a |
| P2c | Reports und Kalibrierung | **erledigt** | 1 × Sonnet | nach P2a |
| P3 | Content-Sanity | **erledigt** | 1 × Sonnet | Risiken in [report.md](balancing/report.md#risiken): dominante Kombi Titan+Lancer+Frost, Striker als Falle, Messerschneide; Performance unkritisch | nach P2c |
| P4 | Game-Design-Entwurf `docs/design/` | **erledigt** (Werte-Verweise auf sim/data nach P2a prüfen) | 1 × Sonnet | gdd.md 353 Zeilen, FRAGEN.md 10 offene Entscheidungen | parallel zu P2 |
| P5 | Fähigkeiten-Musterkatalog (optional) | **erledigt** | 1 × Sonnet | 16 Muster, Top-8 (DESIGN); Beliebtheit meist UNKNOWN | |
| P6 | Abschluss | **erledigt** | Hauptsitzung | 130 Tests grün, Linkprüfung 0 Fehler | |

## Nächster Schritt (Runde 3)

Runde 3 ist abgeschlossen. Als Nächstes entscheiden die Menschen die Fragen in [design/FRAGEN.md](design/FRAGEN.md). Danach (Vorschlag):

1. Balance-Risiken aus [report.md § Risiken](balancing/report.md#risiken) beheben: Titan/Frost-Dominanz, Striker-Falle, flachere Schwierigkeitskurve (Messerschneide), Koop-Faktor je Spielerzahl. Danach erneut die Matrix laufen lassen.
2. M1 Vertical Slice nach [gdd.md](design/gdd.md): Renderer (Engine laut FRAGEN #7) auf den Simulator `sim/` setzen.

---

# Runde 2 (abgeschlossen)

## Pakete Runde 2

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Aufräumen, Status, Spiele verifizieren | **erledigt** | Hauptsitzung | siehe „Spiele“ |
| P1 | `anime-adventures/design-brief.md` | **erledigt** | 1 × Sonnet | 390 Zeilen, Zahlenbereiche je Rarity aus units.json (Stichprobe geprüft) |
| P2 | Bloons TD6 | **erledigt** | 1 × Sonnet | Runden 1–140 als JSON (RBE, Cash, Bonus; R63 stichprobengeprüft), Startgeld/Leben/Kostenfaktoren, Sell 70 %, Steuerstufen, Freeplay-HP-Rampe, Targeting, 26 Tower | |
| P3 | Roblox-Anime-TDs (ASTD, AV, ALS, UTDZ, AE) | **erledigt** (alle 5) | je Spiel 1 × Sonnet | ASTD: Farm-Kurve, Gacha, Startgeld nur Sondermodi. ALS: Upgrade-Kurven, Verkauf 50 %, Traits; In-Match-Geld und Gegner-HP UNKNOWN. AV: Datenmodule (UnitData 224 Units, EnemyData mit Kill-Yen und HP-Multiplikatoren, TraitValues) | |
| P4 | Vergleich und Empfehlung | **erledigt** | 1 × Sonnet | [systems-matrix](comparison/systems-matrix.md), [numbers](comparison/numbers.md), [recommendations](comparison/recommendations.md) (Startwerte §18, Playtest-Liste §19); Stichproben nachgerechnet | |
| P5 | Vorarbeiten (Technik, Assets, Recht, Balancing) | **erledigt** | 2 × Sonnet (Technik+Assets, Recht+Balancing) | |
| P6 | Abschluss | **erledigt** | Hauptsitzung | Linkprüfung 0 Fehler, alle JSON gültig | |

## Spiele (P0, verifiziert)

Spieldaten aus der Roblox Games API (`games.roblox.com/v1/games?universeIds=…`, abgerufen 2026-10-06) `[V/CONFIRMED]`. „Spielend“ ist ein Momentwert.

| Kürzel | Exakter Name (API) | Entwickler (Gruppe) | Universe-ID | Root-Place-ID | Erstellt | Besuche | Spielend | Ordner |
|---|---|---|---|---|---|---:|---:|---|
| AA | „AA“ (Anime Adventures) | Gomu | 3183403065 | 8304191830 | 2021-12-21 | 2,51 Mrd. | 1 919 | [anime-adventures](anime-adventures/README.md) |
| ASTD | „[OG] All Star Tower Defense“ | Top Down Games | 1720936166 | 4996049426 | 2020-05-07 | 7,93 Mrd. | 1 737 | `games/astd/` |
| ASTD X | „All Star Tower Defense X“ (Nachfolger, gleicher Entwickler) | Top Down Games | 6057699512 | 17687504411 | 2024-06-01 | 0,95 Mrd. | 34 | nur als Fußnote in `games/astd/` |
| AV | „Anime Vanguards: Wrathful Assault“ | Kitawari | 5578556129 | 16146832113 | 2024-01-28 | 2,06 Mrd. | 20 534 | `games/anime-vanguards/` |
| ALS | „Anime Last Stand“ | [B:S] ALS Team | 4509896324 | 12886143095 | 2023-03-24 | 1,08 Mrd. | 17 | `games/anime-last-stand/` |
| UTDZ | „Universal Tower Defense Z“ | Universal Tower Defense [UTD] | 7488190691 | 133410800847665 | 2025-04-04 | 0,30 Mrd. | 104 | `games/utdz/` |
| AE | „Anime Expeditions“ | Expeditions Entertainment | 7613921865 | 84515722934860 | 2025-04-28 | 0,80 Mrd. | 3 838 | `games/anime-expeditions/` |
| BTD6 | Bloons TD 6 | Ninja Kiwi | Steam-App 960090 | – | 2018 | – | – | `games/btd6/` |

Namensvetter (geprüft, **nicht** gemeint):
- „All Star Tower Defence“ (Universe 2436937296): Kopie eines Einzelnutzers, 125 000 Besuche.
- „All Star Tower Defense X“ ist der Nachfolger vom selben Studio, aber deutlich weniger aktiv; ausgewertet wird das OG-Spiel.
- UTDZ ist laut Drittseiten derselbe Place wie das frühere „Universal Tower Defense X“ (UTDX), nur umbenannt (Update 4.0, 2026-07) `[O/MEDIUM]`. Wiki-Material unter `utdx.fandom.com` gilt also für UTDZ.
- „Anime Last Stand“ hat bei 1,08 Mrd. Besuchen nur 17 gleichzeitige Spieler: Das Spiel ist praktisch tot oder abgelöst. Ein Nachfolger wurde nicht gefunden (eine Suche). Es wird trotzdem ausgewertet, mit Fokus auf `design-lessons.md`.

## Offene Spuren

- Recht: GlüStV-Volltext, Google-Play-Primärtext, Web-Plattformregeln (Poki/CrazyGames/itch.io) UNKNOWN; PEGI/Belgien/NL/UK nur aus D-Quellen. Balancing: Kingdom-Rush-Postmortem und Ninja-Kiwi-Interviews nicht gefunden.

- AE: Fandom-Module `AEOfficial/*` (Units, Modifier, Status, Stages); Startgeld, Kill/Wave-Yen, Gegner-HP, Schadensformel UNKNOWN.
- **Querschnitt:** In keinem der fünf Roblox-Spiele sind Startgeld (Normalmodus), Wave-/Kill-Einkommen oder absolute Gegner-HP öffentlich dokumentiert. Belastbare Werte dafür liefert nur BTD6.

- UTDZ: Hauptquelle ist das zweite Wiki `universal-tdx.fandom.com` (Datenmodule, Stand eher Update 2.x–3.x). Startgeld, Kill/Wave-Einkommen, Verkauf, Gegner-HP UNKNOWN. Widersprüche zwischen den beiden Wikis (Bulmo, Zorus).

- BTD6: Preis-Konflikt Preismodul vs. Infobox (Heli 1500/1600, Mortar 600/750, Mermonkey 300/275); Spawn-Timings, absolute Bloon-Speeds, Co-Op-Geldregeln UNKNOWN.

- AV: Startgeld und Wave-Yen, Basis-HP; Wiki-Stat-Chancen summieren sich auf 106,5 %. Kill-Yen aus EnemyData nur O/LOW.

- ASTD: Startgeld/Kill-Cash in Story, Gegner-HP-Formel (Wiki ohne Werte). Wikiwidersprüche: Pity Banner Z 140/120, Gale-Slow-Cap 65/80 %.
- ALS: Startgeld, Gegner-HP, Targeting. Wiki `alsroblox.fandom.com` hat keine Datenmodule. Aura-Farmer-Upgradekosten nicht monoton (Wikifehler?).

- Ob ALS einen Nachfolger hat.

## Ergebnisse Runde 2

| Bereich | Dateien |
|---|---|
| AA-Kurzfassung | [anime-adventures/design-brief.md](anime-adventures/design-brief.md) |
| Steckbriefe | [btd6](games/btd6/overview.md), [astd](games/astd/overview.md), [anime-vanguards](games/anime-vanguards/overview.md), [anime-last-stand](games/anime-last-stand/overview.md), [utdz](games/utdz/overview.md), [anime-expeditions](games/anime-expeditions/overview.md) |
| Vergleich | [systems-matrix](comparison/systems-matrix.md), [numbers](comparison/numbers.md), **[recommendations](comparison/recommendations.md)** |
| Vorarbeiten | [tech-options](research/tech-options.md), [assets-licensing](research/assets-licensing.md), [legal-gacha](research/legal-gacha.md), [balancing](research/balancing.md) |

Agenten: 10 × Sonnet (P1, P2, 5 × P3, 2 × P5, P4), nie mehr als 4 gleichzeitig.

## Nächster Schritt (Ende Runde 2)

Die Recherche ist für den Bau ausreichend. Vorschlag:

1. Prototyp der Simulation nach [tech-options.md §7](research/tech-options.md) mit den Startwerten aus [recommendations.md §18](comparison/recommendations.md#18-startwerte-auf-einen-blick).
2. Ein Balancing-Skript, das die Beispiel-Stage (§5) mit den Startwerten durchrechnet (Einkommen gegen benötigte DPS je Wave), und daraus die Playtest-Liste §19 abarbeiten.
3. Optionale Restrecherche: Startgeld/Wave-Einkommen eines Roblox-Anime-TDs per YouTube-Gameplay (OBSERVED), Co-Op-Geldregeln BTD6.
