import { SignupState, SignupEvent } from '@/types';

export function createInitialSignupState(): SignupState {
  return {
    registeredEmails: [],
    lastSubmission: 'idle',
    lastInput: null,
  };
}

export function signupReducer(state: SignupState, event: SignupEvent): SignupState {
  switch (event.type) {
    case 'SUBMIT':
      if (!event.isValid) return state;
      if (event.isDuplicate) {
        return {
          ...state,
          lastSubmission: 'duplicate',
          lastInput: event.input,
        };
      }
      return {
        registeredEmails: [...state.registeredEmails, event.input.email.toLowerCase()],
        lastSubmission: 'success',
        lastInput: null,
      };

    case 'SERVER_ERROR':
      return {
        ...state,
        lastSubmission: 'error',
        lastInput: event.input,
      };

    case 'RESET':
      return { ...state, lastSubmission: 'idle', lastInput: null };

    default:
      return state;
  }
}

export function isDuplicateEmail(state: SignupState, email: string): boolean {
  return state.registeredEmails.includes(email.toLowerCase());
}
