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
