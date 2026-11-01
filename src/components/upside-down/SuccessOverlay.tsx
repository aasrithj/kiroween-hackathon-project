'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { audioManager } from '@/audio/AudioManager';

export default function SuccessOverlay() {
  const dispatchDimension = useAppStore((s) => s.dispatchDimension);

  useEffect(() => {
    audioManager.playCue('success');

    // Success message for 3s, then trigger reverse transition
    const timer = setTimeout(() => {
      dispatchDimension({ type: 'SUCCESS_SEQUENCE_DONE' });
    }, 3500); // 3.5s to allow 3s message + 0.5s buffer

    return () => clearTimeout(timer);
  }, [dispatchDimension]);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-upsideDown-darkBlue/95 px-4 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="text-6xl mb-4" aria-hidden="true">🌟</div>
      <h2 className="text-4xl md:text-5xl text-upsideDown-fog mb-4 text-glow-purple" style={{ fontFamily: 'Creepster, cursive' }}>
        You Escaped!
      </h2>
      <p className="text-upsideDown-ash/70 text-center max-w-md">
        You found all the clues and escaped the Upside Down.
        Returning you to safety...
      </p>
    </div>
  );
}
