import '@testing-library/jest-dom';

if (typeof globalThis.AudioContext === 'undefined') {
  (globalThis as any).AudioContext = class MockAudioContext {
    createGain() { return { gain: { value: 1, setTargetAtTime: () => {}, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => ({ connect: () => {} }) }; }
    createOscillator() { return { frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => ({ connect: () => {} }), type: '', start: () => {}, stop: () => {} }; }
    createBufferSource() { return { buffer: null, connect: () => ({ connect: () => {} }), start: () => {}, stop: () => {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(1024) }; }
    destination = {};
    currentTime = 0;
    sampleRate = 44100;
    state = 'running';
    resume() {}
  };
}
