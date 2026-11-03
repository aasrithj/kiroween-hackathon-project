# Requirements Document

## Introduction

Upside_Down_Escape is the playable second experience in Nocturne Night. After the visitor completes the haunted landing-page signup and its ominous handoff, the interface drops them into a hostile mirror-world: the Trench of Horror, a cold, decayed ravine around an abandoned relay station where a presence called the Demon speaks through radios, lights, and damaged signage. The visual direction is inspired by the tense 1980s supernatural atmosphere associated with *Stranger Things*: ordinary objects behaving strangely, an alternate dimension, practical-looking haze, and a sense that something is watching. The experience uses original characters, copy, puzzles, and visuals; it does not use show footage, logos, character likenesses, or dialogue.

The visitor has seven minutes (420 seconds) to discover four clues, satisfy three explicit demands from the Demon, and reach the gate. The demands are concrete puzzle interactions with deterministic answers supplied by clues. If time expires first, a brief GSAP-driven silhouette jumpscare plays, followed by a clear “You failed” state with retry and return options. If all demands are satisfied and the gate is activated in time, a success sequence returns the visitor to Nocturne Night.

The complete site remains a static HTML, CSS, JavaScript, and GSAP project. Pure timer, puzzle, and state-transition logic is separated from DOM and animation code. No framework, CSS utility library, bundler, 3D runtime, or network service is required.

## Glossary

- **Site**: The Nocturne Night landing page and the Upside_Down_Escape experience.
- **Normal_Dimension**: The haunted landing and signup page specified in `.kiro/specs/spooky-haunting-ui/`.
- **Upside_Down_Escape**: The separate escape-room page implemented from this specification.
- **Escape_Dimension**: The active game view inside the Upside_Down_Escape page.
- **Trench of Horror**: The ravine and relay-station setting explored in the Escape_Dimension.
- **Demon**: The original, unseen antagonist that communicates demands through in-world messages.
- **Registrant**: A visitor whose signup details may be passed from the Normal_Dimension in sessionStorage.
- **Escape_State**: One of `loading`, `transitioning_in`, `playing`, `failure_scaring`, `failure`, `success`, `transitioning_out`, or `returned`.
- **Escape_Timer**: The visible seven-minute countdown, measured in whole seconds.
- **Clue**: One of four discoverable pieces of information required to understand the Demon’s demands.
- **Demand**: One of three interactive puzzle conditions that must be fulfilled before the gate opens.
- **Interactable_Object**: A keyboard and pointer operable scene object that reveals a clue, enables a demand, or provides flavor text.
- **Clue_Tracker**: The UI reporting discovered clues out of four and completed demands out of three.
- **Gate**: The exit interaction, available only after all four clues are found and all three demands are met.
- **Jumpscare_Sequence**: A single, brief, non-strobing GSAP animation that presents an abstract original silhouette after timeout.
- **Handoff**: The transition between the Normal_Dimension and Escape_Dimension, or back after success.
- **GSAP_Timeline**: A GSAP animation sequence created by the shared animation module.
- **PBT_Property**: A property-based test of a pure function or state reducer.
- **Kiro_Hook**: A Kiro automation hook that runs a check on a development event.

## Requirements

### Requirement 1: Technology and Runtime Constraints

**User Story:** As a developer, I want the escape experience to share the project's small static stack, so that it runs without a framework or build system.

#### Acceptance Criteria

1. THE Upside_Down_Escape SHALL use only semantic HTML, CSS, plain JavaScript ES modules, browser APIs, and GSAP for runtime behavior and animation.
2. THE Upside_Down_Escape SHALL NOT depend on React, Next.js, Tailwind CSS, a CSS utility framework, a bundler, a 3D library, a game engine, or a server API.
3. THE Upside_Down_Escape SHALL run as static files from the project's documented static HTTP server workflow.
4. THE Upside_Down_Escape SHALL load GSAP from the single source declared by the project README and SHALL NOT add a second GSAP source or a plugin unless that plugin is declared there.
5. THE Upside_Down_Escape SHALL separate pure state, timer, puzzle, and validation logic from DOM and GSAP effects.

### Requirement 2: Thematic Escape Experience

**User Story:** As a visitor, I want the new dimension to feel like a hostile supernatural world, so that the shift from the invitation page feels striking and memorable.

#### Acceptance Criteria

1. THE Escape_Dimension SHALL present an original, Stranger Things-inspired 1980s supernatural atmosphere through composition, lighting, copy, fog, silhouettes, and environmental detail.
2. THE Escape_Dimension SHALL use original visual assets and wording and SHALL NOT display show logos, footage, character likenesses, copied dialogue, or puzzle text from an existing work.
3. THE Escape_Dimension SHALL communicate the Demon's presence through at least three in-world messages or environmental cues that support the clue hunt.
4. THE Escape_Dimension SHALL provide a concise opening instruction that tells the visitor to find four clues, fulfill three demands, and reach the gate before time runs out.
5. THE Escape_Dimension SHALL remain legible and operable while atmospheric effects are active; effects SHALL NOT obscure puzzle controls, the timer, clue tracker, or instructions.

### Requirement 3: Entry, State, and Handoff

**User Story:** As a Registrant, I want the transition into and out of the escape to preserve my signup and respond predictably, so that both dimensions feel like one experience.

#### Acceptance Criteria

1. WHEN the Normal_Dimension navigates to the configured Escape_Destination after its signup sequence, THE Upside_Down_Escape SHALL begin in `loading` and then enter `transitioning_in` before `playing`.
2. THE Upside_Down_Escape SHALL read optional Registrant details from the `nocturne-night:signup` sessionStorage key documented by the Normal_Dimension without transmitting them to a network service.
3. IF the expected signup data is missing or unreadable, THEN THE Escape_Dimension SHALL still allow a visitor to play and SHALL use a generic greeting.
4. THE Escape_State SHALL default to `loading` on every fresh load, and a reload during play SHALL start a fresh seven-minute attempt with no clues or demands completed.
5. WHEN a valid escape succeeds, THE Upside_Down_Escape SHALL show a success message for at least three seconds and then perform a reverse Handoff to the Normal_Dimension.
6. IF the reverse Handoff cannot navigate to its configured destination, THEN THE Upside_Down_Escape SHALL keep the success message visible and offer a working return link.
7. THE Escape_State reducer SHALL ignore events that are illegal in its current state and SHALL never start failure or success sequences more than once per attempt.

### Requirement 4: Escape Environment and Interactable Objects

**User Story:** As a trapped visitor, I want to explore an eerie but understandable scene, so that I can discover clues and interact with the world.

#### Acceptance Criteria

1. THE Escape_Dimension SHALL render the Trench of Horror as a desaturated ravine around a forest-edge relay station, with layered fog, a cold blue-gray palette, restrained organic silhouettes, and a vignette.
2. THE Escape_Dimension SHALL provide at least five distinct Interactable_Objects, including a shortwave radio, a breaker panel, a damaged notice board, a cassette player, and the gate.
3. WHEN a visitor activates an Interactable_Object, THE Escape_Dimension SHALL show its response in a labeled, dismissible scene panel and SHALL preserve keyboard focus when the panel is closed.
4. THE Escape_Dimension SHALL make all object responses available through keyboard operation and accessible names; visual-only marks SHALL be decorative to assistive technology.
5. WHEN the visitor activates an object that is not currently actionable, THE Escape_Dimension SHALL explain what is still needed instead of silently ignoring the interaction.

### Requirement 5: Clue Discovery and Demon Demands

**User Story:** As a trapped visitor, I want clues to explain exactly how to satisfy the Demon’s demands, so that the escape is a fair puzzle rather than guesswork.

#### Acceptance Criteria

1. THE Escape_Dimension SHALL contain exactly four required clues, discoverable from the radio log, notice board, cassette sleeve, and wall markings.
2. WHEN a visitor discovers a clue, THE Escape_Dimension SHALL mark it discovered once, show its text in the scene panel, and update the Clue_Tracker.
3. THE Escape_Dimension SHALL present three explicit Demon demands, each with a known, deterministic answer derived from the clues: tune the radio to 88.3 MHz; restore breakers in the order 2 → 1 → 3; and enter the gate word RETURN.
4. WHEN the visitor completes a demand correctly, THE Escape_Dimension SHALL mark that demand complete once, provide visual and textual feedback, and update the Clue_Tracker.
5. IF the visitor provides an incorrect answer, THEN THE Escape_Dimension SHALL explain that the demand remains unmet and SHALL allow another attempt without resetting discovered clues or completed demands.
6. WHEN all four clues are discovered and all three demands are complete, THE Escape_Dimension SHALL unlock the gate and announce that it is ready.
7. WHILE any clue or demand remains incomplete, THE Gate SHALL remain closed and non-escapable; activating it SHALL explain the unmet requirement.
8. THE Escape_Dimension SHALL include at least one non-clue interactable response that adds atmosphere without changing clue or demand progress.

### Requirement 6: Seven-Minute Escape Timer

**User Story:** As a trapped visitor, I want a persistent countdown, so that I understand the time pressure and can pace my search.

#### Acceptance Criteria

1. WHEN `playing` begins, THE Escape_Timer SHALL start at exactly 420 seconds and decrement by one second per elapsed second using a monotonic clock or equivalent drift-corrected timing.
2. THE Escape_Timer SHALL remain visible and readable throughout `playing`, displaying minutes and seconds in `MM:SS` format.
3. WHEN 60 seconds remain, THE Escape_Dimension SHALL announce the warning once through an accessible live region and show a non-color warning cue.
4. WHEN 10 seconds or fewer remain, THE Escape_Dimension SHALL visibly intensify the timer without rapid flashing or loss of contrast.
5. WHEN the Escape_Timer reaches zero while the state is `playing`, THE Escape_Dimension SHALL set the remaining time to zero, stop the timer, and transition to `failure_scaring` exactly once.
6. WHEN the Gate is successfully activated before timeout, THE Escape_Timer SHALL stop and preserve its remaining time for the success state.
7. WHILE the state is not `playing`, timer tick events SHALL NOT change the remaining time.

### Requirement 7: Timeout Jumpscare and Failure State

**User Story:** As a visitor who runs out of time, I want a short, startling consequence and a clear result, so that failure feels intentional and I know what I can do next.

#### Acceptance Criteria

1. WHEN timeout occurs, THE Jumpscare_Sequence SHALL begin within 500 milliseconds and SHALL use GSAP to animate an original, abstract silhouette and restrained interface distortion.
2. THE Jumpscare_Sequence SHALL cover the play view, last between 1000 and 2500 milliseconds, and SHALL NOT use more than three flashes per second or a full-screen saturated red flash.
3. WHERE reduced motion is enabled, THE Jumpscare_Sequence SHALL be replaced by a static silhouette and brief text transition lasting no more than 300 milliseconds.
4. WHEN the Jumpscare_Sequence completes, THE Upside_Down_Escape SHALL display the clear heading **“You failed”**, a short in-world explanation, and simultaneously visible **Try again** and **Return to Nocturne Night** controls.
5. WHEN the visitor chooses **Try again**, THE Escape_Dimension SHALL reset clues, demands, timer, and failure state to a new 420-second attempt.
6. WHEN the visitor chooses **Return to Nocturne Night**, THE Upside_Down_Escape SHALL navigate to the configured return destination without replaying the jumpscare.
7. THE Jumpscare_Sequence SHALL not autoplay audio; any optional sound SHALL require an explicit visitor control and SHALL have a visible mute control.

### Requirement 8: Escape Success State

**User Story:** As a visitor who fulfills the demands, I want a rewarding escape, so that completing the hunt feels meaningful.

#### Acceptance Criteria

1. WHEN the visitor activates the unlocked Gate while the Escape_Timer is greater than zero, THE Escape_Dimension SHALL enter `success` and SHALL freeze the timer.
2. THE Escape_Dimension SHALL show a success message and a visual release sequence for at least three seconds.
3. WHEN the success sequence completes, THE Upside_Down_Escape SHALL perform a GSAP reverse Handoff and return to the Normal_Dimension.
4. IF the return destination is unavailable, THE Escape_Dimension SHALL keep the visitor in the success state and expose a keyboard-accessible return link.
5. THE success transition SHALL not clear the Registrant’s sessionStorage signup data.

### Requirement 9: Responsive Design

**User Story:** As a visitor on any device, I want the escape scene and puzzles to fit my screen, so that I can complete the experience on desktop or mobile.

#### Acceptance Criteria

1. THE Escape_Dimension SHALL work from 320 px through 1920 px viewport widths without horizontal scrolling.
2. THE Escape_Dimension SHALL reflow the scene controls, Clue_Tracker, timer, and object panels without overlap at supported widths.
3. EVERY Interactable_Object and puzzle control SHALL have a minimum 44 by 44 CSS-pixel target and SHALL work with pointer, touch, Enter, and Space where applicable.
4. THE Escape_Dimension SHALL keep essential body text at least 16 CSS pixels; compact status text SHALL remain at least 14 CSS pixels and meet the required contrast ratio.
5. THE Escape_Dimension SHALL adapt fog and decorative effect counts for narrow viewports while retaining all clues and controls.

### Requirement 10: Accessibility and Safety

**User Story:** As a visitor with accessibility needs, I want the escape to remain understandable and safe, so that suspense never blocks use of the game.

#### Acceptance Criteria

1. THE Upside_Down_Escape SHALL use semantic landmarks, ordered headings, labeled controls, visible focus indicators, and descriptive alternative text for informative visuals.
2. THE Upside_Down_Escape SHALL maintain at least 4.5:1 contrast for text and controls against their backgrounds in every state.
3. WHERE reduced motion is enabled, THE Escape_Dimension SHALL disable continuous motion, parallax, camera shake, and the animated jumpscare while preserving all game information and interactions.
4. THE Escape_Dimension SHALL avoid strobing and rapid luminance changes in all states.
5. THE Escape_Dimension SHALL announce clue discovery, demand completion, the 60-second warning, gate unlock, failure, and success through appropriate ARIA live regions without announcing every timer tick.
6. THE Escape_Dimension SHALL provide a persistent **Return to Nocturne Night** control that remains operable from `playing`, `failure`, and `success` states.
7. THE Escape_Dimension SHALL provide a skip control during the forward transition and jumpscare; activating it SHALL move directly to the corresponding stable state.
8. THE timer SHALL be available to assistive technology without repeatedly interrupting speech; it SHALL announce only at defined warning thresholds and state changes.

### Requirement 11: Performance and Resilience

**User Story:** As a visitor, I want the escape to remain responsive, so that visual atmosphere does not interfere with finding clues.

#### Acceptance Criteria

1. THE Escape_Dimension SHALL render its title, timer, tracker, and first usable object within three seconds on a 10 Mbps connection.
2. THE Escape_Dimension SHALL limit simultaneously animated ambient elements to a documented maximum of 12 on desktop and 6 below 768 px.
3. THE Escape_Dimension SHALL pause or kill ambient GSAP timelines when their elements are off-screen or the document is hidden and resume them when visible, unless reduced motion is enabled.
4. THE Escape_Dimension SHALL animate primarily transform and opacity; filter changes SHALL be limited to short, non-looping transitions.
5. IF GSAP fails to load, THEN THE Escape_Dimension SHALL keep the timer, puzzles, state transitions, retry, and return controls usable without animation.
6. IF sessionStorage is unavailable, THEN THE Escape_Dimension SHALL continue with a generic greeting and SHALL NOT fail to initialize the puzzle.

### Requirement 12: Local Data and Privacy

**User Story:** As a visitor, I want the experience to use only the information I supplied for the story, so that my signup details remain private.

#### Acceptance Criteria

1. THE Upside_Down_Escape SHALL read Registrant details only from the documented sessionStorage key established by the Normal_Dimension.
2. THE Upside_Down_Escape SHALL NOT transmit signup details, puzzle progress, or timer state to a network service.
3. THE Upside_Down_Escape SHALL NOT place personal signup details in the URL, DOM text beyond the optional greeting, or persistent localStorage.
4. THE Upside_Down_Escape SHALL clear only its own transient puzzle state on retry and SHALL preserve the original signup record for return to the Normal_Dimension.

### Requirement 13: Kiro Spec-Driven Development and Steering

**User Story:** As a developer, I want this feature defined and built through Kiro’s spec workflow, so that its behavior stays reviewable and consistent with the landing page.

#### Acceptance Criteria

1. THE Upside_Down_Escape SHALL be defined by `requirements.md`, `design.md`, and `tasks.md` in this spec directory using the Kiro spec format.
2. EVERY implemented feature in the Upside_Down_Escape SHALL trace to at least one acceptance criterion in this document.
3. THE Upside_Down_Escape SHALL follow project steering for HTML structure, CSS naming, JavaScript modules, accessibility, the approved static technology stack, and original themed content.
4. WHEN the spec phase advances, the three documents SHALL be reviewed for consistent glossary terms, requirement references, state names, and puzzle answers.

### Requirement 14: Property-Based Testing

**User Story:** As a developer, I want the timer, puzzle rules, and state transitions verified as pure logic, so that the seven-minute experience cannot end in an invalid state.

#### Acceptance Criteria

1. FOR ALL valid Escape_Timer states, elapsed-time updates while `playing` SHALL produce the configured 420 seconds minus elapsed whole seconds, never below zero, and SHALL trigger failure exactly when zero is reached.
2. FOR ALL Escape_State and event pairs, legal events SHALL produce the documented next state and illegal events SHALL leave the state unchanged.
3. FOR ALL permutations and repeated activations of the four clue identifiers, each clue SHALL count at most once and the total SHALL remain between zero and four.
4. FOR ALL sequences of demand answers, a demand SHALL count only after its exact answer is submitted, SHALL count at most once, and the Gate SHALL unlock if and only if all four clues and all three demands are complete.
5. FOR ALL timeout and gate activation event orders at the zero boundary, at most one terminal state SHALL be entered and success SHALL be impossible when remaining seconds equal zero.
6. THE project test command SHALL execute and pass every PBT_Property suite with at least 100 generated cases per property.

## Notes

- The escape duration is exactly 420 seconds (seven minutes); it is not configurable in the initial implementation.
- “The Demon” is an original, unseen antagonist. Its demands are fixed and solvable from the four clue texts.
- The visual reference is atmospheric only. The implementation must use original copy, puzzles, silhouette design, and assets.
- All interactive puzzle progress is in memory for one attempt. A page reload begins a fresh attempt; signup details remain in sessionStorage.

