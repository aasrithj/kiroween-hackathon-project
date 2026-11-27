export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const lerp = (from, to, t) => from + (to - from) * t;

export const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

// Fast start, long gentle settle. Used for the pull-back and the letters sliding into place.
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);

// Deterministic pseudo-random number in [0, 1).
export const hash = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Lays the sequence out on one clock (ms from page start):
 * black -> fade in -> close-ups joined by hard cuts -> pull-back -> the full title, held forever.
 */
export function buildSchedule(shots, timing) {
  const { blackout, fadeIn, pull } = timing;
  let elapsed = blackout;
  const scheduled = shots.map((shot) => {
    const start = elapsed;
    elapsed += shot.d;
    return { ...shot, start };
  });
  const pullStart = elapsed;
  const end = pullStart + pull;

  return {
    shots: scheduled,
    blackout,
    fadeIn,
    pullStart,
    pull,
    // The title is fully resolved here and stays on screen from then on.
    end,
    driftEnd: pullStart + pull * 0.95
  };
}

// The active close-up at a given time, or null during black, pull-back, and after.
export const shotAt = (schedule, time) => schedule.shots
  .find((shot) => time >= shot.start && time < shot.start + shot.d) ?? null;

// Whole-frame brightness: black opening, then a fade in. Nothing fades out; the title stays.
export const masterAlpha = (schedule, time) => smooth((time - schedule.blackout) / schedule.fadeIn);

// Skip intro: brightness of the whole picture `sinceMs` after the button was pressed.
// It fades to black, the clock jumps into the zoom-out, and the picture fades back in.
export function skipDip(sinceMs, { skipFadeOut, skipFadeIn }) {
  if (sinceMs < skipFadeOut) return 1 - smooth(sinceMs / skipFadeOut);
  return smooth((sinceMs - skipFadeOut) / skipFadeIn);
}

// Where Skip intro jumps to: `skipLead` ms before the title settles, partway through the zoom-out.
export const skipTarget = (schedule, { skipLead }) => Math.max(schedule.pullStart, schedule.end - skipLead);

// True once the pull-back has finished and the full title is on screen.
export const isSettled = (schedule, time) => time >= schedule.end;

// Each letter starts out of place and slides home. Offsets are stable per letter index.
export function letterMotion(index) {
  return {
    dx: (hash(index, 1) - 0.5) * 2 * (90 + hash(index, 2) * 120),
    dy: (hash(index, 3) - 0.5) * 2 * (50 + hash(index, 4) * 90),
    ds: 1 + (hash(index, 5) - 0.5) * 0.36,
    phase: hash(index, 6) * Math.PI * 2
  };
}

export function drift(letter, time, schedule) {
  const progress = clamp((time - schedule.blackout) / (schedule.driftEnd - schedule.blackout));
  const k = 1 - easeOutCubic(progress);
  return { x: letter.dx * k, y: letter.dy * k, s: lerp(1, letter.ds, k) };
}

// Steady light with a slow breath; no flicker. Brightens a little as the title resolves,
// then pulses gently for as long as the title stays on screen.
export function intensity(letter, time, schedule) {
  const breath = 0.92 + 0.05 * Math.sin(time / 1600 + letter.phase);
  const resolve = 1 + 0.12 * smooth((time - schedule.pullStart) / schedule.pull);
  const pulse = time > schedule.end ? 1 + 0.1 * Math.sin((time - schedule.end) / 900) : 1;
  return breath * resolve * pulse;
}

export function shotCamera(shot, letters, time, fit, schedule) {
  const u = clamp((time - shot.start) / shot.d);
  const letter = letters[shot.i];
  const offset = drift(letter, time, schedule);
  const width = letter.b.x1 - letter.b.x0;
  const height = letter.b.y1 - letter.b.y0;

  return {
    x: letter.b.x0 + offset.x * 0.8 + width * (shot.fx + shot.px * u),
    y: letter.b.y0 + offset.y * 0.8 + height * (shot.fy + shot.py * u),
    s: fit * lerp(shot.z0, shot.z1, u),
    focus: shot.i,
    // Slow rack focus: soft at the cut, sharp by about 70% through the shot.
    rack: 1 - smooth(u / 0.7),
    z: lerp(shot.z0, shot.z1, u)
  };
}

// Camera for the pull-back: from a close framing out to the whole title.
// Close-ups zoom from this scale. On tall portrait screens the width-based fit is small,
// so close-ups use the height instead to keep the frame filled.
export const closeUpScale = (fit, viewportHeight, bounds) => Math.max(fit, viewportHeight * 0.32 / bounds.h);

export function pullCamera(from, letters, bounds, time, fit, schedule, closeFit = fit) {
  const u = clamp((time - schedule.pullStart) / schedule.pull);
  const eased = easeOutCubic(u);
  const letter = letters[from.i];
  const startScale = closeFit * from.z;
  const s = Math.exp(lerp(Math.log(startScale), Math.log(fit), eased));
  const startOffset = drift(letter, schedule.pullStart, schedule);
  const startX = letter.b.x0 + startOffset.x * 0.8 + (letter.b.x1 - letter.b.x0) * from.fx;
  const startY = letter.b.y0 + startOffset.y * 0.8 + (letter.b.y1 - letter.b.y0) * from.fy;

  return {
    x: lerp(startX, bounds.cx, eased),
    y: lerp(startY, bounds.cy, eased),
    s,
    focus: from.i,
    rack: 0,
    z: s / fit,
    progress: u
  };
}
