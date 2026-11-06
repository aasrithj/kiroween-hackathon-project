---
inclusion: always
---

# Nocturne Night design language

## Color and type
- Use the CSS custom properties in `src/style.css` as the source of truth.
- Keep the base near-black plum and warm paper palette. Orange marks actions and important states; lilac and sage are supporting accents.
- Use Playfair Display for expressive headings and DM Sans for navigation, labels, and body text. Retain the system fallbacks.
- Maintain readable contrast and never use color as the only signal; pair status colors with text, numeric progress, or candle state.

## Motion
- Build non-trivial motion in `src/js/anim/timelines.js` with GSAP.
- Prefer opacity and transforms. Keep entrance and reveal motion calm, short, and purposeful.
- Pause ambient loops when the hero leaves view or the tab is hidden.
- Respect `prefers-reduced-motion`: no continuous ambient motion or flashing sequence.
- Avoid saturated red and rapid full-screen flashes. The glitch effect uses restrained jitter, hue shift, and scanline movement.

## Components
- Buttons and links use clear labels, visible focus, and targets at least 44px high.
- Form labels remain visible. Errors sit beside their fields and are announced accessibly.
- Decorative art uses empty alt text and is hidden from assistive technology; informative imagery must have descriptive alt text.
- Keep the page editorial, quiet, and atmospheric. The darker reveal should emerge through light, fog, and motion rather than copied imagery or text from other projects.
