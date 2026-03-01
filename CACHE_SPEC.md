# CACHE_SPEC

## 1. Purpose
This is the authoritative caching specification for TTS and example-sentence generation.
It defines exact behavior for memory cache + persistent disk cache so an LLM can implement without follow-up.

This spec supersedes cache-relevant narrative from `FEATURE.md` and complements `ARCHITECTURE_&_TECH_STACK_SPEC.md`.

## 2. Scope
Covered:
- `POST /api/tts` (vocabulary audio)
- `POST /api/tts/example` (example sentence + example audio)
- OpenAI cost reduction and response latency optimization

Not covered:
- Browser HTTP caching
- STT caching (out of scope)

## 3. Cache Layers
## 3.1 L1 Memory (Process Local)
- In-memory `Map`
- Fast hit path
- Volatile across restarts/deploys

## 3.2 L2 Disk (Persistent)
- Root directory: `TTS_CACHE_DIR`
- Default fallback: `/tmp/tts-cache`
- Render persistent default: `/var/data/tts-cache`
- Survives process restart when persistent disk enabled

## 4. Cache Types and TTL
## 4.1 Audio Cache Types
- `vocabulary_audio`
  - disk TTL: 30 days
- `example_audio`
  - disk TTL: 7 days

## 4.2 Sentence Cache Type
- `example_sentence`
  - disk TTL: 7 days

## 4.3 Memory Cache Policy
- memory TTL per item: 6 hours
- max memory items per cache map: 200
- expired entries removed opportunistically before size pruning

## 5. Key Derivation
## 5.1 Hash Function
- SHA-256 over string-joined parts
- join delimiter: Unicode U+241F (`\u241F`)

Helper contract:
- `hashCacheParts(parts: string[]) -> hex64`

## 5.2 Audio Cache Key Inputs
Include all fields:
- namespace literal: `tts-audio`
- `cacheKind` (`vocabulary_audio` | `example_audio`)
- `language` (`de` | `en`)
- `normalizedText`
- `voice`
- `ttsModel`
- `ttsInstructionsVersion`

Any change to model, voice, or prompt instructions must change key material (or version string), forcing safe invalidation.

## 5.3 Sentence Cache Key Inputs
Include all fields:
- namespace literal: `tts-sentence`
- `language`
- normalized vocabulary (lowercase)
- `textModel`
- `sentencePromptVersion`

## 6. Text Normalization Rules
## 6.1 Vocabulary for Audio
- trim
- optionally remove parenthetical segments for vocabulary pronunciation path
- collapse whitespace

## 6.2 Sentence Text
- trim edges
- collapse whitespace
- strip wrapping quotes/backticks

## 7. Disk Layout
Required layout under `TTS_CACHE_DIR`:
- `audio/<audio_sha>.mp3`
- `meta/index.json`

No SQLite usage.

## 8. Metadata Schema (`index.json`)
Top-level object:
- `audio`: map
- `sentences`: map

### 8.1 Audio Entry
```json
{
  "fileName": "<audio_sha>.mp3",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "lastAccessAt": "2026-03-01T12:10:00.000Z",
  "expiresAt": "2026-03-31T12:00:00.000Z",
  "sizeBytes": 12345,
  "language": "de",
  "kind": "vocabulary_audio"
}
```

### 8.2 Sentence Entry
```json
{
  "sentence": "Ich benutze heute das Wort Haus.",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "lastAccessAt": "2026-03-01T12:10:00.000Z",
  "expiresAt": "2026-03-08T12:00:00.000Z",
  "language": "de"
}
```

Invalid/malformed JSON behavior:
- treat as empty cache (do not crash request path)

## 9. Read/Write Algorithms
## 9.1 Common Requirements
- Ensure directories exist before first access.
- Persist metadata atomically:
  - write temp file
  - rename temp -> `index.json`
- Serialize metadata updates through a write queue/mutex.
- Cleanup expired entries on startup and periodically.

## 9.2 `getAudio(cacheKey)`
1. Ensure cache ready.
2. Lookup metadata entry.
3. If missing -> MISS.
4. If expired:
   - remove metadata
   - delete file best-effort
   - persist metadata
   - MISS
5. Try read audio file.
6. If file missing:
   - remove metadata
   - persist metadata
   - MISS
7. If read success:
   - return buffer
   - schedule debounced `lastAccessAt` touch

## 9.3 `setAudio(...)`
1. Ensure cache ready.
2. Cleanup expired entries first.
3. Compute projected total bytes:
   - total existing bytes - existing same-key bytes + new size
4. If projected > max bytes (default 950MB):
   - skip write, return `false`
5. Write MP3 atomically (`target.tmp` -> `rename`).
6. Upsert metadata entry.
7. Persist metadata.
8. Return `true`.

## 9.4 `getSentence(cacheKey)`
1. Ensure cache ready.
2. Lookup metadata entry.
3. If missing -> MISS.
4. If expired:
   - remove metadata
   - persist
   - MISS
5. Return sentence string.
6. Schedule debounced touch update.

## 9.5 `setSentence(...)`
1. Ensure cache ready.
2. Cleanup expired entries.
3. Upsert sentence entry with timestamps.
4. Persist metadata.
5. Return `true`.

## 10. Endpoint Integration Rules
## 10.1 `/api/tts` flow
1. Normalize text.
2. Build audio cache key.
3. L1 check.
4. If L1 miss -> L2 check.
5. If L2 miss -> call OpenAI TTS.
6. Save to L1 and L2.
7. Return MP3.

## 10.2 `/api/tts/example` flow
1. Normalize vocabulary.
2. Build sentence key.
3. Check sentence L1/L2.
4. On miss call text model and validate sentence uses vocabulary.
5. Save sentence to L1/L2.
6. Build audio key for sentence.
7. Execute audio flow equivalent to `/api/tts`.

## 11. Concurrency and Dedupe
## 11.1 In-Flight Request Dedupe
Maintain in-flight maps by key:
- one map for audio
- one map for sentence

Rule:
- if same key is already processing, return same Promise instead of firing second OpenAI call.

## 11.2 Metadata Write Serialization
- All metadata mutations pass through one queue.
- Prevents lost updates during concurrent writes.

## 12. Size and Cleanup Policies
- default max disk bytes: `950 * 1024 * 1024`
- cleanup interval: every 6 hours
- startup cleanup: mandatory
- touch debounce for `lastAccessAt`: 1 minute

No LRU eviction requirement.
Policy is TTL + hard size cap + skip-new-write when full.

## 13. Failure Handling
Required graceful behavior:
- corrupted/missing index -> treat as cache miss and rebuild gradually
- missing audio file with metadata present -> remove stale metadata and continue
- disk write failures/full disk -> serve fresh response, skip cache write, do not fail entire request unless OpenAI also fails
- OpenAI failure -> return endpoint error response

## 14. Telemetry and Headers
Endpoints must expose cache source via headers:
- `X-TTS-Audio-Cache: memory|disk|openai`
- `X-TTS-Sentence-Cache: memory|disk|openai` (example route only)
- `X-Cache: HIT|MISS`

`X-Cache` rule:
- `MISS` if any used source is `openai`
- else `HIT`

## 15. Security and Data Handling
- Cache only synthesized MP3 + generated sentence text metadata.
- Do not store STT raw audio.
- Do not store API keys in cache files.
- Keep cache path outside web-served static directory.

## 16. Environment and Infra Requirements
- `TTS_CACHE_DIR` configurable via env.
- Render persistent disk recommended:
  - mount path `/var/data`
  - size 1GB
  - cache dir `/var/data/tts-cache`
- If persistent disk disabled, fallback to `/tmp/tts-cache`.

## 17. Test Matrix (Minimum)
Implement automated tests for:
1. Audio write/read roundtrip and reload across cache instance restart.
2. Sentence TTL expiration.
3. Corrupted `index.json` recovery.
4. Max-size protection skips new audio writes.
5. In-flight dedupe (same key should call upstream once).
6. Missing-file stale metadata cleanup.

## 18. Implementation Checklist
1. Implement disk cache module with atomic index writes.
2. Implement hash key helpers and versioned key material.
3. Integrate L1+L2 read path for audio and sentence.
4. Integrate write path with size guard and TTL metadata.
5. Add in-flight dedupe maps.
6. Add cache response headers in TTS routes.
7. Add tests from matrix above.

## 19. Deprecation Note
After this spec is adopted, cache implementation no longer requires `FEATURE.md` or `PROTOTYPE_SPEC.md` context.
Those files can be removed.
