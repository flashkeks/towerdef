# Design-Brief: Essenz der Anime-Adventures-Recherche (AA)

Zweck: Kurzfassung für Entwickler eines **eigenen** Web-Tower-Defense-Spiels. Keine neue Recherche, nur Verdichtung der Detaildateien. Namen, Figuren und Assets von AA werden nicht übernommen (siehe [README.md](README.md#rechtliche-grenze)). Stand: 2026-10-06.

**Etikett-Format `[Herkunft/Sicherheit Quelle]`**

| Kürzel | Bedeutung |
|---|---|
| V | VERIFIED (offizielle/mehrfach bestätigte Anzeige, Roblox-API) |
| O | OBSERVED (Wiki, Datenmodule, Community-Messung) |
| R | RECONSTRUCTED (aus Quellen zusammengesetzt) |
| D | DERIVED (berechnet, Rechenweg in der Detaildatei) |
| U | UNKNOWN (nicht dokumentiert) |

Sicherheit: CONFIRMED / HIGH / MEDIUM / LOW (siehe [README.md](README.md#kennzeichnung)). Quellen: S65 Unit-Datenmodul (RR), S66 dasselbe (LEGACY), S67 Angriffs-/Effektmodul, S68 Item-Modul, S72 Wiki-Volltext, S73 Trello (frühe LEGACY), S75 Roblox-API, S76 Infobox-Code. `DESIGN` = kein AA-Wert, nur Vorschlag. Versionen: LEGACY = 07/2022 bis 12/2023, RR = ab 12/2024.

**Wichtigste Warnung:** Gegner-HP, In-Match-Yen (Start/Kill/Wave), Wave-Zusammensetzung, Level-Kurve und die Reihenfolge der Damage-Faktoren sind in keiner Quelle belegt. Die Zahlen unten beschreiben Unit-Seite, Gacha und Progression gut, die Gegner-Seite praktisch gar nicht (Abschnitt 9).

---

## 1. Core Loop (Lobby → Match → Belohnung)

```text
Lobby ─► Summon (Gems/Tickets) ─► Team wählen ─► Stage/Modus wählen
  ▲                                                    │
  │                                                    ▼
  │          Match: Units platzieren → Yen verdienen → upgraden → Waves halten
  │                                                    │
  └── Belohnung: Gems, Gold, Player-XP, Unit-XP, Items, Portale ◄──┘
      └─► Units leveln · Evolve · Traits/Stats rerollen · Shops · Trading
```
[R/HIGH S72] Detail: [game-overview.md](game-overview.md#core-gameplay-loop), Ablauf einer Partie: [core-mechanics.md](core-mechanics.md#ablauf-einer-partie).

- Match-Reihenfolge: Start → (Start-Yen) → Wave → Spawn am Pfadanfang → Targeting → Angriff → Kill-Yen → Wave-Ende (Farm-Einkommen, Healer) → nächste Wave bis Sieg oder Base-HP 0. [R/HIGH S72]
- Ein Wave-Timer existiert (Dauer unbekannt). [O/HIGH S72]
- Yen gilt nur im Match und ist pro Spieler getrennt (Koop). [R/MEDIUM S72]
- Sieg = alle Waves inkl. Boss. Infinite hat keinen Sieg, nur Wave-Fortschritt. [R/HIGH S72]
- Story-Act: First Clear 80 Gems + 50 Player-XP, Wiederholung 20 Gems + 50 XP. [O/HIGH S72]
- Eine Welt (6 Acts) bringt erstmalig 1.380 Gems, also etwa 27,6 Summons. [D/HIGH S72]
- Struktur: 22 Welten mit je 6 Acts, Boss am Act-Ende. [O/HIGH S72]
- Freischaltung läuft fast nur über Stage-Fortschritt, wenig über Spieler-Level. Level-Gates: Banner-Tier 1 ab Level 5 [O/HIGH S72], Tier 2 (Secrets) ab Level 20 [O/HIGH S72], Trading ab Level 40 [O/HIGH S72]. XP-Kurve und Level-Cap des Spielers: unbekannt. [U]
- Progressionspfad: [game-overview.md](game-overview.md#progressionspfad-rekonstruiert).

## 2. Kampf

Details: [combat-system.md](combat-system.md), Formeln in [mathematics.md](mathematics.md#final-damage).

### 2.1 Platzierung und Spawn Cap

- Platzierungsart: Ground (461 von 561 Units), Hill (71), Hybrid (29). [O/HIGH S65]
- Ground-Units treffen keine Flying-Gegner. Hill und Hybrid treffen Boden und Luft. [O/HIGH S39,S65]
- Spawn Cap = max. gleichzeitige Platzierungen **pro Unit-Typ** (nicht global). Verteilung über 534 Units: 4 (219), 3 (193), 5 (82), 6 (20), 1 (15), 2 (5). [D/HIGH S65]
- 4 Buff-Units haben einen globalen Cap (6). Die Bedeutung (über alle Spieler?) ist unsicher. [R/LOW S65]
- Team: 6 Slots als Community-Konsens, Slots hängen am Spieler-Level. [O/MEDIUM S53,S72]
- Mindestabstand, Kollisionsradius, globales Unit-Limit: unbekannt. [U]
- Details: [core-mechanics.md](core-mechanics.md#platzierung).

### 2.2 Angriff, SPA, Range

- `DPS = Damage / SPA` (SPA = Sekunden pro Angriff, niedriger ist besser). Beispiel 390/7 = 55,71. [D/CONFIRMED S35,S72]
- Hits teilen den Damage, sie multiplizieren ihn nicht. Jeder Hit entfernt eine Schild-Instanz. [V/CONFIRMED S76,S72]
- Range in Studs. Placement-Median 19 (Quartile 15/22), Max-Upgrade-Median 30 (25/35). [D/HIGH S65]
- Level wirkt auf Damage, DoT und Beschwörungs-HP, **nicht** auf SPA und Range. [O/HIGH S72]
- Angriffszyklus: Ziel in Range → Windup → Hits → Cooldown = SPA. Windup-Dauer unbekannt. [R/MEDIUM S72]
- Targeting belegt: **First** und **Strongest**. Die übrigen Modi sind nicht belegt. [O/HIGH S53,S72]
- Modus pro Unit per Dropdown (RR seit 19.5). [O/HIGH S72]
- Einzelne Angriffe haben feste Zielregeln (z. B. "First enemy on the map") und ignorieren die Range. [O/HIGH S72]

### 2.3 AoE-Formen (1.097 Angriffe)

| Form | Anzahl | Parameter (Min / Median / Max) | Trefferregel (Rekonstruktion) |
|---|---:|---|---|
| Circle | 692 | Radius 2 / 8 / 20 | Kreis **um das Ziel** [R/MEDIUM S72,S67] |
| Cone | 145 | Winkel 30° / 50° / 110° | Winkel ab Unit, begrenzt durch Range [R/MEDIUM S72] |
| Line | 98 | Breite 2 / 7 / 20 | Streifen ab Unit [R/MEDIUM S72] |
| Full | 78 | = Range | alle in Range [R/HIGH S72] |
| Single | 76 | – | ein Ziel |

Zählung [D/HIGH S67]. Hits: 819 Angriffe ohne Angabe (= 1 Hit), sonst meist 2 bis 5, Max 12. [D/HIGH S67] Die Circle-Größe ist von der Range unabhängig (Challenge "Mini Range" verkleinert sie nicht). [O/MEDIUM S72]

### 2.4 Schaden, Affinitäten, Crits, Buffs

- Damage-Typen: Physical (316 Units), Magic (235), True (6). Elemente: Dark, Fire, Lightning, Ice, Air, Light, Water, Rose. [O/HIGH S65]
- Schwäche additiv: `1 + Σ weakness%` (Beispiel 10.000 × (1+4,00+1,50) = 65.000). [O/HIGH S72]
- Resistenz: `100/(100+R)` (R=150 ergibt 40 % Schaden). True Damage ignoriert Resistenz und Schilde. [O/HIGH S72]
- Penetration senkt Resistenz, Rechenart unbekannt. [U]
- Crit: Chance 25/30/40/50 % bei 34 Units. Multiplikator Standard ×1,5, einzelne ×1,85/×2. [O/HIGH S65,S72]
- Crit über 100 % kann erneut critten (U11), Formel unbekannt. [O/HIGH S72]
- Crit-Damage ist seit RR 20.4.1 ein echter Multiplikator. [O/HIGH S72]
- **Buffs addieren sich**: `BuffMult = 1 + Σ`. +100 % und +10 % ergeben ×2,1. Gleiche Effekte stapeln nicht. [V/HIGH S72]
- Buff-Beispiele: Commander +25 % Physical für 30 s (Cooldown 60 s), Wind Dragon +30 % Magic, Griffin +100 % global permanent. [O/HIGH S72]
- Buff-Ketten (Commander 25→56→95→100 %) erlauben den bekannten "100-%-Loop", gedeckelt bei +100 %. [O/HIGH S72]
- Ability-Cooldown wird nur von Curses (nicht Potential/Trait) beeinflusst. [O/HIGH S72]
- Gegner-Mechaniken (Details: [combat-system.md](combat-system.md#10-gegner-mechaniken-im-kampf)):
  - Shield: jeder Hit entfernt 1 Instanz ohne HP-Schaden.
  - Armored: Full-AoE macht ×0,5.
  - Ice: Fire/Burn ×3.
  - Fire-Gegner: immun gegen Slow/Stun.
  - Regen: Bleed und Wither stoppen die Regeneration.
  - Burst: schnell beim Spawn, zur Basis hin langsamer. [O/HIGH S72]
  - Tank: "leicht reduzierter Schaden" (Wert unbekannt). [O/HIGH S72]

### 2.5 Status-Effekte (Auszug, [combat-system.md](combat-system.md#7-status-effekte-debuffs-auf-gegnern))

| Gruppe | Werte | Etikett |
|---|---|---|
| Stun | ca. 2 s, danach 10–14 s Immunität | [O/HIGH S72] |
| Freeze | Immunität 10 bzw. 12–13 s (Quellenkonflikt) | [O/MEDIUM S72,S67] |
| Slow | 50/65/80 % je Upgrade, 2,5–4 s, danach ca. 4–7 s Sperre | [O/HIGH S67] |
| Knockback | Sperre 30–31 s, Distanz unbekannt | [O/HIGH S72] |
| Stun/Freeze/Timestop/Walkback | stacken nicht (seit Update 8, LEGACY) | [O/HIGH S72] |
| Burn | 30 / 50 / 100 % des Hits über Ticks; stapelt zwischen Units | [O/HIGH S67] |
| Bleed | 25–35 % über Ticks; stoppt Regen komplett | [O/HIGH S67] |
| Poison | 280–300 % über 20–56 Ticks | [O/HIGH S67] |
| Wither | 20 % True, bis 18 Ticks | [O/HIGH S67] |

- DoT pro Treffer = `hitDamage × multiplierPerTick × ticks`, steigt mit Buffs. [O/HIGH S67]
- Tick-Intervall: unbekannt. [U]
- Verteilung (S67): 102 Angriffe mit DoT (Burn 54, Bleed 39, Poison 6, Wither 3), 92 mit Spezialeffekt. [D/HIGH S67]

## 3. In-Match-Ökonomie

Detail: [economy.md](economy.md#1-yen-in-match-währung), [unit-upgrades.md](unit-upgrades.md).

**Kosten und Upgrades**

- Platzierung = Deployment Cost (Stufe 0), Upgrades kosten Yen pro platzierter Instanz. Fehlende Stufenwerte erben den Vorwert. [O/HIGH S65]
- Upgrade-Kostenfaktor je Stufe (Median): Rare ×1,50, Epic ×1,40, Legendary ×1,30, Mythic ×1,29. [D/HIGH S65]
- Σ-Kosten / Platzierung (Median): Rare 16,5, Epic 20,0, Legendary 31,7, Mythic 36,9. [D/HIGH S65]
- Faustformel Mythic: `cost_k ≈ deploy × (1 + 0,38k + 0,07k²)`. [D/MEDIUM S65]
- Grenz-Effizienz fällt monoton (DPS pro Yen, relativ zur Platzierung): erstes Drittel 0,70, mittleres 0,48, letztes 0,39. [D/HIGH S65]
- Ausgebaut liefert eine Unit etwa die Hälfte DPS/¥ ihrer Platzierung (0,49). Ausbau lohnt wegen des Spawn Caps und neuer Fähigkeiten. [D/HIGH S65]
- Challenge "High Cost" ×1,5, "Triple Cost" ×3 auf Platzierung und Upgrade. [O/HIGH S72]

**Verkauf**

- Standard **25 %** von (Deployment + bezahlte Upgrades). 508 von 528 Unit-Seiten, die C.E.O.-Seite nennt 30 % (vermutlich Fehler). [O/CONFIRMED S72]
- 9 Units unverkäuflich (u. a. die Farm-Units Bulby, Weather Girl). [O/HIGH S65]
- Rundung unbekannt. [U]

**Farm-Units (Einkommen am Wave-Ende)**

| Unit (Rarität, Cap) | Yen/Wave Stufe 0 → max | Grenz-ROI | Etikett |
|---|---|---|---|
| C.E.O. (Epic, 3) | 200 → 2.500 | 2,75–4,0 Waves | [D/HIGH S65] |
| Bulby (Legendary, 1) | 250 → 10.000 | 3,0–4,0, letzte Stufe 6,25 | [D/HIGH S65] |
| Weather Girl (Thief) (Mythic, 3, hybrid) | 300 → 3.000 | 3,3–12 Waves | [D/HIGH S65] |

- Nur diese 3 Units haben ein `farm`-Feld. [O/HIGH S65]
- Golden-Trait: +20 % Yen für reine Farms. [O/HIGH S72]
- Sonderfall: Treasure-Thief markiert Gegner, die beim Kill Geld geben. [O/HIGH S72]
- Healer: 3–5 % Base-HP pro Wave (vor Update 9: 25 HP). [O/HIGH S72]

**Offene Lücken (Details: [unknowns.md](unknowns.md#b-fehlende-daten))**

- Start-Yen. [U]
- Kill-Yen, Boss-Yen, Wave-Yen. [U]
- Einziger Indikator: Assassin Contracts (RR) geben 5.000 Yen zum Start und 2.500–5.000 pro Runde. [O/MEDIUM S72]
- Das Wiki unterscheidet Portale mit "normaler" und "Infinite-orientierter" Yen-Verteilung. [O/MEDIUM S72]
- Base-HP-Wert und Leak-Schaden. [U]

## 4. Gacha

Detail: [summoning.md](summoning.md), Rechnung: [mathematics.md](mathematics.md#pity-probability).

### 4.1 Kosten und Banner

| Aspekt | Wert | Etikett |
|---|---|---|
| Einzel-Summon | 50 Gems (VIP 40) oder 1 Ticket (500 Gold) | [O/HIGH S72] |
| Multi-Summon (10er) | nicht belegt | [U] |
| Banner | Standard, Special (stündlicher Refresh, 3 Featured-Mythics), Legacy-Banner (RR, Legacy Gems), Event (Event-Währung) | [O/HIGH S72] |
| Banner-Tiers | 0 (keine Shinies/Secrets), 1 ab Level 5 (Shinies), 2 ab Level 20 (Secrets) | [O/HIGH S72] |
| Luck Potion | ca. ×1,25 auf Epic–Mythic, senkt Pity nicht | [O/MEDIUM S73,S72] |

### 4.2 Raten

| Rarität | Rate | Etikett |
|---|---:|---|
| Rare | 81,9 % (normiert 81,75 %) | [O/HIGH S72] |
| Epic | 16 % | [O/HIGH S72] |
| Legendary | 2 % | [O/HIGH S72] |
| Mythic (Standard) | 0,25 % | [O/HIGH S72] |
| Mythic (Special/Event RR) | 0,5 % | [O/HIGH S72] |
| Mythic (Event LEGACY-Ende) | 1 % | [O/MEDIUM S72] |
| Secret | 1 : 400.000 | [O/MEDIUM S72] |

- Wiki-Summe 100,15 %, also gerundet. Für den Nachbau auf Gewichte mit Summe 100 % normieren. [D/MEDIUM S68]
- Featured im Mythic-Anteil: Center 50 %, beide Seiten je 10 %, Rest gleichverteilt. Das ergibt Center 0,25 %, Seite 0,05 %, ein Unfeatured 0,003125 % (Pool 48). [O/HIGH S72]
- Shiny: 1 % pro Summon (Shiny Hunter 3 %), nur kosmetisch. [V/HIGH S75]

### 4.3 Pity je Version

| Version | Regel | Etikett |
|---|---|---|
| LEGACY Standard | 400 Summons → **irgendein** Mythic, Reset bei jedem Mythic und Refresh | [O/MEDIUM S72,S73] |
| LEGACY Special | keine Mythic-Pity | [O/MEDIUM S72] |
| LEGACY bis RR 20.4 | Legendary-Pity nach 50 | [O/HIGH S72] |
| RR ab 20.4.1 (Special + Legacy) | 400 Summons → **Center-Featured**, Reset bei **jedem** Mythic und stündlichem Refresh, Legendary-Pity entfällt | [O/HIGH S72] |
| Event | LEGACY 100, RR 200 → unbesessener Featured zuerst | [O/HIGH S72] |

Offen: Soft Pity (nicht belegt), Secret-Pity (nur April-Fools-Banner 2025). [U]

### 4.4 Erwartungswerte (alle [D/HIGH S72], Rechnung in [summoning.md](summoning.md#mathematik))

| Fall | Ergebnis |
|---|---|
| RR-Center (p=0,5 %, f=0,5, N=400) | E = 304,9 Summons = 15.245 Gems (VIP 12.196) |
| dto., P(Center in 400 Summons) | 76,76 % (400 Summons garantieren **nicht**) |
| dto., P(Zyklus erreicht Pity) | 13,5 % |
| LEGACY Standard, irgendein Mythic | E = 253,0 = 12.652 Gems; P(Pity greift) 36,8 % |
| Legendary-Pity (p=2 %, N=50) | E = 31,8 Summons |
| Center ohne Pity (LEGACY Special) | E = 400 Summons |
| Side-Featured ohne Pity | E = 2.000 Summons |
| Event-Banner alle Featured (Monte-Carlo, MEDIUM) | RR 505,8 / LEGACY 351,5 Summons |
| Secret 1 : 400.000 | E = 400.000 Summons |

- Für P(Center ≥1) bei n=200/300/600/1.200 gilt: 39,4 % / 52,8 % / 90,0 % / 99,5 %.
- Gem-Einnahmen zum Vergleich: Level-Milestones 10.000 Gems einmalig [O/HIGH S72], Infinite max. 497 Gems/Run [O/HIGH S72].
- DESIGN-Hinweis: Reset nur durch das Ziel ist spielerfreundlicher als die AA-Regel (Reset bei jedem Mythic).

## 5. Progression

### 5.1 Unit-Level

- Level-Cap-Historie: 60 → 70 → 80 → 90 → 100 (LEGACY), 110 mit Limit Break (RR). [O/HIGH S72]
- Damage-Faktor L100 = **9,20406501834430488** × L1. [V/CONFIRMED S04,S72]
- L110 ≈ ×10,95 (+19 % ab L100). [O/MEDIUM S72]
- Kurve zwischen L1 und L100 und XP-Kurve: unbekannt. [U] Kandidaten (linear, exponentiell) in [unit-powerups.md](unit-powerups.md#2-unit-level-und-xp).
- XP-Quellen: Matches, XP-Food (25 bis 3.450 XP je Item, max. 1.000 je Sorte), Fusing. Adept-Trait +50 %. [O/HIGH S68,S72]

### 5.2 Traits ([traits.md](traits.md#trait-system))

| Aspekt | Wert | Etikett |
|---|---|---|
| Trait bei neuer Unit (RR) | 1 %; Doppel-Trait 1 % davon, beim Reroll 0,2 % | [O/MEDIUM S72] |
| Reroll-Kosten | 1 Star Remnant (Rare–Legendary), 5 (Mythic/Secret), oder 1 Reroll Token | [O/HIGH S72] |
| Star Remnant kaufen | 400 Gems (Merchant) | [O/HIGH S72] |
| Pool | 12 Traits, Summe 100,03 % (gerundet) | [D/HIGH S72] |
| Doppel-Traits | Boni addieren sich | [O/MEDIUM S72] |

Trait-Pool (Chance → Wirkung), alle [O/HIGH S72]:

| Trait | Chance | Wirkung |
|---|---:|---|
| Superior I–III | 29,97 % | +10 / 12,5 / 15 % Damage |
| Nimble I–III | 24,98 % | SPA −5 / −7,5 / −12 % |
| Range I–III | 24,98 % | Range +10 / 12,5 / 15 % |
| Adept | 9,99 % | +50 % Unit-XP |
| Culling | 5 % | +20 % gegen Gegner ≤ 30 % HP |
| Sniper | 2,5 % | Range +25 % |
| Godspeed | 1 % | SPA −20 % |
| Reaper | 0,8 % | +15 % Damage, ×1,25 gegen Bosse |
| Celestial | 0,36 % | +10 % Damage/Range, +20 % als True Damage |
| Divine | 0,2 % | +20 % Damage, SPA −10 %, Range +20 % |
| Golden | 0,15 % | +30 % Damage, +20 % Yen (Farm) |
| Unique | 0,1 % | ×4 Damage, SPA −10 %, Range +10 %, max. 1 Platzierung |

- SPA-Boni wirken als Division: DPS-Faktor `1/(1+x)` (Godspeed 1,25, Divine 1,333). [D/HIGH S72]
- E[Rerolls] = 1/p: Godspeed 100, Divine 500, Unique 1.000. [D/HIGH S72]
- Trait-Tier-Verteilung I/II/III und Trait-Pity: nicht belegt. [U]

### 5.3 Stat Potential, Evolution, Limit Break

- **Potential** (seit Update 11): je Unit-Instanz ein Roll für Damage −10…≥+20 %, SPA +10…≤−10 %, Range −10…≥+10 %. Ränge C- bis SSS. [O/HIGH S72]
- **Worthiness** +1 % je 100 Takedowns. Max. LEGACY 100 %, RR 400 %, max. 100 % Verbrauch je Reroll. [O/HIGH S72]
- Roll-Verteilung abhängig von Worthiness: unbekannt. [U]
- Stat-Transfer: 5.000 Gold je Stat, 50 % Erfolg. [O/HIGH S72]
- **Evolution**: 219 Rezepte (179× Mythic→Mythic, 29× Secret→Secret, 6× Legendary→Mythic). [O/HIGH S65]
- Evolution: Basis-Unit wird verbraucht, Damage je Stufe meist +30 bis +50 %. [O/HIGH S65]
- Evolution: Potential wird immer besser, Trait wird übernommen (Legendary→Mythic belegt). [O/HIGH S72]
- Evolution: Rezept = Star Fruits und/oder Spezialitems, teils Takedowns (meist 5.000 oder 7.500), teils Extra-Kopien. [O/HIGH S65]
- Damage-Faktor auf Maximalstufe (Median): ×2,33, weil Evolutionen mehr Stufen haben. [D/HIGH S65]
- Details: [evolution.md](evolution.md#mechanik), [evolution.md](evolution.md#takedowns).
- **Limit Break** (RR): nur Mythic/Secret ab Level 100, kostet 1 Divine Wish plus Opfer-Units im Wert von 12 Punkten. [O/HIGH S72]
- Limit Break: Level-Cap +10. Jede ausgerüstete LB-Unit gibt dem Team +5 % Damage (max. +30 %). [O/HIGH S72]
- Details: [unit-powerups.md](unit-powerups.md#3-limit-break).

### 5.4 Curses, Relics

- **Curses:** ein zufälliger Stat +2,5…13 %, ein anderer −2,5…13 %. Nicht entfernbar. [O/HIGH S72] Details: [unit-powerups.md](unit-powerups.md#4-curses).
- **Relics:** nur auf Legendary und höher ausrüstbar. Stats: %DMG je Typ, PEN, PWR, Crit. Crafting beim NPC. [O/HIGH S72] Details: [unit-powerups.md](unit-powerups.md#5-relics).

### 5.5 Währungen

- **Gems:** Hauptwährung für Summon. **Gold:** Shops, Crafting, Inventar. **Yen:** nur im Match. [O/HIGH S72]
- Daneben Event-Währungen und Ressourcen (Star Remnants, Reroll Tokens, Stat Cubes, Tickets). [O/HIGH S72]

## 6. Modi

Detail: [game-modes.md](game-modes.md).

| Modus | Kern | Etikett |
|---|---|---|
| [Story](game-modes.md#story) | 22 Welten × 6 Acts, Boss je Act, sequenzielle Freischaltung | [O/HIGH S72] |
| [Infinite](game-modes.md#infinite) | endlos, nur Hard, Bosse früherer Acts alle 10 Waves; Gems W6 18, W7–14 je 3, W15–105 je 5, max. 497 | [O/HIGH S72] |
| Daily Infinite | Wave-Ziele 90/180/330 Gems (W10/25/50), seit 20.4.1 Ziel 40 statt 50 Waves | [O/HIGH S72] |
| [Legend Stages](game-modes.md#legend-stages) | frei nach Act 6, 3 oder 6 Acts, Evolutions-/Relic-Material, Gegner-Resistenzen | [O/HIGH S72] |
| [Challenges](game-modes.md#challenges) | Story-Act mit Modifikator, Rotation alle 30 min | [O/HIGH S72] |
| Raids | LEGACY: 20 Waves, eigene Währung und Shop, garantierte Unit nach N Clears ([raids.md](raids.md)) | [O/MEDIUM S73] |
| Portale | Drops mit Modifikatoren; Secret Portal: Host 100 %, Mitspieler 5 % auf Secret ([portals.md](portals.md)) | [O/HIGH S72] |
| [Dungeons](game-modes.md#dungeons) | RR: zufälliger Run, 20 gewonnene Matches, 3 Optionen je Match, Curses/Blessings | [O/HIGH S72] |
| [Infinity Castle](game-modes.md#infinity-castle-seit-update-6) | Raumturm, 150 Gems je Raum, Saison-Rang | [O/HIGH S72] |
| [Tournaments](game-modes.md#tournaments-seit-update-10) | wöchentlich, "Most DMG" in 20 min, zufällige Brackets, Perzentil-Belohnung | [O/HIGH S72] |
| [Contracts](game-modes.md#contracts) | RR: Boss-Kill, 16 Tiers, Matchmaking | [O/HIGH S72] |
| [Events](game-modes.md#events-historisch) | RR-Events 30 oder 50 Waves mit Segen/Fluch-Wahl alle paar Waves | [O/HIGH S72] |

Challenge-Modifikatoren (LEGACY-Zahlen): Tank (HP ×1,25, Damage ×0,75), Fast (Speed ×1,5), Regen (1 % maxHP/s), Steel-Plated (HP ×3, +20 Schilde, nur Portal). [O/MEDIUM S73,S72]

## 7. Wichtigste Formeln (kompakt)

Ausführlich: [mathematics.md](mathematics.md). Die Reihenfolge der Faktoren ist nur RECONSTRUCTED/LOW, die Einzelfaktoren sind belegt.

```text
DPS        = Damage / SPA                         [D/CONFIRMED S35]      hitDamage = Damage / hits
FinalHit   = BaseHit × L(level) × (1+pot.dmg) × TraitMult × (1+curse) × RelicMult
             × LBMult × BuffMult × CritMult × DebuffMult × TypeMult × EnemyMult
                                                [R/LOW S72]  (Reihenfolge), Einzelfaktoren [O/HIGH S72]
BuffMult   = 1 + Σ activeBuffs                    [V/HIGH S72]           additiv, gleiche Effekte stapeln nicht
TypeMult   = (1 + Σ weakness) × 100/(100+R)       [O/HIGH S72]           True Damage: 1
LBMult     = 1 + min(0,30; 0,05 × LB-Units)       [O/HIGH S72]
CritFaktor = 1 + c × (m − 1)                      [D/HIGH S65]           50 %/×1,5 → 1,25
SPA_eff    = SPA × (1+pot) × (1+trait) × (1+curse) [R/MEDIUM S72]       DPS-Faktor 1/(1+x)
Range_eff  = Range × (1+pot) × (1+trait) × (1+curse) × buff × challenge   [R/MEDIUM S72]
DoT        = FinalHit × multiplierPerTick × ticks [O/HIGH S67]
Shield     : jeder Hit −1 Instanz; Angriffe = ceil((shield + ceil(HP/hit)) / hits)   [O/HIGH S72]
Sell       = 0,25 × (deploy + Σ bezahlte Upgrades)  [O/CONFIRMED S72]
FarmROI_k  = cost_k / (farm_k − farm_{k−1})       [D/HIGH S65]
Summon     : P(≥1 in n) = 1 − (1−p)^n ; E = 1/p   [D/HIGH S72]
Pity (Reset bei jedem Mythic, Ziel durch Pity): L = (1−q^N)/p ; s = f(1−q^(N−1)) + q^(N−1) ; E = L/s   [D/HIGH S72]
Trait      : E[Rerolls] = 1/p_t ; E[Remnants] = cost/p_t                   [D/HIGH S72]
Infinite   : Gems(W) = Σ g(w), Max 497         [O/HIGH S72]
```

Konfigurierbare Pipeline: [technical-reconstruction.md](technical-reconstruction.md#damage-pipeline-konfigurierbar). Ein Beispiel-Match steht in [simulation.md](simulation.md).

## 8. Typische Zahlenbereiche je Rarity

Quelle: `data/units.json` (S65, RR-Stand), nur `kind = unit`, Beschwörungen ausgenommen. Zeilen zeigen **Median (P25–P75)**. DPS = Damage/SPA ohne AoE, DoT, Crit. [D/HIGH S65] Weitere Statistik: [units.md](units.md#raritäten-und-statistik).

| Rarity (n) | Platzierung ¥ | Σ-Kosten bis Max ¥ | Upgrades (Median) | Spawn Cap (häufigster) | DPS Stufe 0 | DPS Max |
|---|---|---|---:|---|---|---|
| Rare (20) | 400 (350–400) | 6.025 (5.400–6.600) | 5 | 6 | 1,5 (1,0–3,8) | 9,1 (7–21,7) |
| Epic (19) | 525 (525–550) | 10.425 (10.000–11.550) | 5 | 5 | 2,3 (1,8–3,4) | 25,4 (17,9–30) |
| Legendary (35) | 850 (800–900) | 25.650 (21.200–32.350) | 7 | 5 | 8,5 (4,2–12,9) | 88,9 (57–145) |
| Mythic (381) | 1.350 (1.300–1.500) | 50.500 (36.350–64.050) | 8 | 4 | 56 (33–89) | 833 (500–1.563) |
| Secret (73) | 1.600 (1.350–2.000) | 59.000 (43.000–96.400) | 8 | 3 | 88 (38–140) | 1.181 (600–2.804) |
| Exclusive (22) | 1.250 (1.000–1.400) | 41.525 (35.800–48.750) | 8 | 5 | 57 (36–80) | 854 (600–1.000) |

| Rarity | Range Stufe 0 | Range Max | SPA Stufe 0 | SPA Max | Σ-Kosten/Platzierung |
|---|---|---|---|---|---:|
| Rare | 10 (6–15) | 15 (12–22) | 4 (4–5) | 4 (3–5) | 16,5 |
| Epic | 15 (10–15) | 22 (15–25) | 5 (4–5) | 4 (3,5–5) | 20,0 |
| Legendary | 15 (12–15) | 24 (18,5–27) | 7 (6–8) | 6 (5–7) | 31,7 |
| Mythic | 20 (17–22) | 30 (27–35) | 7 (7–8) | 7 (6–9) | 36,9 |
| Secret | 20 (17–23) | 30 (27–35) | 7 (6,5–7,5) | 7 (6–8) | 33,1 |
| Exclusive | 16 (15–18) | 30 (25–32) | 7 (7–7) | 7 (5,5–8) | 32,5 |

- Platzierungs-Extremwerte: 250 bis 112.150 ¥ (Mythic-Ausreißer). [D/HIGH S65]
- End-DPS-Faktor je Rarity (Basis-Units mit ≥3 Upgrades): Rare ×7,0, Epic ×10,0, Legendary ×14,1, Mythic ×13,7. Damage ×6,0 / ×8,0 / ×11,4 / ×12,6. [D/HIGH S65]
- Range wächst auf Max um ×1,33 (Rare) bis ×1,73 (Exclusive), SPA sinkt um höchstens 20 %. [D/HIGH S65]
- Evolution: Basiswerte +10 bis +150 %, häufig +30/+40/+50 %. [D/HIGH S65]
- Platzierungsarten: ground/hill/hybrid, Mythic 308/53/20, Secret 66/1/6. [D/HIGH S65]
- Hinweis zur Vergleichbarkeit: Mythic ist stark gestreut (Rollen wie Farm, Support, Summoner), Median allein täuscht. DESIGN: Zielwerte pro Rarity nur als Korridor nutzen.

## 9. Offene Lücken (Runde 2 soll sie aus anderen Spielen schließen)

AA dokumentiert diese Größen **nicht**. Für Runde 2 gilt: aus vergleichbaren Tower-Defense-Spielen (Bloons TD, Kingdom Rush, andere Roblox-TDs, TD-Wikis) Kurven ableiten und als DESIGN markieren. Die bisherigen DESIGN-Defaults stehen in [technical-reconstruction.md](technical-reconstruction.md#design-defaults-und-belegte-aa-werte).

| Lücke | Stand | Etikett |
|---|---|---|
| Start-Yen, Kill-Yen, Boss-Yen, Wave-Yen | nur Contracts-Indiz (5.000 Start, 2.500–5.000/Runde) | [U] |
| Gegner-HP, Speed, Reward je Typ | nur drei LEGACY-Raid-Boss-HP (W20: 555.658 / 388.960 / 666.952) | [O/MEDIUM S73] |
| HP-Kurve über Waves, Hard-Multiplikator, Party-Scaling | "each wave progressively harder", Zahl fehlt | [U] |
| Wave-Zusammensetzung, Spawn-Abstände, Wave-Anzahl je Act | nur Bosse je Welt/Act, Gegner-Debüts (z. B. Wave 10/15) | [U] |
| Wave-Timer-Dauer, Skip | Timer existiert, Wert und Skip unbelegt | [U] |
| Base HP, Leak-Schaden | Base-HP skaliert seit Update 9, Wert fehlt | [U] |
| Targeting-Modi über First/Strongest hinaus | nicht belegt | [U] |
| Level-Kurve L(2..99), Spieler- und Unit-XP-Kurve | nur Anker L1 und L100 | [U] |
| Reihenfolge der Damage-Faktoren, Penetration, Crit×DoT, Doppel-Crit | nur Einzelfaktoren | [R/LOW S72] |
| Tank-, Ice-, Fire-Reduktion | qualitativ | [U] |
| DoT-Tick-Intervall, Knockback-Distanz, Windup/Hit-Timing | fehlt | [U] |
| Potential-Verteilung, Trait-Tier-Verteilung, Curse-Verteilung | nur Bereiche | [U] |
| Multi-Summon, Gems → Legacy-Gems-Kurs, Summons pro Stunde | fehlt | [U] |
| Map-Geometrie, Platzierungsflächen | nur Laufzeiten 8–36 s (Median 20 s) | [O/MEDIUM S72] |
| Raid-/Party-Größen, Level-Gates für Modi | fehlt | [U] |

Weitere Konflikte (Freeze-/Slow-Cooldowns, Unconscious-Dauer, Dismembered 20/25 %, Sunshine-Skalierung): [unknowns.md](unknowns.md#b-fehlende-daten) und [combat-system.md](combat-system.md#7-status-effekte-debuffs-auf-gegnern).

Pflichtlektüre für den Nachbau: [technical-reconstruction.md](technical-reconstruction.md) (Architektur, Datenmodell), [mathematics.md](mathematics.md) (Formeln), [waves.md](waves.md#infinite-generator-design--kein-aa-wert) (DESIGN-Generator für Infinite).
