# kiroween-hackathon-project

This is the project repository for Kiroween 2026, involving the team members Aasrith Jangala (myself) and Koundinya Namuduri.

# overview

A polished, atmospheric Halloween gathering page for the Kiroween Costume Contest / Haunting UI track. The experience begins as a calm invitation and grows more uncanny as visitors explore and complete the guest-list form. Its visual direction uses the broad light-to-dark reveal idea: a welcoming, editorial surface slowly lets the house's eerie character show through.

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

All rights reserved. This project and its code are the exclusive property of Aasrith Jangala and Koundinya Namuduri. No permissions are granted for copying, modifying, or redistributing this work.

