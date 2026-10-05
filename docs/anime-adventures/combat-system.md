# Combat System

## 1. Unit-Stats (Begriffe)

| Stat | Bedeutung in AA | Tag |
|---|---|---|
| Damage | Schaden pro Treffer (pro „Hit“) | VERIFIED · CONFIRMED |
| **SPA** | „Seconds Per Attack“, also Sekunden zwischen Angriffen. **Niedriger ist besser.** | VERIFIED · CONFIRMED · [S11, S35] |
| Range | Angriffsreichweite in Studs (Roblox-Längeneinheit) | OBSERVED · HIGH |
| Tower Type | Ground / Hill / Hybrid | OBSERVED · HIGH · [S39] |
| Attack Type | Single, AoE (Circle, Cone, Line, Full) | OBSERVED · HIGH · [S29, S33, Unit-Seiten] |
| Hits | Anzahl Schadensinstanzen pro Angriff (z. B. Legendary Assassin 3, 1 oder 4 je Upgrade) | OBSERVED · HIGH · [S33, S36] |
| Crit Chance | Bei manchen Units (25–50 %) | OBSERVED · HIGH · [S13, S35] |
| Damage Type | Physical, Magic, Fire, True … (siehe §5) | OBSERVED · HIGH · [S12] |
| Spawn Cap | Max. Platzierungen dieses Unit-Typs | OBSERVED · HIGH |
| DPS (Wiki) | `Damage / SPA`, z. B. 390 / 7 = 55,71 | DERIVED · CONFIRMED · [S35] |

> 1 Stud ≈ 0,28 m (Roblox-Konvention). Für das Webspiel 1 Stud = 1 Welteinheit verwenden.

## 2. Targeting

| Modus | Belegt | Funktionsweise (für Nachbau) | Tag |
|---|---|---|---|
| **First** | ja | Gegner mit dem größten Pfadfortschritt in Range | OBSERVED · HIGH (Modus) / RECONSTRUCTED (Definition) |
| **Strongest** | ja | Gegner mit den höchsten aktuellen HP in Range (typisch Boss) | OBSERVED · HIGH / RECONSTRUCTED |
| Last | nicht belegt | geringster Pfadfortschritt | UNKNOWN |
| Weakest | nicht belegt | niedrigste aktuelle HP | UNKNOWN |
| Closest | nicht belegt | kleinste euklidische Distanz zur Unit | UNKNOWN |

Belege: Guides nennen „Strongest“ für Bosse und „First“ gegen Leaks [S53]. Die vollständige Modus-Liste von AA ist **UNKNOWN**.

Unit-Passives können Targeting überschreiben, etwa „2× DPS gegen den vordersten Gegner“ bei Legendary Assassin (Prime). OBSERVED · MEDIUM · [S53]

**Klassenfilter vor dem Targeting:** Ground-Units ignorieren Flying-Gegner. Hill- und Hybrid-Units dürfen alle Gegner anvisieren. OBSERVED · HIGH · [S14, S39]

```text
candidates = enemies.filter(e =>
    dist(unit.pos, e.pos) <= unit.range
    && !(e.flying && unit.towerType == GROUND && !e.flyingNullified)
    && e.alive && !e.untargetable)
target = sortBy(candidates, unit.targetMode)[0]
```
RECONSTRUCTED · MEDIUM

## 3. AoE-Geometrie

AA dokumentiert vier AoE-Formen mit Parametern. OBSERVED · HIGH · [S29, S33, S36, Unit-Seiten]

| Typ | Parameter | Beispiel |
|---|---|---|
| Single | – | Honey |
| AoE (Circle) | `radius` (z. B. 4, 5, 7, 10) | Captain U4: Radius 4; Black Assassin: 7 → 10 |
| AoE (Cone) | `angle` in Grad (z. B. 60) | Legendary Assassin: 60° |
| AoE (Line) | `width` (z. B. 12) | – |
| AoE (Full) | ganze Range | – |

**Mathematische Trefferbestimmung (Rekonstruktion, 2D-Draufsicht).** `T` = Position des Primärziels, `U` = Unit-Position, `E` = Gegnerposition, `d = normalize(T − U)`.

| Typ | Treffer, wenn | Tag |
|---|---|---|
| Circle | `‖E − T‖ ≤ radius` (Kreis **um das Ziel**) | RECONSTRUCTED · MEDIUM |
| Cone | `‖E − U‖ ≤ range` **und** `angle(d, E − U) ≤ angle/2` | RECONSTRUCTED · MEDIUM |
| Line | `0 ≤ (E−U)·d ≤ range` **und** `|cross(d, E−U)| ≤ width/2` | RECONSTRUCTED · MEDIUM |
| Full | `‖E − U‖ ≤ range` | RECONSTRUCTED · HIGH (Definition „gesamte Range“ belegt) |

Offen (UNKNOWN):
- Ob der Circle-Mittelpunkt das Ziel oder die Unit ist. Die Formulierung „enemies inside the circle“ lässt beides zu. Eine Range von 25 bei Radius 4 spricht klar für den Mittelpunkt am Ziel.
- Ob Line und Cone bis zur Range oder darüber hinaus reichen.
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
   │                         Damage berechnen (inkl. Crit-Roll)
   │                         Status-Effekte anwenden (Cooldowns beachten)
   │                             │
   │                             ▼
   └──────── Cooldown = SPA (ab Angriffsstart) ──► Target Re-evaluation
```
RECONSTRUCTED · MEDIUM

- SPA ist als Abstand zwischen Angriffen definiert. Ob die Animation darin enthalten ist, ist **UNKNOWN**. Für den Nachbau gilt: `nextAttackAt = attackStart + SPA`, und der Hit-Zeitpunkt liegt bei `attackStart + windup` mit `windup ≪ SPA`.
- Ob ein Ziel, das während des Windups stirbt, den Angriff „verschluckt“ oder den Angriff auf ein neues Ziel lenkt, ist **UNKNOWN**.
- Mehrere Hits werden wahrscheinlich über die Animation verteilt (sichtbar bei Multi-Hit-Units). **UNKNOWN**.

## 5. Damage Types / Affinities (seit Update 7)

| Typ | Beschreibung | Tag |
|---|---|---|
| Physical | Hände/Waffen | OBSERVED · HIGH · [S12] |
| Magic | Übernatürliche Fähigkeiten | OBSERVED · HIGH · [S12] |
| Fire | Element; die meisten Fire-Units verursachen Burn, der die Gegner-Regeneration senkt | OBSERVED · HIGH · [S12] |
| True Damage | Ignoriert Typ-Resistenzen | OBSERVED · HIGH · [S12] |
| Weitere (z. B. „Dark“ als Sekundärtyp) | Black Assassin: Physical + Secondary Dark | OBSERVED · MEDIUM · [S36] |

- In **Portals und Legend Stages** hat jeder Gegner eine **Resistenz** und eine **Schwäche**, die als Icon angezeigt wird. In der Story offenbar nicht. OBSERVED · HIGH · [S12]
- Units können **mehrere** Affinitäten haben (Primär/Sekundär). OBSERVED · HIGH · [S45 U7]
- **Multiplikatoren für Schwäche und Resistenz: UNKNOWN.** Zum Vergleich nennt ein anderes Roblox-TD-Spiel 150 %/65 %. Für AA ist das nicht belegt.

## 6. Damage-Formel

Was belegt ist:

| Faktor | Wirkung | Tag |
|---|---|---|
| Unit-Level | Level 100 ≈ **9,204×** Schaden von Level 1 | VERIFIED · CONFIRMED · [S04] + DERIVED aus S35 (3.589,59 / 390 = 9,2041) |
| Upgrade-Stufe | Basisschaden je Upgrade-Stufe aus der Tabelle | OBSERVED · HIGH |
| Potential (Stat-Roll) | Damage −10 % … ≥ +20 % | OBSERVED · HIGH · [S11] |
| Trait | z. B. Superior +10/12,5/15 %, Golden +30 % | OBSERVED · HIGH · [S47] |
| Curse | ±2,5–13 % auf einen Stat | OBSERVED · HIGH · [S18] |
| Relic | %DMG (typabhängig), PEN (Resistenz-Penetration), PWR (DPS/Upgrade, skaliert mit Level), Crit | OBSERVED · HIGH · [S17] |
| Buff-Units | z. B. +25 % Physical Damage (Commander), bis +100 % durch Stacking (Erwin-Typ) | OBSERVED · HIGH · [S30, S44] |
| Crit | ×1,5 (Standard), bis ×2 bei einzelnen Units | OBSERVED · HIGH · [S13] |
| Typ-Matchup | Schwäche/Resistenz (Werte UNKNOWN) | OBSERVED (Existenz) · UNKNOWN (Wert) |
| Tank-Gegner | „leicht reduzierter Schaden“ (Wert UNKNOWN) | OBSERVED · HIGH · [S14] |
| Culling-Trait | +20 % gegen Gegner mit niedriger HP (Schwelle UNKNOWN) | OBSERVED · MEDIUM · [S47] |
| Reaper-Trait | +15 % normal, +25 % gegen Bosse | OBSERVED · MEDIUM · [S47] |

**Rekonstruierte Formel** (RECONSTRUCTED · LOW, Reihenfolge und Additivität sind nicht belegt):

```text
BaseHit    = UpgradeTable[unit][upgrade].damage            // Level-1-Wert, Mittel-Roll
LevelMult  = L(level)            // L(1)=1, L(100)=9.204, Kurve UNKNOWN
StatMult   = 1 + potential.damage                          // −0.10 … +0.20+
TraitMult  = 1 + trait.damage (+ trait.conditional)        // z. B. Reaper vs Boss
CurseMult  = 1 + curse.damageDelta
BuffMult   = 1 + Σ? / max? (activeBuffs.damage)            // Stacking-Regeln s. §8
RelicMult  = 1 + relic.dmgPctForType + relic.pwr(level)
CritMult   = crit ? unit.critMultiplier (1.5 default) : 1
TypeMult   = trueDamage ? 1 : matchup(unit.type, enemy.weak/resist) // Werte UNKNOWN
EnemyMult  = enemy.tank ? (1 − tankReduction) : 1          // tankReduction UNKNOWN

FinalHit = BaseHit × LevelMult × StatMult × TraitMult × CurseMult
         × BuffMult × RelicMult × CritMult × TypeMult × EnemyMult
```

- Die Multiplikation der unabhängigen Quellen ist die plausibelste Annahme, weil Wiki-Seiten Werte wie „Level 100 while Active“ multiplikativ ausweisen. Ob Trait und Buff additiv zusammengefasst werden, ist **UNKNOWN**.
- **True Damage** (Celestial-Trait „+20 % True Damage Buff“): vermutlich ein zusätzlicher Anteil, der Resistenzen ignoriert. UNKNOWN.
- **Damage Caps, Boss-Reduktion, Defense-Werte:** keine Belege. **UNKNOWN.**

## 7. Status-Effekte (Debuffs auf Gegnern)

Quelle für alle Zeilen: [S13] OBSERVED · HIGH, sofern nicht anders angegeben.

| Effekt | Typ | Wirkung | Stärke / Dauer | Stack | Effekt-Cooldown auf demselben Gegner |
|---|---|---|---|---|---|
| **Stun** | Movement-Cancel | Gegner steht | Dauer je Unit | – | **10–14 s** |
| **Freeze** | Movement-Cancel | wie Stun | Dauer je Unit | stackt nicht mit Timestop | **10 s** |
| **Timestop** | Movement-Cancel | wie Freeze | Dauer je Unit | stackt nicht mit Freeze | UNKNOWN |
| **Burn** | DoT | Zusatzschaden über Ticks; senkt Gegner-Regeneration | meist **30 %** oder **50 %** des Hits, „Black Burn“ **100 %**; Beispiel Fiery Commander 30 % über **5 Ticks** [S34] | **stackt** zwischen Units | – |
| **Bleed** | DoT | Zusatzschaden; **stoppt Regeneration** komplett | meist **25–35 %**, Ausreißer 50 %; Beispiel 30 % über **3 Ticks** [S35] | UNKNOWN | – |
| **Poison** | DoT | Zusatzschaden pro Hit | Stärke UNKNOWN | **stackt** zwischen Units | – |
| **Slow** | Movement | senkt Speed | Stärke je Unit (UNKNOWN) | UNKNOWN | **4 s** nach Ablauf |
| **Knockback** | Displacement | schiebt den Gegner auf dem Pfad zurück | Distanz UNKNOWN | – | **30–31 s** |
| **Rewind** | Displacement | Gegner läuft für die Dauer rückwärts | Dauer je Unit | – | UNKNOWN |
| **Shatter** | Shield | entfernt **alle** Shield-Instanzen beim Treffer | – | – | – |
| Flying-Nullify | Mechanik | Ability einer Unit hebt Flying auf, damit Ground-Units treffen | – | – | – [S14] |
| Regen-Nullify | Mechanik | Bleed, bestimmte Units/Abilities stoppen Regeneration temporär | – | – | – [S14] |

**DoT-Tick-Modell (rekonstruiert):** `tickDamage = hitDamage × dotPct / ticks`. Tick-Intervall **UNKNOWN**. `DESIGN`: 1 s pro Tick.

**Effekt-Cooldown („Diminishing“):** AA schützt Gegner nach einem CC-Effekt für X Sekunden vor erneutem gleichartigem CC. Das verhindert Perma-Stun. Für den Nachbau gilt: `enemy.ccImmuneUntil[effectType] = expiry + cooldown`. RECONSTRUCTED · HIGH

## 8. Buffs (auf Units)

| Buff | Quelle (Beispiel) | Wirkung | Dauer / Cooldown | Stacking | Tag |
|---|---|---|---|---|---|
| Physical-Damage-Buff | Commander (Active) | +25 % Physical Damage der Units in Range | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S30] |
| Physical-Buff (Erwin-Typ) | Support-Unit | +X % Physical Damage | **30 s** Dauer, **60 s** Cooldown | Ein gebuffter Buffer gibt einen **stärkeren** Buff, bis **+100 %**. Ein bereits gebuffter Empfänger kann bis zum Ablauf nicht erneut gebufft werden. | OBSERVED · HIGH · [S44] |
| Magic-Buff (Wendy/Leafy-Typ) | Support-Unit | analog für Magic | 30 s / 60 s | wie oben | OBSERVED · HIGH · [S44] |
| Magic-Buff | Wind Dragon | buffed **nur Magic-Units** | **20 s** Dauer, **40 s** Cooldown | UNKNOWN | OBSERVED · HIGH · [S31] |
| Income-Buff | Golden-Trait | +20 % Yen | permanent | – | OBSERVED · HIGH |
| Hivemind | Honey (Hive) | ab Upgrade 3 Schaden ×3, ab Upgrade 6 ×5 (periodische Explosion) | – | – | OBSERVED · MEDIUM · [S32] |

**Bekannter Exploit bzw. Mechanik „Infinite 100 % Buff“:** Mit 4–5 Buffern im Versatz (Pentagram Loop: 2. Buffer bei 20 %, 3. bei 40–45 %, 4. bei 60 %, 5. bei 80 % des ersten Cooldowns) oder mit einem SPA-Curse auf dem Buffer (verlängert den Ability-Cooldown) wird der Buff dauerhaft auf 100 % gehalten. Die Ability-Cooldowns skalieren also **mit dem SPA-Stat**. OBSERVED · HIGH · [S44]

Abgeleitete Regeln für den Nachbau (RECONSTRUCTED · MEDIUM):
- `buff.strength = base + (caster.isBuffed ? bonus : 0)`, gedeckelt bei +100 %
- Ein Empfänger mit aktivem Buff gleichen Typs wird ignoriert („no refresh“)
- `ability.cooldown = baseCooldown × (1 + spaModifiers)`

## 9. Abilities

- **Active Abilities:** Button pro platzierter Unit (z. B. Buffs, Flying-Nullify). Sie haben Cooldown und Dauer. Manche werden erst durch ein Upgrade freigeschaltet (Captain U3 „Bamboo Shot“, Honey U3 „Hivemind“). OBSERVED · HIGH · [S29, S32]
- **Passive Abilities:** wirken permanent bzw. konditional (Legendary Assassin (Prime): 2× DPS gegen den vordersten Gegner; Sepsis: 100 % Crit gegen blutende Gegner). OBSERVED · MEDIUM · [S13, S53]
- **Summoner-Units (SUMN):** Commander ist als „Hybrid SUMN“ geführt, beschwört also Einheiten. Mechanik **UNKNOWN**. OBSERVED · MEDIUM · [S30]
