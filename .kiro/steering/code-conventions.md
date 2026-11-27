---
inclusion: always
---

# Code conventions

- Use static HTML, CSS, browser JavaScript ES modules, and the checked-in GSAP source only. Do not add a framework, CSS utility library, build requirement, or 3D runtime.
- Keep page entry at root `index.html`, the arrival page at root `escape.html`, global styling in root `style.css`, and the browser entry in root `script.js`.
- Put configuration and themed copy in `js/config.js` and `js/content.js`; pure functions belong under `js/logic/`.
- Put all GSAP timeline creation in `js/anim/timelines.js`; keep DOM wiring in the entry/UI layer.
- Keep synthesized, dependency-free sound effects in `js/audio/`; only start audio in direct response to a user action, and fail silently when Web Audio is unavailable.
- Use lower-case kebab-case for CSS classes and descriptive semantic HTML nesting. Prefer one clear parent per visual group.
- Use named exports, `const` by default, and pure functions for validation, progress calculation, and sequence transitions.
- All non-decorative images need alternative text. Controls need labels, keyboard support, and visible focus. Honor reduced motion.
- Signup details must remain local to the browser session; do not transmit them.
- Count only valid invitation submissions toward the three-attempt crossing. The first two unlock the form after their shakes; the third stores details and navigates to `escape.html`.
- Do not add frameworks, CSS utility libraries, bundlers, 3D packages, or new runtime dependencies.
- Do not fetch or stream sound effects from a CDN. If approved external audio assets are added later, store them locally in the root `audio/` folder and document their source and license.
