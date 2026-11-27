export const SIGNUP_STORAGE_KEY = 'nocturne-night:signup';
export const ESCAPE_DESTINATION = './escape.html';
export const MAX_ATTEMPTS = 3;

export const MAX_AMBIENT_EFFECTS = 8;
export const MOBILE_AMBIENT_EFFECTS = 4;
export const TIMING = Object.freeze({
  shakeFirst: 520,
  shakeSecond: 700,
  shakeThird: 900,
  glitch: 1500,
  handoff: 700,
  reduced: 250
});
// Title sequence on escape.html. Times are in milliseconds.
export const TITLE_FONT = '"Playfair Display", Georgia, serif';
export const TITLE_LINES = Object.freeze([
  Object.freeze({ text: 'NOCTURNE', size: 200, track: 8 }),
  Object.freeze({ text: 'NIGHT', size: 170, track: 18 })
]);
// Close-ups joined by hard cuts (no dissolves). Pacing follows the reference at about two-thirds speed.
// i = letter index (N0 O1 C2 T3 U4 R5 N6 E7, N8 I9 G10 H11 T12), fx/fy = focus point in the letter (0-1),
// z0/z1 = zoom at start/end of the shot, px/py = slow pan across the letter, d = shot length.
export const TITLE_SHOTS = Object.freeze([
  Object.freeze({ i: 1, fx: .14, fy: .50, z0: 13, z1: 14, px: .18, py: -.14, d: 3600 }),
  Object.freeze({ i: 0, fx: .55, fy: .30, z0: 10, z1: 10.6, px: -.09, py: .21, d: 1800 }),
  Object.freeze({ i: 3, fx: .15, fy: .07, z0: 12, z1: 12.5, px: .30, py: .01, d: 1800 }),
  Object.freeze({ i: 10, fx: .84, fy: .62, z0: 10, z1: 10.5, px: -.16, py: -.15, d: 2000 }),
  Object.freeze({ i: 5, fx: .74, fy: .86, z0: 8.5, z1: 8.9, px: .07, py: -.25, d: 1800 })
]);
// Framing the pull-back starts from, right after the last cut. z = zoom.
export const TITLE_PULL_FROM = Object.freeze({ i: 4, fx: .50, fy: .40, z: 5 });
export const TITLE_TIMING = Object.freeze({
  blackout: 2000,   // pure black before anything appears
  fadeIn: 1600,     // first close-up fades up from black
  pull: 12000       // long pull-back while the letters slide into place; the full title then stays
});
// ---------- The Underside (after the title sequence) ----------
// Spline: paste each scene's exported URL (Export → Code → Vanilla JS → copy the .splinecode URL).
// Leave a slot empty to use the built-in canvas creature. See docs/spline-brief.md.
export const SPLINE_RUNTIME_URL = 'https://unpkg.com/@splinetool/runtime@2.0.224/build/runtime.js';
export const SPLINE_SCENES = Object.freeze({
  watcher: '', // eyes beat: something huge that tracks you, hanging from the ceiling
  door: '',    // rooms beat: the door that opens a little more every time
  figure: ''   // broadcast beat: the figure that gets closer between static cuts
});

export const UNDERSIDE = Object.freeze({
  escapedKey: 'nocturne-night:escaped',
  familyImage: './assets/underside/found/hope-couple-spirit.jpg', // Smile Tape 1
  // Images the team generated for this project (see ASSETS.md).
  scares: Object.freeze({
    final: Object.freeze({ src: './assets/underside/generated/doorway-1990s-photo.jpg', focus: [0.62, 0.47] }),
    backtrack: Object.freeze({ src: './assets/underside/generated/bedroom-figure.jpg', focus: [0.68, 0.2] })
  }),
  // One frame per step of the approaching figure: drawn corridor (null), then real footage.
  broadcastFootage: Object.freeze([
    null,
    './assets/underside/generated/mall-camera.jpg',
    './assets/underside/generated/stairwell-tall-figure.jpg',
    null,
    './assets/underside/generated/hallway-found-footage.jpg'
  ]),
  // The party clock at the top of the screen. Reach the way out before it hits zero.
  timeLimitMs: 600000, // 2:50 AM → 3:00 AM
  gentleExtraMs: 120000,
  // Voices recorded with ElevenLabs (via Higgsfield); browser speech is the fallback.
  voiceDir: './assets/underside/voice/',
  maxScreensPerSecond: 1.15, // scroll speed limit, in screen heights per second
  crtResolution: 0.6,
  // Public-domain photographs and prints used on room walls and in single-frame flashes (see ASSETS.md).
  foundImages: Object.freeze([
    'mumler-unidentified.jpg',
    'hidden-mother-1.jpg',
    'psychic-apparition.jpg',
    'car-spirit.jpg',
    'ectoplasm.jpg',
    'mumler-dow.jpg',
    'dore-inferno.jpg',
    'double-exposure-ghost.jpg',
    'mumler-herrod.jpg',
    'colley-spirit.jpg'
  ].map((file) => `./assets/underside/found/${file}`).concat([
    'crt-no-signal.jpg',
    'flooded-church.jpg',
    'dinner-mask.jpg'
  ].map((file) => `./assets/underside/generated/${file}`))),
  eyePairs: 34,
  roomTotal: 7,
  pinnedResolution: 0.6, // low internal resolution = soft, analog
  roomResolution: 0.45,
  backtrackPx: 140,
  idleMs: 11000,
  scareMs: 850,
  scareGapMs: 12000,
  afterEscapeMs: 6500
});
