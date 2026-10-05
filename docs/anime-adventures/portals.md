# Portal-System

## Grundprinzip

| Aspekt | Wert | Tag |
|---|---|---|
| Was ist ein Portal? | Ein **Inventar-Item** (Portals-Tab), das eine besondere Stage öffnet | OBSERVED · HIGH · [S09] |
| Erwerb | Drop aus Infinite-Modi bestimmter Welten, aus Raids/Stages, aus anderen Portalen (Ketten), aus Events | OBSERVED · HIGH · [S09, S48] |
| Belohnungen | Evolution-Materialien, exklusive Units, **weitere Portale**, Event-Währungen, Chance auf ein **Secret Portal** | OBSERVED · HIGH · [S09] |
| Tier | Jedes Portal hat ein **Tier**, das Schwierigkeit **und** Belohnungsmultiplikator bestimmt | OBSERVED · HIGH · [S09] |
| Tier-Maps | Beispiel Witch Portal: Tier 0–4 auf **zufälligen Maps**, Tier 5–11 auf **Witch City** | OBSERVED · HIGH · [S09] |
| Gegner-Affinität | Portal zeigt die Gegnerschwäche als Icon; passende Units benutzen | OBSERVED · HIGH · [S12] |
| Verbrauch | Portal wird beim Öffnen verbraucht | RECONSTRUCTED · HIGH |
| Host | Spieler, der das Portal einsetzt; andere können beitreten | OBSERVED · HIGH · [S10] |
| Fail/Success | Success = Clear; Fail = Base-HP 0. Ob das Portal bei einem Fail verloren geht: UNKNOWN (vermutlich ja) | RECONSTRUCTED · MEDIUM |

## Bekannte Portale

| Portal | Update | Quelle (Erwerb) | Drops | Tag |
|---|---|---|---|---|
| Alien Portal | 10 (OPM) | Alien Spaceship Infinite | Full Power Core (1–4), Alien Core (1–6) | OBSERVED · HIGH · [S09] |
| Witch Portal | 13.5 | UNKNOWN | Grief Seed, Time Traveller’s Shard (sehr selten) | OBSERVED · HIGH · [S09] |
| Demon Academy Portal | 13.5 | UNKNOWN | Challenge-Modifikatoren Mini Range, Triple Cost, Steel-Plated, Godspeed, Hyper-Regen | OBSERVED · HIGH · [S09, S15] |
| Demon Leader's Portal | Legacy | UNKNOWN | UNKNOWN | OBSERVED · MEDIUM · [S09] |
| Puppet Portal | Legacy | UNKNOWN | UNKNOWN | OBSERVED · MEDIUM · [S09] |
| Eclipse Portal (Normal) | 15 | Windhym Infinite (Level ≥ 100) | UNKNOWN; Secret-Variante „The Eclipse – The Wings of Darkness“ | OBSERVED · HIGH · [S48] |
| Noble Portal | 17 | Mountain Temple Act 6 (Gilgamesh) | UNKNOWN | OBSERVED · HIGH · [S48] |
| Path Portal | Legacy | UNKNOWN | (vermutlich Path Branches) | OBSERVED · MEDIUM |
| Winter Portals / Frozen Portal | Event | UNKNOWN | Secret Portal „Frost Queen's Portal“ | OBSERVED · HIGH · [S10] |
| Summer Portal | Event | Ant Kingdom Act 6 nötig zum Platzieren | UNKNOWN | OBSERVED · MEDIUM · [S48] |
| Sea God's Portal | Event | UNKNOWN | UNKNOWN | OBSERVED · LOW · [S48] |
| Divine Treasure Portal | Event | UNKNOWN | UNKNOWN | OBSERVED · LOW |
| Shibuya Portal | 20 (RR) | Shibuya Infinite | UNKNOWN | OBSERVED · MEDIUM · [S53] |
| Final Disc | – | UNKNOWN | UNKNOWN | OBSERVED · LOW · [S09] |
| April Fools Portal | RR | Event | Blessing/Curse-Kartenwahl | OBSERVED · LOW |

## Secret Portals

| Aspekt | Wert | Tag |
|---|---|---|
| Natur | Zeitlich begrenzte Portale, die **Secret Units** droppen | OBSERVED · HIGH · [S10] |
| Erwerb | kleine Chance als Belohnung des zugehörigen Basis-Portals (z. B. Frozen Portal → Frost Queen's Portal) | OBSERVED · HIGH · [S10] |
| Spielerzahl | **bis zu 6 Spieler** | OBSERVED · HIGH · [S10] |
| Secret-Unit-Chance Host | **garantiert (100 %)** | OBSERVED · HIGH · [S10] |
| Secret-Unit-Chance Mitspieler | **5 %** | OBSERVED · HIGH · [S10] |
| Drop-Chance Secret Portal aus Basis-Portal | **UNKNOWN** | UNKNOWN |

### Portal-Wahrscheinlichkeiten (DERIVED)

Sei `q` die Chance auf ein Secret Portal pro Basis-Portal-Clear (UNKNOWN):
- Erwartete Basis-Portal-Clears bis zum Secret Portal: `1/q`
- Mitspieler in fremden Secret Portals: P(≥1 Secret Unit in n Teilnahmen) = `1 − 0,95^n`. Bei n = 14 sind das 51,2 %, bei n = 45 sind es 90,1 %.
- Erwartete Secret Units pro Secret-Portal-Run für die Party (Host + 5 Mitspieler) = `1 + 5×0,05 = 1,25`

## Datenmodell (siehe [technical-reconstruction.md](technical-reconstruction.md#datenmodell))

```text
PortalItem { portalTypeId, tier, mapId?, modifiers[], affinity: {weak, resist} }
PortalType { tiers: [{tier, mapPool, enemyScaling, rewardMult}], dropTable, secretPortalChance }
```
