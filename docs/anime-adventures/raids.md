# Raids

## Struktur

| Aspekt | Wert | Tag |
|---|---|---|
| Zugang | Raid-Bereich der Lobby (Snippet: „mode accessible from Neo-Tokyo“) | OBSERVED · MEDIUM · [S08] |
| Tickets | Früher Raid Tickets (z. B. „Midnight Attack“, im Gold-Shop kaufbar); **seit Update 10.7.5 nicht mehr nötig** | OBSERVED · HIGH · [S08, S20] |
| Tägliche Versuche | seit Update 12 **unbegrenzt** | OBSERVED · HIGH · [S45] |
| Stages | mehrere Stages/Acts pro Raid mit steigenden Belohnungen | OBSERVED · HIGH · [S08] |
| Clear-Meilensteine | einmalige Belohnungen nach N Clears (Pity-ähnlich) | OBSERVED · HIGH · [S08] |
| Raid-Währungen und -Shop | raid-spezifisch (Killer Coins, Mage Marks, Power Cells, Chunks …) | OBSERVED · HIGH · [S08] |
| Level-Anforderung | **UNKNOWN** | UNKNOWN |
| Party-Größe | **UNKNOWN** | UNKNOWN |

## Raid-Liste und Belohnungen [S08, S17] OBSERVED · HIGH

| Raid | Belohnungen (belegt) |
|---|---|
| Ant Kingdom (Midnight) | Stage 1: **75 Gems/Run**, **1 %** Spider (Mythic); einmalig: 250 Gems, nach 10 Clears 3 Reroll Tokens, **nach 15 Clears garantierter Spider** |
| Sacred Planet | 30–75 Gems pro Act, Mage Marks; Stage 4 (The Genie): Relic Shard 10 %; Stage 5 (The Pure Form): Relic Shard 100 %, Bubblegum |
| Strange Town | 40–75 Gems, 3–28 Killer Coins pro Act |
| Future City (Tyrant's Invasion) / Future City | 200 Gems, Power Cells, Chunks, Experiment X (Imperfect, Epic) |
| Marine's Ford (Buddha) | UNKNOWN |
| Ruined City (The Menace) | UNKNOWN |
| Cursed Festival | UNKNOWN |
| Storm Hideout | UNKNOWN |
| Nightmare Train | UNKNOWN |
| Shigashinu District | UNKNOWN |
| Sand Village | UNKNOWN |

Allgemein: Secret Units droppen aus Raids oder Dungeons mit **1–5 %**. OBSERVED · MEDIUM · [S10]

## Raid-Unit-Drop-Mathematik (Beispiel Spider)

`p = 0,01` pro Run, garantiert nach 15 Clears (einmalig).

- P(Spider vor dem Garantie-Clear, also in 14 Runs) = `1 − 0,99^14` = **13,1 %**
- Ohne Garantie wären es im Erwartungswert 100 Runs. Mit Garantie: `E = Σ_{k=0}^{14} 0,99^k` = **14,0 Runs** (DERIVED)
- Gems bis zur Garantie: 15 × 75 + 250 = **1.375 Gems** plus 3 Reroll Tokens (DERIVED)

## Raid-Bosse

| Raid | Boss | Tag |
|---|---|---|
| Sacred Planet S4 / S5 | The Genie / The Pure Form | OBSERVED · HIGH |
| andere | UNKNOWN | UNKNOWN |

## Portal-Mechanik in Raids

Einzelne Raids droppen Portale bzw. Portal-Items. Eine konkrete Zuordnung ist UNKNOWN; siehe [portals.md](portals.md).
