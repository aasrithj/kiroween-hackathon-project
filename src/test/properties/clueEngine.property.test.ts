import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { clueReducer, createInitialClueState, isClueDiscovered } from '@/logic/clueEngine';
import { InteractableObjectData, ClueState } from '@/types';
import { ESCAPE_ROOM_OBJECTS } from '@/lib/escapeRoomData';

// Feature: upside-down-escape, Property 6: Clue discovery increments only for undiscovered clue objects
describe('Property 6: Clue discovery increments only for undiscovered clue objects', () => {
  const objects = ESCAPE_ROOM_OBJECTS;

  it('interacting with clue objects increments count, non-clue objects do not', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: objects.length - 1 }), (index) => {
        const state = createInitialClueState(objects);
        const obj = objects[index];
        const result = clueReducer(state, { type: 'INTERACT', objectId: obj.id }, objects);

        if (obj.hasClue) {
          expect(result.discoveredClueIds).toContain(obj.id);
          expect(result.discoveredClueIds.length).toBe(1);
        } else {
          expect(result.discoveredClueIds.length).toBe(0);
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('re-discovering a clue does not increment count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: objects.length - 1 }), (index) => {
        const obj = objects[index];
        if (!obj.hasClue) return true;

        let state = createInitialClueState(objects);
        state = clueReducer(state, { type: 'INTERACT', objectId: obj.id }, objects);
        const afterFirst = state.discoveredClueIds.length;
        state = clueReducer(state, { type: 'INTERACT', objectId: obj.id }, objects);
        const afterSecond = state.discoveredClueIds.length;

        expect(afterSecond).toBe(afterFirst);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: upside-down-escape, Property 7: Exit availability and clue count bounds
describe('Property 7: Exit availability and clue count bounds', () => {
  const objects = ESCAPE_ROOM_OBJECTS;

  it('exit is interactive iff all clues found, count bounds are correct', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: objects.length - 1 })), (indices) => {
        let state = createInitialClueState(objects);
        const seen = new Set<string>();

        for (const idx of indices) {
          const obj = objects[idx];
          if (!seen.has(obj.id)) {
            seen.add(obj.id);
            state = clueReducer(state, { type: 'INTERACT', objectId: obj.id }, objects);
          }
        }

        const clueObjects = objects.filter((o) => o.hasClue);
        const totalClues = clueObjects.length;

        // Total clues should be 3-5
        expect(totalClues).toBeGreaterThanOrEqual(3);
        expect(totalClues).toBeLessThanOrEqual(5);

        // Escape room should have at least 3 interactable objects
        expect(objects.length).toBeGreaterThanOrEqual(3);

        // Discovered count never exceeds total
        expect(state.discoveredClueIds.length).toBeLessThanOrEqual(totalClues);

        // Exit is interactive iff all clues found
        const allFound = state.discoveredClueIds.length >= totalClues;
        expect(state.allCluesFound).toBe(allFound);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
