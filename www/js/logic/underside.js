// Pure rules for the Underside. No DOM, audio, or GSAP here, so everything can be tested in Node.

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * Story beats along the scroll, as fractions of the whole track.
 * Each beat starts where the previous one ends.
 */
export const BEATS = Object.freeze([
  Object.freeze({ id: 'hall', end: 0.1 }),      // the party hallway: nobody's here
  Object.freeze({ id: 'tape', end: 0.2 }),      // a TV that won't turn off
  Object.freeze({ id: 'nursery', end: 0.32 }),  // the doll and the music box
  Object.freeze({ id: 'eyes', end: 0.38 }),
  Object.freeze({ id: 'rooms', end: 0.52 }),    // the doors, the radio, the choice
  Object.freeze({ id: 'leave', end: 0.6 }),     // "are you sure you want to leave?"
  Object.freeze({ id: 'hallway', end: 0.78 }),  // something comes; it gives you the key
  Object.freeze({ id: 'devil', end: 0.9 }),     // the host
  Object.freeze({ id: 'exit', end: 1 })
]);

export function beatAt(progress) {
  const p = clamp(progress);
  return (BEATS.find((beat) => p < beat.end) ?? BEATS[BEATS.length - 1]).id;
}

/**
 * Dread grows slowly, with plateaus, so the build-up never feels linear.
 * It is monotonic, bounded to [0, 1], and reaches its peak just before the broadcast ends.
 */
export function dreadAt(progress) {
  const p = clamp(progress);
  const slow = 0.35 * smoothstep(0, 0.4, p);
  const climb = 0.4 * smoothstep(0.38, 0.75, p);
  const peak = 0.25 * smoothstep(0.72, 0.88, p);
  return clamp(slow + climb + peak);
}

/** Room counter that breaks: "1/7" … "7/7", then "8/7", "9/7". */
export function roomLabel(index, total = 7) {
  return `${index + 1}/${total}`;
}

/**
 * Discrete steps of the approaching figure (the static cuts between them hide the movement).
 * Returns a step from 0 (far) to steps - 1 (closest). It never goes backwards in progress.
 */
export function figureStep(localProgress, steps = 5) {
  return Math.min(steps - 1, Math.floor(clamp(localProgress) * steps));
}

/**
 * Flash limiter: no more than `max` flashes in any `windowMs` (WCAG 2.3.1: three per second).
 * Gentle mode never flashes.
 */
export function createFlashLimiter({ max = 3, windowMs = 1000, gentle = false } = {}) {
  const history = [];
  return {
    tryFlash(now) {
      if (gentle) return false;
      while (history.length && now - history[0] >= windowMs) history.shift();
      if (history.length >= max) return false;
      history.push(now);
      return true;
    },
    count: () => history.length
  };
}

/**
 * Jumpscare rules: at most `maxPerRun`, at least `minGapMs` apart, never in gentle mode.
 */
export function createScareGate({ maxPerRun = 2, minGapMs = 45000, gentle = false } = {}) {
  let fired = 0;
  let last = -Infinity;
  return {
    tryScare(now) {
      if (gentle || fired >= maxPerRun || now - last < minGapMs) return false;
      fired += 1;
      last = now;
      return true;
    },
    fired: () => fired
  };
}

/**
 * Detects the visitor scrolling back up after being told not to.
 * Returns true once the upward travel since the last downward movement exceeds `threshold` px.
 */
export function createBacktrackDetector(threshold = 120) {
  let lowest = 0;
  return {
    update(scrollY) {
      if (scrollY > lowest) lowest = scrollY;
      if (lowest - scrollY >= threshold) {
        lowest = scrollY;
        return true;
      }
      return false;
    },
    reset(scrollY = 0) {
      lowest = scrollY;
    }
  };
}

/** "11:42 PM" from a Date, for the intrusions that know what time it is. */
export function clockLabel(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

/** First name only, upper-cased, letters/spaces/hyphens/apostrophes, at most 24 chars. */
export function guestName(details) {
  const raw = typeof details?.name === 'string' ? details.name.trim().split(/\s+/)[0] : '';
  // Upper-case first: some letters grow (ß → SS), so the length cap must come after.
  return raw.replace(/[^\p{L}'-]/gu, '').toUpperCase().slice(0, 24);
}

/** VHS-style timecode "00:03:17:12" from milliseconds (25 fps). */
export function timecode(ms) {
  const total = Math.max(0, Math.floor(ms));
  const frames = Math.floor((total % 1000) / 40);
  const seconds = Math.floor(total / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}:${pad(frames)}`;
}

/** Hold-to-escape progress. Holding fills it; releasing drains it slowly. Bounded to [0, 1]. */
export function holdProgress(current, dtMs, holding, { fillMs = 2600, drainMs = 5200 } = {}) {
  const delta = holding ? dtMs / fillMs : -dtMs / drainMs;
  return clamp(current + delta);
}

/**
 * The Smile Tapes: three tapes share the tapes beat. For a local progress q, returns which tape is
 * playing, which phase it is in ('label' → 'blue' → 'play'), and how far through that phase.
 */
export function tapeAt(q, count = 3) {
  const p = clamp(q) * count;
  const index = Math.min(count - 1, Math.floor(p));
  const local = p - index;
  if (local < 0.16) return { index, phase: 'label', t: local / 0.16 };
  if (local < 0.24) return { index, phase: 'blue', t: (local - 0.16) / 0.08 };
  return { index, phase: 'play', t: (local - 0.24) / 0.76 };
}

/**
 * The camcorder clock drifts from the visitor's real time to 3:00 AM as they go deeper,
 * then stays there. Returns minutes past midnight (0–1439).
 */
export function minutesTowardThree(realMinutes, progress, arriveBy = 0.7) {
  const target = 180; // 3:00 AM
  const ahead = (((target - realMinutes) % 1440) + 1440) % 1440; // always move forward in time
  const t = smoothstep(0, arriveBy, clamp(progress));
  return Math.round(realMinutes + ahead * t) % 1440;
}

/** "3:00 AM" from minutes past midnight. */
export function minutesLabel(minutes) {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(m / 60);
  return `${hours % 12 || 12}:${String(m % 60).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** How many error dialogs should be open at local progress q of the errors beat. */
export function errorCount(q, max = 7) {
  return Math.min(max, Math.floor(clamp(q / 0.7) * max));
}

/**
 * Scroll speed limit: the tape cannot be fast-forwarded past the story.
 * Moves `current` toward `target` by at most `maxSpeed` px/s, and reports how far the visitor's real
 * scroll position should be pulled back so it never runs more than `lead` px ahead.
 * Returns { y, pullBackTo (number or null), fastForward (bool) }.
 */
export function limitScroll(current, target, dtSeconds, { maxSpeed = 900, lead = 900, smoothing = 9 } = {}) {
  const eased = current + (target - current) * (1 - Math.exp(-dtSeconds * smoothing));
  const maxStep = maxSpeed * dtSeconds;
  const y = Math.max(current - maxStep, Math.min(current + maxStep, eased));
  const ahead = target - y;
  return {
    y,
    pullBackTo: ahead > lead ? y + lead : null,
    fastForward: ahead > lead * 0.35
  };
}

/**
 * The party clock at the top of the screen. Counts down from totalMs; time spent locked in a
 * scripted moment doesn't count. Returns the label and how worried the visitor should be.
 */
export function countdown(totalMs, elapsedMs) {
  const remaining = Math.max(0, Math.round(totalMs - Math.max(0, elapsedMs)));
  const seconds = Math.ceil(remaining / 1000);
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return { remaining, label, urgent: remaining <= 60000, critical: remaining <= 20000, done: remaining === 0 };
}

/**
 * Escape-room locks. Each gate sits at a scroll position; you cannot get past the first unsolved
 * gate in front of you. Returns the allowed position and which gate (if any) is blocking.
 */
export function applyGates(targetY, gates) {
  // A lock holds while you are at it (within 2 px), not only past it; otherwise being pulled back
  // onto the lock would release it on the very next frame.
  const blocking = [...gates].sort((a, b) => a.y - b.y).find((gate) => !gate.solved && targetY > gate.y - 2);
  return blocking ? { y: Math.min(targetY, blocking.y), blockedBy: blocking.id } : { y: targetY, blockedBy: null };
}

/**
 * The party clock reads like a bedside clock creeping toward 3:00 AM, the devil's hour.
 * elapsed 0 shows (3:00 AM minus totalMs); elapsed >= totalMs shows 3:00:00 AM.
 */
export function partyClock(totalMs, elapsedMs) {
  const c = countdown(totalMs, elapsedMs);
  const shown = 3 * 3600 - Math.ceil(c.remaining / 1000); // seconds after midnight
  const h = Math.floor(shown / 3600);
  const m = Math.floor(shown / 60) % 60;
  const sec = shown % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return { ...c, clock: `${h || 12}:${pad(m)}:${pad(sec)} AM` };
}
