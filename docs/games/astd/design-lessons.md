# ASTD: Design-Lehren

Format: `Aussage [Herkunft/Sicherheit Quelle]`. Quellen: [sources.md](sources.md).

## Datenlage zu Spielermeinungen

Reddit- und Review-Snippets: **UNKNOWN**. Die Websuche (2 Anfragen) lieferte nur Treffer zu anderen Spielen [E ASTD-S29]; Reddit-Direktabruf wurde wegen des Abruf-Limits nicht versucht. Die folgenden Punkte stammen deshalb aus Wiki-Beobachtungen (Guides, Trivia, Update-Notizen), nicht aus Spielerzitaten. Sie sind als Beobachtung markiert, nicht als Sentiment.

## Was das Spiel offenbar gut macht (aus Wiki-Befunden)

| Beobachtung | Tag |
|---|---|
| Sehr breite Sammlung (hunderte Units) und Evolutionspfade bis 7 Sterne geben Langzeitziele; stündliche Banner schaffen Wiederkehr | O/MEDIUM ASTD-S10, ASTD-S28 |
| Farm-, Buffer-, Slow-, Timestop-Rollen ergeben eine klare Team-Struktur ("Farm, DPS, Buffer, Support") | O/HIGH ASTD-S9 |
| Der Modus-Mix (Story, Infinite, Trials/Raids, Tower, Gauntlet, Zones) bedient Solo und Koop | O/HIGH ASTD-S11, ASTD-S22 |
| Das Spiel lebt: 7,9 Mrd. Besuche, 2,3 Mio. Favoriten, ca. 1 750 gleichzeitige Spieler und fortlaufende Updates 2026 | V/CONFIRMED ASTD-S1 |

## Wo Wiki-Befunde Reibung zeigen

| Beobachtung | Tag |
|---|---|
| Power-Creep: Schaden von 9 bis über 20 Mio. je Treffer, Gegner-HP bis zu Milliarden. Frühe Units (Alien Soldier) sind "not recommended for battle" und nur Material | O/HIGH ASTD-S20, ASTD-S23 |
| Meta-Verengung: "Jeff (CEO) ... the only unit to stay on meta since release"; Guides empfehlen immer Idol/Jeff/Pizza Girl als Farm | O/MEDIUM ASTD-S13, ASTD-S9 |
| Gacha-Kosten: Pity 3 600 Gems auf X/Y (80 Spins), 12 600 auf Z, bei 5 bis 6 Gems je Story-Wiederholung | D/MEDIUM ASTD-S10, ASTD-S7 |
| Verfügbarkeit: "most good units are limited/unobtainable" (Guide zu Raid-Team-Aufbau) | O/MEDIUM ASTD-S9 |
| Zeit-Sinks: Gauntlet-7-Sterne kosten 53 Stunden bei 1x Speed (laut Wiki), Auto-Battle gilt als "inconsistent" und kostet Gems | O/MEDIUM ASTD-S19, ASTD-S9 |
| Skip-Limit, Stalling und Auto-Click-Strategien (Gauntlet, "Autoclicker empfohlen") zeigen Bedienaufwand statt Entscheidungstiefe | O/MEDIUM ASTD-S9 |
| Unklare Regeln: Wiki widerspricht sich bei Pity (120/140), Gale-Slow-Cap (65/80 %), Enchant-Resist (0,25/ 1/3) | O/HIGH ASTD-S10, ASTD-S6, ASTD-S26, ASTD-S9 |

## 5 bis 10 konkrete Lehren für unser Spiel

1. **Farm als eigene Unit-Rolle mit klarer Rendite.** ASTD zeigt: Amortisation von 1,3 bis 3,5 Wellen je Stufe, Endstufen am teuersten (siehe [economy.md](economy.md)). Wir sollten Farm-Stufen so bauen, dass jede Stufe nach 1,5 bis 3,5 Wellen zurückzahlt und die letzte Stufe einen merklichen Aufpreis hat. [D/MEDIUM ASTD-S13]
2. **Farm-Fenster begrenzen.** In 15-Wellen-Stages stoppt man ca. Welle 10 bis 12, weil Geld sonst nicht mehr in DPS fließt. Ein hartes Ende der Farmphase entsteht allein durch Wellenzahl und Gegnerdruck; das ist eine kostengünstige Spannungsquelle. [O/MEDIUM ASTD-S9]
3. **Unverkäuflich und Limit 1 für Schlüssel-Units** (Jeff, Idol, Evil Shade). Verhindert Sell-Exploits und Farm-Stacking; die Entscheidung "wo stelle ich ihn hin" ist einmalig. [O/HIGH ASTD-S13, ASTD-S21]
4. **Gegnertypen als Konter-Fragen statt Zahlenwand.** Powerful braucht Upgrade 1/2, Air braucht Hill, Armored sperrt DoT, Elemental sperrt Direktschaden, Cloner braucht Reveal. Jeder neue Typ erzwingt eine Team-Antwort und lässt sich schrittweise pro Karte einführen. [O/HIGH ASTD-S8, ASTD-S25]
5. **Statuseffekte als Vielfaches des Treffers definieren** (Bleed x4, Burn x6, Poison x6, Rupture x12, Black Flame x20) statt als eigene Schadenswerte. So bleibt Balance mit einer Schadenszahl pro Unit berechenbar. [O/HIGH ASTD-S26]
6. **Single-Placement-Abwertung:** Update 48 senkte DoT auf 25 % für Units mit nur einer Platzierung. Beleg, dass Effekt-Stacking und Verteilung sonst dominieren; für unser Spiel vorab Stacking-Regeln festlegen. [O/HIGH ASTD-S6]
7. **Zahlenspanne begrenzen.** Zwölf Größenordnungen sind für Spieler schwer zu lesen; Roblox-Anzeige in Abkürzungen wäre nötig. Wir sollten eine kleinere Spanne (z. B. 4 bis 6 Größenordnungen) wählen und Rarity nicht allein über Zahlen skalieren. [R/MEDIUM: Begründung aus Abschnitt "Reibung" oben und aus Kostenkurve in economy.md]
8. **Gacha-Regeln dokumentieren und konsistent halten.** Ein Pity-Wert, der im Wiki zweifach erscheint (120/140), erzeugt Streit. Raten, Pity und Reset-Regeln müssen im Spiel anzeigbar sein. [O/HIGH ASTD-S10]
9. **Geschlossene Schleife über Zweit-Units.** Story-Drops und Gold-Banner (Zweit-Units, 4/3/2 Sterne) geben allen Pulls Wert als Evolutionsmaterial. Das macht Duplikate nützlich. [O/HIGH ASTD-S10, ASTD-S20]
10. **Kein Skip- oder Auto-Click-Zwang einbauen.** Wiki-Strategien verlangen Autoclicker und Zeitstall; ein eingebautes "Auto-Ability" mit Cooldown (Idol: Auto-Buff-Button) reicht aus. [O/MEDIUM ASTD-S9, ASTD-S21]
