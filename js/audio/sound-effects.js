let audioContext;

function getAudioContext() {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) return null;

  try {
    audioContext ??= new AudioContextConstructor();

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  } catch {
    return null;
  }

  return audioContext;
}

function playTone(context, { frequency, endFrequency, start, duration, volume, type }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const end = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.025, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.01);
}

export function playSignupError() {
  const context = getAudioContext();

  if (!context) return;

  const start = context.currentTime;
  playTone(context, {
    frequency: 310,
    endFrequency: 245,
    start,
    duration: 0.11,
    volume: 0.045,
    type: 'triangle'
  });
  playTone(context, {
    frequency: 210,
    endFrequency: 165,
    start: start + 0.09,
    duration: 0.14,
    volume: 0.035,
    type: 'sine'
  });
}

export function playCrossingSound(reducedMotion = false) {
  const context = getAudioContext();

  if (!context) return;

  const start = context.currentTime;
  const duration = reducedMotion ? 0.22 : 0.58;

  playTone(context, {
    frequency: 58,
    endFrequency: 42,
    start,
    duration,
    volume: 0.075,
    type: 'sawtooth'
  });
  playTone(context, {
    frequency: 174,
    endFrequency: 220,
    start: start + (reducedMotion ? 0.03 : 0.16),
    duration: reducedMotion ? 0.16 : 0.42,
    volume: 0.025,
    type: 'sine'
  });
}
