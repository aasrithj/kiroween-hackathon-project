'use client';

import { useAppStore } from '@/store/appStore';

export default function ClueTracker() {
  const discoveredCount = useAppStore((s) => s.clues.discoveredClueIds.length);
  const totalClues = useAppStore((s) => s.clues.totalClues);

  return (
    <div
      className="absolute top-16 left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-upsideDown-darkBlue/70 backdrop-blur border border-upsideDown-grey/40"
      role="status"
      aria-label={`Clues discovered: ${discoveredCount} of ${totalClues}`}
    >
      <span className="text-upsideDown-ash" aria-hidden="true">🔍</span>
      <span className="text-upsideDown-fog/90 text-sm font-mono">
        {discoveredCount} / {totalClues}
      </span>
    </div>
  );
}
