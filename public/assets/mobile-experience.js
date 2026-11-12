// One scheduler owns the motor: driving events can interrupt road pulses,
// while steering/release ticks cannot cut a gear change short.
export function createHaptics(device, now) {
  let mode = 'events', busyUntil = 0, priority = 0, nextRoad = 0;
  const supported = typeof device.vibrate === 'function';
  const vibrate = pattern => {
    try { return supported && device.vibrate(pattern); } catch { return false; }
  };
  const stop = () => { vibrate(0); busyUntil = 0; priority = 0; nextRoad = now() + 300; };
  const pulse = (pattern, rank = 1) => {
    if (!supported || mode === 'off') return false;
    const time = now();
    if (time < busyUntil && rank <= priority) return false;
    if (!vibrate(pattern)) return false;
    priority = rank;
    busyUntil = time + (Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern) + 45;
    nextRoad = busyUntil + 100;
    return true;
  };
  return {
    supported, pulse, stop,
    test() {
      if (mode === 'off') return false;
      stop();
      return vibrate([200, 100, 200]);
    },
    setMode(value) { stop(); mode = value === 'engine' ? 'road' : value; },
    road(speed) {
      // Speed is metres/second; resting and revving in place produce no bumps.
      const travelSpeed = Math.abs(speed);
      if (mode !== 'road' || !Number.isFinite(travelSpeed) || travelSpeed < 0.3 || now() < nextRoad) return;
      // Frequency grows linearly: 2 Hz + 0.01 Hz per km/h.
      // Keep pulse length fixed so higher speed changes cadence, not strength.
      const frequencyHz = 2 + travelSpeed * 3.6 * 0.01;
      if (pulse(12, 0)) nextRoad = now() + 1000 / frequencyHz;
    },
  };
}

export function shouldVibrateOnRelease(button) {
  return !button?.classList?.contains('mobileBrake')
    && !button?.classList?.contains('mobileHandbrake');
}

// What each tier costs beyond resolution. "auto" renders like "high" and lets the
// adaptive scaler below trade resolution for frame rate.
export const QUALITY_TIERS = Object.freeze({
  low: { pixelRatio: 0.75, shadowMap: 512, mirrorEveryNthFrame: 2 },
  medium: { pixelRatio: 1.25, shadowMap: 1024, mirrorEveryNthFrame: 1 },
  high: { pixelRatio: 2, shadowMap: 2048, mirrorEveryNthFrame: 1 },
  auto: { pixelRatio: 2, shadowMap: 2048, mirrorEveryNthFrame: 1 },
});

export function getQualityTier(quality) {
  return QUALITY_TIERS[quality] ?? QUALITY_TIERS.medium;
}

// Fixed tiers keep the user-selected resolution: driving never silently lowers them.
// Only the opt-in "auto" tier passes a scale below 1.
export function applyRenderQuality(renderer, quality, devicePixelRatio = 1, scale = 1) {
  const cap = getQualityTier(quality).pixelRatio;
  const ratio = Math.max(Math.min(Math.max(devicePixelRatio || 1, 0.5), cap) * scale, 0.5);
  renderer.setPixelRatio(ratio);
  return ratio;
}

// Resolution governor for the "auto" tier. Feed it frame intervals; it answers with a
// new scale (0.6–1) when one is due, otherwise null. It backs off quickly when frames
// run long and climbs back slowly, waiting twice as long after every drop so a device
// that cannot hold the higher step stops bouncing between the two.
export function createAdaptiveScaler({ min = 0.6, slowMs = 21.5, fastMs = 17.4 } = {}) {
  let scale = 1, total = 0, frames = 0, settle = 3.5, upWait = 4, upDelay = 4;
  const restart = (seconds) => { settle = seconds; total = 0; frames = 0; };
  return {
    get scale() { return scale; },
    // Call after anything that makes frame times unrepresentative (resize, tab return, map load).
    settle: (seconds = 2) => restart(seconds),
    reset() { scale = 1; upWait = 4; upDelay = 4; restart(3.5); },
    sample(frameMs) {
      if (!(frameMs > 0) || frameMs > 1500) return null;
      const seconds = frameMs / 1000;
      settle -= seconds; upWait -= seconds;
      if (settle > 0) { total = 0; frames = 0; return null; }
      total += frameMs; frames += 1;
      if (frames < 45 && total < 900) return null;
      const average = total / frames;
      total = 0; frames = 0;
      let next = scale;
      if (average > slowMs && scale > min) {
        next = average > 45 ? min : Math.max(min, scale - (average > 30 ? 0.2 : 0.1));
        upDelay = Math.min(60, upDelay * 2);
        upWait = upDelay;
      } else if (average < fastMs && scale < 1 && upWait <= 0) {
        next = Math.min(1, scale + 0.1);
        upWait = 2;
      } else if (average < fastMs && scale >= 1) {
        upDelay = 4;
      }
      next = Math.round(next * 10) / 10;
      if (next === scale) return null;
      scale = next;
      restart(1);
      return scale;
    },
  };
}
