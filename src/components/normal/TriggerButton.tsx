'use client';

import { useAppStore } from '@/store/appStore';
import { audioManager } from '@/audio/AudioManager';

export default function TriggerButton() {
  const dispatchDimension = useAppStore((s) => s.dispatchDimension);

  const handleClick = () => {
    audioManager.unlock();
    audioManager.playCue('transition');
    dispatchDimension({ type: 'TRIGGER_CLICKED' });
  };

  return (
    <div className="relative z-10 flex flex-col items-center py-16 px-4">
      <div className="mb-4 text-halloween-ghost/40 text-sm italic animate-flicker">
        ...something calls from below...
      </div>
      <button
        onClick={handleClick}
        aria-label="Enter the unknown"
        className="pulse-glow group relative px-8 py-4 rounded-full bg-gradient-to-b from-halloween-deepPurple to-halloween-black border border-halloween-orange/40 text-halloween-ghost font-medium hover:from-halloween-orange/20 hover:to-halloween-deepPurple transition-all duration-500 min-w-[44px] min-h-[44px]"
      >
        <span className="relative z-10 tracking-widest text-sm uppercase opacity-70 group-hover:opacity-100 transition-opacity">
          Do Not Press
        </span>
      </button>
    </div>
  );
}
