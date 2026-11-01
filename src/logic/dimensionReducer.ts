import { DimensionState, DimensionEvent } from '@/types';

export function createInitialDimensionState(): DimensionState {
  return 'normal';
}

export function dimensionReducer(
  state: DimensionState,
  event: DimensionEvent
): DimensionState {
  switch (state) {
    case 'normal':
      if (event.type === 'TRIGGER_CLICKED') return 'transitioning_forward';
      return state;

    case 'transitioning_forward':
      if (event.type === 'TRANSITION_COMPLETE') return 'upside_down';
      if (event.type === 'TRANSITION_TIMEOUT') return 'upside_down';
      return state;

    case 'upside_down':
      if (event.type === 'EXIT_REACHED' && event.allCluesFound) return 'success';
      if (event.type === 'TIMER_EXPIRED') return 'failure';
      return state;

    case 'success':
      if (event.type === 'SUCCESS_SEQUENCE_DONE') return 'transitioning_reverse';
      return state;

    case 'failure':
      if (event.type === 'RETRY_SELECTED') return 'upside_down';
      if (event.type === 'RETURN_SELECTED') return 'transitioning_reverse';
      return state;

    case 'transitioning_reverse':
      if (event.type === 'TRANSITION_COMPLETE') return 'normal';
      if (event.type === 'TRANSITION_TIMEOUT') return 'normal';
      return state;

    default:
      return state;
  }
}
