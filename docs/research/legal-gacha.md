# Recht: Gacha, Jugendschutz, Glücksspiel, Marken/Urheberrecht (DE/EU)

> **KEINE RECHTSBERATUNG, NUR ÜBERSICHT.** Dies ist eine Recherche-Zusammenfassung aus öffentlichen Quellen (Abruf 2026-10-06). Vor einem Launch mit Echtgeld oder anime-ähnlichen Figuren bitte Fachanwalt (IT-/Medien-/Glücksspielrecht) konsultieren.

**Projektannahme:** kostenloses Web-Tower-Defense, Gacha/Unit-Sammlung, Anime-Stil, Start DE/EU.
**Quellenbewertung:** A = Gesetz/Behörde/Gericht/offiziell; B = anerkannte Institution/Selbstkontrolle/Verbraucherzentrale; C = Fachkanzlei/Fachpresse/Wissenschaft; D = Branchenblog/Portal (nicht primär verifiziert); E = Forum/Social/unklar. Quellen siehe Tabelle am Ende (Q1 ...).
**Stopp-Regel:** Was nach max. 3 Versuchen nicht belegt werden konnte, steht als **UNKNOWN**.

## 1. Deutschland

### 1.1 Jugendschutzgesetz (JuSchG)

| Punkt | Befund | Quelle |
|---|---|---|
| § 10b JuSchG (Fassung nach Novelle 2021) | Überschrift „Entwicklungsbeeinträchtigende Medien“. Abs. 3: Risiken für die persönliche Integrität von Kindern/Jugendlichen sind bei der Beurteilung angemessen zu berücksichtigen, **unter Einbeziehung von Vorsorgemaßnahmen** (§ 24a). Genannt werden u. a. Risiken durch Kommunikations-/Kontaktfunktionen, **Kauffunktionen**, **glücksspielähnliche Mechanismen**, Mechanismen zur Förderung exzessiver Nutzung, Datenweitergabe ohne Einwilligung und nicht altersgerechte Kaufappelle. Das Wort „Lootbox“ steht nicht im Gesetzestext. | Q1 |
| Korrektur zur Annahme | Der Begriff „Interaktionsrisiken“ ist in der Fachdiskussion/Presse gebräuchlich (Q8, Q12), steht aber nicht wörtlich in § 10b Abs. 3. Wortlaut verweist auf „Risiken … durch Kauffunktionen / glücksspielähnliche Mechanismen“. | Q1, Q12 |
| Plattformpflicht | Seit Novelle 2021 müssen auch große Online-Spieleplattformen Alterskennzeichen anzeigen; automatisierte IARC-Kennzeichnung der USK wurde im April 2025 von den Ländern rechtlich anerkannt. | Q2 |
| Eigenes Web-Spiel | Ob eine selbst gehostete Webseite eine Kennzeichnungspflicht nach JuSchG/JMStV auslöst, wurde nicht geklärt: **UNKNOWN**. Die USK-Seite nennt IARC-Plattformen (Google Play, Nintendo eShop, MS Store, PlayStation, Epic, Meta Quest u. a.), keine eigenständige Webseite. | Q2 |

### 1.2 USK-Deskriptoren und Einfluss auf die Altersstufe

| Deskriptor | Bedeutung (Kurz) | Beeinflusst Alterseinstufung? | Quelle |
|---|---|---|---|
| In-Game-Käufe | direkter Kauf von Zusatzinhalten/Währung | **Nein** laut Spieleratgeber NRW: „Hinweise zur Nutzung“ sind weiß hinterlegt, weil sie keinen Einfluss auf die Kennzeichnung haben (Gesetzgeber geht von Nutzung elterlicher Schutzfunktionen aus). | Q3 |
| In-Game-Käufe + zufällige Objekte | Kauf zufälliger Gegenstände, z. B. über Echtgeld-Währung (Lootboxen, Item Packs) | wie oben: Nutzungshinweis ohne direkten Alterseffekt | Q3 |
| Erhöhte Kaufanreize | unübersichtliche Shops (mehrere Währungen), Pay2Win, Ablauf-Timer | **Ja, kann** (Inhalts-/Risikodeskriptor, farblich zur Stufe) | Q3 |
| Druck zum Vielspielen | Push, Season Pass, Comeback-Gifts, Verlust bei Nicht-Spielen | Ja, kann | Q3 |
| Glücksspielthematik | glücksspielähnliche Elemente/Spielhallen-Atmosphäre | Ja, kann | Q2, Q3 |
| Glücksspiel mit Barauszahlungen | Einsatz/Gewinn realer Währung | im IARC-Katalog genannt | Q2 |
| Wortlaut „zufällige Objekte möglich“ | Eine Quelle nennt seit 2020 die Formulierung „In-Game-Käufe (zufällige Objekte möglich)“; USK/NRW nennen heute „+ zufällige Objekte“. | – | Q4 (D), Q3 |

**Folgerung (DESIGN, keine Rechtsauskunft):** Reines Echtgeld-Gacha wird nach USK-Systematik vor allem über *Kaufanreiz-, Vielspiel- und Glücksspiel-Deskriptoren* relevant; die Kennzeichnung „zufällige Objekte“ allein erhöht laut Q3 nicht automatisch die Stufe. Details der Matrix: **UNKNOWN** (IARC-Matrix nicht abgerufen). Q4 (D) behauptet, die USK habe 2023 die Kriterien verschärft (ca. 30 % der Titel neu bewertet) – nicht primär verifiziert.

### 1.3 Glücksspielstaatsvertrag 2021 (GlüStV)

| Punkt | Befund | Quelle |
|---|---|---|
| Text GlüStV 2021 zu Lootboxen | Kein GlüStV-Volltext abgerufen; Aussagen zu GlüStV und Lootboxen: **UNKNOWN** (primär). | – |
| Deutsche Rechtsprechung | EVZ: „In Deutschland gibt es noch keine Urteile, die Lootboxen mit Glücksspiel gleichstellen.“ Definition (BGH): nicht unerhebliches Entgelt + Gewinnchance, Ergebnis überwiegend vom Zufall. Ob virtueller Inhalt ein „Gewinn“ ist, sei unter Juristen umstritten. | Q5 |
| Typische Argumentation | Lootboxen scheitern oft am Merkmal „Gewinn mit Vermögenswert“, weil Items nicht gegen Echtgeld zurücktauschbar sind. | Q4 (D), Q5 |
| Ohne Auszahlung | Folgerung aus Q5/Q6: Ohne Rücktauschbarkeit/Auszahlung und mit Spielwährung ohne Echtgeld ist die Glücksspiel-Einordnung nach heutigem Stand unwahrscheinlicher – **kein Freibrief**, rechtlich umstritten. Handel zwischen Spielern/Marktplatz oder Auszahlung würden das Risiko stark erhöhen (DESIGN-Ableitung). | Q5, Q6 |

## 2. EU und Nachbarländer

| Land/Ebene | Stand (Quelle) | Relevanz für uns |
|---|---|---|
| **EU – CPC-Netzwerk (Verbraucherschutz)** | 30.09.2026: neun Untersuchungen gegen Spielefirmen (u. a. Supercell, Riot, King, Mojang, InnoGames, Ubisoft; ältere gegen Diablo Immortal/Call of Duty Mobile, Star Stable) wegen virtueller Währungen (Kosten verschleiert, Bündel mit Restguthaben, Minderjährige). Lootboxen und Dark Patterns als weitere Sorgen. ACM empfiehlt Verbot von Lootboxen und virtuellen Währungen, besonders für Minderjährige. (Q7) | Hoch relevant: Premium-Währung + Gacha steht im Fokus. |
| **CPC „Key Principles“ 2025** | u. a. Preisangabe in realer Währung, keine Verschleierung durch mehrere Währungsebenen, keine erzwungenen Überbündel, Widerrufsrecht für ungenutzte Währung, Schutz Minderjähriger (Q9 D, Q10 C). Nicht bindend. | Gestaltungsregeln für jede Echtgeld-Variante. |
| **Digital Fairness Act (DFA)** | Arbeitsprogramm 2026 der Kommission sieht DFA für Q4 2026 vor (Q10). Möglich: Lootbox-Verbot oder Elternzustimmung, Echtpreisanzeige, Bündel-Einschränkung, Widerrufsrecht für Währungen (Q10, spekulativ). **Formaler Vorschlag zum Stand 2026-10-06: nicht gefunden → UNKNOWN.** Europäisches Parlament forderte laut Q4 (D) im Nov. 2025 Lootbox-Verbot für Minderjährige (nicht verbindlich, nicht primär verifiziert). | Beobachten; Gacha mit Echtgeld ist Risiko für Zielmarkt EU. |
| **EU KIDS Act (Kommissionsvorschlag COM(2026) 681, 17.09.2026)** | Vorschlag, noch nicht Gesetz. Erfasst auch Online-Spiele; Safety-by-Design, Verbot „süchtig machender“ Features für Minderjährige (Autoplay, Push-Re-Engagement, **Streak-Mechaniken**), Schutz vor übermäßigen/impulsiven Ausgaben, Altersprüfung (für Spiele „angemessene“ Verfahren). Strafen bis 6 % Jahresumsatz. Ob Lootboxen/Währungen konkret geregelt werden, ist laut Q11/Q16 unklar. (Q11 C, Q16 A-Basis) | Daily-Login-Streaks und Push vermeiden bzw. optional halten. |
| **Belgien** | 2018 Glücksspielkommission: bestimmte Lootboxen = Glücksspiel; EA, Blizzard, Square Enix nahmen Lootboxen in BE heraus (Q9 D). Strafrahmen (800.000 €, bis 5 Jahre) nur bei Q4 (D). | Bei bezahltem Zufall: Geoblocking BE erwägen. |
| **Niederlande** | 2018 Kansspelautoriteit; März 2022 Raad van State: Regulierung per Glücksspielrecht problematisch, Lootbox Teil eines größeren Geschicklichkeitsspiels (Q9 D). Q4 (D) beschreibt das als Aufhebung der EA-Strafe. EVZ-Seite (Q5) nennt NL weiter als „gelten als illegal“ – widersprüchlich/veraltet. | Niederländische Regierung drängt auf EU-Ebene (Q9 D). |
| **Österreich** | OGH (Entscheidung 18.12.2025/Jan. 2026): Lootboxen in FIFA/EA-Titel nicht isoliert beurteilen, Gesamtspiel mit Geschicklichkeitsanteil ist kein Glücksspiel nach § 1 Abs 1 GSpG; Rückzahlungsklage (~20.000 €) abgewiesen (Q6). Frühere Instanzurteile (Kärnten 2023) hatten Glücksspiel bejaht (Q13 D, nur Snippet). | Höchstgerichtlich günstig für Spiele mit Skill-Anteil; TD hat Skill-Anteil. Nicht übertragbar auf DE. |
| **UK** | Selbstregulierung: DCMS-Leitlinien Juli 2023 (Lootbox-Kauf nur mit Elternfreigabe, Ausgabenkontrollen, Transparenz); kein Glücksspiel nach Gambling Act; ASA verlangt deutlichen Hinweis in App-Store-Listings (Q9 D). | Nach Brexit nicht EU, aber Zielmarkt-Option. |
| **USA (Kontrast)** | FTC/Genshin Impact (Jan. 2025): 20 Mio. $ Vergleich; Vorwürfe u. a. Täuschung über Gewinnchancen und reale Kosten, verwirrendes Mehrstufen-Währungssystem, Event-Banner; Sperre für Käufe unter 16 ohne Elternzustimmung (Q14). Beispiel für anime-stilisiertes Gacha unter Dark-Pattern-Kritik. | Lehre: Raten offenlegen, Währung einfach halten. |
| **Italien** | AGCM-Verfahren (Jan. 2026) gegen Activision Blizzard u. a. wegen FOMO-Push, verschleierter Währungen, Kinderschutz-Voreinstellungen (Q4, D). | Muster für EU-Behörden. |

## 3. Ratenangabe, Pity, Plattformstandards

| Regime | Regel/Befund | Quelle |
|---|---|---|
| Apple App Store (Guideline 3.1.1) | Apps mit Lootboxen/zufälligen virtuellen Items **gegen Kauf** müssen die Gewinnchancen je Item-Typ **vor dem Kauf** offenlegen (seit Dez. 2017). | Q15 (A), Q17 (D) |
| Google Play | Gleiche Pflicht laut Branchenquellen (Q17 D, Q18 E). Primär-Policytext nicht verifiziert: **UNKNOWN**. | Q17, Q18 |
| PEGI | Laut Q4 (D, zitiert Heise/Reed Smith): ab Juni 2026 Mindeststufe **PEGI 16** für neu eingereichte Spiele mit **bezahlten** Zufallsobjekten; weitere „Interaktionsrisiko“-Kategorien (zeitlich begrenzte Angebote PEGI 12, Login-Belohnungen PEGI 7, unmoderierter Chat PEGI 18). Primärquelle (PEGI/Heise) nicht geprüft: nicht primär verifiziert. | Q4 |
| USK | Deskriptoren (s. 1.2); keine gesetzliche Ratenangabe-Pflicht in DE gefunden: **UNKNOWN**. | Q3 |
| EU/CPC | Falsche Darstellung der Gewinnchancen = unlautere Praxis (Täuschung); Raten offenzulegen ist de facto Erwartung der Behörden (vgl. FTC-Fall Q14); explizite EU-Pflicht zur Ratenangabe: **UNKNOWN**. | Q14, Q9 |
| China (Kontrast) | **UNKNOWN** (nicht belegt abgerufen). | – |
| Pity/Soft-Pity | Keine rechtliche Vorgabe gefunden: **UNKNOWN**. Branchenpraxis laut Q19 (C): Box-Gacha mit festem Inhalt ohne Zurücklegen, Step-Gacha mit garantierten Items. Pity verbessert Erwartungsgarantie, ersetzt aber keine Ratenangabe (DESIGN). | Q19 |

## 4. Web-spezifisch

| Thema | Befund | Quelle |
|---|---|---|
| Spiel ohne Echtgeld | Kein Echtgeld-Einsatz = keine Kauffunktion (§ 10b-Risiko entfällt) und kein Einsatz im Glücksspielsinn; weiterhin relevant: Datenschutz/Kinder, Werbung, Daily-Streak-Design (KIDS-Act-Entwurf). | Q1, Q11 |
| Mit Echtgeld | CPC-Prinzipien (Echtpreis, Widerruf, kein Überbündel), Minderjährigenschutz (Elternfreigabe als UK/FTC-Standard), Altersprüfung; Zahlungsanbieter (Stripe/PayPal) – itch.io nutzt PayPal/Stripe mit je ca. 0,30 $ + 2,9 %. | Q7, Q10, Q14, Q20 |
| Minderjährige und Verträge | BGB-Minderjährigenregeln (§§ 104 ff.) nicht recherchiert: **UNKNOWN**. EVZ-Ratgeber „Hilfe, mein Kind hat Geld für In-Game-Käufe ausgegeben“ existiert (Q5-Umfeld), Inhalt nicht abgerufen. | – |
| itch.io | Zahlungsabwicklung dokumentiert (Q20); Regeln zu Lootboxen/Echtgeld-Monetarisierung im Spiel: **UNKNOWN**. | Q20 |
| Poki / CrazyGames | Regeln zu In-App-Käufen/Gacha: **UNKNOWN** (nach 3 Suchen kein Treffer). | – |
| App-Store-Wrapper | Falls später als App (PWA/Capacitor): Apple/Google-Regeln (Raten, IAP) greifen; Web-Version umgeht sie nicht rechtlich, aber Store-Policy nur dort. | Q15 |

## 5. Marken-, Urheberrecht, Anime-Stil

| Thema | Befund | Quelle |
|---|---|---|
| § 51a UrhG | Zulässig ist Vervielfältigung/Verbreitung/öffentliche Wiedergabe veröffentlichter Werke „zum Zweck der Karikatur, der Parodie und des Pastiches“ (seit 2021). | Q21 (A) |
| Pastiche-Reichweite | EuGH Pelham II (C-590/23): Urteil im April 2026, laut Titel „stärkt Pastiche-Schranke“ (Q22 C, nur Snippet; Datum 14.04. vs. 21.04.2026 in Q23 widersprüchlich). Inhalt/Grenzen: **UNKNOWN**. Betraf Sampling; Übertragbarkeit auf kommerzielle Spiele mit Fremdfiguren: **UNKNOWN**. | Q22, Q23 |
| Figurenschutz | Schutz einzelner Figuren nach deutschem Urheberrecht: **UNKNOWN** (nicht belegt). | – |
| Marken | Prüfmaßstab Verwechslungsgefahr (US-Perspektive: ähnlich klingender Name/Logo, Presse nennt Spiel „das One-Piece-Spiel“ = Indiz). EU-Markenrecht/Markenanmeldungen (EUIPO/DPMA-Recherche): **UNKNOWN**. | Q24 |
| Lehre Roblox-Anime-TDs | Anime Adventures (Top-20-Roblox-Spiel) wurde per DMCA wegen „My Hero Academia“-Bezug entfernt (Artikel v. 25.02.2024, „Vormonat“); weitere drei Titel mit entfernt; geschätzt 4–5 Mio. $ jährlicher Umsatz weg; Lizenznehmer Gamefam erhielt Fan-Backlash. 36 der Top-250-Roblox-Erlebnisse nutzten ungelizenzte IP. Take-down-Risiko steigt mit Erfolg. Nur Schwerpunkt US/DMCA. | Q24 |
| USK/IARC | Altersbewertung berücksichtigt Urheberrecht ausdrücklich nicht. | Q2 |
| Folgerung (DESIGN) | Nur **eigene** Figuren, Namen, Logos; Stil „anime-inspiriert“ ist kein Schutzobjekt, aber Nähe zu konkreten Figuren (Frisur/Outfit/Name/Attacke) vermeiden; kein Fan-Game mit Echtgeld-Gacha. Asset-Lizenzen siehe `docs/research/assets-licensing.md`. | Q24 |

## 6. Risiko-Matrix (qualitativ, DESIGN-Einschätzung; keine Rechtsberatung)

| Option | Jugendschutz DE | Glücksspielrecht | EU-Verbraucherrecht (CPC/DFA/KIDS) | Plattform/Marke | Gesamt | Begründung |
|---|---|---|---|---|---|---|
| (a) Gacha nur mit Spielwährung, kein Echtgeld | niedrig | niedrig | niedrig–mittel (Streaks/Push/Engagement-Design, KIDS-Entwurf) | niedrig | **niedrig** | Keine Kauffunktion, kein Einsatz; Raten trotzdem anzeigen. |
| (b) Echtgeld-Premiumwährung + Gacha | mittel–hoch (Kaufanreize, Zufallsdeskriptor, PEGI-16-Regel laut D-Quelle) | mittel (DE ungeklärt, BE-Risiko, AT günstig) | **hoch** (aktuelle CPC-Verfahren, DFA-Lootbox-Debatte) | mittel (Apple/Google: Raten Pflicht bei Store-Version) | **hoch** | Genau die Konstellation im Fokus der EU-Behörden. |
| (c) Direktkäufe ohne Zufall (Skins/Einheiten fix bepreist, Echtpreis angezeigt) | niedrig–mittel (Deskriptor „In-Game-Käufe“ ohne Alterseffekt) | niedrig | niedrig–mittel (Echtpreis, Widerruf, Minderjährige) | niedrig | **niedrig–mittel** | Kein Zufall; Ausweichform zu (b). |
| (d) Battle Pass | mittel („Druck zum Vielspielen“ laut USK; Season-Pass als Beispiel) | niedrig | mittel (Engagement/Streak-Regeln, Abo/Verlängerung) | niedrig | **mittel** | Zeitdruck/FOMO ist Prüfthema (AGCM, KIDS-Entwurf). |
| (e1) Eigene Figuren | – | – | – | niedrig | **niedrig** | Nur Asset-Lizenzen prüfen. |
| (e2) Anime-ähnliche (nicht kopierte) Figuren | – | – | – | mittel | **mittel** | Grauzone Verwechslung/Stilkopie; kein belastbares Recht gefunden (UNKNOWN). |
| (e3) Figuren/Namen bestehender Anime-IP (Fan-Game) | – | – | – | **hoch** | **hoch** | DMCA/Abmahnung; Pastiche-Schranke unsicher; Roblox-Fälle (Q24). |

## Quellentabelle (Abruf je 2026-10-06)

| ID | Quelle | URL | Bewertung |
|---|---|---|---|
| Q1 | § 10b JuSchG, gesetze-im-internet.de | https://www.gesetze-im-internet.de/juschg/__10b.html | A |
| Q2 | USK: Spiele und Apps im IARC-System | https://usk.de/fuer-unternehmen/spiele-und-apps-pruefen-lassen/spiele-und-apps-im-iarc-system/ | A/B (Selbstkontrolle, staatlich anerkannt) |
| Q3 | Spieleratgeber NRW: USK-Kennzeichen | https://spieleratgeber-nrw.de/ratgeber/jugendschutz-alterskennzeichen/usk-kennzeichen/ | B |
| Q4 | shattered.io: PEGI 16 für Lootboxen (Sekundärbericht, zitiert Heise, Reed Smith, EVZ, FTC) | https://shattered.io/de/pegi-16-lootboxen-usk-vorbild-2026/ | D |
| Q5 | EVZ Deutschland: Lootboxen | https://www.evz.de/themen/einkaufen-digitales/gaming/lootboxen/ | B |
| Q6 | OGH Österreich: Entscheidung Lootboxen | https://www.ogh.gv.at/entscheidungen/entscheidungen-ogh/handelt-es-sich-bei-lootboxen-in-videospielen-um-gluecksspiel/ | A |
| Q7 | ACM (NL): CPC-Untersuchungen Gaming | https://www.acm.nl/en/publications/acm-and-other-european-consumer-authorities-step-action-protect-gamers-against-deception | A |
| Q8 | AJS Basics (Snippet: Interaktionsrisiken) | https://medien-weiter-bildung.de/wp-content/uploads/2026/01/Digitale-Kommunikation-Recht-26.2.2026.pdf | C (nur Suchtreffer-Snippet) |
| Q9 | promise.legal: Lootbox Regulation 2026 (zitiert Franssen Tolboom, gov.uk, ASA) | https://blog.promise.legal/lootbox-regulation-2026-game-studios/ | D |
| Q10 | Freshfields: DFA – Game developer's guide | https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/the-eus-proposed-digital-fairness-act-a-game-developers-guide-to-potential-imp-102ltio | C |
| Q11 | Davis Wright Tremaine: EU KIDS Act | https://www.dwt.com/blogs/privacy--security-law-blog/2026/09/eu-kids-act-online-child-safety-proposal | C |
| Q12 | Suchtreffer Landtag Niedersachsen Drs. 19/8153 (USK-Deskriptoren) | https://www.landtag-niedersachsen.de/drucksachen/drucksachen_19_10000/08001-08500/19-08153.pdf | A (nur Snippet) |
| Q13 | gameswirtschaft.de/kicker (Snippets zu AT-Urteilen) | https://www.gameswirtschaft.de/wirtschaft/fifa-lootboxen-sony-klage-gluecksspiel-oesterreich-040423/ | D (nur Snippet) |
| Q14 | FTC: Genshin Impact Vergleich | https://www.ftc.gov/news-events/news/press-releases/2025/01/genshin-impact-game-developer-will-be-banned-selling-lootboxes-teens-under-16-without-parental | A |
| Q15 | Apple App Review Guidelines (Suchtreffer-Snippet, Abschnitt 3.1.1) | https://developer.apple.com/app-store/review/guidelines/ | A (nur Snippet) |
| Q16 | EUR-Lex COM(2026) 681 (Suchtreffer; Inhalt über Q11) | https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A52026PC0681 | A (nicht gelesen) |
| Q17 | Fenwick: Apple Odds-Offenlegung (Snippet) | https://www.fenwick.com/insights/publications/apple-now-requires-disclosure-of-loot-box-odds | C (nur Snippet) |
| Q18 | Reddit: Google-Play-Klausel (Snippet) | https://www.reddit.com/r/TheSilphRoad/comments/bwlixv/google_has_now_added_same_loot_box_clause_to_play/ | E |
| Q19 | Game Developer: Gacha 2021 Guide | https://www.gamedeveloper.com/business/gacha-a-2021-detailed-guide-for-beginners- | C |
| Q20 | itch.io Docs: Payments | https://itch.io/docs/creators/payments | B |
| Q21 | § 51a UrhG | https://www.gesetze-im-internet.de/urhg/__51a.html | A |
| Q22 | anwalt.de: EuGH stärkt Pastiche (Snippet, Seite 403) | https://www.anwalt.de/rechtstipps/eugh-staerkt-pastiche-schranke-klare-weichenstellung-fuer-sampling-memes-und-kreative-remixe-268254.html | C (nur Snippet) |
| Q23 | Bayerische Staatsregierung Europabericht 04-2026 (Snippet) | https://www.bayern.de/europabericht-04-2026-vom-12-05-2026/?seite=39748 | A (nur Snippet) |
| Q24 | Naavik: Unlicensed IP Faces a Reckoning | https://naavik.co/digest/unlicensed-ip-reckoning/ | C/D |
