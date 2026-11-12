// Procedural driving audio. Everything is synthesised, so there are no sample files to ship.
//
// Signal flow:
//   engine / road / wind / tyres -> exterior bus -> cabin low-pass -+-> mix bus
//                                                  short reverb ----+
//   indicator relay (inside the cabin, stays dry) ------------------+
//   mix bus -> compressor -> soft clip -> master volume -> speakers
//
// Voicing rule: nothing here may fizz. The engine is built from a band-limited
// waveform whose harmonics fall away quickly, every noise layer starts from pink
// noise and is low-passed, and the clipper is transparent until the mix gets loud.
// Sawtooth and square oscillators, white noise and audio-rate modulation were all
// tried and all produce a gritty top end on small speakers.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, amount) => a + (b - a) * amount;

// The mix bus runs at x2 into the compressor; this returns the result to the
// loudness the simulator has always had at a given volume setting.
const MIX_DRIVE = 2;
const MASTER_SCALE = 0.2;
const NOISE_RMS = 0.25;
// Even with the cabin filter "open" there is no useful content up here, only hiss.
const OPEN_AIR_HZ = 6500;

// Per-vehicle voicing: the sedan is a low inline-four behind a firewall, the
// CB400 revs higher, breathes louder and has no cabin around the rider.
const VOICES = {
  sedan: { pitch: 1, cutoff: 1, engine: 1, intake: 1, lump: 1, cabinHz: 1900, wind: 1 },
  motorcycle: { pitch: 1.5, cutoff: 1.25, engine: 1.05, intake: 1.4, lump: 0.6, cabinHz: OPEN_AIR_HZ, wind: 1.6 },
};

// Pink noise (Paul Kellet's filter), normalised so layer gains mean the same thing
// whatever the sample rate. Energy falls 3 dB per octave, like tyre roar and wind.
function makePinkNoise(context, seconds) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, sumSquares = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    sumSquares += data[i] * data[i];
  }
  const scale = NOISE_RMS / Math.sqrt(sumSquares / length);
  for (let i = 0; i < length; i += 1) data[i] *= scale;
  return buffer;
}

// Decaying noise is enough of an impulse response for a hint of open air. It is
// smoothed so the tail is dull, the way distant reflections are.
function makeReverbImpulse(context, seconds, decay) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  const smoothing = Math.exp(-2 * Math.PI * 1800 / context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      const noise = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      previous = noise * (1 - smoothing) + previous * smoothing;
      data[i] = previous * 3;
    }
  }
  return buffer;
}

// Straight line until `knee`, then a tanh shoulder up to full scale: quiet and
// normal passages pass through untouched, only real peaks get rounded off.
function makeSoftClipCurve(knee) {
  const samples = 2048;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * 2 - 1;
    const magnitude = Math.abs(x);
    const shaped = magnitude <= knee
      ? magnitude
      : knee + (1 - knee) * Math.tanh((magnitude - knee) / (1 - knee));
    curve[i] = Math.sign(x) * shaped;
  }
  return curve;
}

// Engine tone: harmonic n at 1/n^1.6. A sawtooth is 1/n, which is where the buzz
// comes from; this keeps the growl of the low harmonics and lets the rest fade.
function makeEngineWave(context) {
  const harmonics = 20;
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n += 1) {
    const amplitude = 1 / Math.pow(n, 1.6);
    // Spread phases: all-aligned harmonics stack into a sharp spike once per cycle.
    const phase = n * n * 0.7;
    real[n] = amplitude * Math.cos(phase);
    imag[n] = amplitude * Math.sin(phase);
  }
  return context.createPeriodicWave(real, imag);
}

export function createDrivingAudio(AudioContextClass) {
  const supported = Boolean(AudioContextClass);
  let context = null;
  let nodes = null;
  let volume = 0.55;
  let wasRunningBeforeHide = false;

  function build() {
    if (!supported || context) return context;
    try {
      context = new AudioContextClass({ latencyHint: 'interactive' });
    } catch {
      context = new AudioContextClass();
    }

    const gain = (value) => { const node = context.createGain(); node.gain.value = value; return node; };
    const filter = (type, frequency, q) => {
      const node = context.createBiquadFilter();
      node.type = type; node.frequency.value = frequency; node.Q.value = q;
      return node;
    };
    const chain = (...links) => { links.reduce((from, to) => (from.connect(to), to)); return links[links.length - 1]; };
    const pinkNoise = makePinkNoise(context, 3);
    const noiseLoop = () => {
      const node = context.createBufferSource();
      node.buffer = pinkNoise; node.loop = true;
      // Unrelated start offsets keep layers sharing the buffer from correlating.
      node.start(0, Math.random() * pinkNoise.duration);
      return node;
    };
    const engineWave = makeEngineWave(context);
    const engineOsc = (frequency, detune) => {
      const node = context.createOscillator();
      node.setPeriodicWave(engineWave);
      node.frequency.value = frequency; node.detune.value = detune;
      node.start();
      return node;
    };

    // ---- master chain ----
    const mixBus = gain(MIX_DRIVE);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 12;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;
    const softClip = context.createWaveShaper();
    softClip.curve = makeSoftClipCurve(0.6);
    try { softClip.oversample = '4x'; } catch { /* older Safari */ }
    const master = gain(volume * MASTER_SCALE);
    chain(mixBus, compressor, softClip, master, context.destination);

    // ---- exterior bus: muffled by the cabin, with a short outdoor tail ----
    const exterior = gain(1);
    const cabin = filter('lowpass', OPEN_AIR_HZ, 0.5);
    const reverb = context.createConvolver();
    reverb.buffer = makeReverbImpulse(context, 0.6, 3.2);
    chain(exterior, cabin, mixBus);
    chain(cabin, gain(0.12), reverb, mixBus);

    // ---- engine: sub + fundamental + octave -> two low-passes (24 dB/octave) ----
    const oscSub = context.createOscillator();
    oscSub.type = 'sine'; oscSub.frequency.value = 28; oscSub.start();
    const oscMain = engineOsc(55, -4);
    const oscOctave = engineOsc(110, 5);
    const engineMix = filter('highpass', 40, 0.7);
    chain(oscSub, gain(0.3), engineMix);
    chain(oscMain, gain(0.5), engineMix);
    chain(oscOctave, gain(0.18), engineMix);
    const engineFilter = filter('lowpass', 420, 0.9);
    const engineFilter2 = filter('lowpass', 700, 0.5);
    // Uneven firing at idle: a slow wobble in level. It is faded out as revs rise,
    // because once the wobble itself reaches audio rate it turns into roughness.
    const enginePulse = gain(1);
    const lumpOsc = context.createOscillator();
    lumpOsc.type = 'sine'; lumpOsc.frequency.value = 12; lumpOsc.start();
    const lumpDepth = gain(0.2);
    chain(lumpOsc, lumpDepth); lumpDepth.connect(enginePulse.gain);
    const engineGain = gain(0.0001);
    chain(engineMix, engineFilter, engineFilter2, enginePulse, engineGain, exterior);

    // ---- intake / exhaust breath ----
    const intakeFilter = filter('bandpass', 420, 1);
    const intakeGain = gain(0.0001);
    chain(noiseLoop(), intakeFilter, filter('lowpass', 1600, 0.5), intakeGain, exterior);

    // ---- tyre roar on the road surface ----
    const roadFilter = filter('lowpass', 200, 0.4);
    const roadGain = gain(0.0001);
    chain(noiseLoop(), roadFilter, roadGain, exterior);

    // ---- wind rush ----
    const windFilter = filter('bandpass', 380, 0.5);
    const windGain = gain(0.0001);
    chain(noiseLoop(), windFilter, filter('lowpass', 2200, 0.5), windGain, exterior);

    // ---- tyre scrub when grip runs out: a low rubbery howl, not a whistle ----
    const skidFilter = filter('bandpass', 850, 4);
    const skidGain = gain(0.0001);
    chain(noiseLoop(), skidFilter, filter('lowpass', 2600, 0.5), skidGain, exterior);

    nodes = {
      master, mixBus, cabin,
      oscSub, oscMain, oscOctave, engineFilter, engineFilter2, engineGain, lumpOsc, lumpDepth,
      intakeFilter, intakeGain, roadFilter, roadGain, windFilter, windGain, skidFilter, skidGain,
    };
    return context;
  }

  return {
    supported,
    get context() { return context; },
    get running() { return Boolean(context) && context.state === 'running'; },

    // Must be called from a user gesture the first time; browsers block audio otherwise.
    async start() {
      const ctx = build();
      if (ctx.state !== 'running') await ctx.resume();
      return ctx;
    },

    setVolume(value) {
      volume = clamp(value, 0, 1);
      if (nodes) nodes.master.gain.setTargetAtTime(volume * MASTER_SCALE, context.currentTime, 0.03);
    },

    // A hidden tab keeps its audio graph ticking unless the context is suspended.
    setHidden(hidden) {
      if (!context) return;
      if (hidden) {
        wasRunningBeforeHide = context.state === 'running';
        if (wasRunningBeforeHide) context.suspend().catch(() => {});
      } else if (wasRunningBeforeHide) {
        context.resume().catch(() => {});
      }
    },

    // rpm, load, slip: 0..1 · speed: m/s · shiftDip: Hz offset during a gear change
    update({ rpm, load, speed, speedRatio, shiftDip = 0, slip = 0, vehicle = 'sedan', cockpit = false }) {
      if (!nodes || context.state !== 'running') return;
      const now = context.currentTime;
      const voice = VOICES[vehicle] || VOICES.sedan;
      const v = Math.abs(speed);

      // Fundamental mapped from RPM (28 Hz idle -> 158 Hz redline for the sedan).
      const base = (28 + rpm * 130 + load * 12 + shiftDip) * voice.pitch;
      nodes.oscSub.frequency.setTargetAtTime(base * 0.5, now, 0.12);
      nodes.oscMain.frequency.setTargetAtTime(base, now, 0.08);
      nodes.oscOctave.frequency.setTargetAtTime(base * 2, now, 0.08);
      nodes.lumpOsc.frequency.setTargetAtTime(Math.min(base * 0.5, 18), now, 0.1);
      nodes.lumpDepth.gain.setTargetAtTime(0.22 * voice.lump * clamp(1 - (rpm - 0.2) / 0.22, 0, 1), now, 0.15);

      // The filter opens with revs and load, which is what makes it sound like it is working.
      const cutoff = (330 + rpm * 760 + load * 330 + speedRatio * 80) * voice.cutoff;
      nodes.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.14);
      nodes.engineFilter2.frequency.setTargetAtTime(cutoff * 1.7, now, 0.14);
      nodes.engineGain.gain.setTargetAtTime(
        (0.014 + rpm * 0.040 + load * 0.032 + speedRatio * 0.006) * voice.engine, now, 0.12);

      nodes.intakeFilter.frequency.setTargetAtTime(320 + rpm * 520 + load * 180, now, 0.18);
      nodes.intakeGain.gain.setTargetAtTime((load * 0.045 + rpm * 0.012) * voice.intake, now, 0.16);

      // Road and wind follow real speed, not the speed limit of the map.
      const roll = clamp(v / 28, 0, 1);
      nodes.roadFilter.frequency.setTargetAtTime(170 + roll * 380, now, 0.2);
      nodes.roadGain.gain.setTargetAtTime(Math.pow(roll, 0.8) * 0.16, now, 0.2);
      const rush = clamp(v / 34, 0, 1);
      nodes.windFilter.frequency.setTargetAtTime(340 + rush * 460, now, 0.25);
      nodes.windGain.gain.setTargetAtTime(rush * rush * 0.2 * voice.wind, now, 0.25);

      const scrub = clamp(slip, 0, 1) * clamp(v / 6, 0, 1);
      nodes.skidFilter.frequency.setTargetAtTime(780 + scrub * 240 + roll * 120, now, 0.08);
      nodes.skidGain.gain.setTargetAtTime(scrub > 0.01 ? 0.06 + scrub * 0.26 : 0, now, scrub > 0.01 ? 0.05 : 0.14);

      nodes.cabin.frequency.setTargetAtTime(cockpit ? voice.cabinHz : OPEN_AIR_HZ, now, 0.12);
    },

    // Indicator relay tick: a short damped thunk. Slight pitch jitter keeps the
    // repetition from sounding looped.
    click(isAccent = true) {
      if (!nodes || context.state !== 'running') return;
      const now = context.currentTime;
      const jitter = 1 + (Math.random() * 2 - 1) * 0.03;
      const osc = context.createOscillator();
      const band = context.createBiquadFilter();
      const env = context.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((isAccent ? 1250 : 880) * jitter, now);
      osc.frequency.exponentialRampToValueAtTime((isAccent ? 700 : 520) * jitter, now + 0.03);
      band.type = 'bandpass';
      band.frequency.setValueAtTime((isAccent ? 1400 : 1000) * jitter, now);
      band.Q.setValueAtTime(2.5, now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(isAccent ? 0.3 : 0.18, now + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(band); band.connect(env); env.connect(nodes.mixBus);
      osc.onended = () => { try { env.disconnect(); } catch { /* already gone */ } };
      osc.start(now);
      osc.stop(now + 0.06);
    },
  };
}
