# Multiplayer, Trading, Leaderboards

## Multiplayer

| Aspekt | Wert | Tag |
|---|---|---|
| Koop | Spieler können zusammen Stages spielen oder solo | VERIFIED · CONFIRMED · [S42] |
| Max Players (Story/Infinite) | **UNKNOWN** (Community-Konsens 4, nicht belegt) | UNKNOWN |
| Max Players Secret Portal | **6** | OBSERVED · HIGH · [S10] |
| Party/Lobby | Physische Lobby-Räume („chambers“ im Play-Bereich): Spieler betreten einen Raum, der Ersteller wählt die Stage, Start nach Timer oder Start-Button | OBSERVED · MEDIUM · [S48] (Noble Portal Guide) + RECONSTRUCTED |
| Matchmaking | Kein automatisches Matchmaking belegt. Man joint offenen Räumen bzw. Portalen anderer Spieler | RECONSTRUCTED · MEDIUM |
| Host | Bei Portalen der Spieler, der das Portal einsetzt (100 % vs. 5 % Secret-Chance) | OBSERVED · HIGH · [S10] |
| Shared Map / Waves | gemeinsame Map und gemeinsame Waves | RECONSTRUCTED · HIGH |
| Individual Units / Yen | jeder Spieler hat eigenes Team und eigene Yen | RECONSTRUCTED · MEDIUM |
| Individual Rewards | jeder bekommt eigene Drops und Gems (Ausnahme: Host-Vorteil bei Secret Portals) | RECONSTRUCTED · MEDIUM |
| Enemy-HP-Scaling | steigt mit Spielerzahl | OBSERVED · HIGH · [S06] |
| Unit-Limit | Spawn Cap pro Spieler (nicht pro Party) | RECONSTRUCTED · MEDIUM |
| Buff-Interaktion | Buffs wirken auf Units in Range, vermutlich auch auf die Units anderer Spieler | UNKNOWN |
| Disconnect | Infinite speichert Gems und Wave-Fortschritt automatisch | OBSERVED · HIGH · [S06] |
| Rejoin / AFK-Verhalten | **UNKNOWN** | UNKNOWN |
| Performance | Setting „Effekte anderer Spieler ausblenden“ (Update 2) | OBSERVED · HIGH · [S45] |

## Trading

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | Update 6 (Skins); Units folgten später | OBSERVED · HIGH · [S45] |
| Level-Anforderung | **40** (seit Update 12 gesenkt; vorher höher, Wert UNKNOWN) | VERIFIED · CONFIRMED · [S19, S45] |
| Handelbar | **Limited Units** (rote „Limited“-Markierung), **Skins**, **Limited Relics**, **Reroll Tokens** | OBSERVED · HIGH · [S19] |
| Nicht handelbar | normale (summonbare) Units, Battle-Pass-Units, Units, die nach dem Platzieren nicht verkaufbar sind | OBSERVED · HIGH · [S19] |
| Trade-Tax | in Gems nach Rarität; zahlt die Seite **„mit dem besseren Deal“** | OBSERVED · HIGH · [S19] |

### Trade-Tax-Tabelle [S19] OBSERVED · HIGH

| Item | Tax (Gems) |
|---|---:|
| Rare Skin | 50 |
| Epic Skin | 100 |
| Legendary Skin | 200 |
| Mythic Skin | 2.000 |
| Mythic Relic | 2.000 |
| Epic Unit | 200 |
| Legendary Unit | 400 |
| Mythic/Secret pre-evolve | 4.000 |
| Mythic/Secret post-evolve | 6.000 |

Wie „besserer Deal“ bestimmt wird, ist **UNKNOWN**. Vermutlich wird die Tax-Summe der jeweils erhaltenen Items verglichen.

### Trade-UI und Anti-Scam (rekonstruiert)

```text
1. Trade-Anfrage an Spieler im selben Server
2. Beide legen Items in ihr Angebotsfeld
3. Änderung am Angebot → beide "Ready"-Status werden zurückgesetzt   (Genre-Standard; AA UNKNOWN)
4. Beide "Accept" → (Countdown?) → Tax-Abzug → atomarer Tausch
```
RECONSTRUCTED · LOW. Trade-Limits pro Tag und ein Unit-Locking sind **UNKNOWN**.

## Leaderboards

| Board | Belohnung | Tag |
|---|---|---|
| Infinite (höchste Wave) | Monatsende: Top 25 → Leaderboard-Unit; Top 10 → Shiny-Version | OBSERVED · HIGH · [S06] |
| Infinity Castle (Raum) | wie oben, saisonal | OBSERVED · HIGH · [S06] |
| Player Level | wie oben | OBSERVED · HIGH · [S06] |
| Tournaments | wöchentliche Brackets | OBSERVED · HIGH · [S45] |
| Reset | „alle paar Monate“ mit neuen Story- oder Castle-Saisons | OBSERVED · MEDIUM |

Friends-System: Roblox-Freunde (Plattform), kein eigenes System belegt.
