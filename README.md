# Vokabeltrainer (React)

A React vocab trainer with the same UX as the vanilla prototype.

## Lokal entwickeln
- `npm ci`
- `npm run dev:full` (Frontend + Backend parallel)
- Optional getrennt:
  - `npm run dev` (Vite auf Port 5173)
  - `npm run dev:server` (API auf Port 10000)
- `npm run lint` (ESLint)
- `npm run test` (Vitest Test-Suite)
- `npm run check` (Lint + Tests + Build)

## Build
- `npm run build` → schreibt nach `dist`
- `npm run start` startet den Produktionsserver (API + statische App)

## OpenAI Konfiguration

Folgende Environment Variablen werden im Backend verwendet:
- `OPENAI_API_KEY` (Pflicht)
- `OPENAI_TTS_MODEL` (optional, default: `gpt-4o-mini-tts`)
- `OPENAI_STT_MODEL` (optional, default: `gpt-4o-mini-transcribe`)
- `OPENAI_TEXT_MODEL` (optional, default: `gpt-4o-mini`, fuer Beispielsatz-Generierung)

Der API-Key darf nicht in `VITE_*` Variablen liegen.

Lokal:
- `.env` im Projektroot anlegen
- Beispiel:
  - `OPENAI_API_KEY=sk-...`
  - `OPENAI_TTS_MODEL=gpt-4o-mini-tts`
  - `OPENAI_STT_MODEL=gpt-4o-mini-transcribe`
  - `OPENAI_TEXT_MODEL=gpt-4o-mini`
- `npm run dev:full` laedt `.env` automatisch, falls vorhanden.

## Deployment auf Render

Das Deployment ist auf Render als Web Service ausgelegt (Frontend + Backend in einem Service).

- Blueprint: `render.yaml`
- Build Command: `npm ci && npm run build`
- Start Command: `NODE_ENV=production npm run start`
- Benoetigte Env Vars auf Render:
  - `OPENAI_API_KEY`

### Render Setup Checkliste

1. In Render: `New +` -> `Blueprint` waehlen und Repo verbinden.
2. `render.yaml` bestaetigen und Service erstellen.
3. Unter Service `Environment` den Secret `OPENAI_API_KEY` setzen.
4. Optional `OPENAI_TTS_MODEL`, `OPENAI_STT_MODEL` und `OPENAI_TEXT_MODEL` setzen.
5. Deploy starten und auf `.../api/health` pruefen (`{"status":"ok"}`).
