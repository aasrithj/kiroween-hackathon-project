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

  const glitch = () => {
    const tl = gsap.timeline();
    if (!reducedMotion) {
      tl.add(() => document.body.classList.add('is-glitching'))
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
        .to(
          document.documentElement,
          {
            filter: 'hue-rotate(18deg)',
            duration: 0.08,
            yoyo: true,
            repeat: 5
          },
          0
        )
        .add(() => document.body.classList.remove('is-glitching'));
    } else {
      tl.to({}, { duration: duration(TIMING.reduced) });
    }

    return tl;
  };

  const ominous = () => gsap
    .timeline()
    .add(() => document.body.classList.add('is-ominous'))
    .to(elements.vignette, {
      opacity: 1,
      duration: duration(900),
      ease: 'power2.inOut'
    });

  const handoff = () => gsap
    .timeline()
    .to(elements.handoffTarget, {
      opacity: 0.35,
      duration: duration(TIMING.handoff),
      ease: 'power2.inOut'
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

  return { entrance, reveal, glitch, ominous, handoff, ambient };
}

