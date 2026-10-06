# Game Mathematics

> Legende: `ART · CONFIDENCE · [Quelle]`, siehe [README](README.md#kennzeichnung). `S72:<Seite>` = Wiki-Volltext, `S65` = Unit-Datenmodul (RR), `S67` = Angriffs-/Effektmodul, `S68` = Item-Datenmodul, `S73` = Trello (frühe LEGACY), `S76` = Infobox-Lua-Code. Stand Sitzung 2 (P10). Grundlage sind die in Sitzung 2 überarbeiteten Fachdateien; dort stehen die Einzelbelege. Alle Zahlen in dieser Datei wurden mit einem Python-Skript nachgerechnet (Skript nicht im Repo).

**Leseregel:** Eine Formel ist nur so sicher wie ihr schwächster Teil. Wo nur einzelne Faktoren belegt sind, steht die Zusammensetzung als `RECONSTRUCTED`. Werte ohne AA-Beleg für den Nachbau tragen `DESIGN`.

## Übersicht

| Bereich | Formel belegt? | Abschnitt |
|---|---|---|
| DPS (Damage / SPA, Hits teilen) | ja | [DPS](#dps) |
| Level-Faktor | nur Anker L1 und L100 | [Level](#level-multiplikator) |
| Buffs, Schwäche, Resistenz | ja (additiv bzw. `100/(100+R)`) | [Final Damage](#final-damage) |
| Reihenfolge aller Faktoren | nein | [Final Damage](#final-damage) |
| Crit | Multiplikator ja, Mehrfach-Crit-Regel nein | [Crit](#crit-damage) |
| Enemy-HP und Wave-Scaling | nein (nur Modifikatoren) | [Scaling](#enemy-hp-scaling--wave-scaling) |
| Yen | nur Farm-Units | [Yen](#yen-generation) |
| Summon, Pity, Traits, Shiny, Portale | ja (Raten belegt, Rechnung DERIVED) | ab [Summon](#summon-probability) |

---

## DPS

```text
hitDamage   = Damage / hits                     // hits fehlt im Modul → 1
DPS         = Damage / SPA                      // NICHT × hits
DPS_crit    = DPS × (1 + c × (m − 1))           // c = Crit-Chance ≤ 1, m = Crit-Multiplikator
DPS_dot     = DPS × (1 + T)                     // T = DoT-Gesamtmultiplikator = multiplierPerTick × ticks
DPS_aoe     = DPS × E[getroffene Gegner]
```

| Teil | Tag |
|---|---|
| `DPS = Damage / SPA`, Beispiel 390 / 7 = 55,71 | DERIVED · CONFIRMED · [S35, S72:Terminology] |
| Hits teilen den Damage („Damage stated by the unit itself will be divided by the number of hits“); jeder Hit entfernt eine Schild-Instanz | VERIFIED · CONFIRMED · [S76, S72:Enemy Mechanics] |
| DoT pro Treffer = `hitDamage × multiplierPerTick × ticks`; DoT steigt mit Buffs mit | OBSERVED · HIGH · [S67, S72:Effects, S72:Experiment buff] |
| Crit-Faktor als Erwartungswert, DoT als Zusatzfaktor (ob Crit den DoT erhöht: UNKNOWN) | DERIVED · HIGH (Erwartungswert) / UNKNOWN (Crit × DoT) |
| `E[getroffene Gegner]` hängt von AoE-Form, Radius und Gegnerdichte ab | DERIVED (Form) · Dichte UNKNOWN |

**Korrektur Sitzung 1:** Dort stand `DPS = Damage × Hits / SPA`. Das ist falsch. Mehr Hits erhöhen den Schaden nicht, sie verteilen ihn und knacken Schilde. [S76]

Rechenbeispiele (Level 1, ohne Potential und Trait, Werte aus [data/units.json](data/units.json)) · DERIVED · HIGH · [S65, S67]:

| Unit, Stufe | Damage | SPA | Hits | Hit-Damage | DPS | mit DoT |
|---|---:|---:|---:|---:|---:|---:|
| Captain U0 | 3 | 3 | 1 | 3 | 1,00 | – |
| Captain U4 (Circle r = 4) | 8,5 | 1,5 | 1 | 8,5 | 5,67 pro Ziel | – |
| Black Assassin U5 (Circle r = 10) | 4.500 | 6 | 2 | 2.250 | **750** pro Ziel (nicht 1.500) | – |
| Fiery Commander U0 (Circle r = 7, Burn 6 % × 5) | 250 | 7 | 1 | 250 | 35,71 | `35,71 × 1,30 = 46,43` |
| Eccentric Researcher (Captain) U0 (Crit 50 %, Standard ×1,5; Bleed 10 % × 3) | 390 | 7 | 1 | 390 | 55,71; mit Crit-Erwartung ×1,25 = 69,64 | `55,71 × 1,30 = 72,43`; Crit und Bleed zusammen 90,54 (nur falls Crit den DoT erhöht, UNKNOWN) |

Crit-Erwartungsfaktor `1 + c(m−1)`: 50 %/×1,5 → 1,25; 50 %/×2 → 1,5; 40 %/×1,85 → 1,34; 25 %/×1,5 → 1,125. DERIVED · HIGH

## Level-Multiplikator

```text
L(1)   = 1
L(100) = 9.20406501834430488          VERIFIED · CONFIRMED · [S04, S72:Frequently Asked Questions, S72:Experiment buff]
                                       Gegenprobe: 3.589,59 / 390 = 9,2041 (DERIVED · [S35])
L(110) ≈ L(100) × 1,19 ≈ 10,95        OBSERVED · MEDIUM · [S72:Powerups] („approximately 19 %“)
L(n) für 1 < n < 100                   UNKNOWN
```

Der Faktor gilt für Damage, DoT und Beschwörungs-HP, **nicht** für SPA und Range. OBSERVED · HIGH · [S72:Powerups, S72:Experiment buff]

Kurven-Kandidaten (DERIVED aus den Ankern; keiner ist belegt):

| Modell | Formel | L50 | L100 | L110 | trifft +19 % ab L100? |
|---|---|---:|---:|---:|---|
| linear | `1 + 0,0828693·(n−1)` | 5,06 | 9,204 | 10,03 (+9,0 %) | nein |
| exponentiell | `1,0226739^(n−1)` | 3,00 | 9,204 | 11,52 (+25,1 %) | nein |
| linear mit Knick | bis 100 linear, danach `+0,175/Level` | 5,06 | 9,204 | 10,95 (+19 %) | ja (konstruiert) |

Für den Nachbau: `DESIGN` – Kurve frei wählen, Anker L100 = 9,20406501834430488 einhalten (siehe [technical-reconstruction.md](technical-reconstruction.md#design-defaults-bis-aa-daten-vorliegen)).

## Final Damage

### Belegte Bausteine

| Baustein | Regel | Tag |
|---|---|---|
| Upgrade-Stufe | `damage` der Stufe aus der Tabelle; fehlende Werte erben den Vorwert | OBSERVED · HIGH · [S65, S76] |
| Level | ×L(n), siehe oben | VERIFIED · CONFIRMED |
| Hits | `/ hits` | VERIFIED · CONFIRMED · [S76] |
| Potential (Stat-Roll) | Damage −10 % … ≥ +20 % | OBSERVED · HIGH · [S11 → S72:Powerups] |
| Trait | Superior +10/12,5/15 %, Divine +20 %, Golden +30 %, Unique ×4, Reaper +15 % und ×1,25 gegen Bosse; Doppel-Traits **addieren** | OBSERVED · HIGH · [S47 → S72:Traits] |
| Curse | ±2,5 … 13 % auf einen Stat | OBSERVED · HIGH · [S18 → S72:Powerups] |
| Relic | %DMG je Typ, PEN, PWR, Crit | OBSERVED · HIGH · [S17, S69, S72:Relics] |
| Limit-Break-Bonus | +5 % je ausgerüsteter Limit-Break-Unit, max. +30 %, additiv | OBSERVED · HIGH · [S72:Powerups] |
| **Buffs** | **additiv**: `BuffMult = 1 + Σ damage_add`; +100 % und +10 % = ×2,1; +100 % und +15 % = ×2,15; gleiche Effekte stapeln nicht | VERIFIED · HIGH · [S72:Experiment buff, S72:Griffin (Reincarnation), S72:Blossom, S72:Effects] |
| Debuffs am Gegner | Cursed +15/30 % Magic, Hexed +30 % Magic, Dismembered +20 % (bzw. 25 %) Physical | OBSERVED · HIGH / MEDIUM · [S72:Effects, S67] |
| **Schwäche** | **additiv** über alle passenden Affinitäten: `1 + Σ weakness%`; Beispiel 10.000 × (1 + 4,00 + 1,50) = 65.000 | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| **Resistenz** | `100 / (100 + R)`; R = 150 → 40 % Schaden | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| True Damage | Resistenz-Faktor 1, ignoriert Schilde | OBSERVED · HIGH · [S72:Damage Affinities / Elements, S72:Effects] |
| Armored | Full-AoE ×0,5 | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Ice-Gegner | Fire-Units und Burn ×3; andere weniger (Wert UNKNOWN) | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Tank | „slightly reduced damage“; Challenge-Tank (LEGACY-Trello) −25 % Damage, +25 % HP | OBSERVED · HIGH (qualitativ) / MEDIUM (Zahl) · [S72:Enemy Mechanics, S73] |
| Crit | ×1,5 Standard, ×1,85 bzw. ×2 bei einzelnen Units; RR 20.4.1: „true multiplier“ | OBSERVED · HIGH · [S72:Effects, S65, S72:Update Log] |

**Korrekturen Sitzung 1:** Buffs wurden als `× (1 + buff)` je Buff multipliziert; richtig ist **eine** Summe aller Buffs. Schwächen sind ebenfalls additiv, Resistenzen wirken über `100/(100+R)`, nicht als einfacher Prozentabzug.

### Zusammensetzung

```text
BaseHit    = levels[k].damage / hits
LevelMult  = L(level)
StatMult   = 1 + potential.damage
TraitMult  = (1 + Σ trait.damage) × (reaper && boss ? 1.25 : 1)     // Unique: Σ enthält +3.0
CurseMult  = 1 + curse.damage
RelicMult  = 1 + relic.dmgPct[type] (+ PWR)                         // Verrechnung PWR UNKNOWN
LBMult     = 1 + min(0.30, 0.05 × limitBrokenEquipped)
BuffMult   = 1 + Σ activeBuffs.damage_add                          // ADDITIV
CritMult   = crit ? m : 1
DebuffMult = 1 + Σ enemy.damageTakenDebuff[unit.types]
TypeMult   = trueDamage ? 1 : (1 + Σ weakness[unit.types]) × 100 / (100 + R_eff)
EnemyMult  = (armored && aoe == FULL ? 0.5 : 1) × tankMult × iceMult

FinalHit = BaseHit × LevelMult × StatMult × TraitMult × CurseMult × RelicMult × LBMult
         × BuffMult × CritMult × DebuffMult × TypeMult × EnemyMult
```

| Teil | Tag |
|---|---|
| Einzelfaktoren | wie Tabelle oben |
| `LevelMult × BuffMult` als Produkt | OBSERVED · HIGH (die Wiki-Templates rechnen so) · [S72:Experiment buff] |
| Reihenfolge und Multiplikation aller übrigen Faktoren untereinander | **RECONSTRUCTED · LOW** |
| Ob Potential/Trait/Curse mit Buffs additiv oder multiplikativ wirken | UNKNOWN |
| `R_eff` bei Penetration (subtraktiv? prozentual?) | UNKNOWN |
| Verrechnung von Debuff und Schwäche, Schwäche und Resistenz derselben Unit | UNKNOWN |
| Tank- und Ice-Reduktion | UNKNOWN (DESIGN-Vorschläge in [combat-system.md](combat-system.md#für-unseren-nachbau)) |
| Damage Caps, Boss-Defense | keine Belege, UNKNOWN |

Rechenbeispiel (DERIVED; Reihenfolge RECONSTRUCTED · LOW): Captain U0, Level 100, Potential B (+5 %), Superior I (+10 %), Commander-Buff (+25 %) und Blossom (+10 %) aktiv:

```text
3 × 9.20406501834430488 × 1.05 × 1.10 × (1 + 0.25 + 0.10)
= 3 × 9.2040650 × 1.155 × 1.35 = 43.054
(mit falscher multiplikativer Buff-Rechnung: × 1.25 × 1.10 = × 1.375 → 43.851)
```

### DoT

```text
DoTtotal  = FinalHit × multiplierPerTick × ticks        // Fiery Commander: 0.06 × 5 = 0.30
tickDmg   = FinalHit × multiplierPerTick
```
OBSERVED · HIGH · [S67, S72:Effects]. Burn, Bleed, Poison und Wither stapeln **zwischen** Units; ob dieselbe Unit ihren DoT stapelt oder erneuert: UNKNOWN. Tick-Intervall: UNKNOWN (`DESIGN` 1 s). Burn zählt als Fire-Schaden (×3 gegen Ice-Gegner). OBSERVED · HIGH · [S72:Enemy Mechanics]

### Schild

```text
für jeden Hit:  if shield > 0 and !trueDamage: shield −= 1 (Shatter: shield = 0); kein HP-Schaden
                else hp −= hitDamage
benötigte Angriffe = ceil((shield + ceil(HP / hitDamage)) / hits)
```
OBSERVED · HIGH (Regel) · [S72:Enemy Mechanics, S73, S76]; Formel DERIVED. Beispiel: HP 100, 1 Schild, Hit 58,47 → `1 + ceil(100/58,47) = 3` Hits.

## Crit Damage

```text
critHit  = hit × m                 m = 1.5 (Standard), 1.85 oder 2 laut Modul
P(crit)  = c                       c ∈ {25, 30, 40, 50 %} bei 34 Units im Modul
E[Faktor] = 1 + c × (m − 1)        (c ≤ 1)
```

| Teil | Tag |
|---|---|
| m und c je Unit | OBSERVED · HIGH · [S13 → S72:Effects, S65] |
| Erwartungswert | DERIVED · HIGH |
| c > 1: „Crits past 100 % now have a chance to crit again“ (Update 11, LEGACY). Wie ein Doppel-Crit rechnet (`m²`? `1 + 2(m−1)`?) | OBSERVED · HIGH (Existenz) / UNKNOWN (Formel) · [S72:Update Log] |
| RR 20.4.1: Crit Damage „works as a true multiplier“; vorher Verrechnung unklar (vermutlich additiv zu Buffs) | OBSERVED · HIGH · [S72:Update Log] |
| Relic-Crit (z. B. Nail: Physical Crit Chance +10–20 %) | OBSERVED · HIGH · [S72:Relics] |

## SPA

```text
SPA_eff = SPA(stufe) × (1 + pot.spa) × (1 + trait.spa) × (1 + curse.spa) × buffSpa
DPS-Faktor eines SPA-Bonus x (x < 0) = 1 / (1 + x)
```

| Teil | Tag |
|---|---|
| Trait-SPA: Nimble −5/−7,5/−12 %, Godspeed −20 %, Divine −10 %, Unique −10 % | OBSERVED · HIGH · [S72:Traits] |
| Division statt Multiplikation der Rate: Wiki-DPS-Angaben +5,2 / 8,1 / 13,6 / 25 % = `1/(1−x)` | DERIVED · HIGH · [S72:Traits] |
| Potential SPA +10 % … ≤ −10 % | OBSERVED · HIGH · [S72:Powerups] |
| Buff-Overlay „Kisoko“: SPA ×0,9 | OBSERVED · MEDIUM · [S72:Experiment buff] |
| Produkt der Faktoren | RECONSTRUCTED · MEDIUM |
| **Ability-Cooldown** = `baseCooldown × (1 + curse.spa)`; Potential und Trait wirken **nicht** („attack speed from stats do not … affect ability cooldown“) | OBSERVED · HIGH · [S44, S72:Commander, S72:Wind Dragon] |

Trait-DPS-Faktoren (DERIVED · HIGH): Godspeed 1/0,8 = 1,25 · Nimble III 1/0,88 = 1,136 · Divine 1,2/0,9 = 1,333 · Unique 4/0,9 = 4,444 · Reaper gegen Boss 1,15 × 1,25 = 1,4375.

## Range

```text
Range_eff = Range(stufe) × (1 + pot.range) × (1 + trait.range) × (1 + curse.range) × buffRange × challengeRange
Abdeckung auf geradem Pfad, Unit im Abstand d:   Fenster = 2 × √(Range_eff² − d²)   (Länge in Studs)
Verweildauer im Fenster                          = Fenster / speed
```

| Teil | Tag |
|---|---|
| Trait-Range: Range +10/12,5/15 %, Sniper +25 %, Divine +20 %, Celestial +10 %, Unique +10 % | OBSERVED · HIGH · [S72:Traits] |
| Potential Range −10 % … ≥ +10 % | OBSERVED · HIGH · [S72:Powerups] |
| Level ändert Range nicht | OBSERVED · HIGH · [S72:Powerups] |
| „Kisoko“-Overlay Range ×1,2; Motivate +10 % Range | OBSERVED · MEDIUM / HIGH · [S72:Experiment buff, S72:Effects] |
| Short Range: Range ×2/3 („−33,33 %“, LEGACY-Trello) | OBSERVED · MEDIUM · [S72:Challenges, S73] |
| Mini Range: „1/4 shorter“, wahrscheinlich ×0,75; AoE wird **nicht** verkleinert | OBSERVED · HIGH (Text) / RECONSTRUCTED · MEDIUM (Faktor) · [S72:Challenges] |
| Abdeckungsfenster | DERIVED (Geometrie) |
| Circle-AoE um das Ziel, unabhängig von der Range | RECONSTRUCTED · MEDIUM · [combat-system.md](combat-system.md#3-aoe-geometrie) |

**Korrektur Sitzung 1:** Dort stand „Short Range 1/3? bzw. 2/3?, Mini Range 3/4? bzw. 1/4?“. Short Range ist mit der LEGACY-Zahl −33,33 % als ×2/3 belegt. Mini Range bleibt eine Rekonstruktion.

## Enemy HP Scaling / Wave Scaling

AA dokumentiert **keine** HP-Formel, keine HP-Tabelle für normale Gegner und keine Wave-Zusammensetzung. Es gibt kein Gegner-Datenmodul im Wiki. UNKNOWN · [S72, S73; siehe [enemies.md](enemies.md), [waves.md](waves.md)]

Belegt sind nur Modifikatoren und qualitative Aussagen:

| Größe | Wert | Tag |
|---|---|---|
| Infinite | „each wave progressively getting harder“; Boss früherer Acts alle 10 Waves | OBSERVED · HIGH (qualitativ) · [S72:Infinite] |
| Party-Scaling (HP steigt mit Spielerzahl) | in keiner Fassung der Infinite-Seite belegt | UNKNOWN · LOW · [S72:Infinite, S80, S81] |
| Tank (Challenge, LEGACY) | HP ×1,25, Damage ×0,75 | OBSERVED · MEDIUM · [S73] |
| Steel-Plated | HP ×3, +20 Schilde | OBSERVED · HIGH · [S72:Challenges] |
| Dungeon-Curses (RR) | +80 % HP, +25/50 % Speed, +3 Schilde, +1/3 % Regen | OBSERVED · HIGH · [S72:Dungeon] |
| Fast (Challenge, LEGACY) | Speed ×1,5 | OBSERVED · MEDIUM · [S73] |
| Regen (Challenge, LEGACY) | 1 % maxHP/s | OBSERVED · MEDIUM · [S73] |
| Base HP | skaliert seit Update 9 mit der Level-Schwierigkeit | OBSERVED · HIGH · [S72:Update Log] |
| Einzige Boss-HP | LEGACY-Raids W20: 555.658 / 388.960 / 666.952 (vor HP-Nerfs 2022) | OBSERVED · MEDIUM · [S73] |

```text
HP(w, mods) = baseHP(enemy) × f(w) × Π mod.hpMult        f(w) UNKNOWN, Modifikatoren s. o.
```

**Korrektur Sitzung 1:** Der Faktor `g(n)` für Party-Scaling ist gestrichen, weil er unbelegt ist. Ein `DESIGN`-Generator (`hp(w) = baseHP × g^(w−1) …`) steht in [waves.md](waves.md#infinite-generator-design--kein-aa-wert).

Belegt ist dagegen die **Länge** der Waves in Zeit (Map-Laufzeit eines Basis-Gegners, 8–36 s, Median 20 s) [S72:Map Lengths] und die Gem-Kurve in Infinite (siehe [unten](#infinite-gems)).

## Yen Generation

```text
YenWave = waveYen(w) + Σ_farms farm(stufe) × goldenMult + Σ_kills killYen(e)
goldenMult = 1.2 nur für reine Farm-Units (C.E.O., Bulby), nicht für Weather Girl (Thief)
```

| Teil | Wert | Tag |
|---|---|---|
| Farm-Einkommen je Stufe | Feld `farm` in units.json; nach jeder Wave ausgezahlt. C.E.O. 200/500/1.000/1.750/2.500; Bulby 250 … 10.000; Weather Girl (Thief) 300 … 3.000 | OBSERVED · HIGH · [S65, S72:Effects] |
| Golden ×1,2 | „+20 % Yen each time they make money“ | OBSERVED · HIGH · [S72:Traits] |
| waveYen(w) | UNKNOWN; das Wiki unterscheidet nur „normale“ und „Infinite-orientierte“ Yen-Verteilung | UNKNOWN · [S72:Effects] |
| killYen(e) | UNKNOWN | UNKNOWN |
| Einziger Zahlenhinweis | Assassin Contracts (RR): 5.000 Yen zum Start, 2.500–5.000 pro Runde | OBSERVED · MEDIUM · [S72:Contracts] |
| Treasure-Thief | markierte Gegner geben beim Kill Geld (Betrag UNKNOWN) | OBSERVED · HIGH · [S72:Effects] |
| Start-Yen | UNKNOWN | UNKNOWN |

`DESIGN`-Werte für den Nachbau: Start-Yen 2.000–2.500, `waveYen = 200 + 100·w`, `killYen = 5 + floor(HP/10)` ([technical-reconstruction.md](technical-reconstruction.md#design-defaults-bis-aa-daten-vorliegen)).

## Sell Value

```text
Sell = round?(0.25 × (deployCost + Σ paidUpgradeCosts))
```

| Teil | Tag |
|---|---|
| 25 % (508 von 528 Unit-Seiten; C.E.O.-Seite 30 %, vermutlich Seitenfehler) | OBSERVED · CONFIRMED · [S72: Unit-Seiten] / C.E.O. 30 % OBSERVED · LOW |
| Rundung | UNKNOWN (`DESIGN`: abrunden) |
| Unverkäuflich: Flag `unsellable` (u. a. Bulby, Weather Girl (Thief)) | OBSERVED · HIGH · [S65] |
| Beispiel: Mythic mit Median-Gesamtkosten 50.500 ¥ → 12.625 ¥; Captain U1 (750 ¥) → 187,5 ¥ | DERIVED |

**Korrektur Sitzung 1:** `sellRate ∈ {0.25, 0.30} je Unit` wird zu „global 25 %“.

## Upgrade Efficiency / Farm-ROI

```text
UpgradeEff_k  = (DPS_k − DPS_{k−1}) / cost_k
DPS/Cost_k    = DPS_k / Σ_{i≤k} cost_i
RelEff_k      = (ΔDPS_k / cost_k) / (DPS_0 / deployCost)      // < 1: weniger DPS/¥ als eine neue Platzierung
FarmROI_k     = cost_k / (farm_k − farm_{k−1})                 // in Waves
FarmROI_gold  = FarmROI_k / 1.2
```
DERIVED · HIGH (Formeln; reproduzieren die Wiki-ROI-Tabelle [S37] und die Tabellen in [unit-upgrades.md](unit-upgrades.md#farm-roi)).

| Kennzahl über alle Units (RR, S65) | Median | Tag |
|---|---:|---|
| RelEff erstes / mittleres / letztes Drittel der Stufen | 0,70 / 0,48 / 0,39 | DERIVED · HIGH · [S65] |
| DPS/¥ bei Max relativ zur Platzierung | 0,49 | DERIVED · HIGH · [S65] |
| Kostenfaktor je Stufe (Rare / Epic / Legendary / Mythic) | ×1,50 / ×1,40 / ×1,30 / ×1,29 | DERIVED · HIGH · [S65] |

Farm-ROI (DERIVED · HIGH aus S65): C.E.O. 2,75 / 3,33 / 3,50 / 3,33 / 4,00 Waves; Bulby 3,20 / 3,00 / 4,00 / 3,00 / 3,75 / 3,33 / 6,25 Waves (Golden: 2,67 … 5,21).

## Summon Probability

<a id="summon"></a>

| Rarität | Wiki | normiert (Σ 100 %) | Tag |
|---|---:|---:|---|
| Rare | 81,9 % | **81,75 %** | OBSERVED · HIGH · [S72:Summon]; Normierung DERIVED · MEDIUM aus dem Kapsel-Schema [S68] |
| Epic | 16 % | 16 % | OBSERVED · HIGH |
| Legendary | 2 % | 2 % | OBSERVED · HIGH |
| Mythic (Standard) | 0,25 % | 0,25 % | OBSERVED · HIGH |
| Mythic (Special, RR-Event) | 0,5 % | – | OBSERVED · HIGH |
| Secret | 1 : 400.000 | – | OBSERVED · MEDIUM |
| Summe Wiki | 100,15 % | 100 % | DERIVED |

```text
P(Rarität r)             = rate_r
P(Center-Featured)       = 0.005 × 0.50  = 0.25 %        (Special/Legacy-Banner)
P(eine Side-Featured)    = 0.005 × 0.10  = 0.05 %
P(ein Unfeatured, RR)    = 0.005 × 0.00625 = 0.003125 %   (Pool 48; Legacy-Banner 0,714 % → 0,00357 %;
                                                          alter Wiki-Text 0,526 % → 0,00263 %)
P(≥1 in n)               = 1 − (1 − p)^n,   E[Summons] = 1/p
```
DERIVED · HIGH aus OBSERVED-Raten [S72:Summon]. Details und Versionen in [summoning.md](summoning.md#raten-je-rarität).

## Pity Probability

**Regeln nach Version** (aus [summoning.md](summoning.md#pity)):

| Zeitraum/Version | Pity | Reset | Tag |
|---|---|---|---|
| LEGACY Standard; RR Legacy-Banner bis 20.4 | 400 → **irgendein** Mythic | bei jedem Mythic und jedem Banner-Refresh | OBSERVED · MEDIUM · [S72:Summon@33626, S73] |
| LEGACY Special | **keine** Mythic-Pity | – | OBSERVED · MEDIUM · [S72:Summon@33626] |
| LEGACY bis RR 20.4 Legendary | 50 → Legendary | bei Legendary und Banner-Wechsel | OBSERVED · HIGH |
| **RR ab 20.4.1** Special + Legacy | 400 → **Center-Featured** | bei **jedem** Mythic und jedem Refresh (stündlich) | OBSERVED · HIGH · [S72:Summon, S72:Update Log] |
| RR Event | 200 → unbesessener Featured | bei jedem Mythic (angenommen) | OBSERVED · HIGH / Reset RECONSTRUCTED · LOW |

Formeln (`p` Mythic-Chance, `f` Anteil des Ziels am Mythic, `N` Pity, `q = 1 − p`):

```text
Pity setzt nur bei Treffer zurück, jeder Mythic ist Ziel (f = 1):
  E[Summons]      = (1 − q^N) / p
  P(Pity greift)  = q^(N−1)

Pity setzt bei JEDEM Mythic zurück, Pity gibt das Ziel (RR-Center):
  L = E[Zykluslänge]               = (1 − q^N) / p
  s = P(Zyklus endet mit Ziel)     = f × (1 − q^(N−1)) + q^(N−1)
  E[Summons bis Ziel]              = L / s          (Erneuerung: E = L + (1 − s) × E)
```
DERIVED · HIGH (unabhängige Züge, alle Summons innerhalb einer Rotation)

| Fall | p | f | N | Ergebnis | Gems (50 / VIP 40) |
|---|---:|---:|---:|---|---:|
| **RR-Center ab 20.4.1** | 0,005 | 0,5 | 400 | L = 173,07; s = 0,5677; **E = 304,9 Summons** | 15.244 / 12.195 |
| dto., P(Zyklus erreicht Pity) | | | | `0,995^399 = 13,5 %` | |
| dto., P(Center in 400 Summons) | | | | **76,76 %** (exakte DP) | 20.000 |
| LEGACY Standard, irgendein Mythic | 0,0025 | 1 | 400 | **E = 253,0**; P(Pity greift) = 36,8 % | 12.652 / 10.121 |
| Legendary-Pity (bis RR 20.4) | 0,02 | 1 | 50 | E = 31,8; P(Pity greift) = 37,2 % | 1.590 |
| LEGACY Special, Center ohne Pity | 0,0025 | – | – | E = 400; P(≥1 in 400) = 63,3 % | 20.000 |

P(Center ≥ 1 in n Summons), RR ab 20.4.1, exakte Markov-Rechnung (DERIVED · HIGH):

| n | 50 | 100 | 200 | 300 | 399 | 400 | 600 | 800 | 1.200 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P | 11,76 % | 22,14 % | 39,38 % | 52,81 % | 63,17 % | 76,76 % | 90,01 % | 96,43 % | 99,51 % |

**Korrektur Sitzung 1:** „Center-Mythic: p = 0,0025, N = 400 → E = 253,0“ war die Formel für „irgendein Mythic, Reset nur durch das Ziel“. Sie passt zum LEGACY-Standard-Banner, nicht zum RR-Center. Die Center-Pity mit Reset bei jedem Mythic gibt es erst ab RR 20.4.1; dort ist E = 304,9. Eine geschlossene Form existiert (Erneuerungsformel oben); die in Sitzung 1 als nötig beschriebene Simulation ist nur noch Gegenprobe (Monte-Carlo 304,1, siehe [summoning.md](summoning.md#mathematik)).

```text
Simulation (Gegenprobe):
repeat M times:
  pity = 0; n = 0
  loop: n++; pity++
    if pity == 400: got center → break
    if rand() < 0.005:                       // Mythic
      if rand() < 0.5: got center → break
      pity = 0                               // jeder andere Mythic setzt zurück
  record n
```

## Trait Probability

| Trait | p | E[Rerolls] | n für 90 % | Remnants auf Mythic (×5) |
|---|---:|---:|---:|---:|
| Superior (beliebige Stufe) | 29,97 % | 3,3 | 7 | 17 |
| Nimble / Range | je 24,98 % | 4,0 | 9 | 20 |
| Adept | 9,99 % | 10,0 | 22 | 50 |
| Culling | 5 % | 20 | 45 | 100 |
| Sniper | 2,5 % | 40 | 91 | 200 |
| Godspeed | 1 % | 100 | 230 | 500 |
| Reaper | 0,8 % | 125 | 287 | 625 |
| Celestial | 0,36 % | 277,8 | 639 | 1.389 |
| Divine | 0,2 % | 500 | 1.151 | 2.500 |
| Golden | 0,15 % | 666,7 | 1.534 | 3.333 |
| **Unique** | **0,1 %** | 1.000 | 2.302 | 5.000 |
| **Summe** | **100,03 %** | | | |

```text
P(Trait t)            = p_t                                   OBSERVED · HIGH · [S47 → S72:Traits]
Summe aller 12 Traits = 100,03 %  (ohne Unique 99,93 %)        DERIVED
E[Rerolls bis t]      = 1 / p_t;  n_q = ceil(ln(1 − q) / ln(1 − p_t))     DERIVED · HIGH
E[Remnants]           = cost(r) / p_t,  cost = 5 (Mythic/Secret) | 1 (sonst) | 1 Reroll Token (immer)
E[Gems via Merchant]  = 400 × E[Remnants]                     (Remnant 400 Gems [S72:Travelling Merchant Shop])
P(Trait bei neuer Unit, RR) = 0,01;  P(Doppel-Trait) = 0,01 × 0,01 (Summon) bzw. 0,002 (Reroll)
P(Unique direkt aus Summon) = 0,01 × 0,001 = 1 : 100.000      DERIVED
Doppel-Trait-Effekte addieren sich                            OBSERVED · MEDIUM · [S72:Traits]
```

**Korrektur Sitzung 1:** Die alte Trait-Tabelle summierte 99,93 %, weil **Unique (0,1 %)** fehlte (Konflikt C7). Mit Unique sind es 100,03 % (gerundete Anzeigewerte). Für den Nachbau normalisieren (`p_t / 1,0003`) oder Promille-Gewichte mit Summe 1.000 nutzen (`DESIGN`, siehe [traits.md](traits.md#für-unseren-nachbau-design)). Die Verteilung der Stufen I/II/III ist UNKNOWN.

## Shiny Probability

```text
P(shiny | Summon)  = 0.01   (Shiny Hunter: 0.03)       VERIFIED · HIGH · [S75, S72:Summon]
P(shiny ∧ r)       = 0.01 × rate_r                     DERIVED
Voraussetzung      Spielerlevel ≥ 5 (Banner-Tier 1)    OBSERVED · HIGH · [S72:Summon, S73]
```

| Ziel | p | E[Summons] | mit Shiny Hunter |
|---|---:|---:|---:|
| Shiny Rare | 0,8175 % (Wiki-Rate: 0,819 %) | 122 | 41 |
| Shiny Epic | 0,16 % | 625 | 208 |
| Shiny Legendary | 0,02 % | 5.000 | 1.667 |
| Shiny Mythic, Standard | 0,0025 % | 40.000 | 13.333 |
| Shiny Mythic, Special | 0,005 % | 20.000 | 6.667 |

DERIVED · HIGH. Shiny ist rein kosmetisch, senkt aber die Material-Units für Evolutionen. OBSERVED · HIGH · [S72:Frequently Asked Questions, S72:Update Log]

## Potential / Stat-Roll

```text
pot.damage ∈ [−10 %, ≥ +20 %],  pot.spa ∈ [+10 %, ≤ −10 %],  pot.range ∈ [−10 %, ≥ +10 %]   OBSERVED · HIGH · [S72:Powerups]
Rang = Intervalltabelle je Stat (SSS … C-), mit dem ungerundeten Wert bestimmt              OBSERVED · HIGH
Worthiness = +1 % je 100 Takedowns;  Max LEGACY 100 %, RR (U20) 400 %;  Verbrauch ≤ 100 % je Reroll   OBSERVED · HIGH
„Worthiness 100 % ⇒ alle Stats ≥ B+“                                                       OBSERVED · LOW (nur Forum [S59, S48])
Verteilung(pot | Worthiness)                                                                UNKNOWN
Stat Transfer: Erfolg 0,5 je Versuch, 5.000 Gold je Stat;  E[Versuche] = 2                   OBSERVED · HIGH / DERIVED
```

**Korrektur Sitzung 1:** `w = min(kills/10000, 1)` zählt nicht Kills, sondern **Takedowns** (jeder Treffer an einem später getöteten Gegner). Die „B+“-Regel ist auf LOW gesenkt.

## Portal Probability

```text
P(Secret-Unit | Host)            = 1                                   OBSERVED · HIGH · [S72:Secret Portal, S72:The Ice Queen Portal]
P(Secret-Unit | Mitspieler)      = 0.05                                OBSERVED · HIGH · [S72:The Ice Queen Portal]
P(≥1 Secret-Unit als Mitspieler in n) = 1 − 0.95^n                     DERIVED: n = 14 → 51,2 %, n = 45 → 90,1 %
P(Secret Portal | Clear) = q                                           meist UNKNOWN; Schätzungen ~1 % (Restriction), < 1 % (Fallen Star)
E[Clears bis Secret Portal]      = 1 / q                               DERIVED (Form): q = 1 % → 100; P(≥1 in 100) = 63,4 %
Crafting aus 4 Teilen, Chance p pro Clear: E[Clears] = 4 / p           DERIVED: Time Traveller's Shard 3 % → 133; 4,5 % → 89
Demon Leader's Portal aus Fabled-Legend: p = 0,20 → E = 5 Clears       OBSERVED · HIGH · [S72:Legend Stages] / DERIVED
Drop mit Clear-Garantie G:  E = Σ_{k=0}^{G−1} (1 − p)^k = (1 − (1 − p)^G) / p
  Spider-Raid: p = 0,01, G = 15 → E = 14,0 Runs; P(vor der Garantie) = 1 − 0,99^14 = 13,1 %   OBSERVED · HIGH · [S72:Raids] / DERIVED
```

Drop-Boosts aus Events („+20 % pro Unit, max. +100 %“): ob additiv auf die Basis-Chance (`q × (1 + Σ boost)`) – RECONSTRUCTED · LOW · [S72:Events]. Details in [portals.md](portals.md#portal-wahrscheinlichkeiten-derived).

## Infinite-Gems

```text
g(w) = 0 (W1–5) | 18 (W6) | 3 (W7–14) | 5 (W15–105) | 0 (ab W106)
Gems(W) = Σ_{w ≤ W} g(w)  →  Gems(14) = 42,  Gems(25) = 97,  Maximum Gems(105) = 18 + 8·3 + 91·5 = 497
```

| Teil | Tag |
|---|---|
| Stufen und Maximum 497 (Wiki seit 2025-01, RR-Stand) | OBSERVED · HIGH · [S72:Infinite, Versionsgeschichte S80, S82] |
| Zuordnung von W15 zur 5er-Stufe und „ab W105 keine“ = „nach W105“ (einzige ganzzahlige Lösung von `3k + 5m = 479`: k = 8, m = 91) | DERIVED · MEDIUM |
| Gegenproben: Trello „bis Wave 24 → 97 Gems“ (LEGACY 2023-01); AFK-Werte 18/21/24/27 aus Map Lengths = Verlust nach W6/7/8/9 | DERIVED · MEDIUM · [S73, S72:Map Lengths] |

**Korrektur Sitzung 1:** Dort stand `W7–15 je 3, W16–104 je 5 → 490` mit einem Konflikt zu 497. Richtig ist W7–14 je 3, W15–105 je 5 = 497 (Konflikt C6 gelöst, siehe [waves.md](waves.md#infinite-gems-pro-wave-rr)).

## Time Machine

```text
Gems/h = 3 × 3600 / 150 = 72;  VIP oder Premium: 144;  VIP und Premium: 2.304 / 8 h = 288
```
OBSERVED · HIGH · [S25 → S72:Time Machine] / DERIVED. Nur LEGACY; seit Update 19/19.5 deaktiviert. [economy.md](economy.md)

## Trade-Tax

```text
Tax(Item) = Tabellenwert nach Rarität (Rare Skin 50 … Mythic/Secret post-evolve 6.000 Gems)   OBSERVED · HIGH · [S19 → S72:Trading]
Tax = 0 für einen Spieler, der ein Gift (kein Gem-Gift) in den Trade legt                    OBSERVED · HIGH · [S72:Update Log (U12)]
Wer zahlt, Summierung mehrerer Items                                                         UNKNOWN
```

**Korrektur Sitzung 1:** Die Regel „Tax auf der Seite mit dem besseren Deal“ steht in keiner Volltextquelle; sie ist auf UNKNOWN gesetzt (siehe [social.md](social.md)).

## Für unseren Nachbau

`DESIGN`-Hinweise (keine AA-Werte):

- Die Damage-Pipeline als **konfigurierbare Faktorkette** bauen; die Reihenfolge ist in AA nicht belegt. Buffs immer in **einer** Summe sammeln (AA-Regel), damit „Buff-Stacking“ nicht explodiert. Siehe [technical-reconstruction.md](technical-reconstruction.md#damage-pipeline-konfigurierbar).
- Raten (Summon, Traits) als ganzzahlige Gewichte speichern, die exakt 100 % bzw. 1.000 ‰ ergeben, und im UI anzeigen.
- Pity transparent machen: Zähler sichtbar, Reset nur durch das Ziel. In AA geben 400 Summons nur 76,8 % auf den Center.
- Für Enemy-HP, Wave-Yen und Kill-Yen eigene Kurven festlegen; die durchgerechnete [Beispielrunde](simulation.md) zeigt Startwerte.
