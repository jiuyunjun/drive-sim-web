// Procedural driving audio. Everything is synthesised, so there are no sample files to ship.
//
// Signal flow:
//   engine / road / wind / tyres -> exterior bus -> cabin low-pass -+-> mix bus
//                                                  short reverb ----+
//   indicator relay (inside the cabin, stays dry) ------------------+
//   mix bus -> compressor -> soft clip -> master volume -> speakers
//
// The compressor and soft clipper let the layers stack under load without the
// output ever hard-clipping, whatever the master volume is set to.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, amount) => a + (b - a) * amount;
// The mix bus is driven hot (x4) into the compressor and clipper; this brings the
// result back to the loudness the simulator has always had at a given volume setting.
const MASTER_SCALE = 0.065;

// Per-vehicle voicing: the sedan is a low inline-four behind a firewall, the
// CB400 revs higher, breathes louder and has no cabin around the rider.
const VOICES = {
  sedan: { pitch: 1, cutoff: 1, engine: 1, intake: 1, lump: 1, cabinHz: 2100, wind: 1 },
  motorcycle: { pitch: 1.55, cutoff: 1.35, engine: 1.1, intake: 1.5, lump: 0.6, cabinHz: 20000, wind: 1.6 },
};

function makeNoiseBuffer(context, seconds, pink) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    if (!pink) { data[i] = white; continue; }
    // Paul Kellet's pink filter: energy falls 3 dB per octave, like tyre roar.
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

// Decaying stereo noise is enough of an impulse response for a hint of open air.
function makeReverbImpulse(context, seconds, decay) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

function makeSaturationCurve(drive) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const norm = Math.tanh(drive);
  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / norm;
  }
  return curve;
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
    const loop = (buffer) => {
      const node = context.createBufferSource();
      node.buffer = buffer; node.loop = true;
      // Unrelated start offsets keep layers sharing a buffer from correlating.
      node.start(0, Math.random() * buffer.duration);
      return node;
    };
    const oscillator = (type, frequency, detune = 0) => {
      const node = context.createOscillator();
      node.type = type; node.frequency.value = frequency; node.detune.value = detune;
      node.start();
      return node;
    };

    // ---- master chain ----
    const mixBus = gain(4);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 14;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.22;
    const softClip = context.createWaveShaper();
    softClip.curve = makeSaturationCurve(1.4);
    try { softClip.oversample = '2x'; } catch { /* older Safari */ }
    const master = gain(volume * MASTER_SCALE);
    mixBus.connect(compressor);
    compressor.connect(softClip);
    softClip.connect(master);
    master.connect(context.destination);

    // ---- exterior bus: muffled by the cabin, with a short outdoor tail ----
    const exterior = gain(1);
    const cabin = filter('lowpass', 20000, 0.5);
    const reverb = context.createConvolver();
    reverb.buffer = makeReverbImpulse(context, 0.7, 3.2);
    const reverbSend = gain(0.16);
    exterior.connect(cabin);
    cabin.connect(mixBus);
    cabin.connect(reverbSend);
    reverbSend.connect(reverb);
    reverb.connect(mixBus);

    // ---- engine: four oscillators -> saturation -> resonant low-pass ----
    const oscSub = oscillator('sine', 28);
    const oscLow = oscillator('sawtooth', 55, -4);
    const oscMid = oscillator('sawtooth', 110, 6);
    const oscHigh = oscillator('square', 165, -9);
    const engineMix = filter('highpass', 44, 0.7);
    [[oscSub, 0.44], [oscLow, 0.4], [oscMid, 0.15], [oscHigh, 0.05]].forEach(([osc, level]) => {
      const mix = gain(level);
      osc.connect(mix); mix.connect(engineMix);
    });
    const engineDrive = context.createWaveShaper();
    engineDrive.curve = makeSaturationCurve(1.6);
    const engineFilter = filter('lowpass', 420, 1.3);
    // Firing pulses: an LFO at half the fundamental makes idle lumpy and smooths out with revs.
    const enginePulse = gain(1);
    const lumpOsc = oscillator('sine', 14);
    const lumpDepth = gain(0.3);
    lumpOsc.connect(lumpDepth); lumpDepth.connect(enginePulse.gain);
    const engineGain = gain(0.0001);
    engineMix.connect(engineDrive);
    engineDrive.connect(engineFilter);
    engineFilter.connect(enginePulse);
    enginePulse.connect(engineGain);
    engineGain.connect(exterior);

    const whiteNoise = makeNoiseBuffer(context, 2, false);
    const pinkNoise = makeNoiseBuffer(context, 2, true);

    // ---- intake / exhaust breath ----
    const intakeFilter = filter('bandpass', 900, 0.9);
    const intakeGain = gain(0.0001);
    loop(whiteNoise).connect(intakeFilter); intakeFilter.connect(intakeGain); intakeGain.connect(exterior);

    // ---- tyre roar on the road surface ----
    const roadFilter = filter('lowpass', 260, 0.4);
    const roadGain = gain(0.0001);
    loop(pinkNoise).connect(roadFilter); roadFilter.connect(roadGain); roadGain.connect(exterior);

    // ---- wind rush ----
    const windFilter = filter('bandpass', 520, 0.55);
    const windGain = gain(0.0001);
    loop(whiteNoise).connect(windFilter); windFilter.connect(windGain); windGain.connect(exterior);

    // ---- tyre scrub when grip runs out: a narrow howl over a broader hiss ----
    const skidTone = filter('bandpass', 1500, 9);
    const skidHiss = filter('bandpass', 2900, 1.6);
    const skidHissMix = gain(0.35);
    const skidGain = gain(0.0001);
    const skidSource = loop(pinkNoise);
    skidSource.connect(skidTone); skidTone.connect(skidGain);
    skidSource.connect(skidHiss); skidHiss.connect(skidHissMix); skidHissMix.connect(skidGain);
    skidGain.connect(exterior);

    nodes = {
      master, mixBus, cabin,
      oscSub, oscLow, oscMid, oscHigh, engineFilter, engineGain, lumpOsc, lumpDepth,
      intakeFilter, intakeGain, roadFilter, roadGain, windFilter, windGain, skidTone, skidGain,
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
      nodes.oscLow.frequency.setTargetAtTime(base, now, 0.08);
      nodes.oscMid.frequency.setTargetAtTime(base * 2, now, 0.08);
      nodes.oscHigh.frequency.setTargetAtTime(base * 3.1, now, 0.07);
      nodes.lumpOsc.frequency.setTargetAtTime(base * 0.5, now, 0.1);
      nodes.lumpDepth.gain.setTargetAtTime(lerp(0.34, 0.05, rpm) * voice.lump, now, 0.15);

      // The filter opens with revs and load, which is what makes it sound like it is working.
      const cutoff = (290 + rpm * 940 + load * 300 + speedRatio * 180) * voice.cutoff;
      nodes.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.14);
      nodes.engineGain.gain.setTargetAtTime(
        (0.010 + rpm * 0.040 + load * 0.034 + speedRatio * 0.008) * voice.engine, now, 0.12);

      nodes.intakeFilter.frequency.setTargetAtTime(650 + rpm * 1600 + load * 450, now, 0.18);
      nodes.intakeGain.gain.setTargetAtTime((load * 0.042 + rpm * 0.018) * voice.intake, now, 0.16);

      // Road and wind follow real speed, not the speed limit of the map.
      const roll = clamp(v / 28, 0, 1);
      nodes.roadFilter.frequency.setTargetAtTime(220 + roll * 620, now, 0.2);
      nodes.roadGain.gain.setTargetAtTime(Math.pow(roll, 0.8) * 0.085, now, 0.2);
      const rush = clamp(v / 34, 0, 1);
      nodes.windFilter.frequency.setTargetAtTime(480 + rush * 1100, now, 0.25);
      nodes.windGain.gain.setTargetAtTime(rush * rush * 0.06 * voice.wind, now, 0.25);

      const scrub = clamp(slip, 0, 1) * clamp(v / 6, 0, 1);
      nodes.skidTone.frequency.setTargetAtTime(1250 + scrub * 520 + roll * 260, now, 0.06);
      nodes.skidGain.gain.setTargetAtTime(scrub > 0.01 ? 0.05 + scrub * 0.22 : 0, now, scrub > 0.01 ? 0.04 : 0.12);

      nodes.cabin.frequency.setTargetAtTime(cockpit ? voice.cabinHz : 20000, now, 0.12);
    },

    // Indicator relay tick. Slight pitch jitter keeps the repetition from sounding looped.
    click(isAccent = true) {
      if (!nodes || context.state !== 'running') return;
      const now = context.currentTime;
      const jitter = 1 + (Math.random() * 2 - 1) * 0.03;
      const osc = context.createOscillator();
      const band = context.createBiquadFilter();
      const env = context.createGain();
      osc.type = isAccent ? 'square' : 'triangle';
      osc.frequency.setValueAtTime((isAccent ? 1320 : 920) * jitter, now);
      band.type = 'bandpass';
      band.frequency.setValueAtTime((isAccent ? 1850 : 1280) * jitter, now);
      band.Q.setValueAtTime(4.5, now);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(isAccent ? 0.08 : 0.045, now + 0.0035);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(band); band.connect(env); env.connect(nodes.mixBus);
      osc.onended = () => { try { env.disconnect(); } catch { /* already gone */ } };
      osc.start(now);
      osc.stop(now + 0.06);
    },
  };
}
