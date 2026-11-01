'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import ParticleCanvas from './ParticleCanvas';
import EscapeRoom from './EscapeRoom';
import ClueTracker from './ClueTracker';
import TimerDisplay from './TimerDisplay';
import Exit from './Exit';
import JumpscareOverlay from './JumpscareOverlay';
import SuccessOverlay from './SuccessOverlay';

export default function UpsideDownView() {
  const dimension = useAppStore((s) => s.dimension);
  const dispatchDimension = useAppStore((s) => s.dispatchDimension);
  const tick = useAppStore((s) => s.tick);
  const startTimer = useAppStore((s) => s.startTimer);
  const isExpired = useAppStore((s) => s.timer.isExpired);

  // Start timer and tick interval when in upside_down
  useEffect(() => {
    if (dimension !== 'upside_down') return;

    startTimer();

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [dimension, startTimer, tick]);

  // Dispatch TIMER_EXPIRED when timer reaches zero
  useEffect(() => {
    if (isExpired && dimension === 'upside_down') {
      dispatchDimension({ type: 'TIMER_EXPIRED' });
    }
  }, [isExpired, dimension, dispatchDimension]);

  return (
    <div className="relative min-h-screen bg-upsideDown-darkBlue desaturate vignette film-grain overflow-hidden">
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-upsideDown-darkBlue via-upsideDown-blue to-upsideDown-darkBlue" />

      {/* Particle effects */}
      <ParticleCanvas />

      {/* Escape room with interactable objects */}
      {dimension === 'upside_down' && <EscapeRoom />}

      {/* HUD elements */}
      {dimension === 'upside_down' && (
        <>
          <ClueTracker />
          <TimerDisplay />
          <Exit />
        </>
      )}

      {/* Overlays for success and failure states */}
      {dimension === 'failure' && <JumpscareOverlay />}
      {dimension === 'success' && <SuccessOverlay />}
    </div>
  );
}
