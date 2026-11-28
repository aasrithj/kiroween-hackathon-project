# Nocturne Night

A responsive Halloween gathering invitation for Kiroween's haunting UI track. The page begins as a polished event landing page and grows more unsettling as visitors scroll and interact with the guest list. The third invitation request crosses over into a red-neon title sequence and then the Underside: the Devil's party, which you have to escape before 3:00 AM.

## Run it

The web app lives in `www/`. Serve that folder with any static HTTP server, or run:

```sh
npm start
```

Then open the printed address. The JavaScript uses ES modules, so it must be served over HTTP rather than opened with `file://`. There is no build step or framework.

Useful URL options:

- `?descend` skips the invitation and starts at the title sequence.
- `?time=SECONDS` sets the Underside's party clock (10 to 900 seconds) for demos.
- `?debug` exposes `window.__underside` for automated walkthroughs.

## Test it

```sh
npm test
```

This runs Node's built-in test runner on `tests/*.test.js`: the invitation logic and title-sequence schedule (`tests/landing.test.js`) and the Underside rules (`tests/underside.test.js`). There are no test dependencies.

## Tech stack

- HTML, CSS, and plain JavaScript ES modules in `www/`, with no framework, CSS utility library, or bundler.
- GSAP 3.15, included as `www/gsap.min.js`.
- three.js r187, vendored in `www/vendor/three/`, for the Underside's 3D rooms and scenes.
- Lenis 1.3.27 smooth scrolling, loaded from a pinned unpkg URL in `www/index.html`.
- An optional Spline runtime, loaded from unpkg only when a scene URL is set in `SPLINE_SCENES` (`www/js/config.js`). All slots are currently empty.
- Fonts from Google Fonts: Outfit, Playfair Display, VT323, and Caveat, with system fallbacks.
- Browser APIs: Canvas 2D, WebGL, Web Audio, speech synthesis, sessionStorage, IntersectionObserver, and native dialog.
- Capacitor 8 for the Android and iOS apps, and GitHub Pages for the website.

## Experience

### The invitation

- The landing page has a hero, event story, event details, guest-list signup section, and footer.
- The nightometer combines scroll progress and field completion. Scrolling to just above the footer fills the scroll portion to **60** even with both fields empty; a valid name and email add up to **40** more, for a maximum of 100. On small screens, extra space below the signup form provides a comfortable scroll runway.
- The form validates locally. Only valid submissions count toward its three-step haunting: the first two trigger distinct messages and escalating screen shakes, and the third saves the details to session storage, plays the strongest shake together with a restrained glitch of blocky pixel tears, and fades to black.
- The responsive navigation becomes a hamburger menu below 500 px. It closes when a link is selected, Escape is pressed, or the visitor clicks outside it.
- A discreet "note from the house" reveals a hidden message.
- Reduced-motion preferences suppress continuous motion and shaking, and use a brief static handoff.

### The title sequence

- The crossing stays on the same page. A canvas title sequence spells NOCTURNE NIGHT in red neon: hard cuts between slow close-ups of the letters, a long pull-back, then the full title, held on screen with a gentle pulse.
- The message "The lights are gone. Something heard you cross. The way forward is still hidden." and a Go deeper button fade in under the title.
- The arrival music (`www/audio/kiroween-audio.mp3`, made with Eleven Music) plays with it, with a round icon-only sound toggle. Browsers may block audible autoplay; the music then plays muted and unmutes on the first click, tap, or key press.
- Skip intro fades into the last few seconds of the pull-back. The sequence keeps time with the music when the tab is hidden.
- `www/escape.html` is a standalone page that plays the title video (`www/videos/title-sequence.webm`, with an MP4 fallback) and continues to `index.html?descend`.

### The Underside

- Go deeper plays the same glitch and shake over the title, then turns the screen over into an upside-down house. Scroll up to go deeper, slowly.
- Nine rooms and six locks stand between you and the way out: the host's portrait, a TV that won't stop, a music box, three doors, a dialog that won't let you leave, and the Devil, who wants your name. A 10-minute party clock runs from 2:50 AM to 3:00 AM.
- Hold to escape and you reach the "You got out." page. If the clock reaches 3:00 AM first, the party ends.
- Flashes and jumpscares are rate-limited (at most 3 flashes a second, 2 jumpscares a run). Visitors who prefer reduced motion get gentle mode: no jumpscares, hammer, gore, or flashes, quieter audio, and 2 extra minutes.
- Music and sound effects are synthesized live with Web Audio; voice lines are local recordings with a browser-speech fallback.

## Privacy

Signup details are stored only in `sessionStorage` under `nocturne-night:signup`; nothing is sent to a server. The Underside reads the name back for the Devil's lock. If GSAP is unavailable, CSS and timeout fallbacks keep the flow usable. If audio is unavailable or blocked, the experience continues without sound.

## Credits

- **Music:** "kiroween-audio" (`www/audio/kiroween-audio.mp3`) by Eleven Music ([elevenlabs.io](https://elevenlabs.io)), generated on the ElevenLabs free plan and used non-commercially with the attribution that plan requires.
- **Voices:** the Underside's 14 voice lines were made with ElevenLabs text-to-speech via Higgsfield.
- **Ghost:** designed by [Magnific](https://www.magnific.com/free-ai-image/cute-cartoon-ghost-icon-rendering_422358058.htm).
- **Witch hat:** [witch hat icon](https://www.flaticon.com/free-icon/witch-hat_5606296) created by Luvdat - Flaticon.
- **Logo:** "Halloween pumpkin icon flat vector illustration" by Visual Content, from Canva.
- **3D head:** "Lee Perry-Smith" head scan by Infinite-Realities, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), distributed with the three.js examples.
- **Paintings and photographs:** public-domain works by Goya, Doré, Fuseli, Redon, Böcklin, William Mumler, and others, via Wikimedia Commons.
- **Libraries:** GSAP, three.js, and Lenis. **Fonts:** Outfit, Playfair Display, VT323, and Caveat, from Google Fonts.

Every image, model, and audio file, with its source and license, is listed in `ASSETS.md`.

## Capacitor native apps

The web app is static HTML, CSS, and JavaScript stored directly in `www/`, which is both the editable source of truth and Capacitor's `webDir`. There is no separate web build or second editable copy. Capacitor sync copies these files into the Android and iOS projects for packaging; edit files in `www/`, then run `npm run cap:sync`.

Install the project dependencies and sync the native projects:

```sh
npm install
npm run cap:sync
```

To open a native IDE after syncing:

```sh
npm run cap:android
npm run cap:ios
```

To build, sync, and launch on a connected device or configured emulator/simulator:

```sh
npm run cap:run:android
npm run cap:run:ios
```

These commands sync the current `www/` files into the native project, then call Capacitor's `run` command. You can also run `npx cap run android` or `npx cap run ios` directly after syncing.

Capacitor requires Node.js 22 or later. Android builds require Android Studio and an Android SDK. Building iOS apps requires macOS, Xcode, and Xcode Command Line Tools. The native project folders (`android/` and `ios/`) are included in this repository. Their bundled web assets are generated copies; after changing files in `www/`, run `npm run cap:sync` again.

See the [official Capacitor installation guide](https://capacitorjs.com/docs/getting-started) and [environment setup](https://capacitorjs.com/docs/getting-started/environment-setup) for current platform requirements.

## Deployment

Every push to `main` deploys `www/` to GitHub Pages through `.github/workflows/deploy.yml`.

## Project guidance

The Kiro requirements, design, and task documents live under `.kiro/specs/`: `spooky-haunting-ui` for the invitation and `upside-down-escape` for the title sequence and the Underside. Project conventions are in `.kiro/steering/`, and `.kiro/hooks/review-crossing-flow.json` reviews relevant file saves against them.

## License

The code is MIT licensed. See `LICENSE.md`. The MIT license does not cover the third-party and AI-generated assets listed in `ASSETS.md`; each keeps its own terms. In particular, `www/audio/kiroween-audio.mp3` is excluded and may not be reused or redistributed on its own.
