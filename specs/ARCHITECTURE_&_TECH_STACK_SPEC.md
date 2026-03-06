# ARCHITECTURE_&_TECH_STACK_SPEC

## 1. Purpose and Scope
This document is the authoritative architecture and technology specification for the `vocabeln` application.
It is intentionally implementation-ready so an LLM can build the system end-to-end without clarifying questions.

This spec supersedes architecture-related content in `FEATURE.md` and `PROTOTYPE_SPEC.md`.

## 2. Product Definition
Build a vocabulary trainer web app for class levels 5-8 with:
- regular vocabulary training (`en-de`, `de-en`, `mixed`)
- irregular verb training (`irregular`)
- regular vocabulary scoping by either `page` or `unit` (mutually exclusive filter modes)
- text answer validation
- optional board mode (manual correct/wrong marking)
- text-to-speech (auto read-aloud toggle + generated example sentence)
- speech-to-text input (push-to-talk)
- per-class persisted progress/settings

## 3. Non-Functional Constraints
- No OpenAI key in frontend code or browser storage.
- Frontend + backend run as one deployable Node web service.
- API and SPA share same origin in production.
- Architecture must support Render persistent disk for TTS cache.
- Keep existing behavior-compatible UI text and quiz logic semantics.

## 4. Technology Stack (Required)
### 4.1 Runtime
- Node.js (ESM project, `"type": "module"`)
- Browser targets compatible with React 19 + MediaRecorder API

### 4.2 Frontend
- React 19
- Vite 7
- Tailwind CSS 3 + custom CSS (`client/index.css`)
- classnames
- ios-haptics (iPhone Safari switch-based haptic fallback plus vibration support where available)

### 4.3 Backend
- Express 5
- multer (multipart audio upload)
- express-rate-limit (audio endpoints)
- OpenAI Node SDK
- zod for request validation

### 4.4 Quality Tooling
- Vitest + Testing Library
- ESLint + Prettier

### 4.5 Infra
- Render web service (single service model)
- Optional Terraform provisioning in `infra/render`
- Optional persistent disk for TTS cache

## 5. System Architecture
## 5.1 Deployment Topology
Single service deployment:
1. Express serves `/api/*` routes.
2. In production, Express serves static assets from `dist/`.
3. Non-API routes fallback to SPA `index.html`.

## 5.2 Runtime Components
- SPA frontend: quiz UI, state orchestration, TTS/STT triggers.
- API backend:
  - `GET /api/health`
  - `POST /api/tts`
  - `POST /api/tts/example`
  - `POST /api/stt/check`
- OpenAI integrations:
  - speech synthesis
  - transcription
  - example sentence generation
- Cache subsystem:
  - L1 memory cache (process local)
  - L2 disk cache (JSON metadata + MP3 files)

## 6. Repository Structure (Normative)
- `client/` frontend app
  - `App.jsx` root orchestration
  - `components/` UI composition
  - `hooks/quiz/*` quiz state/actions/persistence/status
  - `hooks/audio/*` TTS playback + STT recording/upload
  - `utils/answers.js` normalization + answer correctness truth
  - `utils/quiz.js` picking/complete logic
  - `data/*` JSON datasets + schema validation
- `server/` backend app
  - `index.js` boot, middleware, route mounting, static serving
  - `routes/` HTTP endpoint handlers
  - `openai/` OpenAI use-case adapters
  - `cache/ttsDiskCache.js` persistent cache module
- `infra/render/` Terraform for Render service + disk

## 7. Frontend Architecture
## 7.1 Application State Model
Central quiz state is owned by `useQuizController`:
- scope context: `page`, `pages`, `unit`, `units`, `filterMode`, `direction`, `lastRegularPage`
- mode context: `boardMode`, `showingSolution`
- progress context: `asked`, `answeredCorrect`, `completedPages`, `completedUnits`, `pageComplete`
- question context: `currentWord`, `currentQuestionDir`, `questionText`, `translation`, `questionLanguage`, `answerLanguage`
- answer context: `answerValue`, `status`, `flash`

Internal scope representation:
- Regular page scopes use the literal page key (e.g. `Class 6 - Page 28`).
- Unit scopes use virtual keys with prefix `unit::` (e.g. `unit::Unit 2`).
- Persisted settings can store either key shape; hydration restores filter mode from key type.

State persistence is per class via localStorage keys:
- `settings:<classId>`
- `progress:<classId>`
- `activeClass`

Global UI preference persistence:
- `speech:autoReadEnabled` (read-aloud toggle, values `1`/`0`)

Backward compatibility rule for class5:
- if scoped class5 key missing, read legacy unscoped keys.

## 7.2 Quiz Domain Rules (Must Preserve)
- Directions: `en-de`, `de-en`, `mixed`, `irregular`
- Mixed mode randomly asks both regular directions.
- Regular page complete only when both directions are completed (`2 * words on page`).
- Regular unit complete only when both directions are completed for the unit scope (`2 * unique words in unit`).
- Irregular mode complete when all irregular entries for selected class are correct.
- If one regular direction is exhausted and the other still has open items, auto-switch direction.
- Filter mode rules:
  - `page` mode enables page select and disables unit select
  - `unit` mode enables unit select and disables page select
  - in `irregular` direction, filter/page/unit selects are disabled
- Unit scope vocabulary is composed by merging mapped pages and deduplicating entries by `en::de`.
- Correct spoken answer in non-board mode is previewed in input and auto-submitted after 2000ms.
- Correct/wrong status events trigger mobile haptics through `ios-haptics` (`confirm`/`error`).
- On iPhone Safari, haptics rely on the Safari 17.4+ `switch` control behavior because `navigator.vibrate()` is typically unavailable.
- Read-aloud toggle behavior:
  - if enabled, auto-read current question text whenever a new question becomes active
  - if enabled, read translation when solution is revealed

## 8. Backend Architecture
## 8.1 Middleware and Limits
- `express.json({ limit: '1mb' })`
- Audio rate limit on `/api/tts` and `/api/stt/check`:
  - window: 60s
  - max: 40 requests
- STT upload:
  - `multipart/form-data`
  - field `audio`
  - max file size 5MB

## 8.2 API Contracts
### `GET /api/health`
- Response: `200 { "status": "ok" }`

### `POST /api/tts`
Request JSON:
- `text`: string, trimmed, min 1, max 120
- `language`: `de` | `en`

Response:
- `200` binary `audio/mpeg`
- headers:
  - `X-Cache: HIT|MISS`
  - `X-TTS-Audio-Cache: memory|disk|openai`

Error:
- `400` invalid payload
- `500` synthesis failure

### `POST /api/tts/example`
Request JSON:
- `text`: string, trimmed, min 1, max 120
- `language`: `de` | `en`

Flow:
1. Generate example sentence.
2. Synthesize example sentence audio.

Response:
- `200` binary `audio/mpeg`
- headers:
  - `X-Cache: HIT|MISS`
  - `X-TTS-Audio-Cache: memory|disk|openai`
  - `X-TTS-Sentence-Cache: memory|disk|openai`

Error:
- `400` invalid payload
- `500` sentence/audio generation failure

### `POST /api/stt/check`
Request multipart:
- `audio`: file (required)
- `language`: `de` | `en`
- frontend normalizes submitted speech language to `de` or `en` before upload (unsupported values fallback to `en`)

Response:
- `200 { transcript: string, answer: string }`

Error:
- `400` invalid payload or unsupported audio
- `500` transcription failure

## 8.3 OpenAI Integration Rules
- Client singleton throws when `OPENAI_API_KEY` missing.
- TTS defaults:
  - model: `gpt-4o-mini-tts` (env override)
  - voice by language: `de -> cedar`, `en -> marin`
  - `response_format: mp3`
- STT default model: `gpt-4o-mini-transcribe` (env override)
- Example sentence default text model: `gpt-4o-mini` (env override)

## 9. Data Contracts
## 9.1 Regular Vocabulary Entry
- `{ english: string, german: string }` in source JSON
- mapped at runtime to `{ en, de }`

## 9.2 Irregular Verb Entry
- `{ infinitive, simplePast, pastParticiple, german }` (all non-empty strings)

## 9.3 Unit-to-Page Mapping
- Source JSON shape per class: `{ "<unitName>": string[] }`.
- Values are page keys that must match keys in the class vocab dataset.
- Unknown page keys are ignored during mapping (filtered out).
- Runtime uses the mapping to build virtual `unit::` scopes.

## 9.4 Validation
- Parse datasets with zod on app start through `client/data/schema.js`.
- Invalid dataset must throw hard error (fail fast).

## 10. Configuration
Environment variables:
- `OPENAI_API_KEY` (required)
- `OPENAI_TTS_MODEL` (optional)
- `OPENAI_STT_MODEL` (optional)
- `OPENAI_TEXT_MODEL` (optional)
- `TTS_CACHE_DIR` (optional; default `/tmp/tts-cache`, infra may set `/var/data/tts-cache`)
- `NODE_ENV` (`production` enables static serving)
- `PORT` or `API_PORT` (default `10000`)

Vite dev proxy:
- `/api` -> `VITE_DEV_API_TARGET` (default `http://localhost:10000`)

## 11. Security Requirements
- Never expose `OPENAI_API_KEY` to frontend (`VITE_*` forbidden for secrets).
- Validate all request payloads (zod for JSON, multer limits for files).
- Keep audio endpoints rate-limited.
- Do not persist raw STT uploads.
- Do not store personal user identifiers in cache metadata.

## 12. Observability and Logging
Minimum logging requirements:
- TTS success logs: route, language, textLength, audio/sentence cache source.
- TTS failure logs: route, language, message.
- STT failures mapped to controlled 400/500 responses.

Cache telemetry via response headers (required):
- `X-Cache`
- `X-TTS-Audio-Cache`
- `X-TTS-Sentence-Cache` (example route)

## 13. Build, Run, and Quality Gates
Required commands:
- `npm run dev:full` for local full stack
- `npm run build`
- `npm run start`
- `npm run check` (lint + test + build)

Definition of done:
- All tests pass.
- `npm run check` passes.
- Audio endpoints work locally and in Render.
- No secret in frontend bundle.

## 14. Implementation Sequence (LLM Execution Plan)
1. Set up server middleware/routes and production static serving.
2. Implement OpenAI adapters (tts/stt/sentence generation).
3. Implement cache subsystem and integrate with TTS + sentence generation.
4. Implement/verify quiz controller behavior and persistence contracts.
5. Implement audio UI hooks/components with exact endpoint contracts.
6. Add/adjust tests for quiz behavior, sentence matching, cache edge cases.
7. Verify Render deployment config and env var wiring.
