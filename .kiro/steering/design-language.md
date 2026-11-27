---
inclusion: always
---

# Nocturne Night design language

## Color and type
- Use the CSS custom properties in `www/style.css` as the source of truth.
- Keep the base near-black plum and warm paper palette. Orange marks actions and important states; lilac and sage are supporting accents.
- Use Playfair Display for expressive headings and DM Sans for navigation, labels, and body text. Retain the system fallbacks.
- Maintain readable contrast and never use color as the only signal; pair status colors with text, numeric progress, or candle state.
- Normalize the nightometer's scroll contribution to the footer entry point so it reaches 60 before the footer; give the signup section extra breathing room on narrow screens.

## Motion
<<<<<<< HEAD
- Build non-trivial motion in `www/js/anim/timelines.js` with GSAP. Make the first shake restrained, the second clearly stronger, and the third click resolve through a brief glitch and fade to black.
- Prefer opacity and transforms. Keep entrance and reveal motion calm, short, and purposeful.
- Pause ambient loops when the hero leaves view or the tab is hidden.
- Respect `prefers-reduced-motion`: no continuous ambient motion or flashing sequence.
- The silent `www/escape.html` title video is full-viewport and responsive, offers a visible skip control, and yields immediately to the arrival screen for reduced motion or playback failure.
- Keep the arrival page's Stranger Things music as a separate audio element with its existing sound toggle; audible autoplay can be blocked until user interaction.
- Avoid saturated red and rapid full-screen flashes. The glitch effect uses restrained jitter, hue shift, scanline movement, and short sparse pixel-block tears.
=======
- Build non-trivial motion in `js/anim/timelines.js` with GSAP.
- Prefer opacity and transforms. Keep entrance and reveal motion calm, short, and purposeful.
- Pause ambient loops when the hero leaves view or the tab is hidden.
- Respect `prefers-reduced-motion`: no continuous ambient motion or flashing sequence.
- Avoid saturated red and rapid full-screen flashes. The glitch effect uses restrained jitter, hue shift, scanline movement, and short, sparse pixel-block tears.
- The first two valid signup attempts use distinct messages and progressively stronger shakes; the third uses a brief glitch and a smooth fade to black.
- Under reduced motion, omit shaking, pixel breakup, and the arrival-title zoom while retaining the messages and a short static dark handoff.
>>>>>>> f0244bd470db10f735d1188681264ee56e46ef39

## Components
- Buttons and links use clear labels, visible focus, and targets at least 44px high.
- Form labels remain visible. Errors sit beside their fields and are announced accessibly.
- Decorative art uses empty alt text and is hidden from assistive technology; informative imagery must have descriptive alt text.
- Keep the page editorial, quiet, and atmospheric. The darker reveal should emerge through light, fog, and motion rather than copied imagery or text from other projects.
- The `escape.html` arrival screen uses original signal-loss copy, a restrained outlined heading reveal, and a cold, shadowed atmosphere. Do not add the timer or puzzle UI until the escape gameplay tasks are in scope.
