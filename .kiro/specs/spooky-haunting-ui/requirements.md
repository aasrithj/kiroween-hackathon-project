# Requirements Document

## Introduction

Haunted_Page is a haunted Halloween event landing and signup page built for the Kiroween 2026 "Costume Contest" category. The category asks for a haunting user interface that is polished and unforgettable, with spooky design elements that enhance the app's function. Here, the haunting is the feedback system, not decoration: the page begins eerie but calm, and grows more unsettled as the visitor descends toward the Signup_Form at the bottom and fills it in. Field status, validation messages, and progress are all expressed through spooky elements (flickering candles, whispers, fog) so the theme directly serves the signup task.

The visual and motion quality target is bold typography, smooth easing, staggered reveals, and scroll-driven atmosphere. The first two valid submissions trigger escalating shakes and distinct messages. The third produces a restrained glitch, fades the screen to black, and transports the visitor to the arrival screen for the separate escape experience.

The web experience is built with HTML, CSS, JavaScript, and GSAP. It has no web UI framework, CSS utility library, or bundler requirement. Capacitor 8 provides an optional native Android/iOS wrapper and packages an unchanged copy of the static web assets from `www/`. Development follows Kiro's spec-driven workflow with steering files, automation hooks, and property-based testing of the pure-function logic.

## Glossary

- **Haunted_Page**: The haunted landing and signup page system described in this document.
- **Landing_Experience**: The single scrolling page composed of the Hero_Section, the Details_Section, and the Signup_Section, in that order from top to bottom.
- **Hero_Section**: The first full-viewport section containing the event title and an invitation to scroll.
- **Details_Section**: The section between the Hero_Section and the Signup_Section presenting the Halloween event information.
- **Signup_Section**: The final section at the bottom of the Landing_Experience that contains the Signup_Form.
- **Signup_Form**: The form in the Signup_Section where a Registrant enters Signup_Details.
- **Registrant**: A visitor interacting with the Signup_Form.
- **Signup_Details**: The Registrant's full name and email address.
- **Haunting_Level**: An integer from 0 to 100 measuring how haunted the interface currently is, derived from scroll progress and Signup_Form completion.
- **Ambient_Effect**: A continuous decorative haunting element such as fog, flickering light, or drifting spectral shapes.
- **Glitch_Sequence**: The staged, intentional glitching error that plays after a valid Signup_Form submission.
- **Valid_Attempt**: A form submission whose name and email both pass validation; invalid submissions do not increment the crossing count.
- **Escape_Destination**: The separate page or experience the Registrant is transported to, defined in its own spec.
- **Handoff**: The navigation from the Haunted_Page to the Escape_Destination.
- **Secret_Message_Button**: A discreet interactive element on the Landing_Experience that reveals a hidden message.
- **GSAP_Timeline**: A GSAP animation sequence.
- **Steering_Guide**: A Kiro steering file that codifies development conventions.
- **PBT_Property**: A property-based test specification verifying a pure-function invariant.
- **Kiro_Hook**: A Kiro automation hook that runs an agent prompt or command on a development event.
- **Spec_Workflow**: The Kiro requirements, design, and tasks spec-driven development process.

## Requirements

### Requirement 1: Technology Constraints

**User Story:** As a developer, I want the project built only with HTML, CSS, JavaScript, and GSAP, so that it stays lightweight, dependency-minimal, and easy to run anywhere.

#### Acceptance Criteria

<<<<<<< HEAD
1. THE Haunted_Page web UI SHALL be implemented using only HTML, CSS, JavaScript, and GSAP (including GSAP plugins), with visuals created from HTML elements, CSS, and inline SVG; Capacitor may wrap the unchanged web UI for native Android and iOS builds.
=======
1. THE Haunted_Page SHALL be implemented using only HTML, CSS, JavaScript, and GSAP (including GSAP plugins), with visuals created from HTML elements, CSS, and inline SVG; the built-in Web Audio API MAY synthesize interaction sounds without adding a runtime dependency.
>>>>>>> f0244bd470db10f735d1188681264ee56e46ef39
2. THE Haunted_Page SHALL NOT depend on React, Next.js, Tailwind CSS, Three.js, Spline, or any other UI framework, CSS framework, or 3D library.
3. THE Haunted_Page SHALL run as static files served from a plain web server, with no build step required to run it.
4. THE Haunted_Page SHALL load GSAP and each GSAP plugin it uses from a single declared source (a vendored local file or a pinned CDN URL) recorded in the project documentation.
5. WHEN native packaging is requested, THE project SHALL keep the editable static web assets in the configured Capacitor `webDir` and synchronize them with the Android and iOS projects without introducing a web framework or bundler.
5. THE Haunted_Page SHALL structure its JavaScript as plain ES modules, with the pure-function logic (Haunting_Level, validation, sequence ordering) separated from DOM and GSAP code.

### Requirement 2: Landing Experience and Visual Design

**User Story:** As a visitor, I want a polished and unforgettable haunted page, so that the event feels exciting and the interface leaves a lasting impression.

#### Acceptance Criteria

1. THE Haunted_Page SHALL present the Landing_Experience as one vertically scrolling page whose Signup_Section is the last section at the bottom.
2. THE Haunted_Page SHALL define a consistent spooky design language using CSS custom properties for color, typography, spacing, and easing, with a dark base palette and no more than three accent colors.
3. THE Haunted_Page SHALL use large, high-impact typography in the Hero_Section and reveal its text with a staggered GSAP_Timeline when the page loads.
4. WHEN a section of the Landing_Experience enters the viewport, THE Haunted_Page SHALL reveal that section's content with a scroll-triggered GSAP animation.
5. THE Haunted_Page SHALL render at least two parallax layers of Ambient_Effect elements (for example fog and spectral shapes) that move at different rates as the Registrant scrolls.
6. THE Haunted_Page SHALL remain fully usable at viewport widths from 320 px to 1920 px without horizontal scrolling.
7. THE Haunted_Page SHALL keep the Hero_Section eerie but calm, so that the Haunting_Level at the top of the page is lower than at the Signup_Section.

### Requirement 3: GSAP Animation System

**User Story:** As a visitor, I want smooth, deliberate spooky animations, so that every interaction feels polished and cinematic.

#### Acceptance Criteria

1. THE Haunted_Page SHALL drive all non-trivial animation (entrance, scroll reveals, Ambient_Effect motion, both escalating shakes, final Glitch_Sequence, and Handoff) through GSAP_Timelines.
2. THE Haunted_Page SHALL complete each non-looping GSAP_Timeline within 2000 milliseconds; the final Handoff SHALL complete within 600 milliseconds.
3. THE Haunted_Page SHALL animate only the CSS properties transform and opacity, plus filter where required for the Glitch_Sequence, so that animation stays on the compositor where possible.
4. WHEN the Haunting_Level increases, THE Haunted_Page SHALL play a GSAP_Timeline that visibly intensifies the Ambient_Effect elements.
5. THE Haunted_Page SHALL kill or pause every looping GSAP_Timeline when its elements are off-screen or the browser tab is hidden, and resume it when they return.
6. THE Haunted_Page SHALL create each GSAP_Timeline through a single shared animation module so that durations and easing values are defined in one place.

### Requirement 4: Haunting as Function

**User Story:** As a visitor, I want the spooky effects to tell me where I am and how my signup is going, so that the haunting helps me instead of getting in the way.

#### Acceptance Criteria

1. THE Haunted_Page SHALL compute the Haunting_Level as an integer from 0 to 100 equal to the sum of 60 multiplied by scroll progress (a value from 0 to 1) and 40 multiplied by the ratio of valid Signup_Form fields to total Signup_Form fields, rounded to the nearest integer and capped at 100. Scroll progress SHALL reach 1 when the footer first enters the bottom of the viewport.
2. THE Haunted_Page SHALL display the current Haunting_Level to the Registrant at all times, using at least one non-color cue (for example a numeric value or a number of lit candles).
3. WHILE the Haunting_Level is greater than 75, THE Haunted_Page SHALL render all Ambient_Effect elements and apply at least one additional visual effect not present at a Haunting_Level of 75 or below.
4. WHEN the Haunting_Level increases, THE Haunted_Page SHALL increase both the count and the motion speed of Ambient_Effect elements, such that both values at a Haunting_Level of 100 are greater than at a Haunting_Level of 1.
5. WHEN a Signup_Form field becomes valid, THE Haunted_Page SHALL show that state through a spooky status indicator (for example a candle that lights) in addition to any color change.
6. WHEN the third valid Signup_Form submission occurs, THE Haunted_Page SHALL set the Haunting_Level to 100.
7. WHEN the Registrant scrolls to immediately above the footer with no valid fields, THE Haunted_Page SHALL reach a Haunting_Level of 60. On viewports narrower than 641 px, THE Signup_Section SHALL provide additional bottom spacing as a comfortable scroll runway.

### Requirement 5: Signup Form

**User Story:** As a visitor, I want to enter my details at the bottom of the page and sign up, so that I can register for the Halloween event.

#### Acceptance Criteria

1. THE Haunted_Page SHALL place the Signup_Form in the Signup_Section at the bottom of the Landing_Experience.
2. THE Signup_Form SHALL contain a full name field, an email field, and a signup button, each with a visible text label.
3. IF a Registrant submits the Signup_Form with an empty name, a name longer than 100 characters, or an email that is not a syntactically valid email address, THEN THE Haunted_Page SHALL reject the submission, display a themed error message next to each invalid field, and move keyboard focus to the first invalid field.
4. WHEN a Registrant leaves a field, THE Haunted_Page SHALL validate that field and display or clear its themed error message accordingly.
5. WHEN a Registrant submits invalid Signup_Details, THE Haunted_Page SHALL play one brief, quiet, synthesized error cue per rejected submission, regardless of the number of invalid fields.
6. WHEN a Registrant submits valid Signup_Details for the first or second time, THE Haunted_Page SHALL play an escalating screen shake and announce distinct themed copy, then allow another valid submission.
7. WHEN a Registrant submits valid Signup_Details for the third time, THE Haunted_Page SHALL store the details, play the final Glitch_Sequence, darken the screen, and navigate to the Escape_Destination. While any attempt animation is active, THE Haunted_Page SHALL disable the signup button and ignore further submissions.
8. Invalid submissions SHALL NOT increment the valid-attempt count. THE Haunted_Page SHALL store Signup_Details in sessionStorage under a single documented key on the third valid submission and SHALL NOT transmit them to any server.

### Requirement 6: Final Glitch and Crossing

**User Story:** As a visitor, I want repeated valid signup requests to receive escalating supernatural responses, so that the third request feels like a crossing into another place.

#### Acceptance Criteria

1. WHEN the third valid submission starts the Glitch_Sequence, THE Haunted_Page SHALL play a GSAP_Timeline that visibly glitches the interface using restrained horizontal jitter, scanline movement, and brief blocky pixel-tear fragments.
2. THE Haunted_Page SHALL display a themed error message during the Glitch_Sequence, with its copy defined in one content module, and SHALL present it as an intentional part of the experience rather than a technical failure.
3. THE Haunted_Page SHALL complete the Glitch_Sequence within 2000 milliseconds of starting it.
4. WHEN the third-attempt Glitch_Sequence completes, THE Haunted_Page SHALL darken the entire viewport as the final Handoff transition.
5. THE Haunted_Page SHALL keep each attempt message visible until the visitor's next action, and SHALL keep the final glitch message visible until the dark transition begins.
6. THE Haunted_Page SHALL NOT produce more than three flashes in any one-second period and SHALL NOT flash large areas of saturated red at any time.

### Requirement 7: Transport to the Escape

**User Story:** As a visitor, I want to be pulled from the page into the next experience, so that the haunting feels like a continuous story.

#### Acceptance Criteria

1. WHEN the third-attempt Handoff completes, THE Haunted_Page SHALL navigate the browser to the Escape_Destination.
2. THE Haunted_Page SHALL define the Escape_Destination location in a single configuration constant so that it can be changed without editing the sequence logic.
3. WHEN the Handoff begins, THE Haunted_Page SHALL play a transition GSAP_Timeline of at most 600 milliseconds before navigating.
4. THE Haunted_Page SHALL begin the Handoff within 3000 milliseconds after the third valid Signup_Form submission when no reduced-motion preference is enabled.
5. IF the browser restores the Haunted_Page from the back-forward cache after a Handoff, THEN THE Haunted_Page SHALL show the calm initial state and SHALL NOT replay the Glitch_Sequence automatically.
6. THE initial Escape_Destination SHALL show only an atmospheric arrival state; its playable clue hunt remains defined by the Upside_Down_Escape spec.
7. WHEN the third valid submission starts the final transition, THE Haunted_Page SHALL play a brief original supernatural synth cue generated with Web Audio, not a recording or recreation of copyrighted Stranger Things music. It SHALL start in the submit interaction and be shortened for reduced-motion users.
8. IF Web Audio is unavailable or cannot resume, THEN THE Haunted_Page SHALL complete the Handoff silently without disrupting navigation.

### Requirement 8: Secret Message Button

**User Story:** As a curious visitor, I want to discover a hidden button that reveals a secret message, so that the page rewards exploration.

#### Acceptance Criteria

1. THE Haunted_Page SHALL include a Secret_Message_Button in the Landing_Experience that is visually discreet but reachable by pointer and keyboard.
2. WHEN a Registrant activates the Secret_Message_Button, THE Haunted_Page SHALL reveal a hidden message with a GSAP_Timeline of at most 2000 milliseconds.
3. THE Haunted_Page SHALL define the hidden message copy in the same content module as the other themed copy.
4. WHEN the hidden message is open and the Registrant activates the Secret_Message_Button again or presses the Escape key, THE Haunted_Page SHALL close the message and return keyboard focus to the Secret_Message_Button.
5. THE Haunted_Page SHALL announce the revealed message to screen readers when it appears.

### Requirement 9: Performance

**User Story:** As a visitor, I want the haunting to stay smooth, so that the experience feels polished on ordinary devices.

#### Acceptance Criteria

1. WHILE all Ambient_Effect elements and one GSAP_Timeline are active, THE Haunted_Page SHALL maintain a sustained frame rate of at least 60 frames per second on a mid-range laptop-class device.
2. WHILE a network connection with a minimum download speed of 25 Mbps is available, WHEN the Registrant initiates loading the Haunted_Page, THE Haunted_Page SHALL render the Hero_Section within 3 seconds.
3. THE Haunted_Page SHALL limit the number of simultaneously animated Ambient_Effect elements to a documented maximum, and SHALL reduce that number on viewports narrower than 768 px.
4. THE Haunted_Page SHALL load GSAP and all page assets without blocking first paint of the Hero_Section.

### Requirement 10: Accessibility

**User Story:** As a visitor with diverse needs, I want the haunting to respect my preferences, so that the page stays usable and safe for me.

#### Acceptance Criteria

1. WHERE a Registrant has a reduced-motion preference enabled, THE Haunted_Page SHALL render Ambient_Effect elements without continuous motion and SHALL replace the Glitch_Sequence with a static, non-flashing error state.
2. WHERE a Registrant has a reduced-motion preference enabled, THE Haunted_Page SHALL complete each GSAP_Timeline within at most 300 milliseconds.
3. THE Haunted_Page SHALL provide keyboard navigation for every interactive element, so that each element is reachable via keyboard focus, operable via keyboard activation, and shows a visible focus indicator when focused.
4. THE Haunted_Page SHALL maintain a color contrast ratio of at least 4.5:1 for all text content at every Haunting_Level and during the Glitch_Sequence and Handoff.
5. WHERE a Registrant operates a screen reader, WHEN the Haunting_Level crosses 75, a validation error appears, the Glitch_Sequence starts, or the Handoff begins, THE Haunted_Page SHALL announce the change through an ARIA live region.
6. THE Haunted_Page SHALL use semantic HTML (landmarks, headings in order, labeled form controls) so that the page structure is exposed to assistive technology.
7. THE Haunted_Page SHALL warn the Registrant before any strobing or flashing effect and SHALL provide a way to skip the animated Glitch_Sequence.

### Requirement 11: Kiro Spec-Driven Development

**User Story:** As a developer, I want the project to follow the Kiro Spec_Workflow, so that development is structured and reviewable.

#### Acceptance Criteria

1. THE Haunted_Page SHALL be developed from a requirements.md, a design.md, and a tasks.md that follow the Kiro Spec_Workflow.
2. WHEN transitioning between Spec_Workflow phases (requirements, design, tasks), THE Haunted_Page SHALL pass spec document format validation, reporting no errors.
3. THE Haunted_Page SHALL implement only features where each feature traces to at least one acceptance criterion defined in requirements.md.
4. IF spec document format validation reports errors, THEN THE Haunted_Page SHALL block the phase transition and remain in the current Spec_Workflow phase.

### Requirement 12: Kiro Automation Hooks

**User Story:** As a developer, I want automation hooks that guard code quality, so that errors are caught during development.

#### Acceptance Criteria

1. WHEN a developer saves a landing-page, arrival-page, related JavaScript, README, or governing Kiro spec/steering file, a PostFileSave Kiro_Hook SHALL review the nightometer footer threshold and three-attempt transition against the project requirements.
2. THE Kiro_Hook SHALL report concrete mismatches without modifying files automatically or running an undeclared test/linter command.
3. THE Haunted_Page SHALL define project Kiro_Hook configurations in `.kiro/hooks/` using Kiro's supported JSON hook format.
4. THE PostFileSave Kiro_Hook SHALL check the reduced-motion and missing-GSAP behavior and SHALL confirm that the arrival page does not start the future puzzle-game mechanics.

### Requirement 13: Kiro Steering Guides

**User Story:** As a developer, I want steering files that codify conventions, so that the codebase stays consistent and on-theme.

#### Acceptance Criteria

1. THE Haunted_Page SHALL include a Steering_Guide defining the spooky design language, covering color tokens, typography, motion principles (easing and duration ranges), and component appearance standards.
2. THE Haunted_Page SHALL include a Steering_Guide with concrete, checkable rules for code structure, file naming, CSS naming, and testing conventions, including the rule that no framework or CSS utility library may be added.
3. WHEN a source file is created or modified, THE Haunted_Page SHALL follow the Steering_Guide conventions such that the project linter reports zero violations.

### Requirement 14: Property-Based Testing

**User Story:** As a developer, I want the pure-function logic verified by property-based tests, so that the haunting behavior is provably correct.

#### Acceptance Criteria

1. FOR ALL pairs of inputs where scroll progress and valid-field count are each greater than or equal to the other pair's values, THE Haunted_Page SHALL compute a Haunting_Level that is greater than or equal to the other pair's Haunting_Level.
2. FOR ALL inputs, THE Haunted_Page SHALL compute a Haunting_Level that is an integer between 0 and 100 inclusive.
3. FOR ALL strings, THE Haunted_Page SHALL validate Signup_Details deterministically, accepting a name of 1 to 100 characters with a valid email and rejecting every other combination.
4. FOR ALL sequences of submit actions, THE Haunted_Page SHALL count only valid submissions, play at most two shakes, and perform the Glitch_Sequence and Handoff at most once on the third valid submission.
5. FOR ALL sequence runs, THE Haunted_Page SHALL order the phases as first shake, second shake, final Glitch_Sequence, then Handoff, applying reduced-motion behavior when that preference is enabled.
6. FOR ALL Signup_Details, storing them to sessionStorage and reading them back SHALL produce equivalent Signup_Details.
7. THE Haunted_Page SHALL execute and pass every PBT_Property suite as part of the project test command.
