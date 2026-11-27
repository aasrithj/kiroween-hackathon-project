---
inclusion: always
---

# Tech stack

- Static HTML in `www/index.html`
- CSS custom properties and responsive CSS in `www/style.css`
- Plain browser JavaScript ES modules under `www/js/`
- Local GSAP 3 source at `www/gsap.min.js`
- Browser APIs: sessionStorage, IntersectionObserver, requestAnimationFrame, matchMedia, and native dialog
- The `www/escape.html` title intro uses local WebM and MP4 `<video>` sources with native playback and no added runtime library
- No web UI framework, CSS framework, or bundler; the source remains directly runnable as static files
- Capacitor 8 is the native application wrapper only (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, and `@capacitor/cli`); `www/` is both the web source and the configured native `webDir`
- three.js r187 vendored in `www/vendor/three/` (ES modules, no build step) for the 3D gallery hall and CRT room
- Optional 3D: `@splinetool/runtime` (ES module from unpkg), loaded only when `SPLINE_SCENES` in `www/js/config.js` has a URL
- The Underside (`www/js/underside/`) draws on 2D canvas and synthesizes all sound with the Web Audio API
- Tests: `npm test` (Node's built-in test runner, no dependencies)

## Architecture

- Pure calculations and state transitions live in `www/js/logic/`.
- Configuration and copy live in `www/js/config.js` and `www/js/content.js`.
- Shared GSAP timeline factories live in `www/js/anim/timelines.js`.
- `www/script.js` wires browser events, form behavior, accessibility, and visual state.
- CSS uses semantic, descriptive kebab-case class names and a small set of design tokens.
