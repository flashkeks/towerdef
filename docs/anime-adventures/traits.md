# Traits und Shiny

Legende: `ART · CONFIDENCE · [Quelle]` (siehe [README](README.md#kennzeichnung)). `S72:<Seite>` = Wiki-Volltext, `S72:Traits@rev` = ältere Fassung derselben Wiki-Seite aus der Versionsgeschichte (S77-Verfahren, siehe Abschnitt [Versionen](#versionsgeschichte-des-trait-pools)). Maschinenlesbar: [data/traits.json](data/traits.json).

## Trait-System

| Regel | Wert | Tag |
|---|---|---|
| Was ist ein Trait | zufälliger Modifier auf Damage, SPA, Range, Yen oder XP einer Unit-Instanz | OBSERVED · HIGH · [S72:Traits] |
| Wann entsteht er | beim Summon oder Portal-Drop („might come with a trait“) oder per Reroll beim Trait-NPC | OBSERVED · HIGH · [S72:Traits, S73:Traits] |
| Chance auf Trait bei neuer Unit (RR) | **1 %**; bei Erfolg weitere **1 %** auf einen **Doppel-Trait** | OBSERVED · MEDIUM · [S72:Traits (Trivia)] |
| Chance auf Trait bei neuer Unit (LEGACY) | „small chance“, Zahl UNKNOWN | OBSERVED · LOW · [S73:Traits] |
| Slots | normal **1** Trait; selten **2 Traits gleichzeitig** (über Summon und Reroll möglich) | OBSERVED · HIGH · [S73:Traits, S72:Traits] |
| Doppel-Trait beim Reroll (RR) | **0,2 %** pro Reroll | OBSERVED · MEDIUM · [S72:Traits (Trivia)] |
| Doppel-Trait-Wirkung | Boni der zwei Traits werden **addiert** (2× Superior III = +30 % Damage; 2× Unique = +600 % Damage, −20 % SPA, +20 % Range) | OBSERVED · MEDIUM · [S72:Traits] |
| Reroll auf Unit ohne Trait | gibt ihr einen Trait (Reroll = „Rerolls or gives unit a trait“) | OBSERVED · HIGH · [S68:star_remnant, S72:Traits@6052] |
| Tiers I/II/III | nur Superior, Nimble, Range. Tier III trägt die Rarität **Epic** (lila), I/II sind **Rare**. Tier-Verteilung innerhalb der Roll-Chance: **UNKNOWN** | OBSERVED · HIGH · [S72:Traits] |
| Evolution | Legendary → Mythic: der Trait wird **übertragen**. Darum ist Rerollen auf der Legendary-Vorform 5× billiger | OBSERVED · HIGH · [S72:Traits@33631, S72:Traits] |
| Trait Transfer (RR, Update 19) | Units opfern, um einen Trait auf eine **andere Kopie derselben Unit** zu übertragen, 100 % Erfolg. Anzahl der Opfer UNKNOWN | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Trait Locking | im Volltext **nicht vorhanden** (kein Lock-Mechanismus dokumentiert) | UNKNOWN (vermutlich nicht existent) |
| Trait-Pity | **keine** dokumentiert | UNKNOWN (vermutlich nicht existent) |
| Anti-Spam | Update 10.5: Reroll-Spam bei Server-Lag unterbunden (serverseitiger Reroll) | OBSERVED · HIGH · [S72:Update Log] |
| Optik | Godspeed blaue Blitz-Aura, Reaper rot-schwarze Aura, Celestial lila Galaxie-Aura, Divine Engelsflügel, Golden goldenes Aussehen, Unique Aura mit Runen | OBSERVED · HIGH · [S72:Traits, S73:Traits] |

### Trait-Tabelle (RR-Stand und LEGACY-Endstand)

Der Pool ist seit dem Christmas-Update vom 25.12.2022 unverändert. Die Wiki-Fassung vom 25.12.2023 (Legacy-Ende) und die RR-Fassung vom 28.04.2025 haben dieselben Chancen und Effekte. [S72:Traits, S72:Traits@33631]

| Trait | Rarität | Roll-Chance | Damage | SPA | Range | Sonstiges | Ø-DPS-Effekt laut Wiki | Tag |
|---|---|---:|---|---|---|---|---|---|
| Superior I/II/III | Rare (III: Epic) | 29,97 % | +10 / +12,5 / +15 % | – | – | – | +10 / 12,5 / 15 % | OBSERVED · HIGH |
| Nimble I/II/III | Rare (III: Epic) | 24,98 % | – | −5 / −7,5 / −12 % | – | – | +5,2 / 8,1 / 13,6 % | OBSERVED · HIGH |
| Range I/II/III | Rare (III: Epic) | 24,98 % | – | – | +10 / +12,5 / +15 % | – | 0 % (wenn Ziele ohnehin erreichbar) | OBSERVED · HIGH |
| Adept | Legendary | 9,99 % | – | – | – | **+50 % Unit-XP** | 0 % | OBSERVED · HIGH |
| Culling | Legendary | 5 % | +20 % gegen Gegner mit **≤ 30 % HP** | – | – | – | ≈ +6 % | OBSERVED · HIGH |
| Sniper | Legendary | 2,5 % | – | – | **+25 %** | – | 0 % | OBSERVED · HIGH |
| Godspeed | Legendary | 1 % | – | **−20 %** | – | – | +25 % | OBSERVED · HIGH |
| Reaper | Mythic | 0,8 % | **+15 %** | – | – | zusätzlich **+25 % gegen Bosse** (multiplikativ: 1,15 × 1,25) | +15 % / +43,75 % gegen Bosse | OBSERVED · HIGH |
| Celestial | Mythic | 0,36 % | +10 % | – | +10 % | **+20 % des Schadens zusätzlich als True Damage**; wirkt auch auf DoT | +32 % | OBSERVED · HIGH |
| Divine | Mythic | 0,2 % | **+20 %** | **−10 %** | **+20 %** | – | +33,3 % | OBSERVED · HIGH |
| Golden | Mythic | 0,15 % | **+30 %** | – | – | **+20 % Yen** bei jeder Geldausschüttung (nur C.E.O. und Bulby; Weather Girl (Thief) bekommt nur den Damage-Bonus) | +30 % | OBSERVED · HIGH |
| Unique | Mythic | 0,1 % | **×4 (+300 %)** | −10 % | +10 % | **max. 1 Platzierung** dieser Unit (nur für den Besitzer) | +344,4 % (Einzel-Unit) | OBSERVED · HIGH |
| **Summe** | | **100,03 %** | | | | | | DERIVED |

Raritäten der Traits: Wiki (Rare/Epic/Legendary/Mythic) [S72:Traits]. Die frühe Trello-Karte gruppiert dieselben Traits als Common / Legendary / Mythic [S73:Traits].

**Rechenregeln aus der Tabelle** (DERIVED · HIGH, nachgerechnet aus den Wiki-Angaben):

```text
DPS-Faktor = (1 + dmgBonus) / (1 + spaBonus)          // spaBonus negativ, z. B. −0,2
Godspeed:   1 / 0,8               = 1,25   → +25 %   ✓
Nimble III: 1 / 0,88              = 1,136  → +13,6 % ✓
Divine:     1,2 / 0,9             = 1,333  → +33,3 % ✓
Unique:     4 / 0,9               = 4,444  → +344,4 % ✓
Reaper Boss: 1,15 × 1,25          = 1,4375 → +43,75 % ✓
Culling Ø:  0,30 × 20 %           = +6 %  (Annahme: 30 % der Schadenszeit unter der HP-Schwelle)
Unique Gruppen-DPS bei Spawn Cap n: 4,444 / n − 1  → n=2: +122,2 %, n=3: +48,1 %, n=4: +11,1 %, n=5: −11,1 %, n=6: −25,9 % ✓
```

Die Wiki-Werte für Nimble I/II (+5,2 / +8,1 %) passen genau zu `1/(1−x)`. SPA-Boni werden also **durch Division** angewandt, nicht als Multiplikator auf die Angriffsrate.

**Celestial und Buffer** (OBSERVED · MEDIUM · [S72:Traits]): Der True-Damage-Anteil bezieht sich offenbar auf den **unverstärkten** Damage. Mit einem +100-%-Buffer sinkt der Anteil effektiv auf 10 %. Laut RR-Text wirkt ein „Allschaden“-Buff (Griffin) auch auf den True-Damage-Teil. Die Legacy-Fassung gab dafür 7,5 % an, die RR-Fassung 13,3 %; der Wortlaut ist widersprüchlich.

### Versionsgeschichte des Trait-Pools

Aus der Versionsgeschichte der Wiki-Seite `Traits` (S77-Verfahren, Revisions 6052, 8911, 33631) und der Trello-Karte (S73).

| Zeitraum/Version | Trait | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|---|
| LEGACY U1 (15.07.2022) | Pool | – | „New mythic trait added, buffed mythic traits“ | – | [S72:Update Log] |
| LEGACY bis 24.12.2022 → Christmas 25.12.2022 | Superior | 30 % | 29,97 % | 29,97 % | [S72:Traits@6052, @8911] |
| dto. | Range / Nimble | je 25 % | je 24,98 % | 24,98 % | dto. |
| dto. | Godspeed | 1,5 % | 1 % | 1 % | dto. |
| dto. | Reaper (Chance) | 0,6 % | 0,8 % | 0,8 % | dto. |
| dto. | Golden (Chance) | 0,2 % | 0,15 % | 0,15 % | dto. |
| dto. | Golden (Damage) | +10 % | +30 % | +30 % | dto.; Wiki-Kommentar „10% golden to 30%“ |
| dto. | Celestial | – (nicht vorhanden) | neu, 0,36 % („New Mythic Trait! 🌌“) | 0,36 % | dto.; [S72:Update Log (Christmas 2022)] |
| dto. | Summe | 100,09 % (11 Traits) | 100,03 % (12 Traits) | 100,03 % | DERIVED |
| LEGACY bis U10.5 (03.02.2023) | Reaper (Damage) | +12,5 % | +15 % („Reaper trait buffed slightly“) | +15 % | [S72:Traits@8911, S72:Update Log, S72:Traits@33631] |
| LEGACY frühe Trello-Karte (2022-08) | Reaper Boss-Bonus | +20 % (Trello) | +25 % (Wiki ab 10/2022) | +25 % | [S73:Traits] vs. [S72:Traits@6052] → Konflikt, siehe unten |
| LEGACY → RR | Doppel-Trait | „small/rare chance“ | 0,2 % pro Reroll; 1 % × 1 % bei neuen Units | dto. | [S72:Traits@33631, S72:Traits] |
| RR U19 (25.12.2024) | Trait Transfer | – | neu | – | [S72:Update Log] |
| LEGACY → RR | Trait-NPC | „Whis“ (Trello) / „Wis“ (Wiki) | „Ethereal Guide“ | Ethereal Guide | [S73, S72:Traits@33631, S72:Traits] |

Alle übrigen Traits und Werte (Adept 9,99 %, Culling 5 %, Sniper 2,5 %, Divine 0,2 %, Unique 0,1 % sowie alle Effektwerte außer Golden/Reaper) sind seit 10/2022 unverändert. [S72:Traits@6052 bis heute]

**Zur Summe ≠ 100 %:** Weder 100,09 % (alt) noch 100,03 % (neu) ergibt genau 100 %. Die Werte sind also gerundete Anzeigewerte. Die Ursache des alten Konflikts C7 (99,93 %) war ein **fehlender Trait (Unique, 0,1 %)** in der Sitzung-1-Tabelle. RECONSTRUCTED · HIGH. Für den Nachbau normalisieren wir die Gewichte (DESIGN).

### Trait-Reroll

| Aspekt | Wert | Tag |
|---|---|---|
| NPC | RR: **Ethereal Guide** außerhalb des Evolve-Bereichs (Shortcut „Traits and Evolve“); LEGACY: Wis/Whis | OBSERVED · HIGH · [S72:Traits, S72:Traits@33631, S73] |
| Kosten mit Star Remnants | **1** pro Reroll (Rare, Epic, Legendary); **5** (Mythic, Secret) | OBSERVED · HIGH · [S72:Traits, S73:Traits] (LEGACY = RR) |
| Kosten mit Reroll Token | **1** pro Reroll, unabhängig von der Rarität | OBSERVED · HIGH · [S72:Traits] |
| Reroll-Token-Preise (Dev-Product) | 1 = 129 R$, 10 = 999 R$, 50 = 4.500 R$ (seit 09/2022; das 50er-Paket ab 2023) | OBSERVED · HIGH · [S72:Traits, S72:Traits@6052] |
| Reroll-Token handelbar | ja; dient im Handel als Wertmaßstab („RR“) | OBSERVED · HIGH · [S72:Terminology] |
| Reroll-Verteilung | identisch mit den Roll-Chancen oben (Wiki nennt nur eine Tabelle für Summon und Reroll) | RECONSTRUCTED · MEDIUM |
| Trait-Index / Sammelbuch | nicht vorhanden | UNKNOWN |

**Star Remnants – Quellen** (Item `star_remnant`, Rarität Mythic, Wirkung `reroll_trait` [S68]):

| Quelle | Menge | Version | Tag |
|---|---|---|---|
| Travelling Merchant | 400 Gems pro Stück (Shop rotiert: 60 min offen, 30 min Pause, bis zu 3 Angebote) | LEGACY + RR | OBSERVED · HIGH · [S72:Travelling Merchant Shop, S73] |
| Summon | **0,25 %** Bonus pro Summon | LEGACY + RR | OBSERVED · HIGH · [S72:Traits] |
| Daily Challenge | 10–50 (plus 2–3 Stat Cubes, Chance auf 1 Perfect Stat Cube); RR U19: „Daily Challenge rewards significantly increased“ | RR | OBSERVED · HIGH · [S72:Challenges, S72:Update Log] |
| Normale Challenge | 1–2 | VER? | OBSERVED · HIGH · [S72:Challenges] |
| Welt-Kapseln (Stars) | **15 %** Chance auf 1 Remnant pro Kapsel | RR | OBSERVED · HIGH · [S68: capsule_marineford, capsule_jjk u. a.] |
| Infinity Mansion | Raum 30: 5, Raum 50: 10; Saison-Ranking 15–50 | VER? | OBSERVED · HIGH · [S72:Infinity Mansion] |
| Shiny entfernen | **3** pro Unit (Legendary oder höher; auch bei Secret nur 3) | LEGACY | OBSERVED · MEDIUM · [S73:NPCs (Lucifer), S72:Blade Beast (Past)] |
| Star Golem | Boss im neuesten Infinite, Menge UNKNOWN | VER? | OBSERVED · HIGH · [S72:Traits] |

**Reroll Tokens – Quellen:** Battle Pass (mehrere Tiers mit 1–4 Tokens), Evolution-Quests, Events, Raid-Belohnung (3 Tokens), Level-Milestones (jede 5. Stufe 2 Tokens, Level 50 und 100 je 5 → **46 Tokens** bis Level 100, DERIVED), Legacy-Disenchant (RR). OBSERVED · HIGH · [S72:Battlepass, S72:Raids, S72:Level Milestones, S72:Update Log (U19)]

### Erwartungswerte (DERIVED)

Annahme: Jeder Reroll ist ein unabhängiger Zug mit den Chancen oben (RECONSTRUCTED · MEDIUM). Doppel-Traits (0,2 %) sind vernachlässigt.

`E[Rerolls] = 1/p` (geometrisch) · `P(≥1 Treffer in n) = 1 − (1−p)^n` · `n_q = ⌈ln(1−q) / ln(1−p)⌉`

| Ziel-Trait | p | E[Rerolls] | Median (n50) | n für 90 % | P(≥1 in 100) | Remnants Mythic (×5) | Gem-Äquivalent Mythic (400 Gems/Remnant) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Superior (beliebige Stufe) | 29,97 % | 3,3 | 2 | 7 | ≈100 % | 17 | 6.673 |
| Nimble / Range | 24,98 % | 4,0 | 3 | 9 | ≈100 % | 20 | 8.006 |
| Adept | 9,99 % | 10,0 | 7 | 22 | ≈100 % | 50 | 20.020 |
| Culling | 5 % | 20 | 14 | 45 | 99,4 % | 100 | 40.000 |
| Sniper | 2,5 % | 40 | 28 | 91 | 92,0 % | 200 | 80.000 |
| Godspeed | 1 % | 100 | 69 | 230 | 63,4 % | 500 | 200.000 |
| Reaper | 0,8 % | 125 | 87 | 287 | 55,2 % | 625 | 250.000 |
| Celestial | 0,36 % | 277,8 | 193 | 639 | 30,3 % | 1.389 | 555.556 |
| Divine | 0,2 % | 500 | 347 | 1.151 | 18,1 % | 2.500 | 1.000.000 |
| Golden | 0,15 % | 666,7 | 462 | 1.534 | 13,9 % | 3.333 | 1.333.333 |
| Unique | 0,1 % | 1.000 | 693 | 2.302 | 9,5 % | 5.000 | 2.000.000 |
| Divine **oder** Unique | 0,3 % | 333,3 | 231 | 767 | 26,0 % | 1.667 | 666.667 |
| Godspeed **oder besser** (Godspeed … Unique) | 2,61 % | 38,3 | 27 | 88 | 92,9 % | 192 | 76.628 |

Für Rare/Epic/Legendary-Units gilt: Remnants = E[Rerolls] (Faktor 1 statt 5). Mit Reroll Tokens kostet jeder Reroll 1 Token, unabhängig von der Rarität.

**Einordnung** (DERIVED · MEDIUM): Eine Daily Challenge bringt 10–50 Remnants, bei angenommener Gleichverteilung Ø 30. Ein Divine auf einer Mythic kostet erwartet 2.500 Remnants, also rund 83 Daily Challenges. Auf der Legendary-Vorform (Trait wird bei der Evolution übertragen) sind es 500 Remnants, rund 17 Dailies. Die Level-Milestones liefern bis Level 100 insgesamt 46 Tokens, das sind 4,6 % eines erwarteten Unique. Seltene Traits sind damit ein Langzeit-Sink.

**Neue Unit mit Wunsch-Trait (RR, DERIVED):** `P = 1 % × p`, z. B. Unique direkt aus dem Summon: 0,01 × 0,001 = 1 : 100.000 pro Unit.

### Best Use Cases (aus den Effekten abgeleitet, Wiki-Tier-Liste)

| Trait | Einsatz | Tier (Wiki-Tierliste) |
|---|---|---|
| Unique | Units mit Spawn Cap 1–3 und hoher Einzel-DPS; bei Cap ≥ 5 Gruppen-DPS-Verlust, aber 4×+ billiger zu maxen | S |
| Divine | Units mit Spawn Cap ≥ 4, Supporter mit vielen Platzierungen | S |
| Golden | Farm-Units (Yen ×1,2) plus +30 % Damage | A |
| Celestial | Modi mit Resistenzen (True Damage) | A |
| Godspeed | langsame Units (hohe SPA) | A |
| Reaper / Superior / Nimble / Sniper | Boss-Killer / allgemein / allgemein / Range-abhängige Supporter (Fähigkeit trifft mehr Units) | B |
| Range / Adept | Positionsprobleme / Leveln | C |
| Culling | Finisher, schwach | F |

Quelle Tier: OBSERVED · MEDIUM · [S72:Traits Tier List] (Community-Meinung, Stand 11/2024).

Platzierungsbeschränkung durch Traits: nur **Unique** (max. 1 Platzierung). OBSERVED · HIGH · [S72:Traits]

### Konflikte und Lücken (Traits)

| Punkt | Wert A | Wert B | Bewertung |
|---|---|---|---|
| Reaper Boss-Bonus (frühes LEGACY) | +20 % [S73:Traits, 2022-08] | +25 % [S72:Traits@6052, 2022-10] | Trello ist älter und könnte einen Vor-Update-1-Stand zeigen; letzter Stand +25 % |
| Tier-Verteilung I/II/III | UNKNOWN | – | nicht dokumentiert |
| Trait-Chance neuer Units (LEGACY) | UNKNOWN | RR: 1 % | – |
| Trait-Transfer-Kosten | UNKNOWN | – | nur „sacrifice units“ |

### Für unseren Nachbau (DESIGN)

- Den Trait-Pool als **gewichtete Tabelle** mit Gewichten in Promille anlegen, die zusammen 1000 ergeben. Die AA-Werte (0,1 %-Schritte) lassen sich exakt abbilden, wenn Superior 299, Nimble 250 und Range 250 erhalten. DESIGN
- Tiers I/II/III als **Unterwurf** modellieren: erst den Trait würfeln, dann das Tier. Eine Verteilung wie 60/30/10 ist ein DESIGN-Vorschlag, kein AA-Wert.
- Einen **Lock** oder eine **Pity** (z. B. garantiert Legendary-Trait nach 100 Rerolls) ergänzen. AA hat beides nicht dokumentiert; ein Pity-System macht die Ökonomie freundlicher. DESIGN
- Golden-Yen nur auf echte Farm-Ausschüttungen anwenden (wie AA bei Weather Girl). DESIGN nach AA-Vorbild

---

## Shiny System

| Aspekt | Wert | Tag |
|---|---|---|
| Chance | **1 %** pro gezogener Unit, bedingt auf die Rarität | OBSERVED · HIGH · [S72:Summon] |
| Mit Gamepass „Shiny Hunter“ | **3 %** (×3) | VERIFIED · HIGH · [S75, S72:Summon] |
| Absolut (Standard-Raten) | Rare 0,819 %, Epic 0,16 %, Legendary 0,02 %, Mythic 0,0025 % (Special/Event-Banner: Mythic 0,005 %) | OBSERVED · HIGH · [S72:Summon] (= 1 % × Raritätsrate, DERIVED) |
| Mit Shiny Hunter | 2,457 % / 0,48 % / 0,06 % / 0,0075 % (Special/Event: 0,015 %) | OBSERVED · HIGH · [S72:Summon] |
| Shiny Secret | UNKNOWN (Wiki: „???“) | UNKNOWN |
| Freischaltung | Banner-Tier 1 = **Player Level 5+** (Shinies, keine Secrets); Tier 2 = Level 20+ (Secrets und Shinies); Tier 0 = keine Shinies. Seit Update 1.5 | OBSERVED · HIGH · [S72:Summon, S73:Mechanics] |
| Effekt | **rein kosmetisch** (eigene Farb- bzw. Skin-Variante), keine Stat-Boni | OBSERVED · HIGH · [S72:Frequently Asked Questions] |
| Chat-Ansage | Shiny-Mythic- und Secret-Pulls werden seit Halloween 2022 serverübergreifend im Chat angesagt | OBSERVED · HIGH · [S72:Summon] |
| Datenmodell | Unit-Eintrag mit Flag `shiny: true` und Verweis auf das Shiny-Modell (`blessing.shiny` / `blessing.normal`) | OBSERVED · HIGH · [S66] (Asset-Verweise nicht übernommen) |
| Shiny entfernen | NPC **Lucil** (LEGACY: „Lucifer“), seit **Update 1.5**. Nur Legendary und Mythic (Wiki); ergibt **3 Star Remnants** (auch bei Secret nur 3, LEGACY-Beobachtung) | OBSERVED · MEDIUM · [S72:Update Log, S72:Frequently Asked Questions, S72:Blade Beast (Past), S73:NPCs] |
| Shiny und Evolution | Shiny-Mythics brauchen **weniger Material-Units** zum Evolvieren (seit Update 1; z. B. Veko: 15× Goko + 15× Vegita oder **5×** jeweils, wenn Shiny) | OBSERVED · HIGH · [S72:Update Log, S72:Evolution, S72:Carrot] |
| Shiny bleibt bei Evolution erhalten | ja: Für einen Shiny-Fused-Hero genügt **ein** Shiny-Fusionskandidat | OBSERVED · MEDIUM · [S72:Fused Hero] |
| Shiny und Traits | keine Wechselwirkung auf Werte. Optisch überlagert Golden den Shiny-Look teilweise (Beispiel: Maske bleibt unverändert) | OBSERVED · MEDIUM · [S72:Shinobi (Eternal)] |
| Shiny als Belohnung | Leaderboard Top 10 (Top 25 bekommt die normale Version), Tournaments, Infinity-Mansion-Saisonränge („Master“ oder höher), Battle Pass Premium | OBSERVED · HIGH · [S72:Blue Devil, S72:Bozo, S72:Infinity Mansion, S72:Battlepass, S73:NPCs] |
| Shiny-Luck-Potions | RR: aus dem Legacy-Disenchant; Wirkung UNKNOWN | OBSERVED · LOW · [S72:Update Log (U19)] |
| Shiny-Keys | Dungeon-Keys mit Shiny-Variante: +1 Extra-Drop bzw. doppelte Secret-Drop-Chance (Items, nicht Units) | OBSERVED · HIGH · [S68: key_erza_map_shiny, key_jjk_map_shiny] |

**Erwartungswerte** (DERIVED): Shiny Mythic auf dem Standard-Banner `1/0,000025 = 40.000` Summons (2 Mio. Gems zu 50 Gems), mit Shiny Hunter 13.333 Summons; auf dem Special-Banner halbiert sich beides. Details in [summoning.md](summoning.md).

### Für unseren Nachbau (DESIGN)

- Shiny als **unabhängiger Zweitwurf** nach der Rarität (`P = 0,01`, mit Pass 0,03), rein kosmetisch. DESIGN nach AA-Vorbild
- Shiny als **Evolutions-Rabatt** (weniger Material-Units) gibt dem kosmetischen Status einen spielerischen Nutzen, ohne die Balance zu berühren. DESIGN nach AA-Vorbild
