import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { timerReducer, createInitialTimerState, createInitialTimerState as createTimer, isValidTimerConfig, DEFAULT_TIMER_CONFIG } from '@/logic/timerEngine';
import { TimerState, TimerEvent, TimerConfig } from '@/types';

// Feature: upside-down-escape, Property 4: Timer countdown and freeze correctness
describe('Property 4: Timer countdown and freeze correctness', () => {
  it('decrements by 1 per tick while running, expires at 0, no effect after pause', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 600 }),
        fc.array(fc.constantFrom('TICK', 'PAUSE')),
        (initialTime, events) => {
          let state = createTimer({ initialTimeSeconds: initialTime, tickIntervalMs: 1000 });

          for (const ev of events) {
            const event: TimerEvent = ev === 'TICK' ? { type: 'TICK' } : { type: 'PAUSE' };
            const prev = state;
            state = timerReducer(state, event);

            if (ev === 'TICK' && prev.isRunning && !prev.isExpired) {
              if (prev.remainingSeconds > 0) {
                expect(state.remainingSeconds).toBe(prev.remainingSeconds - 1);
              }
              if (state.remainingSeconds === 0) {
                expect(state.isExpired).toBe(true);
                expect(state.isRunning).toBe(false);
              }
            }
            if (ev === 'PAUSE') {
              expect(state.isRunning).toBe(false);
            }
            // After pause or expiry, ticks should have no effect
            if (!prev.isRunning || prev.isExpired) {
              if (ev === 'TICK') {
                expect(state.remainingSeconds).toBe(prev.remainingSeconds);
              }
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: upside-down-escape, Property 5: Timer config validation
describe('Property 5: Timer config validation', () => {
  it('config valid iff initialTime is 60-600 inclusive, default is 300', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (initialTime) => {
        const config: TimerConfig = { initialTimeSeconds: initialTime, tickIntervalMs: 1000 };
        const isValid = isValidTimerConfig(config);
        expect(isValid).toBe(initialTime >= 60 && initialTime <= 600);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('default config is 300 seconds', () => {
    expect(DEFAULT_TIMER_CONFIG.initialTimeSeconds).toBe(300);
    expect(isValidTimerConfig(DEFAULT_TIMER_CONFIG)).toBe(true);
  });
});
