'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { audioManager } from '@/audio/AudioManager';

export default function JumpscareOverlay() {
  const dispatchDimension = useAppStore((s) => s.dispatchDimension);
  const resetClues = useAppStore((s) => s.resetClues);
  const [phase, setPhase] = useState<'scare' | 'options'>('scare');

  useEffect(() => {
    audioManager.playCue('jumpscare');
    const timer = setTimeout(() => setPhase('options'), 2500); // 2.5s scare
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    resetClues();
    dispatchDimension({ type: 'RETRY_SELECTED' });
    setPhase('scare');
  };

  const handleReturn = () => {
    audioManager.stopAmbient();
    dispatchDimension({ type: 'RETURN_SELECTED' });
  };

  if (phase === 'scare') {
    return (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black jumpscare-anim"
        aria-hidden="true"
      >
        {/* Scary face */}
        <div className="relative">
          <svg width="300" height="300" viewBox="0 0 200 200" className="drop-shadow-[0_0_60px_rgba(255,0,0,1)]">
            {/* Face */}
            <circle cx="100" cy="100" r="80" fill="#1a0000" stroke="#ff0000" strokeWidth="3" />
            {/* Eyes - glowing red */}
            <circle cx="70" cy="85" r="15" fill="#ff0000">
              <animate attributeName="r" values="15;20;15" dur="0.1s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="85" r="15" fill="#ff0000">
              <animate attributeName="r" values="15;20;15" dur="0.1s" repeatCount="indefinite" />
            </circle>
            {/* Mouth - screaming */}
            <ellipse cx="100" cy="140" rx="25" ry="35" fill="#000" stroke="#ff0000" strokeWidth="2" />
            {/* Teeth */}
            <path d="M 80 120 L 85 135 L 90 120 L 95 135 L 100 120 L 105 135 L 110 120 L 115 135 L 120 120"
              fill="#fff" stroke="#ff0000" strokeWidth="1" />
          </svg>
        </div>
        {/* Flash effect */}
        <div className="absolute inset-0 bg-red-900/30 mix-blend-overlay" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/95 px-4">
      <h2 className="text-4xl md:text-5xl text-upsideDown-danger mb-4 text-glow-red" style={{ fontFamily: 'Creepster, cursive' }}>
        You Failed to Escape
      </h2>
      <p className="text-upsideDown-fog/70 mb-8 text-center max-w-md">
        The darkness has consumed you. But there may still be a way out...
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-full bg-upsideDown-darkBlue border border-upsideDown-grey/50 text-upsideDown-fog hover:border-upsideDown-ash transition-all hover:scale-105 min-w-[44px] min-h-[44px]"
        >
          Try Again
        </button>
        <button
          onClick={handleReturn}
          className="px-6 py-3 rounded-full bg-halloween-deepPurple border border-halloween-purple/50 text-halloween-ghost hover:border-halloween-orange transition-all hover:scale-105 min-w-[44px] min-h-[44px]"
        >
          Return to Safety
        </button>
      </div>
    </div>
  );
}
