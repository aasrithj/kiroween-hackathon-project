'use client';

import { useAppStore } from '@/store/appStore';
import { audioManager } from '@/audio/AudioManager';

export default function MuteControl() {
  const isMuted = useAppStore((s) => s.isMuted);
  const toggleMute = useAppStore((s) => s.toggleMute);

  const handleToggle = () => {
    audioManager.unlock();
    toggleMute();
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      className="fixed top-4 right-4 z-[100] w-11 h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur border border-halloween-purple/50 hover:border-halloween-orange transition-colors"
    >
      {isMuted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-halloween-ghost">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-halloween-orange">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  );
}
