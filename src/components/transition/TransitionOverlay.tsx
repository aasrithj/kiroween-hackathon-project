'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { audioManager } from '@/audio/AudioManager';

export default function TransitionOverlay({
  direction,
  onComplete,
}: {
  direction: 'forward' | 'reverse';
  onComplete: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const doComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useGSAP(
    () => {
      if (!overlayRef.current) return;

      const duration = direction === 'forward'
        ? 2 + Math.random() * 2  // 2-4s forward
        : 2 + Math.random();      // 2-3s reverse

      const tl = gsap.timeline({
        onComplete: doComplete,
      });

      if (direction === 'forward') {
        // Phase 1: Darken and distort
        tl.to(overlayRef.current, {
          backgroundColor: '#000',
          duration: duration * 0.3,
          ease: 'power2.in',
        })
        .to(overlayRef.current, {
          filter: 'blur(20px) brightness(0)',
          scale: 1.5,
          duration: duration * 0.2,
          ease: 'power2.inOut',
        }, '<')
        // Phase 2: Hold darkness
        .to(overlayRef.current, {
          duration: duration * 0.2,
        })
        // Phase 3: Reveal destination
        .to(overlayRef.current, {
          opacity: 0,
          duration: duration * 0.3,
          ease: 'power2.out',
        });
      } else {
        // Reverse: symmetric
        tl.to(overlayRef.current, {
          opacity: 1,
          duration: duration * 0.3,
          ease: 'power2.in',
        })
        .to(overlayRef.current, {
          filter: 'blur(0px) brightness(1)',
          scale: 1,
          duration: duration * 0.3,
          ease: 'power2.inOut',
        })
        .to(overlayRef.current, {
          opacity: 0,
          duration: duration * 0.4,
          ease: 'power2.out',
        });
      }

      // Schedule audio cue slightly after start
      tl.call(() => {
        audioManager.playCue('transition');
      }, undefined, 0.1);

      // Watchdog: force completion after 10s (Req 3.6)
      const watchdog = window.setTimeout(() => {
        doComplete();
      }, 10000);

      return () => {
        window.clearTimeout(watchdog);
      };
    },
    { scope: overlayRef }
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{
        backgroundColor: 'transparent',
        filter: 'blur(0px) brightness(1)',
        opacity: 0,
        transform: 'scale(1)',
      }}
      aria-hidden="true"
    />
  );
}
