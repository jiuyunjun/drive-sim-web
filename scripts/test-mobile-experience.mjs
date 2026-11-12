import assert from 'node:assert/strict';
import { createHaptics, applyRenderQuality, createAdaptiveScaler, getQualityTier, shouldVibrateOnRelease } from '../public/assets/mobile-experience.js';
let time = 1000;
const pulses = [];
const h = createHaptics({ vibrate: p => { pulses.push(p); return true; } }, () => time);
h.setMode('road'); time += 400;
h.road(10);
assert.equal(pulses.at(-1), 12);
assert.equal(h.pulse(28, 3), true);
assert.equal(h.pulse(8), false, 'steering must not interrupt shifting');
h.road(10);
assert.deepEqual(pulses.at(-1), 28);
h.stop(); assert.equal(pulses.at(-1), 0);
h.setMode('off'); time += 1000; assert.equal(h.pulse(20, 3), false);
h.setMode('events'); time += 1000; const count = pulses.length;
h.road(10); assert.equal(pulses.length, count);
assert.equal(createHaptics({}, () => time).pulse(10), false);
assert.equal(createHaptics({ vibrate() { throw Error('blocked'); } }, () => time).pulse(10), false);
h.setMode('off');
assert.equal(h.test(), false, 'global switch also disables test vibration');
h.setMode('road');
assert.equal(h.test(), true, 'explicit test works when vibration is enabled');
assert.deepEqual(pulses.at(-1), [200, 100, 200]);
assert.equal(createHaptics({ vibrate: () => false }, () => time).test(), false);
const button = (...classes) => ({ classList: { contains: value => classes.includes(value) } });
assert.equal(shouldVibrateOnRelease(button('mobileBrake')), false);
assert.equal(shouldVibrateOnRelease(button('mobileHandbrake')), false);
assert.equal(shouldVibrateOnRelease(button('mobileThrottle')), true);
// Cadence depends linearly on speed and works in reverse.
function roadPulses(speed, mode = 'road') {
  let clock = 0;
  const events = [];
  const feedback = createHaptics({ vibrate: p => { if (p) events.push([clock, p]); return true; } }, () => clock);
  feedback.setMode(mode);
  for (clock = 0; clock <= 3000; clock += 1) feedback.road(speed);
  return events;
}
assert.equal(roadPulses(0).length, 0, 'stationary vehicles do not vibrate');
assert.equal(roadPulses(0.2).length, 0, 'ignore near-zero speed');
assert.equal(roadPulses(NaN).length, 0);
const slow = roadPulses(2), fast = roadPulses(30);
assert.ok(fast.length > slow.length, 'speed gently raises bump frequency');
assert.ok(fast.length < slow.length * 2, 'frequency increase remains modest');
assert.ok([...slow, ...fast].every(([, duration]) => duration === 12), 'speed never raises pulse strength');
assert.deepEqual(roadPulses(-30), fast, 'reverse uses the same road feedback');
// Measure emitted pulses, not just the formula, across the full 0–40 m/s range.
let previousFrequency = null;
for (const speed of [5, 10, 15, 20, 25, 30, 35, 40]) {
  const events = roadPulses(speed);
  const measuredHz = 1000 / (events[1][0] - events[0][0]);
  assert.ok(Math.abs(measuredHz - (2 + speed * 0.036)) < 0.012, 'linear frequency at ' + speed);
  if (previousFrequency !== null) assert.ok(Math.abs(measuredHz - previousFrequency - 0.18) < 0.012, 'equal speed increments give equal frequency increments');
  previousFrequency = measuredHz;
}
assert.deepEqual(roadPulses(30, 'engine'), fast, 'migrate existing engine mode');
assert.equal(roadPulses(30, 'off').length, 0);
assert.equal(roadPulses(30, 'events').length, 0);
let ratio = 1.5;
const renderer = { setPixelRatio: r => { ratio = r; } };
for (const [quality, expected] of [['low', 0.75], ['medium', 1.25], ['high', 2]]) {
  applyRenderQuality(renderer, quality, 3);
  assert.equal(ratio, expected);
}
assert.equal(applyRenderQuality(renderer, 'high', 1), 1, 'do not oversample standard DPI');
assert.equal(applyRenderQuality(renderer, 'invalid', 3), 1.25);
assert.equal(applyRenderQuality(renderer, 'auto', 2, 0.6), 1.2, 'auto scales the capped ratio');
assert.equal(applyRenderQuality(renderer, 'high', 3, 1), 2, 'fixed tiers render at full scale');
assert.equal(getQualityTier('low').mirrorEveryNthFrame, 2);
assert.equal(getQualityTier('nope'), getQualityTier('medium'));
// Adaptive resolution: drops fast on slow frames, recovers slowly, never leaves 0.6-1.
const feed = (scaler, frameMs, seconds) => {
  const changes = [];
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += frameMs) {
    const next = scaler.sample(frameMs);
    if (next !== null) changes.push(next);
  }
  return changes;
};
const scaler = createAdaptiveScaler();
assert.deepEqual(feed(scaler, 16.7, 20), [], 'smooth frames at full scale change nothing');
assert.deepEqual(feed(scaler, 25, 1.5), [0.9], 'mildly slow frames step down one notch per window');
assert.equal(feed(scaler, 60, 5)[0], 0.6, 'very slow frames jump straight to the floor');
assert.deepEqual(feed(scaler, 60, 20), [], 'never goes below the floor');
assert.equal(scaler.sample(5000), null, 'a stalled tab is not a slow frame');
const recovery = feed(scaler, 16.7, 60);
assert.equal(recovery.at(-1), 1, 'recovers to full scale');
assert.ok(recovery.every((value, index) => index === 0 || Math.abs(value - recovery[index - 1] - 0.1) < 1e-9), 'climbs one step at a time');
scaler.reset();
assert.equal(scaler.scale, 1);
console.log('Road cadence, haptic priority, modes, cancellation, test feedback and quality tiers passed.');
