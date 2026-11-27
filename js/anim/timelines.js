import { TIMING } from '../config.js';

export function createTimelines(gsap, reducedMotion, elements = {}) {
  const duration = (milliseconds) => {
    const cappedDuration = reducedMotion
      ? Math.min(TIMING.reduced, milliseconds)
      : milliseconds;

    return cappedDuration / 1000;
  };

  const entrance = () => gsap
    .timeline()
    .fromTo(
      elements.heroItems,
      { y: 22, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: duration(900),
        stagger: reducedMotion ? 0 : 0.1,
        ease: 'power3.out'
      }
    );

  const reveal = (target) => gsap
    .timeline()
    .fromTo(
      target,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: duration(700), ease: 'power2.out' }
    );

  const shake = (attempt) => {
    const stronger = attempt > 1;
    const distance = reducedMotion ? 0 : stronger ? 12 : 5;
    const shakeDuration = duration(stronger ? TIMING.shakeSecond : TIMING.shakeFirst);
    const tl = gsap.timeline();

    if (distance) {
      tl.to(document.body, {
        x: distance,
        duration: shakeDuration / 8,
        repeat: 7,
        yoyo: true,
        ease: 'power1.inOut'
      }).to(document.body, { x: 0, duration: 0.08, clearProps: 'x' });
    } else {
      tl.to({}, { duration: shakeDuration });
    }

    return tl;
  };

  const glitch = () => {
    const tl = gsap.timeline();
    if (!reducedMotion) {
      tl.add(() => document.body.classList.add('is-glitching'))
        .fromTo(
          elements.glitchPixels,
          { opacity: 0 },
          {
            opacity: 0.9,
            duration: 0.12,
            repeat: 2,
            yoyo: true,
            ease: 'steps(2)'
          },
          0
        )
        .to(elements.glitchLines, {
          xPercent: 110,
          duration: 0.14,
          stagger: 0.09,
          ease: 'power1.inOut'
        })
        .to(
          elements.glitchLines,
          { xPercent: -110, duration: 0.12, stagger: 0.07 },
          '-=0.05'
        )
        .to(document.documentElement, { filter: 'hue-rotate(12deg)', duration: 0.16 }, 0)
        .add(() => document.body.classList.remove('is-glitching'));
    } else {
      tl.to({}, { duration: duration(TIMING.reduced) });
    }

    return tl;
  };

  const handoff = () => gsap.timeline().to(elements.handoffOverlay, {
    opacity: 1,
    duration: duration(TIMING.handoff),
    ease: 'power2.in'
  });

  const ambient = (target, speed = 8) => gsap
    .timeline({ repeat: -1, yoyo: true, paused: true })
    .to(target, {
      xPercent: 4,
      yPercent: -3,
      opacity: 0.85,
      duration: reducedMotion ? 0.001 : speed,
      ease: 'sine.inOut'
    });

  const arrivalTitle = () => gsap
    .timeline()
    .fromTo(
      elements.arrivalTitle,
      { scale: 2.5, opacity: 0, filter: 'blur(8px)', letterSpacing: '.18em' },
      {
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        letterSpacing: '-.045em',
        duration: 1.35,
        ease: 'power4.out',
        clearProps: 'filter,letterSpacing'
      }
    );

  return { entrance, reveal, shake, glitch, handoff, ambient, arrivalTitle };
}

