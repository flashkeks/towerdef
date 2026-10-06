# Multiplayer, Trading, Leaderboards

Legende: `ART · CONFIDENCE · [Quelle]`, siehe [README.md](README.md#kennzeichnung). `S72:<Seite>` = Wiki-Volltext (Dump), `S72:Update Log (U<n>)` = Patchnote im Wiki-Update-Log zum genannten Update. Versionen: **LEGACY** = U1–U18.5 (Juli 2022 bis Dezember 2023), **RR** = ab U19 (25.12.2024).

> Stand Sitzung 2 (P9): alle Bestandswerte gegen den Wiki-Volltext (S72), die Datenmodule (S65/S66) und den Trello-Export (S73) geprüft. Korrekturen stehen unten bei der jeweiligen Zeile („korrigiert“) und gesammelt in [unknowns.md](unknowns.md#g-korrekturen-am-bestand).

---

## Multiplayer

### Grunddaten

| Aspekt | Wert | Tag |
|---|---|---|
| Koop | Stages können solo oder gemeinsam gespielt werden | VERIFIED · CONFIRMED · [S42]; OBSERVED · HIGH · [S72:Update Log (U19.5) „Go solo or squad up“] |
| Server-Kapazität (Lobby) | **30** Spieler pro Server. Das ist die Roblox-Serverkapazität der Lobby, **nicht** die Gruppengröße einer Partie | VERIFIED · CONFIRMED · [S74] |
| Max. Spieler Story / Infinite / Legend / Raid | **UNKNOWN**. Kein Volltext nennt einen Wert. Der Community-Wert „4“ aus Sitzung 1 ist in keiner Quelle belegt | UNKNOWN |
| Max. Spieler Secret Portal | **6** („hold up to 6 players“) | OBSERVED · HIGH · [S10 → S72:Secret Portal] |
| Max. Spieler Dungeon (Cursed Parade) | „you and **up to 6 others**“, also wörtlich bis 7. Ob 6 oder 7 gemeint ist, bleibt offen | OBSERVED · LOW · [S72:Dungeons] |
| Mindestens 2 Spieler | Es gibt Quests „Clear 10/25/40 waves with at least one other player“ (Multiplayer I–III). Die Partie zählt Spieler also mit | OBSERVED · HIGH · [S72:Quests] |

### Partie bilden: Räume, Portale, Matchmaking

| Weg | Ablauf | Seit | Tag |
|---|---|---|---|
| Play-Bereich (Räume) | In der Lobby führt eine Treppe zum Play-Bereich mit Stage-Räumen. Man betritt einen Raum, der Ersteller wählt die Stage, andere Spieler kommen dazu. Event-Stages liegen „am Ende des Play-Bereichs“ („Find a team and go to the end of Play area“) | LEGACY ab U1 | OBSERVED · MEDIUM · [S48; S72:Update Log (U6.7.5 Halloween), S72:Tournament] + RECONSTRUCTED (Ablauf) |
| Portal öffnen | Der Besitzer setzt ein Portal-Item ein und wird **Host**. Andere Spieler treten bei | LEGACY ab U8 | OBSERVED · HIGH · [S72:Portals, S72:Secret Portal] |
| Contract öffnen | Ein Contract kann als Portal „geöffnet werden, um Leute anzulocken“, **oder** über Matchmaking gespielt werden. Contracts sind das erste Portal-Belohnungssystem mit Matchmaking | RR ab U19.5 | OBSERVED · HIGH · [S72:Contracts] |
| Global Matchmaking (Beta) | Option „Join Global Matchmaking“: automatische Zuordnung zu anderen Spielern | LEGACY U18 (18.11.2023) | OBSERVED · HIGH · [S72:Update Log (U18)] |

**Matchmaking-Abdeckung nach Version:**

| Zeitraum/Version | Modi mit Matchmaking | Quelle |
|---|---|---|
| U1 bis U17.5 (LEGACY) | keins; nur Räume und Portale | RECONSTRUCTED · MEDIUM (erste Erwähnung erst U18) · [S72:Update Log] |
| U18 (18.11.2023) | Infinite, Legend Stages, Halloween-Event | OBSERVED · HIGH · [S72:Update Log (U18)] |
| U18.5 (09.12.2023) | zusätzlich Raids und Daily Challenge | OBSERVED · HIGH · [S72:Update Log (U18.5)] |
| U19 (25.12.2024, RR) | zusätzlich Holiday-Event; „matchmaking improvements“ | OBSERVED · HIGH · [S72:Update Log (U19)] |
| U19.5 (01.02.2025, RR) | zusätzlich Assassin Contracts | OBSERVED · HIGH · [S72:Update Log (U19.5), S72:Contracts] |
| letzter bekannter Stand | Infinite, Legend Stages, Raids, Daily Challenge, Events, Contracts. Story-Acts mit Matchmaking: **UNKNOWN** | – |

Matchmaking-Regeln (Wartezeit, Füllgröße, Kriterien wie Level oder Stage-Fortschritt): **UNKNOWN**.

### Host

| Regel | Wert | Tag |
|---|---|---|
| Wer ist Host? | bei Portalen der Spieler, der das Portal einsetzt | OBSERVED · HIGH · [S10 → S72:Portals] |
| Secret-Unit aus Secret Portal | Host **100 %**, andere Spieler **5 %** (Ice Queen, Katana Devil). Andere Portale: „guaranteed if host“ bzw. „100 % for host“ | OBSERVED · HIGH · [S72:The Ice Queen Portal, S72:The Katana Devil Portal, S72:Portals, S72:Golden King] |
| Item-Drops in Portalen | einige Drops höher für den Host, z. B. Egg of Sacrifice 1–2 (Spieler) gegen 2–4 (Host) | OBSERVED · HIGH · [S72:Portals] |
| Seltene Evo-Items | „Chances are doubled if you happen to be the host“ (u. a. Frozen-Portale, Puppet Island, Eclipse, Noble Portal) | OBSERVED · HIGH · [S72:Items] |
| Portal Replay | Der Host kann ein anderes Portal derselben Gruppe für die Wiederholung wählen | LEGACY U13.5 · OBSERVED · HIGH · [S72:Update Log (U13.5)] |
| Next Level (Story) | Nach dem Sieg wählt der Host das nächste Level. Andere Spieler haben **etwa 10 s**, um zur Lobby zu gehen | LEGACY U10.5 · OBSERVED · HIGH · [S72:Update Log (U10.5)] |
| Replay | „Quickly replay a level without rejoining the lobby“ (mehrere Modi) | LEGACY U7.6 · OBSERVED · HIGH · [S72:Update Log (U7.6)] |
| Host-Wechsel bei Abgang des Hosts | **UNKNOWN** | UNKNOWN |

### Geteilte und getrennte Ressourcen

| Ressource | Geteilt? | Tag |
|---|---|---|
| Map, Pfade, Waves, Gegner | geteilt (alle verteidigen dieselbe Map) | RECONSTRUCTED · HIGH (Genre und Quests „clear waves with another player“) |
| Base-HP | vermutlich geteilt (eine Basis pro Map) | RECONSTRUCTED · MEDIUM |
| Yen | **pro Spieler**. Farm-Units zahlen dem Besitzer („gives the player money“). Golden-Trait: „+20 % Yen“ für die eigene Unit | RECONSTRUCTED · MEDIUM · [S72:Effects, S72:Traits] |
| Team (Units) | pro Spieler; jeder bringt sein eigenes Team mit bis zu 6 Units | OBSERVED · HIGH · [S72:Powerups „up to 6 Limit Broken units equipped“] |
| Belohnungen (Gems, XP, Drops) | pro Spieler. Ausnahmen: Host-Bonus (siehe oben) und Dungeon „Deal the most damage in your team for one extra drop“ | OBSERVED · HIGH · [S72:Update Log (U6.5)] |
| Event-Zufallsunits (April Fools 2025) | „Refund“ wirkt nur auf eigene Units; die Divine-General-Beschwörung ist auf **1 pro Spieler** begrenzt | OBSERVED · MEDIUM · [S72:Events, S72:Shadow Sorcerer (Ritual)] |

### Placement-Limits im Team

Das Datenmodul kennt zwei Arten von Spawn Caps (`spawn_cap`):

| Typ | Datenfeld | Bedeutung | Units | Tag |
|---|---|---|---|---|
| pro Spieler (Normalfall) | `spawn_cap: <n>` | max. n Exemplare dieser Unit **je Spieler** | 557 von 561 Einträgen | OBSERVED · HIGH · [S65] |
| global | `spawn_cap: "6 (Global)"` plus `global_spawn_cap: 6`; in [data/units.json](data/units.json) als `spawnCapGlobal: true` | max. 6 Exemplare **auf der ganzen Map**, über alle Spieler zusammen | Commander (`erwin`), Wind Dragon (`wendy`), Elfy (`leafa`), Elfy (Sylph) (`leafa_evolved`) | OBSERVED · HIGH · [S65, S66] (Feld); RECONSTRUCTED · MEDIUM (Deutung) |

Begründung für die Deutung „über alle Spieler“: Die Wiki-Seiten schreiben, Commander habe früher „maximum of 3 units **per person**“ gehabt und sei auf „6 (global)“ umgestellt worden; Wind Dragon: „Her spawn cap was 3. Now it's 6, and global.“ [S72:Commander, S72:Wind Dragon]. „Global“ steht dort im Gegensatz zu „per person“.

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Commander, Wind Dragon: Spawn Cap | 3 pro Spieler | 6 global | 6 global (Modul 2023-12 und 2026-03 gleich) | S72:Commander, S72:Wind Dragon; S65, S66 |

Weitere Limits mit Teambezug:

- **Unique-Trait:** pro Unit mit Unique-Trait nur 1 Platzierung. OBSERVED · HIGH · [S73 Traits, S72:Traits]. Ob das pro Spieler oder pro Partie gilt: **UNKNOWN** (vermutlich pro Spieler, da Teil des eigenen Unit-Inventars).
- **Beschwörungen:** Violentine (Brutal Angel) hat eine „Global Limit of 10 summons at once“. OBSERVED · HIGH · [S72:Violentine (Brutal Angel)]
- **Gemeinsame Platzierungsgruppen:** Das Modul kennt `_placement_group` (z. B. `femto_placement` für die Griffin-Formen). Units derselben Gruppe teilen sich offenbar ein Limit. OBSERVED · HIGH (Feld) · [S65]; Deutung RECONSTRUCTED · LOW.
- **Gleichzeitiges Platzieren:** „Fixed overlapping units when 2+ people place at same time“ (U1). Platzierungen mehrerer Spieler werden also gegen Überlappung geprüft. OBSERVED · HIGH · [S72:Update Log (U1)]

### Buffs zwischen Spielern

Auren im Datenmodul (`aura_buff`) haben zwei Schalter: `_global` (wirkt auf der ganzen Map statt nur in Range) und `_only_same_player` (nur eigene Units).

| Fall | Datenfeld / Beleg | Wirkt auf andere Spieler? | Tag |
|---|---|---|---|
| Normale Range-Buffs (Commander, Wind Dragon, Blossom …) | `aura_buff` ohne `_global` bzw. Ability mit Range | **UNKNOWN** (kein Volltext sagt es) | UNKNOWN |
| Griffin (Reincarnation): +100 % Damage | `aura_buff {_global: true, damage_add: 1}` | **ja**. Wiki: „buffs ALL units, including other players' units“ | OBSERVED · HIGH · [S65; S72:Damage Affinities Elements] |
| Idol / Idol (Star): Damage-Buff und Upgrade-Kosten −10 % | Modul: `_global: true`, `_only_same_player: true`, `damage_add 0.07`, `cost_add −0.1` | **nein**. Wiki: „the only one who can only affect the user's own units“ | OBSERVED · HIGH · [S65; S72:Idol (Star), S72:Damage Affinities Elements] |
| Limit Break: +5 % Damage je ausgerüsteter Limit-Broken-Unit (max. 6 → +30 %) | Wiki | **nein**. „does not provide a buff to units owned by other players“ | OBSERVED · HIGH · [S72:Powerups] |
| Abilities mit „Global Cooldown“ (z. B. Time Wizard 90 s, Priest (Heaven) 300 s, Operator 75 s) | Wiki-Seiten | ob der Cooldown zwischen Spielern geteilt wird: **UNKNOWN**. Belegt ist nur, dass mehrere Exemplare einer Unit ihn nicht umgehen (Gegenbeispiel Trickster: „not global“, daher verkettbar) | OBSERVED · MEDIUM · [S72:Time Wizard (Chronos), S72:Priest (Heaven), S72:Operator (ROOM), S72:Trickster (Release)] |

Hinweis zum Modul: Die `_only_same_player`-Aura steht im Datensatz `femto_egg` (Griffin (Ascension)) als Upgrade „+ Stage“ mit Effekt-ID `hoshino_buff_fx`. Inhaltlich passt sie zu Idol (Star). Vermutlich ein Pflegefehler im Modul. RECONSTRUCTED · MEDIUM

### Enemy-Skalierung nach Spielerzahl

| Aussage | Stand | Tag |
|---|---|---|
| Gegner-HP steigen mit der Spielerzahl | **nicht belegt**. Sitzung 1 nannte S06 (Infinite); die Infinite-Seite enthält das in keiner Fassung (geprüft: aktuelle Fassung und Rev. 18621 von 2023-06) | UNKNOWN · korrigiert (vorher OBSERVED · HIGH) |
| Base-HP | „Adjusted base HP (now scales with level difficulty)“ (U9). Skaliert mit der Schwierigkeit, nicht mit Spielern | OBSERVED · HIGH · [S72:Update Log (U9)] |

### Disconnect, Rejoin, AFK

| Situation | Verhalten | Version | Tag |
|---|---|---|---|
| Disconnect in Infinite | Gems und Wave-Fortschritt (für das Leaderboard) werden trotzdem gutgeschrieben; Infinite speichert automatisch | LEGACY U3 | OBSERVED · HIGH · [S06 → S72:Update Log (U3)] |
| Verlassen von Infinite mittendrin | Gems werden gutgeschrieben, XP und XP-Items gehen verloren | LEGACY | OBSERVED · HIGH · [S72:Infinite] |
| Time Machine (AFK-Modus) | eigener Server zum AFK-Farmen: +3 Gems je 150 s (VIP oder Premium +6). Gems bleiben nur bei „leave and claim reward“ oder bei einem Kick erhalten, nicht beim manuellen Schließen von Roblox. Autosave seit U1 | LEGACY; deaktiviert ab U19/U19.5 (RR) | OBSERVED · HIGH · [S25 → S72:Time Machine, S72:Update Log (U1)] |
| AFK-Kick | Roblox trennt inaktive Spieler (die Wiki nennt Makro-Tools als Gegenmittel). Ein eigenes AFK-System des Spiels ist nicht belegt | OBSERVED · MEDIUM · [S72:Time Machine] |
| Rejoin in eine laufende Partie | **UNKNOWN** | UNKNOWN |
| Units eines Spielers, der die Partie verlässt | **UNKNOWN** | UNKNOWN |
| „Return to Spawn“-Setting | setzt den Avatar zurück, wenn er in einer Runde feststeckt | LEGACY U12.5 · OBSERVED · HIGH · [S72:Update Log (U12.5)] |

### Performance

| Maßnahme | Version | Tag |
|---|---|---|
| Setting „hide other player effects“ | LEGACY U2 | OBSERVED · HIGH · [S45 → S72:Update Log (U2)] |
| Low-Quality-FX-Setting | LEGACY U4 | OBSERVED · HIGH · [S72:Update Log (U4)] |

---

## Trading

### Zeitachse

| Zeitraum/Version | Änderung | Quelle |
|---|---|---|
| U6 (08.10.2022) | Trading eingeführt, zunächst **nur Skins** („with friends and strangers“) | OBSERVED · HIGH · [S72:Update Log (U6)] |
| U8 (21.12.2022) | Unit-Trading für einige Units; **Gifting**: Geschenke (Gamepass-Gifts) können verschenkt und in Trades gelegt werden | OBSERVED · HIGH · [S72:Update Log (U8)] |
| U10.5 (03.02.2023) | einige Relics handelbar; Battle-Pass-Skip-Tiers verschenkbar | OBSERVED · HIGH · [S72:Update Log (U10.5)] |
| U11.7.5 (18.03.2023) | handelbar: Skins, nicht mehr erhältliche Limited Units (keine Battle-Pass-Units), Lulu, Limited Relics | OBSERVED · HIGH · [S72:Trading] |
| U12 (31.03.2023) | Level-Anforderung auf **40** gesenkt; Gift im Trade entfernt die Tax; Max. Slots **6 → 9** | OBSERVED · HIGH · [S72:Update Log (U12)] |
| U9 bis U20.4.1 | fast jedes Update: „More units have become tradable“ mit Namensliste | OBSERVED · HIGH · [S72:Update Log] |
| RR (U19 ff.) | Trading besteht weiter; jede RR-Patchnote nennt neue handelbare Units | OBSERVED · HIGH · [S72:Update Log (U19, U19.5, U20, U20.4.1)] |

### Regeln

| Aspekt | Wert | Tag |
|---|---|---|
| Level-Anforderung | **40** seit U12. Vorher höher, Wert **UNKNOWN** | OBSERVED · HIGH · [S19 → S72:Trading, S72:Update Log (U12)] |
| Max. Items je Seite | **9** seit U12 (vorher 6). Ob pro Seite oder gesamt: Wortlaut „Maximum amount of units/items in a trade“, Bezug **UNKNOWN** (pro Seite wahrscheinlicher) | OBSERVED · HIGH (Zahl) · [S72:Update Log (U12)] / RECONSTRUCTED · LOW (Bezug) |
| Handelbar | Limited Units (aus der jeweiligen Liste), Skins, einige bzw. Limited Relics, Reroll Tokens, Gifts (Gamepass-Geschenke) | OBSERVED · HIGH · [S72:Trading, S72:Terminology, S72:Update Log (U8, U10.5)] |
| Nicht handelbar | normale Banner-Units, Battle-Pass-Units; nicht-limitierte Varianten ausdrücklich „untradable“ (z. B. Oshy im Special Banner) | OBSERVED · HIGH · [S72:Trading, S72:Update Log (U14)] |
| ~~„Units, die nach dem Platzieren nicht verkaufbar sind“~~ | in keiner Volltextquelle; gestrichen | korrigiert → UNKNOWN |
| Gems handelbar? | nicht als Trade-Item belegt; „Gem gifts“ zählen nicht für die Tax-Befreiung | OBSERVED · MEDIUM · [S72:Update Log (U12)] |
| Unit-Werte im Trade | Units behalten Potential-Ränge (SSS/SS/S …) und Traits. Die Community-Value-List bepreist Stat-Ränge eigens (z. B. SSS DMG ≈ 27 Reroll Tokens) | OBSERVED · MEDIUM · [S72:Value List] (Community-Markt, keine Spielregel) |
| Handelswährung der Community | Reroll Tokens dienen als Werteinheit („base trading value“) | OBSERVED · HIGH · [S72:Terminology] |
| Gesperrte (locked) Units | Locked Units können nicht verkauft werden (U3). Ob sie handelbar sind: **UNKNOWN** | OBSERVED · HIGH · [S72:Update Log (U3)] |

### Trade-Tax [S19 → S72:Trading] OBSERVED · HIGH

„Every trade has a tax that is scaled off the rarity.“

| Item | Tax (Gems) |
|---|---:|
| Rare Skin | 50 |
| Epic Skin | 100 |
| Legendary Skin | 200 |
| Mythic Skin | 2.000 |
| Mythic Relic | 2.000 |
| Epic Unit | 200 |
| Legendary Unit (inkl. Fire Fist, Renzi, Ichi (Full Hollow)) | 400 |
| Mythic/Secret pre-evolve | 4.000 |
| Mythic/Secret post-evolve | 6.000 |

| Regel | Wert | Tag |
|---|---|---|
| Wer zahlt? | **UNKNOWN**. Sitzung 1 schrieb „die Seite mit dem besseren Deal“; das steht in keiner Volltextquelle | UNKNOWN · korrigiert (vorher OBSERVED · HIGH) |
| Tax-Befreiung | „Trading any gift removes all trade tax **for you**“ (Gem-Gifts ausgenommen). Wer ein Gift in den Trade legt, zahlt keine Tax | OBSERVED · HIGH · [S72:Update Log (U12)] |
| Summierung mehrerer Items | **UNKNOWN** (vermutlich Summe der Tax je Item, die man **erhält**) | RECONSTRUCTED · LOW |
| Tax in RR | Tabelle unverändert auf der Seite (letzte Bearbeitung 2025-03), kein RR-Hinweis auf Änderung | OBSERVED · MEDIUM · [S72:Trading] |

### Ablauf, Bestätigung, Anti-Scam

Belegt ist nur: Es gibt einen **Trading-Button** im HUD [S72:Trading (Bildunterschrift „Trading Button“)] und Handel mit „friends and strangers“, also mit jedem Spieler im selben Server [S72:Update Log (U6)].

```text
1. Trading-Button → Spieler im selben Lobby-Server wählen → Anfrage      (Button belegt; Rest RECONSTRUCTED)
2. Beide legen bis zu 9 Items in ihr Angebotsfeld                         (9 belegt, U12)
3. Tax-Anzeige je Seite; Gift im Angebot → eigene Tax 0                   (Regel belegt, Anzeige RECONSTRUCTED)
4. Änderung am Angebot → beide Bestätigungen zurücksetzen                 (Genre-Standard; AA UNKNOWN)
5. Beide bestätigen → (Countdown?) → Gems-Abzug → atomarer Tausch         (RECONSTRUCTED · LOW)
```

Trade-Limits pro Tag, Trade-Cooldowns, Trade-Historie und eine Zweitbestätigung: **UNKNOWN**.

### Für unseren Nachbau (DESIGN)

- Trade-Session serverseitig als Zustandsautomat: `open → editing → locked(A) → locked(A,B) → countdown(3 s) → commit | cancel`. Jede Änderung setzt auf `editing` zurück. DESIGN
- Commit als eine Datenbank-Transaktion: Besitz prüfen, Tax abbuchen, Items tauschen, Log schreiben. DESIGN
- Handelbarkeit als Flag am Unit-Template (`tradable`) und an der Instanz (`locked`, `equipped`). DESIGN

---

## Leaderboards

| Board | Ranglogik | Belohnung | Version | Tag |
|---|---|---|---|---|
| Infinite (je Welt) | höchste Wave; jede Welt hat ein eigenes Board | Monatsende: exklusive Leaderboard-Unit. U1-Beispiel: Top 25 Unit, Top 10 Shiny-Variante. Titel „[Top 50/25/10 Upd #]“ | LEGACY; RR | OBSERVED · HIGH · [S72:Infinite, S72:FAQ, S73 NPCs, S72:Titles] |
| Infinity Castle | seit U10 relativ zu allen Spielern (Perzentil), nicht mehr höchster Raum; Saisons | Perzentil-Stufen mit Gems, Star Remnants, Shiny Unit (siehe [game-modes.md](game-modes.md#infinity-castle-seit-update-6)); Titel Top 50/25/10 | LEGACY ab U6; RR | OBSERVED · HIGH · [S72:Update Log (U10), S72:Infinity Mansion, S72:Titles] |
| Tournament | wöchentlich; zufällige Brackets; Punkte (z. B. „Most DMG“ in Zeitlimit) | Rangbelohnung; Platz 1 im Bracket: Titel „[Tournament # Champion]“ | LEGACY ab U10; RR | OBSERVED · HIGH · [S72:Tournament, S72:Titles] |
| Guild Event | „most damage dealt“, Gildenrang | Gilden-Badges (siehe unten) | LEGACY ab U15 | OBSERVED · HIGH · [S72:Update Log (U15), S72:Guilds] |
| Player Level | **nicht belegt** (Sitzung 1: „wie oben“ mit S06; Infinite-Seite nennt das nicht). Level-Milestones laufen über den Prayer Master im Leaderboard-Bereich, sind aber kein Ranking | UNKNOWN · korrigiert |
| Reset | Infinite: monatlich bzw. bei Infinite-Änderungen (U1: „Leaderboard reset due to infinite changes“). Viele Updates melden „New Infinity Castle, Leaderboard, and Tournament seasons“ | OBSERVED · HIGH · [S72:Infinite, S72:Update Log (U1, U17, U18)] |

Leaderboard-Units werden seit U19 als eigene Rarity **Exclusive** geführt („Exclusive rarity added for leaderboard and tournament units“). OBSERVED · HIGH · [S72:Update Log (U19)]. Bekannte Leaderboard-Units: 13 [S72:Unobtainable Units].

Leaderboard-NPC: Im Leaderboard-Bereich der Lobby holt man Belohnungen beim Leaderboard-NPC ab; dort stehen auch Prayer Master (Level-Milestones) und der Trophy-Shop. OBSERVED · HIGH · [S73 NPCs, S72:Level Milestones, S72:Emotes]

---

## Gilden (seit U15, LEGACY; Beta)

| Aspekt | Wert | Tag |
|---|---|---|
| Erstellen | beim Gilden-NPC im Gildenbereich der Lobby; Beitritt nur per Einladung | OBSERVED · HIGH · [S72:Update Log (U15)] |
| Anpassung | Icon, Farben, Beschreibung, Ankündigung | OBSERVED · HIGH · [S72:Update Log (U15)] |
| Mitglieder | Online-Status sehen, online Mitgliedern beitreten | OBSERVED · HIGH · [S72:Update Log (U15)] |
| Ranking | Guild-Event-Leaderboard nach Schaden; Gildenrang über dem Spielerkopf sichtbar (U18) | OBSERVED · HIGH · [S72:Update Log (U15, U18)] |
| Max. Mitglieder | **UNKNOWN** | UNKNOWN |

Badges nach Gildenrang [S72:Guilds] OBSERVED · HIGH:

| Badge | Rang |
|---|---|
| Master | Top 100 |
| Diamond | 101–999 |
| Plat | 1.000–10.999 |
| Gold | 11.000–25.999 |
| Silver | 26.000–49.999 |
| Bronze | ab 50.000 |

## Weitere soziale Funktionen

| Funktion | Beschreibung | Version | Tag |
|---|---|---|---|
| Emotes | Animationen des Avatars; seit U19 auch auf den eigenen Units. Kauf meist mit Trophies im Trophy-Shop (gratis bis 200 Trophies), einige aus Battle Pass und Events (z. B. 1.000 Event-Bullets). Ausrüsten im Profil-Menü | LEGACY ab U9; RR | OBSERVED · HIGH · [S72:Emotes, S72:Update Log (U9, U19)] |
| Titel | Text über dem Avatar und im Chat. Quellen: Events, Ranglisten, Discord-Rollen, „[OG]“ für Spieler vor RR | LEGACY ab U9; RR | OBSERVED · HIGH · [S72:Titles, S72:Update Log (U9)] |
| Globale Chat-Ansagen | Shiny Mythic und Secret aus dem Summon werden **serverübergreifend** im Chat angekündigt (seit Halloween 2022). Neuer Bestwert im Infinity Castle ebenfalls (U17) | LEGACY | OBSERVED · HIGH · [S72:Summon, S72:Update Log (U17)] |
| Voice-Chat | aktiviert | LEGACY U15.5 | OBSERVED · HIGH · [S72:Update Log (U15.5)] |
| Freunde | Roblox-Freundesliste; kein eigenes Freundesystem belegt | RECONSTRUCTED · MEDIUM |
| Gifting | Gamepass-Gifts an andere Spieler; „Gifts can also be given in trades“ | LEGACY ab U8 | OBSERVED · HIGH · [S72:Update Log (U8)] |

## Für unseren Nachbau (DESIGN)

- `maxPlayers` je Modus als Konfigurationswert. Als Startwert für Portale 6 (AA-belegt); für Story/Infinite einen eigenen Wert wählen, da AA hier UNKNOWN ist. DESIGN
- Spawn-Cap-Scope je Unit-Template: `"player" | "global"` (AA: `global` bei vier Units). Aura-Scope: `range | map` plus `ownerOnly: boolean` (entspricht `_global` / `_only_same_player`). DESIGN
- Yen, Team und Belohnungen pro Spieler; Map, Waves und Base-HP geteilt. DESIGN (auf AA-Befund gestützt)
- Host-Vorteile nur dort, wo der Host einen Verbrauchsgegenstand einsetzt (Portal). DESIGN
