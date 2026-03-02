# DEPLOYMENT_CI_CD_IAC_SPEC

## 1. Purpose
This document is the authoritative deployment, CI/CD, and IaC specification for the `vocabeln` project.
It defines exact build and release behavior so an LLM can reproduce operations without follow-up questions.

## 2. Scope
Covered:
- local build and run contracts
- CI pipeline contract
- Render deployment contract
- Terraform IaC contract for Render
- post-deploy verification and rollback

Not covered:
- feature-level frontend/backend implementation details

## 3. Runtime and Build Baseline
- Node.js runtime target: Node 22 in CI.
- Package manager: npm (lockfile required).
- Build output: `dist/` via Vite.
- Production server: `node server/index.js`.

Mandatory scripts (from `package.json`):
- `npm run dev`
- `npm run dev:server`
- `npm run dev:full`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run check`

## 4. Environment Matrix
## 4.1 Required Secrets
- `OPENAI_API_KEY` (required for runtime audio features)
- `RENDER_API_KEY` (required only for Terraform apply)

## 4.2 Runtime Configuration
- `OPENAI_TTS_MODEL` (default `gpt-4o-mini-tts`)
- `OPENAI_STT_MODEL` (default `gpt-4o-mini-transcribe`)
- `OPENAI_TEXT_MODEL` (default `gpt-4o-mini`)
- `TTS_CACHE_DIR` (default `/tmp/tts-cache` unless persistent disk mounted)
- `NODE_ENV=production` in deployed service
- `PORT` or `API_PORT` (default fallback `10000`)

## 4.3 Frontend Configuration
- `VITE_DEV_API_TARGET` for local API proxy only.
- Secrets must never be exposed via `VITE_*`.

## 5. Local Development and Verification Contract
## 5.1 Install
1. `npm ci`
2. create `.env` with at least `OPENAI_API_KEY`

## 5.2 Run modes
- Full stack local: `npm run dev:full`
- Frontend only: `npm run dev`
- Backend only: `npm run dev:server`

## 5.3 Quality gate before push
Mandatory:
1. `npm run lint`
2. `npm run test`
3. `npm run build`

Equivalent one-shot gate:
- `npm run check`

## 6. CI Pipeline Specification (GitHub Actions)
Authoritative workflow file:
- `.github/workflows/ci.yml`

Pipeline contract:
- Triggers:
  - all pull requests
  - pushes to `main`
- Job:
  - `verify`
  - `runs-on: ubuntu-latest`
- Steps (ordered):
  1. checkout
  2. setup-node (version 22, npm cache, `package-lock.json` cache key)
  3. `npm ci`
  4. `npm run lint`
  5. `npm run test`
  6. `npm run build`

Failure policy:
- Any step failure fails the job.
- Merge to main requires green CI status checks.

## 7. CD Specification (Render Git Deploy)
## 7.1 Render Blueprint (`render.yaml`)
Minimum contract:
- service type: `web`
- env: `node`
- build command: `npm ci && npm run build`
- start command: `NODE_ENV=production npm run start`
- env vars:
  - `OPENAI_API_KEY` (secret)
  - `OPENAI_TTS_MODEL`
  - `OPENAI_STT_MODEL`

## 7.2 Runtime behavior in production
Server must:
- serve `/api/*` endpoints
- serve static `dist/`
- use SPA fallback for all non-API routes
- expose `/api/health` returning 200 for health checks

## 7.3 Auto-deploy behavior
When using Render Git integration:
- main branch commits trigger deploys (or configured trigger mode)
- deployed artifact must include both frontend and backend in one service

## 8. IaC Specification (Terraform, Render)
Authoritative folder:
- `infra/render`

## 8.1 Provider and resource model
- provider: `render-oss/render`
- resource: `render_web_service`
- native runtime source from repo URL + branch

## 8.2 Required Terraform variables
- `render_api_key`
- `render_owner_id`
- `openai_api_key`

## 8.3 Important optional variables
- `service_name` (default `vocabeln-app`)
- `repo_url` (default project GitHub URL)
- `repo_branch` (default `main`)
- `plan` (default `starter`)
- `region` (default `oregon`)
- `auto_deploy_trigger` (`commit|checks_passed|off`, default `commit`)
- `openai_tts_model`
- `openai_stt_model`
- `openai_text_model`

## 8.4 Persistent disk contract
- `persistent_disk_enabled` default `true`
- size default `1 GB`
- mount path default `/var/data`
- cache dir default `/var/data/tts-cache`
- if disk disabled, force cache path `/tmp/tts-cache`

## 8.5 Terraform apply procedure
1. `cd infra/render`
2. `cp terraform.tfvars.example terraform.tfvars`
3. set required vars in `terraform.tfvars`
4. export env:
   - `TF_VAR_render_api_key`
   - `TF_VAR_openai_api_key`
5. run:
   - `terraform init`
   - `terraform plan`
   - `terraform apply`

## 9. Post-Deploy Smoke Tests
Required checks after each production deploy:
1. open service URL and verify SPA loads.
2. `GET /api/health` returns 200 + `{ "status": "ok" }`.
3. `POST /api/tts` returns `audio/mpeg`.
4. `POST /api/tts/example` returns `audio/mpeg`.
5. check response headers include cache telemetry (`X-Cache`, `X-TTS-Audio-Cache`, and sentence cache header for example route).
6. verify speech input path with a short real recording.

## 10. Rollback and Recovery
## 10.1 Preferred rollback
- Roll back via Render to last known healthy deploy.
- If infra drift caused issue, re-apply last known good Terraform state.

## 10.2 Incident fallback
- Keep service running even when cache writes fail (degrade to non-cached OpenAI requests).
- If persistent disk is broken, temporarily set `TTS_CACHE_DIR=/tmp/tts-cache` and redeploy.

## 11. Security and Compliance Rules
- No secrets in repository or workflow logs.
- No secrets in frontend bundle.
- Never commit `.env`.
- API endpoints must remain server-side and same-origin in production.

## 12. Definition of Done for Operations
A deployment setup is complete only if:
1. CI pipeline passes on PR and main push.
2. Render deploy succeeds from main.
3. health endpoint is green.
4. tts/stt flows work in production.
5. Terraform can reproduce the same service configuration.

## 13. Relation to Other Specs
- Architecture and API behavior: see `ARCHITECTURE_&_TECH_STACK_SPEC.md`.
- UI interaction behavior: see `UI_UX_SPEC.md`.
- TTS cache internals: see `CACHE_SPEC.md`.
