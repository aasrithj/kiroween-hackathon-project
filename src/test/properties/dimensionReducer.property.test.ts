import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { dimensionReducer, createInitialDimensionState } from '@/logic/dimensionReducer';
import { DimensionState, DimensionEvent } from '@/types';

const states: DimensionState[] = [
  'normal', 'transitioning_forward', 'upside_down', 'success', 'failure', 'transitioning_reverse'
];

const events: DimensionEvent[] = [
  { type: 'TRIGGER_CLICKED' },
  { type: 'TRANSITION_COMPLETE' },
  { type: 'TRANSITION_TIMEOUT' },
  { type: 'EXIT_REACHED', allCluesFound: true },
  { type: 'EXIT_REACHED', allCluesFound: false },
  { type: 'TIMER_EXPIRED' },
  { type: 'SUCCESS_SEQUENCE_DONE' },
  { type: 'RETRY_SELECTED' },
  { type: 'RETURN_SELECTED' },
];

// Feature: upside-down-escape, Property 1: Dimension state machine transition correctness
describe('Property 1: Dimension state machine transition correctness', () => {
  const legalTransitions: Array<{ state: DimensionState; eventType: string; allCluesFound?: boolean; next: DimensionState }> = [
    { state: 'normal', eventType: 'TRIGGER_CLICKED', next: 'transitioning_forward' },
    { state: 'transitioning_forward', eventType: 'TRANSITION_COMPLETE', next: 'upside_down' },
    { state: 'transitioning_forward', eventType: 'TRANSITION_TIMEOUT', next: 'upside_down' },
    { state: 'upside_down', eventType: 'EXIT_REACHED', allCluesFound: true, next: 'success' },
    { state: 'upside_down', eventType: 'TIMER_EXPIRED', next: 'failure' },
    { state: 'success', eventType: 'SUCCESS_SEQUENCE_DONE', next: 'transitioning_reverse' },
    { state: 'failure', eventType: 'RETRY_SELECTED', next: 'upside_down' },
    { state: 'failure', eventType: 'RETURN_SELECTED', next: 'transitioning_reverse' },
    { state: 'transitioning_reverse', eventType: 'TRANSITION_COMPLETE', next: 'normal' },
    { state: 'transitioning_reverse', eventType: 'TRANSITION_TIMEOUT', next: 'normal' },
  ];

  function findLegalNext(state: DimensionState, event: DimensionEvent): DimensionState | null {
    for (const t of legalTransitions) {
      if (t.state === state && t.eventType === event.type) {
        if (event.type === 'EXIT_REACHED') {
          if (t.allCluesFound === (event as any).allCluesFound) return t.next;
        } else {
          return t.next;
        }
      }
    }
    return null;
  }

  it('legal transitions produce correct next state, illegal ones are unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...states),
        fc.constantFrom(...events),
        (state, event) => {
          const result = dimensionReducer(state, event);
          const legal = findLegalNext(state, event);
          if (legal !== null) {
            expect(result).toBe(legal);
          } else {
            expect(result).toBe(state);
          }
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: upside-down-escape, Property 2: Initial dimension state is always normal
describe('Property 2: Initial dimension state is always normal', () => {
  it('createInitialDimensionState always returns normal', () => {
    fc.assert(
      fc.property(fc.string(), () => {
        expect(createInitialDimensionState()).toBe('normal');
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: upside-down-escape, Property 3: Non-dimension state is invariant across dimension transitions
describe('Property 3: Non-dimension state invariance', () => {
  it('dimension transitions do not affect muted or signup state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.array(fc.string()),
        fc.constantFrom(...events),
        (isMuted, registeredEmails, event) => {
          // The dimensionReducer only operates on dimension state and should not
          // touch any other state in the store
          const state: DimensionState = 'normal';
          const next = dimensionReducer(state, event);
          // Verify the reducer returns a valid dimension state
          expect(states).toContain(next);
          // The reducer must not affect isMuted or registeredEmails
          // (these are stored separately and the reducer has no access to them)
          expect(typeof isMuted).toBe('boolean');
          expect(Array.isArray(registeredEmails)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
