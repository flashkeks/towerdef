# Design-Lessons BTD6

Kennzeichnung `[Herkunft/Sicherheit Quelle]`; Quellen in [sources.md](sources.md). Review-Zahlen stammen von der Steam-API (Englisch-Filter, 2026-10-06), Zitate sind kurz oder paraphrasiert.

## Reviews: Zahlen

253071 positiv / 7100 negativ = ca. 97,3 % positiv, Einstufung „Overwhelmingly Positive“ [V/CONFIRMED BTD-S18]. Von den 92 lesbaren, nach Hilfreich-Stimmen sortierten Reviews ist die große Mehrheit positiv; Einzelstimmen mit der höchsten Zustimmung kommen von Spielern mit 800–3300 Stunden [O/MEDIUM BTD-S18].

## Was Spieler loben

| Thema | Beleg (Paraphrase) | Quelle |
|---|---|---|
| Lange Betreuung | „one of the best long-standing Tower Defense games“; regelmäßige Updates, neue Tower und Events | BTD-S18 [O/HIGH] |
| Tiefe bei einfachem Einstieg | einfache Prämisse, aber viel Strategie und Synergien; Easy fühlt sich leicht an, die härtesten Modi sind schwer | BTD-S18 [O/HIGH] |
| Inhaltsmenge | viele Maps, Tower, Modi, Events, Helden; Spieler erreichen über 3000 Stunden | BTD-S18, BTD-S1 [O/HIGH] |
| Fairer Free-Anteil | man müsse kein echtes Geld ausgeben, um Spaß zu haben (Aussage eines Spielers) | BTD-S18 [O/MEDIUM] |
| Herausforderungsstufen | Challenges, Boss-Events, Odysseys, Daily-Challenges decken Gelegenheits- und Hardcore-Spieler ab | BTD-S18 [O/HIGH] |

## Was Spieler hassen

| Thema | Beleg (Paraphrase) | Quelle |
|---|---|---|
| Mikrotransaktionen/DLC | „so many microtransactions in a paid game“; Vorwurf von Cash-Grab-Modi und mobilem Design | BTD-S18 [O/HIGH] |
| Performance in späten Runden | ab Runde ~100–160 Lag, im Koop teils unspielbar (Spaghetti-Code-Vorwurf) | BTD-S18 [O/HIGH] |
| Netzwerk | Verbindungsabbrüche und Lag in Co-Op und Lobby | BTD-S18 [O/MEDIUM] |
| Fortschrittsverlust | Rückkehrer berichten verlorenen Fortschritt (Cloud-Save) | BTD-S18 [O/MEDIUM] |
| CHIMPS-Regeln | Abbruch oder Absturz einer Partie wird als „Cheater“-Rahmen gewertet; Wiederholung zählt nicht | BTD-S18 [O/MEDIUM] |
| Wiederholung | gelegentlich „repetitive“ und „grindy“ | BTD-S18 [O/LOW] |

## Warum das Spiel lebt

- Aktive Entwicklung seit 2018 mit mehreren Updates pro Jahr; Skywarden als neuester belegter Tower (v56.0, 2026-08-05) [O/HIGH BTD-S1, BTD-S15].
- Gleichzeitig 7242 Spieler am 2026-10-06 und Monatsschnitte von 8100–9100 im Frühjahr/Sommer 2026, also Jahre nach dem Launch stabil [V/CONFIRMED BTD-S19; O/MEDIUM BTD-S20].
- Plattformübergreifend (Mobile, Steam), Content Browser, Events und Meta-Layer halten Spieler (siehe [meta.md](meta.md)).

## Lehren für unser Spiel

1. **Feste Rundenliste statt Zufall.** BTD6 hat 140 deterministische Runden; Spieler lernen sie und diskutieren Strategien. Wir sollten eine feste Kampagnen-Reihe mit Wiedererkennungswert bauen und Zufall nur im Endlos-Modus nutzen [O/HIGH BTD-S2].
2. **Einkommensabfall in Stufen.** Pop-Cash fällt nach festen Grenzen (100 → 50 → 20 → 10 → 5 → 4 → 2 %) und verschiebt den Fokus von „mehr Einkommen“ zu „Effizienz“. Rundenbonus (100 + Runde) und Farmen sichern die Basis [O/HIGH BTD-S3, [economy.md](economy.md)].
3. **Farm-Payback 14–23 Runden.** Alle Farm-Stufen amortisieren sich in ähnlichen Fenstern; das gibt der Frühphase eine klare Entscheidung: investieren oder verteidigen [D, [economy.md](economy.md)].
4. **Kostenkurve exponentiell.** Median T1 0,6× Basispreis, T3 3,3×, T4 12×, T5 83×; Top-Upgrades kosten ein Vielfaches des gesamten Frühspiel-Einkommens und sind Endziele [D BTD-S13].
5. **Eine Zahl für die Gegnerstärke (RBE).** RBE als Summe der Layer und Lebensverlust = RBE macht Runden vergleichbar und Rundendesign berechenbar; ein Keramik-Leak (104) beendet Hard (100 Leben) [O/HIGH BTD-S17, BTD-S10].
6. **Skalierung in getrennten Brackets.** HP-Faktor nur für Blimps (stückweise linear, 8 Stufen), Speed für alle (stückweise linear mit Sprüngen), Status-Resistenz in 50-Runden-Schritten. Einfach zu tunen und zu kommunizieren [O/HIGH BTD-S4].
7. **Lag-Kontrolle ist Design.** Super-Keramik (ein Kind statt zwei) reduziert Objektzahl bei gleichem Cash; Fortified statt mehr Einheiten erhöht HP ohne Entity-Zuwachs. Bei Web-Spielen (Performance-Limit) besonders wichtig [O/HIGH BTD-S7].
8. **Drei Pfade, harte Crosspath-Regel.** Ein 5er-Pfad plus ein 2er-Pfad zwingt zu Entscheidungen, hält die Kombinationsmenge klein und balancierbar [R/HIGH, siehe [mechanics.md](mechanics.md)].
9. **Schwierigkeiten über Preisfaktor und Leben.** 0,85 / 1,0 / 1,08 / 1,2 plus Leben 200 / 150 / 100 / 1 reichen für vier klare Stufen; Rundung auf 5 bleibt lesbar [O/HIGH BTD-S10–S12, BTD-S15].
10. **Gegen Fehlerquellen aus BTD6 lernen.** Preisstapel-Bugs (Impoppable-Kosten stapelten, v37) zeigen: Modifikatoren klar auf eine Basis beziehen, nicht kumulieren [O/HIGH BTD-S12]. Spieler hassen Monetarisierung in einem Bezahlspiel und Abstürze im Koop: Monetarisierung sparsam und Netzcode früh stabil halten [O/HIGH BTD-S18].
11. **Sell-Quote 70 % mit Rundung nach oben.** Verhindert Switch-Exploits ohne Strafe zu übertreiben; Bonusquellen mit Cap (95 %) sauber begrenzen [O/HIGH BTD-S9].
