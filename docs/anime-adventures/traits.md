# Traits und Shiny

## Trait-System

- Ein Trait ist ein zufälliger Modifier, den eine Unit beim **Summon** oder **Portal-Drop** erhalten kann. Er boostet Damage, SPA, Range, Yen oder XP. OBSERVED · HIGH · [S03]
- Pro Unit gibt es **einen** Trait-Slot. Mehrere Traits sind nicht belegt. RECONSTRUCTED · MEDIUM
- Manche Traits haben **Stufen I/II/III** mit steigender Wirkung. Die Wahrscheinlichkeitsverteilung der Stufen ist **UNKNOWN**. OBSERVED · HIGH · [S47]

### Trait-Tabelle

Chancen nach [S47] (Gamer Tweak), Sniper und Divine zusätzlich bestätigt durch [S47 GGRecon]. Effekte aus [S47]. Es handelt sich um LEGACY-Trait-Pool. Im Re-Release existieren Hinweise auf einen geänderten Pool („UPD 19 RERELEASE“-Tier-Listen), Inhalt UNKNOWN.

| Trait | Roll-Chance | Damage | SPA | Range | Yen | XP | Spezial | Tag |
|---|---:|---|---|---|---|---|---|---|
| Superior (I/II/III) | 29,97 % | +10 / +12,5 / +15 % | – | – | – | – | – | OBSERVED · HIGH |
| Nimble (I/II/III) | 24,98 % | – | −5 / −7,5 / −12 % | – | – | – | – | OBSERVED · HIGH |
| Range (I/II/III) | 24,98 % | – | – | +10 / +12,5 / +15 % | – | – | – | OBSERVED · HIGH |
| Adept | 9,99 % | – | – | – | – | **+50 %** | Unit-XP | OBSERVED · HIGH |
| Culling | 5,00 % | +20 % gegen Gegner mit wenig HP | – | – | – | – | HP-Schwelle UNKNOWN | OBSERVED · MEDIUM |
| Sniper | 2,50 % | – | – | **+25 %** | – | – | – | VERIFIED · CONFIRMED |
| Godspeed | 1,00 % | – | **−20 %** | – | – | – | – | OBSERVED · HIGH |
| Reaper | 0,80 % | +15 % normal, **+25 % gegen Bosse** | – | – | – | – | – | OBSERVED · MEDIUM |
| Celestial | 0,36 % | +10 % | – | +10 % | – | – | +20 % **True Damage** | OBSERVED · MEDIUM |
| Divine | 0,20 % | **+20 %** | **−10 %** | **+20 %** | – | – | – | VERIFIED · CONFIRMED |
| Golden | 0,15 % | **+30 %** | – | – | **+20 %** | – | Farm-Units | OBSERVED · HIGH (Yen ×1,2 durch Bulby-ROI bestätigt) |
| **Summe** | **99,93 %** | | | | | | | DERIVED |

⚠ Die Summe beträgt 99,93 %. Mögliche Erklärungen sind gerundete Werte oder eine 0,07-%-Restklasse (z. B. „kein Trait“ oder ein seltener, nicht gelisteter Trait). Siehe [unknowns.md](unknowns.md). Ob jeder Summon garantiert einen Trait bekommt, ist **UNKNOWN**; die Formulierung „might come with a trait“ [S03] spricht dagegen.

### Trait-Reroll

| Aspekt | Wert | Tag |
|---|---|---|
| NPC | **Ethereal Guide**, außerhalb des Evolve-Bereichs in der Lobby | OBSERVED · HIGH · [S03] |
| Kosten mit Star Remnants | **1** pro Reroll (Rare, Epic, Legendary); **5** (Mythic, Secret) | VERIFIED · CONFIRMED · [S03, S47] |
| Kosten mit Reroll Token | **1** pro Reroll, unabhängig von der Rarität | OBSERVED · HIGH · [S03] |
| Trait Locking | **UNKNOWN** (nicht belegt) | UNKNOWN |
| Trait-Index (Sammelbuch) | **UNKNOWN** | UNKNOWN |
| Reroll-Verteilung | Annahme: identisch mit den Roll-Chancen oben | RECONSTRUCTED · MEDIUM |

**Quellen für Star Remnants:** Travelling Merchant (400 Gems pro Stück), Daily Challenges (10–50), Shiny-Entfernung (NPC Lucil, nur Legendary und Mythic), Star Golem (Boss im neuesten Infinite), **0,25 %** pro Summon. Normale Challenges geben 1–2. OBSERVED · HIGH · [S03, S15, S21]

**Quellen für Reroll Tokens:** Battle Pass, Evolution-Quests, Events, Level-Milestones (2/2/5/5), Raid-Clear-Belohnungen (z. B. 3 nach 10 Clears). Tokens sind **handelbar**. OBSERVED · HIGH · [S03, S08, S19, S24]

### Erwartungswerte (DERIVED)

Pro Reroll mit Wahrscheinlichkeit `p` gilt: Erwartete Rerolls `E = 1/p` (geometrisch); `P(Erfolg in n) = 1 − (1−p)^n`; Rerolls für 90 %: `⌈ln 0,1 / ln(1−p)⌉`.

| Ziel-Trait | p | E[Rerolls] | Remnants (Mythic, ×5) | Remnants (≤Legendary) | P(≥1 in 100) | n für 90 % | Gem-Äquivalent Mythic (400 Gems/Remnant) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Superior (beliebige Stufe) | 29,97 % | 3,3 | 16,7 | 3,3 | ≈100 % | 7 | 6.670 |
| Nimble | 24,98 % | 4,0 | 20,0 | 4,0 | ≈100 % | 9 | 8.010 |
| Sniper | 2,5 % | 40 | 200 | 40 | 92,1 % | 91 | 80.000 |
| Godspeed | 1 % | 100 | 500 | 100 | 63,4 % | 230 | 200.000 |
| Reaper | 0,8 % | 125 | 625 | 125 | 55,2 % | 287 | 250.000 |
| Celestial | 0,36 % | 277,8 | 1.389 | 278 | 30,3 % | 639 | 555.600 |
| Divine | 0,2 % | 500 | 2.500 | 500 | 18,1 % | 1.151 | 1.000.000 |
| Golden | 0,15 % | 666,7 | 3.333 | 667 | 13,9 % | 1.534 | 1.333.300 |

Die Gem-Äquivalente zeigen: Remnants aus dem Shop sind ein **Notfall-Sink**. Die Hauptversorgung läuft über Dailies und Shiny-Entfernung. DERIVED

### Best Use Cases (aus Effekten abgeleitet)

| Trait | Einsatz |
|---|---|
| Golden | Farm-Units (Yen ×1,2) plus Damage +30 % für Hybrid-Farmer |
| Divine / Celestial | universelle Carries |
| Godspeed / Nimble | Units mit hoher SPA, DoT-Applikatoren (mehr Ticks), Buffer (kürzerer Cooldown?, UNKNOWN) |
| Sniper / Range | AoE- und Hill-Units mit Positionsproblemen |
| Reaper | Boss-Killer |
| Culling | Finisher |
| Adept | Leveln neuer Units |

Platzierungsbeschränkungen durch Traits: keine belegt.

---

## Shiny System

| Aspekt | Wert | Tag |
|---|---|---|
| Chance | **1 %** pro gezogener Unit (bedingt auf die Rarität) | VERIFIED · CONFIRMED · [S01, S04, S52] |
| Mit Gamepass „Shiny Hunter“ | **3 %** (3×) | VERIFIED · CONFIRMED · [S04, S22] |
| Absolut (Standard-Raten) | Rare 0,819 %, Epic 0,16 %, Legendary 0,02 %, Mythic 0,0025 % | DERIVED · CONFIRMED (= 1 % × Raritätsrate) |
| Mit Shiny Hunter | 2,457 % / 0,48 % / 0,06 % / 0,0075 % | DERIVED · CONFIRMED |
| Effekt | **rein kosmetisch**, keine Stat-Boni | VERIFIED · CONFIRMED · [S04] |
| Aussehen | Shiny-Farbvariante bzw. Glanz-Effekt; Details UNKNOWN | OBSERVED · LOW |
| Shiny entfernen | NPC **Lucil**: Legendary und Mythic können den Shiny-Status gegen **Star Remnants** abgeben (Menge UNKNOWN) | OBSERVED · HIGH · [S03] |
| Shiny und Evolution | Shiny-Varianten können evolviert werden (Veko aus Goku/Vegeta „oder deren Shiny-Gegenstücke“). Ob der Shiny-Status erhalten bleibt: UNKNOWN | OBSERVED · MEDIUM · [S46] |
| Shiny und Traits | keine Wechselwirkung belegt | UNKNOWN |
| Shiny-Leaderboard-Units | Top-10-Platzierung ergibt Shiny-Version | OBSERVED · HIGH · [S06] |
| Battle Pass Premium | enthält Shiny-Units | OBSERVED · MEDIUM · [S26] |
| Level-Anforderung | Snippet: „ab Player Level 20+ Secret Units und Shinies ziehbar“ | OBSERVED · LOW (Quelle ggf. RR, nicht bestätigt) |
