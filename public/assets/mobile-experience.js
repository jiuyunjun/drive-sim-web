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
    setMode(value) { stop(); mode = value; },
    engine(rpm, throttle, speed) {
      if (mode !== 'engine' || (throttle < 0.05 && speed < 0.3) || now() < nextEngine) return;
      const load = Math.max(0, Math.min(1, rpm || 0));
      pulse(Math.round(6 + load * 8), 0);
      nextEngine = now() + 280 - load * 130;
    },
  };
}

// Sample sustained frame time; change resolution slowly to avoid oscillation.
export function createAdaptiveQuality(renderer, enabled) {
  const ceiling = renderer.getPixelRatio();
  let total = 0, count = 0, lastChange = 0;
  return {
    sample(ms, now) {
      if (!enabled || ms <= 0 || ms > 100) return;
      total += ms; count++;
      if (now - lastChange < 3000 || count < 90) return;
      const average = total / count;
      const current = renderer.getPixelRatio();
      const next = average > 23 ? Math.max(0.75, current - 0.25)
        : average < 17.5 ? Math.min(ceiling, current + 0.25) : current;
      if (next !== current) renderer.setPixelRatio(next);
      total = 0; count = 0; lastChange = now;
    },
  };
}
