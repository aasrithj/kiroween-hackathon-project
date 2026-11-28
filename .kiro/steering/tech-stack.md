---
inclusion: always
---

# Tech stack

- Static HTML in `www/index.html` (the whole experience) and `www/escape.html` (a standalone title-video page that redirects to `./index.html?descend`)
- CSS custom properties and responsive CSS in `www/style.css` and `www/underside.css`
- Plain browser JavaScript ES modules under `www/js/`, plus the entry scripts `www/script.js` and `www/haunting-fallback.js`
- GSAP 3.15 at `www/gsap.min.js` (local file, no plugins)
- three.js r187 vendored in `www/vendor/three/` with the GLTFLoader, BufferGeometryUtils, and SkeletonUtils addons; used by the 3D gallery hall, CRT room, cake stab scene, and gore scenes in the Underside
- Lenis 1.3.27 smooth scrolling, loaded from unpkg in `www/index.html` (script and stylesheet)
- Optional 3D: `@splinetool/runtime` 2.0.224 from unpkg, loaded only when `SPLINE_SCENES` in `www/js/config.js` has a URL (all slots are currently empty)
- Google Fonts: Outfit (body and UI), Playfair Display (headings and the neon title), VT323 and Caveat (Underside cards and notes)
- Browser APIs: sessionStorage, IntersectionObserver, requestAnimationFrame, matchMedia, native dialog, Canvas 2D, WebGL (through three.js), Web Audio, and speech synthesis
- Sound: the arrival music is a local MP3 in `www/audio/` played by an `<audio>` element with an icon-only sound toggle. The Underside synthesizes music and effects with Web Audio, plays 14 recorded voice MP3s from `www/assets/underside/voice/` through Web Audio, and falls back to browser speech synthesis.
- Video: `www/escape.html` plays local WebM and MP4 sources from `www/videos/` with native playback
- No web UI framework, CSS framework, or bundler; the source remains directly runnable as static files
- Capacitor 8 is the native application wrapper only (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, and `@capacitor/cli`); `www/` is both the web source and the configured native `webDir`
- Hosting: GitHub Pages, deployed from `www/` by `.github/workflows/deploy.yml` on every push to `main`
- Local server: `npm start` (`scripts/serve.mjs`, serves `www/`)
- Tests: `npm test` (Node's built-in test runner, no dependencies): `tests/landing.test.js` for the invitation and title sequence, `tests/underside.test.js` for the Underside

## Architecture

- Pure calculations and state transitions live in `www/js/logic/` (`haunting.js`, `validation.js`, `sequence.js`, `title-sequence.js`, `underside.js`).
- Configuration and copy live in `www/js/config.js` and `www/js/content.js`.
- Shared GSAP timeline factories live in `www/js/anim/timelines.js`.
- `www/script.js` wires the invitation: browser events, form behavior, accessibility, and visual state. `www/haunting-fallback.js` keeps the invitation working when the modules fail to load.
- `www/js/arrival.js` runs the other side on the same page: the canvas title sequence (`www/js/title-sequence.js`), the arrival music and sound toggle, and the Go deeper descent into the Underside (`www/js/underside/main.js`).
- CSS uses semantic, descriptive kebab-case class names and a small set of design tokens.
- The third RSVP stays on `www/index.html`; there is no destination URL to configure.
