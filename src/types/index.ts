// Dimension State Machine Types
export type DimensionState =
  | 'normal'
  | 'transitioning_forward'
  | 'upside_down'
  | 'success'
  | 'failure'
  | 'transitioning_reverse';

export type DimensionEvent =
  | { type: 'TRIGGER_CLICKED' }
  | { type: 'TRANSITION_COMPLETE' }
  | { type: 'TRANSITION_TIMEOUT' }
  | { type: 'EXIT_REACHED'; allCluesFound: boolean }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'SUCCESS_SEQUENCE_DONE' }
  | { type: 'RETRY_SELECTED' }
  | { type: 'RETURN_SELECTED' };

// Timer Types
export interface TimerConfig {
  initialTimeSeconds: number;
  tickIntervalMs: number;
}

export interface TimerState {
  remainingSeconds: number;
  isRunning: boolean;
  isExpired: boolean;
}

export type TimerEvent =
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESET'; config: TimerConfig };

// Clue & Interactable Object Types
export interface InteractableObjectData {
  id: string;
  hasClue: boolean;
  clueContent: string | null;
  flavorContent: string | null;
  position: { x: number; y: number };
}

export interface ClueState {
  totalClues: number;
  discoveredClueIds: string[];
  allCluesFound: boolean;
}

export type ClueEvent =
  | { type: 'INTERACT'; objectId: string }
  | { type: 'RESET'; objects: InteractableObjectData[] };

// Signup Types
export interface SignupInput {
  fullName: string;
  email: string;
  plusOneCount: number | null;
}

export interface ValidationResult {
  errors: Partial<Record<'fullName' | 'email' | 'plusOneCount', string>>;
  isValid: boolean;
}

export type SignupStatus = 'idle' | 'success' | 'duplicate' | 'error';

export interface SignupState {
  registeredEmails: string[];
  lastSubmission: SignupStatus;
  lastInput: SignupInput | null;
}

export type SignupEvent =
  | { type: 'SUBMIT'; input: SignupInput; isValid: boolean; isDuplicate: boolean }
  | { type: 'SERVER_ERROR'; input: SignupInput }
  | { type: 'RESET' };

// Audio Types
export interface AudioState {
  isMuted: boolean;
  activeCues: string[];
}
