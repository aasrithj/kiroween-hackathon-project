import { ClueState, ClueEvent, InteractableObjectData } from '@/types';

export function createInitialClueState(objects: InteractableObjectData[]): ClueState {
  const clueCount = objects.filter((o) => o.hasClue).length;
  return {
    totalClues: clueCount,
    discoveredClueIds: [],
    allCluesFound: false,
  };
}

export function clueReducer(
  state: ClueState,
  event: ClueEvent,
  objects: InteractableObjectData[]
): ClueState {
  switch (event.type) {
    case 'INTERACT': {
      const obj = objects.find((o) => o.id === event.objectId);
      if (!obj || !obj.hasClue) return state;
      if (state.discoveredClueIds.includes(event.objectId)) return state;

      const discoveredClueIds = [...state.discoveredClueIds, event.objectId];
      const allCluesFound = discoveredClueIds.length >= state.totalClues;
      return { ...state, discoveredClueIds, allCluesFound };
    }

    case 'RESET':
      return createInitialClueState(event.objects);

    default:
      return state;
  }
}

export function getDiscoveredCount(state: ClueState): number {
  return state.discoveredClueIds.length;
}

export function isClueDiscovered(state: ClueState, objectId: string): boolean {
  return state.discoveredClueIds.includes(objectId);
}
