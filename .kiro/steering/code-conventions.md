---
inclusion: always
---

# Code conventions

- Use static HTML, CSS, browser JavaScript ES modules, and the checked-in GSAP source. The only 3D runtime allowed is the Spline runtime, loaded lazily by `www/js/underside/spline-layer.js` when a scene URL is set. Do not add a web UI framework or CSS utility library. Capacitor is allowed as a native wrapper.
- Keep the editable web app in `www/`: page entry at `www/index.html`, global styling in `www/style.css`, browser entry in `www/script.js`, and pure functions under `www/js/logic/`.
- Put configuration and themed copy in `www/js/config.js` and `www/js/content.js`.
- Put all GSAP timeline creation in `www/js/anim/timelines.js`; keep DOM wiring in the entry/UI layer. Keep the signup sequence reducer independent from DOM and animation code.
- Use lower-case kebab-case for CSS classes and descriptive semantic HTML nesting. Prefer one clear parent per visual group.
- Use named exports, `const` by default, and pure functions for validation, progress calculation, and sequence transitions.
- All non-decorative images need alternative text. Controls need labels, keyboard support, and visible focus. Honor reduced motion.
- Keep the escape title intro's WebM/MP4 sources local under `www/videos/`; handle `ended`, media errors, rejected autoplay, skip, and reduced motion so the arrival page remains reachable. Keep intro video muted and separate from the arrival music audio and toggle.
- Keep native metadata in root `capacitor.config.json` with `webDir: "www"`. Edit `www/` as the single web source of truth; `npm run cap:sync` copies it into the native projects. Preserve relative asset paths and do not maintain a second root copy of web files.
- Signup details must remain local to the browser session; do not transmit them.
