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

// Fixed user-selected resolution: driving never silently lowers the chosen tier.
export function applyRenderQuality(renderer, quality, devicePixelRatio = 1) {
  const cap = { low: 0.75, medium: 1.25, high: 2 }[quality] ?? 1.25;
  const ratio = Math.min(Math.max(devicePixelRatio || 1, 0.5), cap);
  renderer.setPixelRatio(ratio);
  return ratio;
}
