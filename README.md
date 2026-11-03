# Nocturne Night

A polished, atmospheric Halloween gathering page for the Kiroween Costume Contest / Haunting UI track. The experience begins as a calm invitation and grows more uncanny as visitors explore and complete the guest-list form. Its visual direction uses the broad light-to-dark reveal idea: a welcoming, editorial surface slowly lets the house's eerie character show through.

## Run it

Serve the repository root with any static HTTP server and visit `/src/`. The page uses ES modules, so use an HTTP server rather than opening the HTML with `file://`. There is no build step or runtime framework. GSAP 3 is loaded from the local `src/gsap.min.js` file; all other behavior uses browser APIs and plain ES modules. Fonts are loaded from Google Fonts with system fallbacks.

## Experience

- Responsive landing page with event story, details, and a signup form as the final section.
- Scroll and field completion combine into a 0–100 haunting level. Numeric progress and candles communicate status without relying on color alone.
- Signup validation is local. Valid details are held only in sessionStorage at `nocturne-night:signup`; no network submission occurs.
- A valid signup starts a staged, low-flash glitch and ominous mood sequence. The form is locked while it runs.
- A discreet message from the house rewards exploration.
- Reduced-motion preferences suppress continuous motion and replace glitch motion with a static message.

The implementation follows `.kiro/specs/spooky-haunting-ui/`. The separate Upside Down Escape spec is not part of this page's implementation scope.

