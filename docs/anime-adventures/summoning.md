# Summoning / Gacha

Stand: Sitzung 2 (P8). Grundlage sind der Wiki-Volltext `S72:Summon` (Fassung 2025-04-17) und zwei ältere Fassungen derselben Seite aus der Versionsgeschichte (Rev. 33626 vom 2023-12-25 = LEGACY-Endstand, Rev. 42938 vom 2025-03-04 = RR vor Update 20.4.1), dazu `S72:Update Log`, `S72:Store`, das Item-Datenmodul S68 und die Trello-Karten S73. Tag-Format: `ART · CONFIDENCE · [Quelle]`, Legende in [README.md](README.md#kennzeichnung).

Zitierweise der Revisionen: `S72:Summon@33626` bzw. `S72:Summon@42938` (abgerufen über die Wiki-API, siehe `sources_P8`).

## Versionen auf einen Blick

| Zeitraum/Version | Banner | Mythic-Pity | Legendary-Pity | Quelle |
|---|---|---|---|---|
| LEGACY, Update 1 bis 6.x (2022-07 bis 2022-11) | nur Standard | 400 Summons, beliebiger Mythic, Reset bei Mythic und bei Banner-Wechsel | 50 Summons | OBSERVED · MEDIUM · [S73, S72:Summon@33626] |
| LEGACY ab Update 7 (12.11.2022) | Standard + **Special** (Mythic ×2) | Standard: wie oben; **Special: keine Mythic-Pity** | 50 (beide) | OBSERVED · HIGH · [S72:Summon@33626, S72:Update Log] |
| LEGACY ab Update 13.5 (26.05.2023) bis Dez. 2023 | + **Event-Banner** | Event: 100 Summons, bevorzugt unbesessene Featured | keine im Event-Banner | OBSERVED · MEDIUM · [S72:Summon@33626] |
| RR ab Update 19 (25.12.2024) bis 20.x | **Legacy** + Special + Event | Legacy: 400 beliebiger Mythic (unsichtbar, umstritten); Special: keine belegt; Event: 200 | 50 (Legacy) | OBSERVED · MEDIUM · [S72:Summon@42938] |
| RR ab Update 20.4.1 („Fool's Hunt“, ~01.04.2025) | Legacy + Special + Event | **Featured-Center-Pity 400** auf Special und Legacy; Event 200 | **entfernt** | OBSERVED · HIGH · [S72:Summon, S72:Update Log] |

Die alte Annahme „Pity 400 garantiert immer den Center-Featured, auch in LEGACY“ (Sitzung 1) ist damit **falsch**: Die Featured-Center-Pity gibt es erst seit Update 20.4.1. Siehe [Korrektur unten](#pity).

## Kosten

| Aspekt | Wert | Tag |
|---|---|---|
| Single Summon (Standard/Special/Legacy) | **50 Gems** oder 1 Summon Ticket | OBSERVED · HIGH · [S72:Summon, S72:Summon@33626] |
| Mit VIP-Gamepass | **40 Gems** (−20 %) | VERIFIED · HIGH · [S75, S72:Summon] |
| Legacy-Banner (RR) | zahlt in **Legacy Gems** (aus Gems umtauschbar oder durch „Disenchant“ alter Units) | OBSERVED · HIGH · [S72:Summon, S72:Update Log (Update 19)] |
| Umtauschkurs Gems → Legacy Gems | **UNKNOWN** | UNKNOWN |
| Event-Banner | nur **Event-Währung**; DERIVED 10 je Summon (RR: 2.000 für 200 Summons; LEGACY-Ende: 1.000 für 100 Summons) | DERIVED · MEDIUM · [S72:Summon, S72:Summon@33626] |
| Summon Ticket | Gold-Shop bzw. Merchant **500 Gold**; Kapseln; Login-Belohnung Tag 6; Codes | OBSERVED · HIGH · [S72:Items, S73, S68] |
| Multi Summon (10er) | **UNKNOWN**. Weder Wiki, Trello noch Datenmodul nennen einen Mehrfach-Pull oder Rabatt. Die Daily-Quest „Summon at least 5 Fighters“ setzt keinen Multi-Pull voraus. | UNKNOWN |
| Spielerlevel | Banner-Tiers: Tier 0 (Lv 0+) keine Secrets/Shinies; Tier 1 (Lv 5+) Shinies; Tier 2 (Lv 20+) Secrets und Shinies. Seit Update 1.5 | OBSERVED · HIGH · [S72:Summon, S73] |

## Banner-Typen

### Standard-Banner (LEGACY)

| Aspekt | Wert | Tag |
|---|---|---|
| Inhalt | stündlich neue Zufallsauswahl: 3 Rare, 1 Epic, 1 Legendary, 1 Mythic angezeigt | OBSERVED · MEDIUM · [S72:Summon@33626] |
| Refresh | **jede Stunde**; „manchmal 50/50, dass die Units gleich bleiben“ | OBSERVED · LOW · [S72:Summon@33626] |
| Raten | Grundraten (siehe [Raten](#raten-je-rarität)) | OBSERVED · HIGH |
| Verbleib | ab Update 17 (30.09.2023) wurden alte Mythics (Release bis 6.5) aus dem Special Banner entfernt und waren „nur noch im Standard Banner“ | OBSERVED · HIGH · [S72:Update Log] |

### Special-Banner (LEGACY ab Update 7, RR)

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | Update 7 (12.11.2022): „2x Mythic chance“, Featured-Units mit deutlich höherer Chance, stündlicher Refresh | OBSERVED · HIGH · [S72:Update Log] |
| Mythic-Rate | **0,5 %** | OBSERVED · HIGH · [S72:Summon] |
| Featured | **3 Mythics**: Center **50 %** des Mythic-Anteils, beide Seiten je **10 %**, jeder unfeatured Mythic den Rest | OBSERVED · HIGH · [S72:Summon] |
| Unfeatured je Unit | **0,526 %** (Text im Special-Abschnitt, seit LEGACY unverändert) vs. **0,625 %** (Vergleichssatz im Legacy-Abschnitt, RR) → Konflikt, siehe unten | OBSERVED · MEDIUM |
| Refresh | stündlich, Featured wechseln | OBSERVED · HIGH · [S72:Summon] |
| Pool | RR: alle beschwörbaren Units inkl. Update 19+, ausgenommen Units, die nur anders erhältlich sind; Liste entfernter Units auf der Wiki-Seite (31 Einträge) | OBSERVED · HIGH · [S72:Summon] |

### Legacy-Banner (RR ab Update 19)

| Aspekt | Wert | Tag |
|---|---|---|
| Währung | Legacy Gems | OBSERVED · HIGH · [S72:Summon] |
| Featured | 3 Mythics, stündlicher Refresh | OBSERVED · HIGH · [S72:Summon] |
| Raten | „ähnlich Special“; unfeatured Mythic je **0,714 %** statt **0,625 %** des Mythic-Anteils, weil Units ab Update 19 fehlen | OBSERVED · HIGH · [S72:Summon] |

### Event-Banner

| Aspekt | LEGACY (Update 13.5 bis Dez. 2023) | RR (ab Dez. 2024) | Tag |
|---|---|---|---|
| Mythic-Rate | **1 %** („quadrupled“) | **0,5 %** | OBSERVED · MEDIUM · [S72:Summon@33626 / S72:Summon] |
| Featured | **4** Limited-Mythics, keine anderen Mythics | **3** Limited-Mythics, keine anderen Mythics | OBSERVED · MEDIUM |
| Rotation | fest für die Event-Dauer, kein stündlicher Refresh | dito | OBSERVED · HIGH |
| Pity | **100** Summons (1.000 Event-Währung), sichtbar | **200** Summons (2.000 Event-Währung) | OBSERVED · MEDIUM |
| Pity-Ziel | **unbesessene** Featured-Mythics zuerst, bis alle besessen sind | dito | OBSERVED · HIGH · [S72:Summon] |
| Legendary-Pity | nicht vorhanden | nicht vorhanden | OBSERVED · HIGH |
| Luck Potions | – | wirken laut Wiki **nicht** auf das Event-Banner | OBSERVED · MEDIUM · [S72:Summon] |

Ein Teil der Sekundärquellen (S43: „Event: Mythic 0,25 %, Mythic-Skin 0,249 %, Secret 1 : 80.000“) beschreibt sehr wahrscheinlich **keinen Gem-Banner, sondern die Event-Kapseln** („Stars“, z. B. Icy Star im Winter 2024 für 150 Stars). Deren Struktur im Datenmodul S68 passt exakt: 0,25 % Mythic-Unit + 0,249375 % Mythic-Skin. Siehe [Event-Kapseln](#event-kapseln-stars). RECONSTRUCTED · MEDIUM · [S68, S72:Events, S43]

### Event-Kapseln („Stars“)

Event-Kapseln werden im Event-Shop gegen Event-Währung gekauft und wie ein Summon geöffnet (Lootbox). Daten aus `Module:ItemData/Data` (`usage.possible_rewards`, `_mythic_unit_pity`). OBSERVED · HIGH · [S68]

| Kapsel | Event | Preis | Inhalt (Summe der `chance`) | `_mythic_unit_pity` |
|---|---|---|---|---|
| Frozen Star | Christmas 2022 | 150 Stars [S72:Events] | Rare-Skin 81,545625 %, 2 Epic-Skins je 7,98 %, 5 Legendary-Skins je 0,399 %, Mythic-Skin 0,249375 %, 3 Mythic-Units je 0,0833 % (zus. **0,25 %**); Σ = 100 % | 400 |
| Haunted Star | Halloween 2022 | 150 Candies | 2 Rare-Skins je 40,77 %, 2 Epic-Skins je 7,98 %, 7 Legendary-Skins je 0,285 %, 2 Mythic-Skins je 0,1247 %, 3 Mythic-Units je 0,0833 %; Σ = 100 % | 400 |
| Icy Star | Winter 2024 (RR) | 150 Stars | im Modul nur der erste Eintrag (Rare-Skin 81,545625 %); Rest UNKNOWN | 400 |
| Devil Star (`capsule_csm_pity`) | Chainsaw-Event | Pity-Drop/Makimo-Verträge | 6 Mythic-Units je 1/6 | 1 |
| Demon Academy Star | April 2023 | UNKNOWN | 3 Mythic-Units je 1/3 | – |
| Academy Star | Skin-Kapsel | UNKNOWN | 7 Skins: 64 / 12,5 / 12,5 / 5 / 5 / 0,5 / 0,5 % | – |
| Raid-Kapseln (Desert, Rumbling, Blazing Star) | Raids | Raid-Drop | garantiert 6–10 Shards; 2,5 % Raid-Unit | – |
| Weltkapseln (Ocean, Soul, Chimera, Curse, Celestial Star) | Infinite/Events | Drop | garantiert 2–5 Shards; Summon Ticket 21 %, Star Fruit 12,9 %, je Farbfrucht 4,05 %, Rainbow 0,9 %, Star Remnant 15 %, Shard 32 %; teils Unit 2 %; „nicht von Luck Boosts betroffen“ | – |
| Star Fruit Capsule | – | – | Star Fruit 43 %, je Farbfrucht 13,5 %, Rainbow 3 % | – |

DERIVED aus der Frozen-Star-Zeile: Die Kapsel zieht zuerst die Mythic-Unit (0,25 %) und verteilt die übrigen 99,75 % nach dem Raritätenschlüssel **81,75 / 16 / 2 / 0,25**: 0,9975 × 81,75 % = 81,545625 %, 0,9975 × 16 % = 15,96 %, 0,9975 × 2 % = 1,995 %, 0,9975 × 0,25 % = 0,249375 %. Diese Zahlen stehen exakt so im Modul. Damit ist der Rare-Anteil **81,75 %**, nicht 81,9 % (Konflikt C1, siehe unten).

## Raten je Rarität

### Grundraten (Standard-Banner; Basis aller Banner)

| Rarität | Wiki-Angabe | Normiert (DERIVED, Σ = 100 %) | Shiny (×1 %) | Shiny mit Shiny Hunter (×3 %) | Tag |
|---|---:|---:|---:|---:|---|
| Rare | 81,9 % | **81,75 %** | 0,819 % | 2,457 % | OBSERVED · HIGH · [S72:Summon]; Normierung DERIVED · MEDIUM · [S68] |
| Epic | 16 % | 16 % | 0,16 % | 0,48 % | OBSERVED · HIGH |
| Legendary | 2 % | 2 % | 0,02 % | 0,06 % | OBSERVED · HIGH |
| Mythic | 0,25 % | 0,25 % | 0,0025 % | 0,0075 % | OBSERVED · HIGH |
| Secret | **1 : 400.000** (0,00025 %), seit Update 20.4.1 bekannt; keine Pity | – | „???“ | – | OBSERVED · MEDIUM · [S72:Summon] |
| Summe Wiki | 100,15 % ⚠ | 100 % | | | DERIVED |

- Jede Unit derselben Rarität hat die gleiche Chance. OBSERVED · HIGH · [S72:Summon]
- **Shiny:** jeder Summon 1 % Shiny (3 % mit Shiny Hunter). VERIFIED · HIGH · [S75, S72:Summon]
- **Zusatzdrops:** Items fallen „zusätzlich“ zum Unit-Ergebnis; jeder Summon bringt mindestens eine Unit. Star Remnant „low chance“ aus Summons. OBSERVED · HIGH · [S72:Frequently Asked Questions, S72:Items]. Die Zahl **0,25 % pro Summon** aus Sitzung 1 (S03) ist im Volltext nicht auffindbar → OBSERVED · LOW.
- Secret/Shiny-Mythic-Pulls werden seit Halloween 2022 global im Chat angekündigt. OBSERVED · HIGH · [S72:Summon]

### Special/Legacy/Event (Mythic-Aufschlag)

| Banner | Mythic | Shiny Mythic | mit Shiny Hunter | Tag |
|---|---:|---:|---:|---|
| Special | 0,5 % | 0,005 % | 0,015 % | OBSERVED · HIGH · [S72:Summon] |
| Event (RR) | 0,5 % | 0,005 % | 0,015 % | OBSERVED · HIGH |
| Event (LEGACY-Ende) | 1 % | 0,01 % | 0,03 % | OBSERVED · MEDIUM · [S72:Summon@33626] |

Aus welcher Rarität die zusätzlichen 0,25 Prozentpunkte des Special-Banners kommen, ist **UNKNOWN**. Denkbar ist das Kapsel-Schema (erst Mythic würfeln, Rest anteilig nach 81,75 / 16 / 2 verteilen); ein Beleg dafür fehlt. RECONSTRUCTED · LOW

### Featured-Verteilung innerhalb des Mythic-Anteils

| Ziel | Anteil am Mythic | absolut je Summon (Special, 0,5 %) |
|---|---:|---:|
| Center-Featured | 50 % | **0,25 %** |
| linke Seite | 10 % | 0,05 % |
| rechte Seite | 10 % | 0,05 % |
| alle Unfeatured zusammen | 30 % | 0,15 % |
| ein Unfeatured (Special RR) | 0,625 % | 0,003125 % |
| ein Unfeatured (Legacy-Banner) | 0,714 % | 0,00357 % |
| ein Unfeatured (Special, alter Text) | 0,526 % | 0,00263 % |

DERIVED Poolgröße: 30 % / 0,526 % ≈ 57; 30 % / 0,625 % = 48; 30 % / 0,714 % = 42 unfeatured Mythics. Die Prozentwerte sind „vom Wiki gepflegt“ („will update that % every update“, Revisionskommentar 2023-06-23) und hängen also an der Poolgröße. OBSERVED · MEDIUM · [S72:Summon, Versionsgeschichte]

### Luck-Boosts

| Boost | Effekt | Preis | Tag |
|---|---|---|---|
| Luck Potion | erhöht Epic/Legendary/Mythic; **×1,25** laut Trello (2022); senkt die Pity nicht | Merchant **200 Gems**; Login-Belohnung Tag 7 | OBSERVED · MEDIUM · [S73, S72:Items, S72:Summon] |
| Laufzeit | Modul: 30 Minuten (`boost_duration 1800`); seit Update 10.5 (03.02.2023) „pro Banner“ statt 15–30 Minuten; Luck-Boosts zählen im Match nicht herunter | OBSERVED · MEDIUM · [S68, S72:Update Log] |
| Super Lucky | Legendary/Mythic ×2 für ein Banner | 99 R$ | OBSERVED · HIGH · [S72:Store] |
| Ultra Lucky | Legendary/Mythic ×3 für ein Banner | 149 R$ | OBSERVED · HIGH · [S72:Store] |
| Stapeln | alle drei zusammen → Mythic **0,936 %** | – | OBSERVED · LOW · [S72:Summon] |

Widerspruch: Der LEGACY-Text (Dez. 2023) sagt, Super Lucky sei „in Wahrheit flach +0,125 %“ und Ultra Lucky „flach +0,25 %“. 0,936 % passt zu 0,25 % × 1,25 × 3 = 0,9375 % (ohne Super Lucky) und nicht zu einer vollen Multiplikation (0,25 × 1,25 × 2 × 3 = 1,875 %). Die Rechenregel ist **UNKNOWN**. DERIVED · LOW

## Pity

### Regeln je Version

| Zeitraum/Version | alter Wert (Sitzung 1) | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| LEGACY Standard | „400 → Center-Featured“ | 400 Summons (+0,25 %/Summon) → **ein Mythic** des Banners; unsichtbar; Reset bei jedem Mythic und bei jedem Banner-Refresh | – | OBSERVED · MEDIUM · [S72:Summon@33626, S73] |
| LEGACY Special | „400 → Center“ | **keine** Mythic-Pity, nur Legendary-Pity | – | OBSERVED · MEDIUM · [S72:Summon@33626] |
| LEGACY Legendary | 50 (+2 %/Summon) | bestätigt; sichtbar; Reset bei Legendary und bei Banner-Wechsel; 2.500 Gems (2.000 VIP) | – | OBSERVED · HIGH · [S72:Summon@33626, S73] |
| RR bis 20.4 (Legacy-Banner) | – | wie LEGACY Standard (400 beliebiger Mythic, 50 Legendary). Im Jan. 2025 wurde die Mythic-Pity im Wiki als „NOT real“ bestritten und wieder eingesetzt („u need evidence“) | – | OBSERVED · LOW · [S72:Summon@42938, Versionsgeschichte] |
| RR ab 20.4.1 (Special + Legacy) | – | **400 Summons → Center-Featured** („Featured unit pity“, sichtbar); Reset bei **jedem** Mythic und bei jedem Banner-Refresh | **400** | OBSERVED · HIGH · [S72:Summon, S72:Update Log 20.4.1] |
| RR ab 20.4.1 Legendary | – | **entfernt** | entfernt | OBSERVED · MEDIUM · [S72:Summon (Trivia)] |
| RR Event | – | 200 Summons, unbesessene Featured zuerst | 200 | OBSERVED · HIGH · [S72:Summon] |

Widerspruch innerhalb von `S72:Summon`: Die Trivia sagt „pity chance for middle unit after **200** times summon“ für alle Banner; der Haupttext und die Kostenangabe (20.000 Gems = 400 × 50) sagen **400**. Wir verwenden 400. → `unknowns_P8` (C3 neu).

Weitere Pity-Regeln:

- Kosten bis zur Center-Pity: 400 × 50 = **20.000 Gems** (VIP 16.000). DERIVED · HIGH · [S72:Summon]
- Luck-Boosts senken die Pity nicht. OBSERVED · HIGH · [S72:Summon]
- Die Pity überträgt sich **nicht** über einen Banner-Refresh (stündlich) hinweg. OBSERVED · HIGH · [S72:Summon, S73 „resets every banner switch“]
- Soft Pity: nicht belegt. UNKNOWN
- Secret-Pity: nur auf dem April-Fools-Banner 2025 (Wert UNKNOWN). OBSERVED · MEDIUM · [S72:Update Log 20.4.1]

## Mathematik

Notation: `p` = Mythic-Chance je Summon, `f` = Anteil des Ziels am Mythic, `N` = Pity, `q = 1 − p`.

```text
ohne Pity:             P(≥1 in n) = 1 − (1 − p·f)^n,     E[Summons] = 1 / (p·f)
Pity N, Reset nur durch das Ziel (f = 1):
                       E[Summons] = (1 − q^N) / p,        P(Pity greift) = q^(N−1)
Pity N, Reset durch JEDEN Mythic, Pity gibt das Ziel (RR-Center):
  ein „Zyklus“ endet beim nächsten Mythic oder spätestens bei Summon N
  E[Zykluslänge] L = (1 − q^N) / p
  P(Zyklus endet mit Ziel) s = f·(1 − q^(N−1)) + q^(N−1)
  E[Summons bis Ziel] = L / s          (Erneuerungsargument: E[T] = L + (1 − s)·E[T])
```
DERIVED · HIGH (Standardgeometrie, unabhängige Züge vorausgesetzt)

### Center-Featured, RR ab 20.4.1 (p = 0,005, f = 0,5, N = 400)

Annahme: alle Summons innerhalb **einer** Rotation (kein Refresh dazwischen). Exakte Rechnung (Markov-DP) und Monte-Carlo (Python, `random.Random(20261006)`, 200.000 Läufe; Skript `p8_sim.py` im Scratch des Koordinators).

| n Summons | Gems (50) | P(Center ≥ 1), DP |
|---:|---:|---:|
| 50 | 2.500 | 11,76 % |
| 100 | 5.000 | 22,14 % |
| 200 | 10.000 | 39,38 % |
| 300 | 15.000 | 52,81 % |
| 399 | 19.950 | 63,17 % |
| **400** | **20.000** | **76,76 %** |
| 600 | 30.000 | 90,01 % |
| 800 | 40.000 | 96,43 % |
| 1.200 | 60.000 | 99,51 % |

- 400 Summons garantieren den Center also **nicht**: Ein Side- oder Unfeatured-Mythic setzt die Pity zurück. DERIVED · HIGH
- E[Zykluslänge] = 173,1 Summons; P(Zyklus endet mit Center) = 0,5677; **E[Summons bis Center] = 304,9** → **15.245 Gems** (VIP 12.196). Monte-Carlo: 304,1 Summons; 76,8 % Erfolg in 400; in 23,8 % der Läufe kommt der Center über die Pity. DERIVED · HIGH
- P(ein Zyklus läuft bis zur Pity) = 0,995^399 = **13,5 %**.
- Praktische Grenze: Die Rotation dauert 1 Stunde. Wie viele Summons pro Stunde möglich sind, ist UNKNOWN (Animation, „Quick Summon“-Option seit 20.4.1). Wer nicht alle Summons in einer Rotation schafft, verliert die Pity beim Refresh.

**Korrektur:** Sitzung 1 rechnete E = 253 Summons (12.652 Gems) für den Center. Diese Formel gilt nur, wenn ausschließlich das Ziel die Pity zurücksetzt und jeder Mythic zählt (f = 1, p = 0,0025). Das ist genau der **LEGACY-Standard-Fall „irgendein Mythic“** (unten), nicht der RR-Center. Für den Center ist E ≈ 305.

### LEGACY Standard, beliebiger Mythic (p = 0,0025, N = 400)

- E[Summons] = (1 − 0,9975^400) / 0,0025 = **253,0** → 12.652 Gems (VIP 10.121). DERIVED · HIGH
- P(Pity greift) = 0,9975^399 = 36,8 %.

### Legendary-Pity (LEGACY bis RR 20.4, p = 0,02, N = 50)

- E[Summons] = **31,8** (1.590 Gems); P(Pity greift) = 0,98^49 = 37,2 %. DERIVED · HIGH

### Ohne Pity (LEGACY Special, Side-Featured, Unfeatured)

| Ziel | p je Summon | E[Summons] | P(≥1 in 100 / 400 / 1.000) |
|---|---:|---:|---|
| Center, LEGACY Special (keine Mythic-Pity) | 0,25 % | 400 | 22,1 % / 63,3 % / 91,8 % |
| Side-Featured | 0,05 % | 2.000 | 4,9 % / 18,1 % / 39,3 % |
| bestimmter Unfeatured (Special RR) | 0,003125 % | 32.000 | – |

DERIVED · HIGH

### Event-Banner (Monte-Carlo, Seed 20261006, 100.000 Läufe)

Annahme: Natürliche Mythics verteilen sich gleich auf die Featured (RECONSTRUCTED · LOW, nicht belegt); Pity gibt einen noch fehlenden Featured; Pity-Reset bei jedem Mythic.

| Version | p | Pity | Featured | E[Summons] alle Featured | E[Summons] bis zu einem bestimmten | Währung (×10) |
|---|---:|---:|---:|---:|---:|---:|
| RR | 0,5 % | 200 | 3 | **505,8** | 218,0 | ≈ 5.058 / 2.180 |
| LEGACY-Ende | 1 % | 100 | 4 | **351,5** | 119,8 | ≈ 3.515 / 1.198 |

DERIVED · MEDIUM

### Event-Kapseln (Frozen/Haunted/Icy Star)

Mythic-Unit 0,25 %, Pity 400, Reset vermutlich bei jedem Mythic-Unit-Drop (UNKNOWN): E = 253 Kapseln ≈ **37.950 Event-Währung** (150 je Kapsel); Pity-Kosten 60.000. DERIVED · MEDIUM · [S68, S72:Events]

### Secret und Shiny

| Ziel | p | E[Summons] | Bemerkung |
|---|---:|---:|---|
| Secret (1 : 400.000) | 0,00025 % | 400.000 | P(≥1 in 1.000 / 10.000 / 100.000) = 0,25 % / 2,47 % / 22,1 % |
| Shiny Mythic, Standard | 0,0025 % | 40.000 | mit Shiny Hunter 13.333 |
| Shiny Mythic, Special | 0,005 % | 20.000 | mit Shiny Hunter 6.667 |

DERIVED · HIGH. Die alte Zeile „Secret auf dem RR-Event-Banner 1 : 80.000“ (S43) ist nicht durch S72 gedeckt → OBSERVED · LOW.

## Banner-Rotation (Implementierung)

```text
rotationIndex = floor(serverTimeUtc / 3600)            // stündlich, OBSERVED · HIGH
seed          = hash(bannerId, rotationIndex)
featured      = pickDistinct(mythicPool(bannerId), 3, seed)   // [center, left, right]
onRotationChange(player): player.pity[bannerId] = 0          // OBSERVED · HIGH
```
Ob alle Server dieselbe Rotation sehen, ist nicht ausdrücklich belegt; der Trello-Hinweis „Wait till 30 minutes into the hour“ (S73, Karte Gon) spricht für eine global zeitgesteuerte Rotation. RECONSTRUCTED · MEDIUM

```text
summon(player, banner):
  pay(cost)                                             // 50 Gems | 40 VIP | Ticket | Legacy Gems | Event-Währung
  player.pity += 1
  if banner.pityN and player.pity >= banner.pityN:
      unit = banner.pityTarget(player)                  // Center; Event: unbesessener Featured
  else:
      rarity = roll(rates × luckBoost)
      unit = (rarity == Mythic) ? rollFeatured(banner) : uniform(pool[rarity])
  if unit.rarity == Mythic: player.pity = 0             // RR: jeder Mythic setzt zurück
  shiny = rand() < (shinyHunter ? 0.03 : 0.01) and player.level >= 5
  extra drops (Star Remnant …) unabhängig               // Rate UNKNOWN
```
RECONSTRUCTED · MEDIUM (Ablauf aus S72:Summon; Reihenfolge Pity-vor-Roll ist Annahme)

## Für unseren Nachbau

- DESIGN: Pity nur durch das Ziel zurücksetzen lassen oder die Pity über Rotationen hinweg erhalten. Die AA-Regel (Reset bei jedem Mythic und stündlich) wirkt intransparent: 400 Summons geben nur 76,8 % auf den Center.
- DESIGN: Raten so festlegen, dass sie exakt 100 % ergeben (AA-Wiki: 100,15 %), und im UI anzeigen.
- DESIGN: Event-Banner mit „unbesessene zuerst“-Pity übernehmen; das ist spielerfreundlich und gut zu implementieren.
