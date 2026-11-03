const phases = ['idle', 'glitch', 'ominous', 'handoff', 'done'];

export const initialState = Object.freeze({ phase: 'idle', started: false });

export function reduce(state = initialState, event) {
  if (event?.type === 'SUBMIT' && state.phase === 'idle' && !state.started) {
    return { phase: 'glitch', started: true };
  }

  const transitions = {
    GLITCH_DONE: ['glitch', 'ominous'],
    OMINOUS_DONE: ['ominous', 'handoff'],
    HANDOFF_DONE: ['handoff', 'done']
  };
  const expected = transitions[event?.type];

  if (!expected || state.phase !== expected[0]) {
    return state;
  }

  return { ...state, phase: expected[1] };
}

export function phaseLimitMs(phase, reducedMotion = false, timing = {}) {
  if (!phases.includes(phase)) {
    return 0;
  }

  if (reducedMotion) {
    return timing.reduced ?? 250;
  }

  return timing[phase] ?? 0;
}
