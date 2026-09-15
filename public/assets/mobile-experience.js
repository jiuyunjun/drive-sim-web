// One scheduler owns the motor: driving events can interrupt engine pulses,
// while steering/release ticks cannot cut a gear change short.
export function createHaptics(device, now) {
  let mode = 'events', busyUntil = 0, priority = 0, nextEngine = 0;
  const supported = typeof device.vibrate === 'function';
  const vibrate = pattern => {
    try { return supported && device.vibrate(pattern); } catch { return false; }
  };
  const stop = () => { vibrate(0); busyUntil = 0; priority = 0; nextEngine = now() + 300; };
  const pulse = (pattern, rank = 1) => {
    if (!supported || mode === 'off') return false;
    const time = now();
    if (time < busyUntil && rank <= priority) return false;
    if (!vibrate(pattern)) return false;
    priority = rank;
    busyUntil = time + (Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : pattern) + 45;
    nextEngine = busyUntil + 100;
    return true;
  };
  return {
    supported, pulse, stop,
    test() { stop(); return vibrate([200, 100, 200]); },
    setMode(value) { stop(); mode = value; },
    engine(rpm, throttle, speed) {
      if (mode !== 'engine' || (throttle < 0.05 && speed < 0.3) || now() < nextEngine) return;
      const load = Math.max(0, Math.min(1, rpm || 0));
      pulse(Math.round(25 + load * 20), 0);
      nextEngine = now() + 240 - load * 100;
    },
  };
}

// Fixed user-selected resolution: driving never silently lowers the chosen tier.
export function applyRenderQuality(renderer, quality, devicePixelRatio = 1) {
  const cap = { low: 0.75, medium: 1.25, high: 2 }[quality] ?? 1.25;
  const ratio = Math.min(Math.max(devicePixelRatio || 1, 0.5), cap);
  renderer.setPixelRatio(ratio);
  return ratio;
}
