# Katalog: Fähigkeits-Muster aus sieben Tower-Defense-Spielen

Material für eigene Units. Eigene Namen, eigene Werte; Spielnamen aus den Quellen dienen nur als Beleg. Kennzeichnung wie in den Quelldateien: `[Herkunft/Sicherheit Quelle]` (O = beobachtet, D = abgeleitet, R = Rekonstruktion, DESIGN = Vorschlag von uns). Quellen: `docs/anime-adventures/` (S72 Wiki, S65/S67 Datenmodule, `data/units.json`), `docs/games/{btd6,astd,anime-vanguards,anime-last-stand,utdz,anime-expeditions}/` (Kürzel BTD-, ASTD-, AV-, ALS-, UTDZ-, AE-). Kürzel Spiele: AA = Anime Adventures.

Simulator-Maßstab (`sim/`, im Bau): Single/Circle/Cone/Line-AoE, Slow, Stun mit CC-Sperre, Burn/Bleed/Poison, Schild, Regen, Rüstung/Pen, Crits, Schadens-Aura, Farm, aktive Fähigkeiten „Flächen-Stun“ und „True-Damage-Nuke“. Alles andere: „nein (neu)“ mit Aufwand S (Stunden bis 1 Tag), M (einige Tage), L (Woche+).

Netz-Recherche: 2 Suchen (Multitool), kaum belastbare Spielermeinungen. Beliebtheit daher meist UNKNOWN oder aus den Wiki-Befunden der Quelldateien abgeleitet.

## Übersicht

| # | Muster | Simulator kann es? | Aufwand | Balance-Risiko |
|---|---|---|---|---|
| 1 | Zeitstopp | teilweise (Flächen-Stun); global + Wave-Timer-Stopp nein (neu) | S-M | hoch |
| 2 | Ketten-Blitz | nein (neu) | M | mittel |
| 3 | Beschwörung | nein (neu) | L | mittel |
| 4 | Buff-Aura (Damage/Range/SPA) | Damage-Aura ja; Range/SPA nein (neu) | S | mittel |
| 5 | Geldfarm mit Twist | Farm ja; Twist nein (neu) | S-M | mittel |
| 6 | Verwandlung / Angriffswechsel | nein (neu) | M | niedrig |
| 7 | Stacking-Passiv | nein (neu) | S-M | hoch ohne Cap |
| 8 | Execute | nein (neu) | S | mittel |
| 9 | Markieren / Verwundbar | nein (neu) | S | mittel |
| 10 | Rückstoß / Rewind | nein (neu) | M | hoch |
| 11 | DoT-Detonation | Burn/Bleed/Poison ja; Detonation nein (neu) | S-M | mittel |
| 12 | Base-Heal / Leben-Rückgabe | nein (neu) | S | niedrig |
| 13 | Globaler Ult, langer Cooldown | True-Damage-Nuke ja; Rest nein | S | mittel |
| 14 | Unit-Opfer / Merge | nein (neu) | L | hoch |
| 15 | Pfad-Fallen / Minen | nein (neu) | M | mittel |
| 16 | Kosten-/Beute-Hebel (Kostensenkung, Kopfgeld) | nein (neu) | S | mittel |

## Muster im Detail

### 1. Zeitstopp

| Feld | Inhalt |
|---|---|
| Mechanik | Gegner stehen still; Ziel danach kurz immun gegen erneuten Stopp. Als Ult (global) oder als kleine Flächenversion. |
| Beispiele | ASTD: Timestop (Mysterious X, Flare Lord) bis 10 s, danach 10 s Immunität; Ultimate Timestop 30 bis 60 s [O/HIGH ASTD-S26]. AA: Fähigkeiten 2 s pro Angriff, 4 s (CD 42 s), 8 s global (CD 60 s), 20 s global inkl. Spawn-/Wave-Timer-Stopp [O/HIGH S72]. ALS: Aura Farmer stoppt Gegner 100 s [O/HIGH ALS-S9]. UTDZ: Timestop = Stun plus x1,2 Schaden währenddessen [O/HIGH UTDZ-S13]. AV: Time Stop = Hard CC 1, 20 s Sperre [O/HIGH AV-S11]. |
| Typische Werte | 2 bis 10 s lokal; 8 bis 20 s global; CD 42 bis 60 s (AA), 500 s global (ASTD); Sperre danach 10 bis 20 s. |
| Balance-Risiko | Dauer-Stun, wenn keine Sperre: AA hatte bis Update 8 stapelbaren Stun, danach Sperrgruppe [O/HIGH S72]. 100-s-Stopp (ALS) macht Waves zum Nicht-Spiel. Bosse oft ausgenommen oder verkürzt (BTD6 Stun je Klasse 1 bis 3 s) [O/MEDIUM BTD-S14]. |
| Beliebtheit | UNKNOWN (kein Spielerbeleg); als eigene Rolle „Stall“ in Tierlisten geführt [O/MEDIUM ALS-S18]. |
| Simulator | Flächen-Stun ja. Global, Stopp von Wave-Timer, Schaden-Bonus im Stopp: nein (neu), S-M. |

### 2. Ketten-Blitz

| Feld | Inhalt |
|---|---|
| Mechanik | Treffer springt auf weitere Gegner, je Sprung schwächer; oft mit kurzem Stun. |
| Beispiele | AE: Electricity = Stun 1 s + Kette auf bis zu 3 Gegner à 0,15x Schaden, CD 0 [O/HIGH AE-S6]; Lightning God trifft die 10 stärksten Gegner [O/HIGH AE-S7]. AV: Demon Leader Chain-Passive (Verkettung von Einheiten, nicht Gegnern) [O/HIGH AV-S3]. |
| Typische Werte | 3 bis 10 Ziele; 0,15x Schaden je Sprung; Stun 1 s. |
| Balance-Risiko | Kette mit Stun und CD 0 ist Dauer-CC auf Gruppen; AE hängt Stun an Sperre 5 s. Schaden skaliert mit Gegnerdichte (Wave-Clear). |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Zielsuche der nächsten Nachbarn plus Dämpfung, M. |

### 3. Beschwörung

| Feld | Inhalt |
|---|---|
| Mechanik | Unit erzeugt Verbündete mit HP, die auf dem Pfad laufen/blocken; verschwinden bei 0 HP. |
| Beispiele | AA: Summoner spawnen an der Basis und laufen den Pfad rückwärts; HP steigen mit Unit-Level (x9,2 bei L100) [O/HIGH S72]. ASTD: Summon-Gesamtschaden = Summon-HP [O/HIGH ASTD-S6]. AE: Toy Maker spawnt auf allen Pfaden in Reichweite, HP = 100 % des Unit-Schadens, geteilt durch Pfadzahl, Limit 1 [O/HIGH AE-S7]. ALS: Shadow General, Ant King u. a. als Einträge [O/MEDIUM ALS-S17]. |
| Typische Werte | HP an Unit-Schaden gekoppelt (AE) oder Level (AA); Limit 1 bis 3 Summoner. |
| Balance-Risiko | Summon-HP als Schaden-Äquivalent ist einfach zu balancen; Entity-Zahl und Pathing sind der Aufwand. Summons umgehen Typfilter (ASTD-Ausnahme bei Powerful) [O/HIGH ASTD-S25]. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): bewegliche Verbündete, Gegner-Blocking, Kampf, L. Billigere Variante: Summon als „Schadens-Budget“ ohne Bewegung (DESIGN), M. |

### 4. Buff-Aura

| Feld | Inhalt |
|---|---|
| Mechanik | Verbündete in Reichweite erhalten Damage, Range, SPA oder Crit; Stacking-Regeln begrenzen. |
| Beispiele | BTD6: Dorf +10 % Range, Jungle Drums +15 % Speed [O/HIGH BTD-S15]. AE: The Hero +5 % Damage je Upgrade für Physical-Units [O/HIGH AE-S7]. AV: Ice Queen -2 % SPA und +2 % Damage je Verbündetem, Cap 20 %; Amplifier +30 % wirksame Buffs [O/HIGH AV-S3, AV-S18]. AA: Motivate +15 % Damage oder +10 % Range für 10 s, gleiche Effekte stapeln nicht [O/HIGH S72]; `aura_buff` damage_add 0,1 [O/HIGH S65]. ALS: Buffer mit +120 % Damage, -45 % SPA [O/MEDIUM ALS-S18]. |
| Typische Werte | +5 bis +30 % im Normalfall; ALS über +100 %; Caps 20 bis 35 %. |
| Balance-Risiko | Buffs über 100 % entwerten Basiswerte; UTDZ: Faktor 50 bis 100 zwischen Basis und Endwert durch Multiplikatoren [D/LOW UTDZ-S14]. „Pro Kategorie nur höchster Buff“ (UTDZ) oder „gleiche Effekte stapeln nicht“ (AA) ist die Standardlösung [O/MEDIUM UTDZ-S9]. |
| Beliebtheit | UNKNOWN; ASTD-Guides empfehlen feste Rollen „Farm, DPS, Buffer, Support“ [O/HIGH ASTD-S9]. |
| Simulator | Damage-Aura ja. Range- oder SPA-Aura: nein (neu), S. |

### 5. Geldfarm mit Twist

| Feld | Inhalt |
|---|---|
| Mechanik | Unit erzeugt Geld pro Wave/Runde; Twist koppelt Ertrag an Risiko, Position, Upgrades oder Aktion. |
| Beispiele | ASTD: Jeff (CEO) 195 -> 287 820 je Welle, unverkäuflich, Limit 1 [O/HIGH ASTD-S13, ASTD-S21]. AA: Farm 200 -> 10 000 Yen je Wave über 6 Stufen [O/HIGH S65]. UTDZ: Smart Investment (+1 % je Stack, Cap 15), +15 % nach jedem Upgrade; Emergency Capsule stunnt eigene Units 5 s für +5 % je Unit, kostet aber die ganze Wave-Auszahlung, wenn beim Start noch gestunnt [O/HIGH UTDZ-S7; O/MEDIUM UTDZ-S14]. BTD6: IMF Loan (Kredit, 90 s CD) [O/HIGH BTD-S14]; Spieler raten oft ab, Banana Farm/Monkey-Nomics seien stabiler [O/LOW Reddit r/btd6, 2023]. AE: Ramen Guy, Verkauf nur 10 % [O/HIGH AE-S7]. |
| Typische Werte | Payback 1,3 bis 3,5 Wellen je Stufe (ASTD), 14 bis 23 Runden (BTD6), Gesamtamortisation 3,9 Waves (UTDZ) [D ASTD-S13, BTD-S13, UTDZ-S14]. |
| Balance-Risiko | Farm-Meta-Verengung: Jeff/Idol/Pizza Girl immer empfohlen [O/MEDIUM ASTD-S13]. Ohne Limit/Sperre Farm-Stacking. Farm-Fenster begrenzen (ASTD-Stage stoppt ca. Welle 10 bis 12) [O/MEDIUM ASTD-S9]. |
| Beliebtheit | Hoch als Pflichtrolle, aber als Einheitsbrei kritisiert; sonst UNKNOWN. |
| Simulator | Farm ja. Twist (Risiko-Auszahlung, Kredit, Stack-Wachstum): nein (neu), S-M. |

### 6. Verwandlung / Angriffswechsel

| Feld | Inhalt |
|---|---|
| Mechanik | Ab Upgrade-Stufe oder nach Bedingung wechselt die Unit Angriff, AoE-Form, Typ oder gar Gestalt. |
| Beispiele | AV: Demon Hybrid (Chainsaw) wechselt Voll-AoE, Kreis 10, Kegel 90 Grad, Voll-AoE je Stufe [O/HIGH AV-S3]; Evolution mit mehr Stufen und neuen Moves. AA: Upgrades mit `primary_attack` wechseln oft die AoE-Form [O/HIGH S65]. AE: 8th Sword Berserk-Modus nach 25 Takedowns [O/HIGH AE-S7]; Elf Mage Damage +68 % bei Stufe 6 [D/HIGH AE-S7]. ASTD: Evil Shade ab Upgrade 6 Hybrid [O/HIGH ASTD-S23]. |
| Typische Werte | 1 bis 3 Wechselstufen je Unit; Damage-Sprung bis +68 %. |
| Balance-Risiko | Spieler optimieren nur noch auf Wechselstufen, Preis-Leistung springt [R/LOW AE-S7]. Besser: Wechsel als ganze Zeile in der Upgrade-Tabelle, nicht Zusatzlogik. |
| Beliebtheit | UNKNOWN; Evolutionspfade gelten als Langzeitziel [O/MEDIUM ASTD-S10]. |
| Simulator | nein (neu): Upgrade ersetzt Angriffsdefinition; Daten-getrieben, M. |

### 7. Stacking-Passiv

| Feld | Inhalt |
|---|---|
| Mechanik | Wert wächst pro Treffer, Kill, Wave oder verlangsamtem Gegner; Cap oder Reset begrenzen. |
| Beispiele | AA: Battlelust +5 % je Treffer, Cap +25 %, Reset ohne Treffer; Snatched +3 % je Angriff, Cap 33 %, 90 s; Sunshine +9 %/+4,5 % Range je Wave, Cap 15 Waves; Curse Stack bei 4 Stacks +200 % True Damage, Reset [O/HIGH S72]. UTDZ: Eternal +5 % Damage und +2,5 % Range je Wave bis +60 %/+30 %; Pebble +0,5 % je Knockback bis 40 % [O/HIGH UTDZ-S13; O/MEDIUM UTDZ-S14]. AV: Gilgamesh +1 % je Angriff, Cap 35 %; Demon Leader +2 % je Chain, Cap 50 % [O/HIGH AV-S11, AV-S3]. BTD6: Skywarden Intervall sinkt mit Folgetreffern, 1,5 -> 1,0 s [O/HIGH BTD-S15]. |
| Typische Werte | Caps +20 bis +60 %; Reset-Regel fast immer vorhanden. |
| Balance-Risiko | Ohne Cap exponentiell (AV: Bleed/Burn „stackt unendlich“; ASTD Update 48 senkte DoT bei Single-Placement auf 25 % wegen Stacking-Dominanz) [O/HIGH AV-S11, ASTD-S6]. Wave-gebundene Stacks belohnen Passivität. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Zähler je Unit mit Cap/Reset, S-M. |

### 8. Execute

| Feld | Inhalt |
|---|---|
| Mechanik | Nicht-Boss-Gegner unter X % HP sterben sofort. |
| Beispiele | AV: Gilgamesh (Enuma Elish) Nicht-Boss unter 10 % HP; Lich King, Roku (Dark) [O/HIGH AV-S11, AV-S3]. |
| Typische Werte | 10 % HP-Schwelle; Bosse ausgenommen. |
| Balance-Risiko | Gegen Massen-Gegner mit wenig HP irrelevant, gegen Elite übermäßig. Boss-Ausnahme ist Pflicht. Zusammenspiel mit Regen: Schwelle wird je Tick neu geprüft. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Schwellenprüfung nach Schaden, S. |

### 9. Markieren / Verwundbar

| Feld | Inhalt |
|---|---|
| Mechanik | Ziel erhält Marke: mehr erhaltener Schaden (global oder je Typ), oft mit Cap und Cooldown. |
| Beispiele | AE: Puppet Mark alle 15 s auf stärksten Gegner, +20 % Schaden 15 s, ApplyCap 3, CD 10 s; Drink Mark +10 % Follow-up [O/HIGH AE-S6, AE-S7]. AA: Cursed +15/30 % Magic, Dismembered +20/25 % Physical, Exposed (ALS) +50 % aller Quellen [O/HIGH S72; O/MEDIUM ALS-S18]. ASTD: Debuff +15 % (240 s), Fear +10 %, Judgement +8 % von allem [O/HIGH ASTD-S26]. |
| Typische Werte | +8 bis +30 % (Ausreißer +50 %), Dauer 15 bis 240 s. |
| Balance-Risiko | Multiplikativ mit Buffs und Crits sprengt Schaden; AA: Schwäche additiv (1 + Σ) als Gegenmittel [O/HIGH S72]. Marken mit ApplyCap/CD verhindern Dauerstapeln. |
| Beliebtheit | UNKNOWN; als Support-Rolle etabliert. |
| Simulator | nein (neu): Debuff „erhaltener Schaden x“; Rüstung/Pen existiert, aber nicht als Marke, S. |

### 10. Rückstoß / Rewind

| Feld | Inhalt |
|---|---|
| Mechanik | Gegner werden auf dem Pfad zurückgeschoben oder laufen rückwärts. |
| Beispiele | AA: Knockback CD 30 bis 31 s; Rewind/Confused 5 s alle Gegner in Range; Chrono Reversal 5 s rückwärts plus 100 % Schaden, nicht auf Bosse [O/HIGH S72]. AV: Repulse 3 Tiers, Bosse nur Special Repulse, 25 s Lockout [O/HIGH AV-S11]. AE: Rewind 3 s zurück, ApplyCap 10 [O/HIGH AE-S6]. ASTD: Rewind einmalig je Gegner; Replacement/Erasure teleportiert auf letzte Kurve(n) [O/HIGH ASTD-S26]. BTD6: Knockback 0,1 s, 300 % Slow [O/MEDIUM BTD-S14]. UTDZ: Pebble [O/MEDIUM UTDZ-S14]. |
| Typische Werte | 3 bis 5 s Rücklauf; Sperre 25 bis 31 s; einmalig je Gegner (ASTD). |
| Balance-Risiko | Ohne Sperre Dauer-Zurück (Gegner kommt nie an). Freeplay-Resistenz in BTD6: Knockback/Stun verlieren bis 50 % [O/HIGH BTD-S4]. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Pfadfortschritt rückwärts, Sperrgruppe; CC-Sperre existiert, M. |

### 11. DoT-Detonation

| Feld | Inhalt |
|---|---|
| Mechanik | Aufgebaute DoT-Stacks oder Marke explodieren und zahlen den Rest sofort aus. |
| Beispiele | AE: Crimson Mark explodiert nach 5 s mit 15 % des aktuellen Schadens, CD 10 s; Bio Gel Slow 60 %, bei Ablauf Stun 3 s [O/HIGH AE-S6]. AA: Bleed Amplification x3 bis x5 aus allen Bleed-Quellen; OverCrit garantierter Crit gegen Blutende; Hivemind periodische Explosion (x3, x5) [O/MEDIUM S72; O/HIGH S72]. ASTD: Stoke Burn x1,5; Status = Vielfaches des Treffers (Bleed x4, Burn x6, Rupture x12, Black Flame x20) [O/HIGH ASTD-S26]. |
| Typische Werte | DoT als Vielfaches des Treffers, 3 bis 20x; Detonation 15 % bis 100 % des Restwerts. |
| Balance-Risiko | AV/AA: DoTs stapeln unendlich, Wither unbegrenzt [O/HIGH S72]. Detonation macht Burst auf Elite-Gegnern. Armored sperrt DoT (ASTD) [O/HIGH ASTD-S8]. |
| Beliebtheit | UNKNOWN. |
| Simulator | Burn/Bleed/Poison ja. Detonation/Verstärker: nein (neu), S-M. |

### 12. Base-Heal / Leben-Rückgabe

| Feld | Inhalt |
|---|---|
| Mechanik | Unit heilt die Basis je Wave oder bei Auslösung; Overheal möglich. |
| Beispiele | AA: Healer 3 bis 5 % Base-HP pro Wave (vorher 25 HP); Overheal über Maximum [O/HIGH S72; O/MEDIUM S72]. ASTD: Heal-Units je Welle (Boo, TBOI, Path, Ramsay, Wish), Base Protection [O/MEDIUM ASTD-S6]. |
| Typische Werte | 3 bis 5 % Max-HP je Wave. |
| Balance-Risiko | AA senkte Healer auf Prozent-Basis (Update 9): feste HP skalieren nicht. Heilung kann Lose-Condition aushebeln; Cap oder Overheal-Verbot nötig. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Basis-HP-Event bei Wave-Ende, S. |

### 13. Globaler Ult mit langem Cooldown

| Feld | Inhalt |
|---|---|
| Mechanik | Manuelle oder automatische Fähigkeit, wirkt auf ganze Map oder stärkstes Ziel; CD von Minuten. |
| Beispiele | ALS: Boku „Brutal Beatdown“ CD 250 s, Supreme Kamehameha 750 s (100x Schaden auf stärksten Gegner), Aura Farmer Giant Pillar Smash 1500 s global [O/HIGH ALS-S8, ALS-S9]. ASTD: Nuke Esper Rage 9,5 Mrd., Ultimate Timestop CD 500 s [O/MEDIUM ASTD-S9; O/HIGH ASTD-S26]. UTDZ: Sasku Kirin +250 % für einen Angriff, CD 60 s [O/HIGH UTDZ-S4]. BTD6: Fan Club 50 s CD/15 s Dauer; IMF Loan 90 s, max. 2 je Runde [O/HIGH BTD-S14]. AA: Auto-Auslösung seit Update 13.5; Cooldown nur durch Curses beeinflusst [O/HIGH S72]. |
| Typische Werte | CD 50 bis 60 s (kurz), 250 bis 750 s (Ult), 1500 s (ALS-Extrem). |
| Balance-Risiko | Ult-Schaden dominiert Endgame (ALS: 2,4 Mrd. Basisschaden); ASTD kritisiert Auto-Click-Zwang, Lösung: Auto-Ability-Button [O/MEDIUM ASTD-S9]. Globale CDs (alle Exemplare) verhindern Stapeln. |
| Beliebtheit | UNKNOWN; als „Highlight-Moment“ nicht belegt. |
| Simulator | True-Damage-Nuke ja. Globaler/geteilter CD, Auto-Cast: nein (neu), S. |

### 14. Unit-Opfer / Merge

| Feld | Inhalt |
|---|---|
| Mechanik | Unit verbraucht sich oder Verbündete (Verkauf/Löschen) für Buff, Kostensenkung oder Fusion zweier Units. |
| Beispiele | AV: Iscanur, Trash Gamer, Demon Leader verkaufen/löschen sich oder Verbündete [O/HIGH AV-S11]. UTDZ: Synchro durch Fusion zweier Units [O/MEDIUM UTDZ-S3]. BTD6: Sun-Temple-Sacrifice (Werte UNKNOWN) [O/MEDIUM BTD-S3]. |
| Typische Werte | UNKNOWN (keine Zahlen erhoben). |
| Balance-Risiko | Sell-Exploits und Kreisläufe (Opfern, neu setzen); ASTD macht Schlüssel-Units unverkäuflich, BTD6 Sell 70 % [O/HIGH ASTD-S13, BTD-S9]. Wertverlust muss sichtbar sein. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Platzierungs-/Verkaufslogik im Kampf, L. |

### 15. Pfad-Fallen / Minen

| Feld | Inhalt |
|---|---|
| Mechanik | Unit legt begrenzte Fallen/Blocker auf dem Pfad, die bei Kontakt wirken. |
| Beispiele | UTDZ: Zorus legt bis 3 Fallen: Stun 3 s, Radiation 20 %/10 s, Confusion 3 s [O/HIGH UTDZ-S6; O/MEDIUM UTDZ-S14]. AE: Lady Giant Stone Wall alle 15 s, Kapazität 2, HP 75/50 % des Schadens [O/HIGH AE-S6, AE-S7]. BTD6: Spike Factory (Letzte Verteidigung, 1,75 s, Pierce 5 je Spike); Engineer Bloon Trap [O/HIGH BTD-S15, BTD-S3]. |
| Typische Werte | 2 bis 3 Fallen gleichzeitig; Nachlade 15 s; Effekt Stun 3 s. |
| Balance-Risiko | Fallen vor Spawn stapeln CC; Kapazität und Nachladezeit begrenzen. Boss-Immunität nötig. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Pfad-Position als Auslöser, M. |

### 16. Kosten-/Beute-Hebel (Kostensenkung, Kopfgeld, „Debuff-Kosten“)

| Feld | Inhalt |
|---|---|
| Mechanik | Unit senkt Platzierkosten oder macht markierte Gegner lukrativer (mehr Geld bei Kill). |
| Beispiele | AV: Lich King, Demon Hunter, Giant Queen als Kostenreduzierer; Demon Leader -10 % Platzierkosten je verkettete Einheit (bis 10) [O/HIGH AV-S11, AV-S3]. ASTD: Leader-Geldbonus +5 bis 20 % [O/HIGH ASTD-S16]; Kill-Geld existiert, Betrag UNKNOWN [O/LOW ASTD-S9]. AE: Karten „Blood Money“, „Bounty Hunter“ (Werte UNKNOWN) [O/LOW AE-S5]. „Markierte Gegner geben mehr Geld“ ist als Fähigkeit in den Quellen nicht belegt: UNKNOWN. |
| Typische Werte | -10 % je Kette (Cap 10 Einheiten) = bis -100 % (AV); +5 bis 20 % Geldbonus. |
| Balance-Risiko | -100 % Kosten (AV) ist de facto gratis; Boni müssen auf eine Basis wirken, nicht kumulieren (BTD6 Impoppable-Preisstapel-Bug v37) [O/HIGH BTD-S12]. Kopfgeld koppelt Debuff und Ökonomie: Marke + Kopfgeld kann Farm ersetzen. |
| Beliebtheit | UNKNOWN. |
| Simulator | nein (neu): Kosten-Modifikator und Kill-Reward-Faktor, S. |

## Top-8-Empfehlung für unsere ersten Units [DESIGN]

Bewertung: Spaß (Spielgefühl), Aufwand (Sim + UI), Risiko (Balance). Reihenfolge nach Gesamteindruck; nur Vorschlag, keine Quellenaussage.

| Rang | Unit-Idee (Muster) | Spaß | Aufwand | Risiko | Begründung / Schutzregel |
|---|---|---|---|---|---|
| 1 | Flächen-Stopper (Muster 1, Flächen-Stun) | hoch | niedrig (Sim kann es) | mittel | CC-Sperre je Ziel nach Ende (AA/AE-Vorbild: Stun 2 s, Sperre 5 bis 10 s); Bosse verkürzt. |
| 2 | Nuke-Caster (Muster 13, True-Damage-Nuke) | hoch | niedrig | mittel | Langer CD (z. B. 60 bis 250 s), Limit 1, Schaden an Ziel-HP kappen (Boss-Cap). |
| 3 | Brenner/Blutung (Muster 11, DoT ohne Detonation) | mittel | niedrig | niedrig | DoT als Vielfaches des Treffers (ASTD-Regel), Stack-Cap pro Ziel. |
| 4 | Schadens-Banner (Muster 4, Damage-Aura) | mittel | niedrig | niedrig | Pro Kategorie nur höchster Buff, Cap +30 %. |
| 5 | Farm-Unit mit leichtem Twist (Muster 5) | mittel | niedrig bis mittel | mittel | Limit 1 bis 2, Payback 2 bis 3 Waves je Stufe, Twist: Ertrag steigt mit Upgrade-Zahl der Nachbarn (DESIGN). |
| 6 | Henker (Muster 8, Execute unter 10 %) | hoch | niedrig (S) | mittel | Nicht-Boss, mit Cooldown je Ziel; Sim-Erweiterung ist klein. |
| 7 | Markierer (Muster 9, +15 bis 20 % erhaltener Schaden) | mittel | niedrig (S) | mittel | ApplyCap 3 und CD 10 s (AE-Vorbild), nur ein Mark-Effekt je Ziel. |
| 8 | Wachsender Kämpfer (Muster 7, Stacking mit Cap) | hoch | niedrig bis mittel | hoch ohne Cap | Cap +25 bis +35 %, Reset ohne Treffer (AA-Battlelust-Vorbild). |

Nicht für die erste Runde: Beschwörung, Opfer/Merge (L), Rückstoß/Rewind (hohes Dauer-CC-Risiko, M), Pfad-Fallen (M). Zurückgestellt: Kosten-Hebel (S, aber heikles Ökonomie-Risiko), Base-Heal (S, sobald Basis-HP-Event existiert), Ketten-Blitz (M, gut als zweite Welle).

## Querschnitt-Lehren [DESIGN, abgeleitet aus den Quellen]

- Jeder CC braucht Sperre nach Ablauf (AA 10 bis 14 s Stun, AV 6/20 s, AE 5 s, ASTD 10 s Timestop-Immunität) und eine Boss-Regel.
- Jeder wachsende Wert braucht Cap und Reset (AA, UTDZ, AV: Caps 20 bis 60 %).
- Effektstärke als Vielfaches des Treffers definieren (ASTD), damit eine Schadenszahl je Unit genügt.
- Gleiche Effekte stapeln nicht, verschiedene schon (AA/ASTD).
- Zahlenspanne klein halten (ASTD: zwölf Größenordnungen sind unlesbar) [R/MEDIUM ASTD-S9].
