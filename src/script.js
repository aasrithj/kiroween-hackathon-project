import { copy } from './js/content.js';
import { MAX_AMBIENT_EFFECTS, TIMING } from './js/config.js';
import {
  ambientCount,
  ambientSpeed,
  computeHauntingLevel,
  isIntense
} from './js/logic/haunting.js';
import { validateDetails } from './js/logic/validation.js';
import { initialState, phaseLimitMs, reduce } from './js/logic/sequence.js';
import { saveDetails } from './js/storage.js';
import { createTimelines } from './js/anim/timelines.js';

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
let activeGlitchTimeline = null;
const spectralMotions = [];
const spectralElements = [];
const timeline = gsap
  ? createTimelines(gsap, reducedMotion, {
      heroItems: document.querySelectorAll('.hero__copy > *'),
      glitchLines: document.querySelectorAll('.glitch-overlay__line'),
      vignette: $('.vignette'),
      handoffTarget: $('.signup-form')
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

function updateHaunting(progressOverride) {
  const scrollElement = document.scrollingElement || document.documentElement;
  const maxScroll = Math.max(0, scrollElement.scrollHeight - window.innerHeight);
  const progress = Number.isFinite(progressOverride)
    ? progressOverride
    : maxScroll > 0
      ? scrollElement.scrollTop / maxScroll
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

  const emailStarted = emailInput.value.trim().length > 0;
  let candleCaption = 'Two names to light the way';

  if (results.name.valid && results.email.valid) {
    candleCaption = 'Both candles are lit. It knows you’re here.';
  } else if (results.name.valid && emailStarted) {
    candleCaption = 'Something is coming closer…';
  } else if (results.name.valid) {
    candleCaption = 'One name is in the book.';
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
  if (nameInput.getAttribute('aria-invalid') === 'true') {
    validateField(nameInput);
  } else {
    updateHaunting();
  }
});

emailInput.addEventListener('input', () => {
  if (emailInput.getAttribute('aria-invalid') === 'true') {
    validateField(emailInput);
  } else {
    updateHaunting();
  }
});

function transition(event) {
  state = reduce(state, event);
  return state.phase;
}

async function runSubmission(details) {
  submitted = true;
  button.disabled = true;
  nameInput.readOnly = true;
  emailInput.readOnly = true;
  saveDetails(details);
  validFields = 2;
  updateHaunting();
  transition({ type: 'SUBMIT' });
  announce(copy.glitch);

  if ($('#skip-glitch')) {
    $('#skip-glitch').hidden = false;
  }

  const finishGlitch = () => {
    if (state.phase !== 'glitch') return;

    activeGlitchTimeline = null;
    transition({ type: 'GLITCH_DONE' });
    document.body.classList.remove('is-glitching');
    announce(copy.ominous);
    timeline?.ominous().play();

    window.setTimeout(() => {
      if (state.phase !== 'ominous') return;

      transition({ type: 'OMINOUS_DONE' });
      announce(copy.handoff);
      timeline?.handoff().play();

      window.setTimeout(() => {
        if (state.phase === 'handoff') {
          transition({ type: 'HANDOFF_DONE' });
        }

        $('#skip-glitch').hidden = true;
        button.innerHTML = 'Your place is saved <span aria-hidden="true">✦</span>';
        announce(copy.handoff);
      }, phaseLimitMs('handoff', reducedMotion, TIMING));
    }, Math.max(1500, phaseLimitMs('ominous', reducedMotion, TIMING)));
  };

  if (reducedMotion) {
    announce(copy.glitch);
    window.setTimeout(finishGlitch, phaseLimitMs('glitch', true, TIMING));
  } else {
    activeGlitchTimeline = timeline?.glitch();

    if (activeGlitchTimeline) {
      activeGlitchTimeline.eventCallback('onComplete', finishGlitch).play();
    }

    if (!timeline) {
      window.setTimeout(finishGlitch, TIMING.glitch);
    }
  }

  $('#skip-glitch-button').onclick = () => {
    activeGlitchTimeline?.kill();
    finishGlitch();
  };
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (submitted || state.phase !== 'idle') return;

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
    nameInput.focus();
    announce(copy[results.name.error]);
    return;
  }

  if (!results.email.valid) {
    emailInput.focus();
    announce(copy[results.email.error]);
    return;
  }

  runSubmission({
    name: nameInput.value.trim(),
    email: emailInput.value.trim()
  });
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
lenis?.on('scroll', ({ scroll, limit }) => {
  onScroll(limit > 0 ? scroll / limit : 0);
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














