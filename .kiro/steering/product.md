---
inclusion: always
---

# Product: Nocturne Night

NocturneNight is a Halloween gathering invitation built for the Kiroween 2026 Costume Contest / Haunting UI track. It runs in the browser (GitHub Pages) and as an Android/iOS app through Capacitor.

It starts as a polished, calm invitation and grows uncanny as visitors scroll and complete the guest list. Valid fields light candles and progress drives the haunting level. The first two valid invitation submissions trigger escalating shakes and distinct messages; the third triggers the strongest shake with a restrained glitch, then a fade to black.

The crossing stays on the same page. A canvas title sequence spells NOCTURNE NIGHT in red neon while the arrival music plays, then holds the title with the message "The lights are gone. Something heard you cross. The way forward is still hidden." and a Go deeper button. Go deeper glitches and turns the screen over into the Underside: the Devil's party, which the visitor must escape before 3:00 AM (see `underside.md`). There is no Gentle mode button; visitors who prefer reduced motion get gentle mode automatically.

`www/escape.html` is a standalone page that plays the title video and continues to `./index.html?descend`, which starts directly at the title sequence.

Keep all language, puzzles, and visual assets original; use broad supernatural suspense cues without copying another project's text, visuals, or exact interactions.

Signup data stays in sessionStorage for this browser session and is never sent to a server.
