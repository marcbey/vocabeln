# FEATURE: Sprachein- und -ausgabe fuer die Vokabel-App

## 1) Ausgangslage (Ist-Stand)

- Frontend: React 19 + Vite (SPA), Tailwind, Vitest.
- Quiz-Logik liegt zentral in:
  - `src/hooks/useQuizController.js`
  - `src/hooks/quiz/useQuizActions.js`
  - `src/utils/answers.js`
- Deployment heute: statisch auf GitHub Pages via `.github/workflows/deploy.yml`.
- Fuer OpenAI-Features ist ein reines Static-Hosting ungeeignet, weil der API-Key nicht im Frontend liegen darf.

## 2) Ziel

- Die aktuell abgefragte Vokabel soll vorgelesen werden koennen (TTS).
- Antworten sollen zusaetzlich per Sprache eingegeben und geprueft werden koennen (STT).
- Kein Exposing von `OPENAI_API_KEY` im Browser.
- Deployment von GitHub Pages auf Render.com umstellen.

### 2.1 Konkrete UI-Anforderungen (verbindlich)

1. Neben der aktuell abgefragten Vokabel steht ein TTS-Button.
2. Der TTS-Button liest genau die abgefragte Vokabel vor.
3. Der Akzent wird aus der Sprache der abgefragten Vokabel abgeleitet:
   - englische Vokabel => englischer Akzent
   - deutsche Vokabel => deutscher Akzent
4. Rechts neben dem Antwort-Formfeld steht ein Mikrofon-Button.
5. Spracheingabe ist "push-to-talk":
   - halten => Aufnahme starten
   - loslassen => Aufnahme stoppen und an OpenAI senden
6. OpenAI liefert einen String mit der erkannten/normalisierten Zielvokabel zurueck.
7. Die App prueft dieses Ergebnis identisch zur Texteingabe:
   - falsch => gleicher Fehlerstatus wie beim manuellen Tippen
   - richtig => gleicher Erfolgspfad, inklusive Sprung zur naechsten Vokabel

## 3) Empfohlene Architektur

### 3.1 High-Level

- Behalte die bestehende React-App bei.
- Ergaenze ein kleines Node.js-Backend (Express) im selben Repo.
- Deploy als **ein Render Web Service** (Frontend + Backend in einem Service).
  - Vorteil: kein CORS-Setup zwischen zwei Domains, weniger Betriebsaufwand.

### 3.2 Komponenten

- `frontend` (bestehende Vite-App)
  - Quiz UI + neue Audio-Controls.
  - Sendet fuer TTS/STT Requests an das Backend.
- `backend` (neu)
  - Haltet `OPENAI_API_KEY` geheim.
  - Stellt Endpunkte bereit:
    - `POST /api/tts` (liefert Audio fuer die abgefragte Vokabel)
    - `POST /api/stt/check` (nimmt Audio nach Loslassen entgegen und gibt den String zurueck)
    - `GET /api/health` (Healthcheck fuer Render)
  - Optional spaeter:
    - `POST /api/realtime/session` (Ephemeral Token fuer echte Realtime-Streaming-Variante)

### 3.3 Audio-Flows

#### A) Vokabel vorlesen (TTS)

1. Frontend kennt den aktuellen `questionText`.
2. User klickt "Vorlesen".
3. Frontend sendet `questionText` + `questionLanguage` (`de`/`en`) an `POST /api/tts`.
4. Backend ruft OpenAI TTS mit sprach-/akzentbezogener Instruktion auf.
5. Audio wird im Browser abgespielt.

#### B) Spracheingabe pruefen (STT)

1. User haelt den Mikrofon-Button rechts am Input (`pointerdown`) => Aufnahme startet.
2. User laesst den Button los (`pointerup`) => Aufnahme stoppt.
3. Frontend sendet die Aufnahme an `POST /api/stt/check`.
4. Backend transkribiert bei OpenAI und gibt einen String als Kandidat-Antwort zurueck.
5. Frontend schreibt den String in `answerValue` und ruft denselben Submit-Flow wie bei Texteingabe auf.
6. Bestehende Check-Logik (`isCorrect`, `isCorrectIrregular`) bleibt die einzige fachliche Wahrheit.

## 4) Tech-Stack Vorschlag (auf Basis des aktuellen Projekts)

- **Beibehalten**
  - React + Vite + Tailwind + Vitest + ESLint
  - Zod (bereits vorhanden) fuer Request/Response Validierung
- **Neu**
  - Express (leichtgewichtiges Backend)
  - OpenAI Node SDK (nur Backend)
  - Optional: `express-rate-limit` fuer Abuse-Schutz auf Audio-Endpunkten

Warum Express?
- Minimale Lern- und Integrationskosten, da bereits Node-Tooling im Projekt vorhanden ist.
- Einfacher Betrieb als ein gemeinsamer Render Web Service.

## 5) Geplante Code-Struktur

```text
/
  src/
    components/question/
      QuestionPrompt.jsx              # Vorlesen-Button
      AnswerInputSection.jsx          # Mikrofon-Button (hold-to-talk) + Transkriptstatus
    hooks/
      audio/
        useSpeechPlayback.js          # TTS triggern (Button neben Frage)
        useSpeechInput.js             # Recording/Upload bei hold/release
  server/
    index.js                          # Express app + static serving
    routes/
      tts.js                          # /api/tts
      sttCheck.js                     # /api/stt/check
      health.js                       # /api/health
    openai/
      synthesizeVocabulary.js
      transcribeAndNormalizeAnswer.js
```

## 6) Implementierungsplan (Phasen)

## Phase 1 - Backend-Basis

- `server/index.js` aufsetzen.
- `POST /api/tts` und `POST /api/stt/check` implementieren.
- Request-Konfiguration einschraenken (nur benoetigte Modelle/Voices).
- `npm run start` Script einfuehren.

Akzeptanzkriterien:
- `GET /api/health` liefert `200`.
- `POST /api/tts` liefert abspielbares Audio.
- `POST /api/stt/check` liefert einen Antwort-String.
- Kein OpenAI-Key im Frontend-Bundle.

## Phase 2 - TTS im Frontend

- In `QuestionPrompt.jsx` einen "Vorlesen"-Button ergaenzen.
- Audio-Hook integrieren (`useSpeechPlayback`).
- Sprach-/Akzentwahl an Frage-Sprache koppeln (`de`/`en`).
- States fuer loading/error/playing sichtbar machen.

Akzeptanzkriterien:
- Aktuelle Vokabel wird auf Klick vorgelesen.
- Englische Fragen werden mit englischem Akzent, deutsche Fragen mit deutschem Akzent vorgelesen.
- UI bleibt bedienbar, auch wenn Audio fehlschlaegt.

## Phase 3 - STT im Frontend

- In `AnswerInputSection.jsx` Mikrofonbutton rechts neben dem Formfeld integrieren.
- Hold-to-talk via `pointerdown`/`pointerup`/`pointercancel` umsetzen.
- Audio beim Loslassen an `/api/stt/check` senden.
- Rueckgabe-String in `answerValue` uebernehmen und direkt denselben Submit-Flow ausfuehren wie bei Texteingabe.

Akzeptanzkriterien:
- Gesprochene Antwort landet im Input.
- Check verhaelt sich identisch zu getippter Antwort (gleiches Fehler-/Erfolgsverhalten).
- Bei korrekter gesprochener Antwort springt die App zur naechsten Vokabel wie beim manuellen "Check!".
- Irregular-Verben bleiben korrekt pruefbar.

## Phase 4 - Deployment-Migration zu Render

- GitHub Pages Deployment stilllegen:
  - `.github/workflows/deploy.yml` entfernen oder deaktivieren.
  - README auf Render aktualisieren.
- Render Blueprint (`render.yaml`) oder manuelles Setup:
  - Build: `npm ci && npm run build`
  - Start: `npm run start`
  - Env Vars: `OPENAI_API_KEY`, `NODE_ENV=production`

Akzeptanzkriterien:
- App ist unter Render URL erreichbar.
- API-Endpunkte `/api/*` und Frontend laufen auf derselben Domain.
- Sprachfunktionen funktionieren in Produktion.

## Phase 5 - Qualitaet und Betrieb

- Tests:
  - Unit-Tests fuer neue Audio-Hooks (Mocking).
  - API-Tests fuer `/api/tts` und `/api/stt/check` (Statuscodes, Fehlerfaelle).
- Logging + Limits:
  - Rate-Limit auf Audio-Endpunkten
  - Fehlerlogging fuer Audio-Transkription und TTS.

Akzeptanzkriterien:
- `npm run check` bleibt gruen.
- Fehlerfaelle sind fuer User verstaendlich und fuer Betrieb sichtbar.

## 7) Deployment-Details (Render)

Empfohlen: Ein Service fuer alles (API + statische Assets).

Beispiel `render.yaml`:

```yaml
services:
  - type: web
    name: vocabeln-app
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        sync: false
```

Server muss in Produktion `dist/` statisch ausliefern und fuer unbekannte Routen auf `index.html` fallen (SPA fallback).

## 8) Sicherheit

- `OPENAI_API_KEY` nur im Render Backend-Environment.
- Kein Key in `VITE_*` Variablen.
- Audio-Endpunkte mit Rate-Limit + optional Origin-Pruefung.
- Keine persistenten Audio-Rohdaten speichern.

## 9) Risiken und Gegenmassnahmen

- Browser-Mikrofonrechte blockiert:
  - klare UI-Hinweise + Retry-Flow.
- Upload/Transkriptionsfehler:
  - Fallback auf normale Texteingabe ohne Flow-Abbruch.
- Kostenkontrolle:
  - Modellwahl bewusst treffen, Nutzungsmetriken loggen, Session-Limits setzen.

## 10) Offene Entscheidungen

- STT-Verarbeitung: OpenAI transkribiert, fachliche Richtig/Falsch-Pruefung bleibt in der bestehenden App-Logik.
- Der von OpenAI gelieferte String bleibt bei falscher Antwort im Input sichtbar.
- Bei sehr kurzen Aufnahmen (< 300ms) wird lokal ein unauffaelliger Hinweis gezeigt statt API-Call.
- Spaeter moeglich: zusaetzliche Realtime-Variante mit Ephemeral Tokens.
