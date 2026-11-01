'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import NormalView from '@/components/normal/NormalView';
import UpsideDownView from '@/components/upside-down/UpsideDownView';
import TransitionOverlay from '@/components/transition/TransitionOverlay';
import MuteControl from '@/components/MuteControl';
import { audioManager } from '@/audio/AudioManager';

export default function DimensionRouter() {
  const dimension = useAppStore((s) => s.dimension);
  const dispatchDimension = useAppStore((s) => s.dispatchDimension);
  const isMuted = useAppStore((s) => s.isMuted);
  const hasReset = useRef(false);

  // Reset to normal on initial page load/reload
  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Sync mute state to audio manager
  useEffect(() => {
    audioManager.setMuted(isMuted);
  }, [isMuted]);

  // Manage ambient audio based on dimension
  useEffect(() => {
    if (dimension === 'upside_down') {
      audioManager.startAmbient();
    } else {
      audioManager.stopAmbient();
    }
  }, [dimension]);

  // Update URL when dimension changes (without reload)
  useEffect(() => {
    if (dimension === 'upside_down' || dimension === 'success' || dimension === 'failure') {
      window.history.pushState({}, '', '/upside-down');
    } else if (dimension === 'normal') {
      window.history.pushState({}, '', '/');
    }
  }, [dimension]);

  const showNormal = dimension === 'normal' || dimension === 'transitioning_forward';
  const showUpsideDown =
    dimension === 'upside_down' ||
    dimension === 'success' ||
    dimension === 'failure' ||
    dimension === 'transitioning_reverse';
  const showTransition =
    dimension === 'transitioning_forward' || dimension === 'transitioning_reverse';

  return (
    <main className="min-h-screen relative overflow-hidden">
      {showNormal && (
        <div
          className={`transition-opacity duration-300 ${
            dimension === 'transitioning_forward' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <NormalView />
        </div>
      )}

      {showUpsideDown && (
        <div
          className={`transition-opacity duration-300 ${
            dimension === 'transitioning_reverse' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <UpsideDownView />
        </div>
      )}

      {showTransition && (
        <TransitionOverlay
          direction={dimension === 'transitioning_forward' ? 'forward' : 'reverse'}
          onComplete={() => dispatchDimension({ type: 'TRANSITION_COMPLETE' })}
        />
      )}

      <MuteControl />
    </main>
  );
}
