# Implementation Plan

## Overview

This plan implements the Haunted_Page described in `requirements.md` and `design.md`: a single scrolling Halloween event page built with only HTML, CSS, JavaScript, and GSAP. It ends with a signup form at the bottom that triggers a glitching error, an ominous mood, and a handoff to a separate escape experience.

The work is sequenced from the bottom up:

1. Project scaffolding, Kiro steering, hooks, and linting.
2. Pure-function logic (Haunting_Level, validation, sequence state machine, storage) with property-based tests, so the core behavior is verified before any UI exists.
3. Static structure and styling (HTML and CSS design system).
4. GSAP animation modules (foundation, ambient effects, Haunting_Level display, glitch, ominous mood, handoff).
5. Signup form orchestration, the secret message button, accessibility, and performance work.
6. Final integration and spec validation.

## Tasks

- [ ] 1. Set up project structure and GSAP source
  - Create `index.html`, `css/`, `js/`, `js/logic/`, `js/anim/`, `js/ui/`, `vendor/gsap/`, and `tests/` directories
  - Vendor GSAP and the GSAP plugins used (ScrollTrigger, plus any others declared) into `vendor/gsap/`, or declare a single pinned CDN URL, and record the choice in `README.md`
  - Add `package.json` with development-only dependencies (linters, test runner, property-based testing library); the page itself must have no runtime dependencies and no build step
  - Create `js/config.js` holding the Escape_Destination location constant, the sessionStorage key, timing limits, and the Ambient_Effect maximum
  - Create `js/content.js` holding all themed copy (error messages, hidden message, labels)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.2, 8.3_

- [ ] 2. Set up Kiro steering, hooks, and tooling
  - [ ] 2.1 Write the steering guides
    - Create `.kiro/steering/design-language.md` covering color tokens, typography, motion principles, and component appearance
    - Create `.kiro/steering/code-conventions.md` with checkable rules for structure, file naming, CSS naming, testing, and the no-frameworks rule
    - _Requirements: 13.1, 13.2_
  - [ ] 2.2 Configure linters
    - Add ESLint, Stylelint, and an HTML validator configuration that enforce the steering rules
    - _Requirements: 12.1, 13.3_
  - [ ] 2.3 Create the Kiro hooks
    - Add a PostFileSave hook in `.kiro/hooks/` that lints the saved file and blocks the change workflow on failure
    - Add a SessionStart hook in `.kiro/hooks/` that verifies the GSAP source and development dependencies and blocks the session if any are missing
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 3. Implement pure-function logic modules
  - [ ] 3.1 Implement Haunting_Level computation
    - Create `js/logic/haunting.js` with `computeHauntingLevel`, `isIntense`, `ambientCount`, and `ambientSpeed`
    - Level is the rounded, capped sum of 60 times scroll progress and 40 times the valid-field ratio, as an integer from 0 to 100
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
  - [ ] 3.5 Implement the sequence state machine
    - Create `js/logic/sequence.js` with `initialState`, `reduce`, and `phaseLimitMs`, covering the phases idle, glitch, ominous, handoff, and done
    - Ignore out-of-order events so the sequence and navigation run exactly once, and apply the reduced-motion limits
    - _Requirements: 3.2, 5.6, 6.3, 7.3, 7.4, 10.2_
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
    - Create `css/tokens.css` with custom properties for color (dark palette, at most three accents), typography, spacing, and easing
    - Create `css/base.css` with reset, typography, and focus indicator styles
    - _Requirements: 2.2, 10.3_
  - [ ] 6.2 Style sections and components
    - Create `css/sections.css` for the hero, details, signup, form, and secret message styling
    - Ensure layouts work from 320 px to 1920 px without horizontal scrolling and keep text contrast at 4.5:1 or higher
    - _Requirements: 2.3, 2.6, 10.4_
  - [ ] 6.3 Style haunting effects
    - Create `css/effects.css` for fog, spectral shapes, candles, vignette, scanlines, and the ominous color grade, using inline SVG where shapes are needed
    - _Requirements: 1.1, 2.5, 4.5, 6.4_

- [ ] 7. Implement the GSAP animation foundation
  - [ ] 7.1 Create shared timeline utilities and the accessibility helper
    - Create `js/anim/timelines.js` as the single module that defines durations, easing, and timeline factories, with `getLimits(reducedMotion)`
    - Apply the 2000 ms cap, the 3000 ms Ominous_Sequence exception, and the 300 ms reduced-motion cap
    - Create `js/ui/a11y.js` exposing `prefersReducedMotion()` with a change listener and `announce(message)` for a polite ARIA live region
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
  - Create `js/ui/haunting-display.js` connecting scroll progress and field validity to the Haunting_Level
  - Update the numeric display and the candle indicators (the non-color cues), and play the intensify timeline when the level increases
  - Apply the extra visual effect above level 75 and announce crossing 75 to screen readers
  - _Requirements: 3.4, 4.2, 4.3, 4.5, 10.5_

- [ ] 10. Implement the Glitch_Sequence
  - [ ] 10.1 Build the glitch timeline
    - Create `js/anim/glitch.js` combining at least three effects from RGB split, horizontal jitter, screen tearing, scanlines, and text corruption
    - Display the themed error message from `js/content.js` and complete within 2000 ms
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 10.2 Add flash safety and the skip option
    - Limit flashes to three per second, avoid large-area saturated red flashes, add a pre-warning, and provide a skip control that completes the glitch immediately
    - _Requirements: 6.6, 10.7_
  - [ ] 10.3 Add the reduced-motion fallback
    - Replace the glitch with a static, non-flashing error state of at most 300 ms when reduced motion is enabled
    - _Requirements: 10.1, 10.2_

- [ ] 11. Implement the Ominous_Sequence
  - Create `js/anim/ominous.js` shifting the color grade, tightening the vignette, fading out the Signup_Form, and slowing Ambient_Effect motion within 3000 ms
  - Keep the message visible for at least 1500 ms before the Handoff, including under reduced motion
  - _Requirements: 6.4, 6.5, 3.2_

- [ ] 12. Implement the Handoff transition
  - Create `js/anim/handoff.js` playing a transition of at most 600 ms (300 ms with reduced motion) before navigation
  - _Requirements: 7.3, 10.2_

- [ ] 13. Implement the Signup_Form behavior and sequence orchestration
  - Create `js/ui/form.js` validating fields on blur and on submit, showing themed errors beside invalid fields, and focusing the first invalid field on rejection
  - On valid submission, save Signup_Details, set the Haunting_Level to 100, and run the sequence by feeding events to the reducer and executing each returned command with the glitch, ominous, and handoff modules
  - Disable the signup button and ignore further submissions while the sequence runs
  - Navigate to the configured Escape_Destination when the reducer issues the navigate command, start the Handoff no later than 5600 ms after submit, and on back-forward cache restore show the calm initial state without replaying the sequence
  - _Requirements: 4.6, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2, 7.4, 7.5, 7.6_

- [ ] 14. Implement the Secret_Message_Button
  - Create `js/ui/secret-message.js` revealing the hidden message with a timeline of at most 2000 ms and reading its copy from `js/content.js`
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
    - Check text contrast of at least 4.5:1 at each Haunting_Level and during the glitch and ominous states
    - _Requirements: 10.4_

- [ ] 16. Optimize performance
  - Animate only transform, opacity, and filter where required, and keep first paint of the Hero_Section unblocked by GSAP and asset loading
  - Verify 60 frames per second with all Ambient_Effect elements and a timeline active, and a Hero_Section render within 3 seconds on a 25 Mbps connection
  - _Requirements: 3.3, 9.1, 9.2, 9.3, 9.4_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Run the project test command and the linters, and ask the user if any questions arise
  - _Requirements: 12.1, 13.3, 14.7_

- [ ] 18. Final integration and spec validation
  - Wire all modules together in `js/main.js`, including the GSAP load check and plugin registration, and run the full flow from landing to the Handoff in a browser
  - Confirm every implemented feature traces to an acceptance criterion and run spec format validation on requirements.md, design.md, and tasks.md
  - Document how to run, test, and swap the Escape_Destination in `README.md`
  - _Requirements: 7.1, 11.1, 11.2, 11.3, 11.4_

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster first pass, but the checkpoints expect the property tests to pass when they are present.
- Each task references the specific requirements it satisfies, and each property test names the requirement it validates, so every feature traces back to `requirements.md`.
- Property-based tests use the six properties defined in `design.md`, with at least 100 iterations each and a comment tag in the form `Feature: spooky-haunting-ui, Property N: <text>`.
- The page has no runtime dependencies and no build step. `package.json` holds only development tooling (linters, test runner, property-based testing library).
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