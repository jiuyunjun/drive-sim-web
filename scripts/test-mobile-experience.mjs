import assert from 'node:assert/strict';
import { createHaptics, applyRenderQuality } from '../public/assets/mobile-experience.js';
let time = 1000;
const pulses = [];
const h = createHaptics({ vibrate: p => { pulses.push(p); return true; } }, () => time);
h.setMode('road'); time += 400;
h.road(10);
assert.equal(pulses.at(-1), 12);
assert.equal(h.pulse([45, 25, 65], 3), true);
assert.equal(h.pulse(8), false, 'steering must not interrupt shifting');
h.road(10);
assert.deepEqual(pulses.at(-1), [45, 25, 65]);
h.stop(); assert.equal(pulses.at(-1), 0);
h.setMode('off'); time += 1000; assert.equal(h.pulse(20, 3), false);
h.setMode('events'); time += 1000; const count = pulses.length;
h.road(10); assert.equal(pulses.length, count);
assert.equal(createHaptics({}, () => time).pulse(10), false);
assert.equal(createHaptics({ vibrate() { throw Error('blocked'); } }, () => time).pulse(10), false);
h.setMode('off');
assert.equal(h.test(), true, 'explicit test works even when driving vibration is off');
assert.deepEqual(pulses.at(-1), [200, 100, 200]);
assert.equal(createHaptics({ vibrate: () => false }, () => time).test(), false);
// Cadence depends on speed only, stays capped, and works in reverse.
function roadPulses(speed, mode = 'road') {
  let clock = 0;
  const events = [];
  const feedback = createHaptics({ vibrate: p => { if (p) events.push([clock, p]); return true; } }, () => clock);
  feedback.setMode(mode);
  for (clock = 0; clock <= 3000; clock += 10) feedback.road(speed);
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
assert.deepEqual(roadPulses(100), fast, 'cap high-speed cadence');
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
console.log('Road cadence, haptic priority, modes, cancellation, test feedback and quality tiers passed.');
