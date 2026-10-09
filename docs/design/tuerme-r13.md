# Neue Türme (Runde 13 + 14) — Entwurf Hauptsitzung, 09.10.2026

Entscheidung Max (09.10.2026 abends): **Lantern Market, Longshot, Thornweaver, Alchemist** — „gerne noch mehr Türme“, aber nicht alle
in einer Runde. **Runde 13: Lantern Market + Longshot. Runde 14: Thornweaver + Alchemist.** Weitere Ideen: `ideen-tuerme.md`.
Einheiten, Crosspath, Kostenkurve, Verkauf wie `tuerme.md` (+ Nachträge). Preise Medium. Einkommen bis R20 Medium ≈ 13.400.
Jede Stufe soll **sichtbar** sein, und zwar deutlicher als bei den ersten drei (Max: „können sich gerne noch mehr verändern“).
**Keine Plattform/Sockel** unter den Figuren (Max), nur der Schlagschatten.

---

## 1. Lantern Market (`market`) — Wirtschaft + Unterstützung (wie Banana Farm + Monkey Village) · frei ab Spieler-Level 6

**Basis 1000.** Kein Angriff. Am Ende jeder Runde **+60 Gold** (Münzen fliegen sichtbar zur Geldanzeige). Fußabdruck 13 px,
Wirkradius für Auren 80 px. Pops 0 → Turm-XP nur über den Geld-Anteil (Runde 11b). Figur: Marktstand mit Händlerin, Laternenkette.
Begründung: BTD6-Farm amortisiert sich in 14–23 Runden (`economy.md` § 4); 1000 / 60 ≈ 17 Runden → lohnt nur, wer früh baut.

| Pfad | Stufe | Name | Preis | Wirkung | Sichtbar |
|---|---|---|---:|---|---|
| A Harvest | 1 | Busy Stalls | 400 | +30 Gold je Runde (90) | zweiter Stand |
| | 2 | Night Market | 600 | +40 (130) | Laternenkette leuchtet |
| | 3 | Trade Hall | 2200 | 320 je Runde | Fachwerkhalle statt Stand |
| | 4 | Merchant Guild | 6000 | 900 je Runde | Gildenhaus mit Wappen |
| | 5 | Golden Exchange | 18000 | 2.400 je Runde, alle anderen Markets +10 % | goldene Kuppel, Münzregen |
| B Bank | 1 | Coin Purse | 300 | +20 je Runde | Geldbeutel am Stand |
| | 2 | Lockbox | 500 | Einnahmen gehen in eine **Bank** (Knopf „Withdraw“), +10 % Zinsen je Runde, max. 3.000 | Truhe |
| | 3 | Lantern Bank | 2500 | Zinsen 15 %, max. 7.000 | Bankgebäude mit Tresortür |
| | 4 | Grant Office | 5000 | **Fähigkeit „Grant“**: +2.000 Gold, Abklingzeit 90 s | Schreibstube mit Siegel |
| | 5 | Treasury | 20000 | Grant +8.000; Zinsen 20 %, max. 20.000 | Schatzkammer, Goldberg |
| C Town Square | 1 | Watchpost | 250 | Türme im Radius +10 % Reichweite | kleiner Wachturm |
| | 2 | Lookout Bell | 400 | Türme im Radius erkennen Shades (Camo) | Glocke |
| | 3 | Drum Hall | 1500 | Türme im Radius +15 % Angriffstempo | Trommeln, Fahnen |
| | 4 | Armory | 4000 | Türme im Radius: `sharp` trifft Ironshell, +1 Pierce | Waffenständer |
| | 5 | Lantern Capital | 15000 | Türme im Radius +1 Schaden, Upgrades dort −10 % | Rathaus mit Uhrturm |

Auren mehrerer Markets **stapeln nicht** (stärkste je Wert zählt, BTD6-Dorf). Bank-Inhalt zählt nicht als Geld, bis abgehoben;
Verkauf zahlt Bank-Inhalt mit aus.

## 2. Longshot (`longshot`) — Scharfschütze (wie Sniper Monkey) · frei ab Spieler-Level 5

**Basis 350.** Reichweite **ganze Karte**, Ziel nach Targeting (First/Last/Strong/Close), Schaden 2, Pierce 1, Intervall 1,6 s,
Art `sharp`. Projektil mit **3.000 px/s** (fast sofort, aber Treffer bei Ankunft — Regel Max). Kein Camo. Fußabdruck 9 px.
Figur: Lanternfolk-Scharfschütze mit Langgewehr/Armbrust, Tarnumhang, Fernrohr.

| Pfad | Stufe | Name | Preis | Wirkung | Sichtbar |
|---|---|---|---:|---|---|
| A Heavy Rounds | 1 | Iron Bolt | 350 | Schaden 4, Art `magic` (trifft Ironshell) | Bolzen mit Eisenspitze |
| | 2 | Piercing Bolt | 1200 | Schaden 7, Pierce 2 | längerer Lauf |
| | 3 | Deadeye | 3000 | Schaden 18, +10 vs brute | Zielfernrohr, Augenklappe |
| | 4 | Giantslayer | 5000 | Schaden 30, +100 vs boss | Riesenarmbrust auf Stativ |
| | 5 | Lanternbreaker | 22000 | Schaden 80, +500 vs boss, Treffer lässt Boss 0,5 s taumeln | goldene Kanone, Lichtstrahl beim Schuss |
| B Rapid Reload | 1 | Night Scope | 200 | **Erkennung (Camo)** | grünes Nachtsicht-Glas |
| | 2 | Quick Reload | 400 | Intervall × 0,7 | Patronengurt |
| | 3 | Repeater | 2500 | Intervall × 0,33 | Repetierwaffe, Hülsen fliegen |
| | 4 | Volley Squad | 4500 | Intervall × 0,66; Fähigkeit „Focus“: alle Longshots 8 s doppelt so schnell, Abklingzeit 60 s | zweiter Schütze daneben |
| | 5 | Lantern Legion | 13000 | Intervall fest 0,12 s, Schaden 4 | drei Schützen, Banner |
| C Field Kit | 1 | Shrapnel | 250 | Treffer wirft 3 Splitter (Schaden 1, Pierce 1, `sharp`) | Splitterpatronen |
| | 2 | Ricochet | 450 | Bolzen springt auf 2 weitere Gegner (je −1 Schaden) | Ricochet-Spuren |
| | 3 | Supply Drop | 2000 | **Fähigkeit „Supply Drop“**: Kiste fällt, +800 Gold, Abklingzeit 60 s | Funkgerät, Fallschirm-Kisten |
| | 4 | Elite Sniper | 4000 | alle Longshots +40 % Tempo; Ziel „Strong“ bevorzugt Brutes | Tarnnetz, Abzeichen |
| | 5 | Crippling Shot | 12000 | Treffer: Nicht-Boss −50 % Tempo 2 s; Boss nimmt 3 s lang **+20 % Schaden aus allen Quellen** (Markierung sichtbar) | rot markiertes Fadenkreuz-Symbol über dem Ziel |

## 3. Thornweaver (`thornweaver`) — Natur, Fläche + Kontrolle (wie Druid) · Runde 14, frei ab Level 7

**Basis 400.** Wirft 5 Dornen im Fächer (je Schaden 1, Pierce 1, 450 px/s, `sharp`), Intervall 1,1 s, Reichweite 70 px.

| Pfad | Stufe | Name | Preis | Wirkung |
|---|---|---|---:|---|
| A Storm | 1 | Hard Thorns | 250 | Pierce 2 |
| | 2 | Heart of Thunder | 1000 | alle 2,3 s Kettenblitz 4 Ziele, Schaden 2 (`energy`) |
| | 3 | Tempest | 2500 | Blitz 8 Ziele Schaden 3; alle 4 s Wirbelwind: wirft Nicht-Boss-Gegner 40 px zurück |
| | 4 | Storm Mother | 6000 | Blitz 15 Ziele, Schaden 6 |
| | 5 | Avatar of Wrath | 26000 | Schaden +1 je 25 Gegner auf der Karte (max. +10) |
| B Wild | 1 | Thorn Burst | 300 | 8 Dornen rundum statt Fächer |
| | 2 | Vine Snare | 600 | alle 3 s hält eine Ranke einen Nicht-Boss 1,5 s fest |
| | 3 | Wall of Trees | 2200 | **Fähigkeit**: Baumwand auf dem Weg schluckt 150 RBE, Abklingzeit 45 s |
| | 4 | Spirit of the Forest | 6000 | Dornenranken auf dem Weg im Radius: 1 Schaden/s an alles darin |
| | 5 | World Tree | 24000 | Ranken-Schaden 5/s, Radius ×2, +100 Gold je Runde |
| C Grove | 1 | Druidic Reach | 150 | Reichweite +15 % |
| | 2 | Herbal Lore | 400 | Erkennung (Camo) |
| | 3 | Jungle's Bounty | 1500 | +150 Gold und +2 Leben je Runde |
| | 4 | Spring Blessing | 3500 | Türme im Radius +15 % Angriffstempo |
| | 5 | Grove Guardian | 10000 | Dornen `magic` (trifft Ironshell), Schaden +3 |

## 4. Alchemist (`alchemist`) — Säure + Verstärkung (wie Alchemist) · Runde 14, frei ab Level 9

**Basis 500.** Wirft einen Säure-Trank im Bogen: Spritzer Radius 18 px, Schaden 1 an bis zu 12, dazu Säure 1/s für 2 s
(`magic`, trifft Ironshell), Intervall 2,0 s, Reichweite 64 px.

| Pfad | Stufe | Name | Preis | Wirkung |
|---|---|---|---:|---|
| A Brews | 1 | Larger Potions | 250 | Radius +30 % |
| | 2 | Acidic Mixture | 350 | +1 vs Ironshell und Brute; Säure 2/s |
| | 3 | Berserker Brew | 1200 | alle 6 s Trank auf einen Turm im Radius: +1 Schaden, +15 % Reichweite, +10 % Tempo für 8 s |
| | 4 | Stronger Stimulant | 3000 | Trank: +2 Schaden, +25 % Tempo |
| | 5 | Permanent Brew | 15000 | Trank-Wirkung dauerhaft auf allen Türmen im Radius |
| B Unstable | 1 | Stronger Acid | 250 | Säure 3/s |
| | 2 | Perishing Potions | 450 | +2 vs Brute, +5 vs Boss |
| | 3 | Unstable Concoction | 2500 | getroffene Gegner explodieren beim Tod (Radius 24 px, Schaden 4) |
| | 4 | Transforming Tonic | 4000 | **Fähigkeit**: Alchemist wird 20 s zum Monster (Schaden 30/s auf das stärkste Ziel), Abklingzeit 60 s |
| | 5 | Total Transformation | 15000 | Fähigkeit verwandelt zusätzlich 5 Türme im Radius |
| C Gold | 1 | Faster Throwing | 250 | Intervall × 0,75 |
| | 2 | Acid Pool | 300 | Säurepfützen auf dem Weg (1 Schaden je 0,5 s, 20 Treffer) |
| | 3 | Lead to Gold | 1500 | Ironshells, die er knackt, geben +40 Gold |
| | 4 | Rubber to Gold | 3500 | getroffene Gegner geben 30 s lang +1 Gold je Schicht |
| | 5 | Shrink Potion | 22000 | alle 3 s wird der stärkste Nicht-Boss in Reichweite zu einem Red Glim |

---

## Wissensbaum (ersetzt die 10 Knoten aus `meta.md`) — Runde 13

**30 Knoten in 5 Ästen**, Punkte: 1 je Spieler-Level (wie bisher) **+ 1 je erster Medaille**. Kosten 1–3, Voraussetzung = Knoten
darüber. Bestehende Knoten behalten ID und Wirkung (keine Rückerstattung nötig). Zurücksetzen bleibt kostenlos.

| Ast | Knoten (Kosten) |
|---|---|
| **Economy** | Head Start +100 Startgold (1) → Better Deals Verkauf 75 % (1) → Lantern Tax Rundenbonus +20 in R1–10 (2) → Big Head Start weitere +200 Startgold (2) → Market Savvy Markets +10 % Ertrag (2) → Compound Interest Bank-Zinsen +5 Punkte (3) |
| **Primary** (Ranger, Bombardier, Frostcaller) | Sharp Eyes Ranger +8 % Reichweite (1) · Bigger Barrels Bombardier +10 % Radius (1) · Cold Snap Frost-Verlangsamung +25 % Dauer (1) → Cheaper Basics T1 −10 % (2) → Quick Hands Ranger/Bombardier +5 % Tempo (2) → Deep Freeze Frostcaller-Einfrieren +0,5 s (2) → Veteran Primaries T2 −10 % (3) |
| **Specialists** (Market, Longshot; R14: Thornweaver, Alchemist) | Steady Aim Longshot +10 % Tempo (1) → Supply Lines Supply Drop +200 (2) → Wide Aura Market-Radius +15 % (1) → Bulk Orders Market-Basis −10 % Preis (2) → Field Medic R14 (später) |
| **Wardens** (Leben, Held, XP) | Extra Lives +10 (1) → Veteran Hero Wren startet L3 (2) · Fast Learner Turm-XP +20 % (2) → Thick Walls +15 Leben (2) → Hero Training Wren-XP +15 % (2) → Legendary Wren startet L5 (3) → Scholar Spieler-XP +10 % (2) |
| **Powers** (Runde 12) | Ember Pouch Embers +10 % (1) → Bulk Buyer Store −10 % (2) → Spare Pocket je Art 2 Einsätze pro Runde statt 1 (3) → Starter Kit jedes Match 1 Gold Drop gratis (3) |

Summe aller Knoten ≈ 55 Punkte → mit Level 1–40 + Medaillen in vielen Partien voll. Anzeige: Baum mit 5 Spalten, scrollbar,
Ast-Farben, gesperrte Knoten grau mit Schloss, Linien zeigen Voraussetzungen.

## Freischalt-Level (Spieler) nach Runde 13

Ranger 1 · Bombardier 2 · Wren 3 · Frostcaller 4 · **Longshot 5** · **Market 6** · Hard 5 · (R14: Thornweaver 7, Alchemist 9).
Bestehende Profile über Level 5/6 bekommen die neuen Türme sofort.
