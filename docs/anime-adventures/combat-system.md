# Combat System

> Legende: `ART · CONFIDENCE · [Quelle]` siehe [README](README.md#kennzeichnung). `S72:<Seite>` = Wiki-Volltext, `S65` = Unit-Datenmodul (RR), `S67` = Angriffs-/Effektmodul (RR), `S73` = Trello (frühe LEGACY), `S76` = Infobox-Lua-Code. Statistiken über `data/units.json` sind DERIVED (Zählung). Stand Sitzung 2 (P2).

## 1. Unit-Stats (Begriffe)

| Stat | Bedeutung in AA | Tag |
|---|---|---|
| Damage | Schaden **pro Angriff**; bei mehreren Hits wird er auf die Hits aufgeteilt (siehe Hits) | VERIFIED · CONFIRMED · [S76, S72:Enemy Mechanics] |
| **SPA** | „Seconds Per Attack“, Wartezeit zwischen Angriffen. **Niedriger ist besser.** Modulfeld `attack_cooldown` | VERIFIED · CONFIRMED · [S11, S35 → S72:Terminology, S73 Terminology, S65] |
| Range | Angriffsreichweite in Studs. Verteilung (558 Units): Platzierung Median 19 (Quartile 15/22), Max-Upgrade Median 30 (Quartile 25/35), Extremwerte 5–100 | OBSERVED · HIGH · [S65] / DERIVED |
| Tower Type | Ground (461) / Hill (71) / Hybrid (29) | OBSERVED · HIGH · [S39, S65] |
| Attack Type | Single, AoE (Circle, Cone, Line, Full) | OBSERVED · HIGH · [S72:Terminology, S67] |
| Hits | Schadensinstanzen pro Angriff. „Damage stated by the unit itself will be divided by the number of hits“; jeder Hit entfernt eine Schild-Instanz | VERIFIED · CONFIRMED · [S76, S72:Enemy Mechanics] |
| Crit Chance | Bei 34 Units im Modul: 50 % (25×), 40 % (5×), 25 % (3×), 30 % (1×) | OBSERVED · HIGH · [S65] / DERIVED |
| Crit Damage | Standard ×1,5; Modulwerte 1,5 / 1,85 / 2 | OBSERVED · HIGH · [S13 → S72:Effects, S72:Frequently Asked Questions, S65] |
| Damage Type | Primär: Physical (316), Magic (235), True (6); Sekundär-Elemente: Dark 69, Fire 69, Lightning 63, Ice 60, Air 59, Light 58, Water 49, Rose 1 (Modul-Bezeichner; Wiki nennt Storm/Aqua) | OBSERVED · HIGH · [S12, S65, S72:Damage Affinities / Elements] |
| Spawn Cap | Max. Platzierungen dieses Unit-Typs (siehe [core-mechanics.md](core-mechanics.md#platzierung)) | OBSERVED · HIGH · [S65] |
| DPS (Wiki) | `Damage / SPA`, z. B. 390 / 7 = 55,71 | DERIVED · CONFIRMED · [S35, S72:Terminology] |

> 1 Stud ≈ 0,28 m (Roblox-Konvention). Für das Webspiel 1 Stud = 1 Welteinheit verwenden.

Rohfelder mit unklarer Bedeutung: `cooldown` (bei 384 Units = 10) und `knockback_points` (bei 385 Units = `[0.5]`). UNKNOWN · [S65]

## 2. Targeting

| Modus | Belegt | Funktionsweise (für Nachbau) | Tag |
|---|---|---|---|
| **First** | ja | Gegner mit dem größten Pfadfortschritt | OBSERVED · HIGH (Modus) · [S53, S72:Divine General] / RECONSTRUCTED (Definition) |
| **Strongest** | ja | Gegner mit den **höchsten HP** in Range (typisch Boss). Wiki: „if she was set *strongest* … her passive only target highest HP enemy within her range“ | OBSERVED · HIGH · [S53, S72:Chuuni (Delusion)] |
| Last | nicht belegt | geringster Pfadfortschritt | UNKNOWN |
| Weakest | nicht belegt | niedrigste aktuelle HP | UNKNOWN |
| Closest | nicht belegt | kleinste euklidische Distanz zur Unit | UNKNOWN |

- Der Spieler stellt den Modus pro platzierter Unit ein. Seit **Update 19.5 (Feb. 2025, RR)** per Dropdown-Menü; seit Update 20.4.1 wird das anvisierte Gegnerziel im Spiel hervorgehoben. OBSERVED · HIGH · [S72:Update Log]
- Die **vollständige** Modus-Liste von AA ist im Wiki nicht dokumentiert: **UNKNOWN**. Ob „Strongest“ aktuelle oder maximale HP meint: UNKNOWN.
- Einzelne Angriffe haben **feste** Zielregeln, unabhängig vom eingestellten Modus, z. B. „targets the First enemy **on the map**“ bzw. „the Strongest enemy on the map“ (Beschwörung mit Modus Attack/Defend/Boss). Solche Angriffe ignorieren also die Range. OBSERVED · HIGH · [S72:Divine General]
- Passives können Zielwahl bzw. Schaden konditional machen, etwa „2× DPS gegen den vordersten Gegner“ (Legendary Assassin (Prime)) oder „Debuff gilt, bis sie das Ziel nicht mehr anvisiert“ (Chuuni (Delusion)). OBSERVED · MEDIUM · [S53, S72:Damage Affinities / Elements]

**Klassenfilter vor dem Targeting:** Ground-Units ignorieren Flying-Gegner. Hill- und Hybrid-Units dürfen alle Gegner anvisieren. Eine Nullifier-Fähigkeit kann den Flying-Status zeitweise aufheben. OBSERVED · HIGH · [S14, S39 → S72:Enemy Mechanics, S73 Mechanics]

```text
candidates = enemies.filter(e =>
    dist(unit.pos, e.pos) <= unit.range
    && !(e.flying && unit.towerType == GROUND && !e.flyingNullified)
    && e.alive && !e.untargetable)
target = sortBy(candidates, unit.targetMode)[0]
```
RECONSTRUCTED · MEDIUM

## 3. AoE-Geometrie

AA kennt fünf Angriffsformen. Definitionen: OBSERVED · HIGH · [S72:Terminology, S73 Terminology]; Parameter: OBSERVED · HIGH · [S67].

| Typ | Definition laut Wiki/Trello | Parameter | Beispiel |
|---|---|---|---|
| Single | ein Ziel | – | Honey |
| AoE (Circle) | „enemies inside the circle“ | `radius` | Captain U4: Radius 4; Black Assassin: 7 → 10 |
| AoE (Cone) | „any enemies within the cone“ | `angle` in Grad | Legendary Assassin: 60° |
| AoE (Line) | „much like Cone AoE, no difference besides the end does not protrude“ | `width` | – |
| AoE (Full) | „taking the unit's entire range; anybody within the range will be hit“ | – (= Range) | – |

### Verteilung im Angriffsmodul (1.097 Angriffe)

DERIVED (Zählung über `data/units.json` → `attacks`) · [S67]

| Form | Anzahl | Parameter: Min / Median / Max | häufigste Werte |
|---|---|---|---|
| Circle | 692 | Radius 2 / 8 / 20 | 8 (116), 6 (85), 10 (84), 7 (74), 12 (72), 9 (65) |
| Cone | 145 | Winkel 30° / 50° / 110° | 60° (54), 50° (35), 45° (20), 40° (11), 30° (10) |
| Line | 98 | Breite 2 / 7 / 20 | 10 (18), 5 (16), 6 (13), 8 (11), 4 (10), 7 (10) |
| Full | 78 | – | – |
| Single | 76 | – | – |
| ohne Angabe | 8 | – | – |

Hits: 819 Angriffe ohne Angabe (= 1 Hit), sonst 3 Hits (155), 2 (42), 1 (35), 4 (31), 5 (7), 6 (4), 7 (2), 9 (1), 12 (1).

**Mathematische Trefferbestimmung (Rekonstruktion, 2D-Draufsicht).** `T` = Position des Primärziels, `U` = Unit-Position, `E` = Gegnerposition, `d = normalize(T − U)`.

| Typ | Treffer, wenn | Tag |
|---|---|---|
| Circle | `‖E − T‖ ≤ radius` (Kreis **um das Ziel**) | RECONSTRUCTED · MEDIUM |
| Cone | `‖E − U‖ ≤ range` **und** `angle(d, E − U) ≤ angle/2` | RECONSTRUCTED · MEDIUM |
| Line | `0 ≤ (E−U)·d ≤ range` **und** `|cross(d, E−U)| ≤ width/2` | RECONSTRUCTED · MEDIUM |
| Full | `‖E − U‖ ≤ range` | RECONSTRUCTED · HIGH (Definition „gesamte Range“ belegt) |

Begründung für den Circle-Mittelpunkt am Ziel: Radien liegen bei Median 8 gegenüber Range-Median 30. Außerdem verkleinert die Challenge „Mini Range“ die Range, aber **nicht** die AoE („units' AoE aren't affected“) [S72:Challenges]. Die AoE-Größe ist also unabhängig von der Range.

Offen (UNKNOWN):
- Ob Line und Cone bis zur Range oder darüber hinaus reichen. Laut Trello „ragt das Ende nicht heraus“ (Line), was eine Begrenzung nahelegt.
- Ob Flying-Gegner von AoE einer Ground-Unit getroffen werden.

## 4. Attack Cycle

```text
[Idle] ── Ziel in Range? ──► Acquire Target
   ▲                             │
   │                             ▼
   │                      (Animation / Windup)        ← Dauer UNKNOWN
   │                             │
   │                             ▼
   │                      Hit(s): für jeden Hit k=1..hits:
   │                         Ziele bestimmen (AoE-Form)
   │                         Damage/hits berechnen (inkl. Crit-Roll)
   │                         1 Schild-Instanz pro Hit entfernen
   │                         Status-Effekte anwenden (Immunitäts-Cooldowns beachten)
   │                             │
   │                             ▼
   └──────── Cooldown = SPA (ab Angriffsstart) ──► Target Re-evaluation
```
RECONSTRUCTED · MEDIUM

- SPA ist als „wait time between each attack“ definiert [S73 Terminology]. Ob die Animation darin enthalten ist, ist **UNKNOWN**. Für den Nachbau gilt: `nextAttackAt = attackStart + SPA`, und der Hit-Zeitpunkt liegt bei `attackStart + windup` mit `windup ≪ SPA`.
- Ob ein Ziel, das während des Windups stirbt, den Angriff „verschluckt“ oder den Angriff auf ein neues Ziel lenkt, ist **UNKNOWN**.
- Mehrere Hits werden wahrscheinlich über die Animation verteilt (sichtbar bei Multi-Hit-Units). **UNKNOWN**.
- Aktive Fähigkeiten: Seit Update 13.5 (LEGACY) können sie automatisch ausgelöst werden, sobald der Cooldown abgelaufen ist. OBSERVED · HIGH · [S72:Update Log]

## 5. Damage Types / Affinities (seit Update 7)

| Typ | Beschreibung | Tag |
|---|---|---|
| Physical | Hände/Waffen | OBSERVED · HIGH · [S12 → S72:Damage Affinities / Elements] |
| Magic | Übernatürliche Fähigkeiten | OBSERVED · HIGH · [S12 → S72:Damage Affinities / Elements] |
| True Damage | Ignoriert Typ-Resistenzen und Schilde; ignoriert auch die Resistenz von Ice-Gegnern | OBSERVED · HIGH · [S12 → S72:Damage Affinities / Elements, S72:Effects] |
| Fire | Element; die meisten Fire-Units verursachen Burn. Burn zählt immer als Fire-Schaden | OBSERVED · HIGH · [S72:Damage Affinities / Elements, S72:Enemy Mechanics] |
| Storm | Element; die meisten Storm-Units frieren ein oder verlangsamen | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Aqua, Air, Rose, Dark, Light | weitere Elemente ohne Zusatzregel | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |

Versionen: Update 7 (Nov. 2022) führte „Damage Styles“ ein, Update 14 (Juni 2023) überarbeitete die Affinitäten („Most units now have an affinity towards a certain element“). Beide sind LEGACY; im RR gilt das System weiter. OBSERVED · HIGH · [S72:Update Log]

- In **Portals, Legend Stages und Challenges** hat jeder Gegner Resistenzen und Schwächen, im Gegner-HP-Balken als Icon angezeigt. OBSERVED · HIGH · [S12 → S72:Damage Affinities / Elements, S72:Challenges]
- Units können **mehrere** Affinitäten haben (Primär/Sekundär), und **alle** Affinitäten der Unit zählen für Schwächen. OBSERVED · HIGH · [S45, S72:Damage Affinities / Elements]

### Schwäche- und Resistenz-Formel

| Regel | Formel | Tag |
|---|---|---|
| Schwäche (Weakness) | Bonus in %, **additiv** über alle passenden Affinitäten der Unit: `mult = 1 + Σ weakness%` | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Beispiel | Physical/Rose-Unit, 10.000 Damage, Gegner +400 % Physical und +150 % Rose → `10.000 × (1 + 4,00 + 1,50) = 65.000` | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Resistenz | `mult = 100 / (100 + Resistance)`; Beispiel: 150 Magic Resistance → 40 % Schaden | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Penetration | „Damage Penetration *reduces* Resistance“; ob subtraktiv oder prozentual: UNKNOWN | OBSERVED · HIGH (Existenz) · [S72:Damage Affinities / Elements, S17] |
| True Damage | Resistenz-Multiplikator = 1 | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |

Sitzung 1 führte die Multiplikatoren als UNKNOWN; sie sind jetzt belegt. Unbelegt bleibt, wie Schwäche und Resistenz derselben Unit verrechnet werden, wenn eine Unit zwei Affinitäten hat und der Gegner auf eine resistent und auf die andere schwach ist. UNKNOWN.

## 6. Damage-Formel

Was belegt ist:

| Faktor | Wirkung | Tag |
|---|---|---|
| Unit-Level | Level 100 = **×9,20406501834430488** gegenüber Level 1 (Konstante im Wiki-Template; FAQ „around 9.204x“). Gilt auch für DoT und für die HP von Beschwörungen | VERIFIED · CONFIRMED · [S04, S72:Frequently Asked Questions, S72:Experiment buff] + DERIVED aus S35 (3.589,59 / 390 = 9,2041) |
| Upgrade-Stufe | Basisschaden je Upgrade-Stufe aus der Tabelle (`data/units.json`) | OBSERVED · HIGH · [S65] |
| Hits | Damage wird durch `hits` geteilt; Gesamtschaden pro Angriff bleibt gleich | VERIFIED · CONFIRMED · [S76] |
| Potential (Stat-Roll) | Damage −10 % … ≥ +20 % | OBSERVED · HIGH · [S11] |
| Trait | z. B. Superior +10/12,5/15 %, Golden +30 % | OBSERVED · HIGH · [S47 → S72:Traits] |
| Curse | ±2,5–13 % auf einen Stat | OBSERVED · HIGH · [S18] |
| Relic | %DMG (typabhängig), PEN (Resistenz-Penetration), PWR (DPS/Upgrade, skaliert mit Level), Crit | OBSERVED · HIGH · [S17, S69] |
| Buffs | **additiv** untereinander: +100 % und +10 % = ×2,1; +100 % und +15 % = ×2,15 (siehe §8) | VERIFIED · HIGH · [S72:Experiment buff, S72:Griffin (Reincarnation), S72:Blossom] |
| Debuffs auf Gegner | +15 / 20 / 25 / 30 % erhaltener Schaden eines Typs (siehe §7) | OBSERVED · HIGH · [S72:Effects, S67] |
| Crit | ×1,5 (Standard), ×1,85 bzw. ×2 bei einzelnen Units | OBSERVED · HIGH · [S13 → S72:Effects, S65] |
| Typ-Matchup | `(1 + Σ weakness) × 100/(100 + resistance)` (siehe §5) | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Tank-Gegner | „slightly reduced damage overall“ (Wert UNKNOWN) | OBSERVED · HIGH · [S14 → S72:Enemy Mechanics] |
| Armored-Gegner | **Full-AoE**-Units machen nur **50 %** Schaden | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Ice-Gegner | nehmen von normalen Units weniger Schaden (Wert UNKNOWN); Fire-Units (inkl. Burn) machen **×3** | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Fire-Gegner | Ice-Units machen weniger Schaden (Wert UNKNOWN) | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Culling-Trait | +20 % gegen Gegner mit niedriger HP (Schwelle UNKNOWN) | OBSERVED · MEDIUM · [S47] |
| Reaper-Trait | +15 % normal, +25 % gegen Bosse | OBSERVED · MEDIUM · [S47] |

### Version: Crit

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Update 11 (25.02.2023, LEGACY) | Crit-Chance über 100 % ohne Wirkung | „Crits past 100% now have a chance to crit again“ | Mehrfach-Crit möglich | S72:Update Log |
| Update 20.4.1 (RR, 2025) | Crit-Damage (Verrechnung UNKNOWN, vermutlich additiv zu Buffs) | „Critical Damage now works as a true multiplier to damage“ | eigener Multiplikator | S72:Update Log |

**Rekonstruierte Formel** (RECONSTRUCTED · MEDIUM; Buff-Additivität belegt, Gesamtreihenfolge nicht):

```text
BaseHit    = UpgradeTable[unit][upgrade].damage / hits      // Level-1-Wert, Mittel-Roll
LevelMult  = L(level)            // L(1)=1, L(100)=9.20406501834430488, Kurve dazwischen UNKNOWN
StatMult   = 1 + potential.damage                           // −0.10 … +0.20+
TraitMult  = 1 + trait.damage (+ trait.conditional)         // z. B. Reaper vs Boss
CurseMult  = 1 + curse.damageDelta
BuffMult   = 1 + Σ activeBuffs.damage                       // ADDITIV (belegt), je Buff-Typ nur 1 Instanz
RelicMult  = 1 + relic.dmgPctForType + relic.pwr(level)
CritMult   = crit ? unit.critMultiplier (1.5 default) : 1   // RR: echter Multiplikator
DebuffMult = 1 + Σ enemy.damageTakenDebuff[unit.types]      // Cursed/Hexed/Dismembered; Verrechnung mit Weakness UNKNOWN
TypeMult   = trueDamage ? 1 : (1 + Σ weakness[unit.types]) × 100 / (100 + max(0, resistance − pen))
EnemyMult  = (enemy.armored && unit.aoe == FULL ? 0.5 : 1)
           × (enemy.tank ? (1 − tankReduction) : 1)         // tankReduction UNKNOWN
           × (enemy.ice ? (unit.isFire ? 3 : iceReduction) : 1)

FinalHit = BaseHit × LevelMult × StatMult × TraitMult × CurseMult
         × BuffMult × RelicMult × CritMult × DebuffMult × TypeMult × EnemyMult
```

- Ob Trait/Potential mit Buffs additiv oder multiplikativ verrechnet werden: **UNKNOWN**. Die Wiki-Templates multiplizieren Level-Faktor und Buff-Summe.
- Wie Penetration exakt wirkt (`resistance − pen` ist ein Platzhalter): **UNKNOWN**.
- **Damage Caps, Boss-Reduktion, Defense-Werte:** keine Belege. **UNKNOWN.**

## 7. Status-Effekte (Debuffs auf Gegnern)

Hauptquelle: [S13 → S72:Effects] (RR-Stand, letzte Bearbeitung 2025-05) und Effektmodul [S67]. Die Wiki-Seite enthält an zwei Stellen abweichende Cooldown-Angaben; beide stehen in der Tabelle.

| Effekt | Typ | Wirkung | Stärke / Dauer | Stack | Immunitäts-Cooldown auf demselben Gegner | Tag |
|---|---|---|---|---|---|---|
| **Stun** | Movement-Cancel | Gegner steht | typisch **2 s** (Unit-Seiten); globale Fähigkeiten bis 5 s; LEGACY-Trello: 1 s | stackt nicht mit anderem CC | **10–14 s** | OBSERVED · HIGH · [S72:Effects, Unit-Seiten, S73] |
| **Freeze** | Movement-Cancel | wie Stun, Dauer je Unit | Dauer je Unit (UNKNOWN pro Unit) | stackt nicht mit Timestop | **10 s** (Kopf der Seite) bzw. **12–13 s** (Detailabschnitt); Modul: 10–12 s | OBSERVED · MEDIUM (Konflikt) · [S72:Effects, S67] |
| **Timestop** | Movement-Cancel | wie Freeze | Fähigkeiten: 2 s pro Angriff, 4 s (CD 42 s), 8 s global (CD 60 s), 20 s global inkl. Spawn- und Wave-Timer-Stopp | stackt nicht mit Freeze | Modul: **10–12 s**; Unit-Seite: „less than 10 seconds before“ | OBSERVED · HIGH · [S72:Effects, S67, S72:JIO (Over Heaven), Unit-Seiten] |
| **Unconscious** | Movement-Cancel | Gegner bewusstlos und steht | Modul **0,5 s**; Wiki-Text **3–4 s**; eine Fähigkeit 3 s (CD 15 s) | stackt **mit** Timestop/Stun; kein gemeinsamer Cooldown mit Freeze | – | OBSERVED · MEDIUM (Konflikt) · [S67, S72:Effects, S73] |
| **Slow** | Movement | senkt Speed | Stärke 50 % / 65 % / 80 % je Upgrade (Modul-Feld `influence`), Dauer 2,5–4 s | stackt nicht | **4 s nach Ablauf** (Kopf) bzw. **7 s** (Detail, Tier-List-Texte: „slows for 4 seconds with a cooldown of 7 seconds“) | OBSERVED · HIGH (Stärke/Dauer) / MEDIUM (Cooldown) · [S67, S72:Effects, S72:Tier Lists] |
| **Knockback** | Displacement | schiebt den Gegner auf dem Pfad Richtung Spawn zurück | Distanz UNKNOWN | – | **30–31 s** | OBSERVED · HIGH · [S72:Effects, S67] |
| **Rewind / Confused** | Displacement | Gegner laufen rückwärts | „Confused“: alle Gegner in Range **5 s**; Fähigkeiten 4–5 s (CD z. B. 40 s, auch gegen Bosse) | – | UNKNOWN | OBSERVED · HIGH · [S72:Effects, S67] |
| **Mind Control** | Displacement | **10 %** Chance, dass Gegner in Range **1,5 s** zurücklaufen | 10 % / 1,5 s | – | UNKNOWN | OBSERVED · HIGH · [S67, S72:Effects] |
| **Chrono Reversal** | Displacement + DoT | alle Gegner in Range 5 s rückwärts + 100 % Unit-Damage in 5 Ticks (20 % je Tick); manuell; wirkt **nicht** auf Bosse | – | – | – | OBSERVED · HIGH · [S72:Effects] |
| **Burn** | DoT (Fire) | Zusatzschaden über Ticks; Fire-Attribut (zählt gegen Ice-Gegner); senkt Regeneration „by a bit“ | meist **30 %** oder **50 %**, „Black Burn“ **100 %** | **stackt** zwischen Units | – | OBSERVED · HIGH · [S72:Effects, S72:Damage Affinities / Elements] |
| **Bleed** | DoT | Zusatzschaden; **stoppt Regeneration komplett** | meist **25–35 %**, Ausreißer 50 % | **stackt** zwischen Units | – | OBSERVED · HIGH · [S72:Effects] |
| **Bleed Amplification** | DoT-Verstärker | Gegner nehmen ×3,5–5 (Effects-Kopf) bzw. ×3–5 (Detail) bzw. ×5 (Modul) Schaden aus **allen** Bleed-Quellen; verlängert die Regen-Sperre nicht | je Upgrade | – | – | OBSERVED · MEDIUM (Konflikt) · [S72:Effects, S67] |
| **Poison** | DoT | Zusatzschaden pro Hit | Modul: 280 % über 56 Ticks bzw. 300 % über 20 Ticks | **stackt** zwischen Units | – | OBSERVED · HIGH · [S72:Effects, S67] |
| **Wither** | DoT (True) | True-Damage-DoT, sperrt Regeneration; „infinitely stackable“, pro Hit neu | 20 % des Unit-Damage; max. 18 Ticks | unbegrenzt | – | OBSERVED · HIGH · [S72:Effects, S67] |
| **Cursed** | Debuff | +15 % (bzw. +30 %) erhaltener **Magic**-Schaden | permanent bzw. temporär je Unit | stackt nicht | Seit Update 20 (RR) „Curse debuff cooldown rate removed“ | OBSERVED · HIGH · [S72:Effects, S67, S72:Update Log] |
| **Hexed** | Debuff | +30 % Magic-Schaden permanent | – | stackt nicht | – | OBSERVED · HIGH · [S67, S72:Effects] |
| **Dismembered** | Debuff | mehr **Physical**-Schaden permanent: **20 %** (Modul, Effects) bzw. **25 %** (Affinities-Seite) | – | stackt nicht | – | OBSERVED · MEDIUM (Konflikt) · [S67, S72:Damage Affinities / Elements] |
| **Shatter / Crash** | Shield | entfernt **alle** Schild-Instanzen beim Treffer | – | – | – | OBSERVED · HIGH · [S72:Effects, S67] |
| Flying-/Trait-Nullify | Mechanik | Nullifier-Fähigkeit hebt Gegner-Traits (Flying, Regen, Tank, Armored, Fire, Ice, Burst) zeitweise auf | Dauer UNKNOWN | – | – | OBSERVED · HIGH · [S14 → S72:Enemy Mechanics] |

### Verteilung der Effekte im Angriffsmodul

DERIVED (Zählung) · [S67]. 92 Angriffe tragen einen Spezialeffekt: Slow 27, Stun 14, Freeze 7, Bleed Amplification 6, Knockback 5, Dismembered 4, Cursed (30 %) 4, Sunshine 4, Shatter 4, OverCrit 3, Unconscious 3, Mind Control 2, je 1× Wild Card, Hexed (20 %/25 %), Snatched, Motivate, Timestop, Battlelust, Wither, Cursed (15 %). Nur die 9 Slow-Einträge haben Zahlen (`duration`, `influence`).

102 Angriffe tragen einen DoT:

| DoT | Anzahl | häufigste Tick-Zahl | häufigste Gesamtmultiplikatoren |
|---|---|---|---|
| Burn | 54 | 5 (29×), 4 (13×), 10 (5×) | 0,4 (16×), 0,3 (11×), 0,5 (8×), 1,0 (7×), 0,1 (5×) |
| Bleed | 39 | 3 (23×), 4 (12×), 6 (4×) | 0,3 (12×), 0,25 (10×), 0,4 (4×), 0,35 (3×) |
| Poison | 6 | 56 (3×), 20 (3×) | 2,8 (3×), 3,0 (3×) |
| Wither | 3 | 3 / 4 / 18 | 0,2 / 0,267 / 1,2 |

### DoT-Modell

- **Gesamt-DoT pro Treffer** = `hitDamage × multiplierPerTick × ticks` (= `totalMultiplier`). Das Wiki-Template rechnet genauso, inklusive Level-Faktor 9,204. OBSERVED · HIGH · [S67, S72:Experiment buff]
- **Buffs erhöhen den DoT mit:** 30 % Bleed wird bei +100 % Buff zu 60 %, bei +200 % zu 90 %. Der DoT basiert also auf dem gebufften Hit. OBSERVED · HIGH · [S72:Effects]
- **Tick-Intervall: UNKNOWN.** `DESIGN`: 1 s pro Tick.
- `tickDamage = hitDamage × multiplierPerTick` (DERIVED aus den Modulfeldern).

### Immunitäts-Cooldowns („Diminishing“)

AA schützt einen Gegner nach einem CC-Effekt für einige Sekunden vor erneutem CC. Das verhindert Perma-Stun. Seit Update 14 (LEGACY) zeigt das Spiel diese Immunität am Gegner an. OBSERVED · HIGH · [S72:Effects, S72:Update Log]

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| bis Update 8 (21.12.2022, LEGACY) | Stun/Freeze/Walkback ohne gegenseitige Sperre, stapelbar | „no longer stack, and there is a 1s delay before an enemy can be affected again“ | – | S72:Update Log, S72:Effects (Trivia) |
| spätere LEGACY/RR | 1 s Verzögerung | effektspezifische Cooldowns: Stun 10–14 s, Freeze 10 bzw. 12–13 s, Slow 4 s nach Ablauf bzw. 7 s, Knockback 30–31 s, Timestop 10–12 s | wie „neuer Wert“; exakte Werte je Effekt im Konflikt | S72:Effects, S67 |
| Update 20 (09.03.2025, RR) | Curse-Debuff mit Cooldown | Cooldown entfernt | ohne Cooldown | S72:Update Log |
| LEGACY (Trello 2022-09) | Bleed senkt Regeneration um 75 % | RR-Wiki: Bleed stoppt Regeneration vollständig | vollständig | S73 Mechanics, S72:Effects |
| LEGACY (Trello) → RR | Cursed +15 %, stackt nicht | Cursed +15 % oder +30 % (je Unit), stackt nicht | 15 / 30 % | S73 Mechanics, S67 |

Für den Nachbau: `enemy.ccImmuneUntil[group] = effectEnd + cooldown`. Stun, Freeze, Timestop und Walkback bilden **eine** Sperr-Gruppe (sie „stacken nicht“ miteinander); Unconscious ist ausgenommen. RECONSTRUCTED · MEDIUM

## 8. Buffs (auf Units)

**Stapelregel:** Verschiedene Buff-Quellen addieren sich (`BuffMult = 1 + Σ`). Belege: Wiki-Template rechnet Griffin 100 % + Blossom 10 % als ×2,1 [S72:Experiment buff]; Griffin + Blossom = ×2,1, Griffin + Idol (Star) = ×2,15 [S72:Griffin (Reincarnation)]; Commander + Blossom = 35–110 % [S72:Blossom, S72:Commander]. VERIFIED · HIGH

Gleiche Effekte stapeln **nicht** („same effects do not stack“), und einzelne Paare sind ausgeschlossen (Blossom-Buff stapelt nicht mit Idol). OBSERVED · HIGH · [S72:Effects, S72:Blossom]

| Buff | Quelle (Beispiel) | Wirkung | Dauer / Cooldown | Stacking | Tag |
|---|---|---|---|---|---|
| Physical-Damage-Buff | Commander (Active) | +25 % Physical Damage der Units in Range | **30 s** Dauer, **60 s** Cooldown | Buffs auf andere Commander steigen 25 → 56 → 95 → 100 % | OBSERVED · HIGH · [S30 → S72:Commander] |
| Magic-Buff | Wind Dragon (Active) | +30 % Magic Damage der Units in Range | **30 s** / **60 s** | Kette bis 100 % (30 → 69 → 100 %) | OBSERVED · HIGH · [S72:Wind Dragon] |
| Magic-Buff | Elfy (Sylph) | +50 % Magic; gebuffte Elfys geben 100 % | 30 s / 60 s | wie Commander | OBSERVED · HIGH · [S72:Elfy (Sylph)] |
| Globaler Buff | Griffin (Reincarnation) | +100 % Damage **aller** Units, auch anderer Spieler, permanent | permanent | additiv mit allen anderen | OBSERVED · HIGH · [S72:Griffin (Reincarnation), S72:Damage Affinities / Elements] |
| Aura-Buff | Blossom | +10 % Damage (früher 5 %) in Range; heilt Basis pro Wave | permanent | stapelt nicht mit Idol | OBSERVED · HIGH · [S72:Blossom] |
| Range/SPA-Buff | Unit mit „Kisoko“-Buff im Template | Range ×1,2, SPA ×0,9 | UNKNOWN | UNKNOWN | OBSERVED · MEDIUM · [S72:Experiment buff] |
| Motivate | eine Unit | jeder Angriff: Verbündete in Range +15 % Damage **oder** +10 % Range für **10 s** | 10 s | gleiche Effekte stapeln nicht; stapelt mit anderen Buffs | OBSERVED · HIGH · [S72:Effects, S67] |
| Battlelust (Selbst) | eine Unit | +5 % Damage pro treffendem Angriff, max. +25 %; Reset ohne Treffer | – | bis 5 Stacks | OBSERVED · HIGH · [S72:Effects, S67] |
| Snatched (Selbst) | eine Unit | +3 % Damage pro Angriff, max. 33 % (99 % auf Max-Upgrade), 90 s | 90 s | – | OBSERVED · HIGH · [S72:Effects, S67] |
| Sunshine (Selbst) | eine Unit | Damage und Range steigen jede Wave nach Platzierung, max. 15 Waves | permanent | – | OBSERVED · MEDIUM (Konflikt, s. u.) · [S72:Effects, S67] |
| Curse Stack (Selbst) | eine Unit | jeder Crit = 1 Stack; bei 4 Stacks +200 % als True Damage, dann Reset | – | 4 | OBSERVED · HIGH · [S72:Effects] |
| OverCrit | eine Unit | garantierter Crit gegen blutende Gegner | – | – | OBSERVED · HIGH · [S72:Effects, S67] |
| Income-Buff | Golden-Trait | +20 % Yen | permanent | – | OBSERVED · HIGH · [S72:Traits] |
| Hivemind | Honey (Hive) | ab Upgrade 3 Schaden ×3, ab Upgrade 6 ×5 (periodische Explosion) | – | – | OBSERVED · MEDIUM · [S32] |
| Summon Buffer | eine Unit | erhöht die Start-HP von Beschwörungen | – | – | OBSERVED · HIGH · [S72:Effects] |

**Konflikt Sunshine:** Effects-Seite „+9 % Damage und +4,5 % Range pro Wave, Cap 15 Waves“ ergibt DERIVED ×2,35 Damage und ×1,675 Range. Das Modul nennt „2.25x more damage and 1.67x range at maximum“. Die Range stimmt überein, der Damage weicht um 0,1 ab.

**Bekannte Mechanik „Infinite 100 % Buff“:** 4–5 Buffer gleichen Typs werden versetzt aktiviert; ein gebuffter Buffer gibt einen stärkeren Buff (Commander 25 → 56 → 95 → 100 %). Die Schleife hält laut Wiki über 50 Runden, desynchronisiert aber langsam. Laut Commander- und Wind-Dragon-Seite muss der Buffer dafür einen **+SPA-Curse** tragen. „Attack speed from stats do not matter and do not affect ability cooldown“: Der Ability-Cooldown wird also vom SPA-Curse verlängert, nicht vom Potential-Stat. OBSERVED · HIGH · [S44, S72:Commander, S72:Wind Dragon]

Abgeleitete Regeln für den Nachbau (RECONSTRUCTED · MEDIUM):
- `buff.strength = chainTable[caster.buffLevel]` (Commander: 25/56/95/100 %), gedeckelt bei +100 %
- Ein Empfänger mit aktivem Buff gleicher Quelle wird ignoriert („no refresh“)
- `ability.cooldown = baseCooldown × (1 + curse.spaDelta)` (nur Curse, nicht Potential)
- `BuffMult = 1 + Σ distinctBuffs`

### Version: Wind-Dragon-Buff

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Sitzung-1-Quelle (Stand unklar) | 20 s Dauer, 40 s Cooldown | 30 % Buff, 30 s Dauer, 60 s Cooldown | 30 s / 60 s | S31 → S72:Wind Dragon |

## 9. Abilities

- **Active Abilities:** Button pro platzierter Unit (z. B. Buffs, Timestop, Flying-Nullify). Sie haben Cooldown und Dauer. Manche werden erst durch ein Upgrade freigeschaltet (Captain U3 „Bamboo Shot“, Honey U3 „Hivemind“). Cooldowns sind teils „global“ (für alle Exemplare/Spieler), teils „non-global“. Seit Update 19.5 (RR) werden Cooldowns im Spiel angezeigt. OBSERVED · HIGH · [S29, S32, S72:Update Log, Unit-Seiten]
- **Passive Abilities:** wirken permanent bzw. konditional (Legendary Assassin (Prime): 2× DPS gegen den vordersten Gegner; Sepsis: 100 % Crit gegen blutende Gegner). Seit Update 20.4.1 zeigt die Unit-Ansicht Passives an. OBSERVED · HIGH · [S13 → S72:Effects, S53, S72:Update Log]
- **Wild Card:** Jeder Angriff löst zufällig Freeze, Slow, Knockback, Bleed oder Burn aus. OBSERVED · HIGH · [S72:Effects, S67]
- **Summoner-Units:** Beschwören Verbündete **an der Basis**, die den Pfad **rückwärts** entlanglaufen und Gegner auf ihrem Pfad treffen; sie verschwinden, wenn ihre HP aufgebraucht sind. Ihre HP steigen mit dem Unit-Level (×9,204 bei L100). Eine Ausnahme kann im Laufen angreifen und stirbt nicht bei Kollision. OBSERVED · HIGH · [S30 → S72:Effects, S72:Divine General, S72:Experiment buff]

## 10. Gegner-Mechaniken im Kampf

Quelle: [S14 → S72:Enemy Mechanics], Challenge-Varianten [S72:Challenges]. Details zu Gegnern in [enemies.md](enemies.md).

| Gegnertyp | Regel | Konter laut Wiki | Tag |
|---|---|---|---|
| Shielded | Start mit N Schild-Instanzen; **jeder Hit** entfernt 1 Instanz (ohne HP-Schaden, laut Trello „protection from x amount of attacks“). Challenge „Shield Enemies“: +1 Instanz; „Steel-Plated“: +20 Instanzen und ×3 HP | Multi-Hit-Units, Shatter/Crash, True Damage | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Challenges, S73, S76] |
| Tank | „slightly reduced damage overall“; Challenge: mehr HP und Armor. Nicht-schädigende Effekte wirken voll | – | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Challenges] |
| Fire | schneller; **immun gegen Slow und Stun**; Ice-Units machen weniger Schaden | Freeze und andere Effekte | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Ice | weniger Schaden von normalen Units; Fire-Units und Burn **×3** | Fire/Burn, True Damage | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Damage Affinities / Elements] |
| Regen | regeneriert HP, wenn beschädigt (Rate UNKNOWN). Flying-Gegner regenerieren in der Regen-Challenge nicht | Bleed, Wither, Nullifier | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Challenges] |
| Flying | ignoriert Ground-Units | Hill/Hybrid, Nullifier | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Armored | **Full-AoE** macht 50 % Schaden; Effekte von Full-AoE wirken weiter mit voller Dauer | andere AoE-Formen | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Burst | schnell beim Spawn, werden zur Basis hin langsamer (seit Update 19, RR) | nicht nahe am Spawn platzieren | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Update Log] |
| Fast / Godspeed (Challenge) | schnellere Gegner (Faktor UNKNOWN) | – | OBSERVED · HIGH · [S72:Challenges] |

## Für unseren Nachbau

`DESIGN`-Vorschläge, wo AA-Werte fehlen:

| Lücke | Vorschlag |
|---|---|
| Tick-Intervall DoT | 1 s |
| Freeze-Cooldown (Konflikt 10 / 12–13 s) | 12 s |
| Slow-Cooldown (Konflikt 4 s nach Ablauf / 7 s) | 7 s ab Anwendung (entspricht bei 4 s Dauer etwa 3 s nach Ablauf) |
| Tank-Reduktion | ×0,8 |
| Ice-Reduktion für Nicht-Fire | ×0,5 (Fire ×3 bleibt AA-Wert) |
| Knockback-Distanz | 10 % der Pfadlänge, nicht hinter den Spawn |
| Targeting-Modi | First, Last, Strongest, Weakest, Closest (nur First/Strongest sind AA-belegt) |
