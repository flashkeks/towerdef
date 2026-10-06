# Mechaniken BTD6

Kennzeichnung `[Herkunft/Sicherheit Quelle]`; Quellen in [sources.md](sources.md). Nicht untersucht oder nicht belegt: `UNKNOWN`.

## 1. Platzierung

| Aspekt | Regel | Quelle |
|---|---|---|
| Raster oder frei | frei platzierbar; Kollision über Footprint (Größenklassen in Spieleinheiten: sehr klein 3, klein 6, mittel 7, mittelgroß 8, groß 9, sehr groß 11; Farm 30, Ace 28×18, Heli 27) [O/MEDIUM] | BTD-S14, BTD-S15 |
| Verbotene Flächen | Pfad/Track und Hindernisse; Footprint darf andere Tower nicht überlappen [O/MEDIUM: allgemein bekannt, Detailregel nicht im Wiki-Kopf belegt] | UNKNOWN-Detail |
| Wasser | Monkey Sub und Buccaneer nur auf Wasser; Mermonkey und Ice Monkey auf Land und Wasser (Mermonkey Reichweite 28 Land / 35 Wasser) [O/HIGH] | BTD-S14, BTD-S15 |
| Hügel/Höhe | UNKNOWN (nicht untersucht) | – |
| Fluggeräte | Ace und Heli bewegen sich frei; „dummy range“ nur zur Platzierung (Ace 22, Heli 22, Mortar 30 Anzeige) [O/HIGH] | BTD-S15 |
| Limit je Tower | in Standardmodi kein Typ-Limit; in Challenges/Odysseys über Regeln limitierbar (gesperrte Tower werden beim Verkauf wieder frei) [O/MEDIUM] | BTD-S9 |
| Gesamtlimit | kein festes Limit außer Platz [R/LOW: nicht belegt] ; Paragon: pro Spiel nur eines (Mehrfach-Exploit wurde in v32 gepatcht) [O/MEDIUM] | BTD-S2 Trivia/S4 |
| Helden | pro Spieler 1 Held; Level-Aufstieg per XP, keine Kosten [O/MEDIUM BTD-S14] | BTD-S14 |

## 2. Targeting-Modi (genaue Regeln)

Standard in BTD6: vier Prioritäten, Default ist First [O/HIGH BTD-S8].

| Modus | Regel | Quelle |
|---|---|---|
| First | greift den Bloon an, der in Reichweite am weitesten auf der Strecke vorangekommen ist [O/HIGH] | BTD-S8 |
| Last | greift den Bloon an, der in Reichweite dem Start der Strecke am nächsten ist [O/HIGH] | BTD-S8 |
| Close | greift den Bloon an, der dem Tower am nächsten ist [O/HIGH] | BTD-S8 |
| Strong | greift nach Typ-Rangliste (nicht nach verbleibenden HP) an; bei gleichem Rang der zuerst gefundene Bloon [O/HIGH] | BTD-S8 |

Strong-Rangliste, stark → schwach [O/HIGH BTD-S8]: Boss-Bloons, Fortified BAD, BAD, Fortified DDT, DDT, Fortified ZOMG, ZOMG, Fortified BFB, BFB, Fortified MOAB, MOAB, Fortified Keramik, Keramik, Regenbogen, Fortified Blei, Zebra oder Blei, Lila oder Weiß oder Schwarz, Pink, Gelb, Grün, Blau, Rot. (Rock Bloons des Dreadbloon-Bosses stehen ganz oben.) Bei Bloons mit mehreren HP spielen die HP keine Rolle.

Sonderfälle [O/HIGH BTD-S8]:

| Tower | Besonderheit |
|---|---|
| Camo Prioritization | Ninja und viele Camo-Upgrades können Camo-Bloons vor Nicht-Camo bevorzugen (umschaltbar) |
| Sniper | „Elite“ (nach Elite Sniper): zuerst Keramik, dann Strong-Logik; Bloons nahe dem Ausgang haben Vorrang (wie First) |
| Mortar | „Set Target“: fester Zielpunkt, Schüsse streuen zufällig; im Datendump ±18 Einheiten [O/MEDIUM BTD-S14] |
| Dartling | „Normal“ folgt der Maus, „Locked“ fixiert die Richtung; Bloon Area Denial System und Bloon Exclusion Zone haben „Target Independent“ (Läufe wechseln First/Last/Close/Strong) |
| Spike Factory | ab Smart Spikes: Normal, Close, Far, Smart, Automatic, Set Target |
| Heli | Follow Mouse/Touch, Lock in Place, Patrol, Pursuit |
| Ace | Flugbahn statt Targeting: Kreis, Acht, Unendlich, Centered Path, Wingmonkey |
| Tack Shooter, Banana Farm, Dorf, Ice (ohne Cryo Cannon) | kein Targeting (Ice: Close-ähnlich fest); Tack ab Inferno Ring wählbar |
| Super Monkey Robo-Stufe+ | zwei Arme mit unterschiedlichen Prioritäten |
| Held Benjamin | zufällig; Etienne ab Level 7/11 verteilt Drohnen auf First/Strong bzw. First/Strong/Last/Close |

## 3. Angriffszyklus, Treffer, AoE

- Angriffsintervall wird in Sekunden angegeben (z. B. Dart 0,95 s, Super Monkey 0,045 s). Upgrades multiplizieren den Intervall (Quick Shots 85 %, Very Quick Shots ~78,8 %, Fan Club 75 %); Dorf-Jungle-Drums gibt +15 % Angriffsgeschwindigkeit, Dorf-Basis +10 % Reichweite [O/HIGH BTD-S14, BTD-S15].
- Treffer-Bestimmung: Projektile haben Pierce = Anzahl getroffener Bloons und verschwinden danach (z. B. Dart 2, Boomerang 4, Bomb 22, Ice 40). Ein Treffer richtet `damage` am äußersten Layer an. Zusatzschaden gegen Typklassen existiert („cd“ = Keramik, „md“ = MOAB-Klasse, „fd“ = Fortified, im Datendump je Upgrade) [O/HIGH BTD-S14].
- Sniper: unendliche Reichweite, 2 Schaden, Pierce 1, 1,59 s [O/HIGH BTD-S15]; Dartling: unendliche Reichweite, 0,2 s [O/HIGH BTD-S15].
- Streu- und AoE-Formen [O/HIGH BTD-S14, BTD-S15]: 8-Wege-Radial (Tack, Ace-Salve), Schrotflinte (Druid 5 Dornen mit Zufallsstreuung), Explosion mit Radius (Bomb, Mortar Radius 20), Zone um den Tower (Ice, Radius 20), Dartling-Kegel (Zufall innerhalb 23° um den Zielpunkt), Pfützen (Alchemist Splash Radius 14).
- Projektile folgen Kurven (Boomerang), prallen ab (Dart-Spike-o-pult, Juggernaut), homing (Sub moderat).
- Kinder-Spawn: platzt ein Layer, entstehen die Kinder (siehe [enemies-waves.md](enemies-waves.md)); Schaden und Statuseffekte der MOAB-Klasse werden grundsätzlich nicht an die Kinder durchgereicht (Ausnahmen: Spezialattacken wie Ground Zero, Bloon Trojan) [O/HIGH BTD-S16].

## 4. Schadensarten und Immunitäten

| Eigenschaft des Bloons | Wirkung | Quelle |
|---|---|---|
| Schwarz | Properties im Datendump: „black“ (immun gegen Explosion, Standardwissen) | BTD-S5 [O/MEDIUM] |
| Weiß | immun gegen Kälte/Einfrieren (Ice-Beschreibung: „Can't freeze White, Zebra, or Lead“) | BTD-S15 [O/HIGH] |
| Blei | immun gegen scharfe Treffer (Sharp) (Properties „lead“; Ice kann Blei nicht einfrieren) | BTD-S5, BTD-S15 [O/MEDIUM] |
| Lila | Properties „purple“ (immun gegen Feuer/Energie/Plasma, Standardwissen) | BTD-S5 [O/MEDIUM] |
| Zebra | Black + White | BTD-S5 [O/HIGH] |
| DDT | Properties Lead + Black, Kinder sind Camo+Regrow-Keramik | BTD-S5 [O/HIGH] |
| Gefrorene Bloons | immun gegen Sharp (Ice-Beschreibung) | BTD-S15 [O/HIGH] |
| Camo | nur Tower mit Camo-Detektion können angreifen (Ninja, Spike Factory standardmäßig; sonst über Upgrades/Dorf Radar) | BTD-S15 [O/HIGH] |
| MOAB-Klasse | Eigenschaften Camo/Regrow nicht erwerbbar (DDT nur Camo); stark resistent gegen schwache Statuseffekte; Glue/Freeze wirken nur mit Spezial-Upgrades halb so lang | BTD-S16 [O/HIGH] |

Schadensarten im Datendump: sharp, explosion, cold, energy, fire, acid, plasma, shatter, normal, passive [O/HIGH BTD-S14, BTD-S15]. Eine allgemeine Schadensformel (Rüstung, Prozent) gibt es nicht; Schaden ist additiv (+1d, +2cd …). Crits: UNKNOWN (nicht untersucht).

## 5. Statuseffekte (Stärke, Dauer, Stacking)

| Effekt | Wert | Quelle |
|---|---|---|
| Freeze (Ice) | 1,5 s, zerstört keine Layer sofort; Frozen Bloons immun gegen Sharp; kann nicht auf Blimps (ohne Spezial-Upgrade) | BTD-S15 [O/HIGH] |
| Glue (Standard) | 50 % Verlangsamung, 11 s, „soaks“ 3 Layer; zählt nicht auf Blimps; Tower zielt nicht auf bereits geleimte Bloons gleicher oder höherer Stufe | BTD-S14, BTD-S15 [O/HIGH] |
| Glue (Level-17-Geraldo-Item) | 55 % Verlangsamung, 37,5 % bei Blimps (Beispiel für Blimp-Skalierung) | BTD-S14 [O/MEDIUM] |
| Burn (Chilli-Monster Beispiel) | 1 Schaden / 1,5 s, 3,1 s | BTD-S14 [O/MEDIUM] |
| Stun | Dauer je Bloon-Klasse (Idol Level 12: MOAB 3 s, BFB 2 s, ZOMG/DDT 1 s) | BTD-S14 [O/MEDIUM] |
| Knockback | 0,1 s, 300 % Slow für normale Bloons, 150 % für Blei/Keramik (Juggernaut) | BTD-S14 [O/MEDIUM] |
| Stacking | UNKNOWN allgemein; belegt nur „stärkere Stufe überschreibt“ beim Glue und „Fortified-Variante hat Priorität bei Strong“ |
| Freeplay-Resistenz | Stun, Bloon Sabotage, Snowstorm, Knockback verlieren Dauer: R150–199 −10 %, R200–249 −20 %, R250–299 −30 %, R300–349 −40 %, R350+ −50 % [O/HIGH BTD-S4] | BTD-S4 |

## 6. Fähigkeiten

- Aktive Fähigkeiten (Beispiele): Super Monkey Fan Club (Dart): 50 s Abklingzeit, 15 s Dauer; Quincy Rapid Shot: 60 s, 3,5 s [O/HIGH BTD-S14]; IMF Loan (Farm) 90 s, max. 2 je Runde; Monkey-Nomics Grant 60 s, max. 2 je Runde [O/HIGH BTD-S14].
- Aktive Abilities hängen an hohen Stufen (Beispiele: Farm IMF Loan T4 Pfad 2, Dart Fan Club T4 Pfad 2); Ability-Cooldown-Regeln und Stacking in Co-Op: UNKNOWN (nicht untersucht).
- Auren: Dorf +10 % Reichweite, Jungle Drums +15 % Speed, Radar (Camo-Sicht), Intelligence Bureau (alle Tower können alle Bloon-Typen treffen) [O/HIGH BTD-S15]; Caps: UNKNOWN (nicht untersucht).

## 7. Upgrade-Struktur

- Jeder Tower hat 3 Pfade × 5 Stufen [O/HIGH BTD-S1, BTD-S13].
- Crosspath-Regel: höchstens zwei Pfade dürfen Upgrades haben; ein Pfad bis Stufe 5, der zweite bis Stufe 2, der dritte bleibt 0 (x-x-2-Schreibweise der Infoboxen) [R/HIGH: Regel aus Spielwissen; indirekt belegt durch Infobox-Notationen „(x-x-2)“, „5-x-x“ und Datendump-Eintrag „502 caltrops“ in BTD-S14].
- Paragons: Zehn laut Preismodul (Dart 150000, Boomerang 375000, Bomb 650000, Tack 200000, Buccaneer 550000, Ace 900000, Wizard 800000, Ninja 500000, Spike Factory 750000, Engineer 600000, Medium) [O/HIGH BTD-S13]. Voraussetzungen und „Degree“-System: UNKNOWN (nicht abgerufen). Das Wiki sagt, dass sie vor Runde 90+ praktisch nicht bezahlbar sind [O/HIGH BTD-S4]; ein „Paragon Power Totem“ (Geraldo Level 20) gibt 2000 Power [O/MEDIUM BTD-S14].
- Helden: 14 im Datendump, 17 laut Store; je 20 Level mit eigenen Upgrades und 2 Fähigkeiten [V/CONFIRMED BTD-S1]; XP je Level (Differenzen, Hero-XP-Faktor 1,0 beim Basis-Held): L2 180, L3 460, L4 1000, L5 1860, L6 3280, L7 5180, L8 8320, L9 9380, L10 13620, L11 16380, L12 14400, L13 16650, L14 14940, L15 16380, L16 17820, L17 19260, L18 20700, L19 16470, L20 17280 [O/MEDIUM BTD-S14; Werte als Tabelle ohne erkennbare Kumulierung gelesen; ob Differenz oder Schwelle: R/LOW].
- Monkey Knowledge: 100+ permanente Meta-Upgrades (siehe [meta.md](meta.md)) [V/CONFIRMED BTD-S1].
