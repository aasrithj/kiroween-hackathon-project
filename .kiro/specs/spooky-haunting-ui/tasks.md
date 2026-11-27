# Implementation Plan

## Overview

This plan implements the Haunted_Page described in `requirements.md` and `design.md`: a single scrolling Halloween event page built with only HTML, CSS, JavaScript, and GSAP. Three valid signup attempts escalate from shakes and messages to a black handoff into the escape arrival screen.

The work is sequenced from the bottom up:

1. Project scaffolding, Kiro steering, hooks, and linting.
2. Pure-function logic (Haunting_Level, validation, sequence state machine, storage) with property-based tests, so the core behavior is verified before any UI exists.
3. Static structure and styling (HTML and CSS design system).
4. Shared GSAP timelines for the calm reveals, escalating shakes, final glitch, and black handoff.
5. Signup form orchestration, the secret message button, accessibility, and performance work.
6. Final integration and spec validation.

## Tasks

- [ ] 1. Keep the existing static project structure and GSAP source
  - Keep the landing and arrival pages at the project root with plain JavaScript modules in `js/`
  - Keep the existing local GSAP source and avoid adding dependencies or a build step
  - Keep the destination and motion timings in `js/config.js` and themed copy in `js/content.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.2, 8.3_

- [ ] 2. Set up Kiro steering, hooks, and tooling
  - [ ] 2.1 Write the steering guides
    - Create `.kiro/steering/design-language.md` covering color tokens, typography, motion principles, and component appearance
    - Create `.kiro/steering/code-conventions.md` with checkable rules for structure, file naming, CSS naming, testing, and the no-frameworks rule
    - _Requirements: 13.1, 13.2_
  - [ ] 2.2 Keep source checks dependency-free
    - Use the project's Kiro save hook for consistency review; do not add package tooling or a build step solely for linting
    - _Requirements: 1.2, 12.1–12.3_
  - [x] 2.3 Create the Kiro save-review hook
    - Add `.kiro/hooks/review-crossing-flow.json` with a PostFileSave review of the signup transition, reduced motion, fallback behavior, and arrival scope
    - Keep the hook report-only; do not run undeclared commands or modify files automatically
    - _Requirements: 12.1–12.4_

- [ ] 3. Implement pure-function logic modules
  - [ ] 3.1 Implement Haunting_Level computation
    - Create `js/logic/haunting.js` with `computeHauntingLevel`, `isIntense`, `ambientCount`, and `ambientSpeed`
    - Level is the rounded, capped sum of 60 times scroll progress and 40 times the valid-field ratio, as an integer from 0 to 100
    - Normalize scroll progress to reach 1 as the footer enters the viewport; provide extra mobile bottom spacing below signup content
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ]* 3.2 Write property tests for Haunting_Level
    - **Property 1: Haunting_Level is monotonic in its inputs**
    - **Property 2: Haunting_Level is a bounded integer**
    - **Validates: Requirements 14.1, 14.2**
  - [ ] 3.3 Implement Signup_Details validation
    - Create `js/logic/validation.js` with `validateName`, `validateEmail`, and `validateDetails`, returning per-field results with themed error keys
    - _Requirements: 5.3, 5.4_
  - [ ]* 3.4 Write property tests for validation
    - **Property 3: Validation is deterministic and exact**
    - **Validates: Requirements 14.3**
  - [x] 3.5 Implement the three-attempt sequence state machine
    - `js/logic/sequence.js` counts valid submissions only and transitions through ready, shaking, crossing, and done
    - Ignore repeated or out-of-order events
    - _Requirements: 5.5–5.7, 6.1, 7.1, 14.4, 14.5_
  - [ ]* 3.6 Write property tests for the sequence state machine
    - **Property 4: The sequence and handoff run exactly once**
    - **Property 5: Phases are ordered and bounded**
    - **Validates: Requirements 14.4, 14.5**
  - [ ] 3.7 Implement Signup_Details storage
    - Create `js/storage.js` with `saveDetails` and `loadDetails` using sessionStorage under the documented key, wrapped in try/catch, with no network transmission
    - _Requirements: 5.7_
  - [ ]* 3.8 Write property test for storage round trip
    - **Property 6: Storage round trip preserves details**
    - **Validates: Requirements 14.6**

- [ ] 4. Checkpoint - Ensure all logic tests pass
  - Run the project test command and ask the user if any questions arise
  - _Requirements: 14.7_

- [ ] 5. Build the semantic HTML structure
  - Create the Hero_Section, Details_Section, and Signup_Section in order, with the Signup_Section last
  - Add landmarks, ordered headings, and the Signup_Form with labeled name and email fields, error message containers, and a signup button
  - Add the Secret_Message_Button, the hidden message container, the Haunting_Level indicator with candle indicators, and ARIA live regions
  - _Requirements: 2.1, 5.1, 5.2, 8.1, 10.6_

- [ ] 6. Implement the CSS design system
  - [ ] 6.1 Create design tokens and base styles
    - Use the existing `style.css` custom properties for color, typography, spacing, and easing
    - Keep reset, typography, and focus indicator styles in `style.css`
    - _Requirements: 2.2, 10.3_
  - [ ] 6.2 Style sections and components
    - Style the hero, details, signup, form, and secret message in `style.css`
    - Ensure layouts work from 320 px to 1920 px without horizontal scrolling and keep text contrast at 4.5:1 or higher
    - _Requirements: 2.3, 2.6, 10.4_
  - [ ] 6.3 Style haunting effects
    - Style fog, spectral shapes, candles, vignette, scanlines, and the final crossing in `style.css`
    - _Requirements: 1.1, 2.5, 4.5, 6.4_

- [ ] 7. Implement the GSAP animation foundation
  - [ ] 7.1 Create shared timeline utilities and the accessibility helper
    - Create `js/anim/timelines.js` as the single module that defines durations, easing, and timeline factories, with `getLimits(reducedMotion)`
    - Keep the 2000 ms animation cap and apply the 250 ms reduced-motion timing from `js/config.js`
    - Keep reduced-motion detection and live-region announcements in `script.js`
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 10.2, 10.5_
  - [ ] 7.2 Implement entrance and scroll reveals
    - Add the staggered Hero_Section text reveal and ScrollTrigger reveals for each section
    - _Requirements: 2.3, 2.4_
  - [ ]* 7.3 Write unit tests for timeline duration limits
    - Verify every timeline factory returns a duration within its limit in normal and reduced-motion modes
    - _Requirements: 3.2, 10.2_

- [ ] 8. Implement Ambient_Effect elements and parallax
  - Create `js/anim/ambient.js` rendering at least two parallax layers that move at different rates on scroll
  - Scale element count and motion speed with Haunting_Level, capped at the configured maximum and reduced below 768 px
  - Pause or kill looping timelines when off-screen or when the tab is hidden, and resume them on return
  - _Requirements: 2.5, 3.4, 3.5, 4.3, 4.4, 9.3_

- [ ] 9. Implement the Haunting_Level display and status indicators
  - Keep the display wiring in `script.js`, connecting scroll progress and field validity to the Haunting_Level
  - Reach 60 at the footer-entry point with no valid fields; add 20 for each valid field
  - Update the numeric display and the candle indicators (the non-color cues), and play the intensify timeline when the level increases
  - Apply the extra visual effect above level 75 and announce crossing 75 to screen readers
  - _Requirements: 3.4, 4.2, 4.3, 4.5, 10.5_

- [x] 10. Implement the escalating signup response
  - First and second valid attempts play distinct messages and progressively stronger GSAP shakes; the form unlocks after each animation
  - Invalid data does not increment the attempt count
  - _Requirements: 5.3–5.6, 10.3, 10.5_

- [x] 11. Implement the final glitch and handoff
  - The third valid attempt stores the signup, plays the restrained glitch, fades the screen to black in at most 600 ms, and navigates to `escape.html`
  - Keep skip, reduced-motion, and missing-GSAP paths usable
  - _Requirements: 5.6–5.7, 6.1–6.6, 7.1–7.6, 10.1–10.7_

- [ ] 12. Review keyboard, screen-reader, and responsive behavior
  - Confirm every interactive control remains keyboard operable, transition messages are announced, and the arrival screen remains readable at narrow widths
  - _Requirements: 2.6, 10.3–10.7_

- [ ] 13. Review the Kiro steering and save hook
  - Confirm the PostFileSave hook reflects the footer threshold, attempt sequence, and arrival scope without adding or running undeclared tooling
  - _Requirements: 11.1–11.4, 12.1–12.4, 13.1–13.3_

- [ ] 14. Implement the Secret_Message_Button
  - Keep the Secret_Message_Button behavior in `script.js` and its copy in `js/content.js`
  - Close on second activation or the Escape key and return focus to the button
  - Announce the revealed message to screen readers
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Implement accessibility support
  - [ ] 15.1 Verify reduced-motion handling
    - Confirm Ambient_Effect elements render without continuous motion, every timeline respects the 300 ms cap, and the preference change listener updates the page live
    - _Requirements: 10.1, 10.2_
  - [ ] 15.2 Add keyboard and screen reader support
    - Verify every interactive element is reachable and operable by keyboard with a visible focus indicator
    - Announce Haunting_Level crossing 75, validation errors, the Glitch_Sequence start, and the Handoff through ARIA live regions
    - _Requirements: 10.3, 10.5_
  - [ ] 15.3 Verify contrast at every state
    - Check text contrast of at least 4.5:1 at each Haunting_Level and during the glitch and handoff
    - _Requirements: 10.4_

- [ ] 16. Optimize performance
  - Animate only transform, opacity, and filter where required, and keep first paint of the Hero_Section unblocked by GSAP and asset loading
  - Verify 60 frames per second with all Ambient_Effect elements and a timeline active, and a Hero_Section render within 3 seconds on a 25 Mbps connection
  - _Requirements: 3.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Run the project test command and the linters, and ask the user if any questions arise
  - _Requirements: 12.1, 13.3, 14.7_

- [ ] 18. Final integration and spec validation
  - Keep the existing browser entry in `script.js` and verify the flow from landing to the Handoff
  - Confirm every implemented feature traces to an acceptance criterion and run spec format validation on requirements.md, design.md, and tasks.md
  - Document how to run, test, and swap the Escape_Destination in `README.md`
  - _Requirements: 7.1, 11.1, 11.2, 11.3, 11.4_

- [x] 19. Implement escalation and the escape arrival screen
  - First and second valid submissions play progressively stronger shakes and distinct messages, then unlock the form again
  - The third valid submission stores signup details, glitches the page, fades to black, and navigates to `escape.html`
  - Include reduced-motion and missing-GSAP paths; stop at the original arrival screen before puzzle and timer gameplay
  - _Requirements: 5.5–5.7, 6.1–6.6, 7.1–7.6, 10.1–10.7_

- [x] 20. Add dependency-free signup and crossing sound cues
  - Synthesize one quiet error cue for each rejected form submission and an original supernatural synth cue when the black handoff begins
  - Use Web Audio only after user interaction, shorten the crossing cue for reduced motion, and continue silently if audio is unavailable
  - Keep synthesized audio code in `js/audio/`; store any approved externally sourced audio assets locally in `audio/` with source and license details
  - _Requirements: 1.1, 5.5, 7.7, 7.8_

- [x] 21. Add pixel-tear crossing and arrival title reveal
  - Add brief, sparse pixel-block breakup to the final glitch and reveal the original arrival title with a zoom-out settle through the shared GSAP timeline module
  - Keep the heading visible without animation when GSAP is unavailable or reduced motion is preferred
  - _Requirements: 6.1, 10.1, Upside Down Escape 3.9_

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster first pass, but the checkpoints expect the property tests to pass when they are present.
- Each task references the specific requirements it satisfies, and each property test names the requirement it validates, so every feature traces back to `requirements.md`.
- Property-based tests use the six properties defined in `design.md`, with at least 100 iterations each and a comment tag in the form `Feature: spooky-haunting-ui, Property N: <text>`.
- The page has no runtime dependencies, package manifest, or build step.
- The Escape_Destination is a single constant in `js/config.js`. The content and design of that destination belong to a separate spec and are not implemented in this plan.
- Frame rate, load time, contrast, flash rate, keyboard walkthrough, and screen reader checks in tasks 15 and 16 are manual or browser-based and are not covered by automated tests.
- All themed copy (error messages, the hidden message, labels) lives in `js/content.js` so wording can change without touching logic.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "3.3", "3.5", "3.7", "5", "6.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "3.4", "3.6", "3.8", "6.2", "6.3", "7.1"] },
    { "id": 3, "tasks": ["4", "7.2", "7.3", "8", "10.1", "12", "14"] },
    { "id": 4, "tasks": ["9", "10.2", "10.3", "11"] },
    { "id": 5, "tasks": ["13", "15.1", "15.3"] },
    { "id": 6, "tasks": ["15.2", "16"] },
    { "id": 7, "tasks": ["17"] },
    { "id": 8, "tasks": ["18"] }
  ]
}
```
