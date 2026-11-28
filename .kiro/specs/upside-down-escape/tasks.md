# Implementation Plan

## Overview

This plan tracks the Upside_Down_Escape described in `requirements.md` and `design.md`: the other side of Nocturne Night, on the same page as the invitation. It covers the canvas Title_Sequence with the Arrival_Music, the Go deeper transition, the standalone title video page, and the Underside, from its nine Beats and six Locks to its two endings.

It replaces the earlier plan for a seven-minute "Trench of Horror" clue hunt, which was not built.

## Tasks

- [x] 1. Hand off from the invitation on the same page
  - [x] 1.1 Add `beginTheOtherSide()` to `www/js/arrival.js`
    - Run once; clear transforms and filters on `<html>` and `<body>`; add `is-other-side`; show `#other-side`; start the title and the music
    - The invitation imports it on the third valid submission; `?descend` calls it on load
    - _Requirements: 2.1, 5.4_
  - [x] 1.2 Keep the standalone title video page
    - `www/escape.html` plays local WebM/MP4, muted and inline, with Skip intro; it continues to `./index.html?descend` on end, skip, error, rejected autoplay, or reduced motion
    - _Requirements: 5.1–5.3_

- [x] 2. Build the canvas Title_Sequence
  - [x] 2.1 Write the pure schedule and camera maths in `www/js/logic/title-sequence.js`
    - Black opening, fade-in, five hard-cut close-ups, a 12 s pull-back, letters sliding into place, and an indefinite hold with a pulse
    - _Requirements: 2.2–2.4_
  - [x] 2.2 Draw the neon title in `www/js/title-sequence.js`
    - Red outline-only strokes with fake depth of field, quarter-size bloom, cached grain tile, vignette, and haze
    - _Requirements: 2.9, 13.4_
  - [x] 2.3 Keep the title on the wall clock
    - Derive frames from the start time; redraw on visibility return; fire the settle with a timer so it also happens while hidden
    - _Requirements: 2.5_
  - [x] 2.4 Show the Finale under the settled title
    - Fade in the message and the Go deeper button; position them from `--title-bottom`; let the message wrap evenly on narrow screens
    - _Requirements: 2.4_
  - [x] 2.5 Add Skip intro
    - Fade the shot out, jump to 6 s before the title resolves, fade back in; fade the button out and move focus to Go deeper if needed
    - _Requirements: 2.6, 2.7_
  - [x] 2.6 Support reduced motion
    - Draw only the resolved title and show the Finale at once
    - _Requirements: 2.8_
  - [x]* 2.7 Write tests for the title schedule
    - `tests/landing.test.js`: cut times, the 25 s settle, `masterAlpha` bounds, and the skip jump target
    - _Requirements: 2.2, 2.3, 2.6, 15.1_

- [x] 3. Add the Arrival_Music and sound toggle
  - Play `www/audio/kiroween-audio.mp3` once on the other side; fall back to muted playback and unmute on the first interaction outside the toggle
  - Round icon-only toggle (speaker with waves or with a cross), accessible name "Mute" with `aria-pressed`, "Replay sound" after the track ends, no tooltip
  - _Requirements: 3.1–3.5_

- [x] 4. Build the Go deeper transition
  - Fade the music out and hide the toggle; run the invitation's `glitch()` and `shake(3)` on the title element at the same time; then the 1.1 s CSS turn-over; then start the Underside
  - Skip the glitch and shake under reduced motion; use CSS fallbacks without GSAP; no full-screen request; Gentle_Mode only through reduced motion
  - _Requirements: 3.6, 4.1–4.7_

- [x] 5. Build the Underside structure
  - [x] 5.1 Write the pure rules in `www/js/logic/underside.js`
    - Beats, dread, scroll speed limit, gates, backtrack detection, hold progress, clocks and formats, flash limiter, scare gate
    - _Requirements: 6.1, 6.3–6.5, 10.1, 10.2_
  - [x] 5.2 Wire the scroll track and beats in `www/js/underside/main.js`
    - Scroll up to go deeper, capped speed, locks that block scrolling, dread-driven color and sound, the backtrack scare, and the Leave link
    - _Requirements: 6.1–6.7_
  - [x] 5.3 Add the overlays
    - Heartbeat corners with an audible heartbeat, blood that drips with dread and splatters on splat sounds, cracks where the hammer lands
    - _Requirements: 11.1–11.3_

- [x] 6. Build the six Locks and the set-pieces
  - [x] 6.1 hall: click the host's portrait in the 3D corridor (`gallery-hall.js`)
    - _Requirements: 7.1_
  - [x] 6.2 tape: STOP three times, then EJECT, in the 3D CRT room (`crt-room.js`, `tapes.js`)
    - _Requirements: 7.2_
  - [x] 6.3 nursery: hold to wind the music box three times; the doll changes and comes closer (`doll.js`)
    - _Requirements: 7.3_
  - [x] 6.4 rooms: three doors; the radio points left, the right door opens; wrong doors bring the hammer or a gore scene
    - _Requirements: 7.4_
  - [x] 6.5 leave: the "leave the party?" dialog with Stay / Stay and a dodging ×
    - _Requirements: 7.5_
  - [x] 6.6 hallway: the figure closes in between cuts and offers its arm with Take it (`creatures.js`)
    - _Requirements: 7.7_
  - [x] 6.7 devil: type your signup name to cancel your RSVP; a wrong name brings the hammer, gore, and −30 s (`devil.js`)
    - _Requirements: 7.6, 14.1_
  - [x] 6.8 exit: hold to escape with the pointer or Space
    - _Requirements: 7.8_
  - [x] 6.9 3D scenes with three.js: the cake stab with the scanned head (`stab-scene.js`) and low-poly gore scenes (`massacre.js`), loaded on demand and skipped in Gentle_Mode
    - _Requirements: 1.1, 1.2, 10.3_

- [x] 7. Build the Party_Clock and endings
  - [x] 7.1 Count down 10 minutes (plus 2 in Gentle_Mode), never below zero, ending once; support `?time=SECONDS` (10 to 900)
    - _Requirements: 8.1–8.3_
  - [x] 7.2 Play the time-out finale, or the text-only ending in Gentle_Mode
    - _Requirements: 8.4, 8.5_
  - [x] 7.3 Show the Outside_Page after an escape: upright turn, focus on the heading, escaped flag, and one final scare after 6.5 s outside Gentle_Mode
    - _Requirements: 9.1–9.3_

- [x] 8. Add sound and voices
  - Synthesize music and effects with Web Audio, following dread; play the 14 recorded voice MP3s through Web Audio with live processing; fall back to speech synthesis; continue silently without Web Audio
  - _Requirements: 11.4–11.6_

- [x] 9. Apply safety and Gentle_Mode
  - Route every flash (including the hammer) through the flash limiter and every jumpscare through the scare gate
  - Gentle_Mode: no jumpscares, hammer, gore, or flashes; quieter audio; 2 extra minutes
  - Keep blood dark red, keep text above overlays, clear blood, cracks, and scratches within seconds
  - _Requirements: 10.1–10.5_

- [x] 10. Keep content and assets original and documented
  - Copy in `www/js/content.js` (`underside`), cards of eight words or fewer
  - Public-domain, CC0, or team-generated images, the scanned head model, and the voice files, all listed in `ASSETS.md`
  - _Requirements: 12.1–12.3_

- [x] 11. Tune performance
  - Adaptive canvas resolution, cached noise tiles, `--dread` in 2% steps, opacity-only heartbeat corners, no per-frame `shadowBlur`
  - _Requirements: 13.1–13.3_

- [x] 12. Add tests and developer tools
  - `tests/underside.test.js` (19 tests) runs with `npm test`; `?debug` exposes `window.__underside`
  - _Requirements: 15.1–15.3_

## Deferred

This task was left out of this version on purpose, and still needs doing.

- **13 Full play-through checkpoint.** `npm test` passes. The full walkthrough (every Lock, both endings, a hidden tab during the title, Skip intro, reduced motion), keyboard-only play, a screen-reader pass, and contrast checks are left as a manual check before submission. Use `?time=` for a short clock and `?debug` to open locks. _Requirements: 2.5–2.8, 4.4, 9.2, 10.3, 15.1, 16.1–16.3_

## Notes

- Tasks marked with `*` are optional (tests).
- The Underside's story order, lock answers, and safety rules are also summarized in `.kiro/steering/underside.md`; keep the two in step.
- Spline is optional and currently unused: all `SPLINE_SCENES` slots are empty.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "5.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3", "5.2", "8"] },
    { "id": 2, "tasks": ["2.4", "2.5", "2.6", "2.7", "5.3", "6.1", "6.2", "6.3"] },
    { "id": 3, "tasks": ["4", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "9", "10", "11"] },
    { "id": 5, "tasks": ["12"] }
  ]
}
```
