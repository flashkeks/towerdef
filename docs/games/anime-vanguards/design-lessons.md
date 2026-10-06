# Anime Vanguards - Design-Lektionen

Tags: `Wert [Herkunft/Sicherheit Quelle]`. Belegte Fakten stehen in den anderen Dateien ([economy.md](economy.md), [meta.md](meta.md), [enemies-waves.md](enemies-waves.md), [units.md](units.md)). Quellen: [sources.md](sources.md).

## Datenlage zu Spielerstimmen (ehrlich)

Reddit war nicht lesbar (old.reddit.com leitet auf Login um; nur Suchsnippet vorhanden), Roblox-Bewertungen und Steam-Reviews gab es nicht. Daher gibt es **keine belastbaren Zitate**. Einziges Fragment: Ein Reddit-Thread vom 2025-09-01 fragt "Is it worth it to start playing Anime Vanguards now?" und der Fragesteller sagt, er sei früher in Anime-TDs gewesen und habe das Interesse verloren [O/LOW AV-S21]. Alles Weitere unten sind Rückschlüsse aus belegten Änderungen und Systemen, jeweils als `R` markiert.

## Warum das Spiel lebt (belegt)

| Beobachtung | Wert | Tag |
|---|---|---|
| Besuche, CCU, Favoriten | 2.06 Mrd., 20 544 gleichzeitig, 2.0 Mio. | V/CONFIRMED AV-S1 |
| Alter / Update-Rhythmus | seit 2024-01-28, letztes Update 2026-10-05, Updates mit großen Versionsnummern (bis 14.0) | V/HIGH AV-S1, AV-S24 |
| Content-Schichten | Story, Infinite, Legend, Challenge, Raids, Dungeons, Portals, Elemental Towers, Odyssey, Worldlines, PvP, Rifts, Events | O/HIGH AV-S12 |
| Sammel-/Build-Tiefe | Rarity, Evolution, Trait (11), Stat (8 Ränge x 3 Werte), Level, Shiny/Serialized, Memoria, Familiars | O/HIGH AV-S8, AV-S10 |

## Was Spieler laut Systemdaten schätzen dürften (R/LOW, Rückschluss)

- Hohe Kit-Vielfalt: Meter, Stacks, Ketten, Gruppen-Buffs, Execute, Repulse-Tiers statt reiner Zahlenspirale [R/MEDIUM aus AV-S11].
- Kurze Wiederholungsschleifen: Challenges alle 30 min, Boss Bounties, Wave-Skip, Auto-Upgrade [R/MEDIUM aus AV-S12, AV-S16].
- Große Rolls als Hoffnungsmoment: Trait 0.1 % Monarch, Stat 0.1 % Godly, Shiny 1.5 % [R/MEDIUM aus AV-S8, AV-S9].

## Was frustriert (R/MEDIUM, aus Entwickleränderungen abgeleitet)

- Pity wurde am 2025-07-20 gesenkt (Faktor 2.5x auf 1.5x des Erwartungswerts) und Solar/Deadeye wurden früher aufgewertet: Hinweis auf Klagen über RNG-Aufwand [R/MEDIUM aus AV-S8].
- Evolutionen mit sehr langen Quests ("designed to take a long time", ca. 16 h Ant-King-Grind) [O/HIGH AV-S15].
- Extreme Zahlenspirale: Schaden 18 (Rare) bis 80 000 (Exclusive) und 2^32-HP-Grenze, Rare/Legendary verlieren Relevanz [D/MEDIUM AV-S3, AV-S14].
- Vanguard-Pity von 20 000-25 000 Summons ist praktisch unerreichbar ohne Bezahlwährung [D/HIGH AV-S9].
- Infinite-Leaderboards wurden am 2026-02-01 entfernt, Dezember 2025 wurde Auto-Skip erzwungen: Hinweise, dass Grind-/Exploit-Pfade bereinigt wurden [O/HIGH AV-S19].

## 5 bis 10 Lehren für unser Spiel

1. **Kosten-Zahlenverhältnis festlegen und halten.** AV: Upgrade-Gesamtkosten = 9x bis 33x der Platzierung (Rare/Mythic), bis 120x/220x bei Top-Units; Schaden wächst dabei 5x bis 24x [D/MEDIUM AV-S3]. Für uns: gestaffelter Kostenfaktor je Rarity statt Einheits-Kurve, siehe [economy.md](economy.md).
2. **Platzierungslimit als Balancing-Hebel nutzen.** Monarch (+344 % bei Limit 1, aber -26 % bei Limit 6) zeigt, wie ein einziger Multiplikator durch das Limit der Einheit relativ wirkt [D/HIGH AV-S8]. Wir sollten Limit je Einheit (1-6) und globale Slotzahl (6) als primäre Stellschrauben einplanen.
3. **Boss-Kits statt Boss-HP.** AV-Bosse haben Stun (3-10 s, 1-2 Ziele, 12-15 s), Phasenwechsel, Summon, Unit-Löschung; HP-Multiplikatoren 15x bis 60x der Standardgegner [O/HIGH AV-S5]. Reine HP-Schwämme vermeiden.
4. **CC-Lockouts einbauen.** Hard-CC 6 s/20 s Sperren, Repulse 25 s, Bosse nur durch spezielle Repulse: verhindert Stun-Lock und hält Bosse spielbar [O/HIGH AV-S11].
5. **Einheiten über Gruppen, Elemente und Buff-Kategorien verknüpfen** (Unit-Gruppen, Fire-Stacking +1 %/Platzierung, Cap bei Leader of the Force 20 %). Erzeugt Teambau-Tiefe ohne neue Grundmechanik [O/HIGH AV-S11].
6. **Modifier-Karten als Schwierigkeitsschicht.** Strong +100 % HP, Fast +20 Speed, Regen 0.2 %/s, Thrice, Champions alle 6 Waves, Money Surge +40 % Yen/King's Burden -40 %; additive Karten ersetzen separate Schwierigkeitsstufen und Event-Währung skaliert mit Risiko (+35/+55/+75 %) [O/HIGH AV-S6].
7. **Pity transparent und gedeckelt designen.** AV hat Pity zu 2x (Legendary/Mythic) und 1.5x (Traits) des Erwartungswerts; trotzdem Beschwerden. Wenn Gacha, dann Pity bei <=1.5x des Erwartungswerts und kein 20 000er-Vanguard-Pity [D/HIGH AV-S9, AV-S8].
8. **Progressions-Gates klein halten.** AV nutzt Level 10/30/50 als Gates; ohne belegte XP-Kurve sollten wir das Gate-Prinzip übernehmen, die Kurve aber selbst auslegen [O/HIGH AV-S9, AV-S18].
9. **Auto-Skip/Auto-Upgrade früh liefern.** AV hat beides (Wave-Skip erzwungen im Infinite seit 2025-12-08, Auto-Upgrade mit Priorität 1-6); beide sind starke Komfortfunktionen für Wiederholungs-Grind [O/HIGH AV-S19, AV-S16].
10. **Leaderboard-/Gold-Caps von Anfang an.** AV führte erst nachträglich Tageslimits für Gold (100k/Tag) und entfernte Infinite-Leaderboards [O/HIGH AV-S19]; Exploit-Schutz früh einplanen.
