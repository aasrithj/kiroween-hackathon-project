import { createTimelines } from './anim/timelines.js';

const title = document.querySelector('#arrival-title');
const gsap = window.gsap;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (gsap && !reducedMotion && title) {
  createTimelines(gsap, reducedMotion, { arrivalTitle: title })
    .arrivalTitle()
    .play();
}
