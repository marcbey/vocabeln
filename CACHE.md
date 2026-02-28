# TTS Cache Plan (Render Persistent Disk, 1GB)

## Ziel
- OpenAI Token sparen bei wiederholten Requests fuer `Vorlesen` und `Beispielsatz`.
- Audioantworten als `.mp3` persistent auf Render-Disk halten.
- Zusaetzlich die generierten Beispielsaetze persistent cachen, damit auch Textmodell-Tokens gespart werden.

## Audioformat (Bestaetigung)
- Ja, MP3 ist korrekt.
- Im aktuellen Code wird bei OpenAI TTS bereits `response_format: "mp3"` gesetzt.

## Infrastrukturannahmen
- Render Web Service auf `starter`.
- Persistent Disk: `1GB`, Mount Path `/var/data`.
- Cache Root: `/var/data/tts-cache` (via `TTS_CACHE_DIR`).
- Falls Disk deaktiviert ist, wird `TTS_CACHE_DIR` automatisch auf `/tmp/tts-cache` gesetzt (Terraform-Fallback).

## Cache-Architektur
- L1: In-Memory Caches (bestehend, pro Prozess).
- L2: Persistente Disk-Caches.
- Zwei Cache-Typen:
  - `sentence cache` fuer `/api/tts/example` (String-Ergebnis des Textmodells).
  - `audio cache` fuer MP3-Ausgaben.

## Cache-Key Design
- Audio-Key Input:
  - `type` (`vocabulary_audio` oder `example_audio`)
  - `language`
  - `normalized_text`
  - `voice`
  - `tts_model`
  - `tts_instructions_version`
- Sentence-Key Input:
  - `type` (`example_sentence`)
  - `language`
  - `normalized_vocabulary`
  - `text_model`
  - `sentence_prompt_version`
- Key-Bildung:
  - Serialisiertes Objekt -> SHA-256.
  - Audio-Datei: `<audio_sha>.mp3`.
- Versionierung:
  - Bei Prompt/Model/Voice-Aenderungen Version hochziehen, damit alte Eintraege sauber invalidiert werden.

## Dateilayout (ohne SQLite)
- `/var/data/tts-cache/audio/<audio_sha>.mp3`
- `/var/data/tts-cache/meta/index.json`

Vorgeschlagenes `index.json`-Schema:

```json
{
  "audio": {
    "<audio_sha>": {
      "fileName": "<audio_sha>.mp3",
      "createdAt": "2026-02-28T12:00:00.000Z",
      "lastAccessAt": "2026-02-28T12:34:00.000Z",
      "expiresAt": "2026-03-30T12:00:00.000Z",
      "sizeBytes": 12345,
      "language": "de",
      "kind": "vocabulary_audio"
    }
  },
  "sentences": {
    "<sentence_sha>": {
      "sentence": "Ich benutze heute das Wort Hund.",
      "createdAt": "2026-02-28T12:00:00.000Z",
      "lastAccessAt": "2026-02-28T12:34:00.000Z",
      "expiresAt": "2026-03-07T12:00:00.000Z",
      "language": "de"
    }
  }
}
```

## Ablauf pro Endpoint

### 1) `POST /api/tts` (Vorlesen)
1. Text normalisieren.
2. Audio-Key berechnen.
3. L1 pruefen -> dann L2 (`index.json` + MP3-Datei).
4. Bei Miss: OpenAI TTS aufrufen, MP3 atomar schreiben (`.tmp` -> `rename`), Meta aktualisieren.
5. Antwort senden.

### 2) `POST /api/tts/example` (Beispielsatz)
1. Vokabel normalisieren.
2. Sentence-Key berechnen.
3. Sentence aus L1/L2 lesen.
4. Bei Sentence-Miss: Textmodell aufrufen, Sentence persistent in `index.json` speichern.
5. Danach Audio-Key fuer finalen Sentence berechnen und Audio-Flow wie oben ausfuehren.
6. Antwort als MP3 senden.

## TTL-Strategie (ohne LRU)
- Kein LRU geplant.
- TTL reicht fuer euren Use Case.
- Vorschlag:
  - `vocabulary_audio`: 30 Tage
  - `example_sentence`: 7 Tage
  - `example_audio`: 7 Tage
- Cleanup:
  - beim Start
  - periodisch (z. B. alle 6h)
  - entfernt nur abgelaufene Eintraege
- Sicherheitsgrenze:
  - falls belegter Cache-Speicher > 950MB: keine neuen Cache-Writes, Requests laufen normal weiter (nur ohne Cache-Write), Fehler wird geloggt.

## Concurrency / Dedupe
- In-Flight-Map pro Key:
  - gleiche parallele Anfrage -> genau ein Upstream-Call
  - weitere warten auf dasselbe Promise
- Spart Token bei Burst-Requests.
- Meta-Write-Schutz:
  - `index.json` Updates ueber eine process-lokale Write-Queue/Mutex serialisieren.
  - Verhindert Lost-Updates bei parallelen Writes.

## Fehlerfall-Verhalten
- `index.json` fehlt/korrupt:
  - als Cache-Miss behandeln
  - OpenAI neu anfragen
  - MP3 + `index.json` neu/atomar schreiben
- Cache-Datei fehlt obwohl Meta da:
  - Meta-Eintrag verwerfen, als Miss behandeln
- Disk voll/nicht schreibbar:
  - Request normal beantworten
  - nur Cache-Write ueberspringen und loggen

## Render-Betriebsgrenzen
- Persistent Disk ist an eine Service-Instanz gebunden.
- Bei zukuenftiger horizontaler Skalierung braucht ihr eine andere Shared-Cache-Strategie (z. B. Object Storage/Redis).
- Deploys mit Disk haben betrieblich andere Eigenschaften als stateless Deploys (kurze Unterbrechung einplanen).

## Monitoring
- `tts_cache_l1_hit`
- `tts_cache_l2_hit`
- `tts_cache_miss`
- `tts_sentence_l2_hit`
- `tts_sentence_miss`
- `tts_cache_write_ok`
- `tts_cache_write_fail`
- `tts_openai_tts_requests`
- `tts_openai_text_requests`

## Terraform-Setup (Infra as Code)
- Disk-Konfiguration in `infra/render/main.tf`.
- Relevante Variablen:
  - `persistent_disk_enabled` (default `true`)
  - `persistent_disk_name` (default `tts-cache-disk`)
  - `persistent_disk_mount_path` (default `/var/data`)
  - `persistent_disk_size_gb` (default `1`)
  - `tts_cache_dir` (default `/var/data/tts-cache`)
  - `openai_text_model` (default `gpt-4o-mini`)
- Service-Env aus Terraform:
  - `OPENAI_API_KEY`
  - `OPENAI_TTS_MODEL`
  - `OPENAI_STT_MODEL`
  - `OPENAI_TEXT_MODEL`
  - `TTS_CACHE_DIR`

Beispiel `terraform.tfvars`:

```hcl
persistent_disk_enabled    = true
persistent_disk_name       = "tts-cache-disk"
persistent_disk_mount_path = "/var/data"
persistent_disk_size_gb    = 1
tts_cache_dir              = "/var/data/tts-cache"
openai_text_model          = "gpt-4o-mini"
```

## Umsetzungsplan (Code)
1. `server/cache/ttsDiskCache.js`
   - Laden/Speichern von `index.json`, atomare Writes, TTL-Cleanup.
2. `server/openai/synthesizeVocabulary.js`
   - Audio-L2-Read/Write + In-Flight-Dedupe.
3. `server/openai/generateExampleSentence.js`
   - Sentence-L2-Read/Write (persistent) zusaetzlich zum L1.
4. `server/routes/tts.js`
   - optional `X-Cache: HIT|MISS` Header fuer Debug.
5. Tests
   - Audio hit/miss, sentence hit/miss, meta fehlt/korrupt, parallele Requests.
