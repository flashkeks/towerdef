# Fortschritt und Freischaltungen (Runde 11, Vertical Slice)

Verbindlich für P4 (`meta/`, Client-Bildschirme). Vorbild BTD6 (`docs/games/btd6/meta.md`). Max: „ordentliche Leveling-
Funktionen, ganz viel Zeug, was man freischalten kann“. **Kein Gacha in diesem Slice** (kommt später, nur Helden/Skins).

## Speicherstand

- Neues Schema **11**, lokal im Browser (IndexedDB wie bisher). Alte Stände (Runde ≤ 10) werden **verworfen**; einmaliger
  Hinweis-Bildschirm: „Duskwardens has been rebuilt from scratch. Your old progress was reset.“ (OK-Knopf, danach nie wieder).
- Export/Import als Datei bleibt (wie bisher), mit Schema-Prüfung.

## Spieler-Level

- **Match-XP** = Summe über geschaffte Runden von **(20 + 10 × Runde)** × Schwierigkeit (Easy 1,0 / Medium 1,1 / Hard 1,2),
  plus **Sieg-Bonus 200** × Schwierigkeit. Volle Medium-Partie: (400 + 2.100) × 1,1 + 220 = 2.970 XP.
  Niederlage zählt die geschafften Runden (wie BTD6). Freeplay-Runden: 30 % (BTD6).
- **Level-Kurve** (XP bis zum nächsten Level): L1→2 300, →3 500, →4 800, →5 1.200, danach je **+400** mehr (→6 1.600, →7 2.000 …),
  ab L20 konstant 7.200. Erste Partie bis etwa Runde 10 → Level 2–3.
- **Freischaltungen über Level** (Slice): Ranger ab Start, **Bombardier L2**, **Wren L3**, **Frostcaller L4**.
  Karte Hard ab L5 (Easy und Medium sofort). Jedes Level-Up: **+1 Wissenspunkt** und ein Freischalt-Moment im Ergebnis.

## Turm-XP (wie BTD6)

- Jeder Turmtyp sammelt XP, **wenn er im Match benutzt wird**: **1 XP je Schicht, die dieser Turmtyp knackt**, plus
  **20 XP je gekaufter Stufe** im Match. Wren sammelt keine Turm-XP (Heldenlevel gelten nur im Match).
- **Upgrade-Freischaltung kostet Turm-XP**, je Stufe einzeln, Reihenfolge im Pfad: **T1 100, T2 250, T3 900, T4 2.500,
  T5 8.000** (je Pfad 11.750, je Turm 35.250). Wer einen Turm eine Partie lang hauptsächlich spielt, schaltet etwa
  2–3 Stufen frei; T5 braucht spürbar viele Partien.
- Freischalten passiert im **Turm-Detail** (Bildschirm außerhalb des Matches) per Klick, nicht automatisch: das ist der
  kleine Glücksmoment. Im Match zeigt das Upgrade-Panel gesperrte Stufen mit Schloss und „Unlock with Tower XP“.
- **Testhilfe:** im Test-Build (`?test=1` oder Einstellung „Developer: unlock everything“) ist alles frei (für Max' Tests
  der T5-Stufen). Standard: aus.

## Wissensbaum (wie Monkey Knowledge)

Punkte aus Level-Ups. 10 Knoten in drei Ästen, Voraussetzung = Knoten darüber. Werte gehen als `mods` in die Sim.

| Ast | Knoten | Kosten | Wirkung | braucht |
|---|---|---:|---|---|
| Economy | Head Start | 1 | +100 Startgold | – |
| | Better Deals | 1 | Verkauf 75 % statt 70 % | Head Start |
| | Lantern Tax | 2 | Rundenbonus +20 in Runde 1–10 | Better Deals |
| Towers | Sharp Eyes | 1 | Ranger +8 % Reichweite | – |
| | Bigger Barrels | 1 | Bombardier +10 % Explosionsradius | – |
| | Cold Snap | 1 | Frostcaller-Verlangsamung +25 % Dauer | – |
| | Cheaper Basics | 2 | Stufe-1-Upgrades −10 % Preis | eine der drei darüber |
| Wardens | Extra Lives | 1 | +10 Leben | – |
| | Veteran Hero | 2 | Wren startet auf Level 3 | Extra Lives |
| | Fast Learner | 2 | Turm-XP +20 % | Extra Lives |

Zurücksetzen des Baums: kostenlos, gibt alle Punkte zurück (Slice, später ggf. mit Preis).

## Medaillen

- Je Karte und Schwierigkeit **Easy / Medium / Hard** eine Medaille für den Sieg (Bronze/Silber/Gold-Optik), Anzeige auf der
  Kartenwahl. Alle drei auf einer Karte → Rahmen um die Kartenkachel (BTD6 Bronze/Gold Border).
- Bestleistung je Karte/Stufe (höchste Runde, wenige Leben verloren) als kleine Zahl.

## Bildschirme (Client, P4)

1. **Ergebnis** nach dem Match: Runde erreicht, Medaille (falls neu), **XP-Balken füllt sich animiert**, Level-Up mit
   Freischalt-Karte (Turm/Held/Stufe) und Ton, Turm-XP je benutztem Turm (+N, Balken), Knöpfe „Again“ / „Home“.
2. **Wissensbaum**: drei Äste als Pixel-Knoten mit Linien, Punkte oben, Klick kauft, Tooltip erklärt.
3. **Turm-Detail**: Turm groß (Sprite in der gewählten Stufe), 3 × 5 Stufen als Pixel-Icons mit Name/Preis, Turm-XP-Balken,
   Klick auf freischaltbare Stufe → Freischalten (Ton + Effekt), Vorschau des Sprites je Stufe beim Überfahren.
4. **Startseite / Kartenwahl**: Spieler-Level + Balken, Karte mit Medaillen, Schwierigkeit wählen, Knöpfe zu Türme/Wissen.
