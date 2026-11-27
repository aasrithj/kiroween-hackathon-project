// The Underside: an upside-down house you have to escape before 3:00 AM.
//
// You arrived late to Nocturne Night. The party is still going, but nobody is here. The host, who is
// not a person, would like you to stay. Scroll UP (slowly) to go deeper; each room is a lock you must
// open before you can go on:
//   hall     an empty party hallway of portraits; click the host's portrait
//   tape     a TV that turned itself on; make it stop
//   nursery  a porcelain doll and a music box; wind it three times (the doll does not stay a doll)
//   eyes     something in the dark says your name
//   rooms    the same door again and again, a radio search party, then three doors: choose
//   leave    "Are you sure you want to leave the party?" Stay / Stay. Catch the ×.
//   hallway  it comes closer between cuts, cuts off its own arm, and gives it to you
//   devil    the host. Type your name to cancel your RSVP
//   exit     hold to escape
// A clock creeps toward 3:00 AM. If it gets there: the party has ended.

import {
  BEATS,
  applyGates,
  beatAt,
  clamp,
  createBacktrackDetector,
  createFlashLimiter,
  createScareGate,
  dreadAt,
  figureStep,
  guestName,
  holdProgress,
  limitScroll,
  partyClock,
  roomLabel,
  tapeAt,
  timecode
} from '../logic/underside.js';
import { createUndersideAudio } from './audio.js';
import {
  createEyeField,
  drawCornerCreep,
  drawCorridor,
  drawDoorway,
  drawEyeField,
  drawFoundFrame,
  drawGrinner,
  drawBoneStab,
  drawCornerCreep as creep,
  drawHammerBeat,
  drawHammerFace,
  drawLongOne,
  drawSeveredRain,
  drawLunge,
  grain,
  tear
} from './creatures.js';
import { createSplineLayer } from './spline-layer.js';
import { drawNoSignal, drawTape } from './tapes.js';
import { drawNursery, drawRollingHead } from './doll.js';
import { drawDevil, drawDevilClaw } from './devil.js';
import { createBloodLayer, createCrackLayer, drawBloodFlood, drawHandsOnGlass, drawScratches, heartEnvelope } from './overlays.js';
import { hush, speak, speakAsIt } from './voice.js';
import { UNDERSIDE } from '../config.js';
import { underside as COPY } from '../content.js';
import { loadDetails } from '../storage.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Where each lock sits, as a fraction of its section's scroll.
const GATE_AT = Object.freeze({ host: ['hall', 0.93], vcr: ['tape', 0.6], music: ['nursery', 0.45], doors: ['rooms', 0.9], leave: ['leave', 0.4], rsvp: ['devil', 0.5] });

export function createUnderside({ gentle = false } = {}) {
  const root = $('#underside');
  const world = $('#underside-world');
  const track = $('#underside-track');
  const spacer = $('#underside-spacer');
  const staticCanvas = $('#underside-static');
  const tracking = $('#underside-tracking');
  const osdMode = $('#osd-mode');
  const osdTime = $('#osd-time');
  const intrusion = $('#intrusion');
  const intrusionText = $('#intrusion-text');
  const scareCanvas = $('#scare-canvas');
  const escapeUi = $('#escape-ui');
  const escapeButton = $('#escape-hold');
  const escapeMeter = $('#escape-meter');
  const live = $('#underside-live');
  const outside = $('#outside');
  const stages = {
    hall: $('#hall-canvas'),
    tape2d: $('#tapes-canvas'),
    tape3d: $('#tapes-3d'),
    nursery: $('#nursery-canvas'),
    devil: $('#devil-canvas')
  };

  const audio = createUndersideAudio({ gentle });
  const bloodCanvas = $('#blood-canvas');
  const crackCanvas = $('#crack-canvas');
  const scratchCanvas = $('#scratch-canvas');
  const scratchCtx = scratchCanvas.getContext('2d');
  let scratchMark = null; // { born, seed }
  const pulseEl = $('#pulse');
  const blood = createBloodLayer(bloodCanvas);
  const cracks = createCrackLayer(crackCanvas);
  const signedUpAs = loadDetails()?.name ?? '';
  const handImage = new Image();
  handImage.src = './assets/underside/generated/hand-on-glass.png';
  const flashes = createFlashLimiter({ max: 3, windowMs: 1000, gentle });
  const scares = createScareGate({ maxPerRun: 2, minGapMs: UNDERSIDE.scareGapMs, gentle });
  const backtrack = createBacktrackDetector(UNDERSIDE.backtrackPx);
  const spline = createSplineLayer($('#underside-spline'));
  const name = guestName(loadDetails());
  const eyes = createEyeField(UNDERSIDE.eyePairs);
  const familyImage = new Image();
  familyImage.src = UNDERSIDE.familyImage;
  const foundImages = UNDERSIDE.foundImages.map((src) => {
    const img = new Image();
    img.decoding = 'async';
    img.dataset.src = src;
    return img;
  });
  const loadFound = () => foundImages.forEach((img) => {
    if (!img.src) img.src = img.dataset.src;
  });
  const pickFound = () => foundImages[Math.floor(Math.random() * foundImages.length)];
  const scareImages = Object.fromEntries(Object.entries(UNDERSIDE.scares).map(([key, { src, focus }]) => {
    const img = new Image();
    img.src = src;
    return [key, { img, focus }];
  }));
  const hallwayFootage = UNDERSIDE.broadcastFootage.map((src) => {
    if (!src) return null;
    const img = new Image();
    img.src = src;
    return img;
  });

  // ---------- layout ----------
  let vw = innerWidth;
  let vh = innerHeight;
  let sections = [];
  let trackHeight = 0;
  const rooms = [...track.querySelectorAll('.u-room')].map((el, index) => ({ el, index, canvas: el.querySelector('canvas'), top: 0, height: 0 }));
  const frames = [...track.querySelectorAll('.u-frame')].filter((el) => el.querySelector('img')).map((el) => ({
    el,
    img: el.querySelector('img'),
    host: el.hasAttribute('data-host')
  }));
  const hostIndex = frames.findIndex((frame) => frame.host);
  const pinned = { eyes: $('#eyes-canvas'), hallway: $('#broadcast-canvas'), exit: $('#exit-canvas') };
  const gates = Object.keys(GATE_AT).map((id) => ({ id, y: 0, solved: false }));
  const gate = (id) => gates.find((g) => g.id === id);

  // 3D scenes (declared early because measure() resizes them)
  let hall = null;
  let crtRoom = null;
  let crtState = 'idle';
  let running = false;
  let smoothY = 0;

  function measure() {
    vw = innerWidth;
    vh = innerHeight;
    sections = BEATS.map(({ id }) => {
      const el = track.querySelector(`[data-beat="${id}"]`);
      return { id, el, top: el.offsetTop, height: el.offsetHeight };
    });
    trackHeight = track.offsetHeight;
    spacer.style.height = `${trackHeight}px`;
    gates.forEach((g) => {
      const [beat, at] = GATE_AT[g.id];
      const s = section(beat);
      g.y = s.top + at * Math.max(0, s.height - vh);
    });
    rooms.forEach((room) => {
      room.top = room.el.offsetTop + room.el.offsetParent.offsetTop;
      room.height = room.el.offsetHeight;
      sizeCanvas(room.canvas, UNDERSIDE.roomResolution);
    });
    Object.values(pinned).forEach((canvas) => sizeCanvas(canvas, UNDERSIDE.pinnedResolution));
    [stages.tape2d, stages.nursery, stages.devil].forEach((canvas) => sizeCanvas(canvas, UNDERSIDE.pinnedResolution));
    sizeCanvas(staticCanvas, 0.5);
    sizeCanvas(bloodCanvas, 0.5);
    sizeCanvas(crackCanvas, 0.75);
    sizeCanvas(scratchCanvas, 0.75);
    sizeCanvas(scareCanvas, 0.6);
    const res = UNDERSIDE.crtResolution * quality;
    crtRoom?.resize(Math.round(vw * res), Math.round(vh * res));
    hall?.resize(Math.round(vw * res), Math.round(vh * res));
    if (running) window.scrollTo(0, maxScroll() - smoothY);
  }

  // Adaptive quality: if frames run slow, every canvas renders smaller (see update()).
  let quality = 1;
  function sizeCanvas(canvas, baseScale) {
    const scale = baseScale * quality;
    // clientWidth/Height ignore the 180° rotation and the track's translate.
    const width = Math.max(2, Math.round((canvas.clientWidth || vw) * scale));
    const height = Math.max(2, Math.round((canvas.clientHeight || vh) * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  const section = (id) => sections.find((s) => s.id === id);
  const maxScroll = () => Math.max(0, trackHeight - vh);
  const localProgress = (s, y) => clamp((y - s.top) / Math.max(1, s.height - vh));
  function visibility(s, y) {
    if (y + vh < s.top) return Math.max(-1, (y + vh - s.top) / vh);
    if (y > s.top + s.height) return 0;
    const shown = Math.min(y + vh, s.top + s.height) - Math.max(y, s.top);
    return clamp(shown / vh);
  }
  /** Where the middle of the screen is, on the BEATS scale. */
  function storyProgress(y) {
    const mid = y + vh * 0.5;
    let previousEnd = 0;
    for (let i = 0; i < sections.length; i += 1) {
      const s = sections[i];
      const end = BEATS[i].end;
      if (mid < s.top + s.height || i === sections.length - 1) {
        return previousEnd + clamp((mid - s.top) / s.height) * (end - previousEnd);
      }
      previousEnd = end;
    }
    return 1;
  }

  // ---------- state ----------
  let lastTime = performance.now();
  let startTime = 0;
  let pausedTimecode = null;
  let locked = false;
  let lockedMs = 0;
  let shake = 0;
  let rotation = 180;
  let staticBoost = 0;
  let lastInput = performance.now();
  let hiddenAt = 0;
  let lookedAwayBoost = 0;
  let hallwayStep = -1;
  let climaxDone = false;
  let escapeHold = 0;
  let holding = false;
  let exiting = false;
  let ending = false;
  let backtrackCount = 0;
  let muted = false;
  let fastForwarding = false;
  let openGateId = null;
  let nextSubliminal = performance.now() + 30000; // nothing jumps for a long while
  const pointer = { x: vw / 2, y: vh / 2 };
  const shownCards = new Set();

  // Per-room state
  const tapeState = { stops: 0, ejected: false, grinBoost: 0 };
  const dollState = { stage: 0, winds: 0, wind: 0, holding: false, playing: false, crank: 0, light: 1, look: 0, near: 0, nearTarget: 0, lastScold: 0, headless: false, roll: 0 };
  let heartPhase = 0;
  let lastDreadStep = -1;
  let lastHoldTick = 0;
  let lastFearStep = -1;
  let heartBpm = 60;
  let lastHeartSync = 0;
  let rsvpTries = 0;
  const devilState = { presence: 0, speak: 0, rage: 0, gone: 0, spoke: false };

  // ---------- party clock ----------
  const timerEl = $('#party-timer');
  const timerText = $('#party-timer-text');
  const timeParam = Number(new URLSearchParams(location.search).get('time'));
  const baseLimit = timeParam > 0 ? Math.min(900, Math.max(10, timeParam)) * 1000 : UNDERSIDE.timeLimitMs;
  const timeLimit = baseLimit + (gentle ? UNDERSIDE.gentleExtraMs : 0);

  // ---------- cards: the house talks to you, the right way up ----------
  let cardTimer = 0;
  function card(text, { ms = 2200, sound = true } = {}) {
    if (exiting || ending || !scareCanvas.hidden) return;
    clearTimeout(cardTimer);
    intrusionText.textContent = text;
    intrusion.hidden = false;
    intrusion.classList.remove('is-on');
    void intrusion.offsetWidth;
    intrusion.classList.add('is-on');
    if (sound) audio?.staticBurst(0.25, 0.3);
    staticBoost = Math.max(staticBoost, 0.6);
    cardTimer = setTimeout(() => {
      intrusion.classList.remove('is-on');
      cardTimer = setTimeout(() => {
        intrusion.hidden = true;
      }, 300);
    }, ms);
  }
  function cardOnce(key, text, options) {
    if (shownCards.has(key)) return false;
    shownCards.add(key);
    card(text, options);
    return true;
  }
  function announce(text) {
    live.textContent = '';
    setTimeout(() => {
      live.textContent = text;
    }, 50);
  }

  // ---------- subliminal frames (rare) ----------
  const staticCtx = staticCanvas.getContext('2d');
  let subliminalFrames = 0;
  let subliminalImage = null;
  function subliminal(image = null, frameCount = 3) {
    if (gentle || !flashes.tryFlash(performance.now())) return;
    subliminalFrames = frameCount;
    subliminalImage = image ?? (Math.random() < 0.5 ? pickFound() : null);
  }

  // ---------- voices ----------
  const voiceUrl = (clip) => `${UNDERSIDE.voiceDir}${clip}.mp3`;
  async function sayAsIt(clip, fallbackText) {
    try {
      await audio.playClip(voiceUrl(clip), { fx: 'it', level: 1.1 });
    } catch {
      await speakAsIt(fallbackText, { volume: gentle ? 0.4 : 0.9 });
    }
  }
  async function sayOnRadio(line, text) {
    try {
      await audio.playClip(voiceUrl(line.clip), { fx: 'radio', level: 0.9, pan: line.who ? 0.35 : -0.35 });
    } catch {
      await speak(text, { voice: line.who, pitch: line.who ? 0.85 : 1.1, rate: 0.95, volume: gentle ? 0.35 : 0.6 });
    }
  }

  // ---------- the radio search party (rooms) ----------
  const radioEl = $('#radio');
  const radioText = $('#radio-text');
  let radioRun = 0;
  async function runRadio() {
    const run = ++radioRun;
    radioEl.hidden = false;
    for (const line of COPY.radio) {
      if (run !== radioRun) return;
      audio?.tuning(0.7, 0.1);
      await wait(650);
      if (run !== radioRun) return;
      const text = line.text.replaceAll('{NAME}', name ? name.charAt(0) + name.slice(1).toLowerCase() : 'hello');
      radioText.textContent = text;
      const chop = setInterval(() => audio?.staticBurst(0.08, 0.12), 380);
      await sayOnRadio(line, text);
      clearInterval(chop);
      await wait(900);
    }
    if (run === radioRun) radioText.textContent = '— — —';
  }
  function stopRadio() {
    radioRun += 1;
    radioEl.hidden = true;
    hush();
  }

  // ---------- 3D scenes, loaded lazily (flat versions are the fallback) ----------
  function loadHall() {
    frames.forEach((frame) => {
      frame.img.loading = 'eager';
    });
    import('./gallery-hall.js')
      .then(({ createGalleryHall }) => {
        hall = createGalleryHall(stages.hall, frames.map((frame) => frame.img), { gentle });
        hall.resize(Math.round(vw * UNDERSIDE.crtResolution), Math.round(vh * UNDERSIDE.crtResolution));
        section('hall').el.classList.add('is-3d');
      })
      .catch((error) => {
        console.warn('3D hall unavailable; using the flat frames.', error);
        gate('host').solved = true;
      });
  }
  function loadCrtRoom() {
    crtState = 'loading';
    import('./crt-room.js')
      .then(({ createCrtRoom }) => {
        loadFound();
        crtRoom = createCrtRoom(stages.tape3d, { wallImage: foundImages[1] });
        crtRoom.resize(Math.round(vw * UNDERSIDE.crtResolution), Math.round(vh * UNDERSIDE.crtResolution));
        crtState = 'ready';
      })
      .catch((error) => {
        console.warn('3D room unavailable; using the flat tape.', error);
        crtState = 'failed';
      });
  }

  // ---------- blood ----------
  function bleed(level = 0.4, size = 1) {
    audio?.splat(level);
    if (!gentle) blood.splatter(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.6, size);
  }

  // ---------- the hammer: the punishment for a wrong move ----------
  // It rushes you and hits the glass. Then it hits it again. And again. Then it steps back, sad.
  async function hammer() {
    if (gentle || !flashes.tryFlash(performance.now())) {
      audio?.slam(0.5);
      return;
    }
    scareCanvas.hidden = false;
    root.classList.add('is-scaring');
    audio?.skitter(0.35);
    audio?.screech(0.5, 0.14);
    const impact = (x, y, size) => {
      audio?.slam(1);
      audio?.splat(0.55);
      if (!gentle) blood.splatter(x, y, size);
      cracks.hit(x, y);
      shake = 1;
    };
    let struck = false;
    await animate(950, (t, now) => {
      const hit = drawHammerFace(scareCtx, scareCanvas.width, scareCanvas.height, { t: t * 0.56, now });
      if (hit && !struck) {
        struck = true;
        impact(0.47, 0.42, 1.3);
      }
    });
    for (let blow = 1; blow <= 2; blow += 1) {
      let hitThis = false;
      await animate(480 - blow * 60, (k, now) => {
        const hit = drawHammerBeat(scareCtx, scareCanvas.width, scareCanvas.height, { k, now, blow });
        if (hit && !hitThis) {
          hitThis = true;
          impact(0.35 + Math.random() * 0.3, 0.3 + Math.random() * 0.35, 1.1 + blow * 0.3);
        }
      });
    }
    await animate(900, (t, now) => {
      drawHammerFace(scareCtx, scareCanvas.width, scareCanvas.height, { t: 0.56 + t * 0.44, now });
      shake = Math.max(0, shake - 0.06);
    });
    shake = 0;
    scareCtx.clearRect(0, 0, scareCanvas.width, scareCanvas.height);
    scareCanvas.hidden = true;
    root.classList.remove('is-scaring');
  }

  // ---------- low-poly 3D gore set-pieces (massacre.js) ----------
  let massacre = null;
  const massacreCanvas = $('#massacre-canvas');
  const goreSounds = {
    slice: () => audio?.slice(),
    squirt: () => audio?.splat(0.22),
    sever: () => {
      audio?.snap();
      audio?.splat(0.5);
    },
    chop: () => {
      audio?.slam(0.8);
      audio?.snap();
      audio?.splat(0.45);
    },
    stab: () => {
      audio?.slice();
      audio?.splat(0.4);
    },
    tear: () => {
      audio?.splat(0.5);
      audio?.skitter(0.3);
    },
    squelch: () => audio?.splat(0.18),
    bugs: () => audio?.skitter(1.4),
    turn: () => {
      audio?.screech(0.6, 0.18);
      audio?.braam(1.6, 0.3);
    }
  };
  async function gore(name) {
    if (gentle) return;
    try {
      if (!massacre) {
        const { createMassacre } = await import('./massacre.js');
        massacre = createMassacre(massacreCanvas, { quality });
      }
      massacre.resize(Math.round(vw * UNDERSIDE.crtResolution * quality), Math.round(vh * UNDERSIDE.crtResolution * quality));
      massacreCanvas.hidden = false;
      await massacre.play(name, { onHit: (kind) => goreSounds[kind]?.() });
    } catch (error) {
      console.warn('Gore scene unavailable.', error);
    }
    massacreCanvas.hidden = true;
  }

  // ---------- jumpscares ----------
  const scareCtx = scareCanvas.getContext('2d');
  function animate(ms, draw) {
    const start = performance.now();
    return new Promise((resolve) => {
      const frame = (now) => {
        const t = Math.min(1, (now - start) / ms);
        draw(t, now);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }
  const grinnerFrame = (t, now) => {
    const { width: w, height: h } = scareCanvas;
    const stepped = Math.floor(t * 9) / 9;
    drawGrinner(scareCtx, w, h, { t: now / 1000, scale: 0.9 + t * t * 0.7, grin: 0.8 + stepped * 0.6, blood: 0.35 + t * 0.65, stare: 1 });
    tear(scareCtx, w, h, 4 + Math.round(t * 6), w * 0.07);
    grain(scareCtx, w, h, 0.28);
  };
  async function jumpscare({ duration = UNDERSIDE.scareMs, draw = grinnerFrame, silentStab = false, force = false } = {}) {
    const gateOk = scares.tryScare(performance.now()) || (force && !gentle);
    const allowed = gateOk && flashes.tryFlash(performance.now());
    scareCanvas.hidden = false;
    root.classList.add('is-scaring');
    if (allowed) {
      audio?.restore();
      if (!silentStab) {
        audio?.stab();
        audio?.screech(0.9, 0.22);
        audio?.braam(1.8, 0.35);
        bleed(0.45, 1.6);
      }
      spline.trigger('figure');
      await animate(duration, (t, now) => {
        draw(t, now);
        shake = 1;
      });
    } else {
      await animate(2600, (t, now) => {
        const { width: w, height: h } = scareCanvas;
        drawGrinner(scareCtx, w, h, { t: now / 1000, scale: 0.8, grin: 0.7, alpha: Math.sin(Math.PI * t) * 0.45 });
      });
    }
    shake = 0;
    scareCtx.fillStyle = '#000';
    scareCtx.fillRect(0, 0, scareCanvas.width, scareCanvas.height);
    await wait(600);
    scareCanvas.hidden = true;
    root.classList.remove('is-scaring');
  }

  // ---------- scroll lock (scripted moments) ----------
  function lock() {
    locked = true;
    document.documentElement.classList.add('is-underside-locked');
  }
  function unlock() {
    locked = false;
    document.documentElement.classList.remove('is-underside-locked');
  }

  // ======================================================================================
  // LOCKS
  // ======================================================================================
  function openGate(id) {
    if (openGateId === id) return;
    closeGate();
    openGateId = id;
    const el = $(`#gate-${id}`);
    if (el) el.hidden = false;
    if (id === 'host') stages.hall.classList.add('is-picking');
    if (id === 'leave') audio?.errorChime();
    if (id === 'doors') $('#radio').hidden = true;
    if (id === 'rsvp') setTimeout(() => $('#rsvp-name')?.focus({ preventScroll: true }), 400);
  }
  function closeGate() {
    if (!openGateId) return;
    const el = $(`#gate-${openGateId}`);
    if (el) el.hidden = true;
    stages.hall.classList.remove('is-picking');
    openGateId = null;
  }
  function solve(id, message) {
    const g = gate(id);
    if (!g || g.solved) return;
    g.solved = true;
    closeGate();
    audio?.slam(0.45);
    if (message) setTimeout(() => card(message, { ms: 2000, sound: false }), 300);
  }

  // 1. Hall: click the host's portrait.
  stages.hall.addEventListener('click', (event) => {
    if (openGateId !== 'host' || !hall) return;
    const x = (event.clientX / innerWidth) * 2 - 1;
    const y = -(event.clientY / innerHeight) * 2 + 1;
    const index = hall.pick(x, y);
    if (index < 0) return;
    if (index === hostIndex) {
      hall.wake(index);
      audio?.pianoCluster(0.35);
      audio?.braam(2.4, 0.25);
      solve('host', COPY.hostFound);
    } else {
      hall.spoil(index);
      audio?.whisper(1.2, 0.14, x);
      card(COPY.wrongPortrait, { ms: 1200 });
    }
  });

  // 2. Tape: the TV won't stop. Press stop until it gives up; then eject.
  const vcrDisplay = $('#vcr-display');
  $('#vcr-stop').addEventListener('click', () => {
    if (tapeState.ejected) return;
    tapeState.stops += 1;
    tapeState.grinBoost = Math.min(1, tapeState.stops * 0.35);
    audio?.clunk();
    vcrDisplay.textContent = tapeState.stops < 3 ? 'PLAY ▶' : 'EJECT?';
    staticBoost = 1;
    if (tapeState.stops < 3) card(COPY.stillPlaying, { ms: 1300 });
  });
  $('#vcr-eject').addEventListener('click', () => {
    if (tapeState.stops < 3) {
      audio?.clunk();
      vcrDisplay.textContent = 'NO.';
      return;
    }
    tapeState.ejected = true;
    vcrDisplay.textContent = 'NO SIGNAL';
    audio?.clunk();
    audio?.staticBurst(0.8, 0.35);
    solve('vcr');
  });

  // 3. Nursery: wind the music box three times. Each time it runs down, the doll changes.
  const windButton = $('#music-wind');
  const windMeter = $('#music-meter');
  const windCount = $('#music-count');
  const setWinding = (value) => {
    if (dollState.playing || dollState.winds >= 3 || gate('music').solved) return;
    dollState.holding = value;
  };
  windButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    windButton.setPointerCapture?.(event.pointerId);
    setWinding(true);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => windButton.addEventListener(type, () => setWinding(false)));
  windButton.addEventListener('keydown', (event) => {
    if ((event.code === 'Space' || event.code === 'Enter') && !event.repeat) {
      event.preventDefault();
      setWinding(true);
    }
  });
  windButton.addEventListener('keyup', () => setWinding(false));
  const windLabel = $('#music-wind .crank-button__label');
  async function playMusicBox() {
    dollState.playing = true;
    dollState.holding = false;
    windLabel.textContent = 'Listen…';
    windButton.disabled = true;
    await audio?.lullaby(10);
    // The box runs down. The lamp goes. When it comes back, the doll is not the same.
    dollState.light = 0.05;
    audio?.creak(0.8, 0.15);
    await wait(700);
    dollState.winds += 1;
    dollState.stage = Math.min(1, dollState.winds / 3);
    windCount.textContent = COPY.musicCount(dollState.winds);
    dollState.nearTarget = dollState.winds * 0.28; // closer every time
    if (dollState.winds === 2) {
      bleed(0.35, 0.8);
      audio?.playClip(voiceUrl('doll-play-with-me'), { fx: 'radio', level: 0.9 }).catch(() => {});
    }
    if (dollState.winds >= 3) {
      subliminal(null, 3);
      audio?.screech(0.5, 0.15);
      bleed(0.4, 1);
    }
    dollState.light = 1;
    dollState.wind = 0;
    windMeter.style.setProperty('--wind', '0');
    dollState.playing = false;
    windLabel.textContent = 'Hold to wind';
    windButton.disabled = false;
    if (dollState.winds >= 3) {
      await headRoll();
      solve('music', COPY.didntLike);
    }
  }

  // The doll's head comes off, drops, and rolls across the floor straight at you.
  async function headRoll() {
    if (gentle) return;
    lock();
    $('#gate-music').hidden = true;
    await wait(900);
    audio?.snap();
    dollState.headless = true;
    bleed(0.3, 0.6);
    let bounced = false;
    let hit = false;
    audio?.roll(2.6, 0.35);
    await animate(3200, (t) => {
      dollState.roll = t;
      if (t > 0.2 && !bounced) {
        bounced = true;
        audio?.glassThump(0.35);
      }
      if (t >= 0.85 && !hit) {
        hit = true;
        audio?.slam(0.9);
        cracks.hit(0.56, 0.58);
        bleed(0.5, 1.1);
        shake = 1;
        audio?.playClip(voiceUrl('doll-play-with-me'), { fx: 'it', level: 1 }).catch(() => {});
      }
    });
    shake = 0;
    await wait(1400);
    unlock();
  }

  // 4. Rooms: three doors. The radio says left. The radio is not who it says it is.
  const CORRECT_DOOR = 2;
  let wrongDoors = 0;
  $('#gate-doors').addEventListener('click', (event) => {
    const button = event.target.closest('.door-button');
    if (!button) return;
    const door = Number(button.dataset.door);
    if (door === CORRECT_DOOR) {
      audio?.creak(1.4, 0.2);
      solve('doors');
      return;
    }
    button.classList.remove('is-wrong');
    void button.offsetWidth;
    button.classList.add('is-wrong');
    button.disabled = true;
    wrongDoors += 1;
    (wrongDoors === 1 ? hammer() : gore('hand')).then(() => card(COPY.wrongDoor, { ms: 1400 }));
  });

  // 5. Leave: a dialog that won't let you go. The × runs from your cursor until it gets tired.
  const leaveDialog = $('#gate-leave .retro-dialog');
  const leaveX = $('#leave-x');
  let dodges = 0;
  leaveX.addEventListener('pointerenter', () => {
    if (dodges >= 6) return;
    dodges += 1;
    const dx = (Math.random() - 0.5) * 360;
    const dy = (Math.random() - 0.5) * 240;
    leaveX.style.transform = `translate(${dx}px, ${dy}px)`;
    audio?.errorChime();
  });
  leaveX.addEventListener('click', async () => {
    leaveX.style.transform = '';
    audio?.staticBurst(0.6, 0.4);
    closeGate();
    await handsOnGlass();
    lock();
    await gore('facewall');
    unlock();
    solve('leave');
  });
  $('#gate-leave').addEventListener('click', (event) => {
    if (!event.target.matches('[data-stay]')) return;
    leaveDialog.classList.remove('is-shaking');
    void leaveDialog.offsetWidth;
    leaveDialog.classList.add('is-shaking');
    audio?.errorChime();
    card(COPY.stay, { ms: 1000, sound: false });
  });

  // You closed it. Something on the other side of the screen did not want you to.
  async function handsOnGlass() {
    if (gentle) return;
    lock();
    scareCanvas.hidden = false;
    scareCanvas.classList.add('is-overlay');
    audio?.whisper(3, 0.14, -0.6);
    setTimeout(() => audio?.whisper(2.6, 0.14, 0.6), 400);
    let landed = 0;
    await animate(4200, (t) => {
      const n = drawHandsOnGlass(scareCtx, scareCanvas.width, scareCanvas.height, { p: t, count: 18, img: handImage });
      while (landed < n) {
        landed += 1;
        audio?.glassThump(0.25 + Math.random() * 0.25);
        if (landed % 6 === 0) bleed(0.2, 0.5);
      }
    });
    scareCtx.clearRect(0, 0, scareCanvas.width, scareCanvas.height);
    scareCanvas.classList.remove('is-overlay');
    scareCanvas.hidden = true;
    unlock();
  }

  // The host reaches out of the fog and drags its nails down your screen.
  async function devilClaw() {
    if (gentle) return;
    scareCanvas.hidden = false;
    scareCanvas.classList.add('is-overlay');
    audio?.braam(2.2, 0.35);
    let scraping = false;
    await animate(2000, (t, now) => {
      drawDevilClaw(scareCtx, scareCanvas.width, scareCanvas.height, { p: t, t: now / 1000 });
      if (t > 0.58 && !scraping) {
        scraping = true;
        audio?.scrape(0.9, 0.32);
        scratchMark = { born: now, seed: Math.random() * 100 };
        shake = 0.6;
      }
    });
    shake = 0;
    scareCtx.clearRect(0, 0, scareCanvas.width, scareCanvas.height);
    scareCanvas.classList.remove('is-overlay');
    scareCanvas.hidden = true;
    bleed(0.4, 1);
  }

  // 6. Devil: type your name to cancel your RSVP. It does not like that.
  const rsvpForm = $('#gate-rsvp');
  const rsvpInput = $('#rsvp-name');
  rsvpInput.addEventListener('input', () => {
    devilState.rage = Math.min(0.8, devilState.rage + 0.08);
    audio?.whisper(0.4, 0.08, (Math.random() - 0.5) * 1.6);
  });
  const normalise = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ');
  const nameMatches = (typed) => {
    if (!signedUpAs) return normalise(typed).length > 0;
    const want = normalise(signedUpAs);
    const got = normalise(typed);
    return got === want || (got.length > 1 && got === want.split(' ')[0]);
  };
  rsvpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (gate('rsvp').solved || locked) return;
    if (!nameMatches(rsvpInput.value)) {
      // Wrong name. It laughs, the hammer comes, and it takes time from you.
      rsvpTries += 1;
      lock();
      closeGate();
      devilState.rage = 1;
      devilState.speak = 1;
      audio?.braam(2, 0.35);
      sayAsIt('devil-wrong', 'Wrong. That is not your name.').then(() => {
        devilState.speak = 0;
      });
      await wait(900);
      await hammer();
      await gore(rsvpTries === 1 ? 'bugface' : 'gut');
      lockedMs -= 30000; // the clock jumps 30 seconds toward 3:00 AM
      timerEl.classList.add('is-jump');
      setTimeout(() => timerEl.classList.remove('is-jump'), 1200);
      card(rsvpTries > 1 ? COPY.minusTime : COPY.notYourName, { ms: 1600 });
      rsvpInput.value = '';
      unlock();
      return;
    }
    lock();
    closeGate();
    devilState.rage = 1;
    audio?.braam(3, 0.45);
    audio?.screech(1.2, 0.2);
    devilState.speak = 1;
    await sayAsIt('devil-nobody-leaves', 'Nobody leaves my party.');
    devilState.speak = 0;
    await devilClaw();
    // It burns away. The door behind it is open.
    bleed(0.5, 1.4);
    await animate(1600, (t) => {
      devilState.gone = t;
    });
    gate('rsvp').solved = true;
    unlock();
    card(COPY.rsvpDone, { ms: 1800, sound: false });
  });

  // ======================================================================================
  // CLIMAX (hallway): it grows out of the corners, cuts off its arm, and offers it to you.
  // ======================================================================================
  const takeIt = $('#take-it');
  async function climax() {
    climaxDone = true;
    lock();
    audio?.silence(0.04);
    pausedTimecode = osdTime.textContent;
    osdMode.textContent = '❚❚ PAUSE';
    await wait(900);
    card(COPY.dontTurn, { ms: 1600, sound: false });
    await wait(1900);
    if (!gentle) {
      scareCanvas.hidden = false;
      scareCanvas.classList.add('is-overlay');
      const { width: w, height: h } = scareCanvas;
      const tag = name ? `FOR ${name}` : 'FOR YOU';
      audio?.braam(3.2, 0.3);
      audio?.whisper(2.4, 0.12, -0.8);
      setTimeout(() => audio?.whisper(2, 0.12, 0.8), 500);
      await animate(2400, (t, now) => drawCornerCreep(scareCtx, w, h, { p: t, t: now / 1000 }));
      await wait(700);
      audio?.skitter(0.5);
      audio?.screech(0.45, 0.16);
      await animate(260, (t, now) => drawLongOne(scareCtx, w, h, { emerge: t * 0.55, t: now / 1000, tag }));
      await wait(180);
      await animate(220, (t, now) => drawLongOne(scareCtx, w, h, { emerge: 0.55 + t * 0.45, t: now / 1000, tag }));
      await animate(1300, (t, now) => drawLongOne(scareCtx, w, h, { emerge: 1, t: now / 1000, tag }));
      audio?.slice();
      await animate(260, (t, now) => drawLongOne(scareCtx, w, h, { emerge: 1, slash: t, t: now / 1000, tag }));
      audio?.snap();
      bleed(0.55, 1.5);
      audio?.pianoCluster(0.35);
      staticBoost = 1;
      await animate(300, (t, now) => drawLongOne(scareCtx, w, h, { emerge: 1, slash: 1, detach: t, t: now / 1000, tag }));
      audio?.skitter(0.3);
      await animate(1500, (t, now) => drawLongOne(scareCtx, w, h, {
        emerge: 1, slash: 1, detach: 1, offer: t < 0.35 ? (t / 0.35) * 0.55 : 0.55 + ((t - 0.35) / 0.65) * 0.45, t: now / 1000, tag
      }));
      // "Take it." You can. You don't have to. It comes either way.
      sayAsIt('it-take-it', COPY.takeIt);
      takeIt.hidden = false;
      takeIt.focus({ preventScroll: true });
      let taken = false;
      takeIt.addEventListener('click', () => {
        taken = true;
      }, { once: true });
      const start = performance.now();
      await new Promise((resolve) => {
        const frame = (now) => {
          drawLongOne(scareCtx, w, h, { emerge: 1, slash: 1, detach: 1, offer: 1, t: now / 1000, tag });
          if (taken || now - start > 4200) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      takeIt.hidden = true;
      // It turns the arm around, and drives the broken bone into the glass. Again. Again.
      audio?.screech(0.4, 0.16);
      for (let stab = 0; stab < 3; stab += 1) {
        let hit = false;
        await animate(620 - stab * 110, (k, now) => {
          drawLongOne(scareCtx, w, h, { emerge: 1, slash: 1, detach: 1, offer: 0.75, t: now / 1000, tag });
          if (drawBoneStab(scareCtx, w, h, { k, t: now / 1000 }) && !hit) {
            hit = true;
            audio?.slam(0.9);
            bleed(0.5, 1 + stab * 0.3);
            cracks.hit(0.42 + stab * 0.06, 0.45 - stab * 0.04);
            shake = 1;
          }
        });
      }
      shake = 0;
      scareCtx.clearRect(0, 0, w, h);
      await gore('throat');
      audio?.riser(0.9, 0.3);
      await animate(900, (t, now) => drawLongOne(scareCtx, w, h, { emerge: 1, slash: 1, detach: 1, offer: 1, t: now / 1000, tag }));
      await wait(90);
      scareCanvas.classList.remove('is-overlay');
      await jumpscare();
    } else {
      audio?.breath(1.4);
      await wait(1100);
      await jumpscare();
    }
    pausedTimecode = null;
    osdMode.textContent = 'PLAY ▶';
    audio?.restore();
    audio?.setHeartRate(0);
    unlock();
  }

  // ======================================================================================
  // OUT OF TIME
  // ======================================================================================
  async function partyEnded() {
    if (ending || exiting) return;
    ending = true;
    lock();
    closeGate();
    stopRadio();
    escapeUi.hidden = true;
    intrusion.hidden = true;
    audio?.silence(0.2);
    // The clock breaks. A bell, three times: it is 3:00 AM.
    cracks.hit(0.5, 0.07);
    audio?.slam(0.8);
    for (let i = 0; i < 3; i += 1) {
      audio?.bell(0.45);
      await wait(1500);
    }
    root.classList.add('is-ending');
    Object.values(stages).forEach((canvas) => {
      canvas.style.opacity = '0';
    });
    const endEl = $('#party-ended');
    const endText = $('#party-ended-text');
    await wait(1800);
    endText.textContent = COPY.partyEnded;
    endEl.hidden = false;
    announce('It is 3 AM. The party has ended.');
    await sayAsIt('it-party-ended', 'The party has ended.');
    await wait(700);

    if (gentle) {
      endText.textContent = COPY.iSeeYou;
      await sayAsIt('it-we-see-you', 'We see you.');
      await wait(1200);
      endEl.hidden = true;
      await jumpscare({ force: true });
      location.href = './index.html';
      return;
    }

    endEl.hidden = true;
    scareCanvas.hidden = false;
    scareCanvas.classList.add('is-overlay');
    const w = scareCanvas.width;
    const h = scareCanvas.height;
    audio?.restore();
    // 1. It swallows the screen from the corners.
    audio?.braam(4, 0.35);
    audio?.whisper(3, 0.15, -0.8);
    setTimeout(() => audio?.whisper(2.6, 0.15, 0.8), 400);
    await animate(2600, (t, now) => creep(scareCtx, w, h, { p: t, t: now / 1000 }));
    // 2. Pieces of the other guests come down.
    audio?.screech(0.6, 0.15);
    let landed = 0;
    await animate(4200, (t, now) => {
      creep(scareCtx, w, h, { p: 1, t: now / 1000 });
      const n = drawSeveredRain(scareCtx, w, h, { p: t, t: now / 1000 });
      while (landed < n) {
        landed += 1;
        audio?.glassThump(0.3);
        if (landed % 4 === 0) bleed(0.3, 0.6);
      }
    });
    // 3. The party, after: in 3D, it stabs the cake until the cake bleeds. Then it sees you.
    await runStabScene();
    await gore('stabline');
    await gore('gut');
    await gore('bugface');
    // 4. We see you. Hands on the glass.
    scareCtx.clearRect(0, 0, w, h);
    endText.textContent = COPY.iSeeYou;
    endEl.classList.add('is-second');
    endEl.hidden = false;
    await sayAsIt('it-we-see-you', 'We see you.');
    endEl.hidden = true;
    let hands = 0;
    await animate(3000, (t) => {
      const n = drawHandsOnGlass(scareCtx, w, h, { p: t, count: 22, img: handImage });
      while (hands < n) {
        hands += 1;
        audio?.glassThump(0.3 + Math.random() * 0.2);
      }
    });
    // 5. The host rises, furious, and drags its nails down your screen.
    devilState.speak = 0;
    audio?.braam(3.5, 0.4);
    sayAsIt('devil-nobody-leaves', 'Nobody leaves my party.');
    await animate(2400, (t, now) => drawDevil(scareCtx, w, h, { t: now / 1000, presence: t, rage: 1, speak: 0.5 + Math.random() * 0.5 }));
    let scraped = false;
    await animate(1800, (t, now) => {
      drawDevil(scareCtx, w, h, { t: now / 1000, presence: 1, rage: 1 });
      drawDevilClaw(scareCtx, w, h, { p: t, t: now / 1000, clear: false });
      if (t > 0.58 && !scraped) {
        scraped = true;
        audio?.scrape(1, 0.35);
        scratchMark = { born: now, seed: Math.random() * 100 };
        shake = 0.8;
      }
    });
    shake = 0;
    // 6. The hammer.
    await hammer();
    // 7. Blood rises until there is nothing else.
    scareCanvas.hidden = false;
    audio?.riser(2.2, 0.25);
    await animate(2400, (t, now) => {
      scareCtx.fillStyle = '#000';
      scareCtx.fillRect(0, 0, w, h);
      drawGrinner(scareCtx, w, h, { t: now / 1000, scale: 1, alpha: 0.5, grin: 1.3, blood: 1, stare: 1, dark: false });
      drawBloodFlood(scareCtx, w, h, { p: t, t: now / 1000 });
    });
    await wait(400);
    // 8. Its face.
    await jumpscare({ force: true });
    try {
      sessionStorage.setItem(UNDERSIDE.escapedKey, '1');
    } catch {
      // ignore
    }
    location.href = './index.html';
  }

  async function runStabScene() {
    const canvas = $('#stab-canvas');
    let sceneApi = null;
    try {
      const { createStabScene } = await import('./stab-scene.js');
      sceneApi = createStabScene(canvas);
    } catch (error) {
      console.warn('3D stab scene unavailable.', error);
      return;
    }
    sceneApi.resize(Math.round(vw * UNDERSIDE.crtResolution), Math.round(vh * UNDERSIDE.crtResolution));
    scareCanvas.hidden = true;
    canvas.hidden = false;
    audio?.pianoCluster(0.3);
    let lunged = false;
    const start = performance.now();
    await new Promise((resolve) => {
      const frame = (now) => {
        const t = (now - start) / 1000;
        sceneApi.render(t, {
          onStab: (i) => {
            audio?.slice();
            audio?.splat(0.4 + i * 0.05);
            if (i % 2 === 1) bleed(0.2, 0.5);
          },
          onLunge: () => {
            if (lunged) return;
            lunged = true;
            audio?.skitter(0.6);
            audio?.screech(0.7, 0.2);
          }
        });
        if (t < sceneApi.duration) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    canvas.hidden = true;
    sceneApi.dispose();
    scareCanvas.hidden = false;
  }

  // ======================================================================================
  // ESCAPE
  // ======================================================================================
  function setHolding(value) {
    if (exiting) return;
    holding = value;
    escapeButton.classList.toggle('is-holding', value);
    audio?.setHeartRate(value ? 150 : 0);
  }
  async function finishEscape() {
    exiting = true;
    holding = false;
    timerEl.classList.add('is-stopped');
    lock();
    escapeUi.hidden = true;
    audio?.staticBurst(0.6, 0.4);
    audio?.fadeOut(1.6);
    const gsap = window.gsap;
    const turn = { r: rotation };
    if (gsap && !gentle) {
      await new Promise((resolve) => gsap.to(turn, { r: 360, duration: 1.6, ease: 'power3.inOut', onUpdate: () => (rotation = turn.r), onComplete: resolve }));
    } else {
      rotation = 360;
      await wait(800);
    }
    running = false;
    root.hidden = true;
    spacer.style.height = '0px';
    unlock();
    window.scrollTo(0, 0);
    outside.hidden = false;
    $('#outside-title')?.focus();
    try {
      sessionStorage.setItem(UNDERSIDE.escapedKey, '1');
    } catch {
      // ignore
    }
    document.dispatchEvent(new CustomEvent('underside:escaped'));
    spline.dispose();
    // It is not over. Once the visitor relaxes, it comes back for one second.
    await wait(UNDERSIDE.afterEscapeMs);
    if (!outside.hidden) {
      outside.classList.add('is-haunted');
      const finalAudio = createUndersideAudio({ gentle });
      await finalAudio?.start().catch(() => {});
      finalAudio?.silence(0.01);
      if (!gentle) {
        setTimeout(() => {
          finalAudio?.stab();
          finalAudio?.screech(0.8, 0.22);
          finalAudio?.splat(0.4);
        }, 20);
      }
      scareCanvas.hidden = false;
      root.hidden = false;
      root.classList.add('is-final');
      const { img, focus } = scareImages.final;
      await jumpscare({
        duration: 750,
        silentStab: true,
        draw: (t) => {
          if (!drawLunge(scareCtx, scareCanvas.width, scareCanvas.height, img, { focus, t })) grinnerFrame(t, performance.now());
        }
      });
      root.hidden = true;
      root.classList.remove('is-final');
      outside.classList.remove('is-haunted');
      finalAudio?.fadeOut(0.5);
      setTimeout(() => finalAudio?.close(), 1500);
    }
    audio?.close();
  }

  // ---------- input ----------
  const onPointer = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    lastInput = performance.now();
  };
  const onScrollInput = () => {
    lastInput = performance.now();
  };
  const onKey = (event) => {
    lastInput = performance.now();
    if (!escapeUi.hidden && (event.code === 'Space' || event.code === 'Enter')) {
      event.preventDefault();
      if (event.type === 'keydown' && !event.repeat) setHolding(true);
      if (event.type === 'keyup') setHolding(false);
    }
    if (event.type === 'keydown' && event.key === 'Escape') {
      muted = !muted;
      audio?.setMuted(muted);
      $('#underside-leave')?.focus();
    }
  };
  const onVisibility = () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      return;
    }
    if (hiddenAt && performance.now() - hiddenAt > 1200 && running && !exiting && !ending) {
      lookedAwayBoost = Math.min(1, lookedAwayBoost + 0.5);
      card(COPY.lookedAway, { ms: 2400 });
      subliminal();
    }
    hiddenAt = 0;
  };

  // ======================================================================================
  // FRAME LOOP
  // ======================================================================================
  let lastBeat = '';
  let lastStatic = 0;

  let frameEma = 16;
  let slowFrames = 0;
  function update(now) {
    if (!running) return;
    // Watch the frame rate; if it stays slow, render everything smaller.
    frameEma += ((now - lastTime) - frameEma) * 0.05;
    slowFrames = frameEma > 28 ? slowFrames + 1 : 0;
    if (slowFrames > 90 && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.15);
      slowFrames = 0;
      measure();
    }
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // Upside down: scrolling UP takes you deeper. Locks stop you; the speed limit stops skipping.
    let targetY = maxScroll() - window.scrollY;
    const gated = applyGates(targetY, gates);
    if (gated.blockedBy) {
      if (targetY > gated.y + 6 && !locked) window.scrollTo(0, maxScroll() - gated.y);
      targetY = gated.y;
    }
    const limited = limitScroll(smoothY, targetY, dt, { maxSpeed: vh * UNDERSIDE.maxScreensPerSecond, lead: vh * 1.1 });
    smoothY = limited.y;
    if (limited.pullBackTo !== null && !locked) window.scrollTo(0, maxScroll() - limited.pullBackTo);
    if (limited.fastForward !== fastForwarding) {
      fastForwarding = limited.fastForward;
      root.classList.toggle('is-fast-forward', fastForwarding);
      if (!pausedTimecode) osdMode.textContent = fastForwarding ? '▶▶ FF' : 'PLAY ▶';
    }
    const y = smoothY;
    // Show a lock's controls once you have reached it.
    if (gated.blockedBy && y >= gated.y - 30 && !locked) openGate(gated.blockedBy);
    else if (!gated.blockedBy && openGateId) closeGate();

    const progress = storyProgress(y);
    const dread = dreadAt(progress);
    const beat = beatAt(progress);

    const shakePx = gentle ? 0 : shake * 14 + dread * dread * 1.5 + (beat === 'devil' ? devilState.rage * 5 : 0);
    world.style.transform = `rotate(${rotation}deg) translate3d(${(Math.random() - 0.5) * shakePx}px, ${(Math.random() - 0.5) * shakePx}px, 0)`;
    track.style.transform = `translate3d(0, ${-y}px, 0)`;
    const dreadStep = Math.round(dread * 50) / 50;
    if (dreadStep !== lastDreadStep) {
      lastDreadStep = dreadStep;
      root.style.setProperty('--dread', dreadStep.toFixed(2));
    }
    audio?.setDread(dread);
    audio?.tick(dt);
    osdTime.textContent = pausedTimecode ?? timecode(now - startTime);

    // Your heartbeat, in red at the corners of the screen. Fear drives it.
    const urgent = timerEl.classList.contains('is-urgent');
    const fear = Math.min(1, dread * 0.8 + (openGateId ? 0.15 : 0) + (locked ? 0.35 : 0) + (urgent ? 0.25 : 0) + (beat === 'devil' ? 0.2 : 0) + devilState.rage * 0.2);
    heartBpm += ((58 + fear * 112) - heartBpm) * Math.min(1, dt * 1.5);
    heartPhase = (heartPhase + dt * heartBpm / 60) % 1;
    // Opacity only: it is composited, so the beat costs nothing to repaint.
    pulseEl.style.opacity = (0.12 + heartEnvelope(heartPhase) * (0.1 + fear * 0.78)).toFixed(3);
    const fearStep = Math.round(fear * 10) / 10;
    if (fearStep !== lastFearStep) {
      lastFearStep = fearStep;
      pulseEl.style.setProperty('--fear', fearStep.toFixed(1));
    }
    if (now - lastHeartSync > 700) {
      lastHeartSync = now;
      audio?.setHeartRate(fear > 0.35 ? heartBpm : 0);
    }
    if (!gentle) blood.update(dt, dread, now);
    cracks.update(now);
    if (scratchMark) {
      const age = (now - scratchMark.born) / 1000;
      drawScratches(scratchCtx, scratchCanvas.width, scratchCanvas.height, {
        p: Math.min(1, age / 0.9), seed: scratchMark.seed, fade: age < 3 ? 1 : Math.max(0, 1 - (age - 3) / 1.5)
      });
      if (age > 4.6) {
        scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        scratchMark = null;
      }
    }

    // Party clock: creeping toward 3:00 AM. Scripted, locked moments don't eat your time.
    if (locked) lockedMs += dt * 1000;
    if (!exiting && !ending) {
      const clock = partyClock(timeLimit, now - startTime - lockedMs);
      // A countdown, front and centre; the 3:00 AM deadline is the caption underneath.
      if (timerText.textContent !== clock.label) timerText.textContent = clock.label;
      timerEl.classList.toggle('is-urgent', clock.urgent);
      timerEl.classList.toggle('is-critical', clock.critical);
      if (clock.done && !locked) partyEnded();
    }

    if (beat !== lastBeat) onBeat(beat);

    // A few words, at the right moments
    if (now - startTime > 700) cardOnce('scrollUp', COPY.scrollUp, { ms: 2800 });
    if (progress > 0.05 && cardOnce('noUp', COPY.doNotScrollUp, { ms: 2400 })) backtrack.reset(targetY);
    if (progress > 0.34) cardOnce('see', name ? COPY.weSeeName(name) : COPY.weSee, { ms: 2600 });

    // Scrolling back (down) after being told not to
    if (shownCards.has('noUp') && !locked && backtrack.update(targetY)) {
      backtrackCount += 1;
      if (backtrackCount <= 2) {
        if (backtrackCount === 1) {
          card(COPY.weAsked, { ms: 2200 });
          subliminal(scareImages.backtrack.img, 4);
          bleed(0.3, 0.7);
        } else {
          hammer().then(() => card(COPY.lastWarning, { ms: 1800 }));
        }
        window.scrollBy({ top: -vh * 0.5, behavior: 'smooth' });
      }
    }
    // Stopping is noticed too (not while you're working a lock)
    if (!locked && !openGateId && !exiting && now - lastInput > UNDERSIDE.idleMs && progress > 0.05 && progress < 0.9) {
      if (cardOnce('stop', COPY.whyStop, { ms: 2400 })) audio?.breath(2);
    }
    // Rare subliminal frames once things have started going wrong
    if (now > nextSubliminal && dread > 0.25 && !locked) {
      nextSubliminal = now + 14000 + Math.random() * 16000;
      if (Math.random() < 0.6) subliminal();
    }

    if (!ending) {
      drawHall(y, now, dread);
      drawTapeRoom(y, now);
      drawNurseryRoom(y, now, dt);
      drawEyesBeat(y, now, progress);
      drawRooms(y, now);
      drawHallway(y, now);
      drawDevilRoom(y, now);
      drawExit(y, now);
    }

    if (!escapeUi.hidden && !exiting) {
      const holdDt = Math.min(250, now - (lastHoldTick || now));
      lastHoldTick = now;
      escapeHold = holdProgress(escapeHold, holdDt, holding);
      escapeMeter.style.setProperty('--hold', escapeHold.toFixed(3));
      shake = holding ? escapeHold * 0.5 : Math.max(0, shake - dt * 2);
      if (escapeHold > 0.45) cardOnce('dontLeave', COPY.dontLeave, { ms: 1600 });
      if (escapeHold >= 1) finishEscape();
    }

    if (now - lastStatic > 33) {
      lastStatic = now;
      staticBoost = Math.max(0, staticBoost - 0.08);
      drawStatic(dread);
    }
    tracking.style.opacity = gentle ? '0' : String(clamp(dread * 0.9 + staticBoost * 0.4 - 0.25));
    requestAnimationFrame(update);
  }

  function onBeat(beat) {
    lastBeat = beat;
    announce(COPY.live[beat] ?? '');
    if (beat !== 'hall') loadFound();
    if (beat === 'eyes') {
      audio?.setHeartRate(62);
      setTimeout(() => {
        if (lastBeat === 'eyes') sayAsIt('it-we-see-you', 'We see you.');
      }, 2600);
    }
    if (beat === 'rooms') {
      audio?.setHeartRate(74);
      runRadio();
    } else stopRadio();
    if (beat === 'hallway') audio?.setHeartRate(96);
    if (beat === 'devil' && !devilState.spoke) {
      devilState.spoke = true;
      audio?.setHeartRate(0);
      audio?.braam(3.5, 0.35);
      setTimeout(async () => {
        devilState.speak = 1;
        await sayAsIt('devil-rsvpd', "You R.S.V.P.'d.");
        devilState.speak = 0;
      }, 2200);
    }
  }

  // A few tiles of sparse noise, made once and reused, instead of rebuilding pixels every frame.
  const noiseFrames = [];
  function buildNoiseFrames() {
    for (let f = 0; f < 4; f += 1) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const x = c.getContext('2d');
      const img = x.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = Math.random() < 0.11 ? 140 + Math.random() * 100 : 0;
      }
      x.putImageData(img, 0, 0);
      noiseFrames.push(c);
    }
  }

  function drawStatic(dread) {
    const { width: w, height: h } = staticCanvas;
    staticCtx.clearRect(0, 0, w, h);
    if (subliminalFrames > 0) {
      subliminalFrames -= 1;
      if (!subliminalImage || !drawFoundFrame(staticCtx, w, h, subliminalImage, { alpha: 0.75, tears: 5 })) {
        drawGrinner(staticCtx, w, h, { t: performance.now() / 1000, scale: 1.1, alpha: 0.5, grin: 1.1, blood: 0.6, stare: 1 });
      }
      return;
    }
    const amount = 0.004 + dread * 0.012 + staticBoost * 0.2;
    if (!noiseFrames.length) buildNoiseFrames();
    staticCtx.globalAlpha = Math.min(1, amount * 9);
    const frame = noiseFrames[Math.floor(Math.random() * noiseFrames.length)];
    for (let x = -Math.random() * 256; x < w; x += 256) for (let y = -Math.random() * 256; y < h; y += 256) staticCtx.drawImage(frame, x, y);
    staticCtx.globalAlpha = 1;
  }

  function pin(canvas, s, y) {
    canvas.style.transform = `translate3d(0, ${clamp(y - s.top, 0, Math.max(0, s.height - vh))}px, 0)`;
  }
  const pointerNdc = () => ({ x: (pointer.x / vw) * 2 - 1, y: (pointer.y / vh) * 2 - 1 });
  const show = (canvas, vis) => {
    canvas.style.opacity = vis > 0 ? String(clamp(vis * 1.5)) : '0';
  };

  // ---------- 1. hall ----------
  function drawHall(y, now, dread) {
    const s = section('hall');
    const vis = visibility(s, y);
    if (!hall) return;
    show(stages.hall, vis);
    if (vis > 0) hall.render({ q: localProgress(s, y), now, pointer: pointerNdc(), dread });
  }

  // ---------- 2. tape ----------
  function drawTapeRoom(y, now) {
    const s = section('tape');
    const vis = visibility(s, y);
    if (vis > -0.9 && crtState === 'idle') loadCrtRoom();
    show(crtRoom ? stages.tape3d : stages.tape2d, vis);
    (crtRoom ? stages.tape2d : stages.tape3d).style.opacity = '0';
    if (vis <= 0) return;
    const q = localProgress(s, y);
    // One tape. It plays the family until you make it stop; then snow, and a face in it.
    const info = tapeAt(Math.min(0.999, (q / GATE_AT.vcr[1]) * 0.62), 1);
    const playT = Math.min(1, info.t + tapeState.grinBoost * 0.4);
    const options = { ...info, t: info.phase === 'play' ? playT : info.t, tape: COPY.tapes[0], name, image: familyImage, now, rules: COPY.smileRules };
    const target = crtRoom ? crtRoom.screen : stages.tape2d;
    const ctx = target.getContext('2d');
    if (tapeState.ejected) drawNoSignal(ctx, target.width, target.height, { now, t: q });
    else drawTape(ctx, target.width, target.height, { ...options, onTv: Boolean(crtRoom) });
    if (crtRoom) {
      crtRoom.render({ q, now, gentle, pointer: pointerNdc(), label: tapeState.ejected ? 'EJECTED' : `${COPY.tapes[0].label}  ${COPY.tapes[0].date}` });
    }
  }

  // ---------- 3. nursery ----------
  function drawNurseryRoom(y, now, dt) {
    const s = section('nursery');
    const vis = visibility(s, y);
    show(stages.nursery, vis);
    if (vis <= 0) return;
    // Real elapsed time, not frame time: on a slow machine frames drop, but the crank still turns.
    const realDt = Math.min(0.25, (now - (dollState.lastTick || now)) / 1000);
    dollState.lastTick = now;
    if (dollState.holding && !dollState.playing) {
      dollState.wind = Math.min(1, dollState.wind + realDt / 2);
      dollState.crank += dt * 9;
      windMeter.style.setProperty('--wind', dollState.wind.toFixed(3));
      if (Math.random() < dt * 6) audio?.clunk();
      if (dollState.wind >= 1) playMusicBox();
    }
    // The doll's head follows the pointer. While the music plays, don't look away from her.
    const off = pointer.x / vw - 0.5;
    const target = off * (dollState.stage < 0.9 ? 0.6 : 1.4);
    dollState.look += (target - dollState.look) * (dollState.stage > 0.6 ? 0.12 : 0.04);
    if (dollState.playing && Math.abs(off) > 0.32 && now - dollState.lastScold > 2500) {
      dollState.lastScold = now;
      dollState.nearTarget = Math.min(1, dollState.nearTarget + 0.12);
      audio?.whisper(1, 0.16, off > 0 ? 0.8 : -0.8);
      card(COPY.lookAtHer, { ms: 1100, sound: false });
    }
    dollState.near += (dollState.nearTarget - dollState.near) * Math.min(1, dt * 3);
    const flicker = dollState.light < 1 ? dollState.light : (Math.random() < 0.01 * dollState.stage ? 0.4 : 1);
    const c = stages.nursery;
    const ctx = c.getContext('2d');
    drawNursery(ctx, c.width, c.height, {
      t: now / 1000, stage: dollState.stage, wind: dollState.wind, look: dollState.look, light: flicker, crank: dollState.crank, near: dollState.near, headless: dollState.headless
    });
    if (dollState.headless) drawRollingHead(ctx, c.width, c.height, { p: dollState.roll, t: now / 1000, stage: 1, near: dollState.near });
    grain(ctx, c.width, c.height, 0.1);
  }

  // ---------- 4. eyes ----------
  function drawEyesBeat(y, now, progress) {
    const s = section('eyes');
    const vis = visibility(s, y);
    spline.update('watcher', vis, { dread: dreadAt(progress) * 100 });
    if (vis <= 0) return;
    const canvas = pinned.eyes;
    pin(canvas, s, y);
    const q = clamp(localProgress(s, y) + lookedAwayBoost * 0.4);
    const local = { x: (vw - pointer.x) * (canvas.width / vw), y: (vh - pointer.y) * (canvas.height / vh) };
    drawEyeField(canvas.getContext('2d'), canvas.width, canvas.height, eyes, { progress: q, pointer: local, t: now / 1000 });
    if (spline.isReady('watcher')) canvas.style.opacity = '0.35';
  }

  // ---------- 5. rooms ----------
  function drawRooms(y, now) {
    const s = section('rooms');
    const vis = visibility(s, y);
    spline.update('door', vis, { dread: 60 + vis * 20 });
    if (vis <= 0) return;
    rooms.forEach((room) => {
      if (room.top > y + vh || room.top + room.height < y) return;
      const ctx = room.canvas.getContext('2d');
      const n = room.index;
      const flick = n > 4 ? (Math.random() > 0.92 ? 0.25 : 1) : Math.random() > 0.985 ? 0.5 : 1;
      const picture = n >= UNDERSIDE.roomTotal - 1 ? 'grinner' : foundImages[n % foundImages.length];
      drawDoorway(ctx, room.canvas.width, room.canvas.height, {
        picture,
        open: Math.min(0.95, 0.08 + n * 0.13),
        peek: clamp((n - 2) / 3 + lookedAwayBoost * 0.3) * (n === rooms.length - 1 ? 0 : 1),
        light: flick * (1 - n * 0.07),
        t: now / 1000
      });
      grain(ctx, room.canvas.width, room.canvas.height, 0.12);
      const label = room.el.querySelector('.u-room__label');
      const text = `ROOM ${roomLabel(n, UNDERSIDE.roomTotal)}`;
      if (label.textContent !== text) {
        label.textContent = text;
        audio?.creak(1.2 + Math.random(), 0.12 + n * 0.015);
      }
    });
  }

  // ---------- 7. hallway ----------
  function drawHallway(y, now) {
    const s = section('hallway');
    const vis = visibility(s, y);
    const q = localProgress(s, y);
    const step = figureStep(clamp(q / 0.8), 5);
    const near = [0.04, 0.22, 0.42, 0.64, 0.88][step];
    spline.update('figure', vis, { dread: 90, near: near * 100 });
    if (vis <= 0) return;
    const canvas = pinned.hallway;
    pin(canvas, s, y);
    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = canvas;
    if (q < 0.8 && !climaxDone) {
      if (step !== hallwayStep) {
        hallwayStep = step;
        audio?.staticBurst(0.22, 0.35);
        staticBoost = 1;
      }
      const flicker = Math.random() > 0.96 ? 0.35 : 1;
      const footage = hallwayFootage[step];
      if (footage?.complete && footage.naturalWidth && !spline.isReady('figure')) drawFoundFrame(ctx, w, h, footage, { alpha: flicker });
      else drawCorridor(ctx, w, h, { near, flicker, t: now / 1000, figure: !spline.isReady('figure') });
      if (staticBoost > 0.6) tear(ctx, w, h, 5, w * 0.05);
    } else {
      drawCorridor(ctx, w, h, { near: 0, flicker: climaxDone && locked ? 0.15 : 0.8, figure: false, t: now / 1000 });
      if (!climaxDone) climax();
    }
    grain(ctx, w, h, 0.14);
  }

  // ---------- 8. devil ----------
  function drawDevilRoom(y, now) {
    const s = section('devil');
    const vis = visibility(s, y);
    show(stages.devil, vis);
    if (vis <= 0) return;
    const q = localProgress(s, y);
    devilState.presence = clamp(q / 0.4) * (1 - devilState.gone);
    if (!gate('rsvp').solved) devilState.rage = Math.max(0, devilState.rage - 0.004);
    const c = stages.devil;
    const ctx = c.getContext('2d');
    drawDevil(ctx, c.width, c.height, {
      t: now / 1000,
      presence: devilState.presence,
      speak: devilState.speak * (0.5 + Math.random() * 0.5),
      rage: devilState.rage
    });
    if (devilState.gone > 0) {
      ctx.fillStyle = `rgba(0,0,0,${devilState.gone * 0.9})`;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    grain(ctx, c.width, c.height, 0.12);
  }

  // ---------- 9. exit ----------
  function drawExit(y, now) {
    const s = section('exit');
    const vis = visibility(s, y);
    if (vis <= 0) {
      if (!exiting) escapeUi.hidden = true;
      return;
    }
    const canvas = pinned.exit;
    const ctx = canvas.getContext('2d');
    drawDoorway(ctx, canvas.width, canvas.height, { open: 0.9, peek: 0, light: 0.6 + escapeHold * 0.4, t: now / 1000 });
    const { width: w, height: h } = canvas;
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.6);
    glow.addColorStop(0, `rgba(255,236,200,${0.25 + escapeHold * 0.5})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    if (y > trackHeight - vh * 1.08 && climaxDone && !locked && escapeUi.hidden && !exiting) {
      escapeUi.hidden = false;
      escapeButton.focus({ preventScroll: true });
    }
  }

  // ---------- public ----------
  return {
    async start() {
      root.hidden = false;
      document.documentElement.classList.add('is-underside');
      measure();
      running = true;
      smoothY = 0;
      window.scrollTo(0, maxScroll());
      startTime = performance.now();
      lastTime = performance.now();
      loadHall();
      ['it-we-see-you', 'it-take-it', 'it-party-ended', 'devil-rsvpd', 'devil-nobody-leaves', 'devil-wrong', 'doll-play-with-me', ...COPY.radio.map((line) => line.clip)]
        .forEach((clip) => audio?.preloadClip(voiceUrl(clip)));
      await audio?.start().catch(() => {});
      addEventListener('resize', measure);
      addEventListener('pointermove', onPointer, { passive: true });
      addEventListener('wheel', onScrollInput, { passive: true });
      addEventListener('touchmove', onScrollInput, { passive: true });
      addEventListener('keydown', onKey);
      addEventListener('keyup', onKey);
      document.addEventListener('visibilitychange', onVisibility);
      escapeButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        escapeButton.setPointerCapture?.(event.pointerId);
        setHolding(true);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => escapeButton.addEventListener(type, () => setHolding(false)));
      track.querySelectorAll('img').forEach((img) => img.addEventListener('load', measure, { once: true }));
      // ?debug exposes a lock opener for automated walkthroughs.
      if (new URLSearchParams(location.search).has('debug')) {
        window.__underside = { gore: (name) => gore(name), solve: (id) => solve(id), gates: () => gates.map((g) => ({ ...g })), state: () => ({ y: smoothY, openGateId, locked }) };
      }
      requestAnimationFrame(update);
    }
  };
}
