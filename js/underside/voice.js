// Voices, using the browser's own speech synthesis (no recordings, nothing to license).
// The radio voices sound like a search party on a scanner. The other voice is something else:
// as deep and slow as the browser can make it, and used only twice in a whole run.

const PREFERRED = ['Daniel', 'Fred', 'Ralph', 'Alex', 'Google UK English Male', 'Microsoft David', 'Albert', 'Bruce'];

let voices = [];
const loadVoices = () => {
  voices = globalThis.speechSynthesis?.getVoices?.() ?? [];
};
if (globalThis.speechSynthesis) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

function pickVoice(index = 0) {
  const english = voices.filter((v) => v.lang?.startsWith('en'));
  const pool = english.length ? english : voices;
  const preferred = PREFERRED.map((name) => pool.find((v) => v.name.includes(name))).filter(Boolean);
  const list = preferred.length ? preferred : pool;
  return list.length ? list[index % list.length] : null;
}

export const canSpeak = () => Boolean(globalThis.speechSynthesis && globalThis.SpeechSynthesisUtterance);

/** Say something. Resolves when finished (or immediately if speech is unavailable). */
export function speak(text, { voice = 0, pitch = 1, rate = 1, volume = 0.8 } = {}) {
  if (!canSpeak()) return Promise.resolve();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const chosen = pickVoice(voice);
    if (chosen) utterance.voice = chosen;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    speechSynthesis.speak(utterance);
    // Some browsers never fire onend; don't hang the story on them.
    setTimeout(resolve, 900 + text.length * 120);
  });
}

/** The thing's voice: as low and slow as speech synthesis goes. */
export const speakAsIt = (text, { volume = 0.9 } = {}) => speak(text, { voice: 0, pitch: 0, rate: 0.55, volume });

export function hush() {
  if (canSpeak()) speechSynthesis.cancel();
}
