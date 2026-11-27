export const copy = Object.freeze({
  nameRequired: 'The house needs a name for its guest book.',
  nameTooLong: 'Keep it to 100 characters. Some secrets are shorter.',
  emailInvalid: 'That address seems to lead somewhere else. Check it and try again.',
  firstAttempt: 'The house stirs. It is not ready to let you go yet.',
  secondAttempt: 'The walls are closing in. One more invitation may open the way.',
  glitch: 'The lights are going out. Something has noticed you.',
  secret:
    '<b>Never</b> turn back, even if you need to. Outrunning the timer is <b>only</b> the beginning. If you fail, the party might even <b>end</b>...',
  handoff: 'Your place is saved. The night is only beginning…'
});

// The Underside speaks in short, upright broadcast cards. Keep each one under eight words.
export const underside = Object.freeze({
  scrollUp: 'SCROLL UP. SLOWLY. ↑',
  continueScrolling: 'KEEP SCROLLING UP.',
  doNotScrollUp: 'DO NOT SCROLL DOWN.',
  weAsked: 'WE ASKED YOU NOT TO.',
  lastWarning: 'LAST WARNING.',
  lookCloser: 'LOOK CLOSER.',
  weSee: 'WE SEE YOU.',
  weSeeName: (name) => `WE SEE YOU, ${name}.`,
  itIsLate: (clock) => `IT IS ${clock}. HERE, IT IS 3 AM.`,
  awakeAtThree: "YOU'RE AWAKE AT 3 AM TOO.",
  alwaysThree: 'IT IS ALWAYS 3:00 AM HERE.',
  smileBack: 'IF IT SMILES, SMILE BACK.',
  tapes: Object.freeze([
    Object.freeze({ label: 'SMILE', date: '10/31/94', note: 'family' }),
    Object.freeze({ label: 'RULES', date: '10/31/95', note: 'do not rewind' }),
    Object.freeze({ label: 'YOUR TURN', date: '10/31/26', note: '' })
  ]),
  smileRules: Object.freeze([
    'IF IT SMILES, SMILE BACK.',
    'NEVER SMILE FIRST.',
    'IT CAN HEAR YOU NOT SMILING.',
    'DO NOT COUNT ITS TEETH.',
    'SMILE.'
  ]),
  errors: Object.freeze([
    Object.freeze({ title: 'SYSTEM', body: 'SMILE.EXE is not responding.' }),
    Object.freeze({ title: 'SYSTEM', body: 'Error 0x0300: the time is wrong.' }),
    Object.freeze({ title: 'WARNING', body: 'Something is behind this window.' }),
    Object.freeze({ title: 'SYSTEM', body: 'Cannot close FACE.DLL. It is still open.' }),
    Object.freeze({ title: 'ERROR', body: 'Unknown device found in your room.' }),
    Object.freeze({ title: 'SYSTEM', body: 'Are you smiling?' }),
    Object.freeze({ title: 'SYSTEM', body: 'Please smile to continue.' })
  ]),
  fatal: Object.freeze([
    'A FATAL EXCEPTION HAS OCCURRED AT 03:00:00.',
    'THE CURRENT FACE WILL BE TERMINATED.',
    '',
    '*  PRESS ANY KEY TO SMILE.',
    '*  PRESS ANY KEY AGAIN TO SMILE WIDER.'
  ]),
  notForYou: 'THIS BROADCAST IS NOT FOR YOU.',
  dontTurn: "DON'T TURN AROUND.",
  whyStop: 'WHY DID YOU STOP?',
  lookedAway: 'YOU LOOKED AWAY. IT MOVED.',
  dontLeave: "DON'T LEAVE.",
  // The only two things the thing ever says out loud.
  itSees: 'I see you.',
  takeIt: 'Take it.',
  partyEnded: 'THE PARTY HAS ENDED.',
  hostFound: 'THE HOST IS EXPECTING YOU.',
  wrongPortrait: 'NOT THAT ONE.',
  stillPlaying: 'IT WANTS YOU TO WATCH.',
  didntLike: "IT DIDN'T LIKE THE SONG.",
  musicCount: (n) => `${n} / 3`,
  wrongDoor: 'WRONG DOOR.',
  stay: 'GOOD. STAY.',
  rsvpDone: 'RSVP CANCELLED.',
  notYourName: "THAT ISN'T YOUR NAME.",
  minusTime: '−30 SECONDS',
  lookAtHer: 'LOOK AT HER.',
  iSeeYou: 'WE SEE YOU.',
  // A search party on a radio scanner, during the rooms. {NAME} becomes the guest's name.
  radio: Object.freeze([
    Object.freeze({ who: 0, clip: 'radio-1', text: 'Unit four. Any sign of them?' }),
    Object.freeze({ who: 1, clip: 'radio-2', text: 'Negative. The house is empty.' }),
    Object.freeze({ who: 0, clip: 'radio-3', text: 'Check upstairs. The doors keep opening.' }),
    Object.freeze({ who: 1, clip: 'radio-4', text: 'Hello? {NAME}, can you hear us?' }),
    Object.freeze({ who: 0, clip: 'radio-5', text: "Don't answer it. That isn't us." }),
    Object.freeze({ who: 1, clip: 'radio-6', text: "Stay still. We're right behind you." }),
    Object.freeze({ who: 1, clip: 'radio-7', text: "The left door. It's always the left door." })
  ]),
  live: Object.freeze({
    hall: 'You arrive late. The party is still on, but nobody is here. Portraits line an upside-down hallway. Find the host and click their portrait.',
    tape: 'A television in the living room has turned itself on. Press stop until it obeys.',
    nursery: 'A nursery. A porcelain doll in a rocking chair. Hold the button to wind the music box, three times.',
    leave: 'A window asks if you are sure you want to leave. Catch the close button.',
    hallway: 'A hallway. Something is coming closer each time the picture cuts out.',
    devil: 'The host. Type your name and cancel your RSVP to leave.',
    gallery: 'The world has turned upside down. Old photographs hang in the dark. Keep scrolling.',
    eyes: 'Darkness. Pairs of eyes open and follow your pointer.',
    tapes: 'A television plays three old home videos labelled Smile. The faces in them begin to grin too widely.',
    rooms: 'The same doorway repeats. It opens wider each time. Someone is peeking.',
    errors: 'Old computer error windows pile up on the screen, then the system crashes.',
    broadcast: 'A broadcast interrupts. A figure gets closer each time the static clears.',
    exit: 'A door of light. Press and hold the escape button, or hold Space, to get out.'
  })
});
