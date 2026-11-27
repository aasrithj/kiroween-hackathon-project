# Nocturne Night

A responsive Halloween gathering invitation for Kiroween’s haunting UI track. The page begins as a polished event landing page and grows more unsettling as visitors scroll and interact with the guest list.

## Run it

Serve the project root with any static HTTP server, then open `/` or `/index.html`. The JavaScript uses ES modules, so it must be served over HTTP rather than opened with `file://`. There is no build step or framework. GSAP is included as `gsap.min.js`; Lenis is loaded from the pinned CDN URL in `index.html`. Fonts use Google Fonts with system fallbacks.

<<<<<<< HEAD
After signup, `www/escape.html` plays the silent title video (`www/videos/title-sequence.webm`, with an MP4 fallback) before opening the existing arrival scene. Visitors can skip it; reduced-motion settings, media errors, and blocked video autoplay continue directly to arrival. The arrival scene keeps its separate Stranger Things music autoplay attempt and sound toggle. Browsers may block audible autoplay until the visitor interacts, so the arrival page waits for interaction to unmute when needed.

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

# license
=======
## Experience
>>>>>>> f0244bd470db10f735d1188681264ee56e46ef39

- The landing page has a hero, event story, event details, guest-list signup section, and footer.
- The nightometer combines scroll progress and field completion. Scrolling to just above the footer fills the scroll portion to **60** even with both fields empty; a valid name and email add up to **40** more, for a maximum of 100. On small screens, extra space below the signup form provides a comfortable scroll runway.
- The form validates locally. Only valid submissions count toward its three-step haunting: the first two trigger distinct messages and escalating screen shakes, and the third saves the details to session storage and starts a restrained glitch followed by a fade to black.
- The final glitch briefly breaks into blocky pixel tears before the handoff; the arrival title settles in from an oversized, blurred state. Both use the existing GSAP runtime and reduce to a static, readable state for reduced-motion visitors.
- Invalid submissions play a brief, quiet error cue. The final crossing plays an original, Stranger-Things-inspired synth tone made with the browser's Web Audio API; it is not the show's theme or a recording. Audio starts from the submit interaction, uses no external assets or dependencies, and shortens for reduced-motion users.
- The third submission opens `escape.html`, an original, Stranger-Things-inspired supernatural arrival screen. This slice stops at the arrival; the clue hunt, Demon demands, timer, and escape gameplay are not implemented yet.
- The responsive navigation becomes a hamburger menu below 500 px. It closes when a link is selected, Escape is pressed, or the visitor clicks outside it.
- A discreet “note from the house” reveals a hidden message.
- Reduced-motion preferences suppress continuous motion and shaking, and use a brief static handoff.

Signup details are stored only in `sessionStorage` under `nocturne-night:signup`; the form does not send them to a server. If GSAP is unavailable, CSS and timeout fallbacks keep the signup flow usable. If Web Audio is unavailable or blocked, the experience continues without sound. Synthesized sound code lives in `js/audio/`; any approved external audio files should be stored locally in `audio/` with their source and license documented.

## Project guidance

The Kiro requirements, design, and task documents live under `.kiro/specs/`. Project conventions are in `.kiro/steering/`, and `.kiro/hooks/review-crossing-flow.json` reviews relevant file saves for consistency with the three-step handoff and arrival-screen scope.

