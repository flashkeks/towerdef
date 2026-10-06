# Anime Expeditions - Design-Lehren

Kennzeichnung `Wert [Herkunft/Sicherheit Quelle]`, Quellen in [sources.md](sources.md). Zurück zu [overview.md](overview.md).

## Stimmung der Spieler (dünne Datenlage)

| Beobachtung | Beleg | Kennz. |
|---|---|---|
| 95,7 % positive Votes bei 283 617 Stimmen | Roblox Votes-API | [V/CONFIRMED AE-S2] |
| Hohe Bindung: 211 797 Favoriten, 801 Mio. Besuche, ~3 850 gleichzeitige Spieler (Spitzenwerte nicht verfügbar) | Roblox-API | [V/CONFIRMED AE-S1] |
| Reddit r/AnimeVanguard (20.07.2026), Thread "I started playing Anime Expedition, and honestly I just can't get into it": Antwort sinngemäß, AE sei "another Tower Defense with a slightly better quality of life aspect" | Suchsnippet; Thread selbst nicht abrufbar (Bot-Schutz) | [O/LOW AE-S22] |
| Beebom-Guide nennt Secrets "Hours of grinding", nur über Evolution erhältlich; Shadow als CC-stark, 8th Sword als höchster DPS | Drittseite | [O/LOW AE-S21] |
| Echte Lob-/Hass-Listen (Reddit-Kommentare, Reviews) | in drei Suchversuchen nicht abrufbar | [U/UNKNOWN] |

Warum aktiv: schnelle Update-Kadenz (Release, 0.5, 1.0, 2.0, 2.5 innerhalb weniger Monate laut Wiki-Eventseiten), viele Event-Banner und ein Wiki, das offizielle Daten übernimmt [O/MEDIUM AE-S27]. Warum es kein Selbstläufer ist: Spieler vergleichen es direkt mit Anime Vanguards und anderen Anime-TDs (Thread im Vanguards-Subreddit) [O/LOW AE-S22]. Ob die Spielerzahl steigt oder fällt: UNKNOWN (nur eine Momentaufnahme).

## Lehren für unser Spiel

Alle folgenden Punkte sind Schlüsse aus belegten Daten; die Schlussfolgerung selbst ist `R` (Rekonstruktion).

1. **Zufällige Gegner-Modifikatoren pro Act statt nur HP-Skalierung.**
   AE legt je Act 2-4 Modifikatoren fest (Sprinter 0,8x HP/+45 % Speed, Tank, Summoner, Regen I-IV 1-8 %/s, Bulwark, Status Cleanse, Stunner ...), und stapelt sie von Map zu Map. Das gibt Varianz ohne neue Assets und zwingt zu unterschiedlichen Builds [R/MEDIUM; Beleg AE-S3, AE-S5]. Für uns: Modifikator-Katalog früh bauen (30-40 Einträge sind im Modul belegt), pro Stage 2-4 auswählen.

2. **Star Missions mit Build-Einschränkungen.**
   "Nur 1 Farm", "nur 3 Units", "höchstens 15 Upgrades", "unter 50k Yen", "mind. 2 Magical-Units" geben jedem Act drei Ziele und eine Belohnung (Trait Crystal je Stern, 6 je Act). Das erhöht Wiederspielwert ohne zusätzlichen Content [R/MEDIUM; AE-S3, AE-S14].

3. **Farm als optionale Wette mit Lock-in.**
   Farm-Units haben Damage 0, hohe Gesamtkosten (Ramen Guy 40 000 für Farm-Wert 11 500) und nur 10 % Rückverkaufswert; zusätzlich Modifier "No Farms" und Missionen "ohne Farms". Die Einschränkung (Limit 1, Verkauf 10 %) verhindert, dass Farmen sich frei umschichten lassen [R/MEDIUM; AE-S7, AE-S5]. Für uns: Farmen entweder mit hohem Anfangs-Break-even oder mit Sell-Penalty koppeln. Wichtig: Wir kennen die Einheit des Farm-Werts nicht und müssen eigene Rendite-Zeit festlegen.

4. **Platzierlimit pro Unit (1-5) als Haupt-Balancing-Hebel.**
   Mythics haben meist Limit 2-3, Rares 4, Flame Emperor 5, Exclusive/Farm 1. So sind Top-Units knapp, schwache Units in Mengen platzierbar [R/MEDIUM; AE-S7]. Für uns: kein globales Limit nötig, wenn jedes Unit ein eigenes Limit hat. Gesamtlimit des Spiels ist UNKNOWN.

5. **Zusätzliche Stufenleiter (Evolution) statt neuer Unit.**
   Evolution verdoppelt etwa die Upgrade-Kosten (1,7-2,1x) und macht den Max-Damage 2,2-3,2x, benutzt dasselbe Modell, mit 2-3 weiteren Stufen und neuer Attacke [D/HIGH; AE-S7]. Für uns: günstiger Weg zu Endgame-Tiefe, ohne Katalog zu erweitern.

6. **Gacha mit drei Pity-Ebenen und Einsteiger-Banner.**
   Pity 50 (Legendary), 400 (Mythic), 10 000 (Secret) bei 50 Gems je Summon; Beginner-Banner mit festem, nicht rotierendem Pool und niedrigerer Pity, gekoppelt an ein Quest-Event [O/HIGH AE-S9]. Mythic-Pity 400 entspricht der Erwartung 1/0,0025, also keine Gnade für Pech, aber auch kein Extremfall. Für uns: Pity-Kette ist einfach zu bauen, Beginner-Banner mildert den Kaltstart. Details der Free-to-play-Ökonomie (Gems je Stunde) UNKNOWN.

7. **Doppelter Zufalls-Sink (Trait und Stat-Potenzial) mit Schutzmechanik.**
   Trait-Rerolls kosten 1 Crystal, Mythic-Traits haben eigenes Pity (300-1 500), zwei Trait-Slots mit Swapping, Stat-Locks und Worthiness-Leiste. Evolution hebt jede Stat-Note um eine Stufe [O/HIGH AE-S10, AE-S11, AE-S16]. Lehre: Zufalls-Sinks brauchen Locks/Pity, sonst Frust; zwei Würfel-Kanäle sind das Maximum, was ein Wiki noch sinnvoll auflisten kann.

8. **CC-Cooldown-Regeln gegen Dauer-Stun.**
   Stun 2 s mit 5 s Sperre, Freeze 2 s mit 5 s Sperre, Rewind ApplyCap 10, Shadow Rewind ApplyCap 2, Marken-Cooldown 10 s; Gegner können Immunity haben oder alle CC alle 10 s bereinigen (Status Cleanse) [O/HIGH AE-S5, AE-S6]. Für uns: jeden CC mit Wiederanwendungs-Sperre versehen und den Gegenspieler (Cleanse, Immunity) als Modifier modellieren.

9. **Infinite mit offener HP-Formel für Wettbewerb.**
   Infinite-Modus ist uncapped (HP wächst unbegrenzt) und belohnt alle 5 Waves, Missionen bei Wave 10/25/50 [O/HIGH AE-S14, AE-S3]. Für uns: eigene Formel frei wählen; Meilenstein-Struktur (10/25/50) ist ein guter Anker.

10. **Daten offen halten.**
    Das Wiki konnte in Wochen Unit-, Trait-, Modifier- und Stage-Daten als Module spiegeln, weil die Spielkonfiguration sauber strukturiert ist (Cost, Damage, SPA, Range je Stufe). Wiki-Seiten mit Lücken (leerer DamageCalculator, fehlende HP) zeigen, wo Spieler die Lücken selbst füllen müssen [O/MEDIUM AE-S3 bis AE-S7, AE-S26]. Für uns: eine einheitliche Konfigurationsstruktur lohnt sich für Balancing und Community-Tools.

## Warnungen aus den Daten

- Datenwidersprüche in der eigenen Doku erzeugen Streit: "Burn" hat Scaling 1 im Feld, aber 0,5x im Text; "Arcane Magic" hat max. 10 im Meter-Modul, aber 7 im Unit-Passiv [O/HIGH AE-S6, AE-S7]. Quelle der Wahrheit festlegen.
- Hohe Stufenzahl (bis 12) mit Attackenwechsel erzeugt große Sprünge in Preis-Leistung (Elf Mage: Damage +68 % bei Stufe 6) [D/HIGH AE-S7]; Spieler optimieren nach "Wechsel-Stufen" [R/LOW].
- Der Mythic-Anteil von 0,25 % mit Pity 400 und 8 Mythics im Beginner-Pool macht Teams ohne Pity-Planung langsam; ob das ein Frustpunkt ist, ist UNKNOWN.
