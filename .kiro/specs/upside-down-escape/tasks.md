# Implementation Plan

## Overview

This plan implements the Upside_Down_Escape described in `requirements.md` and `design.md` as a static HTML, CSS, JavaScript, and GSAP experience. It integrates with Nocturne Night’s existing signup page through the documented sessionStorage record and a configurable destination. The visitor explores an original supernatural mirror-world, discovers four clues, fulfills three demands, and reaches the gate before the exact 420-second timer expires. Timeout triggers a safe, skippable GSAP jumpscare and the “You failed” state.

Implementation proceeds from verifiable game rules to presentation:

1. Confirm project stack, paths, configuration, content, and Kiro guidance.
2. Implement pure state, timer, clue, demand, and privacy logic.
3. Build semantic static HTML and responsive visual styling.
4. Add shared GSAP timelines, transitions, ambient effects, and terminal sequences.
5. Wire keyboard/touch puzzle interactions, progress, timer, retry, and return.
6. Verify accessibility, timing, performance, and traceability.

## Tasks

- [ ] 1. Establish the escape page structure and configuration
  - [ ] 1.1 Create `src/escape.html` and `src/escape.css` with a semantic page shell, loading view, live status region, persistent timer/tracker header, scene, object list, clue panel, and terminal overlays
    - Keep all content understandable if animation is unavailable
    - _Requirements: 1.1, 2.4, 4.1, 10.1_
  - [ ] 1.2 Create `src/js/escape/` modules for `main.js`, `config.js`, `content.js`, `storage.js`, `logic/`, `ui/`, and `anim/`
    - Use ES modules and the local GSAP source already declared by the project; do not add another runtime dependency
    - _Requirements: 1.1, 1.4, 1.5_
  - [ ] 1.3 Define the single escape configuration
    - Set `initialSeconds` to exactly 420, clue count to 4, demand count to 3, desktop/mobile ambient limits to 12/6, and return destination to the normal page
    - Use `nocturne-night:signup` for the signup sessionStorage key; keep the destination and timer out of event-handler literals
    - _Requirements: 3.2, 6.1, 11.2, 12.1_
  - [ ] 1.4 Add original Demon messages, clue text, demand hints, and object responses to `content.js`
    - Ensure clues reveal the exact answers 88.3 MHz, breaker order 2-1-3, and gate word RETURN
    - _Requirements: 2.2, 2.3, 5.1, 5.3_

- [ ] 2. Implement pure escape state and timer logic
  - [ ] 2.1 Implement `logic/state.js`
    - Define the states `loading`, `transitioning_in`, `playing`, `failure_scaring`, `failure`, `success`, `transitioning_out`, and `returned`
    - Ignore illegal and duplicate terminal events; allow retry only from failure
    - _Requirements: 3.1, 3.4, 3.7, 7.5, 8.1_
  - [ ]* 2.2 Write property tests for legal and illegal state transitions
    - **Property 1: State transitions are legal and terminal sequences run at most once**
    - Generate state/event pairs and compare the reducer with its transition table
    - **Validates: Requirements 3.7, 14.2**
  - [ ] 2.3 Implement `logic/timer.js` as a pure timer model driven by elapsed monotonic time
    - Start at 420 seconds, clamp at zero, pause/freeze outside `playing`, and expose a deterministic `formatTime` helper
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 6.7_
  - [ ]* 2.4 Write property tests for timer bounds, monotonicity, and expiry
    - **Property 2: Timer is bounded and monotonic**
    - Cover delayed updates, repeated expiry, and exact zero
    - **Validates: Requirements 6.1, 6.5, 6.7, 14.1**
  - [ ] 2.5 Implement `logic/puzzles.js`
    - Track the four clue IDs as a set, validate radio `88.3`, breaker order `[2, 1, 3]`, and case-insensitive gate word `RETURN`
    - Expose pure `discoverClue`, `submitDemand`, `getProgress`, and `isGateUnlocked` functions
    - _Requirements: 5.1–5.7_
  - [ ]* 2.6 Write property tests for clue idempotency, exact demand answers, and gate eligibility
    - **Property 3: Clues count once**
    - **Property 4: Demands require their clues and exact answers**
    - **Property 5: Gate eligibility is exact**
    - **Validates: Requirements 5.2–5.7, 14.3, 14.4**
  - [ ]* 2.7 Write the timeout/gate boundary property test
    - **Property 6: Timeout and success are mutually exclusive**
    - Confirm a gate cannot enter success at zero seconds and only one terminal path is entered
    - **Validates: Requirements 6.5, 14.5**

- [ ] 3. Implement signup handoff and local data handling
  - [ ] 3.1 Implement `storage.js` to read the shared signup record with `try/catch`
    - Return a safe generic greeting when storage is blocked, missing, malformed, or lacks valid strings
    - Never place personal details in the URL or send them over the network
    - _Requirements: 3.2, 3.3, 12.1–12.3_
  - [ ] 3.2 Wire the normal-to-escape handoff and fresh-load behavior
    - Enter `loading`, run the forward transition, then start a new attempt at `playing` with 420 seconds
    - Reload resets clues and demands; do not persist game state
    - _Requirements: 3.1, 3.4_

- [ ] 4. Build the semantic scene and object panels
  - Create the forest-edge relay-station scene with five named objects: shortwave radio, breaker panel, notice board, cassette player, and gate
  - Add a keyboard and touch accessible object list in addition to any scene hotspots
  - Make each object open a labeled panel with a close control and focus restoration
  - Add four discoverable clue responses and at least one flavor-only response
  - _Requirements: 2.1–2.5, 4.1–4.5, 10.1_

- [ ] 5. Style the supernatural mirror-world
  - [ ] 5.1 Define tokens and base styles in `escape.css`
    - Use a cold blue-gray base, restrained signal-orange and ice accents, readable typography, focus states, and contrast-safe surfaces
    - _Requirements: 2.1, 9.4, 10.1, 10.2_
  - [ ] 5.2 Style the room, object controls, puzzle panels, clue tracker, terminal states, and abstract Demon silhouette
    - Use original CSS/inline-SVG visuals; do not use show logos, characters, footage, or copied dialogue
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 7.1_
  - [ ] 5.3 Add responsive layouts from 320 px to 1920 px
    - Reflow hotspots into a visible object list on narrow screens; keep all controls at least 44 px and essential text at least 16 px
    - _Requirements: 9.1–9.5_

- [ ] 6. Implement clue and demand interactions
  - [ ] 6.1 Reveal and track the four clues
    - Ensure repeated activation reopens the clue without incrementing its count
    - Update the tracker and announce each new clue
    - _Requirements: 5.1, 5.2, 10.5_
  - [ ] 6.2 Implement the shortwave demand
    - Keep the frequency control unavailable until `radio-log` is found; accept exactly 88.3 MHz and provide retry feedback for other values
    - _Requirements: 5.3–5.5_
  - [ ] 6.3 Implement the breaker sequence demand
    - Enable the labeled breaker buttons after `breaker-note`; accept 2 → 1 → 3 and reset the current sequence on a wrong selection without losing clues
    - _Requirements: 5.3–5.5_
  - [ ] 6.4 Implement the gate word demand and exact gate lock rule
    - Enable the keypad after `cassette-sleeve`; accept RETURN case-insensitively; unlock only after four clues and all three demands are complete
    - Explain unmet conditions when the gate is activated early
    - _Requirements: 5.3–5.7_

- [ ] 7. Implement the seven-minute timer and warning states
  - Start timer on transition to `playing`, derive remaining time from monotonic elapsed duration, and render `MM:SS`
  - Announce the one-minute warning once, intensify the final ten seconds without flashing, and dispatch timeout exactly once at zero
  - Stop and freeze the timer on success or failure
  - _Requirements: 6.1–6.7, 10.5, 10.8_

- [ ] 8. Implement shared GSAP timeline factories
  - [ ] 8.1 Create `anim/timelines.js` as the only escape module that constructs GSAP timelines
    - Centralize durations and easing for entry/return transition, panel reveal, demand feedback, jumpscare, and success
    - Respect `prefers-reduced-motion` caps and immediate no-GSAP fallbacks
    - _Requirements: 3.1, 7.1–7.3, 8.2–8.4, 10.3, 11.4, 11.5_
  - [ ] 8.2 Add entrance, ambient, and scene panel animation
    - Limit ambient elements to 12 desktop/6 mobile; pause them when hidden or off-screen
    - _Requirements: 2.5, 11.2, 11.3_
  - [ ]* 8.3 Add timeline duration unit tests
    - Verify normal and reduced-motion durations, plus skip cancellation behavior
    - _Requirements: 10.3, 10.7, 11.5_

- [ ] 9. Implement failure jumpscare and recovery
  - On `TIMER_EXPIRED`, stop the timer and transition to `failure_scaring` exactly once
  - Animate the original abstract silhouette with restrained transform/opacity distortion; do not autoplay audio or use rapid/full-screen red flashes
  - Provide a visible skip control; on completion or skip, show “You failed,” the in-world message, and both recovery actions together
  - Retry resets the state, clues, demands, and timer to a new attempt; return navigates to the normal page
  - _Requirements: 7.1–7.7, 10.6, 10.7_

- [ ] 10. Implement gate success and reverse handoff
  - When the unlocked gate is activated above zero seconds, freeze the timer and enter `success`
  - Show a minimum three-second success moment, then play the reverse transition and return to `index.html`
  - Keep a working manual return link if navigation fails
  - _Requirements: 3.5, 8.1–8.5, 12.4_

- [ ] 11. Implement accessibility and input support
  - [ ] 11.1 Add labels, semantic landmarks, focus behavior, live announcements, persistent return, and keyboard/touch activation for all puzzle controls
    - _Requirements: 4.3, 4.4, 9.3, 10.1, 10.5, 10.6, 10.8_
  - [ ] 11.2 Add reduced-motion handling and skip controls
    - Disable ambient motion and parallax; replace the scare with the static failure art; cancel active timelines on skip
    - _Requirements: 7.3, 10.3, 10.4, 10.7_
  - [ ] 11.3 Check color contrast and non-color status cues
    - Ensure timer warning, clue completion, demand completion, failure, and success remain clear without color alone
    - _Requirements: 9.4, 10.2, 10.5_

- [ ] 12. Add resilience and performance controls
  - Fall back to functional immediate state changes when GSAP is absent
  - Pause ambient loops when off-screen or hidden, catch up timer on visibility return, and adapt decorative count for mobile
  - Keep core CSS/JS and the first playable controls available without waiting on decorative assets
  - _Requirements: 11.1–11.6_

- [ ] 13. Add Kiro tooling and steering updates
  - [ ] 13.1 Update design-language and code-conventions steering for the original supernatural escape visual language and new module locations
  - [ ] 13.2 Ensure source-save hooks lint HTML, CSS, and JavaScript and session-start checks the declared GSAP source and development tools
  - [ ] 13.3 Keep every implementation task traceable to a requirement and update this plan as work completes
  - _Requirements: 13.1–13.4_

- [ ] 14. Checkpoint - Verify pure logic
  - Run the project test command and confirm all property suites pass with at least 100 generated cases each
  - Confirm exact puzzle answers, 420-second duration, retry reset, and zero-boundary terminal behavior
  - _Requirements: 14.1–14.6_

- [ ] 15. Checkpoint - Verify the complete experience
  - Run the project linters and validate the three spec documents
  - Complete a browser walkthrough: normal signup handoff, four clues, three demands, gate success, timeout jumpscare, skip, retry, return, and missing-GSAP fallback
  - Check 320 px/1920 px layouts, keyboard-only use, reduced motion, focus restoration, screen-reader announcements, and contrast
  - _Requirements: 9.1–9.5, 10.1–10.8, 11.1, 13.4_

## Notes

- Tasks marked with `*` are optional property/unit tests during incremental implementation; the final checkpoint requires the complete test suite.
- The page remains static. Use the same GSAP source and signup storage key as the haunted landing page; do not add React, Next.js, Tailwind, a 3D library, or a service API.
- The 420-second timer is fixed for this version. Do not pause it when an object panel is open or when the browser tab is hidden; recompute elapsed time on return.
- The Demon’s original copy may be ominous, but every required puzzle answer must be discoverable from its clue text.
- The jumpscare is visual and optional sound is excluded from the first version. Never autoplay audio.
- The project is inspired by an 1980s supernatural alternate-dimension mood. All character, puzzle, image, and message content remains original.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "3.1", "4", "5.1", "8.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6", "2.7", "3.2", "5.2", "5.3", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "7", "8.2", "11.1"] },
    { "id": 4, "tasks": ["8.3", "9", "10", "11.2", "11.3", "12"] },
    { "id": 5, "tasks": ["13", "14"] },
    { "id": 6, "tasks": ["15"] }
  ]
}
```

