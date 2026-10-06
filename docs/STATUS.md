# Status (global)

Arbeitsauftrag: [`/run.md`](../run.md) (**Runde 4**: Balance reparieren, Spielregeln festziehen, M1 vorbereiten). **Verbindlich zuerst:** [design/ENTSCHEIDUNGEN.md](design/ENTSCHEIDUNGEN.md). **Jede Sitzung liest danach diese Datei** und macht beim „Nächsten Schritt“ weiter.
Frühere Aufträge: [archiv/run-runde1.md](archiv/run-runde1.md), [archiv/run-runde2.md](archiv/run-runde2.md), [archiv/run-runde3.md](archiv/run-runde3.md).

Letzte Aktualisierung: 2026-10-06 (Runde 4, P6 Zwischenstand; Arbeit ab jetzt über Max' Claude-Account in `flashkeks/towerdef`, Branch `dev`)

## Pakete Runde 4

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Archiv, Entscheidungen, gdd, Status | **erledigt** | Hauptsitzung | Runde-3-`run.md` archiviert, ENTSCHEIDUNGEN.md + beantwortete FRAGEN.md abgelegt. Verifikation in eigener Node-Umgebung: `npm ci && npm test && npm run typecheck` → 130/130 grün, tsc sauber |
| P1 | Unit-Rebalance | **erledigt, Ziele teilweise** | 1 × Sonnet | 132 Tests grün. Erreicht: Schaden/Münze solo Faktor 1,6 (vorher 3,5), AoE-Bot Normal solo 52 % (vorher 0), jede Unit ≥ 91 % gekauft, Titan keine Pflicht mehr, LOO Normal ≤ +5. Verfehlt: LOO Hard/NM (+38…+50, Bot-Rollenwahl → P6), Titan als Boss-Killer nicht belegt (Bosse leaken → P4), Frost jetzt Pflicht (Flyer-Pulks), Titan+Lancer+Frost Normal weiter 100 %, 4P regrediert (greedy/wide 0–2 % → P5), HP-Faktoren der Stufen Platzhalter (→ P3). Details [kalibrierung.md § Runde 4 — P1](balancing/kalibrierung.md) |
| P2 | Leben-System, Fail-State | **erledigt** | 1 × Sonnet | 144 Tests grün. Startleben 30 (Team), Leak `max(1, ceil(Basis × RestHP/MaxHP))`, Basis Grunt/Runner 2, Flyer/Splitter 3, Brute 5, Elite 8; Boss-Leak = verloren, Elite = viele Leben (Sofort-Verlust per Daten umstellbar). Boss-HP ×30 → ×10 als **Zwischenstand bis P4**. Bester Bot solo N/H/NM: 95/47/27 → 88/60/35 %. 4P (upgrade) 23/77/30 → P4/P5. Regeneration +2/Wave ist starker Hebel für P3. [kalibrierung.md § Runde 4 — P2](balancing/kalibrierung.md) |
| P3 | Schwierigkeit über Regeln | **erledigt, vorläufig kalibriert** | 1 × Sonnet | 160 Tests grün. Regeln je Stufe in `difficulties.json` (Modifier-Dichte, Wellen-Varianten seeded, Element-Modus, Leben-Überschreibung, `bossAbilityTier` für P4, `rewardBp`), `systems/rules.ts`, Challenges als Datenkonzept. Bester Bot solo N/H/NM: 90/52/27 %. Kennlinie 90→10 %: Normal 15,7, Hard 25,0, Nightmare 23,1 Punkte (Ziel ≥ 25, Normal braucht P6). Nachkalibrieren nach P4-Merge: `sh sim/scripts/sanity/p3-check.sh 60 TAG`. [kalibrierung.md § Runde 4 — P3](balancing/kalibrierung.md) |
| P4 | Boss-Kits, Wellenvorschau, Risikokarten | **erledigt** | 1 × Sonnet | Zwei Kits (Warden W10, Colossus W20) mit Phasen, Telegraph, Fenster, Schild, Beschwörung, Heilung, Sturm; `minDifficulty` je Fähigkeit als Schnittstelle für P3. `sim.previewWave(n)`, 8 Risikokarten, Befehl `chooseCard`, Bot-Suffix `+cards`. Boss-HP x10 -> x11, Titan-Nuke 5x -> 12x: Titan-Bot 88 % gegen 57 % ohne Titan (Boss x11). Bester Bot solo N/H/NM: 90/60/37,5 -> 87,5/42,5/35 %. 169 Tests grün. Fenster werden von Bots genutzt (1,0 -> 7,2 Fähigkeiten/Lauf im Fenster), ändern die Siegquote aber nicht messbar. [kalibrierung.md § Runde 4 — P4](balancing/kalibrierung.md) |
| P5 | Koop-Skalierung | **teilweise, Ziel verfehlt** | 1 × Sonnet | 191 Tests grün. Hebel: HP-Faktor je Spielerzahl als Tabelle `economy.coop.hpTableBp` = 1 / 1,5 / 1,75 / 2,0 (vorher linear 1 / 2,1 / 3,2 / 4,3), Boss-HP getrennt (`bossHpTableBp`) im Kern gebaut, aus. Normal: `aoe` 95/87,5/97,5 (1P/2P/4P, vorher 95/5/0) fair; `upgrade` 60/100/97,5 nicht. Hard/Nightmare im Koop zu leicht (aoe/upgrade 90–100 % gegen 27–52 % solo) → Koop-Tabelle je Stufe nötig. Slot-Hebel gemessen, verworfen (kippt `aoe` gegen `upgrade`). Solo-Zellen bit-identisch. [kalibrierung.md § Runde 4 — P5](balancing/kalibrierung.md); Werkzeug `sim/scripts/sanity/p5-coop.sh` |
| P6 | Fehlermodell Bots, Endkalibrierung | **Teil A erledigt, Teil B teilweise** | 1 × Sonnet | 205 Tests grün, tsc sauber. Boss-Plan für alle Bots (`previewWave`/Kit-Daten, abschaltbar): Wave-10-Boss leakt nie mehr. Drei Profile in `sim/data/botProfiles.json` (Kaufverzögerung, schlechterer Slot, vergessene Upgrades, verspätete Fähigkeiten, Wellenwissen; eigener Bot-PRNG), `getBot('aoe@normal')` bzw. `BOT_PROFILE=normal`. Koop-HP-Tabelle je Stufe (`difficulties.json` `coopHpTableBp`). Solo bester Bot (normal) N/H/NM **85 / 57 / 24** (casual 60/41/19, expert 94/67/31); Daten: Normal `hpBp` 15300, Hard `bountyBp` 10600, Nightmare `bountyBp` 10600. Erreicht: Stufen, dominante Kombi, Kaufquote ≥ 30 %, Schaden/Münze 1,4, AoE-Bot 83 %, Kennlinie Normal 25,7. **Verfehlt:** LOO (Striker +27,5/+22,5 auf Hard/NM, Titan +12,5 auf Normal), Koop fair (nur `aoe`; `upgrade` 4P 95–100), Kennlinie Hard 14,5 / Nightmare 24,4, Stage-Dauer 11,7 min. [kalibrierung.md § Runde 4 — P6](balancing/kalibrierung.md), [report.md § Runde 4](balancing/report.md) |
| P7 | Architektur M1 (`docs/architecture.md`) | **erledigt** | 1 × Sonnet | parallel |
| P8 | Art-Styleguide, Asset-Quellen | **erledigt** | 1 × Sonnet | parallel |
| P9 | Name | **erledigt: „Duskwardens“** (Max) | 1 × Sonnet | parallel |
| P10 | Client-Gerüst (optional) | offen | – | erst nach P1–P6; P1–P6 noch nicht abgenommen |
| P11 | Abschluss (Sitzung 1) | **erledigt** | Hauptsitzung | Kurzbericht unten; Runde 4 bleibt offen (Reste P6, P10) |

## Nächster Schritt (Runde 4)

P1–P9 stehen (P6 mit Zwischenstand). Offen aus P6 (Details und Reihenfolge: [kalibrierung.md § P6 Übergabe](balancing/kalibrierung.md)): (1) Striker-Cap (`botTuning.earlyCap` = 2) einführen und Hard/Nightmare danach neu kalibrieren (Bounty/HP-Raster, Koop-Tabellen), (2) Boss-Plan bedarfsabhängig (Titan kostet auf Normal 12,5 Punkte), (3) Koop über die Wirtschaft statt HP (`upgrade` 4P 95–100 %), (4) Stage-Dauer ist eine Regelentscheidung der Menschen. Danach P10 (Client-Gerüst) oder Playtest-Daten statt Bot-Daten.
Offene Fragen an die Menschen: [architecture.md § 10](architecture.md), OFL-Fonts ([asset-sources.md](design/asset-sources.md)), EUIPO/USPTO für „Duskwardens“, Mindest-Wave-Dauer (Stage-Dauer 13–17 min).

## Kurzbericht Sitzung 1 (06.10.2026, P11)

```text
STATUS — Runde 4
Pakete erledigt / offen: P0, P2, P3, P4, P7, P8, P9 erledigt; P1, P5, P6 mit Zwischenstand; P10 offen
Abnahmeziele (Profil normal): Stufen solo 85/57/24 erreicht; keine dominante Kombi erreicht;
  Kaufquote >= 30 % erreicht (min. Banner 46 %); Schaden/Münze Faktor 1,4 erreicht (nur 1P);
  AoE-Bot Normal 83 % erreicht; Kennlinie N 25,7 erreicht, NM 24,4 knapp, H 14,5 verfehlt;
  Leave-one-out verfehlt (Striker +27,5 H, Titan +12,5 N); Koop fair nur aoe;
  Stage-Dauer 11,7 min verfehlt (Regelfrage)
Wichtigste Balance-Änderungen: siehe kalibrierung.md § Runde 4 (P1–P6, Nachkalibrierung)
Leben-System: Start 30 (NM 22), Normal +1/Wave; Leak max(1, ceil(Basis × RestHP/MaxHP));
  Boss-Leak = verloren, Elite = 8 Leben nach Rest-HP
Schwierigkeit: Elemente (aus / je Wave / gemischt), Modifier-Dichte (0 / 6 % / 30 %),
  Wellen-Varianten, Boss-Fähigkeiten-Tier 0/1/2, Leben; HP-Spreizung 4,8 %
Architektur/Konto-Vertrag/Mock-Zahlung: Entwurf fertig (architecture.md, deploy/)
Assets: 11 Packs CC0 bestätigt; Eigenzeichnung: 8 Figuren, 7 Gegner, 2 Bosse (zeichenliste.md)
Name: „Duskwardens“ (Max), Domain duskwardens.flashkeks.com eingeplant
Client-Gerüst: nein
Agenten: 9 × Sonnet (höchstens 4 gleichzeitig; P3/P4 in getrennten Worktrees)
Commits: 17 auf dev seit Übernahme
Nächster Schritt: siehe oben
```

---

# Runde 3 (abgeschlossen)

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

## Nächster Schritt (Ende Runde 3)

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
