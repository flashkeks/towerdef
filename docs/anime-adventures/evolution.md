# Evolution

Evolution verwandelt eine Unit gegen Materialien in eine stärkere Form mit eigenem Datenblatt. Diese Datei beschreibt Regeln, Materialmuster und Statistik. Die **vollständige Matrix aller 219 Rezepte** steht in **[evolution-matrix.md](evolution-matrix.md)**, maschinenlesbar in [`data/items.json`](data/items.json) unter `evolutionRecipes`.

**Hauptquelle:** Wiki-Datenmodul `Module:UnitData/Data`, Block `evolve` je Unit (S65, RR-Stand 2026-03-18), abgeglichen mit dem LEGACY-Endstand (S66, 2023-12-14). Itemnamen aus `Module:ItemData/Data` (S68). Werte aus den Modulen gelten als `OBSERVED · HIGH`, Rechnungen als `DERIVED`.

Legende: `ART · CONFIDENCE · [Quelle]`, siehe [README](README.md#kennzeichnung). `L` = LEGACY (07/2022–12/2023), `RR` = Re-Release (ab 25.12.2024).

---

## Mechanik

| Aspekt | Wert | Tag |
|---|---|---|
| Ort | Evolve-Bereich in der Lobby („Traits and Evolve“-Bereich; dort stehen auch Trait-NPC, Potential-Reroll und Limit Breaker) | OBSERVED · HIGH · [S03 → S72:Traits, S72:Powerups] |
| Input | Basis-Unit + Items (Star Fruits und/oder Spezialitems) + optional weitere Units + optional Takedowns/Kills der Basis-Unit | OBSERVED · HIGH · [S65] |
| Basis-Unit | wird immer verbraucht; sie steht im Modul selbst in `unit_requirement` (Menge 1) | OBSERVED · HIGH · [S65] |
| Output | neue Unit-ID mit eigenem Datenblatt: eigene Upgrade-Tabelle, meist neue Angriffe/Fähigkeiten | OBSERVED · HIGH · [S65] |
| Rezeptanzahl | **219** Rezepte (RR), davon **190** schon im LEGACY-Endstand und **29** nur RR | OBSERVED · HIGH · [S65, S66] |
| Rarität | 179× M→M, 29× S→S, 6× L→M, 4× M→S, 1× E→L (Details [unten](#rarität-vorher--nachher)) | OBSERVED · HIGH · [S65] |
| Potential (Stat-Ränge) | Nach der Evolution sind die Potential-Werte **immer besser** als vorher. Ausnahme: ein Wert, der schon SSS ist, bleibt gleich. Je höher der Wert vorher, desto kleiner der Zuwachs. Genaue Formel UNKNOWN | OBSERVED · MEDIUM · [S11 → S72:Powerups] |
| Trait | Wird übernommen. Belegt ist das für Legendary → Mythic; für die übrigen Fälle wird es nur angenommen | OBSERVED · MEDIUM · [S72:Traits] |
| Level / XP | **UNKNOWN** | UNKNOWN |
| Takedowns | zählen für jede Unit, die den Gegner getroffen hat; der letzte Treffer ist nicht nötig. „Kills“ zählen nur für den Todesstoß | OBSERVED · HIGH · [S72:Frequently_Asked_Questions] |
| Nebenbelohnung | Evolvieren gibt Stat Cubes. Menge UNKNOWN | OBSERVED · MEDIUM · [S72:Powerups] |
| Evolve-Quests | Es gibt Evolve-Quests, sie belohnen u. a. Reroll Tokens. Inhalt UNKNOWN | OBSERVED · MEDIUM · [S03 → S72:Traits, S72:Update_Log] |
| Folgesysteme | Limit Break: Evolvierte Mythic/Secret zählen **doppelt** (6 statt 12 Opfer-Units). Trade-Tax: unevolvierte Mythic/Secret 4.000 Gems, evolvierte 6.000 Gems | OBSERVED · HIGH · [S72:Powerups, S72:Update_Log, S72:Trading] |
| Shiny | Das Shiny-Rezept ist fast immer identisch, verlangt aber die Opfer-Units als Shiny (siehe [Shiny](#shiny-rezepte)) | OBSERVED · HIGH · [S65] |

### Rezept-Datenmodell (Modul)

| Modulfeld | Bedeutung | Vorkommen (von 219) |
|---|---|---:|
| `evolve_unit` | Ziel-ID; bei Zufalls-Evolution Liste `{unit_id, chance}` | 219 (2 als Liste) |
| `evolve_text` | Kurztext im UI („+40% Attack, +Ability …“) | 219 |
| `normal.item_requirement` | Liste `{item_id, amount}` | 219 (bei 7 leer) |
| `normal.unit_requirement` | Liste `{unit_id, amount}` inkl. Basis | 219 |
| `normal._takedown_requirement` | Takedowns der Basis-Unit | 122 |
| `normal._kill_requirement` | Kills der Basis-Unit | 5 |
| `_hogyoku_xp_requirement` / `_behelit_xp_requirement` | Fortschritt 0–1 eines Sonder-Items | 2 / 1 |
| `_custom_requirements` | Sonderbedingung, im Modul nicht beschrieben | 3 |
| `shiny.*` | dieselben Felder für das Shiny-Rezept, `unit_requirement[].shiny = true` | 219 |
| `hide_from_ui` | Rezept erscheint nicht im normalen Evolve-Menü | 6 |
| `evolve_unit_client_override` | Platzhalter-Unit für die Anzeige vor einer Zufalls-Evolution | 2 |

OBSERVED · HIGH · [S65]

---

## Materialmuster

### Rezepttypen

| Muster | Anzahl | davon Mythic / Secret / Legendary / Epic | typisch |
|---|---:|---|---|
| nur Spezialitem(s), keine Star Fruits | 101 | 93 / 7 / 1 / 0 | gecraftetes Evo-Item (Gold + SF) oder Shop-/Stage-Item |
| Star Fruits + Spezialitem(s) | 97 | 75 / 22 / 0 / 0 | Welt-/Portal-Unit: Stage-Drops + SF-Bündel + Takedowns |
| nur Star Fruits | 10 | 10 / 0 / 0 / 0 | RR-Units ohne eigenes Item |
| Spezialitem + zusätzliche Units | 4 | 1 / 0 / 3 / 0 | Raid-Units (z. B. 2× bzw. 4× dieselbe Unit) |
| ganz ohne Items | 4 | 4 / 0 / 0 / 0 | Sonderketten (Kills, Hogyoku, Behelit, „Sunshine“) |
| ohne Items, nur Units | 3 | 0 / 0 / 2 / 1 | Kopien-Fusion (10× Gene, 4× Experiment X) |

OBSERVED · HIGH · [S65] · Zählung DERIVED

Zusammengefasst:

- **107** Rezepte verlangen Star Fruits, **198** mindestens ein Spezialitem.
- Es gibt 169 verschiedene Spezialitems.
- 130 Rezepte nutzen genau ein Spezialitem, 36 drei, 26 zwei, einige 4–6 (Sets wie 6 DISCs oder 5 Seelen).
- Häufige Mengen: 1× (99-mal), 3× (38), 40× (30, meist XP-Food), 12× (27), 50× (23).
- 36 Rezepte verlangen **XP-Food** als Material, z. B. 40× Cooked Fish oder 20× Ghoul Coffee.

DERIVED · HIGH · [S65, S68]

Mehrfach genutzte Material-Sets (Welt-Sets): Dieselben Stage-Drops werden für mehrere Units derselben Welt genutzt. Beispiele:

- 6 Rezepte: Overlord’s Rings, Fabled-Kingdom-Drops, SAO-Kristalle, Full Power Core, Gun Devil Bullet, Lesser Grail, SMILE Fruit
- 7 Rezepte: Sacred Treasure

OBSERVED · HIGH · [S65]

### Star-Fruit-Bündel

Sechs Sorten: normal, Rot, Pink, Blau, Grün, **Regenbogen** (Item-ID `StarFruitEpic`). Jedes der 107 SF-Rezepte enthält **normal und Regenbogen**. Von den vier Farben nutzt das Rezept **3** (89 Rezepte) oder **alle 4** (18). OBSERVED · HIGH · [S65]

| Kennzahl (107 SF-Rezepte) | normal | Rot | Pink | Blau | Grün | Regenbogen |
|---|---:|---:|---:|---:|---:|---:|
| Rezepte mit dieser Sorte | 107 | 90 | 84 | 89 | 76 | 107 |
| Summe über alle Rezepte | 1.291 | 346 | 337 | 335 | 290 | 127 |
| häufigster Wert | 12 (75×) | – | – | – | – | 1 (95×) |

DERIVED · HIGH · [S65]

**Fruit-Kosten nach Rarität der Basis-Unit**

| Rarität | SF-Rezepte | Median Summe (min–max) | Median normal / Rot / Pink / Blau / Grün / Regenbogen | normal = 12 | Regenbogen = 1 |
|---|---:|---|---|---:|---:|
| Mythic | 85 | 24 (7–79) | 12 / 3 / 3 / 3 / 3 / 1 | 54 | 74 |
| Secret | 22 | 25 (13–39) | 12 / 4 / 3 / 3 / 3 / 1 | 21 | 21 |
| Legendary, Epic | 0 | – | – | – | – |

DERIVED · HIGH · [S65]

Standardbündel: **12 normal + zusammen 10–12 Farbfrüchte (3–5 je Farbe, eine Farbe fehlt) + 1 Regenbogen.** 54 Rezepte haben eine Farbsumme von 10 oder 12. Die häufigsten konkreten Bündel:

- 12/4/3/0/3/1 (5×)
- 12/4/3/4/0/1 (4×)
- 12/4/3/3/0/1 (4×)

Abweichungen:

| Typ | Bündel | Anzahl / Beispiele |
|---|---|---|
| reduziert (Update 18 bzw. 20, siehe [unten](#legacy-vs-rr-geänderte-rezepte)) | 3–4 normal + je 1 Farbe + 1 Regenbogen, z. B. 4/1/1/1/0/1 (6×) und 3/1/0/1/2/1 (5×) | 16 Rezepte |
| groß, ohne eigenes Spezialitem | 30–35 normal, 8–13 je Farbe, 3 Regenbogen | Spider, Puppet Girl, Bunny |
| Secret-Sonderfall | 12/6/6/6/6/3 | Supreme Being |

DERIVED · HIGH · [S65]

**Gem-Gegenwert (DERIVED · MEDIUM, nur LEGACY-Preise):** Der Merchant verkaufte normale Star Fruits für 50 Gems, Farbfrüchte für 200 Gems und Regenbogen für 300 Gems [S72:Travelling_Merchant_Shop, S73]. Damit kostet ein SF-Bündel im Median **3.100 Gems** (Spanne 1.050–11.600). Rechenweg: normal × 50 + Farben × 200 + Regenbogen × 300. Blau/Pink-Preis laut S72 ebenfalls 200. Ob der RR-Merchant dieselben Preise nutzt, ist UNKNOWN.

### Gecraftete Evo-Items (Gold + Star Fruits)

Viele „nur Spezialitem“-Rezepte verlangen genau **ein** Item, das aus Gold und Star Fruits gecraftet wird. Laut Wiki gab es diese Items im LEGACY alternativ beim Traveling Merchant gegen Gems. Seit **Update 19** (RR) gibt es dort keine Evo-Items mehr. OBSERVED · HIGH · [S72:Evolution, S72:Travelling_Merchant_Shop]

| Kennzahl | Wert | Tag |
|---|---|---|
| Crafting-Rezepte in S68 | 44 Items mit `crafting_recipe` + `crafting_cost` (Gold), davon 42 Evo-Items (40 aus Gold + Star Fruits, 2 aus Gold + anderem Material: Promise Ring, Endless Tome) und 2 Relic-Materialien | OBSERVED · HIGH · [S68] |
| Gold-Kosten | 2.000–8.000 Gold, häufig 3.500 / 7.000 / 7.500 | OBSERVED · HIGH · [S68] |
| SF im Item | 14–73 Früchte, 1–4 Regenbogen (40 reine SF-Rezepte) | OBSERVED · HIGH · [S68] |
| Merchant-Preis (LEGACY) | 1.850–8.000 Gems je Item | OBSERVED · MEDIUM · [S72:Evolution] |
| Alternativen | einige Items aus Battle-Pass-Stufe 25/50 („Premium … Pass“), Raid-Shops (25–350 Raid-Währung), Event-Shops (5.000 Event-Währung) | OBSERVED · HIGH · [S72:Evolution] |

Beispiele mit Bestandswerten:

| Item | Verwendet für (RR / LEGACY) | Gold | Star Fruits n/R/P/B/G/RB | Merchant L | Tag |
|---|---|---:|---|---:|---|
| Golden Rose (`netero_rose`) | Prayer Master / Neteru (+ 40× Cooked Fish) | 7.500 | 32/10/5/5/10/3 | 7.000 Gems | OBSERVED · HIGH · [S46 → S68, S72:Evolution] |
| Thunder Spears | Eccentric Researcher / Hanje | 7.000 | 15/4/3/3/4/2 | – (Pass-Stufe 25) | OBSERVED · HIGH · [S68] |
| Hestia Knife (`cranelsword`) | Player / Bell | 6.500 | 15/3/3/3/3/2 | UNKNOWN | OBSERVED · LOW · [S46] (fehlt in S68 und S72) |

Bei 8 Items weichen das Rezept in S68 (RR-Modul 2025-04) und die Tabelle auf der Wiki-Seite `Evolution` voneinander ab. Betroffen sind z. B.:

- Arsenal Briefcase: S68 7.500 Gold + 35/10/0/8/8/3, Wiki 2.500 Gold + 12/3/0/2/2/1
- Hat of the Conqueror: S68 7.000 Gold, Wiki 2.000 Gold
- Forbidden Candy
- Scales of the Salamander

Die Wiki-Seite ist laut eigenem Hinweis veraltet. Für den RR-Stand gilt S68. OBSERVED · MEDIUM · [S68 vs. S72:Evolution]

### Takedowns

| Takedown-Anforderung | Rezepte | Mythic | Secret | Legendary/Epic |
|---|---:|---:|---:|---:|
| keine | 97 | 85 | 5 | 7 |
| 7.500 | 65 | 51 | 14 | 0 |
| 5.000 | 49 | 39 | 10 | 0 |
| 2.500 | 4 | 4 | 0 | 0 |
| 1.000 / 500 / 100 / 0 | je 1 | 4 | 0 | 0 |

OBSERVED · HIGH · [S65] · Zählung DERIVED

**Muster:** Takedowns hängen am Rezepttyp.

- **SF + Spezialitem:** 91 von 97 verlangen 5.000 oder 7.500 Takedowns.
- **Nur Spezialitem:** 82 von 101 verlangen keine.

Das passt zum Wiki-Hinweis, dass „die meisten Welt-/Raid-Units“ Takedowns zum Evolvieren brauchen. Für Worthiness gilt: 100 Takedowns = 1 %, 10.000 Takedowns = 100 %. DERIVED · HIGH · [S65, S72:Frequently_Asked_Questions, S72:Powerups]

### Zusätzliche Units (Kopien)

| Basis | zusätzlich zu opfern | Spezialitem | Tag |
|---|---|---|---|
| Gene (L) | 9 weitere Gene (10 gesamt) | – | OBSERVED · HIGH · [S65] |
| Experiment X (Imperfect) (E) | 3 weitere (4 gesamt), plus 300 Kills | – | OBSERVED · HIGH · [S65] |
| Experiment X (Semi-Perfect) (L) | 3 weitere (4 gesamt), plus 2.500 Kills | – | OBSERVED · HIGH · [S65] |
| Fox Ninja (Demon Cloak) (L) | 3 weitere (4 gesamt) | Hidden Seal | OBSERVED · HIGH · [S65] |
| Martial Demon (L) | 3 weitere (4 gesamt) | 2× Demon Beads | OBSERVED · HIGH · [S65] |
| Donut | 4× Martial Demon | 3× Blazing Creme Donut | OBSERVED · HIGH · [S65] |
| Chunks (L) | 1 weitere (RR); LEGACY: 3 weitere | Mini Time Machine | OBSERVED · HIGH · [S65, S66] |

Alle übrigen 212 Rezepte verbrauchen nur die Basis-Unit. Kopien-Fusion ist also ein Muster für **Legendary-Raid-Units**, nicht für Banner-Mythics. DERIVED · HIGH

### Shiny-Rezepte

| Befund | Anzahl | Tag |
|---|---:|---|
| Shiny-Rezept = Normalrezept, Opfer-Units müssen Shiny sein | 205 | OBSERVED · HIGH · [S65] |
| Shiny-Rezept ohne Shiny-Pflicht im Modul (Units haben laut `units.json` eine Shiny-Variante; Wirkung UNKNOWN) | 14 | OBSERVED · MEDIUM · [S65] |
| Shiny-Items abweichend | 2 | OBSERVED · HIGH · [S65] |

Die zwei Abweichungen:

| Basis | Normal (RR) | Shiny (RR) |
|---|---|---|
| Diane | 12 Demonic Chalice + 12 Demonic Horn + 6 Fairy Petals + 12/0/3/4/3/1 SF | dasselbe **ohne Regenbogen-Frucht** |
| Stringy | 40× SMILE Fruit + 12/4/0/4/4/1 SF | 12× SMILE Fruit + 3/1/0/1/2/1 SF (= LEGACY-Normalrezept) |

Vermutlich wurden hier Pflegefehler im Modul nicht nachgezogen. RECONSTRUCTED · LOW

LEGACY-Sonderfall Veko: Das Normalrezept verlangt 15 Vego + 15 Carrot + Fusion Jacket. Für die Shiny-Variante reichen 5 Shiny Vego + 5 Shiny Carrot. Kopienzahlen können sich also bei Shiny unterscheiden. OBSERVED · MEDIUM · [S72:???]

---

## Stat-Änderungen

### Damage-Faktor (DERIVED, gegen Evo-Text geprüft)

Rechenweg: `damage(Evo, Stufe s) ÷ damage(Basis, Stufe s)` aus `levels` in [`data/units.json`](data/units.json).

| Befund | Wert | Tag |
|---|---|---|
| Evo-Text nennt „+X% Attack/Damage“ | 192 von 219 Rezepten | OBSERVED · HIGH · [S65] |
| Stufe-0-Damage (Platzierung) = Basis × (1 + X %) | **178 von 192 exakt** (±0,5 %) | DERIVED · HIGH |
| häufigste Boni | +30 % (47×), +40 % (47×), +50 % (38×), +35 % (27×), +25 % (15×), +20 % (9×) | OBSERVED · HIGH · [S65] |
| Ausreißer | +200 % (Martial Demon), +260 % (Chunks), +60 % (1×) | OBSERVED · HIGH · [S65] |
| 14 Abweichungen Text ↔ Stufe 0 | Puppet Girl (Text +30 %, Stufe 0 ×1,00), Bro (+25 % / ×1,09), Gunslinger (+40 % / ×1,12), Bunny (+40 % / ×1,12), Shizo (+40 % / ×1,17), Izo (Black Fire) (+40 % / ×1,18), Spirit Reaper (Dusk) (+40 % / ×1,20), Bodybuilder (+50 % / ×1,30), Dreamer (+40 % / ×1,35), Prime Force (+40 % / ×1,54), Void Spear (+40 % / ×1,75), Mimic Sorcerer (+50 % / ×1,88), Martial Demon (+200 % / ×2,67), Chunks (+260 % / ×2,60 – stimmt, Abweichung erst in höheren Stufen). Hier stimmt der Text nur für einzelne Stufen oder ist veraltet | DERIVED · HIGH |
| Faktor auf **Maximalstufe** | Median **×2,33** (Quartile ×1,80–×3,17; Spanne ×0,06–×10) | DERIVED · HIGH |

Der Text-Bonus gilt also **pro Stufe gegenüber derselben Stufe der Basis**. Der viel größere Faktor auf Maximalstufe entsteht, weil Evos mehr Upgrade-Stufen haben.

Ausreißer unter ×1 auf Maximalstufe:

- Griffin → Griffin (Ascension): 1 statt 7 Stufen
- Usurper (Founder): Damage 0, Support-Form

DERIVED · HIGH

### Weitere Werte (Basis-Maxstufe vs. Evo-Maxstufe)

| Wert | Ergebnis (n ≈ 218) | Tag |
|---|---|---|
| Upgrade-Stufen | Evo hat **+2** (93×), +1 (53×), +3 (49×), gleich (13×), +4/+5 (8×), weniger (3×) | DERIVED · HIGH · [S65] |
| Reichweite | größer bei 198, gleich bei 19, kleiner bei 2. Median ×1,14 (×0,74–×2,67) | DERIVED · HIGH · [S65] |
| SPA (Sekunden pro Angriff) | länger bei 109, kürzer bei 62, gleich bei 47. Evos schlagen oft langsamer, aber viel härter | DERIVED · HIGH · [S65] |
| Gesamtkosten Platzierung + alle Upgrades | Median ×1,79 (Quartile ×1,36–×2,34) | DERIVED · HIGH · [S65] |

### Neue Fähigkeiten

Der Evo-Text listet nach dem Angriffsbonus die neuen Fähigkeiten bzw. Angriffe (`+Ability`). Formen:

| Form | Beispiel | Anteil |
|---|---|---|
| `+X% Attack, +Fähigkeit[, +Fähigkeit …]` | „+40% Attack, +Cut Down, +Spellforged Blades …“ | Großteil (192) |
| `+X% Crit, +Fähigkeit` | Curse (+30 % Crit), Icy Dragon (+50 % Crit) | 2 |
| nur Formname (`+Name (Form)`) | Hubris, Priest, Illusionist, Experiment X | Ketten-Rezepte |
| `+Evolve` (Platzhalter) | Falcon, Explosion Hero, Ashborn, Flame Hero | 4. Im LEGACY stand hier noch der echte Text |
| leer | Elyssia | 1 |

OBSERVED · HIGH · [S65, S66]

Die konkreten Fähigkeitswerte (Schaden, Cooldown, Effekte) stehen bei den Angriffen der Ziel-Unit in [`data/units.json`](data/units.json) (`attacks`). Wiki-Texte zu Fähigkeiten belegen Einzelfälle:

- Honey (Hive): Hivemind ×3/×5 [S32 → S72:Honey_(Hive)]
- Legendary Assassin (Prime): ×2 DPS gegen den vordersten Gegner [S33]

---

## Rarität vorher → nachher

| Übergang | Anzahl | Units | Tag |
|---|---:|---|---|
| Mythic → Mythic | 179 | Standardfall | OBSERVED · HIGH · [S65] |
| Secret → Secret | 29 | alle Secret-Evos | OBSERVED · HIGH · [S65] |
| Legendary → Mythic | 6 | Usurper, Gene, Chunks, Fox Ninja (Demon Cloak), Martial Demon, Experiment X (Semi-Perfect) | OBSERVED · HIGH · [S65] |
| Mythic → Secret | 4 | Trickster, Ratio, Lyla, Chance (alle 4 Zufallsziele Secret) | OBSERVED · HIGH · [S65] |
| Epic → Legendary | 1 | Experiment X (Imperfect) | OBSERVED · HIGH · [S65] |

Rare- und Epic-Banner-Units haben (bis auf Experiment X) **keine** Evolution.

---

## Ketten und Verzweigungen

### Mehrstufige Ketten

| Kette | Stufen | Bedingungen je Schritt | Tag |
|---|---:|---|---|
| Experiment X: Imperfect (E) → Semi-Perfect (L) → Perfect (M) → SUPER PERFECT (M) | 3 | 4 Kopien + 300 Kills → 4 Kopien + 2.500 Kills → Infinite Power Core + 7.500 Kills | OBSERVED · HIGH · [S65] |
| Illusionist → (Betrayal) → (Chrysalis) → (Fusion) → (Final) | 4 | Negation Box + 40 Soul Candy → **außerhalb des Moduls:** 2.000 Kills + 37,5 % „Awakening“ (75 Worthy Souls) → 5.000 Kills + Hogyoku 62,5 % → 15.000 Kills + Hogyoku 100 % | OBSERVED · HIGH · [S65, S72:Illusionist_(Betrayal), S72:Illusionist_(Chrysalis)] |
| Shadow Sorcerer → (Hybrid Shadow) → (Incident) → (Ritual) | 3 | Wolf Shadow + 40 Curse Talisman → 100 Sacred Treasure → Rezept Incident → Ritual. Divine General entsteht danach per Fähigkeit im Match, nicht per Evolution | OBSERVED · HIGH · [S65, S72:Divine_General] |
| Hubris (Night) → (Day) → (The One) | 2 | 2/2/1 Fabled-Kingdom-Drops + 500 Takedowns → Sonderbedingung: **1.000.000 „Sunshine“** (aus Takedowns, Sunshine-Gegnern oder Portal-Item) | OBSERVED · HIGH · [S65, S72:Hubris_(Day)] |
| Priest → (New Moon) → (Heaven) | 2 | Green Baby → Heavenly Clock + Sonderbedingung: 10.000 Takedowns nur auf Cape-Canaveral-Inhalten | OBSERVED · HIGH · [S65, S72:Priest_(Heaven)] |
| Gene (L) → (Adult) (M) → (???) (M) | 2 | 10 Kopien → Final Contract + 40 Cooked Fish | OBSERVED · HIGH · [S65] |

Alle anderen Rezepte sind **einstufig**. Keine Ziel-Unit hat mehr als ein Basisrezept; es gibt also **kein Zusammenführen** zweier Basis-Units zu derselben Evo (Kopien-Opfer ausgenommen). DERIVED · HIGH · [S65]

### Verzweigungen (Zufalls-Evolution)

| Basis | Ziele | Modul-Chance | Anmerkung | Tag |
|---|---|---|---|---|
| Chance (M) | Frenzy / Precision / Lethal / Focus (alle Secret) | je 0,25 | Summe 1,0. Erste Zufalls-Evolution im Spiel | OBSERVED · HIGH · [S65, S72:Chance] |
| Elize (M) | True Heart / Valkyrie / Lightning (alle Mythic) | je 0,25 | **Summe nur 0,75.** Ob die Chancen normiert werden (dann je 1/3), ist UNKNOWN | OBSERVED · HIGH · [S65, S72:Elize] |

Beide Rezepte nutzen eine Platzhalter-Unit für die Anzeige (`evolve_unit_client_override`). OBSERVED · HIGH · [S65]

### Sonderanforderungen (versteckte Rezepte)

| Basis → Ziel | Anforderung | Tag |
|---|---|---|
| Griffin → Griffin (Ascension) | 7.500 Takedowns + Behelit 100 % = 200 Eggs of Sacrifice **oder** 24 Mythic **oder** 12 evolvierte Mythic opfern | OBSERVED · HIGH · [S65, S72:Griffin_(Ascension)] |
| Lyla → Lyla (Celestial) (Secret) | Celestial Key (Final) + 40 Magical Artifact + Sonderbedingung: alle Schlüssel (u. a. Taurus, Leo, Aquarius) | OBSERVED · HIGH · [S65, S72:Lyla_(Celestial)] |
| Itukoda → Cursed King | 5 Cursed Finger; Rezept im UI versteckt | OBSERVED · HIGH · [S65] |

### Wege außerhalb des Evolve-Menüs (keine Modul-Rezepte)

| Ziel | Weg | Version | Tag |
|---|---|---|---|
| Veko („???“, Secret) | 15 Vego + 15 Carrot (Shiny: je 5 Shiny) + Fusion Jacket (999 Gold, April-Fools-Event 2023) | LEGACY, heute nicht erhältlich | OBSERVED · MEDIUM · [S72:???] |
| Fused Hero (M) | aktive Fusions-Fähigkeit von Carrot (Ultra) + Vego (Mage II) im Match | RR | OBSERVED · HIGH · [S72:Fused_Hero] |
| Divine General (M) | aktive Fähigkeit von Shadow Sorcerer (Ritual) im Match | RR | OBSERVED · HIGH · [S72:Divine_General] |
| Supreme Being (Secret) | 3 evolvierte „Dungeon Throne“-Units opfern | RR | OBSERVED · MEDIUM · [S72:Frequently_Asked_Questions] |

---

## LEGACY vs. RR: geänderte Rezepte

**Zeitachse:**

- **Update 18 (18.11.2023, LEGACY):** „Evolve requirements for many Mythics greatly reduced“
- **Update 19 (25.12.2024, RR):** Evo-Items aus dem Traveling Merchant entfernt
- **Update 20 (09.03.2025, RR):** „Evolve requirements for some units reduced“

OBSERVED · HIGH · [S72:Update_Log, S72:Travelling_Merchant_Shop]

Abgleich LEGACY-Endstand (S66, nach Update 18) mit RR (S65): **11 von 190** gemeinsamen Rezepten unterscheiden sich.

| Basis (RR / LEGACY) | LEGACY-Wert (S66) | RR-Wert (S65) | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Verdant Hero (String) / Dezu (Blackwhip) | 36 Hero Gauntlet, 36 Quirk Amplifier, 18 Quirk Capsule + SF 12/3/0/4/4/1 | 12/12/6 + SF 3/1/0/1/1/1 | RR | S66, S65 |
| Falcon / Hawk | 36/36/18 + SF 12/4/3/0/4/1 | 12/12/6 + SF 4/1/1/0/1/1; Text „+Evolve“ | RR | S66, S65 |
| Explosion Hero (Bang) / Bakugo (Explosion) | 36/36/18 + SF 12/4/4/3/0/1 | 12/12/6 + SF 4/1/1/1/0/1 | RR | S66, S65 |
| Flame Hero / Endeavor | 36/36/18 + SF 12/4/4/3/0/1 | 12/12/6 + SF 4/1/1/1/0/1 | RR | S66, S65 |
| Ashborn / Shigaruko | 36/36/18 + SF 12/4/0/4/3/1 | **keine Items** + SF 4/1/0/1/1/1 | RR | S66, S65 |
| Waterfist / Bang | 35 Full Power Core + SF 10/3/0/4/2/1 | 12 Full Power Core + SF 3/1/0/1/1/1 | RR | S66, S65 |
| Usurper / Erein | 9 Path Branch, 25 Mysterious Fluid, **4 Erein + 4 Zeike** | 3 Path Branch, 8 Mysterious Fluid, nur Basis | RR | S66, S65 |
| Hubris (Night) / Pride (Night) | je 6 Demonic Chalice/Horn, 3 Fairy Petals | 2/2/1 | RR | S66, S65 |
| Chunks / Trunks | 4 Kopien gesamt | 2 Kopien gesamt | RR | S66, S65 |
| Crusader / Heathcliff | 4/4/2 SAO-Kristalle + SF 4/1/1/1/0/1 | **12/12/6 + SF 12/3/3/4/0/1** (teurer) | RR | S66, S65 |
| Stringy / Flamingo | 12 SMILE Fruit + SF 3/1/0/1/2/1 | **40 SMILE Fruit + SF 12/4/0/4/4/1** (teurer; Shiny-Rezept behält den LEGACY-Wert) | RR | S66, S65 |

**Vor Update 18 (LEGACY früh)** waren mehrere Rezepte teurer. Belegt ist Gravity Navy / Fuji (Admiral) mit S46: 40 SMILE Fruit + SF 12/4/4/4/4/1. Im LEGACY-Endstand und im RR sind es 12 SMILE Fruit + SF 3/1/0/1/2/1. OBSERVED · MEDIUM · [S46 vs. S66, S65]

**Nur RR (29 Rezepte):** u. a. Vengeful Swordsman, Sorcerer Killer, Kansai, Spider, Legendary Assassin, Honey, Black Assassin, Gambler, Zombie, Siren, Switchblade, Psychic Princess, Shadow Sorcerer (Hybrid Shadow → Incident, Incident → Ritual). Vollständig in der [Matrix](evolution-matrix.md) (Spalte Ver. = `RR`).

---

## Abgleich der Sitzung-1-Beispiele

Die Beispiele aus Sitzung 1 (S46, S64; LEGACY-Guides) gegen das Modul:

| Basis (RR / LEGACY) | Sitzung 1 | Modul (LEGACY-Endstand und RR, falls nicht anders angegeben) | Ergebnis |
|---|---|---|---|
| Calm Killer / Kiro | 12/4/4/3/–/1 + „Stray Cat“ als **Unit** | Stray Cat ist ein **Item** (1×); SF 12/4/4/3/0/1; + 7.500 Takedowns | korrigiert |
| Prayer Master / Neteru | Gold Rose | Golden Rose **+ 40 Cooked Fish** | ergänzt |
| Magic Disbeliever / Asto | 2 Demonic Wings, 40/15/15 Magic Stones | identisch | bestätigt |
| Verdant Hero (String) / Dezu | 36/36/18 + 12/3/–/4/4/1 | LEGACY identisch; RR reduziert (s. o.) | Version getrennt |
| Usurper / Erein | 9 + 25 + 4 Erein + 4 Zeike | LEGACY identisch; RR 3 + 8, keine Extra-Units | Version getrennt |
| Gravity Navy / Fuji | 40 Smile Fruit + 12/4/4/4/4/1 | 12 SMILE Fruit + 3/1/0/1/2/1 + 7.500 Takedowns | LEGACY früh (vor Update 18) |
| Lilia / Illy | 250 Lesser Grails + 12/–/5/4/3/1 | identisch + 7.500 Takedowns | bestätigt |
| Black Dog / Aku | 500 Supernatural Books | identisch + 5.000 Takedowns | bestätigt |
| Player / Bell | Hestia Knife | identisch (`cranelsword`) | bestätigt |
| Dracula / Alucard (Secret) | Unholy Pistols + 12/5/4/–/4/1 | identisch + 5.000 Takedowns | bestätigt |
| Golden King / Gilgamesh (Secret) | 250 Lesser Grails + 12/3/5/4/–/1 | identisch + 7.500 Takedowns | bestätigt |
| Umbra / Zid (Secret) | Shadow Broadsword + 12/4/4/3/–/1 | identisch + 5.000 Takedowns | bestätigt |
| Supreme Being / Anz (Secret) | je 10 Ringe + 12/6/6/6/6/3 | identisch + 7.500 Takedowns | bestätigt |
| Veko | „Goku oder Vegeta (auch Shiny)“ | 15 Vego + 15 Carrot + Fusion Jacket; kein Modul-Rezept | korrigiert |
| Eccentric Researcher / Hanje | 1 Thunder Spears | identisch | bestätigt |
| Honey | UNKNOWN | SF 10/5/5/5/5/1 + 100 Takedowns (RR) | ergänzt |
| Legendary Assassin | UNKNOWN | 250 Assassin Token + SF 6/2/2/0/2/1 + 5.000 Takedowns (RR) | ergänzt |
| Black Assassin | UNKNOWN | 1 Electric Dagger, Takedowns 0 (RR) | ergänzt |
| Fiery Commander / Yamomoto (Secret) | UNKNOWN | 1 Sealed Fire Staff | ergänzt |
| Captain (Timeskip) / Usoap → Captain (God) | UNKNOWN | 12 SMILE Fruit + SF 3/1/0/1/2/1 + 1.000 Takedowns | ergänzt |
| Curse / Akin | UNKNOWN | 50 Gun Devil Bullet + 5.000 Takedowns | ergänzt |
| Spider | UNKNOWN | SF 30/13/13/10/10/3 + 5.000 Takedowns (RR) | ergänzt |
| Bubblegum / Byu (Secret) | UNKNOWN | 400 Mage Mark + SF 12/3/3/2/2/1 + 7.500 Takedowns | ergänzt |

OBSERVED · HIGH · [S65, S66, S68, S72:???]. Die Zeile „Captain (Timeskip), Captain (God)“ aus Sitzung 1 war eine Kette. Richtig ist: **Captain (Timeskip) → Captain (God)**.

---

## Materialherkunft (Typen)

| Material-Typ | Herkunft | Beispiele | Tag |
|---|---|---|---|
| Star Fruit (normal) | Merchant 50 Gems (LEGACY), Gold Shop, Star-Fruit-Challenges, Kapseln. Inventar-Limit 100 | – | OBSERVED · HIGH · [S72:Items, S72:Travelling_Merchant_Shop] |
| Farbige Star Fruits | Merchant 200 Gems (LEGACY), Gold Shop, Challenges, Kapseln. Limit je 75 | Rot, Pink, Blau, Grün | OBSERVED · HIGH · [S72:Items] |
| Regenbogen-Frucht | Merchant 300 Gems (LEGACY), Gold Shop, Challenges. Limit 25 | – | OBSERVED · HIGH · [S72:Items] |
| Star Fruit Capsule | 43 % normal, je 13,5 % Rot/Pink/Blau/Grün, 3 % Regenbogen (je 1 Stück) | – | OBSERVED · HIGH · [S68] |
| Welt-Kapseln (z. B. Curse Star, Soul Star) | u. a. 12,9 % normal, je 4,05 % Farbe, 0,9 % Regenbogen | – | OBSERVED · HIGH · [S68] |
| Star-Fruit-Challenge | „bis zu 7“ zufällige Star Fruits bzw. 1 Regenbogen. Früh-LEGACY: Belohnung SF zufällig 65 %, Regenbogen 5 % | – | OBSERVED · MEDIUM · [S72:Challenges, S73] |
| Gecraftete Evo-Items | Gold + Star Fruits (Crafting); im LEGACY auch Merchant (Gems); teils Battle-Pass-Stufe 25/50 | Golden Rose, Thunder Spears | OBSERVED · HIGH · [S68, S72:Evolution] |
| Stage-Drops | Legend Stages (Act 1–3 bzw. 1–6 je Item) und Story-Welten | Overlord’s Rings, Hero Gauntlet, DISCs, Seelen | OBSERVED · HIGH · [S72:Evolution, S68] |
| Raid-Shop-Items | Raid-Währung (25–350) | Path Branch (25 Path Shards), Mini Time Machine (200 Power Cells), Infinite Power Core (150) | OBSERVED · HIGH · [S72:Evolution] |
| Portal-Items | Portale | Full Power Core (Alien Portal), SMILE Fruit (Puppet Island), Heavenly Clock | OBSERVED · HIGH · [S68, S72:Evolution] |
| Event-Items | Event-Shops, meist 5.000 Event-Währung | Unholy Pistols, Shadow Broadsword (5.000 Candies), Sea God’s Trident (5.000 Summer Pearls) | OBSERVED · HIGH · [S72:Evolution] |
| XP-Food | Story-Welten, Gold Shop | Cooked Fish, Curse Talisman, Soul Candy (meist 40×) | OBSERVED · HIGH · [S68, S72:Items] |

Gold-Shop-Preise für Star Fruits: **UNKNOWN**.

---

## Für unseren Nachbau

DESIGN-Vorschläge, keine AA-Werte:

- **Datenmodell** wie das Modul: `Recipe { from, to: [{unit, weight}], items: [{id, n}], units: [{id, n, shiny?}], takedowns?, kills?, progress?: {key, value}, uiHidden?, text }`. Das Format von `evolutionRecipes` in [`data/items.json`](data/items.json) kann direkt als Vorlage dienen. `DESIGN`
- **Ablauf**:
  1. Rezept prüfen: Items, Opfer-Units, Zähler der Basis-Unit.
  2. Alles atomar abbuchen.
  3. Neue Unit-ID setzen, Trait und Potential übernehmen bzw. verbessern.
  4. Zufallsziel per Gewicht ziehen (Gewichte normieren).
  5. Belohnung (z. B. Stat-Würfel) vergeben.

  `DESIGN`
- **Balancing-Faustregel aus AA** (DERIVED):
  - Platzierungs-Damage ×1,25–1,5
  - +1–3 Upgrade-Stufen
  - Reichweite ca. ×1,14
  - Gesamtkosten ca. ×1,8

  Damit wird die Evo auf Maximalstufe etwa 2–3× so stark. Für unser Spiel als Startwert nutzbar. `DESIGN`
- **Materialstruktur**: Eine Welt-Materialgruppe (3 Stage-Drops) plus ein universelles Bündel aus 6 Sorten (1 Grund-, 4 Farb-, 1 Seltenheitsmaterial) plus Takedown-Zähler. Das ergibt zwei Grinding-Achsen: Inhalt farmen und Unit benutzen. `DESIGN`
- Sonderketten (Kills, Fortschrittsbalken, Sonderbedingungen) erst nach dem Grundsystem einbauen. Sie sind in AA nicht im Rezeptformat beschreibbar (`_custom_requirements`). `DESIGN`
