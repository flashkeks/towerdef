# Recherche-Status (global)

Arbeitsauftrag: [`/run.md`](../run.md) (Runde 2). **Jede Sitzung liest zuerst diese Datei** und macht beim „Nächsten Schritt“ weiter.
Runde 1 (Anime Adventures) ist abgeschlossen: [anime-adventures/STATUS.md](anime-adventures/STATUS.md), Auftrag archiviert als [anime-adventures/run-runde1.md](anime-adventures/run-runde1.md).

Letzte Aktualisierung: 2026-10-06 (Runde 2, Sitzung 1)

## Pakete Runde 2

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Aufräumen, Status, Spiele verifizieren | **erledigt** | Hauptsitzung | siehe „Spiele“ |
| P1 | `anime-adventures/design-brief.md` | **erledigt** | 1 × Sonnet | 390 Zeilen, Zahlenbereiche je Rarity aus units.json (Stichprobe geprüft) |
| P2 | Bloons TD6 | läuft | 1 × Sonnet | |
| P3 | Roblox-Anime-TDs (ASTD, AV, ALS, UTDZ, AE) | läuft: ASTD, ALS, AV **erledigt**; UTDZ, AE laufen | je Spiel 1 × Sonnet | ASTD: Farm-Kurve, Gacha, Startgeld nur Sondermodi. ALS: Upgrade-Kurven, Verkauf 50 %, Traits; In-Match-Geld und Gegner-HP UNKNOWN. AV: Datenmodule (UnitData 224 Units, EnemyData mit Kill-Yen und HP-Multiplikatoren, TraitValues) | |
| P4 | Vergleich und Empfehlung | offen | – | |
| P5 | Vorarbeiten (Technik, Assets, Recht, Balancing) | läuft (Technik + Assets) | 1 × Sonnet | |
| P6 | Abschluss | offen | – | |

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

- AV: Startgeld und Wave-Yen, Basis-HP; Wiki-Stat-Chancen summieren sich auf 106,5 %. Kill-Yen aus EnemyData nur O/LOW.

- ASTD: Startgeld/Kill-Cash in Story, Gegner-HP-Formel (Wiki ohne Werte). Wikiwidersprüche: Pity Banner Z 140/120, Gale-Slow-Cap 65/80 %.
- ALS: Startgeld, Gegner-HP, Targeting. Wiki `alsroblox.fandom.com` hat keine Datenmodule. Aura-Farmer-Upgradekosten nicht monoton (Wikifehler?).

- Ob ALS einen Nachfolger hat.

## Nächster Schritt

Laufende Agenten abwarten und ihre Dateien prüfen. Danach P3 (ALS, UTDZ, AE) und P5 starten.
