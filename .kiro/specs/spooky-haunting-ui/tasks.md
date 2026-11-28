# Implementation Plan

## Overview

This plan tracks the Haunted_Page described in `requirements.md` and `design.md`: the single scrolling Nocturne Night invitation in `www/index.html`, built with HTML, CSS, JavaScript ES modules, GSAP, and Lenis. Three valid signup attempts escalate from shakes and messages to a glitch and a black handoff that starts the other side on the same page.

The work is sequenced from the bottom up:

1. Project scaffolding, Kiro steering, and the review hook.
2. Pure-function logic (Haunting_Level, validation, sequence state machine, storage), with property-based tests planned.
3. Static structure and styling (HTML and the CSS design system).
4. Shared GSAP timelines for the calm reveals, escalating shakes, final glitch, and black handoff.
5. Signup orchestration, the secret note, accessibility, and performance work.
6. Native packaging, hosting, and final integration.

## Tasks

- [x] 1. Set up project structure and libraries
  - Keep the web app in `www/` with `index.html`, `script.js`, `style.css`, `js/`, `js/logic/`, `js/anim/`, and `vendor/`, plus `tests/` at the repository root
  - Use the local GSAP 3.15 file `www/gsap.min.js` (no plugins) and Lenis 1.3.27 from a pinned unpkg URL; record both in `README.md`
  - Keep `package.json` free of web runtime dependencies other than Capacitor; the page has no build step
  - Keep the storage key, attempt count, ambient limits, and timings in `js/config.js`, and all themed copy in `js/content.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 7.2, 8.3_

- [x] 2. Set up Kiro steering, hooks, and tooling
  - [x] 2.1 Write the steering guides
    - `.kiro/steering/design-language.md` covers color tokens, typography, motion principles, and component appearance
    - `.kiro/steering/code-conventions.md` and `tech-stack.md` give checkable rules for structure, naming, testing, and the approved libraries
    - _Requirements: 13.1, 13.2_
  - [x] 2.2 Keep source checks dependency-free
    - Use the project's Kiro save hook for consistency review; do not add package tooling or a build step solely for linting
    - _Requirements: 1.2, 12.1–12.3_
  - [x] 2.3 Create the Kiro save-review hook
    - `.kiro/hooks/review-crossing-flow.json` runs a PostFileSave review of the signup transition, same-page handoff, reduced motion, fallback behavior, and approved stack
    - The hook is report-only; it runs no commands and modifies no files
    - _Requirements: 12.1–12.4_

- [x] 3. Implement pure-function logic modules
  - [x] 3.1 Implement Haunting_Level computation
    - `js/logic/haunting.js` exports `computeHauntingLevel`, `isIntense`, `ambientCount`, and `ambientSpeed`
    - Level is the rounded, capped sum of 60 times scroll progress and 40 times the valid-field ratio, as an integer from 0 to 100
    - Scroll progress reaches 1 as the footer enters the viewport; the signup section has extra bottom spacing on narrow screens
    - _Requirements: 4.1, 4.3, 4.4, 4.7_
  - [x]* 3.2 Write property tests for Haunting_Level
    - **Property 1: Haunting_Level is monotonic in its inputs**
    - **Property 2: Haunting_Level is a bounded integer**
    - **Validates: Requirements 14.1, 14.2**
  - [x] 3.3 Implement Signup_Details validation
    - `js/logic/validation.js` exports `validateName`, `validateEmail`, and `validateDetails`, returning per-field results with themed error keys
    - _Requirements: 5.3, 5.4_
  - [x] 3.5 Implement the three-attempt sequence state machine
    - `js/logic/sequence.js` counts valid submissions only and transitions through ready, shaking, crossing, and done
    - Repeated or out-of-order events are ignored
    - _Requirements: 5.6–5.8, 6.1, 7.1, 14.4, 14.5_
  - [x] 3.7 Implement Signup_Details storage
    - `js/storage.js` exports `saveDetails` and `loadDetails` using sessionStorage under `nocturne-night:signup`, wrapped in try/catch, with no network transmission
    - _Requirements: 5.8_

- [x] 4. Checkpoint - Ensure all logic tests pass
  - Run `npm test`; the invitation logic tests in `tests/landing.test.js` pass
  - _Requirements: 14.7_

- [x] 5. Build the semantic HTML structure
  - The Hero_Section, Details_Section, and Signup_Section appear in order, with the Signup_Section last
  - Landmarks, ordered headings, and the Signup_Form with labeled name and email fields, error message containers, and a signup button
  - The Secret_Message_Button, the secret note dialog, the nightometer with candle indicators, and an ARIA live region
  - _Requirements: 2.1, 5.1, 5.2, 8.1, 10.6_

- [x] 6. Implement the CSS design system
  - [x] 6.1 Create design tokens and base styles
    - `style.css` custom properties define color, typography, spacing, and easing, with reset, typography, and focus indicator styles
    - _Requirements: 2.2, 10.3_
  - [x] 6.2 Style sections and components
    - Hero, details, signup, form, and secret note styles work from 320 px to 1920 px without horizontal scrolling
    - _Requirements: 2.3, 2.6, 10.4_
  - [x] 6.3 Style haunting effects
    - Fog, drifting spirits, candles, vignette, scanlines, pixel tears, and the black handoff overlay
    - _Requirements: 1.1, 4.5, 6.4_

- [x] 7. Implement the GSAP animation foundation
  - [x] 7.1 Create the shared timeline module
    - `js/anim/timelines.js` exports `createTimelines(gsap, reducedMotion, elements)` with entrance, reveal, shake, glitch, ominous, handoff, and ambient factories
    - Durations come from `TIMING` in `js/config.js`; reduced motion caps every duration at 250 ms
    - Reduced-motion detection and live-region announcements stay in `script.js`
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 10.2, 10.5_
  - [x] 7.2 Implement entrance and scroll reveals
    - Staggered Hero_Section text reveal, and section reveals triggered by an IntersectionObserver
    - _Requirements: 2.3, 2.4_

- [x] 8. Implement Ambient_Effect elements and parallax
  - [x] 8.1 Scale and pause the ambient effects
    - `script.js` adds up to 8 ghost spirits (4 below 768 px) and fog, scales their count, speed, and opacity with Haunting_Level, and pauses the loops when the hero leaves view or the tab is hidden
    - _Requirements: 3.4, 3.5, 4.3, 4.4, 9.3_

- [x] 9. Implement the Haunting_Level display and status indicators
  - `script.js` connects scroll progress and field validity to the nightometer: 60 at the footer-entry point with no valid fields, plus 20 for each valid field
  - Updates the numeric display and candle indicators, intensifies the fog, applies `is-haunted` above 75, and announces crossing 75
  - _Requirements: 3.4, 4.2, 4.3, 4.5, 10.5_

- [x] 10. Implement the escalating signup response
  - First and second valid attempts play distinct messages and progressively stronger GSAP shakes; the form unlocks after each animation
  - Invalid data does not increment the attempt count
  - _Requirements: 5.3–5.7, 10.3, 10.5_

- [x] 11. Implement the final glitch and handoff
  - The third valid attempt stores the signup, plays the strongest shake and the restrained glitch together, fades the screen to black in 700 ms, and calls `beginTheOtherSide()` on the same page
  - Keep reduced-motion and missing-GSAP paths usable
  - _Requirements: 5.7–5.8, 6.1–6.6, 7.1–7.6, 10.1, 10.2, 10.7_

- [x] 12. Review keyboard, screen-reader, and responsive behavior
  - Confirm every interactive control remains keyboard operable, transition messages are announced, and the title sequence remains readable at narrow widths
  - _Requirements: 2.6, 10.3–10.7_

- [x] 13. Review the Kiro steering and save hook
  - Confirm the PostFileSave hook reflects the footer threshold, attempt sequence, same-page handoff, and approved stack without running tooling
  - _Requirements: 11.1–11.4, 12.1–12.4, 13.1–13.3_

- [x] 14. Implement the Secret_Message_Button
  - `script.js` opens the note in a native dialog (inline fallback when unsupported); its copy lives in `js/content.js`
  - It closes on a second activation, the close buttons, or the Escape key, and returns focus to the button
  - The revealed note is announced to screen readers
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 15. Implement accessibility support
  - [x] 15.2 Verify keyboard and screen reader support
    - Verify every interactive element is reachable and operable by keyboard with a visible focus indicator
    - Confirm Haunting_Level crossing 75, validation errors, the Glitch_Sequence start, and the Handoff are announced through the live region
    - _Requirements: 10.3, 10.5_

- [x] 17. Checkpoint - Ensure all tests pass
  - Run `npm test`, and ask the user if any questions arise
  - _Requirements: 13.3, 14.7_

- [x] 19. Add native packaging and hosting
  - Install Capacitor 8 core, CLI, Android, and iOS packages; configure `www/` as the single editable web directory and native `webDir`; remove the duplicate root web files
  - Add `npm run cap:sync`, `cap:android`, `cap:ios`, `cap:run:android`, and `cap:run:ios`, which sync `www/` before launching
  - Deploy `www/` to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`)
  - Keep the browser experience static, with no web framework and no bundler
  - _Requirements: 1.3, 1.5_

- [x] 20. Write example tests for the invitation logic
  - `tests/landing.test.js`: name and email validation (including two-letter domain endings such as `.io`), error copy for every error key, Haunting_Level bounds, monotonicity, and footer values, ambient scaling, the three-attempt sequence, and storage round trips with blocked storage
  - _Requirements: 4.1, 4.4, 5.3, 5.8, 14.1, 14.2, 14.7_

## Deferred

These tasks were left out of this version on purpose. Each one notes why, and whether it still needs doing.

- **3.4, 3.6, 3.8 Generated-input property tests (Properties 3 to 6).** Covered by example tests in `tests/landing.test.js`. Generated-input versions need a property-testing library, and the project keeps its tests free of dependencies. _Requirements: 14.3–14.6_
- **7.3 Unit tests for timeline duration limits.** Every duration comes from `TIMING` in `js/config.js`, and one reduced-motion cap in `createTimelines()` applies to all of them, so the limits live in one place. Testing them would need a GSAP stand-in in Node, which the project does not otherwise need. _Requirements: 3.2, 10.2_
- **8.2 Scroll parallax.** Omitted by design: it did not suit the calm, editorial invitation. The hero art is a fixed composition, and Lenis smooth scrolling, the section reveals, and the drifting spirits already give the page its motion. _Requirements: 2.5_
- **15.1 Live reduced-motion updates.** The reduced-motion paths work (no ambient motion, every timeline capped at 250 ms), but the preference is read when the page loads. Reacting to a change in the middle of a visit was left out because the setting rarely changes during one; it applies on the next load. _Requirements: 10.1, 10.2_
- **15.3 Measured contrast at every state.** Still to do as a manual check before submission. The color tokens were chosen for 4.5:1, but contrast over the moving fog and glitch layers has not been measured with a tool. _Requirements: 10.4_
- **16 Performance measurements.** Still to do as a manual check before submission. Animations use only transform, opacity, and filter, but frame rate and load time have not been measured on a mid-range device. _Requirements: 3.3, 9.1–9.4_
- **18 Kiro spec format validation.** The browser flow and requirement tracing are done. Kiro's spec format validation runs inside the Kiro IDE, so it is left for the team to run there. _Requirements: 7.1, 11.1–11.4_

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster first pass, but the checkpoints expect the property tests to pass when they are present.
- Each task references the specific requirements it satisfies, and each property test names the requirement it validates, so every feature traces back to `requirements.md`.
- `tests/landing.test.js` holds the invitation tests: Properties 1 and 2 with random cases, and example tests for validation, the sequence, and storage. Generated-input versions of Properties 3 to 6 need a property-testing library, which would be a new development-only dependency and needs approval first.
- The page has no web runtime dependencies beyond GSAP and Lenis, and no build step. Capacitor is the only npm dependency.
- The other side (title sequence, Go deeper, and the Underside) belongs to the Upside_Down_Escape spec.
- The keyboard, screen-reader, and responsive checks (tasks 12 and 15.2) were done in a browser. The contrast, frame-rate, and load-time checks listed under Deferred are manual.
- All themed copy (error messages, the secret note, labels) lives in `js/content.js` so wording can change without touching logic.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.3", "3.5", "3.7", "5", "6.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "6.2", "6.3", "7.1"] },
    { "id": 3, "tasks": ["4", "7.2", "8.1", "12", "14"] },
    { "id": 4, "tasks": ["9", "10", "11"] },
    { "id": 5, "tasks": ["13", "19", "20"] },
    { "id": 6, "tasks": ["15.2"] },
    { "id": 7, "tasks": ["17"] }
  ]
}
```
