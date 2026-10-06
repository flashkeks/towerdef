# Anime Vanguards - Match-Ökonomie (Yen)

Tags: `Wert [Herkunft/Sicherheit Quelle]`, Quellen in [sources.md](sources.md). Meta-Währungen (Gems, Gold, Rerolls) stehen in [meta.md](meta.md).

**Ehrliche Lücken vorab:** Startgeld je Modus, Basis-Einkommen je Wave und Verkaufsanteil stehen weder im Datenmodul noch in den gelesenen Wiki-Seiten. Alles Folgende ist, was belegt ist, plus Rückrechnungen über Modifier-Texte.

## 1. Startgeld

| Modus / Situation | Wert | Tag |
|---|---|---|
| Story, Infinite, Legend (Standard) | UNKNOWN (drei Versuche: Modul-Grep "yen", Gamemodes-/Story-/FAQ-Seiten, Websuche) | U/UNKNOWN |
| Dungeon-Modifier "High Class" | startet mit 10 000 Yen und +40 % Einkommen | O/HIGH AV-S6 |
| Event-Modus "Zombies"/Limited | "enter with absolutely nothing", Einheiten werden im Modus geliehen | O/LOW AV-S23 |
| Elemental Tower, Skill "Income Surge" | Maxen einer Farm gibt allen Spielern sofort 10 000 Yen (Farm danach nicht mehr verkaufbar) | O/MEDIUM AV-S18 |
| Elemental Tower, Skill "Freebie" | erste Nicht-Farm-Einheit gratis | O/MEDIUM AV-S18 |
| "Tyrant Arrives" (Dungeon-Karte) | alle Platzierungen und Upgrades kostenlos, nur Slot 1 nutzbar, Slot 1 bekommt Monarch | O/HIGH AV-S6 |

## 2. Einkommen

| Quelle | Wert | Tag |
|---|---|---|
| Je Kill (Feld `Yen` im Gegnermodul) | normale Gegner: 20 / 25 / 30 / 40 / 150 je nach Stage; Bosse 150 (Ausnahmen Namak: Guldy, Recroom, Jiece, Butter je 62.5; Raid "SBR" 40). Ob dies der tatsächliche Kill-Ertrag ist, ist nicht belegt (viele Grunts einer Stage tragen identisch 150) | O/LOW AV-S5 |
| Je Wave | "Each wave, you earn Yen from Player ..." (Satz abgeschnitten, Update-6.0-Log); Betrag UNKNOWN | O/LOW AV-S20 |
| Wave-Einkommen Skalierung | "Yen gain of Infinite Mode" gilt auch für Elemental Towers, Zahl UNKNOWN | O/LOW AV-S18 |
| Passiv | keines belegt; Einkommen = Wave-Bonus + Kills + Farm-Einheiten | R/LOW (aus Modifier-Texten "Yen income from waves and Farm units") AV-S6 |
| Modifier "Money Surge" | +40 % Yen aus Wave-Abschluss und Farm-Einheiten | O/HIGH AV-S6 |
| Modifier "King's Burden" | -40 % Yen aus Waves und Farms, alle Einheiten erhalten Monarch | O/HIGH AV-S6 |
| Modifier "High Class" | +40 % jedes Einkommens (plus Startgeld 10 000) | O/HIGH AV-S6 |
| Skill "Money Money" (Elemental Towers) | +30 % aller Einkommensquellen | O/MEDIUM AV-S18 |
| Status "Wanted" auf Gegner | +30 % Yen beim Kill | O/HIGH AV-S11 |
| Trait Fortune | Farm-Einheiten +20 % Einkommen; andere Einheiten -10 % Upgrade-Kosten | O/HIGH AV-S8 |
| Einheit mit Kill-Bonus | Dämonen von "The Falcon (of Light)" geben 100 Yen bei Tod | O/MEDIUM AV-S3 |

Wave-Ablauf (Update 6.0): ein Gegner alle 0.2 s mit maximaler Warteschlange; In-Game-Timer neben der Wave; Waves werden sofort beendet, sobald alle Gegner tot sind (Auto-Skip, im Infinite ab 2025-12-08 erzwungen) [O/MEDIUM AV-S20, AV-S16, AV-S19].

## 3. Farm-Einheiten

| Einheit | Rarity | Platzierung / Limit | Upgrades | Verhalten | Tag |
|---|---|---|---|---|---|
| Sprintwagon | UNKNOWN (Skins Slickwagon Secret, Floatie/Zombie Mythic) | 550 (Wiki "Upgrade 0") / UNKNOWN | 1050, 1800, 2550, 3050 (Summe 8450 nach Platzierung, R: Stufe-0-Kosten = Platzierung) | verdient pro Wave Yen = angezeigte Yen-Zahl; Zahl UNKNOWN. Erste Farm im Spiel; wird mit Fortune-Trait +20 % | O/MEDIUM AV-S17 |
| Tempest Pirate | Mythic | 550 / 1 | Stufen 1100, 3150 (Summe 4800 gesamt) | Basiseinheit; Passive Conduit (Spark +30 %) | O/HIGH AV-S3 |
| Tempest Pirate (Navigator) | Mythic, evolved | 550 / 1 | 1100, 3150, 5400, 7650, 9150 (Summe 27 000 gesamt) | spawnt am Wave-Ende eine Kiste mit 10 % des Unit-Yen (max. 1 Kiste), stunnt Wanted-Gegner 2 s; Range 20 bis 35 | O/HIGH AV-S3 |
| Takaroda | Farm | UNKNOWN | UNKNOWN | Modul enthält eine Passive "Converts Takaroda Bucks into yen" (Einheit nicht eindeutig zugeordnet) | O/LOW AV-S3, AV-S11 |
| Skill "Cost Effective" | - | - | - | Upgraden einer Farm gibt eine freie Upgrade-Gutschrift (max. 5 gespeichert) | O/MEDIUM AV-S18 |

Rendite-Rechnung (Yen je Wave pro investiertem Yen): UNKNOWN, da Yen je Wave nicht belegt.

## 4. Verkaufswert

| Aspekt | Wert | Tag |
|---|---|---|
| Verkaufsanteil | UNKNOWN (drei Versuche) | U/UNKNOWN |
| Hinweis | Skill "Rebate": Verkauf gibt +40 % des Verkaufswerts zusätzlich, bedeutet: Basisrückgabe < 100 % | O/LOW AV-S18 |
| Verkaufen/Löschen als Mechanik | Verbündeten-Verkauf löst Effekte aus (Lich King-Geist, Demon Leader-Bleed) | O/HIGH AV-S3 |

## 5. Kostenkurve der Upgrades

Ableitung: `total_cost = deployment_cost + Summe(Upgradekosten)` (an 8 Einheiten geprüft, stimmt exakt) [D/HIGH aus AV-S3]. Pro Spiel-Platzierung gilt `placement_total_cost = total_cost x place_limit` [D/HIGH AV-S3].

### 5.1 Billige Einheit (Rare), Top Chef [Limit 5]

| Stufe | 0 (Platz.) | 1 | 2 | 3 | 4 (Max) |
|---|---|---|---|---|---|
| Kosten | 400 | 400 | 700 | 900 | 1350 |
| Kumuliert | 400 | 800 | 1500 | 2400 | 3750 |
| Schaden | 18 | 42 | 65 | 76 | 95 |
| SPA (s) | 6 | 5 | 4 | 4 | 3 |
| Range | 15 | 16 | 18 | 20 | 22 |

Tag: O/HIGH AV-S3. Max-Upgrade-Gesamt 3750 = 9.4x Platzierung; alle 5 Platzierungen 18 750.

### 5.2 Mittlere Einheit (Mythic), Cha-In (Blade Dancer) [Limit 5]

| Stufe | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kosten | 1600 | 1200 | 2150 | 3000 | 3750 | 4200 | 5600 | 6000 | 6600 | 7350 | 10450 |

Gesamt 51 900 (32.4x Platzierung); Schaden 420 bis 1900, SPA 7 bis 6.5, Range 23 bis 42. Tag: O/HIGH AV-S3.

### 5.3 Top-Einheiten

| Einheit | Rarity | Platzierung | Upgrade-Kosten (Stufe 1 ... n) | Gesamt je Platzierung | Limit | Tag |
|---|---|---|---|---|---|---|
| Armored Mage (Requip) | Secret | 1000 | 1600, 3200, 5400, 7200, 8500, 9600, 11800, 12400, 13600, 14000, 15200, 17000 | 120 500 | 3 | O/HIGH AV-S3 |
| Lich King (Ruler) | Event-Rarity "LichKing" | 1000 | 5200, 7400, 9400, 11000, 12500, 14000, 16200, 17500, 19300, 22000, 24500, 26500, 32000 | 218 500 | 1 | O/HIGH AV-S3 |
| Ice Queen (Release) | Event-Rarity "IceQueen" | 10 000 | 2500, 5200, 6500, 8200, 10500, 12000, 13500, 15000, 16200, 17400, 18600, 19800, 21000, 22200, 25000 | 223 600 | 3 | O/HIGH AV-S3 |
| Vogita Super (Awakened) | Mythic evolved | 1200 | 1650, 2300, 2750, 4200, 5000, 6150, 7000, 7500, 8000, 8500, 10000 | 64 250 | 4 | O/HIGH AV-S3 |

### 5.4 Kurvenform und Spannen (aus 224 Datensätzen)

| Rarity | Platzierung min / Median / max | Gesamtkosten je Platzierung min / Median / max | Limit | Tag |
|---|---|---|---|---|
| Rare (n=2) | 300 / 350 / 400 | 2500 / 3125 / 3750 | 5-6 | D/MEDIUM AV-S3 (nur 2 Rare im Modul) |
| Legendary (n=2) | 850 | 15 700 / 16 525 / 17 350 | 4 | D/MEDIUM AV-S3 |
| Exclusive (n=62) | 600 / 1500 / 4000 | 6000 / 75 700 / 136 400 | 1-4 | D/HIGH AV-S3 |
| Mythic (n=73) | 600 / 1300 / 3200 | 1800 / 63 800 / 140 300 | 1-5 | D/HIGH AV-S3 |
| Secret (n=47) | 1000 / 2000 / 3500 | 1000 / 94 000 / 193 300 | 1-4 | D/HIGH AV-S3 |

Beobachtungen:
- Stufe-1-Upgrade kostet ca. 0.6x bis 1.5x der Platzierung (Top Chef 1.0x, Cha-In 0.75x, Armored Mage 1.6x), die letzte Stufe kostet 6.5x (Cha-In) bis 17x (Armored Mage) der Platzierung [D/MEDIUM aus AV-S3].
- Kosten steigen annähernd linear mit leichtem Sprung bei der letzten Stufe (Cha-In 7350 auf 10450) [D/MEDIUM AV-S3].
- Schaden wächst viel stärker als Kosten: Armored Mage Schaden x24 (2500 auf 60 000) bei Kostenfaktor 120x der Platzierung; Rare Top Chef x5.3 bei 9.4x [D/MEDIUM AV-S3].
- Rare/Legendary-Daten im Modul stammen vermutlich vom Entwicklungsstand früher Updates (Schaden 18-480 gegenüber 400-60 000 bei Mythic+); ob Rare/Epic noch zur Endgame-Skalierung beitragen UNKNOWN (Epic-Einheiten fehlen im Modul) [R/LOW].
- Kostenmodifikatoren: Fortune -10 %, Kostenreduzierer-Einheiten, Elemental-Tower-Skill "Potential Man" -20 % Upgradekosten, "Max Output" x2, Elastic Captain (Pirate) -2 % Pirate-Kosten je Upgrade [O/HIGH AV-S8, AV-S11, AV-S18, AV-S3].

## 6. Belohnungs-Ökonomie (außerhalb des Matches, zur Einordnung)

Siehe [meta.md](meta.md) Abschnitt Währungen. Kernzahl: Story-Clear = 80 Gems, 100 Gold, 3-6 Evolutionsmaterial; Erstclear 100 Gems (Normal) / 180 (Nightmare) [O/HIGH AV-S13].
