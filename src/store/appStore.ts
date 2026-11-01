import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DimensionState, DimensionEvent, TimerState, TimerConfig, ClueState, SignupInput, SignupState, SignupStatus } from '@/types';
import { dimensionReducer, createInitialDimensionState } from '@/logic/dimensionReducer';
import { timerReducer, createInitialTimerState, DEFAULT_TIMER_CONFIG } from '@/logic/timerEngine';
import { clueReducer, createInitialClueState } from '@/logic/clueEngine';
import { validateSignup } from '@/logic/validateSignup';
import { signupReducer, createInitialSignupState, isDuplicateEmail } from '@/logic/signupReducer';
import { ESCAPE_ROOM_OBJECTS } from '@/lib/escapeRoomData';

interface AppState {
  // Dimension state
  dimension: DimensionState;
  dispatchDimension: (event: DimensionEvent) => void;
  resetDimension: () => void;

  // Timer state
  timer: TimerState;
  tick: () => void;
  pauseTimer: () => void;
  startTimer: (config?: TimerConfig) => void;

  // Clue state
  clues: ClueState;
  interact: (objectId: string) => void;
  resetClues: () => void;

  // Signup state
  signup: SignupState;
  submitSignup: (input: SignupInput) => SignupStatus;
  resetSignup: () => void;

  // Audio state
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Dimension state
      dimension: createInitialDimensionState(),
      dispatchDimension: (event) => {
        set((state) => ({ dimension: dimensionReducer(state.dimension, event) }));
      },
      resetDimension: () => set({ dimension: createInitialDimensionState() }),

      // Timer state
      timer: createInitialTimerState(DEFAULT_TIMER_CONFIG),
      tick: () => {
        set((state) => ({ timer: timerReducer(state.timer, { type: 'TICK' }) }));
      },
      pauseTimer: () => {
        set((state) => ({ timer: timerReducer(state.timer, { type: 'PAUSE' }) }));
      },
      startTimer: (config = DEFAULT_TIMER_CONFIG) => {
        set({ timer: createInitialTimerState(config) });
      },

      // Clue state
      clues: createInitialClueState(ESCAPE_ROOM_OBJECTS),
      interact: (objectId) => {
        set((state) => ({
          clues: clueReducer(state.clues, { type: 'INTERACT', objectId }, ESCAPE_ROOM_OBJECTS),
        }));
      },
      resetClues: () => {
        set({
          clues: createInitialClueState(ESCAPE_ROOM_OBJECTS),
          timer: createInitialTimerState(DEFAULT_TIMER_CONFIG),
        });
      },

      // Signup state
      signup: createInitialSignupState(),
      submitSignup: (input) => {
        const state = get();
        const result = validateSignup(input);
        if (!result.isValid) return 'idle';

        const duplicate = isDuplicateEmail(state.signup, input.email);
        const newSignup = signupReducer(state.signup, {
          type: 'SUBMIT',
          input,
          isValid: true,
          isDuplicate: duplicate,
        });
        set({ signup: newSignup });
        return newSignup.lastSubmission;
      },
      resetSignup: () => {
        set((state) => ({
          signup: signupReducer(state.signup, { type: 'RESET' }),
        }));
      },

      // Audio state
      isMuted: false,
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setMuted: (muted) => set({ isMuted: muted }),
    }),
    {
      name: 'upside-down-escape',
      partialize: (state) => ({
        isMuted: state.isMuted,
        signup: {
          registeredEmails: state.signup.registeredEmails,
          lastSubmission: 'idle' as SignupStatus,
          lastInput: null,
        },
      }),
    }
  )
);
