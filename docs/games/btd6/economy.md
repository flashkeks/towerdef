# Ökonomie BTD6

Kennzeichnung `[Herkunft/Sicherheit Quelle]`; Quellen in [sources.md](sources.md). Preise sind Medium-Preise, sofern nicht anders genannt. Rundendaten: [data/rounds.json](data/rounds.json), Details in [enemies-waves.md](enemies-waves.md).

## 1. Startgeld, Leben, Rundenbereich je Modus

| Modus | Startgeld | Startrunde → Zielrunde | Leben | Kostenfaktor | Quelle |
|---|---|---|---|---|---|
| Easy | 650 [O/HIGH BTD-S11] | 1 → 40 [O/HIGH BTD-S11] | 200 [O/HIGH BTD-S11] | 0,85 | BTD-S11 |
| Medium | 650 [O/HIGH BTD-S3] | 1 → 60 [O/HIGH BTD-S2] | 150 [O/HIGH BTD-S11] | 1,00 | BTD-S3 |
| Hard | 650 [O/HIGH BTD-S10] | 3 → 80 [O/HIGH BTD-S10] | 100 [O/HIGH BTD-S10] | 1,08 | BTD-S10 |
| Impoppable | 650 [O/HIGH BTD-S3] | 6 → 100 [O/HIGH BTD-S12] | 1, keine Lebensgewinne [O/HIGH BTD-S12] | 1,20 (relativ zu Medium; Wiki: +11,1 % ggü. Hard) | BTD-S12 |
| C.H.I.M.P.S. | 650 [O/MEDIUM BTD-S3] | 6 → 100 [O/HIGH BTD-S10] | 1 (Impoppable-Basis) [O/MEDIUM BTD-S10] | wie Impoppable [O/MEDIUM BTD-S10] | BTD-S10 |
| Deflation | 20000, kein weiteres Einkommen [O/HIGH BTD-S11] | 31 → 60 [O/HIGH BTD-S11] | wie Easy (erbt Easy-Modifier) [O/HIGH BTD-S11] | 0,85 | BTD-S11 |
| Half Cash | 325 statt 650 (425 statt 850 mit MK „More Cash“); alles Einkommen halbiert [O/HIGH BTD-S10] | wie Basismodus (Hard) | – | – | BTD-S10 |
| Double Cash | doppeltes Startgeld und doppelter Pop-Cash [O/MEDIUM BTD-S3] | – | – | – | BTD-S3 |

- Monkey-Knowledge „More Cash“: +200 Startgeld [O/HIGH BTD-S3].
- Kostenfaktoren: die Wiki-Infoboxen zeigen für jeden Tower Easy/Medium/Hard/Impoppable (z. B. Dart 170/200/215/240, Ninja 340/400/430/480, Heli 1360/1600/1730/1920) [O/HIGH BTD-S15]. Das passt auf 0,85 / 1,0 / 1,08 / 1,2 mit Rundung auf 5 [D: 200×1,08=216 → 215; 400×1,2=480; 1600×1,08=1728 → 1730]. Impoppable stapelt seit v37.1 nicht mehr auf Hard [O/HIGH BTD-S12].
- Easy: die MOAB in Runde 40 hat nur 2/3 HP [O/HIGH BTD-S2].
- Hard startet in Runde 3, verliert also 258 Cash (Runden 1+2 komplett) [D: 121+137 aus BTD-S3].

## 2. Einkommensquellen

| Quelle | Regel | Quelle |
|---|---|---|
| Pop-Cash | 1 pro zerstörtem Layer (Rot=1, Blau=2 … gemäß Layerbaum); MOAB-Klasse zahlt 1 für die äußere Hülle, den Rest bringen die Kinder (Keramik) [O/HIGH BTD-S3] | BTD-S3 |
| Rundenbonus | 100 + Rundennummer (R1 = 101), nicht besteuert [O/HIGH BTD-S3] | BTD-S3 |
| Farmen/Support | siehe Abschnitt 4 | BTD-S14 |
| Powers | Cash Drop 2500; „Thrive“ +25 % Einkommen für zwei Runden [O/HIGH BTD-S3] | BTD-S3 |
| Monkey Town (Dorf) | +50 % Pop-Cash für Bloons, die in Dorf-Reichweite von Türmen gepoppt werden; +60 % mit MK „Inland Revenue Streams“ [O/HIGH BTD-S3] | BTD-S3 |
| Sonstiges | Engineer Bloon Trap, Sniper Supply Drop, Heli Support Chinook, Druid Jungle's Bounty, Buccaneer Merchantman/Favored Trades, Benjamin, Rare Quincy Action Figure [O/HIGH BTD-S3] | BTD-S3 |
| C.H.I.M.P.S. | nur Pop-Cash, alle anderen Einkommen deaktiviert [O/HIGH BTD-S3] | BTD-S3 |
| Cap | Geld praktisch unbegrenzt (32-bit-Maximum üblich) [O/LOW BTD-S3] | BTD-S3 |

### Pop-Cash je Bloon (Vollbaum)

| Bloon | bis R80 | ab R81 (Freeplay-Regeln) |
|---|---:|---:|
| Rot / Blau / Grün / Gelb / Pink | 1 / 2 / 3 / 4 / 5 | gleich |
| Schwarz, Weiß, Lila | 11 | 6 |
| Blei, Zebra | 23 | 7 |
| Regenbogen | 47 | 8 |
| Keramik | 95 | 95 (Super-Keramik zahlt wie Vollbaum) |
| MOAB / DDT | 381 | 381 |
| BFB | 1525 | 1525 |
| ZOMG | 6101 | 6101 |
| BAD | 13346 | 13346 |

[O/HIGH BTD-S3; Gegenprobe D: alle 100 Pop-Cash-Werte der Wiki-Tabelle (Runden 1–100) lassen sich aus Rundenzusammensetzung × diesen Werten × Steuer exakt reproduzieren]

### Einkommens-Steuer (Cash-per-Pop-Faktor)

| Runden | Faktor |
|---|---:|
| 1–50 | 100 % |
| 51–60 | 50 % |
| 61–85 | 20 % |
| 86–100 | 10 % |
| 101–120 | 5 % (war 2 % bis v32, 5 % ab v33, kurz 8 % in v53, wieder 5 % in v54) |
| 121–140 | 4 % (zwischenzeitlich 2 % / 5 %) |
| 141+ | 2 % |

[O/HIGH BTD-S2, BTD-S3, BTD-S4]. Die Stufen 101–140 haben sich mehrfach geändert (BTD-S2 Version History); für ein TD-Design relevant ist nur: Steuer fällt in Stufen auf 2 %.

### Kumulierte Einnahmen (alle Bloons gepoppt, inkl. Rundenbonus, mit Steuer)

| bis Runde | kumuliert | Quelle |
|---:|---:|---|
| 10 | 1793 | [O/HIGH BTD-S3] |
| 20 | 4218 | [O/HIGH BTD-S3] |
| 30 | 7633 | [O/HIGH BTD-S3] |
| 40 | 16856 | [O/HIGH BTD-S3] (Easy-Ende) |
| 50 | 37660 | [O/HIGH BTD-S3] |
| 60 | 54484 | [O/HIGH BTD-S3] (Medium-Ende) |
| 80 | 97603 | [O/HIGH BTD-S3] (Hard-Ende; abzüglich 258 wegen Start in R3 ≈ 97345 [D]) |
| 100 | 178994 | [O/HIGH BTD-S3] (Impoppable-Ende; ab R6 ≈ 178259 [D]) |

Ableitungen [D, aus data/rounds.json]: Pop-Cash R1–50 = 31385, R51–60 = 15270, R61–85 = 63336, R86–100 = 53954; Rundenbonus R1–100 = 15050. In C.H.I.M.P.S. (R6–100) stehen damit nur ca. 163725 Pop-Cash plus 650 Start zur Verfügung [D]. Das Wiki merkt dazu an, dass Paragons und teure T5 (True Sun God, Legend of the Night) in CHIMPS nicht bezahlbar sind [O/HIGH BTD-S3].

Typische Pro-Runde-Größen [D]: Runde 1: 121, Runde 10: 314, Runde 20: 186, Runde 40: 521, Runde 49: 4758 (Spitze), Runde 60: 923, Runde 98: 9653. Streuung ist sehr hoch, weil Pop-Cash an der Rundenzusammensetzung hängt, nicht an der Rundennummer.

## 3. Verkaufswert

| Regel | Wert | Quelle |
|---|---|---|
| Standard-Rückgabe | 70 % der gesamten Ausgaben (Tower + Upgrades); Rundung nach der Multiplikation auf ganze Zahl aufwärts [O/HIGH BTD-S9] | BTD-S9 |
| Beispiel | Sniper 1-0-0 auf Easy: 300+295 = 595 → 420 Rückgabe [O/HIGH BTD-S9; D: 595×0,7 = 416,5 – das Wiki nennt 420, es rundet die Zwischenpreise auf 5 bzw. rechnet je Stück; genaue Rundung UNKNOWN] | BTD-S9 |
| Verkaufsbonus | +5 % MK „Better Sell Deals“; +4 % je Favored-Trades-Buccaneer in Reichweite (stapelt bis 3×); +10 % Banana Salvage (nur Farm); +2 % MK „Flat Pack Buildings“ (nur Dorf/Farm) [O/HIGH BTD-S9] | BTD-S9 |
| Caps | Rate weich bei 95 %; Rückgabe hart bei 10 000 000 [O/HIGH BTD-S9] | BTD-S9 |
| Ausnahmen | Rare Quincy Action Figure: Wert steigt pro Runde (95 % des Basiswerts, 100 % des Zuwachses); Boss Lych senkt die Rückgabe aller Tower um 35 Prozentpunkte [O/HIGH BTD-S9] | BTD-S9 |
| Ohne Geld | Sentries, Powers, Spezial-Agenten haben keinen Wert [O/HIGH BTD-S9]; in CHIMPS ist Verkaufen verboten (Ausnahmen Champion Sentry, Creepy Idol, Marine) [O/HIGH BTD-S9] | BTD-S9 |
| Opfern | Tower, die andere Tower absorbieren (Sacrifice), übernehmen deren Gesamtwert [O/HIGH BTD-S9] | BTD-S9 |

## 4. Farmen und Rendite

Bananenfarm Basis: 1250, Ertrag 80 pro Runde (4 Bananen à 20), Reichweite zum Einsammeln 40 [O/MEDIUM BTD-S14, BTD-S15]. Ertragswerte stammen aus dem älteren Datendump (BTD-S14), Preise aus dem aktuellen Preismodul (BTD-S13). Payback = kumulierte Kosten / Ertrag je Runde [D].

| Variante | kumulierte Kosten (Medium) | Ertrag pro Runde | Payback in Runden | Quelle |
|---|---:|---:|---:|---|
| 0-0-0 Farm | 1250 | 80 | 15,6 | [D BTD-S13/S14] |
| 3-0-0 Banana Plantation | 5350 | 320 | 16,7 | [D BTD-S13/S14] |
| 4-0-0 Banana Research Facility | 24350 | 1500 | 16,2 | [D BTD-S13/S14] |
| 5-0-0 Banana Central | 139350 | 6000 (+25 % auf andere 4xx-Farmen) | 23,2 | [D BTD-S13/S14] |
| 0-0-3 Marketplace | 4600 | 320, Bananen automatisch eingesammelt | 14,4 | [D BTD-S13/S14] |
| 0-0-4 Central Market | 19600 | 1120 | 17,5 | [D BTD-S13/S14] |
| 0-0-5 Monkey Wall Street | 89600 | 4000 plus 10 Leben am Rundenende | 22,4 | [D BTD-S13/S14] |
| 0-3-0 Monkey Bank | 1250+300+800+3650 = 6000 | 230, im Bank-Konto, +15 % Zinsen pro Runde bis 7000 Kapazität | 26,1 (ohne Zins) | [D BTD-S13/S14] |
| 0-5-0 Monkey-Nomics | 1250+300+800+3650+7200+100000 = 113200 | Kredit/Zuschuss: Fähigkeit gibt 10000 (60 s Abklingzeit, max. 2 je Runde) | – | [D BTD-S13/S14] |

Faustregel [D]: Alle sinnvollen Farm-Stufen amortisieren sich in 14–23 Runden. Das Design sorgt dafür, dass Farmen vor ca. Runde 40 (Steuer) gebaut werden müssen. Abgelaufene Bananen verfallen (15 s Lebensdauer, 30 s mit Long Life Bananas) [O/MEDIUM BTD-S14].

Weitere Einkommenstower [O/MEDIUM BTD-S3]: Sun-Temple-Sacrifice, Buccaneer-Handelsupgrades, Druid Jungle's Bounty, Dorf Monkeyopolis. Exakte Werte: UNKNOWN (nicht abgerufen).

## 5. Kostenkurve der Upgrades (Medium)

Quelle aller Preise: Wiki-Preismodul [O/HIGH BTD-S13]. Beispiele (kumulierte Kosten Basis + Pfad bis Stufe n):

| Tower (Pfad 1) | Basis | T1 | T2 | T3 | T4 | T5 |
|---|---:|---:|---:|---:|---:|---:|
| Dart Monkey (billig) | 200 | 340 | 540 | 860 | 2660 | 17660 |
| Wizard Monkey (mittel) | 250 | 425 | 875 | 2325 | 12325 | 44325 |
| Super Monkey (Top-Unit) | 2500 | 4500 | 7000 | 27000 | 127000 | 627000 |

Tier-Preis relativ zum Basispreis, Median über alle 26 Tower × 3 Pfade [D aus BTD-S13]: T1 ≈ 0,6×, T2 ≈ 0,9×, T3 ≈ 3,3×, T4 ≈ 12×, T5 ≈ 83×. Das T5-Upgrade ist im Median 6,2× so teuer wie T4. Absolute T5-Preise: Minimum 5000 (Dorf Pfad 3), Median 35000, Maximum 500000 (Super Monkey Pfad 1) [D]. 5 von 78 T5-Upgrades kosten ≥ 100000.

Gesamtkosten T5-Pfad (Basis + 5 Stufen) je Tower [D BTD-S13]: Dart 17660–53140; Boomerang 35895–54715; Bomb 31475–60175; Wizard 31650–60650; Ninja 29450–48400; Super Monkey 108400–627000; Banana Farm 89600–139350. Details in [units.md](units.md).

Zum Vergleich: Gesamteinnahmen bis Runde 60 (54484) reichen für ein einzelnes teures T5, bis Runde 100 (178994) für etwa 3–5 mittlere T5 oder ein Paragon (150000–900000 laut Modul) nur in Freeplay [D].

Konfliktmarkierung: Das Preismodul nennt Heli 1500 und Mortar 600, die Infoboxen 1600 und 750 (Medium) [O/MEDIUM BTD-S13 vs BTD-S15]; aktuell gültiger Wert UNKNOWN. Der ältere Dump BTD-S14 hat Basispreise teils höher (Ninja 500, Boomerang 325, Bomb 525) und weicht auch bei einzelnen Upgrade-Preisen ab (Dart-T2 220 statt 200). Für ein Design zählen die Größenordnungen.
