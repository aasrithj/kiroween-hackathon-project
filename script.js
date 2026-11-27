import { copy } from './js/content.js';
import { ESCAPE_DESTINATION, MAX_AMBIENT_EFFECTS, TIMING } from './js/config.js';
import {
  ambientCount,
  ambientSpeed,
  computeHauntingLevel,
  isIntense
} from './js/logic/haunting.js';
import { validateDetails } from './js/logic/validation.js';
import { initialState, MAX_ATTEMPTS, reduce } from './js/logic/sequence.js';
import { saveDetails } from './js/storage.js';
import { createTimelines } from './js/anim/timelines.js';
import { playCrossingSound, playSignupError } from './js/audio/sound-effects.js';

const $ = (selector) => document.querySelector(selector);
const form = $('#signup-form');
const nameInput = $('#full-name');
const emailInput = $('#email');
const status = $('#form-status');
const button = $('#submit-button');
const navToggle = $('#nav-toggle');
const navbar = $('.navbar-parent');
const siteNavigation = $('#site-navigation');
const navigationLinks = document.querySelectorAll('#site-navigation a');
let navCloseTimeout;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const lenis = window.Lenis ? new window.Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  anchors: true,
}) : null;

if (lenis) {
  document.documentElement.classList.add('has-lenis');

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

let state = initialState;
let validFields = 0;
let submitted = false;
let lastEditedField = null;
let activeGlitchTimeline = null;
const spectralMotions = [];
const spectralElements = [];
const timeline = gsap
  ? createTimelines(gsap, reducedMotion, {
      heroItems: document.querySelectorAll('.hero__copy > *'),
      glitchLines: document.querySelectorAll('.glitch-overlay__line'),
      glitchPixels: $('.glitch-overlay__pixels'),
      vignette: $('.vignette'),
      handoffOverlay: $('#handoff-overlay')
    })
  : null;

function setError(input, messageId, message) {
  const error = document.getElementById(messageId);
  input.setAttribute('aria-invalid', String(Boolean(message)));
  error.textContent = message;
}

function getValues() {
  return {
    name: nameInput.value,
    email: emailInput.value
  };
}

function updateHaunting(scrollPositionOverride) {
  const scrollElement = document.scrollingElement || document.documentElement;
  const maxScroll = Math.max(0, scrollElement.scrollHeight - window.innerHeight);
  const scrollPosition = Number.isFinite(scrollPositionOverride)
    ? scrollPositionOverride
    : scrollElement.scrollTop;
  const footer = $('.site-footer');
  const footerDocumentTop = footer.getBoundingClientRect().top
    + scrollElement.scrollTop;
  // The scroll contribution reaches its cap as the footer enters the viewport.
  const footerEntryPoint = footerDocumentTop - window.innerHeight;
  const progressEnd = footerEntryPoint > 0 ? footerEntryPoint : maxScroll;
  const progress = progressEnd > 0
    ? Math.min(1, Math.max(0, scrollPosition / progressEnd))
    : 0;
  const results = validateDetails(getValues());
  validFields = Number(results.name.valid) + Number(results.email.valid);
  const level = computeHauntingLevel(progress, validFields);
  $('#haunting-value').textContent = String(level);
  document.querySelector('#haunting-global').textContent = String(level);
  $('#haunting-meter').style.width = `${level}%`;
  $('.candle-meter').setAttribute('aria-label', `${level} of 100 haunting level`);
  const meter = $('.candle-meter');
  meter.setAttribute('role', 'img');
  const isMobile = window.innerWidth < 768;
  const levelCandleCount = ambientCount(level, isMobile);
  const visibleSpirits = ambientCount(level, isMobile);

  spectralElements.forEach((spirit, index) => {
    spirit.style.opacity = index < visibleSpirits ? '0.72' : '0';
    spirit.setAttribute('aria-hidden', 'true');
  });

  spectralMotions.forEach((motion) => {
    motion.timeScale(8 / ambientSpeed(level));
  });

  document.body.classList.toggle('is-haunted', isIntense(level));
  $('.ambient--fog').style.opacity = String(
    reducedMotion ? 0.08 : 0.08 + level / 500
  );
  document.documentElement.style.setProperty('--haunt', String(level));

  const candles = [
    ['name-candle', results.name.valid, 'Name'],
    ['email-candle', results.email.valid, 'Email']
  ];

  for (const [id, valid, label] of candles) {
    const candle = document.getElementById(id);

    candle.classList.toggle('is-lit', valid);
    candle.setAttribute('aria-label', `${label} ${valid ? 'valid' : 'not yet valid'}`);
  }

  const nameStarted = nameInput.value.trim().length > 0;
  const emailStarted = emailInput.value.trim().length > 0;
  let candleCaption = 'Two names to light the way';

  if (results.name.valid && results.email.valid) {
    candleCaption = 'Both candles are lit. It knows you’re here.';
  } else if (lastEditedField === 'name' && nameStarted) {
    candleCaption = 'The house is taking note of your name…';
  } else if (results.name.valid && emailStarted) {
    candleCaption = 'Something is coming closer…';
  } else if (nameStarted) {
    candleCaption = 'The house is taking note of your name…';
  } else if (levelCandleCount > 6) {
    candleCaption = 'The house is listening closely';
  }
  $('.candles__caption').textContent = candleCaption;

  if (isIntense(level) && !updateHaunting.wasIntense) {
    announce('The night is growing more intense.');
  }

  updateHaunting.wasIntense = isIntense(level);
  if (gsap && !reducedMotion) {
    gsap.to('.ambient--fog', {
      duration: 0.5,
      opacity: 0.08 + level / 500
    });
  }
}

function announce(message) {
  status.textContent = message;
}

function validateField(input) {
  const results = validateDetails(getValues());
  const isName = input === nameInput;
  const result = isName ? results.name : results.email;
  const messageId = isName ? 'name-error' : 'email-error';

  setError(input, messageId, result.valid ? '' : copy[result.error]);
  validFields = Number(results.name.valid) + Number(results.email.valid);
  updateHaunting();

  return result.valid;
}

nameInput.addEventListener('blur', () => validateField(nameInput));
emailInput.addEventListener('blur', () => validateField(emailInput));

nameInput.addEventListener('input', () => {
  lastEditedField = 'name';

  if (nameInput.getAttribute('aria-invalid') === 'true') {
    validateField(nameInput);
  } else {
    updateHaunting();
  }
});

emailInput.addEventListener('input', () => {
  lastEditedField = 'email';

  if (emailInput.getAttribute('aria-invalid') === 'true') {
    validateField(emailInput);
  } else {
    updateHaunting();
  }
});

function transition(event) {
  state = reduce(state, event);
  return state;
}

function runSubmission() {
  const attempt = transition({ type: 'VALID_SUBMIT' }).attempts;
  const isFinalAttempt = attempt === MAX_ATTEMPTS;
  const skipControl = $('#skip-glitch');
  const skipButton = $('#skip-glitch-button');

  button.disabled = true;
  nameInput.readOnly = true;
  emailInput.readOnly = true;

  if (!isFinalAttempt) {
    announce(attempt === 1 ? copy.firstAttempt : copy.secondAttempt);
    activeGlitchTimeline = timeline?.shake(attempt);

    const finishShake = () => {
      if (state.phase !== 'shaking') return;
      activeGlitchTimeline = null;
      document.body.classList.remove('is-shaking', 'is-shaking--first', 'is-shaking--second');
      transition({ type: 'ANIMATION_DONE' });
      button.disabled = false;
      nameInput.readOnly = false;
      emailInput.readOnly = false;
      button.textContent = 'Request an invitation →';
      button.focus();
    };

    if (activeGlitchTimeline) {
      activeGlitchTimeline.eventCallback('onComplete', finishShake).play();
    } else {
      if (!reducedMotion) {
        document.body.classList.add(
          'is-shaking',
          attempt === 1 ? 'is-shaking--first' : 'is-shaking--second'
        );
      }
      const shakeDuration = attempt === 1
        ? TIMING.shakeFirst
        : TIMING.shakeSecond;
      window.setTimeout(
        finishShake,
        reducedMotion ? TIMING.reduced : shakeDuration
      );
    }
    return;
  }

  submitted = true;
  playCrossingSound(reducedMotion);
  saveDetails({ name: nameInput.value.trim(), email: emailInput.value.trim() });
  validFields = 2;
  updateHaunting();
  announce(copy.glitch);
  skipControl.hidden = false;
  skipButton.textContent = 'Skip transition';

  const finishCrossing = () => {
    if (state.phase !== 'crossing') return;
    activeGlitchTimeline = null;
    document.body.classList.remove('is-glitching');
    document.body.classList.add('is-crossing');
    announce(copy.handoff);

    const navigate = () => {
      transition({ type: 'CROSSING_DONE' });
      window.location.assign(ESCAPE_DESTINATION);
    };

    const handoffTimeline = timeline?.handoff();
    if (handoffTimeline) {
      handoffTimeline.eventCallback('onComplete', navigate).play();
    } else {
      $('#handoff-overlay').classList.add('is-visible');
      window.setTimeout(navigate, reducedMotion ? TIMING.reduced : TIMING.handoff);
    }
  };

  const beginGlitch = () => {
    document.body.classList.add('is-glitching');
    activeGlitchTimeline = timeline?.glitch();
    if (activeGlitchTimeline) {
      activeGlitchTimeline.eventCallback('onComplete', finishCrossing).play();
    } else {
      window.setTimeout(finishCrossing, reducedMotion ? TIMING.reduced : TIMING.glitch);
    }
  };

  if (reducedMotion) {
    $('#handoff-overlay').classList.add('is-visible');
    window.setTimeout(finishCrossing, TIMING.reduced);
  } else {
    beginGlitch();
  }

  skipButton.onclick = () => {
    activeGlitchTimeline?.kill();
    activeGlitchTimeline = null;
    finishCrossing();
  };
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (submitted || state.phase !== 'ready' || button.disabled) return;

  const results = validateDetails(getValues());

  setError(
    nameInput,
    'name-error',
    results.name.valid ? '' : copy[results.name.error]
  );
  setError(
    emailInput,
    'email-error',
    results.email.valid ? '' : copy[results.email.error]
  );

  validFields = Number(results.name.valid) + Number(results.email.valid);
  updateHaunting();

  if (!results.name.valid) {
    playSignupError();
    nameInput.focus();
    announce(copy[results.name.error]);
    return;
  }

  if (!results.email.valid) {
    playSignupError();
    emailInput.focus();
    announce(copy[results.email.error]);
    return;
  }

  runSubmission();
});

let lastScrollUpdate = 0;

function onScroll(progressOverride) {
  if (lastScrollUpdate) return;

  lastScrollUpdate = requestAnimationFrame(() => {
    updateHaunting(progressOverride);
    lastScrollUpdate = 0;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
lenis?.on('scroll', ({ scroll }) => {
  onScroll(scroll);
});

updateHaunting();

if (gsap && !reducedMotion) {
  document.documentElement.classList.add('has-gsap');
  timeline.entrance().play();

  const heroArt = document.querySelector('.hero-art');

  for (let index = 0; index < MAX_AMBIENT_EFFECTS; index += 1) {
    const spirit = document.createElement('img');

    spirit.src = '../images/ghost.png';
    spirit.alt = '';
    spirit.className = `spectral spectral--${String.fromCharCode(97 + index)}`;
    spirit.setAttribute('aria-hidden', 'true');
    heroArt.append(spirit);
    spectralElements.push(spirit);

    const motion = timeline.ambient(spirit, ambientSpeed(0));
    spectralMotions.push(motion);
  }

  const sections = document.querySelectorAll('.section-reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        timeline.reveal(entry.target).play();
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  sections.forEach((section) => revealObserver.observe(section));

  const ambient = timeline.ambient('.ambient--fog');
  const ambientObserver = new IntersectionObserver(([entry]) => {
    if (document.hidden || !entry.isIntersecting || reducedMotion) {
      ambient.pause();
      spectralMotions.forEach((motion) => motion.pause());
    } else {
      ambient.play();
      spectralMotions.forEach((motion) => motion.play());
    }
  });

  ambientObserver.observe(document.querySelector('.hero-art'));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ambient.pause();
      spectralMotions.forEach((motion) => motion.pause());
    } else if (!reducedMotion) {
      ambient.play();
      spectralMotions.forEach((motion) => motion.play());
    }
  });
}

const secretButton = $('#secret-button');
const secretMessage = $('#secret-message');
const dialog = $('#secret-dialog');

$('#secret-copy').innerHTML = copy.secret;

function closeSecret() {
  if (dialog.open) {
    dialog.close();
  }

  secretMessage.hidden = true;
  secretButton.setAttribute('aria-expanded', 'false');
  secretButton.querySelector('span').textContent = '+';
  secretButton.focus();
}

secretButton.addEventListener('click', () => {
  if (secretButton.getAttribute('aria-expanded') === 'true') {
    closeSecret();
    return;
  }

  secretButton.setAttribute('aria-expanded', 'true');
  secretButton.querySelector('span').textContent = '−';

  if (typeof dialog.showModal === 'function') {
    $('#dialog-message').innerHTML = copy.secret;
    dialog.showModal();
    $('#dialog-done').focus();
  } else {
    secretMessage.hidden = false;

    if (gsap) {
      gsap.fromTo(
        secretMessage,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: reducedMotion ? 0.25 : 0.5 }
      );
    }
  }
});

$('#dialog-close').addEventListener('click', closeSecret);
$('#dialog-done').addEventListener('click', closeSecret);

dialog.addEventListener('cancel', () => {
  secretMessage.hidden = true;
  secretButton.setAttribute('aria-expanded', 'false');
  secretButton.querySelector('span').textContent = '+';
  secretButton.focus();
});

document.addEventListener('keydown', (event) => {
  const secretIsOpen = secretButton.getAttribute('aria-expanded') === 'true';

  if (event.key === 'Escape' && !dialog.open && secretIsOpen) {
    closeSecret();
  }
});

function setNavigationOpen(isOpen, immediate = false) {
  window.clearTimeout(navCloseTimeout);
  navbar.classList.remove('is-menu-closing');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');

  if (isOpen) {
    navbar.classList.add('is-menu-open');
    return;
  }

  navbar.classList.remove('is-menu-open');

  if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  navbar.classList.add('is-menu-closing');
  navCloseTimeout = window.setTimeout(() => {
    navbar.classList.remove('is-menu-closing');
  }, 180);
}

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setNavigationOpen(!isOpen);
});

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => setNavigationOpen(false));
});

document.addEventListener('pointerdown', (event) => {
  if (
    navToggle.getAttribute('aria-expanded') === 'true'
    && !siteNavigation.contains(event.target)
    && !navToggle.contains(event.target)
  ) {
    setNavigationOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
    setNavigationOpen(false);
    navToggle.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 500 && navToggle.getAttribute('aria-expanded') === 'true') {
    setNavigationOpen(false, true);
  }
});

document.documentElement.dataset.appReady = 'true';














