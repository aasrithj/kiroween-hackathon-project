type AudioCueName = 'transition' | 'clue-discovery' | 'jumpscare' | 'success' | 'ambient';

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private unlocked = false;
  private ambientNodes: { source: OscillatorNode; gain: GainNode } | null = null;
  private preloaded: Set<AudioCueName> = new Set();

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  unlock() {
    if (this.unlocked) return;
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    this.unlocked = true;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.01);
    }
    try {
      localStorage.setItem('uDE_muted', String(muted));
    } catch {}
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  init() {
    try {
      const stored = localStorage.getItem('uDE_muted');
      if (stored !== null) this.isMuted = stored === 'true';
    } catch {}
  }

  preload(name: AudioCueName) {
    this.preloaded.add(name);
  }

  playCue(name: AudioCueName) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const master = this.masterGain;
    this.unlock();
    const now = ctx.currentTime;

    switch (name) {
      case 'transition': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gain.gain.linearRampToValueAtTime(0, now + 3);
        osc.connect(gain).connect(master);
        osc.start(now);
        osc.stop(now + 3);
        break;
      }

      case 'clue-discovery': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.linearRampToValueAtTime(784, now + 0.15);
        osc.frequency.linearRampToValueAtTime(1047, now + 0.3);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc.connect(gain).connect(master);
        osc.start(now);
        osc.stop(now + 1.5);
        break;
      }

      case 'jumpscare': {
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.5);
        }
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 1);
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        noise.connect(gain).connect(master);
        osc.connect(oscGain).connect(master);
        noise.start(now);
        osc.start(now);
        noise.stop(now + 1.5);
        osc.stop(now + 1.5);
        break;
      }

      case 'success': {
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const startTime = now + i * 0.15;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2);
          osc.connect(gain).connect(master);
          osc.start(startTime);
          osc.stop(startTime + 2);
        });
        break;
      }

      case 'ambient': {
        break;
      }
    }
  }

  startAmbient() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.ambientNodes) return;
    const master = this.masterGain;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.08;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(gain.gain);

    osc.connect(gain).connect(master);
    osc.start();
    lfo.start();
    this.ambientNodes = { source: osc, gain };
  }

  stopAmbient() {
    if (this.ambientNodes) {
      try {
        this.ambientNodes.source.stop();
      } catch {}
      this.ambientNodes = null;
    }
  }
}

export const audioManager = new AudioManagerImpl();
