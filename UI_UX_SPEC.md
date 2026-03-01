# UI_UX_SPEC

## 1. Purpose
This is the authoritative UI/UX specification for the `vocabeln` app.
It defines interaction behavior, component contracts, visual system, and copy so an LLM can implement without follow-up questions.

This spec supersedes UI/behavior content in `FEATURE.md` and `PROTOTYPE_SPEC.md`.

## 2. Product UX Goals
- Fast classroom-friendly quiz loop.
- Low-friction keyboard and touch operation.
- Equivalent behavior for typed and spoken answers.
- Clear feedback for correct/wrong outcomes.
- Stable progress visibility and persistence per class.

## 3. Screen Structure
Single-page app with two primary regions:
1. Header card
2. Question card

Global elements:
- Speech error message area below main card
- Fireworks overlay for completion reward

Max content width: 1100px.

## 4. Header Specification
## 4.1 Content
- Title from selected class headline (e.g. "Vokabeln fuer die Klasse 5").
- Motivational subtitle: `Jede Runde macht dich besser und fit fuer die naechste Englischarbeit.`

## 4.2 Desktop Controls (`md` and up)
- Filter select (`aria-label="Filter"`) with options:
  - `Seite`
  - `Unit`
- Page select (`aria-label="Seite"`)
- Unit select (`aria-label="Unit"`)
- Direction select (`aria-label="Richtung"`)
- Buttons:
  - `Tafel-Modus` toggle
  - `Neu anfangen`

Behavior:
- If direction is `irregular`, filter/page/unit selects are disabled and visually dimmed.
- If filter is `Seite`, page select is enabled and unit select is disabled + dimmed.
- If filter is `Unit`, unit select is enabled and page select is disabled + dimmed.
- `Seite` and `Unit` selects use the same control height as other header controls.
- On desktop, all header selects use compact content-fit widths (not stretched full-width).
- Completed pages show suffix ` ✅` in page select option text.
- Completed units show suffix ` ✅` in unit select option text.

## 4.3 Mobile Controls (`< md`)
- Header shows hamburger button (`aria-label` changes open/close).
- Clicking opens right-side overlay panel with backdrop.
- Panel sections:
  - Filter
  - Seite
  - Unit
  - Richtung
  - Optionen
  - Klasse wechseln
- Panel includes `Schliessen` button.
- Escape key closes panel.
- Backdrop click closes panel.
- Any action inside panel executes and then closes panel.
- The same filter disable rules as desktop apply in the panel.

## 5. Question Card Specification
## 5.1 Top Prompt Area
Contains:
- Word label: `Wort (Deutsch|Englisch)`
- Large question word text
- Two audio buttons:
  - `Vorlesen: Aus` / `Vorlesen: An` (toggle)
  - `Beispielsatz`
- Translation row:
  - label `Uebersetzung`
  - hidden text placeholder: `Wird nach dem Check eingeblendet`

Translation visibility:
- visible if `showingSolution` OR `boardMode`
- hidden otherwise

Read-aloud toggle behavior:
- Toggle state is persisted in `localStorage` key `speech:autoReadEnabled` (`1`/`0`).
- If key is missing or unreadable, default is `Aus`.
- If toggle is `An`, app auto-plays:
  - current question text when a new question is active
  - translation when `Loesung zeigen` reveals the solution

## 5.2 Answer Area (non-board mode)
Row content:
- Answer input
- Speech input button (push-to-talk)
- Desktop actions (`Check!`, `Loesung zeigen` / `Weiter`)

Input placeholders:
- regular mode: `Deine Antwort...`
- irregular mode: `Infinitive, Simple Past, Past Participle`

Input Enter key:
- triggers submit

Status icon in input:
- `✓` for correct
- `✗` for wrong
- auto-clears by timeout

## 5.3 Board Mode Area
If board mode active and page not complete:
- replace answer row with two buttons:
  - `✓ Richtig`
  - `✗ Falsch`

## 5.4 Completion Area
If page complete:
- show retry button: `Diese Seite nochmal ueben`
- hide input and board controls

## 5.5 Progress Badge
Text format (exact):
- label: `Fortschritt`
- value: `<correct> richtig · <asked> Versuche · <total> Fragen`

Placement:
- desktop: right-aligned inside card
- mobile: full-width footer section

## 6. Button and State Rules
## 6.1 `Check!`
Disabled when:
- board mode active
- solution is shown
- no current word

## 6.2 `Loesung zeigen` / `Weiter`
- label is `Loesung zeigen` when solution hidden
- label is `Weiter` when solution visible
- disabled in board mode or without current word

## 6.3 Speech Input Button (`Mikrofon`)
Default label: `Mikrofon`
Dynamic labels:
- while recording: `Aufnahme...`
- while submitting: `Pruefe...`

Disabled when:
- answer submit is disabled
- solution is visible
- currently submitting speech

## 6.4 Audio Playback Buttons
`Vorlesen` control:
- is a persistent on/off toggle (`Vorlesen: Aus` / `Vorlesen: An`)
- remains clickable even when no current word is active

`Beispielsatz` button:
- disabled when:
  - no current word
  - playback request loading
- dynamic labels:
  - `Beispielsatz`
  - `Lade Satz...`
  - `Spielt Satz...`

## 7. Interaction Flows
## 7.1 Typed Answer Flow
1. User enters answer.
2. User clicks `Check!` or presses Enter.
3. App validates via shared correctness logic.
4. App increments `asked`.
5. If correct:
   - mark answered key as correct
   - set status `correct`
   - clear input
   - persist progress
   - if page complete: trigger fireworks once and keep completion state
   - else move to next question
6. If wrong:
   - set status `wrong`
   - keep input value
   - persist progress

## 7.2 Spoken Answer Flow (push-to-talk)
1. User holds microphone button (`pointerdown` or keyboard Space/Enter).
2. Recording starts.
3. User releases (`pointerup`, `pointercancel`, `pointerleave` without button press) and recording stops.
4. If recording < 300ms: show hint `Aufnahme zu kurz.` and abort upload.
5. Upload to `/api/stt/check`.
6. If `answer` returned:
   - if spoken answer is wrong: submit immediately like typed answer (input preserved)
   - if spoken answer is correct: show text in input for 2000ms preview, then auto-submit and clear

## 7.3 Show Solution Flow
1. Click `Loesung zeigen`:
   - increment `asked`
   - set `showingSolution = true`
   - if read-aloud toggle is `An`: read translation
   - persist progress
2. Click `Weiter`:
   - hide solution
   - pick next word

## 7.4 Board Mode Flow
1. Toggle `Tafel-Modus`.
2. Input area replaced by manual correct/wrong buttons.
3. On manual result:
   - increment `asked`
   - if correct: mark answered + persist + completion handling
   - if wrong: persist and move to next word after short delay

## 7.5 Direction Flow
- Direction options: `en-de`, `de-en`, `mixed`, `irregular`.
- Entering irregular mode:
  - current regular page stored as `lastRegularPage`
  - page set to `Irregulaere Verben`
- Leaving irregular mode:
  - restore `lastRegularPage` if valid, else first regular page

## 7.6 Filter Flow (Page vs Unit)
- Filter options are `Seite` and `Unit`.
- `Seite` mode activates the selected page scope.
- `Unit` mode activates the selected unit scope.
- If `Unit` mode is selected and no unit was selected before, first available unit is used.
- If `Seite` mode is selected and no page was selected before, first regular page is used.
- Unit scope vocabulary is built from all pages mapped to that unit, with duplicate `en/de` pairs removed.
- Active scope is persisted and restored, so reload restores page-mode or unit-mode automatically.

## 7.7 Reset Flow
Button `Neu anfangen`:
- show browser confirm: `Fortschritt wirklich loeschen?`
- if confirmed:
  - clear class-scoped localStorage progress/settings
  - reset state to initial page + `en-de`

## 7.8 Retry Flow
Button `Diese Seite nochmal ueben`:
- remove current page from completed pages
- clear answered state and asked count for current page
- persist empty progress for that page
- start page again

## 8. Error Messaging UX
Inline speech errors are rendered below main card in small warning text color.
Possible messages include:
- playback not available
- playback failed
- microphone blocked
- speech input unavailable
- recording too short
- no speech recognized
- STT unavailable

Messages from speech hooks auto-expire (~2200ms) unless replaced.

## 9. Visual Design System
## 9.1 Fonts
- Primary display stack:
  - `Fredoka`
  - `Nunito`
  - `Trebuchet MS`
  - `sans-serif`

## 9.2 Core Colors
Use Tailwind theme extensions + CSS:
- `bg #f4f8ff`
- `panel #ffffff`
- `accent #0d47b7`
- `accent2 #8f3f00`
- `good #0a6a45`
- `warn #6f3400`
- `text #101d36`
- `muted #243a5f`

## 9.3 Surfaces and Shapes
- Cards: white panel, 2px border `#3f567e`, radius `22px`, deep shadow
- Inputs/controls: rounded, bordered, min height 48px
- Primary buttons: blue gradient
- Secondary/toggle buttons: light gradient with text color
- Active toggle: orange gradient

## 9.4 Motion
- Feedback flash pulse: ~1100ms
- Solution reveal flash: ~850ms
- Fireworks spark animation: ~1500ms
- Respect `prefers-reduced-motion: reduce` by minimizing all animations/transitions

## 10. Responsive Behavior
Breakpoints:
- Mobile: `< 768px`
- Desktop: `>= 768px`

Rules:
- Header desktop controls hidden on mobile, mobile menu used instead.
- Question action buttons move to mobile footer on small screens.
- Main interactions on mobile auto-scroll main card to top (for keyboard visibility and focus flow).

## 11. Accessibility Requirements
- Every select has `aria-label` (`Filter`, `Seite`, `Unit`, `Richtung`, `Klasse`).
- Mobile menu button has dynamic `aria-label` + `aria-expanded`.
- Speech input has `aria-label="Spracheingabe starten"`.
- Keyboard operation required for check, solution, menu, and speech input.
- Focus visible styles required on buttons/inputs/selects.

## 11.1 Desktop Keyboard Shortcuts (`>= 768px`)
- Platform mapping:
  - macOS: use `Ctrl+<letter>` (`⌃` key)
  - Windows/Linux: use `Alt+<letter>`
- `v` combo -> toggle `Vorlesen` on/off
- `b` combo -> trigger `Beispielsatz`
- `m` combo -> push-to-talk microphone:
  - `keydown` with platform combo starts recording
  - `keyup m` stops recording
- `c` combo -> trigger `Check!`
- `l` combo -> trigger `Loesung zeigen` (only when solution is hidden)
- `w` combo -> trigger `Weiter` (only when solution is visible)

Visual hint requirement:
- Buttons with keyboard shortcuts must show a visible desktop key hint chip next to the label:
  - macOS examples: `⌃V`, `⌃B`, `⌃M`, `⌃C`, `⌃L`, `⌃W`
  - Windows/Linux examples: `Alt+V`, `Alt+B`, `Alt+M`, `Alt+C`, `Alt+L`, `Alt+W`
- Key hint chips are visual-only (`aria-hidden`) so accessible button names remain the exact copy labels.

Guard rails:
- Shortcuts are desktop-only and must not run on mobile.
- Ignore shortcut handling when `Cmd` is pressed.
- Platform shortcut combos are allowed while focus is inside editable text controls (`input`, `textarea`, `select`, contenteditable`) so they work even while typing.

## 12. Copy Catalog (Exact Labels)
- Header buttons: `Tafel-Modus`, `Neu anfangen`, `Schliessen`
- Action buttons: `Check!`, `Loesung zeigen`, `Weiter`
- Board buttons: `✓ Richtig`, `✗ Falsch`
- Retry: `Diese Seite nochmal ueben`
- Speech button: `Mikrofon`, `Aufnahme...`, `Pruefe...`
- Audio buttons:
  - `Vorlesen: Aus`, `Vorlesen: An`
  - `Beispielsatz`, `Lade Satz...`, `Spielt Satz...`
- Completion text: `Mega! Alles richtig auf dieser Seite.`

## 13. Acceptance Criteria
- Typed and spoken correctness use identical domain comparison behavior.
- Irregular mode expects three forms and validates alternatives.
- In irregular mode, filter/page/unit selects are disabled.
- Page and unit filters are mutually exclusive (one active, one disabled).
- Completion reward appears only when page first becomes complete.
- Mobile menu, mobile footer actions, and auto-scroll behavior work.
- Speech errors are visible but non-blocking.
- Progress badge reflects real-time counts correctly in all modes.
- `Vorlesen` toggle state persists via `speech:autoReadEnabled` and restores after reload.
- With `Vorlesen: An`, question text and solution-reveal translation are auto-read according to sections 5.1 and 7.

## 14. Deprecation Note
After this spec is adopted, UI/UX implementation must not depend on `FEATURE.md` or `PROTOTYPE_SPEC.md`.
Those files can be removed.
