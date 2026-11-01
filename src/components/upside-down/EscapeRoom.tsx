'use client';

import InteractableObject from './InteractableObject';
import { ESCAPE_ROOM_OBJECTS } from '@/lib/escapeRoomData';

export default function EscapeRoom() {
  return (
    <div className="absolute inset-0 z-10 no-select">
      {/* Title */}
      <div className="absolute top-4 left-4 z-20">
        <h2
          className="text-2xl text-upsideDown-ash/50"
          style={{ fontFamily: 'Creepster, cursive' }}
        >
          The Upside Down
        </h2>
        <p className="text-xs text-upsideDown-grey/40 mt-1">
          Find all clues to reveal the exit...
        </p>
      </div>

      {/* Interactable objects */}
      {ESCAPE_ROOM_OBJECTS.map((obj) => (
        <InteractableObject key={obj.id} objId={obj.id} />
      ))}
    </div>
  );
}
