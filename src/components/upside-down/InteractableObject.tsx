'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { audioManager } from '@/audio/AudioManager';
import { isClueDiscovered } from '@/logic/clueEngine';
import { ESCAPE_ROOM_OBJECTS } from '@/lib/escapeRoomData';

export default function InteractableObject({
  objId,
}: {
  objId: string;
}) {
  const interact = useAppStore((s) => s.interact);
  const discoveredClueIds = useAppStore((s) => s.clues.discoveredClueIds);
  const [showContent, setShowContent] = useState(false);

  const obj = ESCAPE_ROOM_OBJECTS.find((o) => o.id === objId);
  if (!obj) return null;

  const isDiscovered = isClueDiscovered(
    { totalClues: 0, discoveredClueIds, allCluesFound: false },
    objId
  );

  const handleClick = () => {
    if (obj.hasClue && !isDiscovered) {
      audioManager.playCue('clue-discovery');
    }
    interact(objId);
    setShowContent(true);
  };

  // Icon based on object type
  const icons: Record<string, string> = {
    lamp: '🪔',
    bookshelf: '📚',
    mirror: '🪞',
    radio: '📻',
    chair: '🪑',
    portrait: '🖼️',
  };

  return (
    <div
      className="absolute"
      style={{ left: `${obj.position.x}%`, top: `${obj.position.y}%` }}
    >
      <button
        onClick={handleClick}
        aria-label={`Inspect ${objId}`}
        className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-lg border-2 transition-all hover:scale-110 min-w-[44px] min-h-[44px] ${
          isDiscovered
            ? 'border-upsideDown-ash/60 bg-upsideDown-fog/40'
            : 'border-upsideDown-grey/40 bg-upsideDown-fog/20 hover:border-upsideDown-ash/60 hover:bg-upsideDown-fog/50'
        }`}
      >
        <span className="text-3xl md:text-4xl filter grayscale brightness-75">
          {icons[objId] || '?'}
        </span>
      </button>

      {showContent && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 md:w-64 p-3 rounded-lg bg-upsideDown-darkBlue/95 border border-upsideDown-grey/50 text-sm text-upsideDown-fog/90 shadow-xl z-30">
          {obj.hasClue ? (
            <p className={isDiscovered ? '' : 'text-upsideDown-ash/60'}>
              {obj.clueContent}
            </p>
          ) : (
            <p className="italic text-upsideDown-ash/60">{obj.flavorContent}</p>
          )}
          <button
            onClick={() => setShowContent(false)}
            className="mt-2 text-xs text-upsideDown-grey hover:text-upsideDown-ash underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
