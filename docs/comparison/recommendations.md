# Empfehlungen: Startwerte und Regeln für unser Web-Tower-Defense

**Wichtigstes Ergebnis des Vergleichs.** Konkrete Startwerte für ein Browser-TD mit eigenen Figuren im Anime-Stil, Unit-Sammeln über Gacha (nur Spielwährung) und Koop bis 4 Spieler. Grundlage: [systems-matrix.md](systems-matrix.md) und [numbers.md](numbers.md) (sieben Spiele: AA, BTD6, ASTD, AV, ALS, UTDZ, AE), die Lehren in den `design-lessons.md` der Spielordner, `docs/research/balancing.md` (Faustregeln, selbst nur DESIGN) und `docs/research/legal-gacha.md` (Recht, keine Rechtsberatung). Keine Netzrecherche.

**Etiketten.** Alle eigenen Zahlen sind `DESIGN` (Vorschlag, Startwert zum Testen) und nennen die Herleitung. `D` = abgeleitet mit Rechenweg. Quellen wie in den Spielordnern: `[Herkunft/Sicherheit Quelle]`, z. B. `650 [O/HIGH BTD-S3]`. `UNKNOWN` bleibt sichtbar. Jeder Abschnitt folgt dem Muster „BTD6 macht X, AA macht Y, wir nehmen Z, weil …“; wo andere Spiele eine Lücke von AA schließen, steht auch deren Wert.

**Grundproblem, das die Zahlen lösen müssen:** In AA, ASTD, AV, ALS, UTDZ und AE sind Startgeld, Kill- und Wave-Einkommen sowie Gegner-HP nicht dokumentiert (`docs/STATUS.md`, „Querschnitt“). Belastbare Matchwerte liefert nur BTD6 (`rounds.json`, 140 Runden). Unsere Kurven nehmen darum BTD6 als Struktur (Einkommen folgt der Gegnerstärke, fällt dann stufenweise) und die Roblox-Spiele als Vorlage für Units (Rarity, Limits, lineare Leiter, Farm, Gacha, Traits).

---

## 0. Rahmenannahmen (DESIGN)

| Annahme | Wert | Herleitung |
|---|---|---|
| Standard-Stage | 20 Waves, Wave-Timer 45 s, also ca. 15 min | AA-Events: 50 Waves ≈ 40 min = 48 s je Wave, 30 Waves ≈ 25 min = 50 s [D AA-S72: 2 400/50, 1 500/30]; ASTD-Story 15 Waves [O/MEDIUM ASTD-S14,S15]; AV/ALS-Raids 20 Waves [O/HIGH AV-S12, ALS-S13] |
| Kurz-Stage | 15 Waves (Einstieg), lange Modi 30/50 später | ASTD Story 15; AA-Events 30/50 |
| Spielfeld | Raster, 1 Pfad (spätere Maps 2–3), Pfadlänge ca. 42 Tiles | AA-Map-Laufzeiten 8–36 s, Median 20 s [O/MEDIUM AA-S72]; wir 28 s wegen 4 Spielern |
| Basis-Gegnertempo | Grunt 1,5 Tiles/s → 42/1,5 = 28 s Laufzeit | D |
| Match-Währung | Münzen (M) je Spieler | – |
| Meta-Währungen | nur zwei: Kristalle (Gacha) und Gold (Rerolls, Level-Tränke) | ALS hat über 15 Währungen [O/HIGH ALS-S10]; `balancing.md` §2e: max. 2 Währungen; `legal-gacha.md` §2: CPC „keine Verschleierung durch mehrere Währungsebenen“ [Q9 D/Q10 C dort] |
| Zeitkontrolle | Wave-Skip (Koop: Mehrheit), Spielgeschwindigkeit 1×/2×/3×, Auto-Ability-Schalter | AV Auto-Skip [O/HIGH AV-S19], AA Auto-Activate [O/HIGH AA-S72]; ASTD-Lehre 10 (kein Autoclicker-Zwang); `balancing.md` Q4 (Total Time Control) |

---

## 1. Startgeld

**BTD6** startet in allen Modi mit 650; die billigsten Tower kosten 31–62 % davon, Farm (1 250) und Support liegen darüber [O/HIGH BTD-S3,S15; D, `numbers.md` §3]. **AA** nennt kein Normalmodus-Startgeld (UNKNOWN), nur Contracts mit 5 000 Start [O/MEDIUM AA-S72]; AV „High Class“ 10 000 [O/HIGH AV-S6]; ASTD-Sondermodi 2,3 Mio. bis 1 Mrd. (nicht vergleichbar). **Wir nehmen 1 000 Münzen je Spieler** (`DESIGN`), weil:

| Unit | Platzierung | Anteil am Start | Vergleich |
|---|---:|---:|---|
| Rare | 300 | 0,30 | BTD6 Dart 0,31 [D] |
| Epic | 400 | 0,40 | BTD6 Wizard 0,38, Tack 0,40 [D] |
| Legendary | 650 | 0,65 | BTD6 Ninja/Ice 0,62 [D] |
| Mythic | 1 000 | 1,00 | BTD6 Ace 1,23, Dartling 1,31 [D] |
| Farm (Epic) | 400 | 0,40 | BTD6 Farm 1,92: bei uns schon in Wave 1 kaufbar, weil die Stage nur 20 Waves hat und der Payback 8 Waves beträgt |

- Das Startgeld kauft z. B. 1 Farm + 2 Rare, oder 3 Rare + Reserve, oder 1 Mythic. Damit gibt es von Wave 1 an eine echte Wahl (Farm gegen Verteidigung), wie in ASTD-Guides („Farm vor Welle 1 setzen“) [O/MEDIUM ASTD-S9].
- Kein Sonder-Startgeld je Schwierigkeit (BTD6: gleiches Startgeld, nur Kostenfaktor/Leben ändern sich [O/HIGH BTD-S10–S12]).
- Skalierung: nur über Modifier-Karten (AV „High Class“ +10 000 und +40 % Einkommen [O/HIGH AV-S6]) später möglich.

---

## 2. Leben (Base-HP) und Leak-Schaden

**BTD6:** 200 / 150 / 100 / 1 Leben; ein Leak kostet den RBE des Bloons, ein Keramik-Leak (104) beendet Hard [O/HIGH BTD-S10–S12,S7]. **AA:** Base-HP und Leak-Schaden UNKNOWN; DESIGN-Default der AA-Doku: 100 Base-HP, Leak normal 1–5, Boss 20–100 [AA:technical-reconstruction]; Healer 3–5 % Base-HP je Wave [O/HIGH AA-S72]. **Wir nehmen** (`DESIGN`):

| Größe | Wert | Herleitung |
|---|---|---|
| Base-HP | 100, geteilt im Koop | BTD6 Hard 100; AA-Default 100 |
| Leak Grunt / Runner / Splitter-Kind | 1 | AA-Default 1–5 |
| Leak Flyer / Splitter (Eltern) | 2 | |
| Leak Brute | 3 | |
| Leak Elite (Mini-Boss) | 10 | |
| Leak Boss | 50 (zwei Boss-Leaks beenden die Stage) | AA-Default bis 100; BTD6-Lehre: kein Ein-Treffer-Ende [O/HIGH BTD-S10] |
| Heilung | Support-Unit „Heiler“ +4 HP je Wave (= 4 % von 100), nie über 100 | AA 3–5 % je Wave [O/HIGH AA-S72] |
| Niederlage | Base-HP ≤ 0 | AA/ALS [O/HIGH ALS-S2] |
| Keine Bounty für Leaks | ein geleakter Gegner zahlt nichts | BTD6 (Pop-Cash nur für gepoppte Bloons) |

Schwierigkeiten ändern die Base-HP nicht (BTD6 nutzt Leben als Schwierigkeitshebel; wir nehmen HP/Speed, siehe §4).

---

## 3. Einkommen (je Kill, je Wave)

**BTD6:** Pop-Cash 1 je Layer plus Rundenbonus `100 + Runde`, ohne Steuer [O/HIGH BTD-S3]; das Einkommen je Runde liegt in R1–40 bei 0,19–0,80 × Startgeld, R1–40 kumuliert 25,9 × Start; Pop-Cash je Gegner-HP (RBE) fällt durch Steuerstufen von 1,0 (R1–40) auf 0,59 (R41–60), 0,14 (R61–80), 0,05 (R81–100) [D, `numbers.md` §2]. **AA:** Kill-/Wave-/Boss-Yen existieren, Werte UNKNOWN; AA-DESIGN-Default `Wave-Yen = 200 + 100·w`, `Kill-Yen = 5 + floor(HP/10)` [AA:technical-reconstruction]; Contracts 2 500–5 000 je Runde [O/MEDIUM AA-S72]. **ASTD/AV/ALS/UTDZ/AE:** UNKNOWN. **Wir nehmen** (`DESIGN`), die BTD6-Struktur „Bonus plus HP-gebundener Kill-Cash mit fallender Rate“:

```text
Wave-Bonus W(n)  = 100 + 5·n                         (jeder Spieler, nach Wave-Ende)
Kill-Bounty(e)   = round( γ(n) · HP_basis(e) )       (für jeden getöteten Gegner, auch Kinder, anteilig nach Schaden)
γ(n)             = 0,70 · 0,92^(n−1)                  (Münzen je Gegner-HP)
HP_basis(e)      = HP des Gegners ohne Schwierigkeitsfaktor, mit Koop-Faktor h(Spielerzahl) (§16)
```

| Wave | W(n) | γ(n) | Einkommen laut Beispiel-Stage (§5) |
|---:|---:|---:|---:|
| 1 | 105 | 0,700 | 245 (0,25 × Start) |
| 5 | 125 | 0,501 | 441 |
| 10 | 150 | 0,331 | 1 021 (Boss-Wave) |
| 15 | 175 | 0,218 | 979 |
| 20 | 200 | 0,144 | 1 591 (Boss-Wave) |

**Summen (Beispiel-Stage, solo, ohne Farm) [D aus §5-Tabelle]:** Kill-Bounty 12 873 + Wave-Bonus 3 050 = **15 923 M** über 20 Waves, mit Start 16 923 M (16,9 × Start; BTD6: R1–20 6,5 × Start, R1–40 25,9 × Start [D]). Der Wave-Bonus ist 19,2 % des Einkommens (3 050/15 923; BTD6 R1–40: 28,6 % [D]).

Herleitung der Konstanten (D):
1. `W(n) = 100 + 5n`: BTD6 `100 + Runde` über 40 Runden (101 → 140); wir haben 20 Waves und wollen +95 über die Stage, also Steigung ×5.
2. `γ(1) = 0,70` setzt Wave 1 auf ca. 0,25 × Start (BTD6 R1: 0,19, R10: 0,48), damit der Start schnell Käufe erlaubt (`balancing.md` §2b: Early Game großzügig).
3. `0,92` je Wave: γ fällt über 19 Schritte auf 0,92^19 = 0,205 des Anfangswerts. BTD6-Vergleich: Cash je RBE von R1–20 (1,0) bis R61–80 (0,14) = ×0,14 [D]; wir komprimieren denselben Verlauf auf 20 Waves. Folge: Einkommen wächst langsamer als die Gegner-HP (`balancing.md` §2b: Bounty-Wachstum unter HP-Wachstum, Geld bleibt knapp).
4. Gegenprobe Einkommen/Ausbau: Das Gesamteinkommen 15 923 M ist 0,097 × die Kosten eines Voll-Ausbaus aller 6 Slots (164 110 M, §6), also etwa 10 %. Die Stage deckt nur einen Teil des Ausbaus ab; der Rest ist Infinite/Meta [D: 15 923/164 110].

**Kein Zinseinkommen, kein passives Einkommen** außer Farm-Units (§12), wie in AA/ASTD [O/MEDIUM ASTD-S7].

### Infinite (ab Wave 21, `DESIGN`, grob)

BTD6 senkt den Pop-Cash in Stufen auf 2 % [O/HIGH BTD-S3]. Wir halten den Kill-Cash pro Wave **flach**: Gegner-HP wächst quadratisch, γ fällt mit demselben Faktor:

```text
HP_grunt(n)  = HP_grunt(20) · (n/20)²       für n > 20      (215 · (n/20)²)
γ(n)         = γ(20) · (20/n)²              für n > 20      (0,144 · (20/n)²)
Anzahl       = konstant ≈ 32 Grunt-Äquivalente, hartes Limit 60 Gegner je Wave (Performance)
Speed        = 1 + 0,01·(n − 20), max. 1,5
Kill-Cash je Wave ≈ γ(20)·32·HP_grunt(20) ≈ 990 M, plus Wave-Bonus 100 + 5n
```

| Wave | HP Grunt | Pool (32 Grunts) | γ | Kill-Cash | Wave-Bonus | Speed |
|---:|---:|---:|---:|---:|---:|---:|
| 20 | 215 | 6 890 | 0,144 | 989 | 200 | 1,0 |
| 30 | 484 | 15 502 | 0,064 | 989 | 250 | 1,1 |
| 40 | 861 | 27 558 | 0,036 | 989 | 300 | 1,2 |
| 60 | 1 938 | 62 006 | 0,016 | 989 | 400 | 1,4 |
| 100 | 5 382 | 172 240 | 0,006 | 989 | 600 | 1,5 |

[D: 215,3·(n/20)², γ = 0,1436·(20/n)², Kill-Cash = γ·32·HP; eigene Rechnung, gerundet.] BTD6-Vergleich: HP-Faktor R100 → R200 ×17 [O/HIGH BTD-S4]; unser (200/100)² = ×4 ist sanfter, dafür steigt das Einkommen nicht mit. Wo Infinite im Mittel endet, ist **Playtest-Pflicht** (§19).

---

## 4. Gegner-HP-Kurve und Archetypen

**BTD6:** Layer-HP fest (Rot 1 … Keramik 10, MOAB 200 …), erst ab R81 wächst der Blimp-HP-Faktor x in 8 Brackets (1,02 → 5,0 bis R140, +0,02 bis +5,0 je Runde), Speed stückweise [O/HIGH BTD-S4,S5]. **AA:** Formel UNKNOWN, nur „each wave progressively harder“; Challenge-Modifier Tank HP ×1,25, Fast ×1,5, Steel-Plated ×3 [O/MEDIUM AA-S73]. **AV:** `HealthMultiplier` 1–12 normal, 15–60 Boss relativ zu unbekannter Basis; Boss ≈ 5–20 × Standardgegner derselben Stage [D/HIGH AV-S5]. **AE:** Sprinter 0,8 × HP/+45 % Speed, Tank 1,2 × HP/−20 % Speed [O/HIGH AE-S5]. **`balancing.md` §2a (DESIGN):** `HP(w) = HP0·g^w` mit g ≈ 1,05–1,12 je Welle, Bosswellen ×5–×10, Spieler-DPS-Wachstum knapp darunter, Zielverlustrate 10–20 % der Waves im späten Abschnitt. **Wir nehmen** (`DESIGN`) das obere Ende von g:

```text
HP_grunt(n) = 25 · 1,12^(n−1)                  für n ≤ 20   (Normal)
HP(e, n)    = HP_grunt(n) · f_HP(Archetyp) · s_Diff · h(Spielerzahl)
Speed(e)    = 1,5 Tiles/s · f_Speed(Archetyp) · v_Diff · v_Infinite(n)
```

Werte: n = 1: 25; 5: 39; 10: 69; 15: 122; 20: 215 (D: 25·1,12^(n−1)).

**Warum g = 1,12 und 25?** Kapazitätsmodell (D): Eine ausgegebene Münze erzeugt im Mittel 0,025 DPS (Mittel aus Platzierungs-Effizienz 0,033–0,038 und Leiter-Ende-Effizienz 0,017–0,018 DPS/M, §6; Mittelwert beider ≈ 0,026). Ein Gegner ist ca. 20 s im Wirkungsbereich (70 % der 28 s Laufzeit). Ein Wave-Pool (Summe aller HP) soll `q(n) · 0,025 · C(n) · 20` betragen, mit `C(n)` = bis dahin verfügbare Münzen (Start plus Einkommen) und `q(n)` von 0,40 (Wave 1) linear auf 1,0 (Wave 20), Boss-Waves ×1,25. Das ergibt einen Pool von ca. 200 (Wave 1) bis ca. 8 000–10 000 (Wave 20), also ×42. Verteilt auf wachsende Anzahl (8 → ca. 30–38 Gegner) und HP je Gegner (25 → 215, ×8,6 = 1,12^19) liegt g bei 1,12 und damit am oberen Rand der `balancing.md`-Spanne. (Die Pools der Beispiel-Stage in §5 weichen bis ca. ±15 % von diesem Soll ab, Boss-Waves absichtlich mehr; Spalte „Pool/Kapazität“.)

### Archetypen (relativ zu Grunt)

| Archetyp | f_HP | f_Speed (Tiles/s) | Rüstung R | Leak | Debüt (Beispiel-Stage) | Vorlage / Begründung | Konter |
|---|---:|---:|---:|---:|---:|---|---|
| Grunt | 1,0 | 1,0 (1,5) | 0 | 1 | W1 | AV Puppet 1,0 / 1,0 [O/HIGH AV-S5] | alles |
| Runner (Sprinter) | 0,7 | 1,7 (2,55) | 0 | 1 | W3 | AE Sprinter 0,8 × HP, +45 % Speed [O/HIGH AE-S5]; AV Fast Puppet 1,575 × HP, 2,0 × Speed [O/HIGH AV-S5]; ALS Sprinter schneller, weniger HP [O/HIGH ALS-S3] | Slow, hohe SPA |
| Brute (Tank) | 3,0 | 0,7 (1,05) | 20 | 3 | W7 | AE Tank 1,2 × / 0,8; AV Strong Puppet 2,375 × / 1,2, Alien Elite 4,375 × / 1,0 [O/HIGH AV-S5]; ALS Tank [O/HIGH ALS-S3] | Burst, Armor-Pen |
| Flyer | 0,9 | 1,3 (1,95) | 0 | 2 | W8 | AA/ASTD/ALS: nur Hill/Hybrid/Air treffen [O/HIGH AA-S39,S65; O/HIGH ASTD-S8; O/HIGH ALS-S3] | Hill/Hybrid-Units |
| Splitter | 1,0 + 2 × 0,35 Kinder | 0,9 (1,35) | 0 | 2 + 1 je Kind | W15 | AE Splitter 3 × 33 % HP [O/HIGH AE-S5]; AV Thrice halbe HP [O/HIGH AV-S6] | AoE |
| Elite (Mini-Boss) | 8,0 | 0,8 (1,2) | 30 | 10 | W5 | AV Guldy 7 × / 0,9, Recroom 18 × / 0,5, Jiece 6 × / 1,8 [O/HIGH AV-S5]; `balancing.md` Boss ×5–×10 (DESIGN) | Fokus-DPS, Pen |
| Boss | 30,0 | 0,5 (0,75) | 40 | 50 | W10, W20 | AV Boss 15–60 × [O/HIGH AV-S5]; BTD6 Boss-Runden ≈ Nachbarrunden-RBE, Einzel-Blimp [O/HIGH BTD-S2; D] | Single-Target, Stun-Sperren |

Begründung Boss 30 ×: Ein Boss ersetzt die Masse der Welle; seine HP liegen in derselben Größenordnung wie der Pool der Nachbarwaves (Wave 10: 2 080 gegen Pool Wave 9 1 436 und Wave 11 2 081, also 1,0–1,45 × [D §5]). BTD6 zeigt dasselbe Muster mit Einzel-Blimp-Runden (R60 BFB 3 164 RBE gegen R59 4 270 und R61 6 530 [D, `rounds.json`]). Der Elite liegt mit ×8 in der `balancing.md`-Spanne ×5–×10, der Boss bewusst darüber, weil er alleine steht.

**Modifier (an Gegner anhängbar, 2–4 je Stage; AE-Prinzip, [R/MEDIUM AE-S5; AE design-lessons 1]):**

| Modifier | Wirkung | Vorlage |
|---|---|---|
| Shield n | n Stacks; jede Schadensinstanz entfernt 1 Stack ohne HP-Schaden; Multi-Hit im Vorteil | AA, UTDZ, AE [O/HIGH AA-S72, UTDZ-S9, AE-S5] |
| Regen | 2 % MaxHP/s; Bleed/Poison stoppen sie | AA 1 %/s, AE 1/3/5/8 %/s, AV 0,2 %/s [O/MEDIUM AA-S73; O/HIGH AE-S5, AV-S6] |
| Armored | Rüstung +80 (Brute: 20 + 80 = 100 → ×0,5) | AA ×0,5, ALS −50 %, AE −33 % [O/HIGH AA-S72, ALS-S3, AE-S5] |
| Fast | Speed ×1,3 | AA ×1,5, ALS +35 % [O/MEDIUM AA-S73; O/HIGH ALS-S14] |
| Commander (später) | +20 % Speed/HP im Radius 5 | AE [O/HIGH AE-S5] |

Kein Camo/Stealth im MVP (nur BTD6 hat es [O/HIGH BTD-S2]; AA, ASTD, AV, ALS, UTDZ, AE: UNKNOWN/nicht belegt); spart eine Detektions-Rolle.

**Schwierigkeit** (`DESIGN`): Normal `s_Diff` = 1,0, Hard HP ×1,4, Speed ×1,1; Nightmare HP ×2,0, Speed ×1,2. Bounty bleibt an der Normal-HP (§3), Belohnungen steigen (§13). Vorlagen: AV Strong +100 % HP je Karte [O/HIGH AV-S6], ALS +15 % bis +500 % HP [O/HIGH ALS-S14], ASTD Extreme ×10 (zu steil, [O/MEDIUM ASTD-S25]), BTD6 Preisfaktor/Leben [O/HIGH BTD-S10–S12]. Hard ×1,4 entspricht dem Damage-Faktor eines Unit-Levels 17 (1 + 0,025·16 = 1,4, §15); Nightmare ×2,0 liegt knapp über dem Level-40-Faktor 1,975 und verlangt damit Traits/Sterne (§14–§15).

---

## 5. Wave-Struktur und Beispiel-Stage

**BTD6:** 140 feste Runden, Blimp-Debüts R40/60/80/100; Zufall erst danach [O/HIGH BTD-S2]; Spieler lernen Runden auswendig (`btd6/design-lessons.md` 1). **AA:** Wave-Anzahl je Act UNKNOWN (mind. 15), Boss am Act-Ende, Infinite alle 10 Waves frühere Bosse, neue Gegnertypen meist in Wave 10 [O/HIGH AA-S72; R/MEDIUM]. **ASTD:** 15 Waves je Story-Mission, Boss/Mini-Boss in Wave 15, jede Karte führt einen neuen Gegnertyp ein [O/MEDIUM ASTD-S14,S25]. **AE:** ein fester Boss je Act, 2–4 Modifier je Act, Infinite-Belohnung alle 5 Waves [O/HIGH AE-S3,S5]. **Wir nehmen** (`DESIGN`):

- Feste Wellenlisten je Stage (deterministisch), Zufall nur im Infinite.
- Boss-Waves: Mini-Boss (Elite) in Wave 5 und 15 (ASTD: Mini-Boss/Boss in W15), **Boss in Wave 10** (Zwischenboss) und **Wave 20 (Final)**; Infinite: Boss alle 10 Waves aus früheren Stages (AA) [O/HIGH AA-S72].
- Ein neuer Gegnertyp je 2–3 Waves, nie zwei neue Mechaniken in derselben Wave (ASTD-Lehre 4, [O/HIGH ASTD-S8,S25]).
- Spawn-Gruppe = `{Typ, Anzahl, Abstand in s, Startverzögerung, Modifier}`; 1–3 Gruppen je Wave, nacheinander; Spawn-Fenster ≤ 35 s (Timer 45 s).
- Abstände: Grunt 0,8 s, Runner 0,5 s, Flyer 0,9 s, Brute 2,0 s, Splitter 1,5 s, Elite 3,0 s (AV spawnt alle 0,2 s mit Warteschlange [O/MEDIUM AV-S20]; BTD6 Spawn-Timings UNKNOWN in unseren Dateien). Alle Abstände `DESIGN`.
- Wave-Timer 45 s ab Spawn-Start; nächste Wave früher per Skip (Koop: Mehrheit) oder wenn alles tot/geleakt ist. Waves dürfen überlappen.

Beispielgruppe (Wave 13): `[{grunt, 15, 0.8 s, 0 s, shield3}, {runner, 22, 0.5 s, 12 s}]` → Spawn-Fenster 12 + 11 = 23 s.

### Beispiel-Stage „Standard 20“ (solo, Normal)

Rechenweg (D): HP je Gegner = `HP_grunt(n) · f_HP`; Anzahl je Typ aus Ziel-HP-Anteil an `q(n) · 0,025 · C(n) · 20` (§4), gerundet; Pool = Σ Anzahl × HP (Splitter inkl. Kinder); Kill-Bounty = `γ(n) · Pool`; Pool/Kapazität = Pool geteilt durch `0,025 · 20 · C(n)` mit C(n) = Start plus Einkommen der Waves 1…n−1 (ohne Farm, AoE, Meta-Boni). „kum.“ = Münzen insgesamt nach Wave n inklusive Start 1 000.

| Wave | Zusammensetzung | Gegner | Spawn-Fenster | HP Grunt | Pool (HP) | Pool/Kapazität | Kill-Bounty | Bonus | Einkommen | kum. | Besonderheit |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 8× Grunt | 8 | 6 s | 25 | 200 | 0,40 | 140 | 105 | 245 | 1 245 | Tutorial: nur Grunts |
| 2 | 9× Grunt | 9 | 7 s | 28 | 252 | 0,40 | 162 | 110 | 272 | 1 517 |  |
| 3 | 8× Grunt, 3× Runner | 11 | 8 s | 31 | 317 | 0,42 | 188 | 115 | 303 | 1 820 | Runner-Debüt |
| 4 | 8× Grunt, 6× Runner | 14 | 9 s | 35 | 429 | 0,47 | 234 | 120 | 354 | 2 174 |  |
| 5 | 1× Elite, 8× Grunt | 9 | 9 s | 39 | 629 | 0,58 | 316 | 125 | 441 | 2 615 | Elite 1 (Mini-Boss), Leak 10 |
| 6 | 9× Grunt, 10× Runner | 19 | 12 s | 44 | 705 | 0,54 | 325 | 130 | 455 | 3 070 |  |
| 7 | 3× Brute, 10× Grunt | 13 | 14 s | 49 | 938 | 0,61 | 398 | 135 | 533 | 3 603 | Brute-Debüt (Rüstung R 20) |
| 8 | 7× Flyer, 14× Grunt | 21 | 18 s | 55 | 1 122 | 0,62 | 438 | 140 | 578 | 4 181 | Flyer-Debüt: nur Hill/Hybrid treffen |
| 9 | 4× Brute, 6× Runner, 7× Grunt | 17 | 17 s | 62 | 1 436 | 0,69 | 516 | 145 | 661 | 4 842 |  |
| 10 | 1× Boss, 8× Grunt | 9 | 6 s | 69 | 2 634 | 1,09 | 871 | 150 | 1 021 | 5 863 | **Boss 1**, 2 080 HP, Leak 50 |
| 11 | 12× Flyer, 16× Grunt | 28 | 24 s | 78 | 2 081 | 0,71 | 633 | 155 | 788 | 6 651 | Flyer-Welle |
| 12 | 4× Brute, 12× Runner, 7× Grunt | 23 | 20 s | 87 | 2 383 | 0,72 | 667 | 160 | 827 | 7 478 | Brutes mit Regen 2 %/s (Bleed/Poison stoppen) |
| 13 | 15× Grunt, 22× Runner | 37 | 23 s | 97 | 2 961 | 0,79 | 762 | 165 | 927 | 8 405 | Grunts mit Schild 3 (jeder Treffer −1) |
| 14 | 4× Brute, 11× Flyer, 10× Grunt | 25 | 26 s | 109 | 3 480 | 0,83 | 824 | 170 | 994 | 9 399 | Brute + Flyer gemischt |
| 15 | 1× Elite, 6× Splitter, 12× Grunt | 19 | 22 s | 122 | 3 690 | 0,79 | 804 | 175 | 979 | 10 378 | Elite + Splitter (2 Kinder à 35 % HP) |
| 16 | 5× Brute, 15× Runner, 12× Flyer | 32 | 28 s | 137 | 4 967 | 0,96 | 995 | 180 | 1 175 | 11 553 | gemischt: Brute, Runner, Flyer |
| 17 | 6× Brute, 18× Grunt | 24 | 26 s | 153 | 5 517 | 0,96 | 1 017 | 185 | 1 202 | 12 755 | Brutes „Armored“ (R 100, ×0,5) |
| 18 | 9× Splitter, 13× Flyer, 16× Runner | 38 | 33 s | 172 | 6 557 | 1,03 | 1 112 | 190 | 1 302 | 14 057 | Splitter + Flyer + Runner |
| 19 | 2× Elite, 4× Brute, 8× Grunt | 14 | 20 s | 192 | 6 921 | 0,98 | 1 080 | 195 | 1 275 | 15 332 | 2 Elites |
| 20 | 1× Boss, 1× Elite, 7× Grunt | 9 | 9 s | 215 | 9 689 | 1,26 | 1 391 | 200 | 1 591 | 16 923 | **Final-Boss**, 6 460 HP, + Elite |

Summen [D]: Kill-Bounty 12 873, Wave-Bonus 3 050, Einkommen 15 923. Der Spawn-Fenster-Wert zählt Boss-Gegner nicht (erscheinen einzeln am Start).

Lesehilfen: Boss Wave 10 = 30 × 69,3 = 2 080 HP; Boss Wave 20 = 30 × 215,3 = 6 460 HP; Elite Wave 5 = 8 × 39,3 = 315 HP, Wave 15 = 977, Wave 19 = 1 537 [D]. Pool/Kapazität > 1 in den Boss-Waves (1,09 und 1,26) ist gewollt: Der Boss läuft mit 0,5 des Grunt-Tempos und ist doppelt so lange (56 s statt 28 s) in Reichweite. Die Rüstung der Brutes/Elites/Bosse (§10) macht reale Waves schwerer als der Kapazitätswert; das ist ein Kalibrierpunkt (§19).

---

## 6. Unit-Kostenkurve

**BTD6:** 3 Pfade × 5 Stufen; Tier-Preis relativ zum Basispreis im Median T1 0,6, T2 0,9, T3 3,3, T4 12, T5 83; Σ/Platzierung 88 (Dart) bis 251 (Super) [D BTD-S13]. **AA:** Upgrade-Faktor je Stufe im Median Rare 1,50, Epic 1,40, Legendary 1,30, Mythic 1,29; Σ/Platzierung 16,5 / 20,0 / 31,7 / 36,9; 5/5/7/8 Upgrades [D/HIGH AA-S65]; DPS-Faktor am Ende ×7,0 / ×10,0 / ×14,1 / ×13,7; Grenz-Effizienz fällt von 0,70 über 0,48 auf 0,39 der Platzierungs-Effizienz, Ausbau auf Max ≈ 0,49 [D/HIGH AA-S65]. **AV/UTDZ/AE:** Σ/Platzierung Rare 9–15, Mythic 20–32, letzte Stufe 3–9 × Platzierung [D, `numbers.md` §4]. **ALS/ASTD:** letzte Stufe bis 906 × bzw. 37 500 × Platzierung (Warnung, [D ALS-S8, ASTD-S23]; ALS-Lehre 4: für Kurzmatches höchstens 30–50 ×). **`balancing.md` §2c** schlägt ×1,8–2,5 je Stufe vor (DESIGN, ohne Spieldaten); die AA-Daten (Median 1,29–1,50) und AV/AE/UTDZ (1,07–1,6) sprechen für **sanftere** Faktoren; wir folgen den Spieldaten. **Wir nehmen** (`DESIGN`):

```text
Upgrade-Kosten Stufe k  = round5( P · g^(k−1) )     k = 1 … n         (erstes Upgrade = 1,0 · P)
Kosten gesamt           = P + Σ Upgrade-Kosten
DPS(k)                  = DPS0 · (1 + d·k)           d = (F − 1) / n   (linear in k, additiv)
SPA(k)                  sinkt linear bis 0,8 · SPA0 (−20 %, AA: höchstens −20 %)
Range(k)                wächst linear bis Range_max
```

| Rarity | P | n (Upgrades) | g | Σ/P | Stufen-Kosten (Upgrade 1 … n) | Gesamt |
|---|---:|---:|---:|---:|---|---:|
| Rare | 300 | 4 | 1,50 | 9,1 | 300, 450, 675, 1 010 | 2 735 |
| Epic | 400 | 5 | 1,40 | 11,9 | 400, 560, 785, 1 100, 1 535 | 4 780 |
| Legendary | 650 | 6 | 1,30 | 13,8 | 650, 845, 1 100, 1 430, 1 855, 2 415 | 8 945 |
| Mythic | 1 000 | 7 | 1,29 | 18,1 | 1 000, 1 290, 1 665, 2 145, 2 770, 3 570, 4 610 | 18 050 |

Herleitung (D):
- Platzierungs-Verhältnis Rare : Epic : Legendary : Mythic = 1 : 1,33 : 2,17 : 3,33 (AA-Median 400 : 525 : 850 : 1 350 = 1 : 1,31 : 2,13 : 3,38 [D/HIGH AA-S65]).
- `g` = AA-Mediane (Rare 1,50, Epic 1,40, Legendary 1,30, Mythic 1,29), weil AA die einzige Quelle mit Medianwerten über 534 Units ist.
- `n` = 4/5/6/7 (AA 5/5/7/8, AE 4–7, UTDZ 5–7): je ein Upgrade weniger, weil unsere Stage nur 20 Waves hat.
- Erstes Upgrade = 1,0 × P: AV Top Chef 1,00, AE Kid Assassin 2,00, UTDZ Roku 0,62, BTD6 0,6–0,8 [D `numbers.md` §4].
- Σ/P 9,1–18,1: gleiches Niveau wie AV Top Chef (9,4), AE Rare (13,5), UTDZ Roku (13,1), AE/UTDZ Mythic (20–25), etwa 45–60 % der AA-Mediane (9,1/16,5 = 55 %; 11,9/20,0 = 60 %; 13,8/31,7 = 43 %; 18,1/36,9 = 49 % [D]); Kurzstage statt langer Matches.
- Letzte Stufe/P 3,4 (Rare) bis 4,6 (Mythic): im Bereich AV Top Chef 3,4, UTDZ 4,1–5,6, AE 4,0–8,5; weit unter ALS/ASTD (Lehre 4).

### Referenz-Stats (Stufe 0 → Max)

| Rarity | SPA | DPS | Schaden/Treffer | Range (Tiles) | Placement-Cap | Slot-Kosten (Cap × Σ) |
|---|---|---|---|---|---:|---:|
| Rare | 2,0 → 1,6 s | 10 → 45 (×4,5) | 20 → 72 | 3,0 → 4,0 (×1,33) | 5 | 13 675 |
| Epic | 2,5 → 2,0 s | 14 → 84 (×6,0) | 35 → 168 | 3,5 → 4,8 (×1,37) | 4 | 19 120 |
| Legendary | 3,5 → 2,8 s | 22 → 154 (×7,0) | 77 → 431 | 4,0 → 5,5 (×1,38) | 3 | 26 835 |
| Mythic | 5,0 → 4,0 s | 38 → 323 (×8,5) | 190 → 1 292 | 4,5 → 6,5 (×1,44) | 2 | 36 100 |

Herleitung (D): DPS0/P ≈ 0,033–0,038 für alle Rarities (Preis-Leistung bei Platzierung nahezu konstant, Rarity zahlt in Limits, Fähigkeiten und Fläche). DPS-Faktor am Ende F = 4,5/6,0/7,0/8,5 so gewählt, dass Ende-Effizienz/Platzierungs-Effizienz = 0,49/0,50/0,51/0,47 (AA: 0,49 [D/HIGH AA-S65]). SPA-Spannen liegen in der Bandbreite AE (2,3–9,2 s) und UTDZ (3,5–10 s); Range-Wachstum ×1,33–1,44 entspricht AA ×1,33 (Rare) bis ×1,73 [D/HIGH AA-S65]; Reichweite bewusst begrenzt (`balancing.md` Q4: Range ist der stärkste Stat).

### DPS-Leiter und Grenz-Effizienz

| Rarity | DPS je Stufe 0 … n | Grenz-Effizienz je Upgrade (DPS-Gewinn je Münze relativ zur Platzierung) |
|---|---|---|
| Rare | 10,0 · 18,8 · 27,5 · 36,2 · 45,0 | 0,88 · 0,58 · 0,39 · 0,26 |
| Epic | 14 · 28 · 42 · 56 · 70 · 84 | 1,00 · 0,71 · 0,51 · 0,36 · 0,26 |
| Legendary | 22 · 44 · 66 · 88 · 110 · 132 · 154 | 1,00 · 0,77 · 0,59 · 0,45 · 0,35 · 0,27 |
| Mythic | 38 · 79 · 119 · 160 · 201 · 242 · 282 · 323 | 1,07 · 0,83 · 0,64 · 0,50 · 0,39 · 0,30 · 0,23 |

AA: Grenz-Effizienz fällt von 0,70 (erstes Drittel) auf 0,39 (letztes) [D/HIGH AA-S65]; unsere Kurve fällt von ca. 1,0 auf ca. 0,25, also etwas steiler (Playtest-Punkt §19). Wirkung (`balancing.md` §2c: „Wirkung nimmt bei Stufe 4–5 ab, Kauf von Zweitturm wird attraktiver“): ab Stufe 4 ist ein zweites Exemplar billiger pro DPS als das nächste Upgrade, solange der Cap es zulässt.

**Voll-Ausbau (D):** 2 Mythic (Cap 2), 2 Legendary (Cap 3), 2 Epic (Cap 4) voll ausgebaut: 2·2·18 050 + 2·3·8 945 + 2·4·4 780 = **164 110 M** für 2 888 DPS (4·323 + 6·154 + 8·84 = 1 292 + 924 + 672). Die Stage liefert 15 923 M ≈ 10 %.

**Evolution/Awakening** (nur Idee, nicht MVP): AE-Evolution verdoppelt die Upgrade-Kosten (×1,7–2,1) und bringt Max-Damage ×2,2–3,2 mit 2–3 Zusatzstufen [D/HIGH AE-S7]; wir ersetzen das im MVP durch Sterne (§13) und vermeiden AV-Quests von 16 h [O/HIGH AV-S15].

---

## 7. Placement-Caps

**AA:** Spawn Cap je Unit-Typ, Verteilung 4 (219 von 534), 3 (193), 5 (82), 6 (20), 1 (15), 2 (5); Buff-Units global 6; Gesamtlimit UNKNOWN [D/HIGH AA-S65]. **BTD6:** kein Typ-Limit, Held 1, Paragon 1 [O/MEDIUM BTD-S9,S2,S14]. **AV:** Rare 5–6, Legendary 4, Mythic/Secret meist 3 [O/HIGH AV-S3]. **AE:** Rare 4, Epic/Legendary 3–4, Mythic 2–3 [O/HIGH AE-S7]. **UTDZ:** Rare 5, Legendary 2–4, Mythic 2, Bulmo 1. **ASTD:** Schlüssel-Units 1, Infinite je Spieler 24/32/44/88 nach Gruppengröße [O/LOW ASTD-S11]. Das Limit je Unit ist in AA, AV, AE, UTDZ der Hauptbalancing-Hebel (`av/design-lessons.md` 2). **Wir nehmen** (`DESIGN`):

| Regel | Wert | Begründung |
|---|---|---|
| Cap je Unit-Typ und Spieler | Rare 5, Epic 4, Legendary 3, Mythic 2, Farm 2 (Epic), Einzel-Units 1 | AE-Bereich (Mythic 2–3), AV (Rare 5–6, Legendary 4); wir haben nur vier Rarities und kurze Stages, daher Mythic 2 |
| Cap gilt je Spieler, nicht je Team | im Koop darf jeder Spieler seine Units platzieren | AV/AA getrennte Konten [R/MEDIUM AA-S72, AV-S18] |
| Team-Slots | 6 je Spieler | AA/ASTD/AV 6 [O/MEDIUM AA-S53,S72; O/HIGH ASTD-S9; O/MEDIUM AV-S16] |
| Team-Gesamtlimit | 60 platzierte Units je Match, 80 gleichzeitige Gegner (Infinite 60) | BTD6-Lag ab R100–160 im Koop [O/HIGH BTD-S18]; ASTD Quad 24 je Spieler = 96 [O/LOW ASTD-S11]; Performance im Browser, Kalibrierpunkt |
| Platzierungstypen | Ground / Hill / Hybrid; Flyer nur von Hill/Hybrid | AA 461/71/29 von 561, ASTD, ALS [D/HIGH AA-S65; O/HIGH ASTD-S25, ALS-S3] |
| Roster-Anteil mit Luft-Treffern | ≥ 30 % der Units Hill oder Hybrid | AA 17,8 % [D: (71+29)/561]; wir haben Flyer in 5 von 20 Waves und einen kleineren Pool, deshalb mehr |
| Raster | 1 Unit je Tile, große Units (Farm) 2×2 | AA UNKNOWN, BTD6 frei mit Footprint [O/MEDIUM BTD-S14,S15]; Raster ist auf Touch einfacher und fairer |
| Kosten-Modifikatoren | immer auf den Basispreis, nie kumulativ | BTD6 Impoppable stapelte auf Hard und wurde in v37.1 korrigiert [O/HIGH BTD-S12] |

---

## 8. Verkaufswert

**BTD6:** 70 % der Gesamtausgaben, Cap 95 %, in CHIMPS verboten [O/HIGH BTD-S9,S10]. **AA:** 25 % [O/CONFIRMED AA-S72]. **ASTD, ALS:** 50 % [O/HIGH ASTD-S20, ALS-S7]. **AE:** Ramen Guy (Farm) 10 % „Capital Lock“ [O/HIGH AE-S7]. **AV, UTDZ:** UNKNOWN. **Wir nehmen** (`DESIGN`):

- Kampf-Units: **60 %** der investierten Münzen (Platzierung + bezahlte Upgrades), `floor`. Mitte zwischen ASTD/ALS 50 % und BTD6 70 %: Umbauen bleibt möglich, Hin-und-Her-Wechsel kostet aber 40 %; BTD6 sieht „Verhindert Switch-Exploits ohne Strafe zu übertreiben“ [O/HIGH BTD-S9], AA 25 % bestraft zu stark.
- Farm-Units: **40 %** (Capital-Lock-Idee aus AE/ASTD: Farmen sind keine Reserve, die man schadlos auflöst).
- Einzel-Units (Limit 1, Boss-Reward-Units) verkaufbar mit 60 %; keine „unverkäuflichen“ Sonderfälle (AA 9 Units, ASTD Jeff/Idol unverkäuflich [O/HIGH AA-S65, ASTD-S13]) im MVP.
- Verkaufsboni: keine im MVP; falls später, hartes Cap 80 % (BTD6 Cap 95 %).
- Rückgabe geht an den Besitzer; verkaufte Platzierungen geben den Cap-Slot frei.

---

## 9. Targeting-Modi (genaue Regeln)

**BTD6:** First, Last, Close, Strong; Strong = Typ-Rangliste, nicht aktuelle HP [O/HIGH BTD-S8]. **AA:** First und Strongest belegt, Dropdown je Unit [O/HIGH AA-S53,S72]; AA-Default-Ergänzung Last, Weakest, Closest [AA:technical-reconstruction]. **ASTD:** First, „Strongest/Last“ im Guide, manuelle Kontrolle [O/LOW ASTD-S9]. **AV, ALS, UTDZ:** UNKNOWN; **AE:** keine wählbaren Modi, feste Regeln (strongest, random) [O/HIGH AE-S7]. **Wir nehmen** (`DESIGN`) die vier BTD6-Modi, aber mit HP-basiertem Strongest, weil AA/ASTD „Strongest“ als stärksten Gegner meinen und BTD6s Typ-Rangliste für unser Pool-Design (Brute/Elite/Boss unterscheiden sich nur durch HP) unnötig ist:

| Modus | Regel (Zielwahl bei jedem Angriffsbeginn) |
|---|---|
| **First** (Standard) | größter Pfadfortschritt `p(e)` in Tiles seit Spawn unter allen Gegnern in Reichweite |
| **Last** | kleinster `p(e)` in Reichweite |
| **Close** | kleinster Abstand Unit-Mitte zu Gegner-Mitte; Gleichstand: First |
| **Strongest** | größte **maximale HP** `maxHP · (1 + 0,25 · Schild-Stacks)` (nicht die aktuelle HP, damit das Ziel nicht flackert); Gleichstand: First |

Allgemeine Regeln:
1. **Zulässig** ist ein Gegner, wenn er lebt, gespawnt und nicht untargetbar ist und `Abstand ≤ Range + 0,3 Tiles` (Gegnerradius) gilt. Flyer sind nur für Hill/Hybrid-Units zulässig (AA/ASTD/ALS [O/HIGH AA-S39,S65; O/HIGH ASTD-S8; O/HIGH ALS-S3]).
2. **Neubewertung** vor jedem Angriff, nicht währenddessen. Stirbt das Ziel in der Windup-Phase, trifft ein AoE-Angriff die Zielposition trotzdem, ein Einzelangriff verfällt ohne Abklingzeit-Strafe (AE-Felder DelayBeforeAttack/Ticks [O/HIGH AE-S7]).
3. **Full-AoE** (Treffer auf alle in Range) und Support/Farm haben keinen Modus (BTD6: Tack, Farm, Dorf [O/HIGH BTD-S8]).
4. Der Modus ist je Unit-Instanz gespeichert; nur der Besitzer ändert ihn; Standard First. Fähigkeiten mit festem Ziel („stärkster Gegner“) ignorieren den Modus (AA, AE [O/HIGH AA-S72, AE-S7]).
5. Gegner mit Immunität/Untargetbar-Zustand (z. B. Burrow, später) werden ausgelassen, nicht blockiert.

Nicht im MVP: BTD6-Sonderfälle (Elite-Sniper, Mortar-Zielpunkt, Heli-Patrouille), manuelles Zielen (ASTD „Control“).

---

## 10. Schadensformel und Resistenzen

**AA:** Pipeline aus Einzelfaktoren (Reihenfolge nur R/LOW), Schwäche `1 + Σ`, Resistenz `100/(100+R)`, True Damage ignoriert Resistenz und Schild [O/HIGH AA-S72]. **BTD6:** additiver Schaden je Treffer, keine %-Rüstung, Immunitäten je Bloon-Farbe [O/HIGH BTD-S14]. **ASTD:** Elementdreieck ×3 / ×0,25 oder ⅓ [O/MEDIUM ASTD-S9,S26]. **AV:** `Basis × Trait × Level^L × Buff` und Element ×3 / −80 % [O/MEDIUM AV-S7; O/HIGH AV-S18]. **UTDZ/AE:** Elemente ×1,5 / ×0,5 [O/HIGH UTDZ-S11, AE-S3]. **Wir nehmen** (`DESIGN`) die AA-Resistenzformel, die UTDZ/AE-Elementwerte und eine feste Reihenfolge:

```text
Treffer(h) = Basis(unit, Stufe)
           × Lvl                       Lvl = 1 + 0,025·(L−1) + 0,05·Sterne           (§15)
           × (1 + Σ Trait-Schaden)                                                    (§14)
           × (1 + min(Σ Buff-Schaden; 1,0))                                           (§11)
           × (1 + min(Σ Verwundbar; 0,5))                                             (§11)
           × Element                   1,5 / 1,0 / 0,5
           × 100 / (100 + max(0, R − Pen))     R = Rüstung des Gegners, Pen = Armor-Pen der Unit
           × Crit                      Zufall: ×m mit Wahrscheinlichkeit c
Mindestschaden 1; True-Damage überspringt den R-Faktor (und Schild-Stacks)
DoT        = Anteil des Treffers vor R und Element, in Ticks à 1 s; ignoriert R; Boss/Elite nehmen ×0,5 DoT (ALS Resistant −50 % DoT [O/HIGH ALS-S3])
Crit       Standard c = 0, m = 1,5; Crit-Units c = 0,25; erwartet 1 + c·(m−1) (AA: 1,25 bei 50 %/×1,5)
Shield     jede Schadensinstanz entfernt 1 Stack; Angriffe bis Tod = ceil((Schild + ceil(HP/Treffer)) / Treffer je Zyklus)
```

Prüfrechnung (D): Legendary Stufe 0 (Treffer 77), Level 20 (Lvl 1,475), Trait Kraft II (+8 %), Aura +25 %, Element im Vorteil (×1,5) gegen Brute (R 20, Pen 0): 77 × 1,475 × 1,08 × 1,25 × 1,5 × (100/120) = 191,7 → 192 Schaden.

| Gegner-Seite | Wert | Vorlage |
|---|---|---|
| Rüstung R | Grunt/Runner/Flyer 0, Brute 20, Elite 30, Boss 40; Modifier Armored +80 | AA Armored ×0,5 [O/HIGH AA-S72]; AE Reinforced −30 % [O/HIGH AE-S5] |
| R-Faktor | 20 → ×0,83, 30 → ×0,77, 40 → ×0,71, 100 → ×0,50 | D: 100/(100+R) |
| Pen (Anti-Armor-Units) | 30–60 Punkte, nur Spezialisten | AA „Penetration“ Rechenart UNKNOWN [U]; UTDZ Greybeard +65 % gegen Armored [O/MEDIUM UTDZ-S14] |
| Element | 5 zyklische Elemente + Neutral; Gegner-Element je Stage (Normal neutral, ab Hard aktiv); stark ×1,5 gegen die nächsten zwei im Zyklus, schwach ×0,5 gegen die zwei davor | UTDZ-Pentagon [O/HIGH UTDZ-S11]; Formel: stark wenn `(Ziel − Angreifer) mod 5 ∈ {1,2}`, schwach bei `{3,4}` |
| Boss-CC | Dauer ×0,5, Sperre unverändert | BTD6 Blimps halbe Dauer [O/HIGH BTD-S16] |

Warum nicht ×3/−80 % (AV) oder ×3/×0,25 (ASTD): 1,5/0,5 ergeben Faktor 3 zwischen Vor- und Nachteil statt 12–15; das hält falsch gewählte Teams spielbar (UTDZ-Lehre 5, [O/HIGH UTDZ-S11]).

**Statuseffekte (Mindestsatz, `DESIGN`):**

| Effekt | Wert | Sperre/Stacking | Vorlage |
|---|---|---|---|
| Stun/Freeze | 1,5 s | danach 6 s CC-Immunität; Boss Dauer 0,75 s | BTD6 Freeze 1,5 s [O/HIGH BTD-S15]; AV Hard CC 6 s Sperre [O/HIGH AV-S11]; AE 2 s/5 s [O/HIGH AE-S6] |
| Slow | −40 % Speed, 4 s | stärkster gewinnt, Gesamt-Slow max. −60 % | AV Tier −50/−40/−30 % höchster gewinnt [O/HIGH AV-S11]; ASTD Wax −85 % Ausreißer [O/HIGH ASTD-S26] |
| Bleed | 0,6 × Treffer in 6 s, stoppt Regen | gleicher Typ erneuert nur, verschiedene Typen stapeln | AE Bleed 0,65 × in 6 s [O/HIGH AE-S6]; ASTD gleicher Effekt stapelt nicht [O/HIGH ASTD-S6] |
| Burn | 0,9 × Treffer in 4 s | dito | AE Burn ca. 1 × in 4 s [O/LOW AE-S6] |
| Poison | 1,2 × Treffer in 8 s, stoppt Regen | dito | ASTD Poison ×6/21 s, AE 0,3 ×/6 Ticks [O/HIGH ASTD-S26; O/MEDIUM AE-S6] |
| Verwundbar (Mark) | +20 % erhaltener Schaden, 10 s, 1 Quelle, Cap +50 % | siehe §11 | AE Puppet Mark +20 % [O/HIGH AE-S6] |

Grund für die Sperre: ASTD-Lehre 6 und AV/AE zeigen, dass Dauer-CC und unbegrenztes DoT-Stacking Balancing zerstören; ASTD Update 48 musste DoT für Single-Placement-Units auf 25 % senken [O/HIGH ASTD-S6]. Wir fixieren die Regeln von Anfang an.

---

## 11. Buff-Stacking und Caps

**AA:** additiv `1 + Σ`, gleiche Effekte stapeln nicht, Loop bei +100 % gedeckelt (Commander 25 → 56 → 95 → 100 %) [V/HIGH AA-S72]. **AV:** „Unique Amplifier“ (nur einer gleichzeitig), Leader-Buff Cap 20 %, andere 35/50 %; globaler Cap nicht gefunden [O/HIGH AV-S11,S3]. **UTDZ:** je Kategorie nur der höchste Buff [O/MEDIUM UTDZ-S9]. **ASTD:** Idol Cap 250 % [O/HIGH ASTD-S21], Gesamtcap UNKNOWN. **ALS:** Buffs über 100 % üblich, Caps in Billionen [O/HIGH ALS-S8,S9]. **BTD6:** Dorf +10 % Range, Jungle Drums +15 % Speed, Caps UNKNOWN [O/HIGH BTD-S15]. **Wir nehmen** (`DESIGN`):

| Kategorie | Stacking | Cap | Typischer Wert |
|---|---|---|---|
| Schaden-Buff | additiv über verschiedene Quellen; gleiche Buff-ID zweier Spieler: nur der höchste wirkt | Σ ≤ +100 % | Aura +10 % (Stufe 0) bis +40 % (Max) je Support-Unit |
| Angriffs-Tempo-Buff | additiv, wirkt als `SPA × 1/(1+x)` (AA-Prinzip, DPS-Faktor 1/(1+x)) | x ≤ +60 % | +10 % bis +30 % |
| Range-Buff | additiv | Σ ≤ +30 % | +10 % (BTD6 Dorf +10 %) |
| Verwundbar (Gegner-Debuff) | nur der stärkste Debuff gilt, nicht addiert (AV Unique Amplifier) | ≤ +50 % | +20 % |
| Kosten-Reduktion (Traits/Aura) | additiv | ≤ −25 % auf Upgrades | Händler −10 % |
| Zeitbuffs (Ability) | gleiche Ability desselben Typs refresht nur | – | 15–30 s mit 60 s Abklingzeit (AA Commander 30 s/60 s [O/HIGH AA-S72]) |
| Wachsende Passiv-Buffs | je Unit gedeckelt | ≤ +50 % | +1–2 % je Treffer/Wave (AV +1–2 %, UTDZ Eternal +60 % Cap [O/HIGH AV-S3, UTDZ-S13]) |

Folge: maximaler Buff-DPS-Faktor = (1 + 1,0) × 1,6 = **×3,2**, mit Verwundbar ×4,8. Zusammen mit dem Meta-Faktor ×2,5 (§15) bleibt der Gesamtfaktor ohne Element bei ca. ×12 (4,8 · 2,5). Buffs wirken auf Units **aller** Spieler im Radius (Koop-Synergie, AA-Buffs „global“ [O/HIGH AA-S72]).

---

## 12. Farm-Units (Rendite, Payback-Ziel)

**BTD6:** Banana Farm 1 250 → 80 Cash je Runde, Payback 14,4–26,1 Runden je Variante (Median ca. 17), Farmen vor ca. R40 bauen [D/MEDIUM BTD-S13,S14]. **AA:** nur 3 Farm-Units; Payback gesamt 2,75–4 Waves (C.E.O., Bulby), Weather Girl bis 12; Cap 3/1/3; Verkauf bei Bulby/Weather Girl unmöglich [D/HIGH AA-S65]. **ASTD:** Jeff (CEO) 1,3–3,5 Waves Payback, Guide stoppt Farmen zwischen Welle 10 und 12 bei 15 Waves, Meta-Verengung [D/HIGH ASTD-S13; O/MEDIUM ASTD-S9]. **UTDZ:** Bulmo Gesamtpayback 3,9, Grenzwerte 0,5–6,7 [D UTDZ-S14]. **AE:** Ramen Guy Max-Ertrag/Kosten 11 500/40 000, Verkauf 10 %, Modifier „No Farms“ [O/HIGH AE-S7,S5]. **ALS:** Siege-Modus ohne Farms (+500 % Kill-Cash) [O/HIGH ALS-S15]. **Wir nehmen** (`DESIGN`) einen Payback von **8–9,5 Waves** (gut 40 % einer 20-Wave-Stage): langsamer als die Roblox-Spiele (1,3–4), die in 15–20 Waves jede Stufe sofort refinanzieren und zur Meta-Verengung geführt haben, schneller als BTD6 (15,6 von 40 Runden Easy = 39 %, [D]).

| Stufe | Upgrade-Kosten | Kosten gesamt | Ertrag je Wave | Payback gesamt (Waves) | Grenz-Payback |
|---|---:|---:|---:|---:|---:|
| 0 (Platzierung) | – | 400 | 50 | 8,0 | – |
| 1 | 300 | 700 | 90 | 7,8 | 7,5 |
| 2 | 450 | 1 150 | 135 | 8,5 | 10,0 |
| 3 | 700 | 1 850 | 205 | 9,0 | 10,0 |
| 4 | 1 100 | 2 950 | 310 | 9,5 | 10,5 |

[D: Ertrag = Kosten gesamt / (8; 8; 8,5; 9; 9,5), auf 5 gerundet; Grenz-Payback = Upgrade-Kosten / Ertragszuwachs.] Ausgezahlt am **Wave-Ende** (AA, ASTD [O/HIGH AA-S65]); Trait „Händler“ +20 % Ertrag (AV Fortune, UTDZ Fortunate, AE Investor +25 % [O/HIGH AV-S8, UTDZ-S13, AE-S10]). Cap 2 je Spieler, 2×2 Tiles, Verkauf 40 % (§8). Jede Farm-Stufe trägt nur zum Einkommen bei; kein Kampfwert.

**Farm-Fenster (D):** Eine Stufe lohnt nur, wenn die Restwaves ≥ Grenz-Payback + 1 sind, also Upgrade 1 bis Wave 12, Upgrades 2–4 bis Wave 9–10, Platzierung bis Wave 12 (400 M, Payback 8). Das entspricht dem ASTD-Guide „Farm stoppen zwischen Welle 10 und 12“ bei 15 Waves [O/MEDIUM ASTD-S9], bei uns relativ zu 20 Waves.

**Anteil am Gesamteinkommen (Simulation, D):** Greedy-Strategie, die 40–100 % der Münzen bis Wave 12 in Farm-Käufe mit Grenz-Payback ≤ Restwaves steckt, Basiseinkommen aus §5 (15 923): Farm-Ertrag 6 330 (Cap 2, 40 % Budget; Farm-Anteil 28 %), 8 155 (70 %; 34 %), 9 635 (100 %; 38 %); Farm-Netto nach Abzug der Farm-Kosten +2 630 bis +3 735 M (+17 bis +23 % des Basiseinkommens). Mit Cap 3 steigt der Anteil auf 33–38 % (ASTD-Meta-Verengung als Warnung). Eine Farm voll ausgebaut (2 950 M) bringt 310/Wave; zwei Farmen auf Stufe 4 kosten 5 900 M = 79 % der bis Wave 12 verfügbaren 7 476 M [D]: früh und voll nicht finanzierbar ohne Verteidigungsverlust. Ziel: Farm-Anteil 25–35 % bei optimaler Farm-Strategie.

**Modus ohne Farms** (später, ALS Siege): Kill-Bounty-Faktor ×2 statt Farm [O/HIGH ALS-S15].

---

## 13. Gacha (nur Spielwährung)

> **Rechtlicher Hinweis:** Dieser Abschnitt beschreibt Gacha **ausschließlich als Spielwährungssystem ohne Echtgeld** (Kristalle nur erspielbar). Das entspricht Option (a) der Risiko-Matrix in `docs/research/legal-gacha.md` §6 („niedrig“). Echtgeld-Premiumwährung plus Gacha ist dort Option (b) mit Risiko „hoch“ (CPC-Verfahren, DFA-Debatte); Gestaltungsregeln (Raten und Pity-Zähler anzeigen, keine Streaks, kein Handel) stehen dort in §2–§4. **Keine Rechtsberatung.** Fachanwalt vor jedem Echtgeld-Einsatz.

**AA:** 50 Gems je Summon, Mythic 0,25 % (Special 0,5 %), Pity 400, RR-Center-Pity mit Reset bei jedem Mythic, E[Center] = 304,9 Summons = 15 244 Gems [D/HIGH AA-S72]. **AV:** Legendary 4 % mit Pity 50, Mythic 0,5 % mit Pity 400 (2×); Vanguard-Pity 20 000–25 000 praktisch unerreichbar [O/HIGH AV-S9; D/HIGH]. **AE:** Legendary 10 % / Pity 50, Mythic 0,25 % / 400, Secret 0,01 % / 10 000; Beginner-Banner mit festem Pool [O/HIGH AE-S9]. **ASTD:** 5★ 2 % / Pity 80, 10er 450 [O/HIGH ASTD-S10]. **UTDZ:** sichtbarer Pity-Zähler seit 2.0 [O/HIGH UTDZ-S9]. **ALS:** mehrere Pity-Stufen, Luck-Boost [O/MEDIUM ALS-S6]. `balancing.md` §2d: Pity-Formel `E = (1−(1−p)^N)/p`, Raten und Pity-Zähler anzeigen, Erstes Top-Element in 2–4 Wochen aktivem Spiel (Zielwert, DESIGN), Duplikate in Fortschritt umwandeln. Lehren: Pity ≤ 1,5 × Erwartungswert, kein 20 000er-Pity [D/HIGH AV-S9; AV design-lessons 7]; ASTD-Lehre 8: Regeln konsistent und im Spiel anzeigen. **Wir nehmen** (`DESIGN`):

| Größe | Wert | Herleitung |
|---|---|---|
| Preis | 50 Kristalle je Einzel-Summon, 10er 450 | 50 im Standardbanner von AA, AV, ASTD, ALS, UTDZ, AE; 10er 450 in ASTD/UTDZ [O/HIGH AA-S72, AV-S9, ASTD-S10, UTDZ-S11, AE-S9; O/MEDIUM ALS-S6] |
| Raten je Pull | Rare 70,0 %, Epic 25,0 %, Legendary 4,0 %, Mythic 1,0 % (Summe 100,0 %) | Mythic 1 % wie ASTD Banner Z, Legendary 4 % wie AV; bei unseren 4 Rarities und kleinem Pool; AA Mythic 0,25 %, AE 0,25 % wären bei 4–6 Mythics im Pool zu zäh |
| Pity Mythic | harte Garantie beim 150. Pull ohne Mythic; Zähler setzt sich nur bei einem Mythic zurück | c = N·p = 1,5 (AV-Trait-Lehre „≤ 1,5 × Erwartung“) |
| Pity Legendary | harte Garantie beim 35. Pull ohne Legendary oder besser; Zähler setzt sich bei Legendary oder Mythic zurück | c = 35 · 0,04 = 1,4 |
| Featured-Banner | 1 Featured-Mythic erhält 50 % der Mythic-Treffer; **fällt ein Nicht-Featured-Mythic, ist das nächste Mythic garantiert das Featured** | AA/AV/AE Mitte 50 % [O/HIGH AA-S72, AV-S9, AE-S9]; AA-Hinweis „Reset nur durch das Ziel ist spielerfreundlicher“ [AA design-brief §4.4] |
| Banner | Standard (dauerhaft), Featured (wöchentlich, jede Featured-Unit kehrt im 8-Wochen-Zyklus zurück), Starter (einmalig) | Roblox rotiert stündlich/halbstündlich [O/HIGH AA-S72, AE-S9]; wir meiden Zeitdruck (`legal-gacha.md` §2: AGCM-Verfahren zu FOMO, §3 PEGI-Hinweis zu zeitlich begrenzten Angeboten, D-Quelle) |
| Starter-Banner | 50 Gratis-Pulls aus Tutorial/Story, fester Pool aus 4 Mythics (je 25 %), Mythic garantiert beim 50. Pull | AE Beginner-Banner mit festem Pool bis zum Mythic-Pity [O/HIGH AE-S9] |
| Anzeige | alle Raten, Pity-Zähler (Mythic/Legendary), Erwartungswerte vor dem Pull | UTDZ sichtbarer Zähler [O/HIGH UTDZ-S9]; `balancing.md` §2d |
| Duplikate | Sterne ★1–★3 benötigen 1/2/4 Kopien; je ★ +5 % Schaden (additiv in Lvl, §10) | ASTD-Lehre 9; `balancing.md` §2d; UTDZ Etherealize per Dupe [O/HIGH UTDZ-S11] |
| Kein Handel, kein Echtgeld-Kauf von Kristallen | – | Glücksspiel-Risiko steigt bei Rücktauschbarkeit [`legal-gacha.md` §1.3] |

**Erwartungswerte (D):** Mit `E = (1 − q^N)/p`, q = 1 − p:
- Mythic 1,0 %, N = 150: E = (1 − 0,99^150)/0,01 = **77,9 Pulls** (ohne Pity 100); P(Pity erreicht) = 0,99^149 = 22,4 %; Kosten 77,9 × 50 = **3 893 Kristalle** (mit 10er-Preis 45: 3 505).
- Legendary 4 %, N = 35: E = **19,0 Pulls** (ohne Pity 25).
- Featured-Mythic mit Garantie: 1,5 × 77,9 = **116,8 Pulls** = 5 839 Kristalle (10er: 5 255); AA-RR-Center 304,9 Pulls = 15 244 Gems [D/HIGH AA-S72]: unser Weg ist ca. 38 % so teuer.
- P(mindestens 1 Mythic) in n Pulls: 10 → 9,6 %, 50 → 39,5 %, 100 → 63,4 %, 149 → 77,6 % [D: 1 − 0,99^n], im 150. Pull 100 % durch Pity [D: 1 − 0,99^n].
- `balancing.md`-Beispiel p = 1 %, N = 80 → E ≈ 55; nachgerechnet 55,2 [D]. Unser N = 150 ist weicher als das, dafür näher an AV (c = 2) [D].

**Zufluss (DESIGN, Kalibrierung §19):**

| Quelle | Kristalle |
|---|---:|
| Erst-Clear Normal / Hard / Nightmare | 100 / 150 / 200 |
| Wiederholungs-Clear | 25 / 38 / 50 (= 25 % des Erst-Clears; AA 20/80 = 25 % [O/HIGH AA-S72]) |
| Tagesaufgabe (3 Clears) | 100 |
| Wochenaufgabe (7 Hard-Clears) | 300 |

Ein aktiver Spieler mit 4 Clears (Mix) pro Tag verdient ca. 4 × 35 + 100 = **240 Kristalle/Tag** [D]: ein Mythic nach 3 893/240 ≈ 16 Tagen (≈ 2,3 Wochen), ein Featured nach 5 839/240 ≈ 24 Tagen (3,5 Wochen): im `balancing.md`-Zielfenster 2–4 Wochen. Keine Login-Streaks (`legal-gacha.md` §2: KIDS-Act-Entwurf).

---

## 14. Traits

**AA:** 12 Traits, Chance bei neuer Unit 1 %, Top-Trait 0,1 % (Unique ×4 Schaden, max. 1 Platzierung), Reroll 1 Star Remnant (5 bei Mythic/Secret), Remnant 400 Gems im Merchant [O/HIGH AA-S72]. **AV:** 11 Traits, Monarch 0,1 % mit Pity 1 500 (c = 1,5), Reroll aus Challenges [O/HIGH AV-S8,S12]. **UTDZ:** Pity c = 1,25, Ruler 0,1 %, Limit 1 [O/HIGH UTDZ-S13]. **AE:** 2 Trait-Slots, Unbound 0,1 % / Pity 1 500 [O/HIGH AE-S10]. **ALS:** 19 Traits, Glitched 0,03 %, Zufall gestapelt; ALS-Lehre 3: Zufall nur an einer Stelle [R ALS design-lessons]; AE: zwei Zufallskanäle sind das Maximum [R AE design-lessons 7]. **ASTD, BTD6:** keine Traits. **Wir nehmen** (`DESIGN`) **einen** Trait-Slot je Unit und **keine** Stat-Potentials/Noten (AA/AE/ALS/UTDZ/AV haben sie; wir sparen den dritten Zufallskanal):

| Trait | Chance | Effekt | Vorlage |
|---|---:|---|---|
| Kraft I / II / III | 14,4 / 7,2 / 2,4 % (Familie 24 %) | Schaden +5 / +8 / +12 % | AV Vigor +5/10/15, AA Superior +10/12,5/15, ALS Sturdy +5/8/10 [O/HIGH AV-S8, AA-S72, ALS-S4] |
| Tempo I / II / III | 14,4 / 7,2 / 2,4 % | SPA −5 / −8 / −12 % (DPS ×1,053 / 1,087 / 1,136) | AA Nimble −5/−7,5/−12, AV Swift −5/−7,5/−12,5 |
| Weite I / II / III | 14,4 / 7,2 / 2,4 % | Range +5 / +8 / +12 % | AV Range, ALS Scoped |
| Gelehrter | 10 % | +50 % Unit-XP | AA Adept 9,99 %, AV Scholar 10 %, AE Enlightenment 9 % |
| Händler | 8 % | Farm +20 % Ertrag, sonst −10 % Upgrade-Kosten | AV Fortune 2,5 % [O/HIGH AV-S8] |
| Präzision | 6 % | Crit-Chance 20 %, ×1,5 (erwartet +10 %) | AE Precision, UTDZ Lethal [O/HIGH AE-S10, UTDZ-S13] |
| Ätherisch | 3 % | Schaden +15 %, SPA −15 %, Range +5 % (DPS ×1,35) | AV Ethereal +20/−20/+5 [O/HIGH AV-S8] |
| Einzigartig | 1 % | Schaden +200 % (×3), nur 1 Platzierung der Unit | AV Monarch +300 %, UTDZ Ruler +200 %, AE Unbound +350 %, AA Unique ×4, ALS Overlord/Avatar [O/HIGH AV-S8, UTDZ-S13, AE-S10, AA-S72, ALS-S4] |

Summe der Chancen 72 + 10 + 8 + 6 + 3 + 1 = 100 % [D]. Die Stufen I/II/III innerhalb einer Familie folgen 60/30/10 %.

- **Einzigartig als Limit-Trick** (AV-Monarch-Gewinn `(1+x)/Limit − 1`, [D/HIGH AV-S8]): Gewinn = 3/Limit − 1 = **+200 %** (Limit 1), **+50 %** (2), **0 %** (3), **−25 %** (4), **−40 %** (5) [D]. Nur Units mit Cap ≤ 2 profitieren; Mythics (Cap 2) sind das Ziel, billige Rares nicht.
- **Pity** (Top-Trait): harte Garantie beim 150. Reroll ohne „Einzigartig“, Zähler je Unit, Evolution/Stern setzen ihn nicht zurück (AV [D/HIGH AV-S8]) → E = (1 − 0,99^150)/0,01 = **77,9 Rerolls** (c = 1,5; AV 1,5, UTDZ 1,25 [D]). Für „Ätherisch oder besser“ (4 %): E0 = 25 Rerolls.
- **Reroll-Kosten:** 100 Gold je Wurf (kein eigener Reroll-Token, damit nur zwei Währungen bleiben); der alte Trait bleibt, bis der neue bestätigt wird (ALS „Skip-Funktion“ [O/HIGH ALS-S4]).
- **Gold-Zufluss (DESIGN):** 50 / 75 / 100 je Clear (Normal/Hard/Nightmare), Tagesaufgabe +150; Gelehrter-Trait wirkt auf XP, nicht auf Gold. 4 Clears/Tag ≈ 250 + 150 = 400 Gold ≈ 4 Rerolls/Tag; 77,9 Rerolls ≈ 20 Tage [D].
- Ein Slot je Unit; Doppel-Trait nicht im MVP (ALS erlaubt zwei Traits erst seit 2025-11-24, AE hat zwei Slots [O/HIGH ALS-S4, AE-S10]).

---

## 15. Progression (Level-Kurven)

**AA:** Unit-Level bis 100 (110 mit Limit Break), Damage L100 = ×9,204 (≈ ×1,0227 je Level), Kurve dazwischen UNKNOWN; Spieler-Level-Gates 5/20/40 [V/CONFIRMED AA-S04,S72]. **AV:** Schaden × 1,0235^Level, Spieler-Gates 10/30/50 [O/MEDIUM AV-S7; O/HIGH AV-S9,S18]. **UTDZ:** Level 70, 72 393 XP bis 70, Stat-Faktor 1,0045^Punkte; Wiki-Schätzung DPS mit Trait/Relics 50–100 × Basis [O/HIGH UTDZ-S11; D/LOW UTDZ-S14]. **AE:** Milestone-Belohnungen linear [D/HIGH AE-S12]. **BTD6:** Held-Level 20, Spieler-Level schaltet Tower frei [O/HIGH BTD-S15]. Lehren: UTDZ-Lehre 2 (Meta-Multiplikatoren begrenzen), AV-Lehre 8 (Gates klein halten), `balancing.md` §2b (Meta-Fortschritt erst nach einer Wippen-Phase). **Wir nehmen** (`DESIGN`):

**Unit-Level (1–40):**

```text
Lvl(L, Sterne) = 1 + 0,025·(L − 1) + 0,05·Sterne          L ≤ 40, Sterne ≤ 3
L = 1: 1,00 · L = 20: 1,475 · L = 40: 1,975 · L40 + ★3: 2,125
XP_bis_nächstes_Level(u) = 40 + 10·(u − 1)                  Summe L1 → L40 = 8 970 XP
```

- Kein exponentielles Wachstum wie AA/AV (≈ +2,3 % kumulativ je Level): linear +2,5 %, damit der Meta-Faktor bei **×1,975 (L40) bis ×2,125 (mit ★3)** endet; mit Trait (Ätherisch ×1,35) ≈ ×2,9, mit Einzigartig bei Cap 1–2 bis ×6,4 (nur Spezialfall). Typischer Meta-Faktor ≈ ×2,5. UTDZ liegt geschätzt bei ×50–100 [D/LOW UTDZ-S14], AA bei ×9,2 allein durch Level.
- Unit-XP je Clear an jede Unit im Team: 100 / 150 / 200 (Normal/Hard/Nightmare); 90 Normal-Clears bis L40 [D: 8 970/100].
- Hard-Empfehlung ab Level 17 (Faktor 1,4), Nightmare nur mit Traits/Sternen (Faktor ≥ 2,0).

**Spieler-Level (1–50):**

```text
XP_bis_nächstes_Level(L) = 100 + 25·(L − 1)
Summe L1 → L5: 550 · L10: 1 800 · L20: 6 175 · L30: 13 050 · L40: 22 425 · L50: 34 300
Spieler-XP je Clear: 100 / 150 / 200 (Normal / Hard / Nightmare); Infinite 50 je 5 Waves (AE [O/HIGH AE-S3])
```

[D: Σ_{L=1}^{L−1}(100 + 25(L−1)); Normal-Clears bis L10 = 18, bis L50 = 343; AE Normal-Act 115 / Hard 145 Player-EXP [O/HIGH AE-S3] als Größenvorlage.]

**Gates (klein, DESIGN):** Level 5 Hard, Level 10 Traits/Sterne, Level 15 Infinite, Level 25 Nightmare. Weitere Freischaltungen über Stage-Fortschritt (AA: „fast nur über Stage-Fortschritt“ [O/HIGH AA-S72]). Level-Meilenstein-Belohnungen alle 5 Level: 150 Kristalle + 200 Gold (AE Gems 350 + 120 je Meilenstein [D/HIGH AE-S12], AA 500 Gems je 5 Level; wir kleiner, weil Kristalle der Gacha-Hauptzufluss bleiben sollen).

---

## 16. Koop-Geldmodell (bis 4 Spieler)

**BTD6:** Koop bis 4 Spieler [V/CONFIRMED BTD-S1]; Geldmodell UNKNOWN [U BTD:meta]; Lag im Koop ab R100–160 [O/HIGH BTD-S18]. **AA, AV, ASTD:** Yen je Spieler getrennt (Rekonstruktion/indirekt) [R/MEDIUM AA-S72, AV-S18; R/LOW ASTD-S11]; AV-Skill „Teamplayer“ erlaubt Ausgaben für Verbündete [R/MEDIUM AV-S18]; AV Infinite: Schwierigkeit steigt mit Spielerzahl, Elemental Towers nicht [O/MEDIUM AV-S19,S18]; AE: HP hängt von der Spielerzahl ab, Formel UNKNOWN [O/HIGH AE-S8]; AA: Party-Scaling UNKNOWN, DESIGN-Option `partyMult(n) = 1 + 0,5·(n−1)` [AA:waves]. **UTDZ:** UNKNOWN (World Raid 12 Spieler mit kumuliertem Schadensziel [O/HIGH UTDZ-S16]). **Wir nehmen** (`DESIGN`):

| Regel | Wert | Begründung |
|---|---|---|
| Geld | getrennte Münzen je Spieler; Start 1 000 je Spieler | AA/AV/ASTD |
| Spenden | Spieler können in Schritten von 50 M an Mitspieler geben (kein Verlust) | AV „Teamplayer“; ermöglicht Farm-Rolle ohne Zwang |
| Wave-Bonus | voll an jeden Spieler | BTD6 Rundenbonus je Spieler (Annahme, Koop-Regeln UNKNOWN) |
| Kill-Bounty | nach **Schadensanteil** am Gegner verteilt (Server summiert Schaden je Spieler), nicht an den letzten Treffer | verhindert Kill-Stealing; kleiner Mehraufwand im Server |
| Gegner-HP | Faktor `h(n) = 1 + 0,75·(n − 1)` auf HP (nicht auf Anzahl): 1 / 1,75 / 2,5 / 3,25 | AV skaliert HP je Spieler [O/MEDIUM AV-S23]; Entity-Zahl bleibt gleich (BTD6-Lag-Lehre, Super-Keramik/Fortified als HP-statt-Anzahl [O/HIGH BTD-S7]) |
| Bounty-Basis | enthält `h(n)`, nicht den Schwierigkeitsfaktor | sonst bekäme jeder Mitspieler nur 1/n des Solo-Einkommens |
| Placement-Caps | je Spieler | §7 |
| Buffs/Auren | wirken auf Units aller Spieler | Synergie, AA global Buffs |
| Base-HP | geteilt 100 | §2 |
| Skip | Mehrheit der verbundenen Spieler | – |
| Trennung | getrennt verbundene Spieler: Units bleiben, Geldkonto eingefroren, Wiedereintritt möglich | BTD6-Lehre Verbindungsabbrüche [O/MEDIUM BTD-S18] |

Folge (D): Pro Spieler bleibt der Kill-Bounty `h(n)/n` der Solo-Werte (1,00 / 0,875 / 0,833 / 0,8125) bei derselben HP-Last je Spieler; das Wave-Bonus-Einkommen bleibt voll. Beispiel Wave 20: Pool Solo 9 689 → 2 Spieler 16 956 → 3 Spieler 24 222 → 4 Spieler 31 489 HP [D: 9 689 · h]. Herleitung von 0,75: Das Einkommen wächst linear mit n, die DPS-Effizienz je zusätzlichem Spieler liegt etwas darunter (Range-Überlappung, Overkill); 0,75 statt 1,0 macht Koop leicht leichter (`partyMult` der AA-Doku 0,5 wäre deutlich leichter). Kalibrierpunkt (§19): Siegquote je Spielerzahl auf ±10 Prozentpunkte angleichen.

---

## 17. Lehren aus den design-lessons: was vermeiden

| Problem (Spiel, Quelle) | Unsere Regel |
|---|---|
| Zahlenspirale: ASTD Schaden 9 → 20 Mio., Gegner-HP Milliarden [O/HIGH ASTD-S20,S23]; ALS Schaden bis 2,4 Mrd., Caps 25 Billionen [O/HIGH ALS-S8]; AV 18 → 80 000 und 2^32-HP-Grenze [O/HIGH AV-S3,S14] | alle Werte unter 10^6 bis Infinite-Wave 100 (Boss Wave 100 ≈ 161 000 HP: 30 × 5 382 [D]); Anzeige ohne Abkürzung bis 99 999 |
| Währungs-Zoo (ALS über 15 [O/HIGH ALS-S10]) | zwei Meta-Währungen; Modus-Belohnungen münden in Kristalle/Gold/XP |
| Zufall auf Zufall (ALS Gacha + Trait + Noten + Worthiness [O/HIGH ALS-S4–S6]; AE zwei Kanäle als Maximum) | nur Gacha und Trait, mit sichtbarem Pity |
| Unerreichbares Pity (AV Vanguard 20 000–25 000, UTDZ Secret 24 000, AE Secret 10 000 [D/HIGH AV-S9, UTDZ-S11, AE-S9]) | Pity ≤ 150 Pulls und ≤ 1,5 × Erwartung |
| Unklare/widersprüchliche Regeln (ASTD Pity 120/140; AE Burn 1 vs. 0,5; AE Arcane Magic 10 vs. 7 [O/HIGH ASTD-S10, AE-S6,S7]) | Daten nur in einer JSON-Quelle (Config), Regeln im Spiel anzeigen |
| Reset bei jedem Treffer statt beim Ziel (AA RR: E[Center] 304,9) | Reset nur der Rarity-Zähler, Featured-Garantie nach verlorenem 50:50 |
| Evolution mit 16-h-Quests (AV [O/HIGH AV-S15]); Endgame-Materialketten (ALS ~1 800 Shards + 1 000 Essenzen [O/HIGH ALS-S8]) | Sterne über Duplikate, keine Grind-Quests |
| Meta-Multiplikatoren ×50–100 machen Matches vom Account abhängig (UTDZ [D/LOW UTDZ-S14]) | Meta-Faktor typisch ≤ ×2,5; Match-Entscheidungen zählen |
| Single-Placement-Trait dominiert (AV/ALS/UTDZ/AE); ASTD musste DoT für Single-Placement auf 25 % senken [O/HIGH ASTD-S6] | Einzigartig = ×3 nur für Cap ≤ 2 sinnvoll; DoT-Regeln vorab (§10) |
| Farm-Meta-Verengung (ASTD Jeff „only unit to stay on meta“ [O/MEDIUM ASTD-S13]) | Farm Cap 2, Payback 8–9,5, Anteil 25–35 %, Farm-Fenster; Modus ohne Farm |
| Skip-/Autoclicker-Zwang (ASTD Gauntlet [O/MEDIUM ASTD-S9]) | eingebaute Skip-/Auto-Ability-Schalter |
| Nerf-Zyklen entwerten teure Units (ALS [O/MEDIUM ALS-S19,S23]) | Rotation und Modi statt Nerfs; Werte nur per Config-Patch mit Changelog |
| Ein-Treffer-Ende durch Leak (BTD6 Keramik 104 auf Hard [O/HIGH BTD-S10]) | Boss-Leak 50 |
| Preis-Stapel-Bug (BTD6 Impoppable stapelte auf Hard, v37.1 [O/HIGH BTD-S12]) | Modifikatoren immer auf Basis |
| Lag im Koop ab R100–160 (BTD6 [O/HIGH BTD-S18]) | 60 Units, 80 Gegner, HP statt Anzahl skalieren |
| Monetarisierung in einem Bezahlspiel (BTD6 [O/HIGH BTD-S18]); Glücksspiel-/Kinderschutzrisiko | Kristalle nicht kaufbar; `legal-gacha.md` beachten |
| Namens-/Versionswechsel zersplittert Doku (UTDZ X → Z [D/MEDIUM UTDZ-S21]) | stabiler Name, JSON als kanonische Datenquelle |
| Dauer-CC (AV Lockouts als Gegenmaßnahme [O/HIGH AV-S11]) | CC-Immunität 6 s nach Stun/Freeze |
| Leaderboard-/Gold-Cap erst nachträglich (AV [O/HIGH AV-S19]) | serverseitige Validierung und Rate-Limits von Anfang an; keine Streaks (`legal-gacha.md` §2) |

---

## 18. Startwerte auf einen Blick

> **Hinweis (Runde 3):** Einige dieser Werte wurden mit dem Simulator kalibriert (u. a. HP-Wachstum 1,12 → 1,1525, γ-Decay 0,92 → 0,894, Boss-Leak 50 → 34, Schwierigkeits- und Koop-Faktoren, Farm-Ertrag ×1,3). Maßgeblich sind die Daten in `sim/data/`; Änderungen und Gründe: [balancing/kalibrierung.md](../balancing/kalibrierung.md), Ergebnisse: [balancing/report.md](../balancing/report.md).

Alle Werte `DESIGN`, Herleitung im jeweiligen Abschnitt.

| Parameter | Startwert | § |
|---|---|---|
| Stage | 20 Waves, Wave-Timer 45 s, Boss in Wave 10 und 20, Elite in Wave 5 und 15 | 0, 5 |
| Startgeld | 1 000 M je Spieler | 1 |
| Base-HP / Leak | 100 / Grunt 1, Runner 1, Flyer 2, Brute 3, Elite 10, Boss 50 | 2 |
| Wave-Bonus | `100 + 5n` | 3 |
| Kill-Bounty | `round(γ(n) · HP)`, `γ(n) = 0,70 · 0,92^(n−1)` | 3 |
| Einkommen 20 Waves (solo, ohne Farm) | 15 923 M (+ 1 000 Start) | 3, 5 |
| Gegner-HP Grunt | `25 · 1,12^(n−1)` (W1 25, W10 69, W20 215) | 4 |
| Archetypen f_HP / f_Speed | Grunt 1/1; Runner 0,7/1,7; Brute 3/0,7; Flyer 0,9/1,3; Elite 8/0,8; Boss 30/0,5; Splitter 1 + 2×0,35 | 4 |
| Schwierigkeit | Hard HP ×1,4, Speed ×1,1; Nightmare HP ×2,0, Speed ×1,2 | 4 |
| Infinite | HP ∝ (n/20)², γ ∝ (20/n)², Speed +1 %/Wave bis ×1,5, max. 60 Gegner | 3 |
| Platzierungskosten | Rare 300, Epic 400, Legendary 650, Mythic 1 000 | 6 |
| Upgrade-Faktor g / Stufen | Rare 1,50 / 4; Epic 1,40 / 5; Legendary 1,30 / 6; Mythic 1,29 / 7 (erstes Upgrade = P) | 6 |
| Σ/Platzierung | 9,1 / 11,9 / 13,8 / 18,1 | 6 |
| DPS0 → Max | 10 → 45; 14 → 84; 22 → 154; 38 → 323 | 6 |
| SPA0 / Range0 → Max | Rare 2,0 s / 3,0 → 4,0; Epic 2,5 / 3,5 → 4,8; Legendary 3,5 / 4,0 → 5,5; Mythic 5,0 / 4,5 → 6,5 (SPA −20 % am Ende) | 6 |
| Placement-Caps | Rare 5, Epic 4, Legendary 3, Mythic 2, Farm 2, Einzel-Units 1; 6 Slots; Team max. 60 Units, 80 Gegner | 7 |
| Verkauf | 60 % (Farm 40 %), `floor` | 8 |
| Targeting | First (Standard), Last, Close, Strongest (max. HP) | 9 |
| Schaden | `Basis · Lvl · (1+Trait) · (1+min(Buff; 1)) · (1+min(Verwundbar; 0,5)) · Element · 100/(100+R−Pen) · Crit` | 10 |
| Rüstung R | Brute 20, Elite 30, Boss 40, Armored +80 | 10 |
| Element | ×1,5 / ×1,0 / ×0,5, 5 zyklische + Neutral, aktiv ab Hard | 10 |
| CC | Stun/Freeze 1,5 s + 6 s Sperre (Boss ×0,5 Dauer); Slow −40 % 4 s, Gesamt max. −60 % | 10 |
| Buff-Caps | Schaden +100 %, Tempo +60 %, Range +30 %, Verwundbar +50 % | 11 |
| Farm | Epic, 400 M, Stufen +300/+450/+700/+1 100, Ertrag 50/90/135/205/310 je Wave, Payback 8–9,5 Waves, Cap 2 | 12 |
| Gacha | 50 Kristalle (10er 450); Rare 70 / Epic 25 / Legendary 4 / Mythic 1 %; Pity Mythic 150, Legendary 35; Featured 50 % + Garantie | 13 |
| E[Pulls] | Mythic 77,9; Legendary 19,0; Featured-Mythic 116,8 | 13 |
| Traits | 1 Slot; 8 Typen; Einzigartig 1 % (×3, Limit 1), Pity 150 Rerolls; Reroll 100 Gold | 14 |
| Level | Unit-Level 1–40, +2,5 %/Level, +5 %/Stern (max. 3), Meta-Faktor ≈ ×2,5; Spieler-Level 1–50, `XP = 100 + 25(L−1)` | 15 |
| Koop | getrennte Konten, Bounty nach Schadensanteil, HP `h = 1 + 0,75(n−1)`, Spenden 50 M | 16 |

---

## 19. Muss im Playtest kalibriert werden

Reihenfolge nach Risiko. Vor Playtests ein Simulationsskript (Machinations-Stil, `balancing.md` Q3) für Einkommen, Pool und Kapazität bauen; die Rechnungen in diesem Dokument sind Hand-Näherungen.

1. **Kapazitätsfaktor 0,025 DPS je Münze und Zeitfenster 20 s** (§4): reale Verteidigung (AoE, Überkill, Reichweiten-Überlappung, Platzierungsfehler) liegt vermutlich 1,5–3 × darüber/darunter; Pool/Kapazität in §5 ist nur eine Skala. Messgröße: Anteil verlorener Waves je Wave-Nummer, Ziel 10–20 % im späten Abschnitt (`balancing.md` §2a).
2. **g = 1,12 und HP-Basis 25**: Verlauf der Leak-Rate je Wave; Boss-Waves 10 und 20 (Pool/Kapazität 1,09 und 1,26) und Rüstungswirkung.
3. **Einkommenskonstanten** `W(n) = 100 + 5n`, `γ = 0,70 · 0,92^(n−1)`, Start 1 000: Münzen bei Wave 5/10/20 gegen die Tabelle in §5 (±15 %).
4. **Rüstungswerte** (Brute 20, Elite 30, Boss 40, Armored +80) und Pen: Wirkung auf Single-Target- gegen AoE-Builds.
5. **Grenz-Effizienz-Kurve** (Start ca. 1,0 statt AA 0,70): bevorzugen Spieler Upgrades gegenüber Zweit-Units zu stark? Anpassung über `d`.
6. **Farm**: Payback 8–9,5, Cap 2, Farm-Anteil 25–35 % (Simulation 28–38 %), Farm-Fenster ab Wave 9–12; Anteil der Spieler, die Farm überspringen.
7. **Flyer** (Speed 1,3, 30 % Hill/Hybrid-Anteil, Waves 8/11/14/16/18): Verlust-Rate in Flyer-Waves gegenüber Boden-Waves.
8. **Placement-Caps 5/4/3/2** und Slot-Kosten: Wie oft wird der Cap erreicht, wie oft bleibt Geld ungenutzt (Cap zu eng) oder fehlt Platz (Cap zu weit)?
9. **Verkauf 60/40 %**: Häufigkeit des Umbauens; Exploit-Prüfung (Kauf/Verkauf-Zyklen).
10. **Koop `h(n) = 1 + 0,75(n−1)`**: Siegquote je Spielerzahl auf ±10 Prozentpunkte angleichen; Schadensanteil-Verteilung des Bounty; Spenden-Nutzung.
11. **Wave-Timer 45 s**, Spawn-Fenster ≤ 35 s, Skip-Mehrheit, Dauer pro Stage (Ziel ca. 15 min).
12. **Schwierigkeiten** Hard ×1,4 / Nightmare ×2,0: Siegquote bei empfohlenem Level (L17 bzw. L40 + Trait).
13. **Infinite**: HP ∝ n², γ ∝ n^−2, Einkommen flach; erwartete Median-Endwave (Ziel 30–40), Streuung, Entity-Zahl, Browser-FPS bei 60 Units/80 Gegnern.
14. **Gacha-Zufluss**: Zeit bis zum ersten Mythic (Ziel 2–4 Wochen aktives Spiel); Pity-Werte 150/35; Starter-Banner (50 Pulls); Featured-Garantie; Dupe-Sterne (Kopienbedarf 1/2/4).
15. **Trait-Raten** und Reroll-Kosten: Einzigartig 1 %, Zufriedenheit nach n Rerolls, Gold-Zufluss (Rerolls je Tag 4).
16. **Meta-Faktor** (+2,5 %/Level, +5 %/Stern): Spanne Neuling gegen Maxspieler in derselben Stage (Ziel ≤ ×2,5 typisch, Koop-Mix möglich).
17. **CC-Sperren und Boss-CC** (6 s, Boss Dauer ×0,5): Dauer-Stun möglich? Bosse zu leicht oder zu schwer?
18. **Elemente ab Hard** (×1,5/×0,5): Teambau-Zwang vs. Spielbarkeit mit zufälligem Team.
19. **Level-Kurven** (Unit 8 970 XP bis L40, Spieler 34 300 XP bis L50, 100/150/200 XP je Clear): Zeit bis Cap (Ziel 2–3 Monate bei 1 h/Tag).
20. **Buff-Caps** (+100 % / +60 % / +30 %, Verwundbar +50 %): reale Spitzen-DPS in Koop-Teams gegen Boss-Pools.
21. **Sichtbarkeit der Zahlen**: Schaden/s, HP, Raten, Pity-Zähler anzeigen (`balancing.md` Q4/§2d); Lesbarkeit unter 10^5.

**Offene UNKNOWN-Punkte, die diese Datei nicht schließen kann:** AA-Startgeld/Kill-Yen/Wave-Yen/Base-HP/Wave-Zusammensetzung (alle UNKNOWN in AA und den fünf Roblox-Spielen); BTD6-Co-Op-Geldmodell; Targeting-Modi von AV/ALS/UTDZ/AE; Crit-Basiswerte; Verkaufswert von AV/UTDZ. Sie werden hier als `DESIGN` ersetzt, nicht belegt.
