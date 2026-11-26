# kiroween-hackathon-project

This is the project repository for Kiroween 2026, involving the team members Aasrith Jangala (myself) and Koundinya Namuduri.

# overview

A polished, atmospheric Halloween gathering page for the Kiroween Costume Contest / Haunting UI track. The experience begins as a calm invitation and grows more uncanny as visitors explore and complete the guest-list form. Its visual direction uses the broad light-to-dark reveal idea: a welcoming, editorial surface slowly lets the house's eerie character show through.

# Capacitor Android

The Android platform is configured in `capacitor.config.json` to use `android-capacitor/`. The older `android/` directory is incomplete and left untouched as a backup; open the app through the Capacitor CLI so it selects the configured project.

```sh
npm install
npm run build
npx cap open android
```

After editing the website, rebuild and sync it into the Android app with:

```sh
npm run cap:sync:android
```

Keep `android-capacitor/` in version control. `www/` is generated and ignored by Git.

# license

All rights reserved. This project and its code are the exclusive property of Aasrith Jangala and Koundinya Namuduri. No permissions are granted for copying, modifying, or redistributing this work.
