---
inclusion: always
---

# Code conventions

- Use static HTML, CSS, and browser JavaScript ES modules, with no build step. The approved runtime libraries are: GSAP 3 (local `www/gsap.min.js`), three.js r187 (vendored in `www/vendor/three/`), Lenis smooth scrolling (pinned unpkg URL in `www/index.html`), and the optional Spline runtime (pinned unpkg URL, loaded lazily by `www/js/underside/spline-layer.js` only when a scene URL is set in `SPLINE_SCENES`). Capacitor 8 is allowed as the native Android/iOS wrapper.
- Do not add a web UI framework, CSS utility library, bundler, or any runtime dependency beyond the approved list above. Import three.js only from `www/vendor/three/`, never from a CDN.
- Keep the editable web app in `www/`: page entry at `www/index.html`, global styling in `www/style.css`, Underside styling in `www/underside.css`, browser entry in `www/script.js`, the other side's entry in `www/js/arrival.js`, and pure functions under `www/js/logic/`.
- Put configuration and themed copy in `www/js/config.js` and `www/js/content.js`.
- Put all GSAP timeline creation in `www/js/anim/timelines.js`; keep DOM wiring in the entry/UI layer. Keep the signup sequence reducer independent from DOM and animation code.
- Keep canvas drawing for the title sequence in `www/js/title-sequence.js` and its pure timing and camera maths in `www/js/logic/title-sequence.js`. Keep the Underside in `www/js/underside/`, with its pure rules in `www/js/logic/underside.js`.
- Use lower-case kebab-case for CSS classes and descriptive semantic HTML nesting. Prefer one clear parent per visual group.
- Use named exports, `const` by default, and pure functions for validation, progress calculation, sequence transitions, and Underside rules.
- All non-decorative images need alternative text. Controls need labels, keyboard support, and visible focus. Honor reduced motion.
- Keep the `www/escape.html` title video's WebM/MP4 sources local under `www/videos/`; handle `ended`, media errors, rejected autoplay, skip, and reduced motion so the visitor always continues to `./index.html?descend`. Keep the video muted.
- Keep native metadata in root `capacitor.config.json` with `webDir: "www"`. Edit `www/` as the single web source of truth; `npm run cap:sync` copies it into the native projects. Preserve relative asset paths and do not maintain a second root copy of web files.
- Signup details must remain local to the browser session; do not transmit them.
- Count only valid invitation submissions toward the three-attempt crossing. The first two unlock the form after their shakes; the third stores details and hands off on the same page to the title sequence (`beginTheOtherSide()` in `www/js/arrival.js`), without navigating away.
- Keep audio files local: the arrival music in `www/audio/` and recorded voice lines in `www/assets/underside/voice/`. Document the source and license of every audio and image asset in `ASSETS.md`. Do not stream sound from a CDN.
- Add tests for pure logic to `tests/` and run them with `npm test` (Node's built-in test runner).
