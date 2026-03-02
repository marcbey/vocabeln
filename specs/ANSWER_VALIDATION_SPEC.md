# ANSWER_VALIDATION_SPEC

## 1. Purpose
This document is the authoritative domain spec for answer normalization, validation, progress keying, and completion logic.
It enables exact behavior-compatible reimplementation of quiz correctness.

## 2. Scope
Covered:
- regular answer validation
- irregular verb validation
- normalization rules
- answer key generation
- completion counting semantics
- spoken answer submit semantics

Not covered:
- UI styling
- deployment

## 3. Canonical Direction Model
Regular directions:
- `en-de`
- `de-en`

Special directions:
- `mixed` (randomly chooses one regular direction per question)
- `irregular` (separate irregular verb mode)

## 4. Progress Keying (Authoritative)
## 4.1 Base key for an item
- regular word key source: `word.en|word.de`
- irregular verb key source: `word.infinitive|word.german`

## 4.2 Answered key
Format:
- `<baseKey>|<direction>`

Examples:
- `cat|Katze|en-de`
- `be|sein|irregular`

Requirement:
- This key is the single source for progress counting and completion checks.

## 5. String Normalization Rules
## 5.1 Generic normalization (`normalize`)
Apply in order:
1. normalize apostrophe variants (`’´` etc.) to `'`
2. lowercase
3. remove ellipsis character and three-dot ellipsis
4. replace punctuation `, . ; : ! ?` with spaces
5. collapse multiple spaces
6. trim

## 5.2 Irregular part normalization (`normalizeIrregularPart`)
Apply in order:
1. normalize apostrophes
2. lowercase
3. remove ellipsis variants
4. replace punctuation `.,;:!?` with spaces
5. remove parentheses
6. replace `/` with spaces
7. collapse spaces
8. trim

## 6. Regular Answer Validation
## 6.1 Expected answer source
- In `en-de`: expected text is `currentWord.de`
- In `de-en`: expected text is `currentWord.en`

## 6.2 Expected alternatives parsing
Split expected string by:
- `;`
- `/`
- `(`
- `)`

Each non-empty part is an allowed semantic variant.

## 6.3 User variant expansion
Generate user variants from raw input:
1. normalized variant
2. normalized variant with apostrophes removed
3. contraction-expanded variant
4. contraction-expanded variant with apostrophes removed

## 6.4 Contraction expansion rules (English)
At minimum these transforms are required:
- `won't -> will not`
- `can't -> cannot`
- `shan't -> shall not`
- `let's -> let us`
- `I'm -> I am`
- `you're/we're/they're -> ... are`
- `'ll -> will`
- `'ve -> have`
- `'d -> would`
- copula `'s` on pronoun-like subjects -> `is`
- `n't -> not`

Correctness rule:
- answer is correct if any expected variant equals any user variant.

## 7. Irregular Verb Validation
## 7.1 Input split rules
Split user raw input into exactly 3 answer parts using this priority:
1. split by separators `[;,|]`
2. if fewer than 3 parts, split by 2+ spaces
3. if still fewer than 3, split by single spaces
4. take first 3 tokens only

If fewer than 3 parts after parsing: invalid.

## 7.2 Expected fields
Expected triplet order:
1. `infinitive`
2. `simplePast`
3. `pastParticiple`

## 7.3 Alternatives in expected forms
Each expected part may include slash alternatives (e.g. `was/were`).
For each position, user part is valid if it matches any normalized alternative.

Correctness rule:
- all 3 positions must match.

## 8. Counting Semantics
## 8.1 Asked count
- increment on every evaluation attempt:
  - typed submit
  - spoken submit
  - board mode result
  - show solution

## 8.2 Correct count
Regular modes:
- count answered keys for `en-de` + `de-en`

Irregular mode:
- count answered keys for `irregular`

## 9. Completion Semantics
## 9.1 Regular page complete
Page complete when:
- count(`en-de`) + count(`de-en`) >= 2 * regularWordsOnPage

## 9.2 Irregular complete
Irregular page complete when:
- count(`irregular`) >= irregularData.length

## 9.3 Mixed mode
- Questions randomly draw from unanswered keys in both regular directions.
- Completion still uses combined count rule of both regular directions.

## 10. Auto Direction Switching Rule
For non-mixed, non-irregular regular mode:
- if current direction has no unanswered candidate
- and opposite direction still has unanswered words
- auto-switch to opposite regular direction

## 11. Spoken Answer Semantics
## 11.1 STT handoff
Backend returns:
- `transcript`
- `answer` (trimmed transcript)

Frontend uses `answer` for validation.

## 11.2 Non-board spoken submit behavior
- If spoken answer is wrong:
  - submit immediately using standard raw submit path
  - preserve input text
- If spoken answer is correct:
  - place spoken text in input
  - clear status icon
  - wait 2000ms
  - auto-submit through same correctness pipeline

## 11.3 Guards
Spoken submit is ignored when:
- no current word
- board mode active
- showing solution
- empty spoken payload

## 12. Data Contracts Required by Validator
Regular word contract:
- `{ en: string, de: string }`

Irregular word contract:
- `{ infinitive: string, simplePast: string, pastParticiple: string, german: string }`

All strings are non-empty after trim.

## 13. Edge Cases and Fallbacks
- Apostrophe and punctuation variants must not cause false negatives.
- Parenthetical hints in expected regular answers are treated as optional alternatives.
- Irregular input with commas or semicolons is valid if 3 parts can be extracted.
- Empty or whitespace-only answer is always invalid.

## 14. Required Test Matrix
Minimum tests:
1. regular correct answer basic match
2. regular alternative match via `;` and `/`
3. contraction normalization match
4. punctuation and apostrophe variant handling
5. irregular 3-part exact match
6. irregular slash alternative match
7. irregular invalid when <3 parts
8. mixed mode counting and completion
9. regular page completion thresholds
10. spoken correct preview + delayed submit
11. spoken wrong immediate submit

## 15. Definition of Done
Validation implementation is complete only if:
1. all matrix tests pass
2. regular, irregular, and spoken answers produce behavior identical to this spec
3. completion counters and transitions match this document exactly

## 16. Relation to Other Specs
- UI flows: `UI_UX_SPEC.md`
- architecture and endpoints: `ARCHITECTURE_&_TECH_STACK_SPEC.md`
- caching internals: `CACHE_SPEC.md`
