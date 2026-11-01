# Requirements Document

## Introduction

The Upside Down Escape is a dual-dimension, Halloween-themed web application built for the Kiroween 2026 Hackathon (Costume Contest / Haunting UI track). The Site presents a polished, festive Halloween event landing page where users learn about and sign up for a Halloween event, enriched with Spline 3D elements and GSAP animations. Hidden at the bottom of the page is a tempting Trigger_Button that transports the user into a Stranger Things-inspired "Upside Down" dimension — a dark, eerie escape room where the user must discover clues and find the exit within a time limit. If the user fails to escape before the timer expires, a jumpscare plays. If the user escapes in time, they return to the Normal_Dimension with a rewarding success sequence.

The application prioritizes cinematic dimension transitions, rich animations, and a memorable, polished spooky UI that genuinely enhances the experience rather than decorating it. The two dimensions form one coherent product: the festive surface and the eerie underbelly of the same Halloween event.

## Glossary

- **Site**: The overall web application, encompassing both dimensions and all subsystems.
- **Normal_Dimension**: The Halloween-themed event landing page with festive design, Spline 3D elements, GSAP animations, event information, and the Signup_Form.
- **Upside_Down_Dimension**: The Stranger Things-inspired dark, eerie escape room experience where the user must discover clues and escape within the time limit.
- **Transition_System**: The subsystem responsible for the cinematic visual and audio transition between dimensions, in both directions.
- **Trigger_Button**: The animated, tempting button located at the bottom of the Normal_Dimension that initiates the dimension transition to the Upside_Down_Dimension.
- **Signup_Form**: The registration form on the Normal_Dimension that collects visitor information for the Halloween event.
- **Escape_Room**: The interactive environment within the Upside_Down_Dimension containing interactable objects, clues, and the exit.
- **Interactable_Object**: A clickable or tappable element within the Escape_Room that the user can inspect to reveal clues or flavor content.
- **Clue_System**: The subsystem that manages clue discovery, content display, and progress tracking within the Escape_Room.
- **Timer_System**: The countdown mechanism that limits the time the user has to escape the Upside_Down_Dimension.
- **Jumpscare_System**: The subsystem that plays a startling animation and audio effect when the user fails to escape within the time limit.
- **Success_State**: The state achieved when the user reaches the exit after collecting all required clues, returning them to the Normal_Dimension.
- **Failure_State**: The state triggered when the Timer_System reaches zero before the user escapes, initiating the Jumpscare_System.
- **Animation_Engine**: The collection of GSAP and Spline 3D animation components that drive visual effects across the Site.

## Requirements

### Requirement 1: Normal Dimension Landing Page Display

**User Story:** As a visitor, I want to land on a polished Halloween-themed event page, so that I am immediately immersed in the festive atmosphere and understand the event.

#### Acceptance Criteria

1. THE Normal_Dimension SHALL display a hero section containing the event title, an event description of no more than 200 characters, and a 3D animated element rendered via Spline.
2. THE Normal_Dimension SHALL display an event information section containing the event date, location, time, and event description.
3. THE Normal_Dimension SHALL display a signup section containing the Signup_Form.
4. WHEN a section of the Normal_Dimension enters the browser viewport, THE Animation_Engine SHALL trigger GSAP scroll-triggered animations that reveal that section with motion and fade effects.
5. THE Normal_Dimension SHALL apply a Halloween color palette consisting of orange, purple, and black across all sections, with accent colors applied to interactive elements.
6. IF the Spline 3D element fails to load, THEN THE Normal_Dimension SHALL display a static fallback image in the hero section.

### Requirement 2: Signup Form Functionality and Validation

**User Story:** As a prospective attendee, I want to fill out a signup form with validation, so that I can register for the Halloween event and receive confirmation.

#### Acceptance Criteria

1. THE Signup_Form SHALL collect a full name field with a maximum length of 100 characters, an email address field with a maximum length of 254 characters, and an optional plus-one count field with a value from 0 to 10.
2. WHEN the user submits the Signup_Form with an empty required field, THE Signup_Form SHALL display a field-specific validation error message adjacent to that field without submitting the form.
3. WHEN the user submits the Signup_Form with an email address that is missing a local part before an at symbol (@) or missing a domain part after the at symbol, THE Signup_Form SHALL display an email validation error message adjacent to the email field without submitting the form.
4. WHEN the user submits the Signup_Form with valid data, THE Signup_Form SHALL display a success confirmation message and clear all form fields.
5. WHEN the user submits the Signup_Form with an email address that has already been registered, THE Signup_Form SHALL display an error message indicating the email is already registered without clearing the form fields.
6. IF the Signup_Form submission fails due to a server or network error, THEN THE Signup_Form SHALL display an error message indicating the submission could not be completed and retain all entered form field values.

### Requirement 3: Dimension Transition Trigger

**User Story:** As a curious visitor, I want to discover and click a tempting hidden button, so that I can be transported into a hidden experience.

#### Acceptance Criteria

1. THE Normal_Dimension SHALL display the Trigger_Button at the bottom of the page below all primary content.
2. THE Trigger_Button SHALL render with a continuously repeating animated visual cue, such as a pulsing glow or animated text, without displaying explicit text describing the button's destination.
3. WHEN the user clicks the Trigger_Button, THE Site SHALL initiate the Transition_System and begin displaying the transition animation.
4. WHILE the Transition_System is active, THE Normal_Dimension SHALL disable all interactive controls except the transition animation surface.
5. WHEN the transition animation completes, THE Site SHALL render the Upside_Down_Dimension as the active visible dimension.
6. IF the Transition_System does not complete within 10 seconds, THEN THE Site SHALL complete the transition and render the Upside_Down_Dimension as the active visible dimension.

### Requirement 4: Cinematic Dimension Transition

**User Story:** As a user clicking the trigger button, I want to experience a cinematic transition between dimensions, so that the shift feels immersive and dramatic.

#### Acceptance Criteria

1. WHEN the user clicks the Trigger_Button, THE Transition_System SHALL play a full-screen forward transition animation lasting between 2 and 4 seconds.
2. WHILE a forward or reverse transition animation plays, THE Transition_System SHALL play an audio cue that begins within 200 milliseconds of the visual transition animation start and ends within 200 milliseconds of the visual transition animation end.
3. WHILE the Transition_System animation plays, THE Transition_System SHALL visibly darken and distort the source dimension visuals compared to their normal display state before revealing the destination dimension.
4. WHEN the forward transition animation completes, THE Site SHALL display the Upside_Down_Dimension and hide the Normal_Dimension.
5. WHEN the user completes the escape from the Upside_Down_Dimension, THE Transition_System SHALL play a reverse transition animation lasting between 2 and 4 seconds that returns the user to the Normal_Dimension.
6. IF the user clicks the Trigger_Button while a transition is already in progress, THEN THE Site SHALL ignore the click and not initiate a new transition.

### Requirement 5: Upside Down Escape Room Environment

**User Story:** As a trapped user, I want to explore a dark eerie environment, so that I can search for clues and find the exit.

#### Acceptance Criteria

1. THE Upside_Down_Dimension SHALL render an environment featuring particle effects, fog, and a color palette consisting of dark blue and grey tones, styled after the Stranger Things Upside Down aesthetic.
2. THE Escape_Room SHALL contain at least three Interactable_Objects that the user can click or tap to inspect.
3. WHILE the user has not discovered all required clues, THE Escape_Room SHALL keep the exit not visible and not interactive to the user.
4. WHILE the user is within the Upside_Down_Dimension, THE Upside_Down_Dimension SHALL play ambient audio.
5. THE Upside_Down_Dimension SHALL apply visual filters including vignette, film grain, and desaturation to the rendered environment.

### Requirement 6: Clue Discovery and Tracking

**User Story:** As a trapped user, I want to find and collect clues, so that I can solve the puzzle and escape.

#### Acceptance Criteria

1. WHEN the user interacts with an Interactable_Object that contains a clue, THE Clue_System SHALL display the clue content on screen and mark that clue as discovered by incrementing the discovered count in the clue tracker.
2. WHILE the user is within the Upside_Down_Dimension, THE Clue_System SHALL display a clue tracker indicating the total number of clues between 3 and 5 and the number of clues discovered so far, updating the discovered count each time a clue is discovered.
3. WHEN the user discovers all required clues, THE Clue_System SHALL unlock the exit so it becomes interactable.
4. WHEN a clue is discovered, THE Clue_System SHALL play a discovery audio cue lasting between 1 and 3 seconds.
5. WHEN the user interacts with an Interactable_Object that does not contain a clue, THE Clue_System SHALL display a non-clue flavor response that does not increment the discovered count in the clue tracker.

### Requirement 7: Escape Timer

**User Story:** As a trapped user, I want a visible countdown timer, so that I know how much time I have left to escape.

#### Acceptance Criteria

1. WHEN the Upside_Down_Dimension finishes loading, THE Timer_System SHALL start a countdown from a configurable initial time value defaulting to 300 seconds with a valid range of 60 to 600 seconds, decrementing at 1-second intervals, and display the remaining time on screen.
2. THE Timer_System SHALL display the remaining time in a minutes and seconds format, visible on screen at all times without being obscured by other content.
3. WHILE the remaining time is less than 10 seconds, THE Timer_System SHALL change the timer display color to red and apply a pulsing visual effect to the timer display.
4. WHEN the Timer_System reaches zero, THE Site SHALL trigger the Failure_State.
5. WHEN the user escapes the Upside_Down_Dimension, THE Timer_System SHALL stop the countdown and freeze the remaining time display.

### Requirement 8: Jumpscare Failure State

**User Story:** As a user who fails to escape, I want a startling failure sequence, so that the consequence of failing is impactful and memorable.

#### Acceptance Criteria

1. WHEN the Failure_State triggers, THE Jumpscare_System SHALL play an animation that covers 100% of the viewport width and height, begins within 500 milliseconds of the Failure_State trigger, and lasts between 1 and 3 seconds.
2. WHEN the Failure_State triggers, THE Jumpscare_System SHALL play an audio effect that begins within 200 milliseconds of the animation start and continues for the duration of the animation.
3. WHEN the Jumpscare_System animation completes, THE Site SHALL display a failure message indicating the escape attempt failed, and two simultaneously visible selectable options: one to retry the escape and one to return to the Normal_Dimension.

### Requirement 9: Escape Success State

**User Story:** As a user who escapes in time, I want to return to the normal dimension with acknowledgment, so that my success is rewarding.

#### Acceptance Criteria

1. WHEN the user reaches the exit after discovering all required clues, THE Site SHALL trigger the Success_State.
2. WHEN the Success_State triggers, THE Site SHALL display a success message for at least 3 seconds and play a success audio cue lasting between 3 and 5 seconds.
3. WHEN the Success_State triggers, THE Transition_System SHALL play a reverse transition animation lasting between 2 and 3 seconds and return the user to the Normal_Dimension upon animation completion.
4. IF the transition animation fails to complete, THE Site SHALL display an error message and retain the user in the current dimension.

### Requirement 10: Responsive Design

**User Story:** As a user on any device, I want the Site to adapt to my screen size, so that I can experience both dimensions on mobile and desktop.

#### Acceptance Criteria

1. THE Site SHALL render the Normal_Dimension with no horizontal scrolling and no horizontal content overflow at viewport widths from 320px to 1920px.
2. THE Site SHALL render the Upside_Down_Dimension Interactable_Objects and exit as tappable on touch devices and clickable on pointer devices.
3. THE Site SHALL maintain a minimum text size of 16 pixels, tappable target sizes of at least 44 by 44 pixels, and a layout with no overlapping element bounding boxes at all supported viewport widths.

### Requirement 11: Accessibility

**User Story:** As a user with accessibility needs, I want the Site to be navigable and perceivable, so that I can use it regardless of ability.

#### Acceptance Criteria

1. THE Site SHALL provide text alternatives that describe the content or purpose of all non-decorative images and 3D elements.
2. THE Site SHALL make the Signup_Form, the Trigger_Button, and every Escape_Room Interactable_Object reachable via keyboard Tab navigation, activatable via the Enter key or the Space key, and display a visible focus indicator when each element receives keyboard focus.
3. THE Site SHALL maintain a minimum color contrast ratio of 4.5:1 for body text against its background.
4. WHILE audio plays, THE Site SHALL provide a mute control that remains visible and functional in both the Normal_Dimension and the Upside_Down_Dimension, where activating the mute control silences all Site audio and the muted state persists across dimension transitions.

### Requirement 12: Performance

**User Story:** As a user, I want smooth animations and fast load times, so that the experience feels polished and immersive.

#### Acceptance Criteria

1. WHEN the user navigates to the Site, THE Site SHALL display the initial Normal_Dimension hero content within 3 seconds on a connection with a minimum download speed of 10 Mbps.
2. WHILE scroll animations or the dimension transition are playing, THE Animation_Engine SHALL maintain a frame rate of at least 30 frames per second.
3. THE Site SHALL lazy-load 3D and animation assets that are not visible in the initial viewport to prioritize initial page render.
4. WHILE the user is within the Normal_Dimension, THE Jumpscare_System SHALL preload its animation and audio assets.
5. WHEN the Failure_State triggers, THE Jumpscare_System SHALL begin playback of the preloaded animation and audio within 100 milliseconds of the trigger.

### Requirement 13: State Management and Routing

**User Story:** As a developer, I want clear state management for dimension transitions, so that the application behaves predictably across both dimensions.

#### Acceptance Criteria

1. THE Site SHALL maintain a current dimension state with two values: "normal" and "upside-down", defaulting to "normal" on initial page load.
2. WHEN the user triggers a dimension transition, THE Site SHALL update the current dimension state and update the URL to identify the current dimension without performing a full page reload.
3. WHEN the user reloads the page while in the Upside_Down_Dimension, THE Site SHALL reset to the Normal_Dimension by default.
4. THE Site SHALL preserve the Signup_Form submission state across dimension transitions, so that when the user returns to the Normal_Dimension, a previously completed registration is still recognized as already registered.
