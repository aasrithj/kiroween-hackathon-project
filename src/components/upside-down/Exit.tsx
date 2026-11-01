'use client';

import { useAppStore } from '@/store/appStore';

export default function Exit() {
  const allCluesFound = useAppStore((s) => s.clues.allCluesFound);
  const dispatchDimension = useAppStore((s) => s.dispatchDimension);
  const pauseTimer = useAppStore((s) => s.pauseTimer);

  if (!allCluesFound) return null;

  const handleExit = () => {
    pauseTimer();
    dispatchDimension({ type: 'EXIT_REACHED', allCluesFound: true });
  };

  return (
    <button
      onClick={handleExit}
      aria-label="Exit - escape the Upside Down"
      className="absolute left-1/2 bottom-12 -translate-x-1/2 z-30 px-8 py-4 rounded-full bg-gradient-to-r from-upsideDown-blue to-upsideDown-darkBlue border-2 border-upsideDown-ash/60 text-upsideDown-fog font-medium hover:border-upsideDown-fog/80 transition-all hover:scale-105 min-w-[44px] min-h-[44px] animate-pulse"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true">🚪</span>
        <span className="uppercase tracking-widest text-sm">The Exit</span>
      </span>
    </button>
  );
}
