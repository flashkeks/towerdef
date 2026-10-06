# Known Unknowns & Conflicts

Diese Lücken werden **nicht** durch Annahmen geschlossen. Wo der Nachbau einen Wert braucht, steht ein klar markierter `DESIGN`-Default in [technical-reconstruction.md](technical-reconstruction.md#design-defaults-bis-aa-daten-vorliegen).

## A. Widersprüchliche Werte

| # | Thema | Werte | Quellen | Bewertung / Vermutung |
|---|---|---|---|---|
| C1 | Standard-Raten-Summe | 81,9 + 16 + 2 + 0,25 = **100,15 %** | S01 | Rundung bzw. Tippfehler; Rare vermutlich 81,75 % |
| C2 | Rare-Rate | 81,9 % vs. **27,3 %** („in beiden Bannern“) | S01 vs. S27 | 27,3 % passt nicht zu den anderen Raten; RR-Änderung oder Fehler. **Klären.** |
| C3 | Mythic-Pity-Reset | Reset bei jedem Mythic (S51) vs. „garantierter Featured-Center“ (S01) | S01, S51 | Featured-Pity wahrscheinlicher. **Klären.** |
| C4 | Event-Banner-Mythic-Rate | LEGACY 0,5 % vs. RR 0,25 % | S01 vs. S43 | Versionsänderung; beide dokumentiert |
| C5 | Sell-Rate | 25 % (Captain, Wind Dragon) vs. 30 % (C.E.O.) | S28, S29, S31 | unit- oder raritätsabhängig; Regel UNKNOWN |
| C6 | Infinite-Gem-Maximum | 497 laut Quelle vs. 490–495 nachgerechnet | S06 | Bereichsangaben überlappen (7–15 / 15–100), 101–104 fehlt |
| C7 | Trait-Summe | 99,93 % | S47 | Rundung oder 0,07 % Restklasse („kein Trait“?) |
| C8 | Story-Gems | 75/15 (alt) vs. 80/20 (neu) | S23 | Versionsänderung; Zeitpunkt („Update X“) UNKNOWN |
| C9 | Fiery-Commander-Spannen | Placement/U1 ×2,1, U2/U3 ×2,0 | S34 | Rundung in der Suchzusammenfassung wahrscheinlich |
| C10 | „Short Range: 2/3 shorter“, „Mini Range: 1/4 shorter“ | ×(1−2/3) oder ×2/3? | S15 | Sprachlich mehrdeutig; ×2/3 bzw. ×3/4 plausibler |
| C11 | Commander-Upgrades | 6 Stufen, aber nur 5 Kosten gelistet | S30 | fehlende Stufe = 4.000 (DERIVED aus Total); Position unklar |
| C12 | Weltnamen | LEGACY ↔ RR-Mapping für Positionen 11, 12, 15, 18, 19 | S07, S45 | über Reihenfolge rekonstruiert; LOW–MEDIUM |
| C13 | Shiny-/Secret-Level-Anforderung | „ab Level 20“ | Suchauszug | möglicherweise anderes Spiel bzw. RR-only |

## B. Fehlende Daten (wichtigste zuerst)

| # | Lücke | Bedeutung für den Nachbau |
|---|---|---|
| U1 | **Start-Yen, Kill-Yen, Wave-Yen** | Kern-Ökonomie → DESIGN-Default |
| U2 | **Gegner-HP, -Speed, -Rewards** pro Gegner und Stage | Kern-Balancing → DESIGN |
| U3 | **Wave-Tabellen** (Zusammensetzung, Anzahl, Intervalle) | DESIGN-Generator |
| U4 | **Base HP und Leak-Schaden** | DESIGN |
| U5 | **HP-Scaling** (Story, Hard-Multiplikator, Infinite, Party) | DESIGN |
| U6 | Vollständige **Unit-Datenblätter** (alle Units × alle Upgrades) | nur Kurvenformen aus 11 Units |
| U7 | **Typ-Matchup-Multiplikatoren** (Schwäche/Resistenz), Tank-Reduktion, Regen-Rate, Fast-Multiplikator | DESIGN |
| U8 | **Level-Kurve** zwischen L1 und L100 und XP-Kurve | Anker L100 = 9,204× |
| U9 | **Potential-Verteilung** abhängig von Worthiness; SPA/Range-Ränge zwischen den Endpunkten | Modell RECONSTRUCTED · LOW |
| U10 | Vollständige Targeting-Modus-Liste | First/Strongest belegt |
| U11 | Attack-Windup, Hit-Timing, Multi-Hit-Verteilung | DESIGN |
| U12 | Circle-AoE-Zentrum (Ziel vs. Unit), Line/Cone-Länge | RECONSTRUCTED |
| U13 | Buff-Stacking-Regeln jenseits der Erwin/Wendy/Leafy-Mechanik | teilweise belegt |
| U14 | Multi-Summon (10×)-Preis bzw. Rabatt | – |
| U15 | Umverteilung der Raten im Special Banner (0,25 % → 0,5 % Mythic) | – |
| U16 | Trait-Tier-Wahrscheinlichkeiten (I/II/III) | – |
| U17 | Shiny-Entfernung: Remnant-Menge | – |
| U18 | Curse-Wertverteilung | – |
| U19 | Relic-Slots, vollständige Relic-Liste | – |
| U20 | Portal-Drop- und Secret-Portal-Chancen, Tier-Scaling | – |
| U21 | Max. Spieler (Story/Infinite/Raid), Rejoin/AFK-Verhalten | – |
| U22 | Map-Geometrie (Pfade, Hügel, Zonen) | eigene Maps nötig |
| U23 | Gold-Shop-Preise, Merchant-Itempool und -Gewichte | – |
| U24 | Battle-Pass-Inhalte pro Tier, Premium-Preis | – |
| U25 | Achievements, Tutorial, Login-Reward-Tabelle | – |
| U26 | Unit-IDs | intern bei Roblox, nicht öffentlich |
| U27 | Raid-Level-Anforderungen, Party-Größen, vollständige Raid-Belohnungen | – |
| U28 | Infinity-Castle-Raumdesign und Belohnungen; Tournament-Wertung | – |

## C. Historische Änderungen (Versionstrennung)

| Thema | LEGACY | RR | Tag |
|---|---|---|---|
| Unit- und Weltnamen | Anime-Namen bzw. leichte Parodien (Planet Namak …) | Reskins und stärkere Umbenennung (Planet Greenie …) | OBSERVED · HIGH |
| Event-Banner | 0,5 % Mythic, 3 Limited Mythics | 0,25 % Mythic, 0,249 % Mythic-Skin, Secret 1 : 80.000; Event-Währung | OBSERVED · MEDIUM |
| Legacy-Banner | – | neu: Legacy Gems, Legacy-Units | OBSERVED · MEDIUM |
| Time Machine | aktiv | deaktiviert ab 19.5 | OBSERVED · HIGH |
| Unit-Level-Cap | 70 → 80 → 90 → 100 (U2–U5), +LB 110 | UNKNOWN | OBSERVED · HIGH |
| Trading | U6 Skins → U8 Limited Units; Level 40 ab U12 | UNKNOWN | OBSERVED · HIGH |
| Raid-Tickets | nötig bis 10.7.5 | – | OBSERVED · MEDIUM |
| Daily-Raid-Limit | begrenzt bis U12 | – | OBSERVED · HIGH |
| Story-Gems | 75/15 | 80/20 (Zeitpunkt UNKNOWN) | OBSERVED · MEDIUM |
| Lobby | alte Lobby | komplett neu | OBSERVED · HIGH |

## D. Nur beobachtete bzw. nicht reproduzierbare Mechaniken

- „Infinite 100 % Buff“ über einen Pentagram-Loop oder einen SPA-Curse (Community-Technik, nicht offiziell) [S44]
- Worthiness 100 % ⇒ alle Stats ≥ B+ (Forenaussage) [S48, S59]
- Limit Break „permanenter 15-%-Buff“ (einzelner Forenpost) [S59]
- Star-Golem-Spawn-Chance (nur „hat eine Chance“)

## E. Unbekannte Backend-Logik

- RNG-Implementierung (serverseitig; Seeds, Unabhängigkeit der Züge)
- Speicherung und Übertragbarkeit der Pity zwischen Rotationen
- Banner-Rotation global oder pro Spieler (stündlich belegt, Scope UNKNOWN)
- Anti-Cheat-Mechanismen, Trade-Validierung („besserer Deal“-Bestimmung)
- Daily-Reset-Zeitpunkt und Zeitzone

## F. Verworfene Daten

Siehe [sources.md](sources.md#explizit-verworfene-daten). Die Infinite-HP-Formel „+15 %/Wave“ stammt aus Anime Defenders und ist für AA **nicht** verwendet.

## G. Korrekturen am Bestand

Änderungen gegenüber Sitzung 1 (Such-Auszüge), festgestellt beim Abgleich mit den Volltextquellen der Sitzung 2.

| Paket | Alte Aussage | Neuer Stand | Quelle |
|---|---|---|---|
| P3 | Wiki-Spannen „Damage ×2,1, Range ×1,2, SPA ×0,9“: Bedeutung UNKNOWN | Buff-Overlays der Wiki-Infobox: Damage ×2 (+100 % Commander-/Sky-Enchantment-Buff) + ×0,1 (Aura) **additiv** = ×2,1; Range ×1,2 und SPA ×0,9 (Kisuke-Typ-Buff). Kein Stat-Roll | S72 (Template Stats Box) |
| P3 | Level 100 ≈ 9,204× | exakt **9,20406501834430488** (Wiki-Template-Konstante) | S72 |
| P3 | Captain „evolvesTo: captain_timeskip, captain_god“ | falsch: Captain (`usopp`, Rare) hat keine Evolution. Captain (Timeskip/God) ist eine eigene Mythic-Linie (`usopp_ts`) | S65 |
| P3 | C5 Sell-Rate 25 % vs. 30 % | 509 von 510 Unit-Seiten nennen 25 %; nur die C.E.O.-Seite nennt 30 % → Standard **25 %**; C.E.O. sehr wahrscheinlich Seitenfehler (MEDIUM) | S72 |
| P3 | C11 Commander-Upgrade 4.000 „DERIVED, Position unklar“ | belegt: Stufe 4 kostet 4.000 (Reihe 1.000 / 1.500 / 2.000 / 4.000 / 5.500 / 7.000) | S65 |
| P3 | Spawn Caps der Beispiel-Units überwiegend UNKNOWN | vollständig belegt (z. B. Captain 6, Bulby 1, Commander/Wind Dragon 6 global, Honey 5) | S65 |
| P3 | „12 Datenblätter“ | 561 Einträge, vollständig | S65 |
| P1 | Place-ID Re-Release = 117965110267191 (OBSERVED · HIGH · S60) | 117965110267191 ist eine separate Teaser-Place („[❓RETURN???] Anime Adventures“, Universe 6930929888, Gruppe „Gomu Development“ 34564273, erstellt 2024-12-17). Das RR-Spiel läuft auf der Original-Place 8304191830 (Universe 3183403065) | S74, S78 (neu, Roblox-API) |
| P1 | Entwickler „Gomu (Roblox-Gruppe)“ ohne ID | Gruppe „Gomu“, ID 10611639 | S74 |
| P1 | Update 1.5 „–“ (ohne Inhalt) | Update 1.5 (2022-07-24): erste Raids, Banner-Tiers 0/1/2, Shiny entfernen | S72:Update Log |
| P1 | Update 1 fehlte | Update 1 (2022-07-15): Marine's Ford, Level-Cap 60 u. a. | S72:Update Log |
| P1 | Update 3 = erste Flying-Gegner, Leaderboard-Unit (S45, S05) | Update 3 (2022-08-19) laut Log: Hollow World, Cap 80, Unit-Lock, Infinite-Autosave, Leaderboard-Unit; „erste Flying-Gegner“ steht nicht im Log (Trello U3-Stand nennt Fly bereits) → nicht belegt, entfernt | S72:Update Log, S73 |
| P1 | Update 8: „Trading nur noch für Limited Units, Skins, einige Relics“ | Update 8 (2022-12-21) **führt** Unit-Trading und Gifting erst ein; Relics handelbar seit U10.5; Liste „Skins, Limited, Lulu, Limited Relics“ gilt laut Trading-Seite ab U11.7.5 | S72:Update Log, S72:Trading |
| P1 | Update 10: Alien Portal | Alien Portal laut Portals-Seite „Release Update 10“; im Update-Log selbst nicht erwähnt (nur Welt Alien Spaceship, Tournaments) – Angabe bleibt, Quelle S72:Portals | S72:Portals, S72:Update Log |
| P1 | Update 10.7.5: „Raid-Tickets nicht mehr nötig“ (MEDIUM, S08) | bestätigt (Log: „Raids system has been revamped“, Raids-Seite: keine Tickets mehr, Rückerstattung) → HIGH | S72:Raids, S72:Update Log |
| P1 | Update 11: Welt Fabled Kingdom (ohne Datum) | 2023-02-25; zusätzlich Einführung Stat Potential | S72:Update Log |
| P1 | Update 13.5: Witch Portal, Demon Academy Portal | Demon Academy Portal kam mit Update 12.05 (April Fools, 2023-04-01); 13.5 (2023-05-26) = Witch City, Event Banner, Portal-Replay, Armor-Gegner | S72:Update Log, S72:Titles |
| P1 | Update 17 „Fate Update“ ohne Datum | 2023-09-30; außerdem Buffs addieren statt multiplizieren, Special-Banner-Bereinigung | S72:Update Log |
| P1 | Update 19.5: Time Machine deaktiviert (als Update-Inhalt) | Time-Machine-Seite widersprüchlich: „As of Update 19.5 … disabled“ und „From update 19.0 … temporary disable“. 19.5 selbst = 2025-02-01, Assassin Contracts | S72:Time Machine, S72:Update Log |
| P1 | Update 20: Welt Shibuya (MEDIUM, S07/S53) | bestätigt, Datum 2025-03-09, dazu Modus Dungeon → HIGH | S72:Update Log |
| P1 | „2026: April-Fools-Event/Banner (Code APRILFOOLS)“ | April Fools **2025** = Update 20.4.1 „Fool's Hunt“ (ca. April 2025) | S72:Events, S72:Update Log |
| P1 | Systemlandkarte: Achievements UNKNOWN | Kein Achievement-Menü, aber Titles (U9), Trophies, Level Milestones erfüllen die Funktion | S72:Titles, S72:Level Milestones, S72:Update Log |
| P1 | Team = 6 Slots (Core Loop, RECONSTRUCTED · HIGH) | Slotzahl levelabhängig (U14), Maximum nicht belegt → UNKNOWN, 6 nur Community-Konsens (LOW) | S72:Update Log, S72:Store |
| P1 | Trading: handelbar u. a. Reroll Tokens | bestätigt (Terminology: „tradable item“) | S72:Terminology |
| P1 | Shiny „1 % pro Summon, rein kosmetisch“ | bestätigt; ×3 mit Shiny Hunter; erst ab Banner-Tier 1 (Level 5) | S72:Summon, S75, S73 |
| P1 | Settings: nur 3 Einträge | 11 belegte Settings mit Update-Zuordnung | S72:Update Log |


## H. Paketbefunde (Sitzung 2)

Konflikte, Lücken und erledigte Einträge aus den Paketen der Sitzung 2. Die älteren Abschnitte A–F werden in P12 konsolidiert.

### P1

#### Neu / Konflikte

| ID-Vorschlag | Thema | Wert A | Wert B | Status |
|---|---|---|---|---|
| P1-K1 | Luck-Boost-Dev-Products | Trello (LEGACY 2022-08): Super Lucky 1,5× / 20 min, Ultra Lucky 2× / 15 min, additiv 2,5× [S73] | Wiki-Store: Super 2×, Ultra 3× Legendary/Mythic-Rate „für ein Banner“ [S72:Store]; U10.5: „counted per banner“ | Versionswechsel wahrscheinlich (U10.5); RR-Wert VER? |
| P1-K2 | Daily-Infinite-Gems (W10/25/50) | Trello: 30/70/100 [S73]; Wiki-Trivia „früher 10/25/50“ | Wiki aktuell: 90/180/330 [S72:Infinite] | Zeitpunkt der Erhöhung („Update X“) UNKNOWN; U20.4.1 Daily Infinite 50 → 40 Waves |
| P1-K3 | Time Machine Abschaltung | „As of Update 19.5 … disabled“ | „From update 19.0 … temporary disable“ (gleiche Seite) | UNKNOWN, ob U19 oder U19.5 |
| P1-K4 | Events-Tab „Halloween 2024“ | Wiki listet ein Halloween-2024-Event (Candies, Spooky Star) | RR startete erst 2024-12-25; Title [Spooky] „Nightmare Hunt during Halloween 2023 or Christmas 2024“, U19: „Halloween Event here to stay a bit longer“ | wohl Halloween-2023-Event, im RR weiterbetrieben, falsch beschriftet; RECONSTRUCTED · MEDIUM |
| P1-K5 | VIP-Vorteile | LEGACY: 2× Time-Machine-Gems [S73, S72:Store] | RR (offiziell): −20 % Summon, Nametag, +10 % Player-XP [S75] | Versionsunterschied, kein Konflikt |

#### Weiterhin fehlend

- Inhalt des Roblox-Updates vom 2025-09-03 (API) und alles nach Update 20.4.1: kein Wiki-Log.
- Exaktes Datum von Update 20.4.1 (nur „ca. April 2025“) und von Update 13 (nur „May 2023“).
- Loadout-Slots je Spieler-Level und Maximalzahl (Bestand: 6 = Community-Konsens).
- Player-XP-Kurve, Spieler-Level-Cap.
- Trade-Level vor Update 12.
- Unlock-Level für Raids, Portals, Challenges, Infinity Castle, Tournaments.
- Tutorial / Starter-Ablauf: keine Quelle.
- Unit-Level-Cap bei Release (vor U1 = 60).
- Basis-Unit-Inventar (DERIVED 100 aus Gold-Upgrade-Stufen, LOW).
- Partygröße in Story/Infinite (Server-Max 30 ist nicht die Partygröße).

#### Erledigt / teilweise erledigt

- **U25 (Achievements, Tutorial, Login)** teilweise: Achievements → Titles (U9), Trophies, Level Milestones (S72:Titles, S72:Level Milestones). Tutorial bleibt UNKNOWN. Login: Holiday-Kalender (U19), 1-Mrd.-Login-Event (U13), Dungeon-Key täglich per Login (U20); Tabelle weiter UNKNOWN.
- RR-Place-ID geklärt: Spiel = 8304191830, 117965110267191 = Teaser (S74, S78).
- Update-Zeitleiste vollständig aus S72:Update Log (Release bis 20.4.1, 45 Einträge mit Daten).
