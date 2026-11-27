import { createTimelines } from './anim/timelines.js';
import { TIMING } from './config.js';
import { createTitleSequence } from './title-sequence.js';
import { createUnderside } from './underside/main.js';

const $ = (selector) => document.querySelector(selector);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Title sequence ----------
// It never ends: once the full title has resolved it stays on screen, and the message and the
// Go deeper button fade in underneath it.
const titleSequence = $('#title-sequence');
const titleFinale = $('#title-finale');
const skipIntro = $('#skip-intro');
let sequence = null;
// Keyboard users who pressed Skip intro get focus on Go deeper once it appears.
let focusDeeperWhenShown = false;

const showFinale = () => {
  if (!titleFinale || !titleFinale.hidden) return;
  titleFinale.hidden = false;
  // Read layout once so the fade-in transition starts from opacity 0.
  void titleFinale.offsetWidth;
  titleFinale.classList.add('is-shown');
  // Nothing left to skip: fade the button out, then remove it.
  fadeOutSkip();
  if (focusDeeperWhenShown) $('#descend')?.focus({ preventScroll: true });
};

function fadeOutSkip() {
  if (!skipIntro || skipIntro.hidden || skipIntro.classList.contains('is-leaving')) return;
  const remove = () => { skipIntro.hidden = true; };
  if (reducedMotion) {
    remove();
    return;
  }
  // Move keyboard focus somewhere useful before the button goes away.
  if (document.activeElement === skipIntro) {
    if (titleFinale && !titleFinale.hidden) $('#descend')?.focus({ preventScroll: true });
    else focusDeeperWhenShown = true;
  }
  skipIntro.classList.add('is-leaving');
  skipIntro.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'opacity') remove();
  });
  // Fallback in case the transition event never fires (for example, a hidden tab).
  window.setTimeout(remove, 1200);
}

// The other side lives on the same page as the invitation. It starts when the crossing finishes
// (script.js), or straight away with ?descend in the URL.
let begun = false;
export function beginTheOtherSide() {
  if (begun) return;
  begun = true;
  // Put the invitation away; the other side takes over the page.
  // The invitation's shake and glitch animations can leave transforms/filters on <html> and <body>.
  // A transform there would trap every full-screen layer inside an empty body, so clear them.
  [document.documentElement, document.body].forEach((el) => {
    window.gsap?.set(el, { clearProps: 'transform,filter,willChange' });
    el.style.transform = '';
    el.style.filter = '';
    el.style.willChange = '';
  });
  document.body.classList.remove('is-haunted', 'is-shaking--first', 'is-shaking--second', 'is-shaking--third', 'is-glitching', 'is-crossing');
  document.body.classList.add('is-other-side');
  $('#other-side').hidden = false;
  titleSequence.hidden = false;
  window.scrollTo(0, 0);
  startTitle();
  startSound();
}

function startTitle() {
  if (!titleSequence) return;
  document.body.classList.add('is-title-playing');
  // Reduced motion: no animated sequence, just the finished title, the message and the button.
  sequence = createTitleSequence(
    {
      canvas: $('#title-canvas'),
      bloom: $('#title-bloom'),
      haze: $('#title-haze'),
      grain: $('#title-grain'),
      frame: titleSequence
    },
    { onSettle: showFinale, still: reducedMotion }
  );

  // Skip intro: the picture fades into the last seconds of the zoom-out (js/title-sequence.js),
  // and the button fades away straight away since it has done its job.
  skipIntro?.addEventListener('click', () => {
    sequence.skip();
    fadeOutSkip();
  }, { once: true });
  sequence.start().catch(showFinale);
}

// ---------- Sound ----------
const arrivalAudio = $('#arrival-audio');
const soundToggle = $('#sound-toggle');

function startSound() {
  if (!arrivalAudio || !soundToggle) return;
  // The button shows only an icon. Its name stays "Mute" and aria-pressed carries on/off,
  // so screen readers hear "Mute, toggle button, pressed/not pressed".
  const updateToggle = () => {
    const isPlaying = !arrivalAudio.paused && !arrivalAudio.muted;
    const hasEnded = arrivalAudio.ended;
    const isOff = !hasEnded && !isPlaying;
    const name = hasEnded ? 'Replay sound' : 'Mute';

    soundToggle.classList.toggle('is-muted', isOff);
    soundToggle.setAttribute('aria-label', name);
    if (hasEnded) soundToggle.removeAttribute('aria-pressed');
    else soundToggle.setAttribute('aria-pressed', String(isOff));
  };

  // Browsers often block sound until the visitor interacts (always on reload).
  // In that case play muted, which is allowed, and unmute on the first click, tap, or key press.
  const interactionEvents = ['pointerdown', 'keydown', 'touchstart'];

  const unmuteOnInteraction = (event) => {
    if (soundToggle.contains(event.target)) return;
    stopWaitingForInteraction();
    arrivalAudio.muted = false;
    if (arrivalAudio.paused && !arrivalAudio.ended) arrivalAudio.play().catch(() => {});
    updateToggle();
  };

  const stopWaitingForInteraction = () => {
    interactionEvents.forEach((name) => document.removeEventListener(name, unmuteOnInteraction));
  };

  const startPlayback = () => arrivalAudio.play().then(updateToggle, () => {
    arrivalAudio.muted = true;
    arrivalAudio.play().then(updateToggle, () => {});
    interactionEvents.forEach((name) => document.addEventListener(name, unmuteOnInteraction));
    updateToggle();
  });

  soundToggle.addEventListener('click', () => {
    // The visitor made an explicit choice; stop the automatic unmute.
    stopWaitingForInteraction();

    if (arrivalAudio.ended) {
      arrivalAudio.currentTime = 0;
      arrivalAudio.muted = false;
      arrivalAudio.play().then(updateToggle, () => {});
      return;
    }

    if (arrivalAudio.paused) {
      arrivalAudio.muted = false;
      arrivalAudio.play().then(updateToggle, () => {});
      return;
    }

    arrivalAudio.muted = !arrivalAudio.muted;
    updateToggle();
  });

  ['play', 'pause', 'ended', 'volumechange'].forEach((type) => arrivalAudio.addEventListener(type, updateToggle));
  startPlayback();
}

// ---------- Descent into the Underside ----------
const descend = $('#descend');
let descending = false;
// Matches the descent-turn animation in underside.css.
const DESCENT_TURN_MS = 1100;
const gsap = window.gsap;
const titleGlitch = $('#title-glitch');
const descentTimelines = gsap && titleGlitch
  ? createTimelines(gsap, reducedMotion, {
      glitchPixels: titleGlitch.querySelector('.glitch-overlay__pixels'),
      glitchLines: titleGlitch.querySelectorAll('.glitch-overlay__line'),
      glitchTarget: titleSequence,
      shakeTarget: titleSequence
    })
  : null;

const startDescent = () => {
  if (descending) return;
  descending = true;
  window.__nocturneLenis?.destroy?.();
  document.documentElement.classList.remove('has-lenis', 'lenis', 'lenis-smooth');

  // The arrival music drowns in static and is replaced by the Underside's own sound.
  if (arrivalAudio) {
    const fade = setInterval(() => {
      arrivalAudio.volume = Math.max(0, arrivalAudio.volume - 0.08);
      if (arrivalAudio.volume <= 0) {
        clearInterval(fade);
        arrivalAudio.pause();
      }
    }, 60);
  }
  soundToggle?.setAttribute('hidden', '');

  // Gentle mode has no button any more; reduced-motion visitors still get it automatically.
  const underside = createUnderside({ gentle: reducedMotion });

  // Glitch first (the same one as the third RSVP), then the title turns over (CSS descent-turn),
  // then the Underside starts.
  const turnOver = () => {
    document.body.classList.remove('is-glitching', 'is-shaking--third');
    gsap?.set(titleSequence, { clearProps: 'filter,x,y,transform' });
    document.body.classList.add('is-descending');
    setTimeout(() => {
      sequence?.destroy();
      titleSequence.hidden = true;
      document.body.classList.remove('is-title-playing');
      underside.start();
    }, reducedMotion ? 1200 : DESCENT_TURN_MS);
  };

  // Reduced motion: no glitch, just the short fade.
  if (reducedMotion) {
    turnOver();
    return;
  }

  // The strongest shake (the third RSVP's) runs at the same time as the glitch, as on the signup.
  // The title turns over once both have finished.
  const glitch = descentTimelines?.glitch();
  const shake = descentTimelines?.shake(3);
  if (glitch && shake) {
    let pending = 2;
    const done = () => { pending -= 1; if (pending === 0) turnOver(); };
    glitch.eventCallback('onComplete', done).play();
    shake.eventCallback('onComplete', done).play();
  } else {
    // No GSAP: the CSS pixel tear and shake run on their own.
    document.body.classList.add('is-glitching', 'is-shaking--third');
    setTimeout(turnOver, TIMING.shakeThird);
  }
};

descend?.addEventListener('click', startDescent);

// ?descend skips the invitation and starts on the other side (handy for demos and testing).
if (new URLSearchParams(location.search).has('descend')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', beginTheOtherSide, { once: true });
  else beginTheOtherSide();
}
