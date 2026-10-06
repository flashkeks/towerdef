# Design-Lehren aus Anime Last Stand

Siehe [sources.md](sources.md). Belegt ist wenig; vieles ist R (rekonstruiert). Das ist kenntlich.

## Zustand und Warum
| Befund | Beleg |
|---|---|
| Heute 17 CCU bei 1,08 Mrd. Besuchen, 0,71 Mio. Favoriten | [V/CONFIRMED ALS-S1] |
| Juni 2025 meint ein Poster, ALS habe noch mehr Spieler als Anime Vanguards | [O/LOW ALS-S21] |
| Feb 2026 Thread „Is the game actually falling off?": Spielerzahl „drops lower and lower", Ursache wird gefragt | [O/LOW ALS-S20] (Antworten nicht lesbar) |
| Aug 2025: Genre-Kollege Anime Vanguards wird als sterbend beschrieben, wegen fehlendem Content und schwachen Updates | [O/LOW ALS-S22] |
| Updates bis mindestens Feb 2026 im Wiki, API-Update 2026-09-28: Spiel wird weiter gepflegt, ist also nicht „abgeschaltet" | [V/CONFIRMED ALS-S1, O/HIGH ALS-S19] |

**Nachfolger oder Umsiedlung: nicht gefunden.** Drei Versuche (Wiki-Suche, Reddit-Suche, allgemeine Websuche) lieferten keinen Hinweis auf einen Nachfolger oder Umzug [U/UNKNOWN]. Zeitpunkt des Rückgangs und konkreter Auslöser sind nicht belegt [U/UNKNOWN]. Genre-weit kommen neue Anime-TDs (Beispiel Snippet „Anime Expedition", Juli 2026) und verteilen die Spieler [O/LOW ALS-S22 Umfeld]; das ist kein Beleg für ALS selbst.

## Wahrscheinliche Ursachen (R, Begründung aus belegter Spielstruktur)
1. **Zahleninflation**: Schaden bis 2,4 Mrd. pro Treffer, Fähigkeiten setzen Schaden auf „1 Sextillion", Caps bei 25 Billionen [O/HIGH ALS-S8]. Neue Spieler sehen keinen verständlichen Maßstab.
2. **Endlose Materialketten**: letzte Evolution braucht rund 1800 Shards plus 1000 Essenzen plus 7 Trial-Items [O/HIGH ALS-S8]; Einstieg und Endgame klaffen auseinander.
3. **Währungs-Zoo**: über 15 Währungen, Modus-Token, Event-Token [O/HIGH ALS-S10]. Hohe Einstiegsbarriere.
4. **Zufallsstapel auf Zufall**: Gacha (Pity bis 250), Traits (Top 0,03 %), Stat-Noten, Worthiness [O/HIGH ALS-S4, ALS-S5, ALS-S6]. Wer die richtigen Rolls nicht hat, ist im Mid-Game „unspielbar" (Guide: ohne Overlord/Avatar/Glitched geht nichts) [O/MEDIUM ALS-S16].
5. **Power-Creep und Nerf-Zyklus**: eigene Beschwerdeseite, Rebalancing-Listen in fast jedem Update; Extreme Boost existiert, um „alte Units wieder gut" zu machen [O/MEDIUM ALS-S2, ALS-S19, ALS-S23].
6. **Content-Last**: hunderte Units, 3 Welten, zahlreiche Modi, wöchentliche Events; Balance nicht mehr beherrschbar [O/MEDIUM ALS-S17, ALS-S19].
7. **AFK/Makro-Farming** wird empfohlen (Raid-Act-6-Makro für Rerolls) [O/MEDIUM ALS-S16; E ALS-S24]: Spieler verbringen die Zeit nicht im Spiel selbst.

## Was Spieler loben (Tierlisten, Guides) [O/LOW ALS-S18]
- Billige, früh starke AoE-Units mit klarer Identität.
- Support-Units mit zeitlicher oder positionsabhängiger Wirkung (Slow nach Nähe, Zeitstopp).
- Modus-Vielfalt mit jeweils eigenen Regeln (Siege ohne Farms, Survival mit wählbaren Fluch-Modifikatoren).

## Was Spieler hassen (belegt nur indirekt)
- Zufall mit extremen Ausreißern (Traits), Nerfs bei bereits teuren Units, Verlust der Spielerzahl (Thread-Titel).

## 5 bis 10 Lehren für unser Spiel
1. **Zahlenraum klein halten.** Deckel für Schaden/HP (z. B. Zehntausender), kompakte Anzeige; ALS' Billionen-Caps schaffen Unverständlichkeit. [R]
2. **Wenige Währungen** (3 bis 4), jede mit klarer Quelle/Senke. [R aus ALS-S10]
3. **Zufall nur an einer Stelle** (z. B. Gacha, nicht zusätzlich Traits plus Noten plus Worthiness), mit hartem Pity. [R aus ALS-S4, S5, S6]
4. **Upgrade-Kosten geometrisch, aber deckeln**: ALS: letzte Stufe kostet das 906-fache der Platzierung [D ALS-S8]; für Kurzmatches höchstens 30x bis 50x. [R]
5. **Modifier statt neuer Units**: Survival-Modifier (+HP, -Cash, +Speed) bringen Schwierigkeit billig; so wenige Units wie möglich pflegen. [O/HIGH ALS-S14]
6. **Gegner-Eigenschaften als einfache Regel-Counter** (Reinforced, Flawless, Armored, Cyclone): klare, prozentuale Regeln, die Unit-Rollen erzwingen. [O/HIGH ALS-S3]
7. **Farm-Alternative als Modus**: Siege (keine Farms, +500 % Cash/Kill) zeigt, dass das Farming-Minigame ersetzbar ist. [O/HIGH ALS-S15]
8. **Kein Nerf-Zyklus, der teuer erspielte Units entwertet**; stattdessen Rotation oder neue Modi. [R aus ALS-S19, S23]
9. **Einstieg ohne Materialkette**: Das Endgame sollte nicht von Dutzenden Modi abhängen. [R aus ALS-S8, S16]
10. **Telemetrie planen**: Rückgang erkennen und Ursachen belegen (hier unbekannt), bevor Content-Last wächst. [R]
