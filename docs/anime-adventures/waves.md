# Waves

> **Stand (Sitzung 2, P6):** Auch im Wiki-Volltext (S72) und im Trello (S73) gibt es **keine vollständige Wave-Tabelle** (Gegner pro Wave, Anzahl, Spawn-Delay, HP, Reward) für irgendeine Map. Wave-Daten liegen serverseitig. Belegt sind Wave-Anzahlen pro Modus, einzelne Gegner-Auftritte nach Wave, Boss-Rhythmus und die Gem-Belohnungen pro Wave in Infinite.
>
> Tag-Format: `ART · CONFIDENCE · [Quelle]`, Legende siehe [README](README.md#kennzeichnung).

## Was belegt ist

| Aspekt | Wert | Version | Tag |
|---|---|---|---|
| Story-Act | Waves mit Boss am Act-Ende; Act 6 = Welt-Endboss | LEGACY + RR | OBSERVED · HIGH · [S07 → S72:Story] |
| Story-Act: Wave-Anzahl | **UNKNOWN**. Mindestens 15, weil Shield-Gegner in Walled City Act 4 ab Wave 15 auftreten | RR | DERIVED · MEDIUM · [S72:Enemy Mechanics] |
| Raids (LEGACY 2022) | **20 Waves** (Rumbling, Midnight Attack, Infinity Train) | LEGACY | OBSERVED · MEDIUM · [S73] |
| Portals | „Wave-20-Portals“ mit normaler Yen-Verteilung und Portals mit „Infinite-Mode-orientierter“ Yen-Verteilung | VER? | OBSERVED · MEDIUM · [S72:Effects, S72:Hubris (The One)] |
| Dungeons (LEGACY) | Cursed Womb: Boss in **Wave 15**; Cursed Parade: Boss in **Wave 20** | LEGACY | OBSERVED · HIGH · [S56 → S72:Dungeons] |
| Events (RR) | Frozen Abyss / Winter 2024 und Halloween 2024: **50 Waves, ca. 40 min**; April Fools 2025: **30 Waves, ca. 25 min**; alle paar Waves eine Karte (Segen/Fluch) | RR | OBSERVED · HIGH · [S72:Events, S72:Update Log] |
| Infinite | endlos; **Bosse früherer Acts alle 10 Waves**; nur Hard | LEGACY + RR | OBSERVED · HIGH · [S06 → S72:Infinite] |
| Infinite-Scaling | „each wave progressively getting harder“; Zahl UNKNOWN | LEGACY + RR | OBSERVED · HIGH (qualitativ) · [S72:Infinite] |
| Infinite: Secret Boss | „every wave there's a chance for secret boss“ (Hollow World Infinite, U3) | LEGACY | OBSERVED · MEDIUM · [S73] |
| Infinite: Star Golem | Spawn-Chance in der jeweils neuesten Infinite-Map (seit U7) | LEGACY + RR | OBSERVED · HIGH · [S72:Update Log] |
| Party-Scaling | Gegner-HP steigen mit der Spielerzahl | VER? | OBSERVED · LOW · [S06] (nicht im Volltext S72 wiedergefunden) |
| Base HP | skaliert seit Update 9 mit der Level-Schwierigkeit | LEGACY | OBSERVED · HIGH · [S72:Update Log] |
| Wave-Timer | Es gibt einen **Wave-Timer**: JIO (Over Heaven) stoppt 20 s lang „enemy spawns, the wave timer“ und alle Gegner | RR | OBSERVED · HIGH · [S72:JIO (Over Heaven), S72:Tier Lists] |
| Rundenlänge | Update 1: „made rounds last shorter“ | LEGACY | OBSERVED · HIGH · [S72:Update Log] |
| Challenges | Story-Act mit Modifikator auf allen Gegnern; Wechsel alle 30 min | LEGACY + RR | OBSERVED · HIGH · [S15 → S72:Challenges] |
| Wave-Yen | existiert; Formel UNKNOWN. Contracts: 2.500–5.000 Yen pro Runde, 5.000 zum Start | RR | OBSERVED · HIGH · [S72:Contracts] |
| Farm-Yen | wird **nach jeder Wave** ausgezahlt | LEGACY + RR | OBSERVED · HIGH · [S28, S37 → S72:Effects] |
| Heal-Units | heilen 3–5 % Base-HP pro Wave (seit Update 9; vorher 25 HP) | LEGACY + RR | OBSERVED · HIGH · [S72:Blossom, S72:Update Log] |

### Infinite-Gems pro Wave (RR)

Die Gem-Tabelle wurde am 2025-01-02 ins Wiki eingetragen, ist also **RR-Stand** (Sitzung 1 führte sie als LEGACY). Wortlaut der Seite: W1–5 keine, W6 18, W7–15 je 3, W15–100 je 5, „from wave 105 onwards“ keine mehr, Maximum **497** (geprüft bis Wave 146). OBSERVED · HIGH · [S06 → S72:Infinite; Versionsgeschichte S-P6a*]

Versionsgeschichte der Seite (Wiki-API):

| Datum | Revision | Aussage |
|---|---|---|
| 2025-01-02 | 36814 | W7–15: 3, „Wave 15+“: 5, kein Ende genannt |
| 2025-01-27 | 39813/39814 | „from wave 100 onwards“ keine Gems (geprüft bis W123) |
| 2025-01-31 | 40081–40093 | korrigiert auf „from wave 105 onwards“, Maximum 497 (geprüft bis W146) |

**Auflösung Konflikt C6 (DERIVED · MEDIUM):** Gesucht sind `k` Waves zu 3 Gems und `m` Waves zu 5 Gems mit `18 + 3k + 5m = 497`, also `3k + 5m = 479`. Die einzige Lösung im plausiblen Bereich ist **k = 8, m = 91**: W7–W14 je 3 (24 Gems), **W15–W105** je 5 (455 Gems). Damit gehört Wave 15 zur 5er-Stufe (die Bereiche überlappen in der Quelle), und „ab Wave 105 keine Gems“ bedeutet „nach Wave 105“. Alternativen scheitern: W7–15 mit 3 Gems ergibt `3·9 = 27`, dann wäre `5m = 452`, nicht ganzzahlig.

Gegenproben:
- Trello (LEGACY 2023-01): „Namek Infinite → bis Wave 24 → **97 Gems**“. Mit dem Schema ergibt Abschluss bis Wave 25: `18 + 24 + 11·5 = 97`. Passt, wenn der Verlust in Wave 26 eintritt (Units werden in Wave 24 verkauft). DERIVED · MEDIUM · [S73]. Das Schema galt dann schon im späten LEGACY.
- AFK-Gems aus Map Lengths (18/21/24/27) passen ebenfalls ([maps.md](maps.md#map-längen)).

| Wave | Gems pro abgeschlossener Wave | Kumuliert |
|---|---:|---:|
| 1–5 | 0 | 0 |
| 6 | 18 | 18 |
| 7–14 | 3 | 42 (bei W14) |
| 15–105 | 5 | 497 (bei W105) |
| ≥ 106 | 0 | 497 |

`*` S-P6a = Platzhalter-ID für die neue Quelle „Wiki-API Versionsgeschichte Infinite“; endgültige ID vergibt der Koordinator (siehe `sources_P6.md`).

### Infinite-Tagesbelohnung (Daily Infinite)

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| LEGACY 2022-07 (Wiki-Erstfassung) | – | W10 15, W25 25, W50 50 Gems | – | [Wiki-Rev. 298, S-P6a*] |
| LEGACY 2022-08 (Trello) | 15/25/50 | W10 +30, W25 +70, W50 +100 | – | [S73] |
| ab Update 7 (2022-11): Infinite-Quests, 3 zufällige Welten pro Tag | 30/70/100 | **W10 90, W25 180, W50 330** | 90/180/330 | [S23 → S72:Quests, S72:Infinite] |
| RR Update 20.4.1 | Daily-Infinite-Quest bis W50 | **bis W40** verkürzt | W40-Quest; Gem-Höhe UNKNOWN | [S72:Update Log] |

Die Wiki-Trivia nennt als Altwerte „10/25/50“. Das weicht von der Erstfassung (15/25/50) ab; Konflikt LOW.

### Sonstige Belohnungen pro Wave

| Modus | Belohnung | Tag |
|---|---|---|
| Infinite, Verlust ab Wave 10 | XP-Items und Unit-XP; Verlassen gibt Gems, aber keine XP | OBSERVED · HIGH · [S72:Infinite] |
| Infinite, „weit kommen“ | XP-Food der Welt; manche Welten Portale oder Dungeon-Keys | OBSERVED · HIGH · [S72:Items, S72:Infinite] |
| Infinity Mansion | 150 Gems pro Raum (Hard nach Raum 100: 300); Räume 58–60 mit erhöhter HP, ab Raum 60 wieder gesenkt; Resistenzen ab Raum 50 bzw. 100 | OBSERVED · HIGH · [S72:Infinity Mansion] |
| Multiplayer-Quest | „Clear 10/25/40 waves with at least one other player“ | OBSERVED · HIGH · [S72:Quests] |

## Bekannte Wave-Ereignisse (Story)

| Welt | Act | Wave | Ereignis | Tag |
|---|---|---:|---|---|
| Walled City | 4 | 15 | erste Shield-Gegner | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Snowy Town | 4 | 10 | erste Regen-Gegner | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Fiend City | 4 | 10 | Aogiri Executives (Heavy Regen) | OBSERVED · HIGH · [S72:Story] |
| Spirit World | 1 | 10 | erste Flying-Gegner | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Magic Town | 2 / 4 | 10 | Fire Mages / Ice Mages | OBSERVED · HIGH · [S72:Story] |
| Haunted Academy | 2 / 3–4 / 5–6 | 10 / 8 / 6 | Death Painting Curse als normaler Gegner | OBSERVED · HIGH · [S72:Story] |
| Magic Hills | 1 | 10 | Ice Demons | OBSERVED · HIGH · [S72:Story] |
| Space Center | 1 | 10 | Pursuit Bikes | OBSERVED · HIGH · [S72:Story] |
| Virtual Dungeon | 4 | 10 | erste Armored-Gegner | OBSERVED · HIGH · [S72:Enemy Mechanics] |

Auffällig: Neue Gegnertypen erscheinen meist in **Wave 10** eines Acts. RECONSTRUCTED · MEDIUM

## Wave-Tabellen-Vorlage (für spätere Befüllung)

| Wave | Enemy | Count | Spawn Delay (s) | HP | Speed | Mods | Reward ¥ | Tag |
|---:|---|---:|---:|---:|---:|---|---:|---|
| 1 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | – | UNKNOWN | UNKNOWN |
| … | | | | | | | | |
| Boss | (Act-Boss, siehe [enemies.md](enemies.md#bosse-pro-story-welt-rr-stand)) | 1 | – | UNKNOWN | UNKNOWN | Boss | UNKNOWN | UNKNOWN |

Einzige belegte Boss-HP: LEGACY-Raids Wave 20 (Eren Founder 555 658, Deidara 388 960, Akaza 666 952; vor den HP-Nerfs in Update 5.5) [S73, S72:Raids]. Datenstruktur: [technical-reconstruction.md](technical-reconstruction.md#datenmodell).

## Spawn-Logik (Rekonstruktion für den Nachbau)

```text
Wave {
  groups: [ { enemyId, count, interval, startDelay, pathId, mods[] } ]
  bossId?            // Act-Ende bzw. infinite: wave % 10 == 0
  rewardYen          // bei Abschluss
}
WaveManager:
  state ∈ {PREP, SPAWNING, CLEARING, DONE}
  - Wave startet: alle Gruppen spawnen parallel nach startDelay im Takt interval
  - Wave-Timer läuft (AA: belegt, Dauer UNKNOWN); nächste Wave startet bei
    Timer-Ablauf ODER wenn alle Gegner tot/geleakt sind (Bedingung UNKNOWN)
  - Spawn-Pause / Timer-Pause als Effekt möglich (AA: Timestop-Ability)
  - Skip Wave: startet nächste Wave sofort (Belohnung/Bonus UNKNOWN)
  - onWaveComplete: payout(waveYen + Σ farmIncome), heal(base, Σ healPct)
```
RECONSTRUCTED · MEDIUM

## Infinite-Generator (DESIGN – kein AA-Wert)

Weil AA-Werte fehlen, folgt ein Vorschlag, der die **qualitativen** Belege respektiert: monoton steigende HP, Boss alle 10 Waves, Gem-Kurve wie in AA, Party-Scaling.

```text
hp(w)    = baseHP × g^(w−1) × (w > W_jump ? J : 1) × partyMult(n)
g        = 1.08 … 1.12           // DESIGN
W_jump   = 50, J = 2.0           // DESIGN ("signifikanter Anstieg", Quelle S06 nur Suchauszug)
partyMult(n) = 1 + 0.5·(n−1)     // DESIGN
boss     = (w % 10 == 0) ? pickFrom(previousActBosses) : none
gems(w)  = w<6 ? 0 : w==6 ? 18 : w<=14 ? 3 : w<=105 ? 5 : 0   // AA-Kurve, DERIVED
secretBoss: pro Wave kleine Chance p (DESIGN, z. B. 2 %)
```
