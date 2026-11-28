---
inclusion: always
---

# Nocturne Night design language

## Color and type
- Use the CSS custom properties in `www/style.css` as the source of truth.
- Keep the base near-black plum and warm paper palette. Orange marks actions and important states; lilac and sage are supporting accents.
- Use Playfair Display for expressive headings and Outfit for navigation, labels, and body text. Retain the system fallbacks. The `--sans` token is Outfit; do not use DM Sans.
- The other side uses its own palette: black with a single red neon hue for the title sequence, then the Underside's 80s red neon that drains to cold VHS white as dread rises. VT323 sets Underside cards and readouts; Caveat sets handwritten notes.
- Maintain readable contrast and never use color as the only signal; pair status colors with text, numeric progress, or candle state.
- Normalize the nightometer's scroll contribution to the footer entry point so it reaches 60 before the footer; give the signup section extra breathing room on narrow screens.

## Motion
- Build non-trivial invitation motion in `www/js/anim/timelines.js` with GSAP. Make the first shake restrained, the second clearly stronger, and the third click resolve through the strongest shake and a brief glitch at the same time, then a fade to black.
- Prefer opacity and transforms. Keep entrance and reveal motion calm, short, and purposeful.
- Pause ambient loops when the hero leaves view or the tab is hidden. The title sequence is the exception: it follows the wall clock so it stays in step with the music when the tab is hidden.
- Respect `prefers-reduced-motion`: no continuous ambient motion or flashing sequence.
- The title sequence (canvas, `www/js/title-sequence.js`) opens on black, cuts hard between slow close-ups of the neon letters, pulls back for about 12 seconds while the letters settle, then holds the full title indefinitely with a gentle pulse. The message and Go deeper button fade in under it. Skip intro fades the current shot out and fades back in near the end of the pull-back.
- Go deeper plays the signup's glitch and strongest shake on the title sequence, then turns it over (rotate, shrink, blur, fade) into the Underside.
- Keep the arrival music (`www/audio/kiroween-audio.mp3`) as a separate audio element with its icon-only sound toggle; audible autoplay can be blocked until user interaction.
- Avoid saturated red full-screen flashes. The glitch effect uses restrained jitter, hue shift, scanline movement, and short sparse pixel-block tears.
- Under reduced motion, omit shaking and pixel breakup while keeping the messages and a short static dark handoff; show the title sequence's final frame without animation.

## Components
- Buttons and links use clear labels, visible focus, and targets at least 44px high.
- Form labels remain visible. Errors sit beside their fields and are announced accessibly.
- Decorative art uses empty alt text and is hidden from assistive technology; informative imagery must have descriptive alt text.
- Keep the invitation editorial, quiet, and atmospheric. The darker reveal should emerge through light, fog, and motion rather than copied imagery or text from other projects.
- The title sequence's Go deeper button uses a thin red outline and small spaced serif capitals. The sound toggle is a round icon-only button (speaker with waves for on, speaker with a cross for off) with no tooltip.
