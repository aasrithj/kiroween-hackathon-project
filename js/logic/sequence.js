export const MAX_ATTEMPTS = 3;
export const initialState = Object.freeze({ phase: 'ready', attempts: 0 });

export function reduce(state = initialState, event) {
  if (event?.type === 'VALID_SUBMIT' && state.phase === 'ready') {
    const attempts = Math.min(MAX_ATTEMPTS, state.attempts + 1);
    return {
      attempts,
      phase: attempts === MAX_ATTEMPTS ? 'crossing' : 'shaking'
    };
  }

  if (event?.type === 'ANIMATION_DONE' && state.phase === 'shaking') {
    return { ...state, phase: 'ready' };
  }

  if (event?.type === 'CROSSING_DONE' && state.phase === 'crossing') {
    return { ...state, phase: 'done' };
  }

  return state;
}
