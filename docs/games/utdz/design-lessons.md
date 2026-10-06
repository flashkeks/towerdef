# UTDZ - Design-Lehren

Format: `Wert [Herkunft/Sicherheit Quelle]`. Siehe [sources.md](sources.md). Spielerstimmen: Reddit/Reviews wurden in diesem Durchgang nicht abgerufen (Budget und Rate-Limit); es liegen nur Suchsnippets und Wiki-/Drittseiten-Aussagen vor. Aussagen sind daher als D/R markiert.

## Was Spieler loben (Indizien)

- Tiefe Sammel- und Build-Schicht: Units, Evolutionen, Traits, Relics, Synchro; viele Hebel pro Unit [O/MEDIUM UTDZ-S11, UTDZ-S20].
- Regelmäßige Updates (4.25 im Sept. 2026, Crossover-Units, Events) und neue Modi pro Update [V/HIGH UTDZ-S1, O/MEDIUM UTDZ-S9].
- Quality-of-Life-Nachbesserungen: Takedown-Anforderungen für Evolutionen entfernt (die Wiki-Notiz: nicht mehr "über eine Stunde im Infinite sitzen"), Pity gesenkt, Pity-Anzeige am Banner, Macro-Recorder, Stat-Transfer, Vending-Machine-Preise von Gems auf Gold [O/HIGH UTDZ-S9].
- Hohe Bekanntheit: 304 Mio Besuche, 207.800 Favoriten [V/CONFIRMED UTDZ-S1].

## Was Spieler kritisieren (Indizien)

- Undurchsichtige Zufall-/Pity-Systeme und lange Update-Wartezeiten für Wünsche (TikTok-Snippet: "Rate-limited rerolls ... instead of an opaque pity counter", "Why ATDs take forever to update") [D/LOW UTDZ-S23].
- Extreme Grind-Zahlen: 1.250 Trait Rerolls für garantierten Ruler; 24.000 Summons für garantierten Secret; 500M Schaden als Einmalziel im World Raid [O/HIGH UTDZ-S11, UTDZ-S13, UTDZ-S16].
- Namens- und Informationschaos: Umbenennung X -> Z spaltete Suchbegriffe, Guides und Tierlisten; Wiki-Daten veraltet; neue Spieler halten das Spiel für tot oder neu [D/MEDIUM UTDZ-S21].
- Wiki-Qualität gering (zwei konkurrierende Wikis, Stubs "wtf", "stub", Zahlen widersprechen sich zwischen Wikis) [O/HIGH UTDZ-S2, UTDZ-S10, UTDZ-S7].
- Lebt-oder-tot-Einordnung: 103 Gleichzeitige bei 304 Mio Besuchen [V/CONFIRMED UTDZ-S1] sind für ein Spiel dieser Größenklasse niedrig; das Spiel ist aber aktiv gepflegt (Update vom 2026-09-19). Aussage zu Spitzen-CCU: `UNKNOWN`.

## Lehren für unser Spiel (5 bis 10)

1. Zufall deckeln: Jede Zufallsquelle (Trait, Banner, Drops) bekommt ein sichtbares Pity (UTDZ: Pity = 1,25x Erwartungswert bei Traits, 1,5x bei Secret). Zähler im UI zeigen; das war ein Update-2.0-Feature, das Spieler zuvor vermissten [O/HIGH UTDZ-S9, UTDZ-S13].
2. Meta-Multiplikatoren begrenzen: Basis-DPS von Legendary-Units liegt bei 40-109, die Wiki-Schätzung mit Trait/Relics bei 4.100-7.100 (Faktor ca. 50-100) [D/LOW UTDZ-S14]. Das macht Match-Balance abhängig vom Account-Grind; für ein Web-TD ohne Account-Grind besser Match-Entscheidungen (Platzierung, Upgrade-Reihenfolge) wichtig halten.
3. Farm-Einheiten mit klarer Rendite: Bulmo zahlt zu Wave-Beginn 1.000 bis 10.500 Yen; die Grenzrendite je Upgrade steigt von 2 auf 6,7 Wellen Amortisation [D, siehe [economy.md](economy.md)]. Das liefert eine saubere Entscheidungsstruktur (früh bauen, spät nicht mehr upgraden). Vorteil: Zeit-Risiko-Abwägung ohne UI-Aufwand.
4. Gegner als Hit-Zähler und Zeitdruck: Schild (jeder Treffer entfernt einen Stack) und Rusher (HP x2, Speed 0,5 bis 2x in 15 s) sind einfach zu bauen und zwingen zu unterschiedlichen Units [O/HIGH UTDZ-S9].
5. Elemente simpel halten: 5 zyklische Elemente plus 2 neutrale, nur 1,5x/0,5x; leicht zu lernen und zu balancieren [O/HIGH UTDZ-S11].
6. Schwierigkeit als Regler mit Beute-Multiplikator (75 % bis 1000 %, x1 bis x6) statt fester Stufen; verlängert Spielwert ohne neue Inhalte [O/HIGH UTDZ-S12].
7. Letzte Upgrade-Stufe teuer machen: bei Pebble/Ruka/Zorus kostet die letzte Stufe 1,7x-2x der vorletzten; das erzeugt Spätentscheidungen [D, siehe [economy.md](economy.md)].
8. Namens-/Versionswechsel vermeiden oder klar kommunizieren: Die Umbenennung hat Suche, Guides und Wiki zersplittert (zwei Wikis, Namensvettern) [D/MEDIUM UTDZ-S21]. Für uns: stabilen Namen und eine kanonische Datenquelle (Datenmodul/JSON) pflegen.
9. Mehrspieler-Skalierung bewusst designen: 12-Spieler-World-Raid mit Tages-Missionen nach kumuliertem Schaden (20M bis 500M) ist ein Koop-Ziel, das nicht von einer einzelnen Person abhängt [O/HIGH UTDZ-S16]; ob Geld geteilt wird, ist unbekannt, also selbst festlegen.
10. Plattform-Tag-Boni (+30 % für Raid-Tag) belohnen Team-Komposition und sind billig zu implementieren [O/HIGH UTDZ-S15].

## Offene Punkte (für spätere Runde)

Reddit-/Review-Zitate, Targeting-Modi, Startgeld, Kill-/Wave-Einkommen, Gegner-HP-Kurve, komplette Wave-Liste einer Stage, Spieler-Level-Kurve. Alle `UNKNOWN`, siehe jeweilige Dateien.
