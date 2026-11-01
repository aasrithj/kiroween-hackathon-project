# Implementation Plan: Upside Down Escape

## Overview

This plan implements a dual-dimension Halloween web application for the Kiroween 2026 Hackathon. The architecture follows a strict logic/UI boundary: pure TypeScript functions for state machines, timer, clue tracking, and signup validation are built and property-tested first, then wired into a Zustand store, then rendered through React components with GSAP animations, Spline 3D, Canvas particles, and Web Audio. The build proceeds foundation → logic layer → state management → presentation layer → integration → responsive/accessibility → performance.

**Tech Stack:** Next.js App Router, TypeScript, Zustand, GSAP + @gsap/react, Spline (@splinetool/react-spline), Tailwind CSS, Canvas/WebGL, fast-check (PBT), Vitest + React Testing Library.

## Tasks

- [ ] 1. Set up project scaffolding and hackathon repo files
  - [ ] 1.1 Initialize Next.js App Router project with TypeScript and Tailwind CSS
    - Create the Next.js app with `create-next-app` using App Router, TypeScript, and Tailwind
    - Configure `tsconfig.json` path aliases (`@/` → `src/`)
    - Set up base `app/layout.tsx` and `app/page.tsx`
    - _Requirements: 13.1_
  - [ ] 1.2 Install runtime dependencies
    - Install Zustand, GSAP, `@gsap/react`, `@splinetool/react-spline`
    - Verify imports resolve and Tailwind compiles
    - _Requirements: 1.1, 4.1_
  - [ ] 1.3 Install dev dependencies and configure Vitest with fast-check
    - Install Vitest, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, fast-check
    - Create `vitest.config.ts` with jsdom environment and path aliases
    - Add test script to `package.json` (`vitest --run`)
    - Create `src/test/setup.ts` with Testing Library matchers
    - _Requirements: 12.2_
  - [ ] 1.4 Create project directory structure and shared type definitions
    - Create directories: `src/logic/`, `src/store/`, `src/components/`, `src/audio/`, `src/lib/`
    - Define shared TypeScript types: `DimensionState`, `DimensionEvent`, `TimerConfig`, `TimerState`, `InteractableObjectData`, `ClueState`, `SignupInput`, `ValidationResult`, `SignupState`, `AudioState`
    - Define escape room data: clue-bearing and non-clue interactable object configurations
    - _Requirements: 1.1, 2.1, 5.2, 6.2, 7.1, 13.1_
  - [ ] 1.5 Set up hackathon repository files
    - Create `.kiro/steering/` directory with product and tech-stack steering files
    - Configure hooks directory if needed
    - Verify LICENSE file is present
    - Write README.md with project description, setup instructions, and run commands
    - _Requirements: N/A (hackathon repo requirement)_

- [ ] 2. Implement dimension state machine logic with property tests
  - [ ] 2.1 Implement dimensionReducer pure function
    - Create `src/logic/dimensionReducer.ts` as a pure reducer over `DimensionState` and `DimensionEvent`
    - Implement all legal transitions: `normal` + `TRIGGER_CLICKED` → `transitioning_forward`; `transitioning_forward` + `TRANSITION_COMPLETE` → `upside_down`; `transitioning_forward` + `TRANSITION_TIMEOUT` → `upside_down`; `upside_down` + `EXIT_REACHED` (all clues found) → `success`; `upside_down` + `TIMER_EXPIRED` → `failure`; `success` + `SUCCESS_SEQUENCE_DONE` → `transitioning_reverse`; `failure` + `RETRY_SELECTED` → `upside_down`; `failure` + `RETURN_SELECTED` → `transitioning_reverse`; `transitioning_reverse` + `TRANSITION_COMPLETE` → `normal`
    - Return state unchanged for all illegal transitions (e.g., `TRIGGER_CLICKED` in any non-`normal` state)
    - Accept an optional `allCluesFound` flag on `EXIT_REACHED` events to gate the `success` transition
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.4, 4.5, 4.6, 9.1, 9.3_
  - [ ]* 2.2 Write property test for dimension state machine transitions
    - **Property 1: Dimension state machine transition correctness**
    - Use fast-check `fc.constantFrom` to generate all states and events; verify legal transitions produce the correct next state and illegal transitions return the state unchanged
    - Run minimum 100 iterations
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 4.4, 4.5, 4.6, 9.1, 9.3**
  - [ ]* 2.3 Write property test for initial dimension state
    - **Property 2: Initial dimension state is always normal**
    - Verify the initial state factory always returns `normal` regardless of any URL path input
    - Run minimum 100 iterations
    - **Validates: Requirements 13.1, 13.3**
  - [ ]* 2.4 Write property test for non-dimension state invariance
    - **Property 3: Non-dimension state is invariant across dimension transitions**
    - Use fast-check to generate sequences of dimension events; verify audio muted state and signup registration state (registered email set, last submission status) are unchanged across all transitions
    - Run minimum 100 iterations
    - **Validates: Requirements 11.4, 13.4**

- [ ] 3. Implement timer engine logic with property tests
  - [ ] 3.1 Implement timerEngine pure function
    - Create `src/logic/timerEngine.ts` as a pure reducer over `TimerState`
    - Decrement `remainingSeconds` by 1 on each `TICK` event while `isRunning` is true
    - Set `isExpired` to true and `isRunning` to false when remaining time reaches 0
    - Implement `PAUSE` event that sets `isRunning` to false; subsequent `TICK` events have no effect
    - Validate `TimerConfig.initialTimeSeconds` is in range 60–600 (default 300)
    - _Requirements: 7.1, 7.4, 7.5_
  - [ ]* 3.2 Write property test for timer countdown and freeze
    - **Property 4: Timer countdown and freeze correctness**
    - Use fast-check to generate valid initial times and sequences of tick/pause events; verify decrement by exactly 1 per tick while running, expired at 0, and no effect after pause/escape
    - Run minimum 100 iterations
    - **Validates: Requirements 7.1, 7.4, 7.5**
  - [ ]* 3.3 Write property test for timer config validation
    - **Property 5: Timer config validation**
    - Use fast-check integer arbitraries to verify config is valid iff initial time is 60–600 inclusive and default is 300
    - Run minimum 100 iterations
    - **Validates: Requirements 7.1**

- [ ] 4. Implement clue engine logic with property tests
  - [ ] 4.1 Implement clueEngine pure function
    - Create `src/logic/clueEngine.ts` as a pure reducer over `ClueState`
    - On `INTERACT(objectId)`: if the object has a clue and the clue ID is not in `discoveredClueIds`, add it and increment the count; if the object has no clue, return flavor content without changing the count
    - Derive `allCluesFound` as `discoveredClueIds.length === totalClues`
    - Ensure `discoveredClueIds.length` never exceeds `totalClues`
    - Validate `totalClues` is in range 3–5
    - _Requirements: 6.1, 6.5_
  - [ ]* 4.2 Write property test for clue discovery increments
    - **Property 6: Clue discovery increments only for undiscovered clue objects**
    - Use fast-check to generate clue states and interactable objects; verify discovered count increments only for undiscovered clue objects and never for non-clue objects
    - Run minimum 100 iterations
    - **Validates: Requirements 6.1, 6.5**
  - [ ]* 4.3 Write property test for exit availability and clue bounds
    - **Property 7: Exit availability and clue count bounds**
    - Use fast-check to verify exit is interactive iff all clues found, discovered count never exceeds total, total is 3–5, and escape room has at least 3 interactable objects
    - Run minimum 100 iterations
    - **Validates: Requirements 5.2, 5.3, 6.2, 6.3**

- [ ] 5. Implement signup validation logic with property tests
  - [ ] 5.1 Implement validateSignup pure function
    - Create `src/logic/validateSignup.ts` returning a `ValidationResult` with field-specific errors
    - Check: `fullName` non-empty and ≤ 100 chars; `email` non-empty, ≤ 254 chars, has local part before `@` and domain part after; `plusOneCount` (if provided) is 0–10
    - Set `isValid` to true only when no errors are present
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 5.2 Write property test for signup validation constraints
    - **Property 8: Signup validation constraints**
    - Use fast-check string and integer arbitraries to verify the validator reports errors for exactly the violating fields and no errors for valid input
    - Run minimum 100 iterations
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [ ] 5.3 Implement signup state transition logic
    - Create `src/logic/signupReducer.ts` as a pure reducer over `SignupState`
    - On valid, non-duplicate submission: transition to `success`, add email to `registeredEmails`, clear `lastInput`
    - On duplicate email: transition to `duplicate`, retain `lastInput`
    - On server/network error: transition to `error`, retain `lastInput`
    - _Requirements: 2.4, 2.5, 2.6_
  - [ ]* 5.4 Write property test for duplicate email detection
    - **Property 9: Duplicate email detection**
    - Use fast-check `fc.commands` to generate sequences of submissions; verify duplicate emails transition to `duplicate` with retained input, valid new emails transition to `success` with email added and fields cleared
    - Run minimum 100 iterations
    - **Validates: Requirements 2.5**

- [ ] 6. Checkpoint - Logic layer complete
  - Ensure all property tests pass, ask the user if questions arise.

- [ ] 7. Build Zustand store with slices wiring logic modules
  - [ ] 7.1 Create dimension store slice
    - Create `src/store/dimensionSlice.ts` wiring `dimensionReducer` to Zustand
    - Expose `dispatch(event: DimensionEvent)` that calls the reducer and updates state
    - Expose `currentDimension` selector
    - _Requirements: 13.1_
  - [ ] 7.2 Create timer store slice
    - Create `src/store/timerSlice.ts` wiring `timerEngine`
    - Expose `startTimer(config)`, `tick()`, `pauseTimer()` actions
    - Expose `remainingSeconds`, `isRunning`, `isExpired` selectors
    - _Requirements: 7.1, 7.5_
  - [ ] 7.3 Create clue store slice
    - Create `src/store/clueSlice.ts` wiring `clueEngine`
    - Expose `interact(objectId)` action, `discoveredCount`, `totalClues`, `allCluesFound` selectors
    - Initialize with escape room object data (at least 3 interactable objects, 3–5 clues)
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 7.4 Create signup store slice with sessionStorage persistence
    - Create `src/store/signupSlice.ts` wiring `validateSignup` and `signupReducer`
    - Persist `registeredEmails` and `lastSubmission` to `sessionStorage` so registration state survives dimension transitions
    - Expose `submit(input)`, `reset()` actions and form field state
    - _Requirements: 2.4, 2.5, 2.6, 13.4_
  - [ ] 7.5 Create audio store slice with localStorage persistence
    - Create `src/store/audioSlice.ts` tracking `isMuted` state
    - Persist `isMuted` to `localStorage` so mute survives dimension transitions
    - Expose `toggleMute()` action
    - _Requirements: 11.4_
  - [ ] 7.6 Compose all slices into App Store with React provider
    - Create `src/store/appStore.ts` combining all slices into a single Zustand store
    - Create `src/store/StoreProvider.tsx` wrapping the app with the store provider
    - Initialize store from persisted `sessionStorage`/`localStorage` state on mount
    - _Requirements: 13.1, 13.4_

- [ ] 8. Implement Audio Management System
  - [ ] 8.1 Implement AudioManager singleton with Web Audio API
    - Create `src/audio/AudioManager.ts` as a singleton class
    - Implement master gain node for mute control
    - Read persisted mute state from `localStorage` on init
    - Track audio unlock state (after first user gesture per browser autoplay policy)
    - _Requirements: 4.2, 11.4, 12.4_
  - [ ] 8.2 Implement cue playback, mute toggle, preload, and ambient loop
    - Add `playCue(name)` for transition, clue-discovery, jumpscare, success, and ambient cues
    - Add `setMuted(boolean)` toggling master gain; persist to `localStorage`
    - Add `preload(name)` that fetches and decodes audio buffers for jumpscare assets
    - Add ambient loop start/stop for Upside Down dimension
    - Schedule audio cues within 200ms of visual transition start/end via callback hooks
    - _Requirements: 4.2, 5.4, 6.4, 8.2, 9.2, 11.4, 12.4, 12.5_

- [ ] 9. Build Normal Dimension presentation components
  - [ ] 9.1 Create NormalView container component
    - Create `src/components/normal/NormalView.tsx` as the Normal Dimension root
    - Render HeroSection, EventInfoSection, SignupSection, TriggerButton, ScrollReveal
    - Apply Halloween color palette (orange, purple, black) with accent colors on interactive elements
    - _Requirements: 1.1, 1.5, 3.1_
  - [ ] 9.2 Implement HeroSection with SplineScene and FallbackImage
    - Create `src/components/normal/HeroSection.tsx` rendering event title, description (≤200 chars), and Spline 3D scene
    - Import Spline from `@splinetool/react-spline/next` with `onError` handler that swaps in a static fallback image
    - Set `alt`/`aria-label` on the 3D container for accessibility
    - Lazy-load the Spline scene via `next/dynamic` so hero text renders immediately
    - _Requirements: 1.1, 1.6, 11.1, 12.1, 12.3_
  - [ ] 9.3 Implement EventInfoSection
    - Create `src/components/normal/EventInfoSection.tsx` rendering event date, location, time, and description
    - Wrap in ScrollReveal for GSAP scroll-triggered animation
    - _Requirements: 1.2_
  - [ ] 9.4 Implement SignupForm wired to validation and signup store
    - Create `src/components/normal/SignupForm.tsx` with fields: fullName (max 100), email (max 254), plusOneCount (0–10, optional)
    - Call `validateSignup(input)` on submit and render field-specific error messages adjacent to each field
    - On valid data: show success confirmation and clear fields
    - On duplicate email: show error and retain fields
    - On server/network error: show error and retain all field values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 9.5 Implement TriggerButton with pulsing glow animation
    - Create `src/components/normal/TriggerButton.tsx` positioned at the bottom of the page below all primary content
    - Continuously loop a pulsing-glow / animated-text cue via GSAP `useGSAP()` hook without explicit destination text
    - On click, dispatch `TRIGGER_CLICKED` to the dimension store
    - Ensure min target size 44×44px and keyboard-activatable
    - _Requirements: 3.1, 3.2, 10.3, 11.2_
  - [ ] 9.6 Implement ScrollReveal wrapper with GSAP ScrollTrigger
    - Create `src/components/normal/ScrollReveal.tsx` as a wrapper that registers a GSAP `ScrollTrigger` per section
    - Reveal sections with motion and fade on viewport entry inside `useGSAP()` with `gsap.context()` scope
    - Automatically revert animations and ScrollTriggers on unmount
    - _Requirements: 1.4, 12.2_

- [ ] 10. Build dimension transition overlay
  - [ ] 10.1 Implement TransitionOverlay with GSAP forward and reverse timelines
    - Create `src/components/transition/TransitionOverlay.tsx` as a full-screen fixed overlay with high z-index
    - Build forward timeline: darken/distort source visuals (vignette, blur, scale) → crossfade → reveal destination
    - Build reverse timeline: symmetric sequence returning to Normal
    - Randomize duration within 2–4s (forward) and 2–3s (reverse on success)
    - Schedule audio cues via `gsap.timeline().call()` within 200ms of visual start/end
    - Drive dimension swap at timeline midpoint; emit `onComplete` which dispatches `TRANSITION_COMPLETE`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.3_
  - [ ] 10.2 Add watchdog timeout and transitionLock guard
    - Add a 10s `setTimeout` watchdog that dispatches `TRANSITION_TIMEOUT` if the timeline hasn't fired `onComplete`
    - Implement a `transitionLock` ref to ignore clicks during an active transition
    - Disable pointer events on non-transition surfaces during `transitioning_*` states
    - _Requirements: 3.4, 3.6, 4.6_

- [ ] 11. Build Upside Down Dimension presentation components
  - [ ] 11.1 Create UpsideDownView container component
    - Create `src/components/upside-down/UpsideDownView.tsx` as the Upside Down Dimension root
    - Render EscapeRoom, ClueTracker, TimerDisplay, JumpscareOverlay, SuccessOverlay, ParticleCanvas
    - Apply dark blue and grey color palette, vignette, film grain, and desaturation filters
    - Start ambient audio on mount, stop on transition out
    - _Requirements: 5.1, 5.4, 5.5_
  - [ ] 11.2 Implement EscapeRoom environment with fog and dark palette
    - Create `src/components/upside-down/EscapeRoom.tsx` rendering the environment with fog and dark blue/grey tones
    - Render `InteractableObject` instances and `Exit` component within the environment
    - Apply visual filters: vignette, film grain, desaturation
    - _Requirements: 5.1, 5.5_
  - [ ] 11.3 Implement ParticleCanvas with rAF particle loop
    - Create `src/components/upside-down/ParticleCanvas.tsx` using `<canvas>` with `requestAnimationFrame`
    - Render floating ash/particle motes and fog effects
    - Pause the rendering loop when the Upside Down dimension is not active to save resources
    - _Requirements: 5.1, 12.2_
  - [ ] 11.4 Implement InteractableObject component
    - Create `src/components/upside-down/InteractableObject.tsx` as a clickable/tappable element
    - On interaction, dispatch `INTERACT` to the clue engine and display clue content or flavor response
    - Render focus indicator and support keyboard activation (Enter/Space)
    - Ensure min target size 44×44px
    - _Requirements: 5.2, 6.1, 6.5, 10.2, 10.3, 11.2_
  - [ ] 11.5 Implement Exit component (hidden until all clues found)
    - Create `src/components/upside-down/Exit.tsx`
    - Keep hidden and non-interactive while `allCluesFound` is false
    - Become visible and interactive when all clues are discovered
    - On reach, dispatch `EXIT_REACHED` with `allCluesFound` flag
    - _Requirements: 5.3, 6.3, 9.1_
  - [ ] 11.6 Implement ClueTracker display
    - Create `src/components/upside-down/ClueTracker.tsx` displaying "discovered / total" (e.g., "2 / 4")
    - Read from clue store slice and update on each discovery
    - Play clue discovery audio cue (1–3s) when a new clue is found
    - _Requirements: 6.2, 6.4_
  - [ ] 11.7 Implement TimerDisplay with MM:SS and urgency styling
    - Create `src/components/upside-down/TimerDisplay.tsx` showing remaining time in MM:SS format
    - Always visible and not obscured by other content
    - Change color to red and apply pulsing visual effect when remaining time < 10 seconds
    - Read from timer store slice
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 11.8 Implement JumpscareOverlay
    - Create `src/components/upside-down/JumpscareOverlay.tsx` as a full-viewport animation
    - Play animation covering 100% viewport width/height, starting within 500ms of failure trigger, lasting 1–3s
    - Play audio effect starting within 200ms of animation start for the animation duration
    - Use preloaded assets; fall back to on-demand loading if preload failed
    - After animation: show failure message with retry and return options (both simultaneously visible)
    - _Requirements: 8.1, 8.2, 8.3, 12.5_
  - [ ] 11.9 Implement SuccessOverlay
    - Create `src/components/upside-down/SuccessOverlay.tsx`
    - Display success message for at least 3 seconds and play success audio cue (3–5s)
    - After success sequence, trigger reverse transition back to Normal Dimension
    - If reverse transition fails, display error message and retain user in current dimension
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 12. Integrate and wire all flows end-to-end
  - [ ] 12.1 Implement DimensionRouter with URL state management
    - Create `src/components/DimensionRouter.tsx` reading dimension state from store
    - Render the appropriate view (NormalView or UpsideDownView) based on current dimension
    - Render TransitionOverlay when in `transitioning_*` states
    - Update URL via `history.pushState` when transition completes (not when it begins)
    - Reset to `normal` on initial page load/reload regardless of URL path
    - _Requirements: 3.5, 4.4, 13.1, 13.2, 13.3_
  - [ ] 12.2 Implement MuteControl visible in both dimensions
    - Create `src/components/MuteControl.tsx` toggling `AudioManager` master mute
    - Render in both Normal and Upside Down dimensions, always visible
    - Reflect persisted muted state; persist across dimension transitions
    - Support keyboard activation (Enter/Space) and visible focus indicator
    - _Requirements: 11.2, 11.4_
  - [ ] 12.3 Wire forward transition flow
    - Connect TriggerButton click → `TRIGGER_CLICKED` → `transitioning_forward` → TransitionOverlay forward animation → `TRANSITION_COMPLETE` → `upside_down` view
    - Wire the 10s watchdog timeout → `TRANSITION_TIMEOUT` → `upside_down`
    - Ensure all Normal Dimension interactive controls are disabled during transition
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.4, 4.6_
  - [ ] 12.4 Wire escape success flow
    - Connect Exit reach (all clues found) → `EXIT_REACHED` → `success` → SuccessOverlay (message + audio) → `SUCCESS_SEQUENCE_DONE` → `transitioning_reverse` → TransitionOverlay reverse → `TRANSITION_COMPLETE` → `normal`
    - Stop and freeze timer on escape
    - _Requirements: 7.5, 9.1, 9.2, 9.3, 9.4_
  - [ ] 12.5 Wire failure flow
    - Connect Timer expiry → `TIMER_EXPIRED` → `failure` → JumpscareOverlay animation + audio
    - After jumpscare: show failure message with retry and return options
    - Retry → `RETRY_SELECTED` → `upside_down` (reset timer and clues)
    - Return → `RETURN_SELECTED` → `transitioning_reverse` → `normal`
    - _Requirements: 7.4, 8.1, 8.2, 8.3_
  - [ ] 12.6 Wire clue interaction flow
    - Connect InteractableObject interaction → `INTERACT` → clueEngine → ClueTracker update
    - Play clue discovery audio cue (1–3s) on new clue discovery
    - Unlock Exit when `allCluesFound` becomes true
    - Display clue content or flavor response on screen
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Checkpoint - Integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Apply responsive design and accessibility
  - [ ] 14.1 Apply responsive layout (no horizontal overflow at 320–1920px)
    - Use Tailwind responsive utilities to ensure no horizontal scrolling or content overflow at viewport widths from 320px to 1920px
    - Test at 320px, 768px, 1280px, and 1920px breakpoints
    - _Requirements: 10.1_
  - [ ] 14.2 Enforce minimum text size, target size, and no overlaps
    - Ensure minimum text size of 16px across all sections
    - Ensure tappable target sizes of at least 44×44px for all interactive elements
    - Verify no overlapping element bounding boxes at all supported viewport widths
    - _Requirements: 10.2, 10.3_
  - [ ] 14.3 Add keyboard navigation and focus indicators
    - Ensure SignupForm, TriggerButton, all InteractableObjects, MuteControl, and retry/return options are reachable via Tab
    - Ensure all interactive elements are activatable via Enter or Space
    - Display visible focus indicator when each element receives keyboard focus
    - _Requirements: 11.2_
  - [ ] 14.4 Add alt and aria attributes for non-decorative images and 3D elements
    - Provide text alternatives describing content or purpose of all non-decorative images
    - Set `alt`/`aria-label` on the Spline 3D container and fallback image
    - _Requirements: 11.1_
  - [ ] 14.5 Verify color contrast ratio for body text
    - Ensure minimum color contrast ratio of 4.5:1 for body text against its background across both dimensions
    - Adjust Halloween palette and Upside Down palette as needed to meet contrast
    - _Requirements: 11.3_

- [ ] 15. Optimize performance and asset loading
  - [ ] 15.1 Lazy-load Spline scene, GSAP plugins, and Upside Down bundle
    - Use `next/dynamic` to code-split the Spline scene, GSAP plugin imports, and the entire Upside Down dimension bundle
    - Use `loading="lazy"` for below-the-fold images
    - Verify non-viewport assets are not in the initial bundle
    - _Requirements: 12.3_
  - [ ] 15.2 Preload jumpscare animation and audio assets in Normal Dimension
    - Call `AudioManager.preload('jumpscare')` while user is in Normal Dimension
    - Add `<link rel="preload">` for jumpscare video/animation assets
    - Verify preloaded assets begin playback within 100ms of failure trigger
    - _Requirements: 12.4, 12.5_
  - [ ] 15.3 Optimize hero content for initial render within 3 seconds
    - Ensure hero title, description, and static fallback image render immediately before Spline hydrates
    - Verify hero content renders within 3s on a 10 Mbps connection
    - _Requirements: 12.1, 12.2_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, though property tests are strongly recommended for the logic layer
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after the logic layer and after integration
- Property tests validate universal correctness properties on the pure logic layer
- Unit and integration tests validate specific UI scenarios, edge cases, and component wiring
- The logic/UI boundary is the cornerstone: all 9 properties operate on pure functions with no React or DOM dependencies
- Build order follows the architecture: foundation → pure logic → state store → presentation → integration → responsive/accessibility → performance

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1", "3.1", "4.1", "5.1", "5.3"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "4.2", "4.3", "5.2", "5.4"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "8.1"] },
    { "id": 6, "tasks": ["7.6", "8.2"] },
    { "id": 7, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6", "10.1", "11.3"] },
    { "id": 8, "tasks": ["9.1", "10.2", "11.2", "11.4", "11.5", "11.6", "11.7", "11.8", "11.9"] },
    { "id": 9, "tasks": ["11.1", "12.1", "12.2"] },
    { "id": 10, "tasks": ["12.3", "12.6"] },
    { "id": 11, "tasks": ["12.4", "12.5"] },
    { "id": 12, "tasks": ["14.3", "14.4"] },
    { "id": 13, "tasks": ["14.1", "14.5"] },
    { "id": 14, "tasks": ["14.2"] },
    { "id": 15, "tasks": ["15.2", "15.1"] },
    { "id": 16, "tasks": ["15.3"] }
  ]
}
```
