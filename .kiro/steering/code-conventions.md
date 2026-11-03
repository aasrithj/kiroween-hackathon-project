---
inclusion: always
---

# Code conventions

- Use static HTML, CSS, browser JavaScript ES modules, and the checked-in GSAP source only. Do not add a framework, CSS utility library, build requirement, or 3D runtime.
- Keep page entry at `src/index.html`, global styling in `src/style.css`, the browser entry in `src/script.js`, and pure functions under `src/js/logic/`.
- Put configuration and themed copy in `src/js/config.js` and `src/js/content.js`.
- Put all GSAP timeline creation in `src/js/anim/timelines.js`; keep DOM wiring in the entry/UI layer.
- Use lower-case kebab-case for CSS classes and descriptive semantic HTML nesting. Prefer one clear parent per visual group.
- Use named exports, `const` by default, and pure functions for validation, progress calculation, and sequence transitions.
- All non-decorative images need alternative text. Controls need labels, keyboard support, and visible focus. Honor reduced motion.
- Signup details must remain local to the browser session; do not transmit them.
