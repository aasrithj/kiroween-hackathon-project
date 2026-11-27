---
inclusion: always
---

# Tech stack

- Static HTML in root `index.html` and `escape.html`
- CSS custom properties and responsive CSS in root `style.css`
- Plain browser JavaScript ES modules in root `script.js` and `js/`
- Local GSAP 3 source at root `gsap.min.js`
- Browser APIs: sessionStorage, IntersectionObserver, requestAnimationFrame, matchMedia, native dialog, and Web Audio API for synthesized sound cues
- No framework, CSS framework, bundler, or 3D library; the page runs as static files

## Architecture

- Pure calculations and state transitions live in `js/logic/`.
- Configuration and copy live in `js/config.js` and `js/content.js`.
- Shared GSAP timeline factories live in `js/anim/timelines.js`.
- Dependency-free synthesized audio effects live in `js/audio/sound-effects.js`.
- `script.js` wires browser events, form behavior, accessibility, and visual state.
- CSS uses semantic, descriptive kebab-case class names and a small set of design tokens.
- The signup handoff destination is defined once in `js/config.js`; the current escape slice stops at the arrival screen.
