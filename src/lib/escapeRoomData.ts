import { InteractableObjectData } from '@/types';

export const ESCAPE_ROOM_OBJECTS: InteractableObjectData[] = [
  {
    id: 'lamp',
    hasClue: true,
    clueContent: 'The flickering light reveals numbers scratched into the wall: 1-9-8-3',
    flavorContent: null,
    position: { x: 15, y: 30 },
  },
  {
    id: 'bookshelf',
    hasClue: true,
    clueContent: 'A dusty book lies open. Chapter 4 is dog-eared. The page reads: "The gate opens when all is found."',
    flavorContent: null,
    position: { x: 70, y: 25 },
  },
  {
    id: 'mirror',
    hasClue: true,
    clueContent: 'Your reflection is distorted. Behind you, a door shimmers faintly in the glass.',
    flavorContent: null,
    position: { x: 45, y: 60 },
  },
  {
    id: 'radio',
    hasClue: true,
    clueContent: 'The radio crackles to life. A voice whispers: "The exit is where the light bends."',
    flavorContent: null,
    position: { x: 80, y: 70 },
  },
  {
    id: 'chair',
    hasClue: false,
    clueContent: null,
    flavorContent: 'Just an old wooden chair. It feels unnaturally cold to the touch.',
    position: { x: 25, y: 75 },
  },
  {
    id: 'portrait',
    hasClue: false,
    clueContent: null,
    flavorContent: 'A portrait of a faceless figure. The eyes seem to follow you through the room.',
    position: { x: 60, y: 15 },
  },
];
