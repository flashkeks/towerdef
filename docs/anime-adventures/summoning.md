# Summoning / Gacha

## Kosten

| Aspekt | Wert | Tag |
|---|---|---|
| Single Summon | **50 Gems** oder 1 Summon Ticket | VERIFIED · CONFIRMED · [S01] |
| Mit VIP | **40 Gems** (−20 %) | VERIFIED · CONFIRMED · [S01, S22] |
| Multi Summon | **UNKNOWN** (10er-Pull im Spiel wahrscheinlich, Preis bzw. Rabatt nicht belegt) | UNKNOWN |
| Summon Tickets | Gold-Shop, Belohnungen | OBSERVED · HIGH · [S20] |
| Event Banner (RR) | nur mit **Event-Währung** | OBSERVED · HIGH · [S43] |
| Legacy Banner (RR) | mit **Legacy Gems** | OBSERVED · MEDIUM · [S43] |
| Level-Anforderung | Summoning ab Spielstart; Secret/Shiny laut einer Quelle ab Level 20 | OBSERVED · LOW |

## Banner-Typen nach Version

### LEGACY (2022–2023)

| Banner | Inhalt | Rotation | Tag |
|---|---|---|---|
| Standard | alle Raritäten, Mythic **0,25 %** | **stündlich** neue Zufallsauswahl | VERIFIED · CONFIRMED · [S01] |
| Special | **3 Featured Mythics**, Mythic **0,5 %** (2×) | Featured stündlich | VERIFIED · CONFIRMED · [S01] |
| Event | **nur 3 Limited-Mythics** featured, 0,5 %, keine anderen Mythics | Event-Dauer | OBSERVED · HIGH · [S01] |

### RR (ab Dezember 2024) [S43]

| Banner | Raten | Besonderheit | Tag |
|---|---|---|---|
| Event | Mythic **0,25 %**, Mythic-Skin **0,249 %**, Secret **1 : 80.000** (0,00125 %) | nur Event-Währung, nur während Events | OBSERVED · MEDIUM |
| Special | Mythic **0,5 %**, immer 3 Featured Mythics | – | OBSERVED · MEDIUM |
| Legacy | wie Special; ein unfeatured Mythic hat **0,714 %** Anteil (Special: **0,625 %**) | Legacy-Units, Legacy Gems, rotierende 3 Featured | OBSERVED · MEDIUM |
| 4. Banner | „coming soon“ | – | OBSERVED · LOW |

## Raten (Standard, LEGACY) [S01]

| Rarität | Rate | Shiny (1 %) | Shiny mit Shiny Hunter (3 %) | Tag |
|---|---:|---:|---:|---|
| Rare | 81,9 % | 0,819 % | 2,457 % | VERIFIED · CONFIRMED |
| Epic | 16 % | 0,16 % | 0,48 % | VERIFIED · CONFIRMED |
| Legendary | 2 % | 0,02 % | 0,06 % | VERIFIED · CONFIRMED |
| Mythic | 0,25 % | 0,0025 % | 0,0075 % | VERIFIED · CONFIRMED |
| Summe | **100,15 %** ⚠ | | | DERIVED |
| Star Remnant (Zusatzdrop) | 0,25 % pro Summon | | | OBSERVED · HIGH · [S03] |

⚠ Die Summe beträgt 100,15 % statt 100 %. Wahrscheinlich ist Rare = 81,75 %, oder die Quelle rundet. Eine andere Quelle nennt **Rare 27,3 %** „in beiden Bannern“ [S27]. Dieser Wert passt nicht zu den anderen Raten; vermutlich ist er eine RR-Änderung oder ein Fehler. → [unknowns.md](unknowns.md)

Auf dem **Special Banner** steigt Mythic auf 0,5 %. Die Umverteilung, also aus welcher Rarität die zusätzlichen 0,25 % stammen, ist **UNKNOWN**.

## Featured-Verteilung innerhalb Mythic (Special, LEGACY) [S01]

| Ziel | Anteil am Mythic-Pool | absolut pro Summon |
|---|---:|---:|
| Center-Featured | **50 %** | 0,25 % |
| Linker Side-Featured | 10 % | 0,05 % |
| Rechter Side-Featured | 10 % | 0,05 % |
| jeder unfeatured Mythic | **0,526 %** | 0,00263 % |

Daraus ergibt sich (DERIVED): `30 % / 0,526 % ≈ 57` unfeatured Mythics im Pool zu dieser Zeit. Im RR ergeben sich `30 % / 0,625 % = 48` (Special) und `30 % / 0,714 % ≈ 42` (Legacy).

## Pity

| Pity | Mechanik | Tag |
|---|---|---|
| **Mythic (Featured-Center)** | +1/400 pro Summon; nach **400 Summons** garantiert der **Center-Featured** Mythic | VERIFIED · CONFIRMED · [S01, S59] |
| Kosten bis zur Mythic-Pity | 400 × 50 = **20.000 Gems** (VIP: 16.000) | DERIVED · CONFIRMED |
| **Legendary** | +2 % pro Summon, garantiert nach **50 Summons** (2.500 Gems) | OBSERVED · MEDIUM · [S51] |
| Reset | Pity der jeweiligen Rarität setzt sich auf 0 zurück, wenn diese Rarität gezogen wird | OBSERVED · MEDIUM · [S51] |
| Sichtbarkeit | Mythic-Pity im LEGACY **nicht sichtbar**, Legendary-Pity sichtbar; später „Featured Unit Pity“ für Special und Legacy sichtbar eingeführt | OBSERVED · MEDIUM · [S51, S01] |
| Soft Pity | **nicht belegt**, keine Hinweise auf steigende Raten | UNKNOWN |
| Pity übertragbar zwischen Bannern/Rotationen | **UNKNOWN** | UNKNOWN |

**Offener Widerspruch:** Setzt die Mythic-Pity bei **jedem** Mythic zurück (laut S51) oder nur beim **Center-Featured** (laut S01, „guaranteed featured middle unit“)? Die Formulierung des Wikis legt eine Featured-Pity nahe. → [unknowns.md](unknowns.md)

## Mathematik

Notation: `p` = Wahrscheinlichkeit pro Summon für das Ziel, `n` = Anzahl Summons, `c` = Gems pro Summon (50).

```text
P(≥1 in n)              = 1 − (1 − p)^n
P(miss in n)            = (1 − p)^n
E[Summons] ohne Pity    = 1 / p
E[Summons] mit Pity N   = Σ_{k=0}^{N−1} (1 − p)^k = (1 − (1 − p)^N) / p
P(Pity wird erreicht)   = (1 − p)^(N−1)
E[Gems]                 = c × E[Summons]
```
DERIVED · CONFIRMED (Standardgeometrie, unter der Annahme unabhängiger Züge)

### Center-Featured Mythic (Special): p = 0,005 × 0,5 = 0,0025, N = 400

| n Summons | Gems | P(Center ≥ 1) natürlich |
|---:|---:|---:|
| 50 | 2.500 | 11,8 % |
| 100 | 5.000 | 22,1 % |
| 200 | 10.000 | 39,4 % |
| 300 | 15.000 | 52,8 % |
| 399 | 19.950 | 63,2 % |
| 400 | 20.000 | **100 %** (Pity) |

- E[Summons] mit Pity = **253,0** → **12.652 Gems** (VIP 10.121)
- P(Pity muss greifen) = 0,9975^399 = **36,8 %**
- Ohne Pity wäre E = 400 Summons. Die Pity spart also im Mittel ~147 Summons.

Interpretation, falls die Pity auch bei Side- oder unfeatured Mythics zurücksetzt: Dann sinkt der Schutzeffekt deutlich. Eine Simulation ist in [mathematics.md](mathematics.md#summon) skizziert.

### Beliebiger Mythic (Standard): p = 0,0025

- E = 400 Summons (20.000 Gems); P(≥1 in 100) = 22,1 %

### Legendary: p = 0,02, N = 50

- P(natürlich in 49) = **62,8 %**; E[Summons] mit Pity = **31,8** (1.590 Gems)

### Shiny Mythic: p = 0,000025

- E = 40.000 Summons (2 Mio. Gems); mit Shiny Hunter 13.333 Summons

### Secret auf dem RR-Event-Banner: p = 1/80.000

- P(≥1 in 1.000) = 1,24 %

## Banner-Rotation (Implementierung)

```text
rotationSeed = hash(bannerId, floor(serverTime / 3600))   // stündlich (LEGACY belegt)
featured     = pickWeighted(mythicPool, 3, seed=rotationSeed)
center       = featured[0]
```
Hinweis: Eine **global deterministische** Rotation (alle Spieler sehen dasselbe Banner) passt zu „Every hour the banner will be refreshed“. RECONSTRUCTED · MEDIUM
