# Beispiel-Simulation – durchgerechnete Runde

**Zweck:** Alle Rechenwege einmal vollständig zeigen. **AA-Werte**, wo belegt: Captain- und C.E.O.-Datenblätter, Trait- und Potential-Modifikatoren, Fiery-Commander-Burn, Map-Länge Planet Namak. Alles andere ist ausdrücklich **`DESIGN`**: Start-Yen, Kill- und Wave-Yen, Gegner-HP, Speed, Spawn-Intervalle, Base HP und Leak-Schaden, weil diese AA-Werte UNKNOWN sind.

## Annahmen

| Parameter | Wert | Herkunft |
|---|---|---|
| Pfadlänge | 56 Studs (gerade Linie, s ∈ [0, 56]) | DERIVED: Planet Namak 14 s [S38] × 4 Studs/s (DESIGN) |
| Gegner-Speed | 4 Studs/s; Boss 2 Studs/s | DESIGN |
| Start-Yen | 2.250 | DESIGN |
| Kill-Yen | `5 + floor(maxHP/10)`; Boss 100 | DESIGN |
| Wave-Yen | `200 + 100·w` | DESIGN |
| Base HP / Leak | 100 / 1 pro Gegner, 20 pro Boss | DESIGN |
| Targeting | First (größtes s in Range) | AA-Modus [S53] |
| Units 5 Studs neben dem Pfad | Abdeckung: `|s − s0| ≤ √(range² − 5²)` | DERIVED (Geometrie) |
| Burn-Tick | 1 s | DESIGN |

## Unit-Werte vor dem Match

**Captain** (Rare, Level 1). Potential Damage **+5 %** (Rang B), Trait **Superior I** (+10 %), Level-Multiplikator 1,0:

```text
Damage = 3 × L(1) × (1 + 0.05) × (1 + 0.10) = 3 × 1 × 1.05 × 1.10 = 3.465
SPA    = 3   (U1: 2.5, U2: 2.0)
Range  = 25  (U2: 27)
DPS    = 3.465 / 3 = 1.155
```
Platzierung bei s0 = 28 → Abdeckung `±√(625−25) = ±24,49` → s ∈ [3,51 ; 52,49]. Ein Gegner mit 4 Studs/s ist **12,25 s** in Range und betritt sie 0,88 s nach dem Spawn.

**C.E.O.** (Farm): Placement 550 ¥ → 200 ¥/Wave; U1 1.000 ¥ → 500 ¥/Wave [S28].

**Fiery Commander:** 1.750 ¥, Damage 250, Burn 30 % = 75 über 5 Ticks (15/Tick), SPA 7, Range 20, AoE Circle r = 7 [S34]. Platzierung bei s0 = 30 → Abdeckung `±√(400−25) = ±19,36` → s ∈ [10,64 ; 49,36].

Zum Vergleich der Level-Effekt: Mit Level 100 hätte derselbe Captain `3,465 × 9,204 = 31,89` Damage pro Hit [S04].

---

## Wave 1 – 3 Gegner, HP 6, Spawn alle 3 s

```text
Yen: 2.250 − 300 (Captain) − 550 (C.E.O.) = 1.400
Hits bis Kill: ceil(6 / 3.465) = 2  → 1 Kill je 2 Angriffe (3 s Takt)
```

| t (s) | Ereignis | Rechnung | Gegner-HP |
|---:|---|---|---|
| 0,88 | Captain → e0 | 6 − 3,465 | 2,535 |
| 3,88 | Captain → e0 | 2,535 − 3,465 | **tot**, +5 ¥ |
| 6,88 | Captain → e1 (betrat Range bei 3,88) | 6 − 3,465 | 2,535 |
| 9,88 | Captain → e1 | | **tot**, +5 ¥ |
| 12,88 | Captain → e2 (Range-Ende bei 19,12) | | 2,535 |
| 15,88 | Captain → e2 | | **tot**, +5 ¥ |
| Ende | Wave-Yen 300 + Farm 200 | 1.400 + 15 + 500 | **Yen 1.915**, Base 100 |

## Wave 2 – 4 Gegner, HP 10, alle 3 s · Upgrades

```text
C.E.O. U1: −1.000 → 915;   Captain U1 (SPA 3 → 2.5): −450 → 465
Hits bis Kill: ceil(10 / 3.465) = 3  → 3 Angriffe × 2.5 s = 7.5 s pro Gegner
Gegner k: Range [3k + 0.88 ; 3k + 13.12]
```

| t | Ereignis | HP danach |
|---:|---|---|
| 0,88 / 3,38 / 5,88 | Captain → e0 ×3 | **tot** (+6 ¥) |
| 8,38 / 10,88 / 13,38 | Captain → e1 ×3 (Range bis 16,12) | **tot** (+6 ¥) |
| 15,88 / 18,38 | Captain → e2 ×2 | 3,07 |
| 19,12 / 20,0 | e2 verlässt die Range; erreicht s = 56 bei t = 20 → **Leak** | Base 99 |
| 20,88 | Captain → e3 (s = 47,5) | 6,535 |
| 22,12 / 23,0 | e3 verlässt die Range; **Leak** bei t = 23 | Base 98 |
| Ende | 465 + 12 + 400 + 500 (Farm U1) | **Yen 1.377**, Base 98 |

**Analyse:** Benötigte DPS ≈ 10 HP pro 3 s = 3,33. Captain U1 liefert `3,465 / 2,5 = 1,386`. Single-Target-DPS fehlt, und die Abdeckungszeit (12,25 s) reicht nicht für 4 Gegner × 7,5 s.

## Wave 3 – 5 Gegner, HP 10 · Captain U2

```text
Captain U2: −650 → 727.  SPA 2.0, Range 27 → Abdeckung ±√(729−25) = ±26.53 → [1.47 ; 54.53]
Pro Gegner 3 Hits × 2 s = 6 s; Range-Fenster 13.27 s
```

| Gegner | Hits (t) | Ergebnis |
|---|---|---|
| e0 | 0,37 / 2,37 / 4,37 | tot |
| e1 | 6,37 / 8,37 / 10,37 | tot |
| e2 | 12,37 / 14,37 / 16,37 | tot |
| e3 | 18,37 / 20,37 / 22,37 (s = 53,5 < 54,53) | tot |
| e4 | 24,37 → 6,535 HP; erreicht s = 56 bei t = 26,0 | **Leak**, Base 97 |
| Ende | 727 + 4×6 + 500 + 500 | **Yen 1.751**, Base 97 |

**Upgrade-Effizienz** (DERIVED):

```text
ΔDPS(U1→U2) = 3.465/2 − 3.465/2.5 = 1.733 − 1.386 = 0.347   für 650 ¥ → 0.53 DPS / 1000 ¥
ΔRange      = +2 Studs → +2.04 s Abdeckungsfenster
```
Zum Vergleich der C.E.O.: U1 (1.000 ¥) amortisiert sich in `1000 / (500−200) = 3,33` Waves.

## Wave 4 – Boss-Wave · Fiery Commander · Burn

```text
Fiery Commander platzieren: −1.750 → Yen 1
Gegner: m0 (t=0), m1 (t=3) mit HP 10 und Speed 4; BOSS (t=6) mit HP 600 und Speed 2
Boss-Range Captain: ab 6 + 1.47/2 = 6.74;  Boss-Range Fiery: 6 + 10.64/2 = 11.32 … 6 + 49.36/2 = 30.68
```

| t | Ereignis | Rechnung | Ziel-HP |
|---:|---|---|---|
| 0,37 | Captain → m0 | 10 − 3,465 | 6,535 |
| 2,37 | Captain → m0 | | 3,07 |
| 2,66 | **Fiery** → m0 (s = 10,64), AoE r = 7: kein weiteres Ziel | 250 ≥ 3,07 | m0 **tot** (+6) |
| 4,37 / 6,37 / 8,37 | Captain → m1 ×3 | | m1 **tot** (+6) |
| 9,66 | Fiery bereit; Boss bei s = 7,3 → nicht in Range | – | – |
| 10,37 | Captain → Boss | 600 − 3,465 | 596,54 |
| 11,32 | **Fiery** → Boss | −250; Burn 75 → 15/Tick ab 12,32 | 346,54 |
| 12,32 … 16,32 | 5 Burn-Ticks | −75 | (zusammen mit den Captain-Hits der nächsten Zeile) |
| 12,37 / 14,37 / 16,37 | Captain ×3 | −10,395 | **261,14** (nach 16,37) |
| 18,32 | **Fiery** → Boss | −250; neuer Burn 15/Tick | 11,14 |
| 18,37 | Captain | −3,465 | 7,67 |
| 19,32 | Burn-Tick | −15 | **tot** (+100) |

Kontrollsumme: `5 × 3,465 + 2 × 250 + 75 + 15 = 607,3 ≥ 600` ✓

```text
Ende Wave 4: 1 + 6 + 6 + 100 + Wave-Yen 600 + Farm 500 = 1.213 Yen · Base 97
```

**Beitrag zum Boss-Kill:** Fiery-Hits 500 (82 %), Burn 90 (15 %), Captain 17,3 (3 %). Das zeigt den AA-typischen Aufbau: ein günstiger Single-Target-Starter, eine Farm-Unit früh und ein AoE- oder DoT-Carry für Boss und Gruppen.

## Ability-Beispiel (hypothetisch)

Ein Commander (775 ¥, Active: +25 % **Physical**-Damage in Range [S30]) neben dem Captain (Physical) würde den Captain-Hit auf `3,465 × 1,25 = 4,331` heben. Damit sinken die Hits pro HP-10-Gegner von 3 auf `ceil(10/4,331) = 3`, also ändert sich nichts. Bei HP 8 wären es 2 statt 3. Buff-Breakpoints sind damit ein relevantes Designelement. Der Fiery Commander (Fire) würde vom Physical-Buff **nicht** profitieren.

## Lehren für das Balancing

1. **Abdeckungszeit × DPS** ist die zentrale Kennzahl: `benötigte DPS ≈ Σ HP / Fensterzeit`.
2. Farm-Units zahlen sich in 3–4 Waves aus. Früh platziert, finanzieren sie den Carry ab Wave 4.
3. Burn bzw. DoT liefert bei SPA-lastigen Units 15–30 % Zusatzschaden und kann Bosse „über die Linie“ bringen.
4. First-Targeting verteilt Schaden auf den vordersten Gegner, verhindert Leaks aber nicht bei zu wenig DPS.

Ein reproduzierbares Skript für solche Durchläufe gehört später in die Game-Engine-Tests (Fixed-Timestep-Simulation, siehe [technical-reconstruction.md](technical-reconstruction.md)).
