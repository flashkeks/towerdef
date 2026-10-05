# Game Mathematics

Kennzeichnung pro Formel: **Official** (vom Spiel bzw. Entwickler angezeigt und durch mehrere Quellen bestätigt) · **Observed** (Community-Messung/Wiki) · **Derived** (aus belegten Werten berechnet) · **Reconstructed** (plausible Struktur, nicht belegt) · **Unknown**.

## DPS

```text
DPS      = Damage × Hits / SPA
DPS_crit = DPS × (1 + critChance × (critMult − 1))
DPS_dot  = DoTtotal / SPA            (sofern DoT pro Angriff neu angewendet wird)
DPS_aoe  = DPS × E[getroffene Gegner]
```
- `Damage / SPA`: **Derived · CONFIRMED** (Wiki: 390 / 7 = 55,71 [S35])
- Hits-Faktor, Crit und DoT: **Reconstructed · HIGH**

## Final Damage

```text
FinalHit = Base(upgrade) × L(level) × (1+pot) × (1+trait) × (1+curse) × (1+relic) × (1+buff) × crit × type × enemy
```
**Reconstructed · LOW**. Faktoren belegt, Kombination nicht. Details in [combat-system.md](combat-system.md#6-damage-formel).

## Level-Multiplikator

```text
L(100) / L(1) = 9.204        Observed · CONFIRMED [S04] + Derived (3589.59 / 390) [S35]
L(L) linear:  1 + 0.082869·(L−1)       Reconstructed · LOW
L(L) expon.:  1.022674^(L−1)           Reconstructed · LOW
```

## Crit Damage

```text
critHit = hit × critMult,  critMult = 1.5 (Standard), 2.0 (Ausnahmen)    Observed · HIGH [S13]
P(crit) = critChance (25–50 % typisch; Relic Nail +10–20 %)              Observed · HIGH
```

## SPA

```text
SPA_eff = SPA_base(upgrade) × (1 + pot_spa) × (1 + trait_spa) × (1 + curse_spa) × (1 + buff_spa)
         trait_spa: Nimble −5/−7.5/−12 %, Godspeed −20 %, Divine −10 %
Ability-Cooldown skaliert mit SPA-Modifikatoren (Curse)      Observed · HIGH [S44]
```
**Reconstructed · MEDIUM**

## Range

```text
Range_eff = Range_base(upgrade) × (1 + pot_range) × (1 + trait_range) × (1 + curse_range)
           × challengeMult (Short Range: 1/3? bzw. 2/3?, Mini Range: 3/4? bzw. 1/4?)
Abdeckung auf geradem Pfad mit Abstand d: Fenster = 2·√(Range² − d²)
```
**Reconstructed · MEDIUM** (Challenge-Faktoren mehrdeutig → [unknowns.md](unknowns.md))

## Enemy HP Scaling / Wave Scaling

```text
HP(w, n) = f(w) × g(n)       f monoton steigend mit Sprung bei W_jump, g(n) Party-Scaling
```
**Unknown** (nur qualitativ belegt [S06]). DESIGN-Vorschlag in [waves.md](waves.md#infinite-generator-design--kein-aa-wert).

## Yen Generation

```text
YenWave = waveYen(w) + Σ_farms income(stufe) × (golden ? 1.2 : 1) + Σ kills killYen(e)
```
- Farm-Teil: **Observed · HIGH** [S28, S37]; Golden ×1,2: **Derived · CONFIRMED** (Bulby-ROI reproduziert)
- waveYen und killYen: **Unknown**

## Sell Value

```text
Sell = floor(sellRate × (deployCost + Σ paidUpgrades)),   sellRate ∈ {0.25, 0.30} je Unit
```
**Observed · MEDIUM** (Rundung UNKNOWN)

## Upgrade Efficiency / Farm-ROI

```text
UpgradeEff_k  = (DPS_k − DPS_{k−1}) / cost_k
DPS/Cost      = DPS_k / Σ_{i≤k} cost_i
FarmROI_k     = cost_k / (income_k − income_{k−1})          (Waves)
FarmROI_gold  = FarmROI_k / 1.2
```
**Derived · CONFIRMED** (reproduziert die Wiki-ROI-Tabelle exakt [S37])

## Summon Probability

```text
P(Rarität r) = rate_r                           Official (UI) · CONFIRMED [S01]
P(spez. Featured-Center) = 0.005 × 0.5 = 0.0025 (Special)          Derived
P(spez. unfeatured Mythic) = 0.005 × 0.00526 = 0.0000263           Derived
P(≥1 in n) = 1 − (1−p)^n                                           Derived
```

## Pity Probability

```text
E[n | Pity N] = (1 − (1−p)^N) / p           Derived
P(Pity greift) = (1−p)^(N−1)                 Derived
Center-Mythic: p = 0.0025, N = 400 → E = 253.0 Summons (12.652 Gems), P(Pity) = 36.8 %
Legendary:     p = 0.02,   N = 50  → E = 31.8 Summons,  P(Pity) = 37.2 %
```
**Derived · HIGH** (Pity-Mechanik Observed; Reset-Regel teilweise unklar)

<a id="summon"></a>Falls die Mythic-Pity bei **jedem** Mythic zurückgesetzt wird, gibt es keine geschlossene Form. Dann ist eine Simulation nötig:

```text
repeat M times:
  pity=0; n=0
  loop: n++; pity++
    if pity==400: got center → break
    r=rand(); if r<0.005: (mythic) pity=0; if rand()<0.5: got center → break
  record n
```

## Trait Probability

```text
P(Trait t) = p_t (Tabelle)                             Observed · HIGH [S47]
E[Rerolls bis t] = 1/p_t                               Derived
E[Remnants] = cost(r) / p_t,  cost = 5 (Mythic/Secret) | 1 (sonst)
E[Gems via Merchant] = 400 × E[Remnants]
```

## Shiny Probability

```text
P(shiny | Summon) = 0.01  (Shiny Hunter: 0.03)         Official · CONFIRMED [S01, S04]
P(shiny ∧ r) = 0.01 × rate_r                           Derived
```

## Potential / Stat-Roll

```text
pot_dmg ∈ [−0.10, ≥0.20], Rang nach Tabelle            Observed · HIGH [S11]
Worthiness w = min(kills/10000, 1) (pro Reroll max. 100 %, Speicher bis 400 %)   Observed · HIGH
w = 1 ⇒ alle Stats ≥ B+                                Observed · MEDIUM
Verteilung(pot | w)                                    Unknown
```

## Portal Probability

```text
P(Secret Unit | Host) = 1;  P(Secret Unit | Mitspieler) = 0.05      Observed · HIGH [S10]
P(Secret Portal | Basis-Clear) = q                                   Unknown
E[Basis-Clears bis Secret Portal] = 1/q                              Derived (Form)
Drop mit Clear-Garantie G: E = (1 − (1−p)^G) / p  (z. B. Spider p=0.01, G=15 → 14.0)   Derived
```

## Infinite-Gems

```text
Gems(W) = Σ_{w≤min(W,104)} g(w), g = 0 (1–5), 18 (6), 3 (7–15), 5 (16–104)  → 490 bei W ≥ 104
Wiki-Maximum: 497 (Differenz 7 → Konflikt)
```
**Observed · MEDIUM / Derived** (siehe [unknowns.md](unknowns.md))

## Time Machine

```text
Gems/h = 3 × 3600/150 = 72;  VIP/Premium: 144        Derived · CONFIRMED [S25]
```

## Trade-Tax

```text
Tax = Σ tax(item) über die Items der Seite mit dem "besseren Deal"      Observed (Tabelle) / Reconstructed (Regel)
```
