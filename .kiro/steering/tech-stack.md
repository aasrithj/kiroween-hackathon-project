---
inclusion: always
---

# Tech stack

- Static HTML in `src/index.html`
- CSS custom properties and responsive CSS in `src/style.css`
- Plain browser JavaScript ES modules under `src/js/`
- Local GSAP 3 source at `src/gsap.min.js`
- Browser APIs: sessionStorage, IntersectionObserver, requestAnimationFrame, matchMedia, and native dialog
- No framework, CSS framework, bundler, or 3D library; the page runs as static files

## Architecture

- Pure calculations and state transitions live in `src/js/logic/`.
- Configuration and copy live in `src/js/config.js` and `src/js/content.js`.
- Shared GSAP timeline factories live in `src/js/anim/timelines.js`.
- `src/script.js` wires browser events, form behavior, accessibility, and visual state.
- CSS uses semantic, descriptive kebab-case class names and a small set of design tokens.
