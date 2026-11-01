import { TimerState, TimerEvent, TimerConfig } from '@/types';

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  initialTimeSeconds: 300,
  tickIntervalMs: 1000,
};

export function isValidTimerConfig(config: TimerConfig): boolean {
  return (
    config.initialTimeSeconds >= 60 &&
    config.initialTimeSeconds <= 600 &&
    config.tickIntervalMs === 1000
  );
}

export function createInitialTimerState(config: TimerConfig): TimerState {
  return {
    remainingSeconds: config.initialTimeSeconds,
    isRunning: true,
    isExpired: false,
  };
}

export function timerReducer(state: TimerState, event: TimerEvent): TimerState {
  switch (event.type) {
    case 'TICK':
      if (!state.isRunning || state.isExpired) return state;
      const next = state.remainingSeconds - 1;
      if (next <= 0) {
        return { remainingSeconds: 0, isRunning: false, isExpired: true };
      }
      return { ...state, remainingSeconds: next };

    case 'PAUSE':
      return { ...state, isRunning: false };

    case 'RESET':
      return createInitialTimerState(event.config);

    default:
      return state;
  }
}
