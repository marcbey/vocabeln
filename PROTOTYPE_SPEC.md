## Funktions- und UI-Beschreibung des Prototyps

### Grundlayout & Look
- Dunkelblauer Hintergrund mit radialen Gradients; Header + Hauptkarte mittig, max. 1100px, Glas-Effekt (Blur, halbtransparent), 18px Radius, Schlagschatten. Schrift: „Baloo 2“ → „Comic Neue“ → „Trebuchet MS“ → system-ui.
- Body: 20px Padding, 20px Abstand zwischen Header/Main.
- Buttons: Standard Verlaufs-Akzent; Secondary dunkles Blau; Toggle aktiv: Accent-2 → Accent. Badge mit leichtem Accent-Gradient. Card-Innenabstand 20px.

### Header
- Titel „Orange Line 1 - Unit 1-6“ mit kleinem Farbverlauf-Punktlogo.
- Dropdowns:
  - `pageSelect`: Pages aus `vocab_data.js`. Abgeschlossene Pages erhalten „ ✅“. Wird verborgen/deaktiviert, wenn Richtung „irregular“ gewählt.
  - `directionSelect`: „Englisch → Deutsch“ (`en-de`), „Deutsch → Englisch` (`de-en`), „Englisch ↔ Deutsch“ (`mixed`), „Irreguläre Verben“ (`irregular`). Pfeil hat extra Rechtsabstand (Padding 26px, Margin 10px).
- Buttons rechts: „Tafel-Modus“ (toggle, aktive Hervorhebung), „Neu anfangen“ (Reset).
- Bei Auswahl „irregular“ wird `pageSelect` deaktiviert/versteckt; beim Zurückwechseln wird die letzte reguläre Page (`lastRegularPage`, sonst erste Page) wieder gesetzt.

### Hauptkarte (card)
- Flex-Column. Enthält:
  - **Question-Zeile**: Große Frage (1.6rem), zentriert, mit heller Rahmenfläche, min-height 86px, Wrap erlaubt.
  - **Arrow + Translation**: `questionArrow` und `boardTranslation` inline, Border/Dashed, bleiben im Layout (visibility/opacity), nicht via display entfernt.
  - **Input-Row (Nicht-Tafel-Modus)**: Textfeld mit Status-Icon rechts (`inputStatus`), Button „Check!“, Button „Lösung zeigen“. Enter triggert Submit. Status-Icon zeigt ✓ grün oder ✗ rot, verschwindet nach Timeout.
  - **Board-Controls (Tafel-Modus)**: Buttons „✓ Richtig“ (grün) und „✗ Falsch“ (rot); ersetzen Input-Row.
  - **Retry-Button**: „Diese Seite nochmal üben“, erscheint nur bei kompletter Seite.
  - **Badge**: Rechts ausgerichtet, zeigt `Fortschritt` + „X richtig · Y Versuche · Z Fragen“.
- In Nicht-Tafel-Modus wird Übersetzung nur bei „Lösung zeigen“ oder wenn Aufgabe fertig angezeigt; im Tafel-Modus immer sichtbar.

### Feedback / Animation
- Bei korrekter/falscher Eingabe flasht die ganze Karte kurz grün/rot (Box-Shadow + Gradient); Status-Icon erscheint.
- Fireworks-Belohnung bei erstmaligem vollständigem Abschluss einer Seite.
- Wenn eine Richtung fertig ist, aber die andere nicht, wird automatisch in die verbleibende Richtung gewechselt (kein Hinweis-Text).

### Logik & State
- State: `currentPage`, `direction`, `asked`, `correct`, `answeredCorrect` (Set), `currentWord`, `completedPages` (Set), `boardMode`, `currentQuestionDir`.
- Richtungen: `en-de`, `de-en`, `mixed`, `irregular`. Für reguläre Vokabeln zählen immer beide Richtungen; eine Page ist fertig, wenn `en-de` + `de-en` ≥ 2 * Anzahl Vokabeln. „mixed“ stellt zufällig beide Richtungen und zählt auf beide Sets.
- Irregular: `irregular_vocab_data.js` mit Feldern `infinitive`, `simplePast`, `pastParticiple`, `german`. Antwort erwartet drei Teile; Alternativen per Slash erlaubt; Normalisierung entfernt Klammern/Slashes/Mehrfach-Leerzeichen.
- Normale Antworten: Kleinschreibung, entfernt Satzzeichen, vergleicht gegen Alternativen, die per `; / ( )` getrennt sind.
- Schlüssel pro beantwortetem Item: `answeredKey(word, dir)` → `${en|de}|${dir}` im Set.
- `pickWord()`: Zufällige unbeantwortete Vokabel; bei „mixed“ wird `currentQuestionDir` gesetzt. Wenn keine Kandidaten in aktueller Richtung, aber Page nicht komplett, wird automatisch die Richtung gewechselt (über `presentWord`). Wenn gar nichts übrig und Page komplett → Celebration; wenn nichts mehr in aktueller Richtung, aber Seite nicht komplett, Autowechsel.
- `presentWord()`: Fragt Wort; für irregular Placeholder „Infinitive, Simple Past, Past Participle“. Bei kompletter Seite: Erfolgstext, Eingaben aus, Retry sichtbar.
- `handleSubmit()`: Nicht-Tafel, prüft Antwort, erhöht `asked`, trägt Ergebnis ins Set, Status/Flash, speichert Fortschritt, nächste Frage mit kleinem Delay. Falsch: Status rot, Fortschritt speichern.
- `handleBoardResult(isCorrect)`: Für Tafel-Modus; zählt asked, trägt Ergebnis, wechselt Frage.
- `showSolution()`: Zeigt Lösung, zählt als Versuch (`asked`++), Button-Text „Weiter“, Eingaben aus, speichert Fortschritt.
- `toggleBoardMode()`: Schaltet UI, deaktiviert/aktiviert Eingaben, zeigt Board-Controls/Übersetzung; beim Verlassen `showingSolution` zurücksetzen, Input fokussieren.
- `setModeUI()`: Steuert Sichtbarkeit/Disabled je nach Modus, Richtung, Komplettstatus. Versteckt `pageSelect` bei „irregular“. Fokus-Refocus, wenn sinnvoll.
- `markCompletedPages()`: Hängt „ ✅“ an Dropdown-Optionen für fertige Seiten.
- `resetCurrentPageProgress()`: Löscht Fortschritt nur der aktuellen Page, entfernt sie aus `completedPages`, setzt asked/correct zurück, lädt neue Frage.
- `resetAll()`: Löscht localStorage-Keys `progress` und `settings`, leert Sets, setzt Page auf erste und Richtung auf `en-de`, lädt neu.
- `triggerCelebration()` fügt Page zu `completedPages`, startet Fireworks, speichert Fortschritt; wird nur einmal pro Page ausgelöst.
- `setModeUI()` deaktiviert Eingaben und zeigt Retry, wenn Seite komplett; versteckt `pageSelect` bei „irregular“; blendet Übersetzung/Arrow per visibility, nicht display; in Tafel-Modus Input/Buttons disabled, Board-Controls sichtbar.

### Persistenz (localStorage)
- `settings`: JSON mit `currentPage`, `direction`, `boardMode`. Laden/Speichern bei Start/Wechsel.
- `progress`: Map pro Page: `{ page, asked, correct, answered: JSON.stringify(array), completed }`.
- Reset löscht beide Keys; Fortschritt/Selection werden beim Start geladen.

### Keyboard-Fokus (Mobil, iOS Safari)
- In Nicht-Tafel-Modus wird nach Aktionen das Inputfeld refokussiert (Cursor ans Ende), solange nicht `showingSolution`, nicht `boardMode` und Input nicht disabled ist. Hält die Tastatur sichtbar.
- Beim Umschalten aus Tafel-Modus wird Input neu fokussiert; bei Status-Feedback wird nach kleinem Delay refokussiert.

### Datenquellen
- `vocab_data.js`: Objekt `vocabData` mit Keys „Page X“ → Array `{ en, de }`.
- `irregular_vocab_data.js`: Array `irregular` mit unregelmäßigen Verben (oben genannte Felder).

### Service Worker
- Offline-Cache: `./`, `index.html`, `manifest.webmanifest`, `index.css`, `index.js`, `vocab_data.js`, `irregular_vocab_data.js`, Icons 192/512. Fetch: Cache-First; Navigations-Fallback auf index.

### Fireworks
- Container `fireworks` fixed full-screen; `spark` 8x8px, animiert per `pop`-Keyframes über `--dx`/`--dy`; mehrere Bursts, auto-remove nach 900ms.

### States & Texte
- Buttons: „Check!“, „Lösung zeigen“ / „Weiter“, „Neu anfangen“, „Tafel-Modus“, „✓ Richtig“, „✗ Falsch“, „Diese Seite nochmal üben“.
- Erfolgstext: „Mega! Alles richtig auf dieser Seite.“
- Badge-Text: `<small>Fortschritt</small> ${correct} richtig · ${asked} Versuche · ${total} Fragen`.

### Responsive
- Header-Grid wird bei ≤900px einspaltig; Select-Gruppe wrappt. Inputs/Buttons min-height 44px.

### Stile (Variablen)
- `--bg #0f1c2e`, `--panel #13253a`, `--accent #3cdfff`, `--accent-2 #ff7ac3`, `--good #6df2a4`, `--warn #ffb347`, `--text #e9f2ff`, `--muted #9eb4d1`, `--shadow` starker schwarzer Drop, `--glow` cyan Glow, `--radius 18px`, `--speed 220ms`.

### Umsetzung in React
- Gleiche State-Werte + Sets; Events: OnChange Selects (Page, Direction), Toggle Board, Submit, Show Solution, Board Correct/Wrong, Retry Page, Reset All, Enter-Key auf Input, Input-clears-Status.
- UI-Struktur exakt: Header mit zwei Selects + zwei Buttons; Main mit Card (Frage, Arrow+Translation, Input-Row oder Board-Controls, Retry-Button, Badge); Fireworks-Overlay.
- Lokale Persistenz über localStorage im gleichen Schema; optional Service Worker für Offline identisch zur Cache-Liste.
