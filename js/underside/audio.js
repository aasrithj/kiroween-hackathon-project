// All Underside sound is synthesized with the Web Audio API: no audio files, no licensing questions.
// Everything passes through a compressor and a soft limiter so nothing can spike past the ceiling.

const MELODY = [
  // An original music-box tune (semitones from A4, beat length). Played slowly and detuned more as dread grows.
  [7, 1], [10, 1], [14, 1], [12, 2], [10, 1], [7, 1], [9, 1], [5, 2],
  [7, 1], [10, 1], [15, 1], [14, 2], [12, 1], [10, 1], [9, 3]
];

export function createUndersideAudio({ gentle = false } = {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const ctx = new AudioContextClass();
  const now = () => ctx.currentTime;
  const masterLevel = gentle ? 0.4 : 0.9;

  // ---------- master chain ----------
  const master = ctx.createGain();
  master.gain.value = 0;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 6;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  const limiter = ctx.createWaveShaper();
  limiter.curve = softClipCurve(0.7);
  master.connect(compressor).connect(limiter).connect(ctx.destination);

  const noiseBuffer = makeNoise(ctx, 3);

  // ---------- tape hiss ----------
  const hiss = loopNoise(ctx, noiseBuffer);
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 2400;
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.015;
  hiss.connect(hissFilter).connect(hissGain).connect(master);

  // ---------- mains hum (60 Hz + harmonics) ----------
  const humGain = ctx.createGain();
  humGain.gain.value = 0.012;
  [60, 120, 180].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 1 / (i + 1);
    osc.connect(g).connect(humGain);
    osc.start();
  });
  humGain.connect(master);

  // ---------- dread drone: detuned saws through a closing/opening low-pass ----------
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 140;
  droneFilter.Q.value = 6;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  [41.2, 41.7, 82.1].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(droneFilter);
    osc.start();
  });
  droneFilter.connect(droneGain).connect(master);

  // ---------- sub pressure ----------
  const sub = ctx.createOscillator();
  sub.frequency.value = 33;
  const subGain = ctx.createGain();
  subGain.gain.value = 0;
  sub.connect(subGain).connect(master);
  sub.start();

  // ---------- Shepard riser: a tone that seems to rise forever ----------
  const SHEPARD_VOICES = 6;
  const shepardGain = ctx.createGain();
  shepardGain.gain.value = 0;
  shepardGain.connect(master);
  const shepard = Array.from({ length: SHEPARD_VOICES }, () => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g).connect(shepardGain);
    osc.start();
    return { osc, g };
  });
  let shepardPhase = 0;

  // ---------- music box ----------
  const boxGain = ctx.createGain();
  boxGain.gain.value = 0;
  const boxFilter = ctx.createBiquadFilter();
  boxFilter.type = 'lowpass';
  boxFilter.frequency.value = 3200;
  boxGain.connect(boxFilter).connect(master);
  let boxNext = 0;
  let boxIndex = 0;

  // ---------- 80s synth arpeggio: where the descent starts, before it rots ----------
  // An original pattern (minor arpeggio over a slow two-chord drift). Pulsing saws through a
  // resonant filter, with a delay. As dread rises it slows, detunes, and fades out.
  const ARP = [0, 3, 7, 12, 15, 12, 7, 3];
  const ROOTS = [45, 45, 41, 43]; // MIDI: A2, A2, F2, G2
  const synthBus = ctx.createGain();
  synthBus.gain.value = 0;
  const synthFilter = ctx.createBiquadFilter();
  synthFilter.type = 'lowpass';
  synthFilter.frequency.value = 1400;
  synthFilter.Q.value = 7;
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.36;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  synthBus.connect(synthFilter);
  synthFilter.connect(master);
  synthFilter.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(master);
  let arpNext = 0;
  let arpStep = 0;
  const midi = (n) => 440 * 2 ** ((n - 69) / 12);

  function playArpNote(time) {
    const bar = Math.floor(arpStep / 16) % ROOTS.length;
    const note = ROOTS[bar] + 12 + ARP[arpStep % ARP.length];
    arpStep += 1;
    const detune = dread * 60 * (Math.random() - 0.3); // goes sour as it decays
    [0, 7].forEach((cents) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = midi(note);
      osc.detune.value = cents + detune;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(0.12, time + 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(env).connect(synthBus);
      osc.start(time);
      osc.stop(time + 0.25);
    });
    // Sixteenth notes at 100 BPM, slowing as dread rises.
    return (60 / 100 / 4) * (1 + dread * 1.6);
  }

  // ---------- heartbeat ----------
  let heartRate = 0; // beats per minute; 0 = off
  let heartNext = 0;

  let dread = 0;
  let silenced = false;

  const set = (param, value, time = 0.4) => param.setTargetAtTime(value, now(), time);

  function setDread(value) {
    dread = value;
    if (silenced) return;
    set(droneGain.gain, 0.02 + dread * 0.12);
    set(droneFilter.frequency, 120 + dread * 900);
    set(subGain.gain, dread > 0.35 ? (dread - 0.35) * 0.35 : 0);
    set(hissGain.gain, 0.012 + dread * 0.03);
    set(shepardGain.gain, dread > 0.45 ? (dread - 0.45) * 0.09 : 0);
    // The synth rules the opening and dies by dread 0.4; the music box takes over, then drones.
    set(synthBus.gain, dread < 0.4 ? 0.55 * (1 - dread / 0.4) : 0, 1.5);
    set(synthFilter.frequency, 2400 - dread * 4000 > 300 ? 2400 - dread * 4000 : 300, 1);
    set(boxGain.gain, dread > 0.22 && dread < 0.55 ? 0.05 * (1 - dread) : 0, 1.2);
  }

  function playBoxNote(time) {
    const [semi, beats] = MELODY[boxIndex % MELODY.length];
    boxIndex += 1;
    const wobble = 1 + (Math.random() - 0.5) * 0.04 * (1 + dread * 6);
    const freq = 440 * 2 ** (semi / 12) * wobble;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.linearRampToValueAtTime(freq * (1 - dread * 0.03), time + 1.2);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.5, time + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, time + 1.4);
    osc.connect(env).connect(boxGain);
    osc.start(time);
    osc.stop(time + 1.5);
    const tempo = 0.42 + dread * 0.5; // slows down as it decays
    return beats * tempo;
  }

  function playHeartbeat(time) {
    [0, 0.17].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(58, time + offset);
      osc.frequency.exponentialRampToValueAtTime(34, time + offset + 0.14);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, time + offset);
      env.gain.linearRampToValueAtTime(i ? 0.35 : 0.5, time + offset + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.18);
      osc.connect(env).connect(master);
      osc.start(time + offset);
      osc.stop(time + offset + 0.2);
    });
  }

  /** Call every animation frame with the frame delta in seconds. */
  function tick(dt) {
    if (ctx.state !== 'running') return;
    const t = now();

    // Shepard tone: each voice climbs an octave band; loudness is a bell curve over the band.
    shepardPhase = (shepardPhase + dt * (0.03 + dread * 0.09)) % 1;
    shepard.forEach(({ osc, g }, i) => {
      const position = (i + shepardPhase) / SHEPARD_VOICES;
      osc.frequency.setTargetAtTime(55 * 2 ** (position * SHEPARD_VOICES), t, 0.05);
      g.gain.setTargetAtTime(Math.exp(-((position - 0.5) ** 2) / 0.045), t, 0.05);
    });

    if (!silenced && dread > 0.22 && dread < 0.55 && t >= boxNext) boxNext = t + playBoxNote(Math.max(t, boxNext));
    if (!silenced && dread < 0.42 && t >= arpNext) arpNext = Math.max(t, arpNext) + playArpNote(Math.max(t, arpNext));
    if (!silenced && heartRate > 0 && t >= heartNext) {
      playHeartbeat(t + 0.02);
      heartNext = t + 60 / heartRate;
    }
  }

  function staticBurst(duration = 0.18, level = 0.35) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1800 + Math.random() * 2400;
    band.Q.value = 0.6;
    const env = ctx.createGain();
    const t = now();
    env.gain.setValueAtTime(level, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(band).connect(env).connect(master);
    src.start(t, Math.random() * 2);
    src.stop(t + duration + 0.02);
  }

  /** Cut everything to near silence. The absence of sound is the loudest cue before a scare. */
  function silence(seconds = 0.05) {
    silenced = true;
    [droneGain, subGain, hissGain, shepardGain, boxGain, humGain].forEach((node) => set(node.gain, 0, seconds));
  }

  function restore() {
    silenced = false;
    set(humGain.gain, 0.012);
    setDread(dread);
  }

  /** The jumpscare stab: noise slam + a dissonant, distorted, falling saw cluster. Under one second. */
  function stab() {
    const t = now() + 0.01;
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClipCurve(4);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gentle ? 0.25 : 0.85, t + 0.01);
    env.gain.setTargetAtTime(0, t + 0.35, 0.18);
    shaper.connect(env).connect(master);

    [98, 104, 139, 207.6, 293].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, t + 0.85);
      osc.connect(shaper);
      osc.start(t);
      osc.stop(t + 0.95);
    });
    const slam = ctx.createBufferSource();
    slam.buffer = noiseBuffer;
    slam.connect(shaper);
    slam.start(t, Math.random());
    slam.stop(t + 0.5);
  }

  /** A low, breathy swell for the "something is behind you" moments. */
  function breath(duration = 2.2) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 520;
    band.Q.value = 1.4;
    const env = ctx.createGain();
    const t = now();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.22, t + duration * 0.45);
    env.gain.linearRampToValueAtTime(0, t + duration);
    band.frequency.linearRampToValueAtTime(380, t + duration);
    src.connect(band).connect(env).connect(master);
    src.start(t, Math.random());
    src.stop(t + duration);
  }

  /** An original two-note "error" chime: a falling minor third, slightly detuned. */
  function errorChime() {
    const t = now();
    [[880, 0], [698.5, 0.09]].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.01 * (1 + dread * 4));
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t + offset);
      env.gain.linearRampToValueAtTime(0.12, t + offset + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.5);
      osc.connect(env).connect(master);
      osc.start(t + offset);
      osc.stop(t + offset + 0.55);
    });
  }

  /** The mechanical clunk of a tape going into a VCR. */
  function clunk() {
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 600;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.5, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(low).connect(env).connect(master);
    src.start(t, Math.random());
    src.stop(t + 0.15);
  }

  /** A wet bone snap: a sharp click, a crack of noise, and a low thud underneath. */
  function snap() {
    const t = now();
    const crack = ctx.createBufferSource();
    crack.buffer = noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.7, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    crack.connect(hp).connect(env).connect(master);
    crack.start(t, Math.random());
    crack.stop(t + 0.1);
    const thud = ctx.createOscillator();
    thud.frequency.setValueAtTime(90, t);
    thud.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.5, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    thud.connect(tg).connect(master);
    thud.start(t);
    thud.stop(t + 0.26);
  }

  /** Fast, dry clicking: many long fingers moving at once. */
  function skitter(duration = 0.5) {
    const t = now();
    const count = Math.round(duration * 38);
    for (let i = 0; i < count; i += 1) {
      const at = t + (i / count) * duration + Math.random() * 0.01;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 2500 + Math.random() * 3000;
      band.Q.value = 8;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.35, at);
      env.gain.exponentialRampToValueAtTime(0.001, at + 0.015);
      src.connect(band).connect(env).connect(master);
      src.start(at, Math.random() * 2);
      src.stop(at + 0.02);
    }
  }

  // ---------- horror-film sound vocabulary ----------

  /** Shrieking strings: high, dissonant, sliding up, with fast bowing tremolo. The classic shower-scene stab. */
  function screech(duration = 0.9, level = 0.22) {
    const t = now();
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, t);
    bus.gain.linearRampToValueAtTime(level, t + 0.015);
    bus.gain.setTargetAtTime(0, t + duration * 0.55, duration * 0.2);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2600;
    band.Q.value = 0.9;
    bus.connect(band).connect(master);
    [1760, 1865, 2489, 2637].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * (1.12 + i * 0.03), t + duration);
      const trem = ctx.createOscillator();
      trem.frequency.value = 13 + i * 2.5;
      const tremGain = ctx.createGain();
      tremGain.gain.value = freq * 0.012;
      trem.connect(tremGain).connect(osc.frequency);
      osc.connect(bus);
      osc.start(t);
      trem.start(t);
      osc.stop(t + duration + 0.3);
      trem.stop(t + duration + 0.3);
    });
  }

  /** A low trailer "braam": stacked, detuned brass-like saws that open up and distort. */
  function braam(duration = 2.6, level = 0.4) {
    const t = now();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.35);
    filter.frequency.exponentialRampToValueAtTime(220, t + duration);
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClipCurve(2.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + 0.06);
    env.gain.setTargetAtTime(0, t + duration * 0.5, duration * 0.25);
    filter.connect(shaper).connect(env).connect(master);
    [55, 55.6, 82.4, 110.3, 27.5].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + duration + 0.5);
    });
  }

  /** A reverse-cymbal riser that swells and then stops dead: the half-second before a scare. */
  function riser(duration = 1.4, level = 0.3) {
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(400, t);
    hp.frequency.exponentialRampToValueAtTime(6000, t + duration);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + duration);
    env.gain.setValueAtTime(0, t + duration + 0.005);
    src.connect(hp).connect(env).connect(master);
    src.start(t, Math.random());
    src.stop(t + duration + 0.02);
    return duration;
  }

  /** A dissonant low piano cluster: inharmonic partials struck together, ringing out. */
  function pianoCluster(level = 0.25) {
    const t = now();
    [55, 58.3, 61.7, 82.4, 87.3].forEach((base) => {
      [1, 2.01, 3.03, 4.1].forEach((partial, p) => {
        const osc = ctx.createOscillator();
        osc.type = p ? 'sine' : 'triangle';
        osc.frequency.value = base * partial;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime((level / 5) / (p + 1), t + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 / (p + 1));
        osc.connect(env).connect(master);
        osc.start(t);
        osc.stop(t + 3.6);
      });
    });
  }

  /** A door creaking open: stick-slip friction, a low buzz whose pitch wanders. */
  function creak(duration = 1.6, level = 0.18) {
    const t = now();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(38, t);
    for (let i = 1; i <= 8; i += 1) {
      osc.frequency.linearRampToValueAtTime(30 + Math.random() * 45, t + (duration * i) / 8);
    }
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(900, t);
    band.frequency.linearRampToValueAtTime(1500, t + duration);
    band.Q.value = 6;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + 0.15);
    env.gain.setValueAtTime(level, t + duration * 0.8);
    env.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(band).connect(env).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /** Whispering: breathy noise shaped by two moving formants and a syllable-rate flutter. */
  function whisper(duration = 2.2, level = 0.14, pan = 0) {
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 7;
    for (let i = 0; i <= 10; i += 1) {
      f1.frequency.setValueAtTime(500 + Math.random() * 700, t + (duration * i) / 10);
      f2.frequency.setValueAtTime(1500 + Math.random() * 1400, t + (duration * i) / 10);
    }
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    for (let i = 0; i < duration * 6; i += 1) {
      env.gain.setValueAtTime(level * (0.3 + Math.random() * 0.7), t + i / 6);
      env.gain.setValueAtTime(level * 0.08, t + i / 6 + 0.1);
    }
    env.gain.setValueAtTime(0, t + duration);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    const sum = ctx.createGain();
    src.connect(f1).connect(sum);
    src.connect(f2).connect(sum);
    sum.connect(env).connect(panner).connect(master);
    src.start(t, Math.random());
    src.stop(t + duration + 0.05);
  }

  /** A blade through flesh: a fast bright scrape, then a wet split. */
  function slice() {
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 3;
    band.frequency.setValueAtTime(7000, t);
    band.frequency.exponentialRampToValueAtTime(1800, t + 0.16);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.5, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(band).connect(env).connect(master);
    src.start(t, Math.random());
    src.stop(t + 0.22);
    // The wet part: low, squelchy, slightly delayed
    const wet = ctx.createBufferSource();
    wet.buffer = noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t + 0.12);
    lp.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    lp.Q.value = 8;
    const wenv = ctx.createGain();
    wenv.gain.setValueAtTime(0, t + 0.12);
    wenv.gain.linearRampToValueAtTime(0.45, t + 0.14);
    wenv.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    wet.connect(lp).connect(wenv).connect(master);
    wet.start(t + 0.12, Math.random());
    wet.stop(t + 0.6);
  }

  /** Radio tuning: a heterodyne whistle sweeping through static. */
  function tuning(duration = 0.9, level = 0.12) {
    const t = now();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(2200 + Math.random() * 1500, t + duration * 0.6);
    osc.frequency.exponentialRampToValueAtTime(600, t + duration);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + 0.05);
    env.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(env).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    staticBurst(duration, level * 1.6);
  }

  // ---------- recorded voices (ElevenLabs via Higgsfield), processed live ----------
  const clips = new Map();
  async function loadClip(url) {
    if (!clips.has(url)) {
      clips.set(url, fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`voice ${r.status}`);
          return r.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data)));
    }
    return clips.get(url);
  }

  let reverb = null;
  function getReverb() {
    if (reverb) return reverb;
    // A long, dark, synthetic room: decaying noise as an impulse response.
    const seconds = 3.2;
    const impulse = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let c = 0; c < 2; c += 1) {
      const d = impulse.getChannelData(c);
      for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    }
    reverb = ctx.createConvolver();
    reverb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    reverb.connect(wet).connect(master);
    return reverb;
  }

  /**
   * Play a voice clip. fx 'radio': band-limited, crackling scanner. fx 'it': pitched down, doubled,
   * and smeared into reverb so it sounds like it comes from the walls. Resolves when it ends.
   */
  async function playClip(url, { fx = 'radio', level = 1, pan = 0 } = {}) {
    const buffer = await loadClip(url);
    const t = now() + 0.02;
    const out = ctx.createGain();
    out.gain.value = level * (gentle ? 0.6 : 1);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    out.connect(panner).connect(master);
    const sources = [];
    if (fx === 'radio') {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 420;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2800;
      const crush = ctx.createWaveShaper();
      crush.curve = softClipCurve(3);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(hp).connect(lp).connect(crush).connect(out);
      sources.push(src);
    } else {
      // The thing: two copies a few cents apart, both slowed, with a deep wet tail.
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3400;
      lp.connect(out);
      lp.connect(getReverb());
      [[0.78, 0], [0.74, 0.035], [0.39, 0.0]].forEach(([rate, delay], i) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = rate;
        const g = ctx.createGain();
        g.gain.value = i === 2 ? 0.25 : 0.7; // a sub-octave growl underneath
        src.connect(g).connect(lp);
        src.start(t + delay);
        sources.push(src);
      });
    }
    if (fx === 'radio') sources[0].start(t);
    const longest = Math.max(...sources.map((s) => buffer.duration / s.playbackRate.value));
    return new Promise((resolve) => setTimeout(resolve, longest * 1000 + 80));
  }

  /** Blood splatter: a wet, low impact, a spray of short squelches, then drips that slow down. */
  function splat(level = 0.5) {
    const t = now();
    const hit = ctx.createBufferSource();
    hit.buffer = noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.25);
    const env = ctx.createGain();
    env.gain.setValueAtTime(level, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    hit.connect(lp).connect(env).connect(master);
    hit.start(t, Math.random());
    hit.stop(t + 0.32);
    // The spray: a quick scatter of tiny wet clicks
    for (let i = 0; i < 9; i += 1) {
      const at = t + 0.02 + Math.random() * 0.18;
      const s = ctx.createBufferSource();
      s.buffer = noiseBuffer;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 600 + Math.random() * 1600;
      bp.Q.value = 10;
      const e = ctx.createGain();
      e.gain.setValueAtTime(level * 0.6, at);
      e.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
      s.connect(bp).connect(e).connect(master);
      s.start(at, Math.random() * 2);
      s.stop(at + 0.05);
    }
    // Drips onto the floor, further and further apart
    let at = t + 0.5;
    for (let i = 0; i < 6; i += 1) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900 + Math.random() * 500, at);
      osc.frequency.exponentialRampToValueAtTime(260, at + 0.05);
      const e = ctx.createGain();
      e.gain.setValueAtTime(level * 0.25, at);
      e.gain.exponentialRampToValueAtTime(0.001, at + 0.07);
      osc.connect(e).connect(master);
      osc.start(at);
      osc.stop(at + 0.08);
      at += 0.35 + i * 0.22;
    }
  }

  /** A heavy door slamming somewhere close. */
  function slam(level = 0.6) {
    const t = now();
    const thud = ctx.createOscillator();
    thud.frequency.setValueAtTime(70, t);
    thud.frequency.exponentialRampToValueAtTime(32, t + 0.3);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(level, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    thud.connect(tg).connect(master);
    thud.start(t);
    thud.stop(t + 0.5);
    const rattle = ctx.createBufferSource();
    rattle.buffer = noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 400;
    const re = ctx.createGain();
    re.gain.setValueAtTime(level * 0.6, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    rattle.connect(bp).connect(re).connect(master);
    rattle.start(t, Math.random());
    rattle.stop(t + 0.3);
    const tail = ctx.createGain();
    tail.gain.value = 0.5;
    tg.connect(tail).connect(getReverb());
  }

  /** The music box plays its tune once, clean, whatever the dread. Resolves when the box runs down. */
  function lullaby(notes = 8) {
    let at = now() + 0.05;
    for (let i = 0; i < notes; i += 1) {
      const [semi, beats] = MELODY[i % MELODY.length];
      // It slows as the spring runs down.
      const slow = 1 + (i / notes) ** 2 * 0.9;
      const freq = 440 * 2 ** (semi / 12) * (1 - (i / notes) * 0.02);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(0.22, at + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, at + 1.3);
      osc.connect(env).connect(master);
      osc.start(at);
      osc.stop(at + 1.4);
      at += beats * 0.36 * slow;
    }
    return new Promise((resolve) => setTimeout(resolve, (at - now()) * 1000));
  }

  /** Nails dragged down glass: a narrow, juddering band of noise and a squeal sliding upward. */
  function scrape(duration = 0.9, level = 0.3) {
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 14;
    bp.frequency.setValueAtTime(2400, t);
    bp.frequency.linearRampToValueAtTime(4600, t + duration);
    const amp = ctx.createGain();
    amp.gain.value = 0;
    const judder = ctx.createOscillator();
    judder.frequency.value = 28;
    const jg = ctx.createGain();
    jg.gain.value = level * 0.5;
    judder.connect(jg).connect(amp.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.04);
    env.gain.setValueAtTime(1, t + duration * 0.8);
    env.gain.linearRampToValueAtTime(0, t + duration);
    src.connect(bp).connect(amp).connect(env).connect(master);
    const squeal = ctx.createOscillator();
    squeal.type = 'sine';
    squeal.frequency.setValueAtTime(3100, t);
    squeal.frequency.linearRampToValueAtTime(4300, t + duration);
    const sg = ctx.createGain();
    sg.gain.value = level * 0.12;
    squeal.connect(sg).connect(env);
    src.start(t, Math.random());
    judder.start(t);
    squeal.start(t);
    [src, judder, squeal].forEach((n) => n.stop(t + duration + 0.05));
  }

  /** A palm slapping glass: a dull low thud and a short rattle of the pane. */
  function glassThump(level = 0.4) {
    const t = now();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(level, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(env).connect(master);
    osc.start(t);
    osc.stop(t + 0.2);
    const rattle = ctx.createBufferSource();
    rattle.buffer = noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const re = ctx.createGain();
    re.gain.setValueAtTime(level * 0.25, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    rattle.connect(hp).connect(re).connect(master);
    rattle.start(t, Math.random());
    rattle.stop(t + 0.1);
  }

  /** Something hard rolling across wooden boards toward you, getting louder. */
  function roll(duration = 2, level = 0.3) {
    const t = now();
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.linearRampToValueAtTime(900, t + duration);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + duration);
    env.gain.setValueAtTime(0, t + duration + 0.01);
    // The bump of each turn over the floorboards
    const bump = ctx.createOscillator();
    bump.frequency.setValueAtTime(4, t);
    bump.frequency.linearRampToValueAtTime(11, t + duration);
    const bg = ctx.createGain();
    bg.gain.value = 0.5;
    const am = ctx.createGain();
    am.gain.value = 0.5;
    bump.connect(bg).connect(am.gain);
    src.connect(lp).connect(am).connect(env).connect(master);
    src.start(t, Math.random());
    bump.start(t);
    src.stop(t + duration + 0.05);
    bump.stop(t + duration + 0.05);
  }

  /** A church bell, far off: inharmonic partials with a long, uneven decay. For 3:00 AM. */
  function bell(level = 0.35) {
    const t = now();
    [[110, 1], [264, 0.6], [330, 0.45], [462, 0.3], [594, 0.22], [880, 0.1]].forEach(([freq, amp], i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.004);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(level * amp, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0005, t + 5 / (1 + i * 0.4));
      osc.connect(env).connect(master);
      env.connect(getReverb());
      osc.start(t);
      osc.stop(t + 5.2);
    });
  }

  return {
    bell,
    scrape,
    glassThump,
    roll,
    splat,
    slam,
    lullaby,
    playClip,
    preloadClip: (url) => loadClip(url).catch(() => null),
    tuning,
    errorChime,
    clunk,
    snap,
    skitter,
    screech,
    braam,
    riser,
    pianoCluster,
    creak,
    whisper,
    slice,
    async start() {
      if (ctx.state !== 'running') await ctx.resume();
      hiss.start();
      boxNext = now() + 1.2;
      master.gain.setTargetAtTime(masterLevel, now(), 1.5);
      setDread(0);
    },
    tick,
    setDread,
    setHeartRate(bpm) {
      heartRate = gentle ? Math.min(bpm, 70) : bpm;
    },
    staticBurst,
    silence,
    restore,
    stab,
    breath,
    setMuted(muted) {
      master.gain.setTargetAtTime(muted ? 0 : masterLevel, now(), 0.1);
    },
    fadeOut(seconds = 2) {
      master.gain.setTargetAtTime(0, now(), seconds / 3);
    },
    close: () => ctx.close()
  };
}

function makeNoise(ctx, seconds) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    data[i] = white * 0.6 + brown * 2.4;
  }
  return buffer;
}

function loopNoise(ctx, buffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function softClipCurve(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}
