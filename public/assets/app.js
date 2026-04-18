import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { applyPageTranslations, t } from './i18n.js';
import { buildCar } from './car-model.js';

applyPageTranslations(document);

const canvas = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0ff);
scene.fog = new THREE.Fog(0x9fd0ff, 90, 220);

// Clouds
{
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, transparent: true, opacity: 0.9 });
  function makeCloud(x, y, z, s) {
    const g = new THREE.Group();
    const puffs = [[0,0,0,5],[-4,-1,0,3.5],[4,-1,0,3.5],[-2,1.5,0,2.8],[2.5,1.5,0,2.8],[-6,-2,0,2],[6,-2,0,2]];
    for (const [px,py,pz,pr] of puffs) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(pr, 7, 5), cloudMat);
      m.position.set(px, py, pz);
      m.castShadow = false;
      m.receiveShadow = false;
      g.add(m);
    }
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    scene.add(g);
  }
  makeCloud(-80, 48, -60, 1.2);
  makeCloud(60, 42, -90, 1.0);
  makeCloud(-30, 52, -110, 0.85);
  makeCloud(110, 46, -70, 1.15);
  makeCloud(10, 55, -130, 0.95);
  makeCloud(-120, 44, -80, 1.3);
  makeCloud(70, 50, -150, 1.1);
}

const DEFAULT_CAMERA_FOV = 60;
const COCKPIT_CAMERA_FOV = 78;
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 1000);
camera.position.set(0, 18, 20);
const miniMapCamera = new THREE.OrthographicCamera(-24, 24, 24, -24, 0.1, 300);
miniMapCamera.up.set(0, 0, -1);
const miniMapViewport = {
  centerX: 0,
  centerZ: 0,
  halfSize: 24,
};

const mirrorCameras = {
  left: new THREE.PerspectiveCamera(56, 1.38, 0.1, 500),
  center: new THREE.PerspectiveCamera(52, 2.25, 0.1, 500),
  right: new THREE.PerspectiveCamera(56, 1.38, 0.1, 500),
};

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0, 0);
controls.update();

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4b5c66, 1.35);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.35);
sun.position.set(20, 40, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 150;
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

const speedEl = document.getElementById('speed');
const gearEl = document.getElementById('gear');
const viewModeEl = document.getElementById('viewMode');
const positionEl = document.getElementById('position');
const headingEl = document.getElementById('heading');
const maxSpeedEl = document.getElementById('maxSpeed');
const maxSpeedValueEl = document.getElementById('maxSpeedValue');
const steeringSensitivityEl = document.getElementById('steeringSensitivity');
const steeringSensitivityValueEl = document.getElementById('steeringSensitivityValue');
const accelCurveEl = document.getElementById('accelCurve');
const accelCurveValueEl = document.getElementById('accelCurveValue');
const accelCurveLineEl = document.getElementById('accelCurveLine');
const accelCurveGuideXEl = document.getElementById('accelCurveGuideX');
const accelCurveGuideYEl = document.getElementById('accelCurveGuideY');
const accelCurveDotEl = document.getElementById('accelCurveDot');
const accelCurveInputValueEl = document.getElementById('accelCurveInputValue');
const accelCurveOutputValueEl = document.getElementById('accelCurveOutputValue');
const autoCenterSteeringEl = document.getElementById('autoCenterSteering');
const vehicleTypeEl = document.getElementById('vehicleType');
const mapWidthEl = document.getElementById('mapWidth');
const mapScaleEl = document.getElementById('mapScale');
const mapScaleValueEl = document.getElementById('mapScaleValue');
const mapPresetEl = document.getElementById('mapPreset');
const uiEl = document.getElementById('ui');
const uiToggleEl = document.getElementById('uiToggle');
const quickViewButtons = Array.from(document.querySelectorAll('.quickViewBtn'));
const setSpawnBtnEl = document.getElementById('setSpawnBtn');
const copyMapJsonBtnEl = document.getElementById('copyMapJsonBtn');
const mirrorHudEl = document.getElementById('mirrorHud');
const mirrorLeftEl = document.getElementById('mirrorLeft');
const mirrorCenterEl = document.getElementById('mirrorCenter');
const mirrorRightEl = document.getElementById('mirrorRight');
const cockpitSignalHudEl = document.getElementById('cockpitSignalHud');
const cockpitSignalLampEls = Array.from(document.querySelectorAll('#cockpitSignalHud .cockpitSignalLamp'));
const miniMapEl = document.getElementById('miniMap');
const miniMapCloseEl = document.getElementById('miniMapClose');
const mobileControlsEl = document.getElementById('mobileControls');
const rotateOverlayEl = document.getElementById('rotateOverlay');
const mobileSteerZoneEl = document.getElementById('mobileSteerZone');
const mobileSteerIndicatorEl = document.getElementById('mobileSteerIndicator');
const signalLeverEl = document.getElementById('signalLever');
const signalLeverKnobEl = document.getElementById('signalLeverKnob');
const loadingOverlayEl = document.getElementById('loadingOverlay');
const signalStatusEl = document.getElementById('signalStatus');
const signalStatusBoxEl = document.getElementById('signalStatusBox');
const audioStatusEl = document.getElementById('audioStatus');
const audioStatusBoxEl = document.getElementById('audioStatusBox');
const steerAngleEl = document.getElementById('steerAngle');
const wheelHudDialEl = document.getElementById('wheelHudDial');
const mobileControlButtons = Array.from(document.querySelectorAll('#mobileControls .mobileControl'));

const MAP_WIDTH_MIN = Number(mapScaleEl.min) || 10;
const MAP_WIDTH_MAX = Number(mapScaleEl.max) || 1000;
const VIEW_ORDER = ['follow', 'cockpit', 'orbit'];
const TURN_SIGNAL_INTERVAL = 0.42;
const MIN_DRIVE_SPEED = 2;
const MAX_STEER = 0.6;
const STEERING_WHEEL_MAX = Math.PI * 1.35;
const STEERING_SENSITIVITY_MIN = Number(steeringSensitivityEl?.min) / 100 || 0.5;
const STEERING_SENSITIVITY_MAX = Number(steeringSensitivityEl?.max) / 100 || 2.0;
const FOLLOW_PITCH_LIMIT = THREE.MathUtils.degToRad(35);
const COCKPIT_LOOK_LIMIT = THREE.MathUtils.degToRad(75);
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const SETTINGS_STORAGE_KEY = 'driveSimSettingsV2';
const MAPS_BASE_URL = new URL('./maps/', import.meta.url);
const ANALYTICS_HEARTBEAT_MS = 30000;
const ACCEL_CURVE_CHART = Object.freeze({
  left: 32,
  right: 188,
  top: 20,
  bottom: 108,
  samples: 32,
});
const VIEW_LABELS = {
  follow: t('views.follow'),
  cockpit: t('views.cockpit'),
  orbit: t('views.orbit'),
};

function getAnalyticsTracker() {
  return typeof window.gtag === 'function' ? window.gtag : null;
}

function trackAnalyticsEvent(eventName, params = {}) {
  const gtag = getAnalyticsTracker();
  if (!gtag) return;
  gtag('event', eventName, {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    language: document.documentElement.lang || navigator.language || 'unknown',
    ...params,
  });
}

const playtimeAnalytics = {
  activeSinceMs: null,
  pendingPageMs: 0,
  pendingMapMs: 0,
  heartbeatTimerId: null,
  currentMapId: '',
  currentMapLabel: '',
  currentMapSource: 'built_in',
};

function isAnalyticsActive() {
  return !document.hidden;
}

function beginPlaytimeTracking() {
  if (!isAnalyticsActive() || playtimeAnalytics.activeSinceMs !== null) return;
  playtimeAnalytics.activeSinceMs = performance.now();
}

function consumeTrackedPlaytime(now = performance.now()) {
  if (playtimeAnalytics.activeSinceMs === null) return;
  const elapsedMs = Math.max(0, now - playtimeAnalytics.activeSinceMs);
  playtimeAnalytics.activeSinceMs = now;
  playtimeAnalytics.pendingPageMs += elapsedMs;
  playtimeAnalytics.pendingMapMs += elapsedMs;
}

function stopPlaytimeTracking(now = performance.now()) {
  consumeTrackedPlaytime(now);
  playtimeAnalytics.activeSinceMs = null;
}

function getCurrentMapAnalyticsMeta() {
  const isCustomMap = state.selectedMapId === 'custom';
  const fallbackLabel = isCustomMap ? (state.currentMapImage || 'custom-map') : (state.selectedMapId || 'unknown');
  return {
    mapId: isCustomMap ? 'custom' : (state.selectedMapId || 'unknown'),
    mapLabel: fallbackLabel,
    mapSource: isCustomMap ? 'custom' : 'built_in',
  };
}

function syncPlaytimeMapContext() {
  const { mapId, mapLabel, mapSource } = getCurrentMapAnalyticsMeta();
  playtimeAnalytics.currentMapId = mapId;
  playtimeAnalytics.currentMapLabel = mapLabel;
  playtimeAnalytics.currentMapSource = mapSource;
}

function flushPlaytimeAnalytics(reason) {
  if (isAnalyticsActive()) {
    consumeTrackedPlaytime();
  }

  const pageSeconds = Math.floor(playtimeAnalytics.pendingPageMs / 1000);
  const mapSeconds = Math.floor(playtimeAnalytics.pendingMapMs / 1000);

  if (pageSeconds >= 1) {
    trackAnalyticsEvent('drive_play_time', {
      reason,
      value: pageSeconds,
      play_time_seconds: pageSeconds,
      engagement_time_msec: pageSeconds * 1000,
      current_map_id: playtimeAnalytics.currentMapId || 'unknown',
      current_map_label: playtimeAnalytics.currentMapLabel || 'unknown',
      current_map_source: playtimeAnalytics.currentMapSource || 'built_in',
    });
    playtimeAnalytics.pendingPageMs -= pageSeconds * 1000;
  }

  if (mapSeconds >= 1 && playtimeAnalytics.currentMapId) {
    trackAnalyticsEvent('drive_map_play_time', {
      reason,
      value: mapSeconds,
      play_time_seconds: mapSeconds,
      engagement_time_msec: mapSeconds * 1000,
      map_id: playtimeAnalytics.currentMapId,
      map_label: playtimeAnalytics.currentMapLabel || playtimeAnalytics.currentMapId,
      map_source: playtimeAnalytics.currentMapSource || 'built_in',
    });
    playtimeAnalytics.pendingMapMs -= mapSeconds * 1000;
  }
}

function startPlaytimeHeartbeat() {
  if (playtimeAnalytics.heartbeatTimerId !== null) return;
  playtimeAnalytics.heartbeatTimerId = window.setInterval(() => {
    flushPlaytimeAnalytics('heartbeat');
  }, ANALYTICS_HEARTBEAT_MS);
}

function finalizePlaytimeTracking(reason) {
  stopPlaytimeTracking();
  flushPlaytimeAnalytics(reason);
}

let groundMesh;
let groundSize = { width: 80, height: 45 };
let groundAspect = 45 / 80;
let activeGroundTexture = null;
const textureLoader = new THREE.TextureLoader();
const audioState = {
  supported: Boolean(AudioContextClass),
  context: null,
  masterGain: null,
  engineGain: null,
  engineOscLow: null,
  engineOscHigh: null,
  engineFilter: null,
};
const persistedSettings = loadSettings();
let attemptedAddressBarHide = false;
let availableMaps = [];

function getDefaultStartPose() {
  return {
    x: -groundSize.width * 0.32,
    z: groundSize.height * 0.18,
    heading: Math.PI / 2,
  };
}

function sanitizeStartPose(pose) {
  if (!pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.z) || !Number.isFinite(pose.heading)) {
    return getDefaultStartPose();
  }
  return {
    x: pose.x,
    z: pose.z,
    heading: pose.heading,
  };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load saved settings:', error);
    return null;
  }
}

function saveSettings() {
  const settings = {
    maxSpeed: state.maxSpeed,
    steeringSensitivity: state.steeringSensitivity,
    accelCurve: state.accelCurve,
    autoCenterSteering: state.autoCenterSteering,
    vehicleType: state.vehicleType,
    uiCollapsed: state.uiCollapsed,
    selectedMapId: state.selectedMapId,
    mapImageDataUrl: state.mapImageDataUrl,
    currentMapImage: state.currentMapImage,
  };

  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
}

function syncMapControls(widthMeters) {
  const roundedWidth = Math.round(widthMeters);
  mapWidthEl.value = roundedWidth;
  mapScaleEl.value = roundedWidth;
  mapScaleValueEl.textContent = `${roundedWidth} m`;
}

function syncMaxSpeedControl(speed) {
  const clampedSpeed = THREE.MathUtils.clamp(speed, Number(maxSpeedEl.min) || MIN_DRIVE_SPEED, Number(maxSpeedEl.max) || 40);
  maxSpeedEl.value = String(clampedSpeed);
  maxSpeedValueEl.textContent = `${clampedSpeed} m/s`;
}

function syncSteeringSensitivityControl(sensitivity) {
  const clampedSensitivity = THREE.MathUtils.clamp(
    sensitivity,
    STEERING_SENSITIVITY_MIN,
    STEERING_SENSITIVITY_MAX
  );
  steeringSensitivityEl.value = String(Math.round(clampedSensitivity * 100));
  steeringSensitivityValueEl.textContent = `${clampedSensitivity.toFixed(2)}x`;
}

function syncAccelCurveControl(curve) {
  const clampedCurve = THREE.MathUtils.clamp(curve, 0.8, 1.8);
  accelCurveEl.value = String(Math.round(clampedCurve * 100));
  accelCurveValueEl.textContent = clampedCurve.toFixed(2);
  updateAccelCurveChart(clampedCurve);
}

function getAccelCurveOutput(inputAmount, curveAmount) {
  return Math.pow(
    THREE.MathUtils.clamp(inputAmount, 0, 1),
    THREE.MathUtils.clamp(curveAmount, 0.8, 1.8)
  );
}

function getAccelCurveChartX(inputAmount) {
  return THREE.MathUtils.lerp(ACCEL_CURVE_CHART.left, ACCEL_CURVE_CHART.right, inputAmount);
}

function getAccelCurveChartY(outputAmount) {
  return THREE.MathUtils.lerp(ACCEL_CURVE_CHART.bottom, ACCEL_CURVE_CHART.top, outputAmount);
}

function updateAccelCurveMarker(inputAmount) {
  if (!accelCurveDotEl || !accelCurveGuideXEl || !accelCurveGuideYEl) return;

  const clampedInput = THREE.MathUtils.clamp(inputAmount, 0, 1);
  const outputAmount = getAccelCurveOutput(clampedInput, state.accelCurve);
  const x = getAccelCurveChartX(clampedInput);
  const y = getAccelCurveChartY(outputAmount);
  const bottom = ACCEL_CURVE_CHART.bottom;
  const left = ACCEL_CURVE_CHART.left;

  accelCurveGuideXEl.setAttribute('x1', x.toFixed(1));
  accelCurveGuideXEl.setAttribute('y1', bottom.toFixed(1));
  accelCurveGuideXEl.setAttribute('x2', x.toFixed(1));
  accelCurveGuideXEl.setAttribute('y2', y.toFixed(1));

  accelCurveGuideYEl.setAttribute('x1', left.toFixed(1));
  accelCurveGuideYEl.setAttribute('y1', y.toFixed(1));
  accelCurveGuideYEl.setAttribute('x2', x.toFixed(1));
  accelCurveGuideYEl.setAttribute('y2', y.toFixed(1));

  accelCurveDotEl.setAttribute('cx', x.toFixed(1));
  accelCurveDotEl.setAttribute('cy', y.toFixed(1));

  if (accelCurveInputValueEl) accelCurveInputValueEl.textContent = `${Math.round(clampedInput * 100)}%`;
  if (accelCurveOutputValueEl) accelCurveOutputValueEl.textContent = `${Math.round(outputAmount * 100)}%`;
}

function updateAccelCurveChart(curve) {
  if (!accelCurveLineEl) return;

  const clampedCurve = THREE.MathUtils.clamp(curve, 0.8, 1.8);
  const points = [];

  for (let sample = 0; sample <= ACCEL_CURVE_CHART.samples; sample += 1) {
    const inputAmount = sample / ACCEL_CURVE_CHART.samples;
    const outputAmount = getAccelCurveOutput(inputAmount, clampedCurve);
    points.push(`${getAccelCurveChartX(inputAmount).toFixed(1)},${getAccelCurveChartY(outputAmount).toFixed(1)}`);
  }

  accelCurveLineEl.setAttribute('points', points.join(' '));
  updateAccelCurveMarker(typeof state === 'object' ? state.throttleInput : 0);
}

function syncAutoCenterControl(enabled) {
  autoCenterSteeringEl.checked = Boolean(enabled);
}

function syncVehicleTypeControl(vehicleType) {
  vehicleTypeEl.value = vehicleType;
}

function updateSignalStatus() {
  const labels = {
    off: t('signal.off'),
    left: t('signal.left'),
    right: t('signal.right'),
  };
  signalStatusEl.textContent = labels[state.turnSignal];
  signalStatusBoxEl.dataset.signal = state.turnSignal;
  if (cockpitSignalHudEl) cockpitSignalHudEl.dataset.signal = state.turnSignal;
}

function setAudioStatus(mode, label) {
  audioStatusBoxEl.dataset.audio = mode;
  audioStatusEl.textContent = label;
}

function setupAudioGraph() {
  if (!audioState.supported || audioState.context) return audioState.context;

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  const engineGain = context.createGain();
  const engineFilter = context.createBiquadFilter();
  const engineOscLow = context.createOscillator();
  const engineOscHigh = context.createOscillator();
  const lowMix = context.createGain();
  const highMix = context.createGain();

  masterGain.gain.value = 0.22;
  engineGain.gain.value = 0.0001;
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 280;
  engineFilter.Q.value = 1.2;

  engineOscLow.type = 'sawtooth';
  engineOscHigh.type = 'triangle';
  engineOscLow.frequency.value = 42;
  engineOscHigh.frequency.value = 86;

  lowMix.gain.value = 0.45;
  highMix.gain.value = 0.18;

  engineOscLow.connect(lowMix);
  engineOscHigh.connect(highMix);
  lowMix.connect(engineFilter);
  highMix.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(masterGain);
  masterGain.connect(context.destination);

  engineOscLow.start();
  engineOscHigh.start();

  audioState.context = context;
  audioState.masterGain = masterGain;
  audioState.engineGain = engineGain;
  audioState.engineOscLow = engineOscLow;
  audioState.engineOscHigh = engineOscHigh;
  audioState.engineFilter = engineFilter;

  return context;
}

async function ensureAudioRunning() {
  if (!audioState.supported) {
    setAudioStatus('error', t('audio.unavailable'));
    return false;
  }

  try {
    const context = setupAudioGraph();
    if (context.state !== 'running') {
      await context.resume();
    }
    setAudioStatus('on', t('audio.enabled'));
    return true;
  } catch (error) {
    console.error('Audio init failed:', error);
    setAudioStatus('error', t('audio.startFailed'));
    return false;
  }
}

function playIndicatorClick(isAccent = true) {
  const context = audioState.context;
  if (!context || context.state !== 'running' || !audioState.masterGain) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = isAccent ? 'square' : 'triangle';
  oscillator.frequency.setValueAtTime(isAccent ? 1320 : 920, now);
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(isAccent ? 1850 : 1280, now);
  filter.Q.setValueAtTime(4.5, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(isAccent ? 0.08 : 0.045, now + 0.0035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioState.masterGain);

  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

function updateSunShadowBounds() {
  const half = Math.max(groundSize.width, groundSize.height) * 0.7;
  sun.shadow.camera.left = -half;
  sun.shadow.camera.right = half;
  sun.shadow.camera.top = half;
  sun.shadow.camera.bottom = -half;
  sun.shadow.camera.updateProjectionMatrix();
}

function clampCarInsideMap() {
  const margin = 1.6;
  car.position.x = THREE.MathUtils.clamp(car.position.x, -groundSize.width / 2 + margin, groundSize.width / 2 - margin);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -groundSize.height / 2 + margin, groundSize.height / 2 - margin);
}

function updateGroundGeometry(widthMeters) {
  const previousWidth = groundSize.width;
  const previousHeight = groundSize.height;
  groundSize.width = widthMeters;
  groundSize.height = widthMeters * groundAspect;

  if (!groundMesh) return;

  if (previousWidth > 0 && previousHeight > 0) {
    const scaleX = groundSize.width / previousWidth;
    const scaleZ = groundSize.height / previousHeight;
    car.position.x *= scaleX;
    car.position.z *= scaleZ;
  }

  groundMesh.geometry.dispose();
  groundMesh.geometry = new THREE.PlaneGeometry(groundSize.width, groundSize.height);
  updateSunShadowBounds();
}

function applyGroundTexture(texture, widthMeters, heightMeters) {
  const previousTexture = activeGroundTexture;
  activeGroundTexture = texture;
  groundAspect = heightMeters / widthMeters;

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!groundMesh) {
    const geometry = new THREE.PlaneGeometry(widthMeters, heightMeters);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    });

    groundMesh = new THREE.Mesh(geometry, material);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundMesh.name = 'ground';
    scene.add(groundMesh);
  } else {
    groundMesh.material.map = texture;
    groundMesh.material.needsUpdate = true;
  }

  updateGroundGeometry(widthMeters);
  syncMapControls(widthMeters);

  if (previousTexture && previousTexture !== texture) {
    previousTexture.dispose();
  }
}

function createDefaultGround() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 576;
  const ctx = textureCanvas.getContext('2d');

  ctx.fillStyle = '#d7d7d7';
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, textureCanvas.width - 40, textureCanvas.height - 40);

  ctx.strokeStyle = '#f7f5a2';
  ctx.lineWidth = 6;
  ctx.setLineDash([30, 18]);
  ctx.beginPath();
  ctx.moveTo(textureCanvas.width * 0.15, textureCanvas.height * 0.22);
  ctx.lineTo(textureCanvas.width * 0.85, textureCanvas.height * 0.22);
  ctx.moveTo(textureCanvas.width * 0.20, textureCanvas.height * 0.58);
  ctx.lineTo(textureCanvas.width * 0.80, textureCanvas.height * 0.58);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#707070';
  ctx.fillRect(textureCanvas.width * 0.1, textureCanvas.height * 0.15, textureCanvas.width * 0.8, textureCanvas.height * 0.14);
  ctx.fillRect(textureCanvas.width * 0.16, textureCanvas.height * 0.51, textureCanvas.width * 0.68, textureCanvas.height * 0.14);
  ctx.fillRect(textureCanvas.width * 0.12, textureCanvas.height * 0.28, textureCanvas.width * 0.16, textureCanvas.height * 0.32);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(textureCanvas.width * 0.1, textureCanvas.height * 0.15, textureCanvas.width * 0.8, textureCanvas.height * 0.14);
  ctx.strokeRect(textureCanvas.width * 0.16, textureCanvas.height * 0.51, textureCanvas.width * 0.68, textureCanvas.height * 0.14);
  ctx.strokeRect(textureCanvas.width * 0.12, textureCanvas.height * 0.28, textureCanvas.width * 0.16, textureCanvas.height * 0.32);

  ctx.fillStyle = '#1f1f1f';
  ctx.font = 'bold 44px Arial';
  ctx.fillText('上传你的考试中心平面图', 260, 100);
  ctx.font = '28px Arial';
  ctx.fillText('当前是示例底图。上传后会自动替换。', 300, 145);

  const texture = new THREE.CanvasTexture(textureCanvas);
  applyGroundTexture(texture, 80, 45);
}

/* ── 从 car-model.js 导入车模 ── */
const { group: car, parts: carParts } = buildCar(THREE);
scene.add(car);

const {
  sedanRoot,
  body, shoulderShell, hood, trunk, frontBumper, rearBumper, grille,
  cabin, roofPanel, aPillarL, aPillarR, cPillarL, cPillarR,
  windshield, rearWindow, sideWindowL, sideWindowR,
  headlightL, headlightR, taillightL, taillightR,
  sideMirrorL, sideMirrorR, roofRailL, roofRailR,
  dashboard, instrumentCluster, centerScreen,
  driverSeat, passengerSeat, steeringWheel,
  wheelAssemblies,
  sedanSignalLamps, sedanBrakeLamps, reverseLamps,
  motorcycleRoot, bikeCockpitRoot, bikeCockpitBar,
  bikeHandlebar,
  bikeFrontWheelPivot, bikeFrontWheelAssembly, bikeRearWheelAssembly, bikeRearWheelMount,
  bikeSignalLamps, bikeBrakeLamp,
  arrow,
} = carParts;

/* ── 灯光运行时控制函数 ── */
function setSignalLampState(lamp, isActive) {
  lamp.mesh.material.emissiveIntensity = isActive ? 2.2 : 0.02;
  lamp.mesh.scale.setScalar(isActive ? 1.06 : 1);
  lamp.light.intensity = isActive ? 1.4 : 0;
}

function updateTurnSignalVisuals() {
  const leftActive = state.turnSignal === 'left' && state.signalBlinkVisible;
  const rightActive = state.turnSignal === 'right' && state.signalBlinkVisible;

  const isBike = state.vehicleType === 'motorcycle';
  const signals = isBike ? bikeSignalLamps : sedanSignalLamps;

  /* 隐藏非当前车型的转向灯 */
  const hidden = isBike ? sedanSignalLamps : bikeSignalLamps;
  hidden.left.forEach((lamp) => setSignalLampState(lamp, false));
  hidden.right.forEach((lamp) => setSignalLampState(lamp, false));

  signals.left.forEach((lamp) => setSignalLampState(lamp, leftActive));
  signals.right.forEach((lamp) => setSignalLampState(lamp, rightActive));

  cockpitSignalLampEls.forEach((lampEl) => {
    const direction = lampEl.dataset.direction;
    const isActive = (direction === 'left' && leftActive) || (direction === 'right' && rightActive);
    lampEl.classList.toggle('is-active', isActive);
  });
}

function updateBrakeLights(isActive) {
  const isBike = state.vehicleType === 'motorcycle';

  /* 轿车刹车灯 */
  sedanBrakeLamps.forEach((lamp) => {
    const on = !isBike && isActive;
    lamp.mesh.material.emissiveIntensity = on ? 2.4 : 0.04;
    lamp.mesh.scale.setScalar(on ? 1.04 : 1);
    lamp.light.intensity = on ? 1.6 : 0;
  });

  /* 摩托刹车灯（单个） */
  const bikeOn = isBike && isActive;
  bikeBrakeLamp.mesh.material.emissiveIntensity = bikeOn ? 2.4 : 0.04;
  bikeBrakeLamp.mesh.scale.setScalar(bikeOn ? 1.06 : 1);
  bikeBrakeLamp.light.intensity = bikeOn ? 1.4 : 0;
}

function updateReverseLights(isActive) {
  /* 摩托没有倒车灯 */
  const on = state.vehicleType !== 'motorcycle' && isActive;
  reverseLamps.forEach((lamp) => {
    lamp.mesh.material.emissiveIntensity = on ? 1.8 : 0.02;
    lamp.light.intensity = on ? 1.1 : 0;
  });
}

const browserControlKeys = new Set([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const keys = new Set();
const activeTouchPointers = new Map();
const MOBILE_HAPTIC = Object.freeze({
  tap: 14,
  tapStrong: [18, 10, 24],
  holdBrake: [20, 12, 28],
  holdDrive: [14, 10, 18],
  holdPulse: 10,
  holdIntervalMs: 170,
  steerStart: 12,
  steerTick: 8,
  steerStepCount: 8,
  signalToggle: [18, 10, 26],
  release: 8,
});

function activateKey(key) {
  keys.add(key);
}

function triggerMobileVibration(pattern) {
  if (!isMobileLikeDevice()) return;
  navigator.vibrate?.(pattern);
}

function syncMapPresetControl(mapId) {
  if (!mapPresetEl) return;
  mapPresetEl.value = mapId;
}

function populateMapPresetOptions() {
  if (!mapPresetEl) return;

  mapPresetEl.innerHTML = '';
  availableMaps.forEach((mapName) => {
    const option = document.createElement('option');
    option.value = mapName;
    option.textContent = mapName;
    mapPresetEl.append(option);
  });

  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = t('option.custom');
  mapPresetEl.append(customOption);
}

function deactivateKey(key) {
  keys.delete(key);
}

function showLoading() {
  loadingOverlayEl?.classList.add('visible');
}

function hideLoading() {
  loadingOverlayEl?.classList.remove('visible');
}

function handleDiscreteControlAction(action) {
  if (action === 'reset') resetCar();
  if (action === 'view') toggleView();
  if (action === 'signal-left') setTurnSignal('left');
  if (action === 'signal-right') setTurnSignal('right');
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (browserControlKeys.has(key)) event.preventDefault();
  void ensureAudioRunning();
  activateKey(key);
  if (event.repeat) return;
  if (key === 'o') resetCar();
  if (key === 'v') toggleView();
  if (key === 'q') setTurnSignal('left');
  if (key === 'e') setTurnSignal('right');
});

window.addEventListener('keyup', (event) => deactivateKey(event.key.toLowerCase()));
window.addEventListener('pointerdown', () => {
  void ensureAudioRunning();
  void requestMobileImmersiveMode();
}, { passive: true });

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (state.view !== 'cockpit' && state.view !== 'follow') return;
  if (event.button !== 0 && event.pointerType !== 'touch') return;
  state.lookDragActive = true;
  state.lookDragPointerId = event.pointerId;
  state.lookDragStartX = event.clientX;
  state.lookDragStartY = event.clientY;
  state.lookDragStartOffset = state.view === 'cockpit' ? state.cockpitLookOffset : state.followLookOffset;
  state.lookDragStartPitch = state.followLookPitch;
  renderer.domElement.setPointerCapture?.(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!state.lookDragActive || state.lookDragPointerId !== event.pointerId) return;
  if (state.view !== 'cockpit' && state.view !== 'follow') return;
  const sensitivity = event.pointerType === 'touch' ? 0.008 : 0.006;
  const deltaX = event.clientX - state.lookDragStartX;
  const deltaY = event.clientY - state.lookDragStartY;
  const nextOffset = state.lookDragStartOffset - deltaX * sensitivity;
  if (state.view === 'cockpit') {
    state.cockpitLookOffset = THREE.MathUtils.clamp(nextOffset, -COCKPIT_LOOK_LIMIT, COCKPIT_LOOK_LIMIT);
  } else if (state.view === 'follow') {
    state.followLookOffset = nextOffset;
    state.followLookPitch = THREE.MathUtils.clamp(
      state.lookDragStartPitch + deltaY * sensitivity,
      -FOLLOW_PITCH_LIMIT,
      FOLLOW_PITCH_LIMIT
    );
  }
});

function endLookDrag(event) {
  if (state.lookDragPointerId !== event.pointerId) return;
  state.lookDragActive = false;
  state.lookDragPointerId = null;
}

renderer.domElement.addEventListener('pointerup', endLookDrag);
renderer.domElement.addEventListener('pointercancel', endLookDrag);
window.addEventListener('fullscreenchange', refreshMobileShellState);
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshMobileShellState();
    beginPlaytimeTracking();
    return;
  }
  finalizePlaytimeTracking('hidden');
});
window.addEventListener('pageshow', refreshMobileShellState);
window.addEventListener('pageshow', beginPlaytimeTracking);
window.addEventListener('pagehide', () => finalizePlaytimeTracking('pagehide'));
window.addEventListener('beforeunload', () => finalizePlaytimeTracking('beforeunload'));

function bindMobileControls() {
  if (!mobileControlsEl) return;
  let steerHapticStep = 0;

  const suppressMobileUiDefault = (element) => {
    if (!element) return;
    ['contextmenu', 'selectstart', 'dragstart'].forEach((eventName) => {
      element.addEventListener(eventName, (event) => event.preventDefault());
    });
  };

  const startHoldHaptic = (pointerId) => {
    const binding = activeTouchPointers.get(pointerId);
    if (!binding) return;
    if (binding.hapticTimer) window.clearInterval(binding.hapticTimer);
    binding.hapticTimer = window.setInterval(() => {
      triggerMobileVibration(MOBILE_HAPTIC.holdPulse);
    }, MOBILE_HAPTIC.holdIntervalMs);
  };

  suppressMobileUiDefault(mobileControlsEl);
  suppressMobileUiDefault(mobileSteerZoneEl);
  suppressMobileUiDefault(signalLeverEl);

  const releasePointer = (pointerId) => {
    const binding = activeTouchPointers.get(pointerId);
    if (!binding) return;
    if (binding.hapticTimer) {
      window.clearInterval(binding.hapticTimer);
      binding.hapticTimer = null;
    }
    if (binding.key) deactivateKey(binding.key);
    binding.button.classList.remove('active');
    activeTouchPointers.delete(pointerId);
    triggerMobileVibration(MOBILE_HAPTIC.release);
  };

  mobileControlButtons.forEach((button) => {
    const holdKey = button.dataset.holdKey;
    const tapAction = button.dataset.tapAction;

    button.setAttribute('draggable', 'false');
    suppressMobileUiDefault(button);

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      void ensureAudioRunning();
      void requestMobileImmersiveMode();

      if (holdKey) {
        activateKey(holdKey);
        activeTouchPointers.set(event.pointerId, { key: holdKey, button, hapticTimer: null });
        button.classList.add('active');
        button.setPointerCapture?.(event.pointerId);
        const isBrakeButton = button.classList.contains('mobileBrake') || button.classList.contains('mobileHandbrake');
        triggerMobileVibration(isBrakeButton ? MOBILE_HAPTIC.holdBrake : MOBILE_HAPTIC.holdDrive);
        startHoldHaptic(event.pointerId);
        return;
      }

      triggerMobileVibration(MOBILE_HAPTIC.tapStrong);
      button.classList.add('active');
      window.setTimeout(() => button.classList.remove('active'), 140);
      if (tapAction) handleDiscreteControlAction(tapAction);
    });

    button.addEventListener('pointerup', (event) => {
      if (holdKey) releasePointer(event.pointerId);
    });
    button.addEventListener('pointercancel', (event) => {
      if (holdKey) releasePointer(event.pointerId);
    });
    button.addEventListener('lostpointercapture', (event) => {
      if (holdKey) releasePointer(event.pointerId);
    });
  });

  // 滑动转向区域
  if (mobileSteerZoneEl) {
    mobileSteerZoneEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      void ensureAudioRunning();
      void requestMobileImmersiveMode();
      triggerMobileVibration(MOBILE_HAPTIC.steerStart);
      state.touchSteerActive = true;
      state.touchSteerPointerId = e.pointerId;
      state.touchSteerStartX = e.clientX;
      state.touchSteerStartAngle = state.steeringWheelAngle;
      steerHapticStep = Math.round((state.steeringWheelAngle / STEERING_WHEEL_MAX) * MOBILE_HAPTIC.steerStepCount);
      mobileSteerZoneEl.setPointerCapture(e.pointerId);
      mobileSteerZoneEl.classList.add('active');
    });

    mobileSteerZoneEl.addEventListener('pointermove', (e) => {
      if (e.pointerId !== state.touchSteerPointerId) return;
      const dx = e.clientX - state.touchSteerStartX;
      // 110px 对应满打方向盘，灵敏度可调
      const sensitivity = STEERING_WHEEL_MAX / 110;
      state.steeringWheelAngle = THREE.MathUtils.clamp(
        state.touchSteerStartAngle - dx * sensitivity * state.steeringSensitivity,
        -STEERING_WHEEL_MAX,
        STEERING_WHEEL_MAX
      );
      const nextHapticStep = Math.round((state.steeringWheelAngle / STEERING_WHEEL_MAX) * MOBILE_HAPTIC.steerStepCount);
      if (nextHapticStep !== steerHapticStep) {
        steerHapticStep = nextHapticStep;
        triggerMobileVibration(MOBILE_HAPTIC.steerTick);
      }
      const pct = Math.round((state.steeringWheelAngle / STEERING_WHEEL_MAX) * -100);
      mobileSteerZoneEl.setAttribute('aria-valuenow', pct);
    });

    const endSteer = (e) => {
      if (e.pointerId !== state.touchSteerPointerId) return;
      state.touchSteerActive = false;
      state.touchSteerPointerId = null;
      mobileSteerZoneEl.classList.remove('active');
      triggerMobileVibration(MOBILE_HAPTIC.release);
    };
    mobileSteerZoneEl.addEventListener('pointerup', endSteer);
    mobileSteerZoneEl.addEventListener('pointercancel', endSteer);
    mobileSteerZoneEl.addEventListener('lostpointercapture', endSteer);
  }

  // 转向灯拨杆
  if (signalLeverEl && signalLeverKnobEl) {
    let leverPointerId = null;
    let leverStartY = 0;
    let leverToggled = false;
    const LEVER_THRESHOLD = 14; // px，超过即触发
    const LEVER_MAX = 20;       // 旋钮最大偏移 px

    signalLeverEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      void ensureAudioRunning();
      void requestMobileImmersiveMode();
      triggerMobileVibration(MOBILE_HAPTIC.tap);
      leverPointerId = e.pointerId;
      leverStartY = e.clientY;
      leverToggled = false;
      signalLeverEl.setPointerCapture(e.pointerId);
      signalLeverEl.classList.add('dragging');
    });

    signalLeverEl.addEventListener('pointermove', (e) => {
      if (e.pointerId !== leverPointerId) return;
      const dy = e.clientY - leverStartY;
      const clamped = Math.max(-LEVER_MAX, Math.min(LEVER_MAX, dy));
      signalLeverKnobEl.style.transform = `translate(-50%, calc(-50% + ${clamped}px))`;

      if (!leverToggled) {
        if (dy < -LEVER_THRESHOLD) {
          leverToggled = true;
          setTurnSignal('left');
          triggerMobileVibration(MOBILE_HAPTIC.signalToggle);
        } else if (dy > LEVER_THRESHOLD) {
          leverToggled = true;
          setTurnSignal('right');
          triggerMobileVibration(MOBILE_HAPTIC.signalToggle);
        }
      }
    });

    const endLever = (e) => {
      if (e.pointerId !== leverPointerId) return;
      const totalDy = Math.abs(e.clientY - leverStartY);
      leverPointerId = null;
      signalLeverEl.classList.remove('dragging');
      // 轻点（移动 < 6px 且未触发拨动）：关闭当前转向灯
      if (!leverToggled && totalDy < 6 && state.turnSignal !== 'off') {
        setTurnSignal(state.turnSignal); // 传入当前值 → toggle 为 off
        triggerMobileVibration(MOBILE_HAPTIC.tapStrong);
      }
      // 旋钮弹回中位（弹性动画）
      signalLeverKnobEl.style.transition = 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)';
      signalLeverKnobEl.style.transform = 'translate(-50%, -50%)';
      setTimeout(() => { signalLeverKnobEl.style.transition = ''; }, 250);
    };
    signalLeverEl.addEventListener('pointerup', endLever);
    signalLeverEl.addEventListener('pointercancel', endLever);
    signalLeverEl.addEventListener('lostpointercapture', endLever);
  }

  window.addEventListener('blur', () => {
    activeTouchPointers.forEach((binding, pointerId) => {
      if (binding.hapticTimer) {
        window.clearInterval(binding.hapticTimer);
        binding.hapticTimer = null;
      }
      deactivateKey(binding.key);
      binding.button.classList.remove('active');
      activeTouchPointers.delete(pointerId);
    });
    // 失焦时也复位触控转向
    state.touchSteerActive = false;
    state.touchSteerPointerId = null;
    if (mobileSteerZoneEl) mobileSteerZoneEl.classList.remove('active');
  });
}

function isMobileLikeDevice() {
  return window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)').matches;
}

function isStandaloneDisplayMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true;
}

async function tryEnterFullscreen() {
  if (!isMobileLikeDevice()) return;
  if (document.fullscreenElement || isStandaloneDisplayMode()) return;

  const root = document.documentElement;
  const requestFullscreen = root.requestFullscreen
    || root.webkitRequestFullscreen
    || root.msRequestFullscreen;

  if (!requestFullscreen) return;

  try {
    await requestFullscreen.call(root, { navigationUI: 'hide' });
  } catch (error) {
    console.debug('Fullscreen request unavailable:', error);
  }
}

function updateOrientationUi() {
  const isPortrait = window.innerHeight > window.innerWidth;
  document.body.classList.toggle('mobile-portrait', isMobileLikeDevice() && isPortrait);
  if (rotateOverlayEl) {
    rotateOverlayEl.setAttribute('aria-hidden', document.body.classList.contains('mobile-portrait') ? 'false' : 'true');
  }
}

async function tryLockLandscapeOrientation() {
  if (!isMobileLikeDevice()) return;
  if (!screen.orientation?.lock) return;

  try {
    await screen.orientation.lock('landscape');
  } catch (error) {
    try {
      await screen.orientation.lock('landscape-primary');
    } catch (fallbackError) {
      console.debug('Landscape orientation lock unavailable:', fallbackError ?? error);
    }
  }
}

function tryHideAddressBar() {
  if (!isMobileLikeDevice()) return;
  if (attemptedAddressBarHide) {
    window.scrollTo(0, 1);
    return;
  }
  attemptedAddressBarHide = true;
  // CSS 已通过 html { overflow-y: auto; min-height: calc(100% + 2px) } 让文档可滚动 1px
  // body 用 position:fixed 保证游戏内容不跟着动
  // 这里触发实际滚动，让浏览器隐藏地址栏
  requestAnimationFrame(() => {
    window.scrollTo(0, 1);
    window.setTimeout(() => window.scrollTo(0, 1), 120);
  });
}

async function requestMobileImmersiveMode() {
  if (!isMobileLikeDevice()) return;
  await tryEnterFullscreen();
  await tryLockLandscapeOrientation();
  tryHideAddressBar();
}

function refreshMobileShellState() {
  if (!isMobileLikeDevice()) return;
  updateOrientationUi();
  if (isStandaloneDisplayMode() || document.fullscreenElement) {
    void tryLockLandscapeOrientation();
  }
  tryHideAddressBar();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const serviceWorkerUrl = new URL('../sw.js', window.location.href);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(serviceWorkerUrl.href).catch((error) => {
      console.debug('Service worker registration failed:', error);
    });
  }, { once: true });
}

const state = {
  speed: 0,
  heading: 0,
  steer: 0,
  steeringWheelAngle: 0,
  steeringSensitivity: THREE.MathUtils.clamp(
    Number(persistedSettings?.steeringSensitivity) || 1,
    STEERING_SENSITIVITY_MIN,
    STEERING_SENSITIVITY_MAX
  ),
  vehicleType: persistedSettings?.vehicleType === 'motorcycle' ? 'motorcycle' : 'sedan',
  view: 'follow',
  uiCollapsed: false,
  maxSpeed: Number(maxSpeedEl.value),
  accelCurve: THREE.MathUtils.clamp((Number(persistedSettings?.accelCurve) || 1.35), 0.8, 1.8),
  turnSignal: 'off',
  signalBlinkVisible: false,
  signalTimer: 0,
  throttleInput: 0,
  reverseInput: 0,
  autoCenterSteering: persistedSettings?.autoCenterSteering !== undefined ? Boolean(persistedSettings.autoCenterSteering) : true,
  selectedMapId: persistedSettings?.selectedMapId || '',
  mapImageDataUrl: persistedSettings?.mapImageDataUrl || null,
  currentMapImage: typeof persistedSettings?.currentMapImage === 'string' ? persistedSettings.currentMapImage : '',
  startPose: getDefaultStartPose(),
  miniMapExpanded: false,
  followLookOffset: 0,
  followLookPitch: 0,
  cockpitLookOffset: 0,
  mapResizeSnapUntil: 0,
  lookDragActive: false,
  lookDragPointerId: null,
  lookDragStartX: 0,
  lookDragStartY: 0,
  lookDragStartOffset: 0,
  lookDragStartPitch: 0,
  touchSteerActive: false,
  touchSteerPointerId: null,
  touchSteerStartX: 0,
  touchSteerStartAngle: 0,
  gripExceededLast: false,
};

function setUiCollapsed(collapsed) {
  state.uiCollapsed = collapsed;
  uiEl.classList.toggle('collapsed', collapsed);
  uiToggleEl.textContent = collapsed ? t('ui.showMenu') : t('ui.hideMenu');
  saveSettings();
}

function syncQuickViewButtons() {
  quickViewButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.viewTarget === state.view);
  });
}

function setTurnSignal(nextSignal) {
  const toggledSignal = state.turnSignal === nextSignal ? 'off' : nextSignal;
  state.turnSignal = toggledSignal;
  state.signalTimer = 0;
  state.signalBlinkVisible = toggledSignal !== 'off';
  updateSignalStatus();
  updateTurnSignalVisuals();
  playIndicatorClick(toggledSignal !== 'off');
  // 同步拨杆视觉状态
  if (signalLeverEl) signalLeverEl.dataset.signal = toggledSignal;
}

function updateTurnSignal(dt) {
  if (state.turnSignal === 'off') {
    if (state.signalBlinkVisible) {
      state.signalBlinkVisible = false;
      updateTurnSignalVisuals();
    }
    return;
  }

  state.signalTimer += dt;
  if (state.signalTimer >= TURN_SIGNAL_INTERVAL) {
    state.signalTimer -= TURN_SIGNAL_INTERVAL;
    state.signalBlinkVisible = !state.signalBlinkVisible;
    updateTurnSignalVisuals();
    playIndicatorClick(state.signalBlinkVisible);
  }
}

function getVehicleAxes() {
  const forward = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  return { forward, right };
}

function getViewAxesWithOffset(offset) {
  const { forward, right } = getVehicleAxes();
  const cosYaw = Math.cos(offset);
  const sinYaw = Math.sin(offset);
  const viewForward = forward.clone().multiplyScalar(cosYaw).add(right.clone().multiplyScalar(sinYaw));
  const viewRight = forward.clone().multiplyScalar(-sinYaw).add(right.clone().multiplyScalar(cosYaw));
  return { forward, right, viewForward, viewRight };
}

function getViewPose(view) {
  const { forward, right } = getVehicleAxes();

  if (view === 'cockpit') {
    const { viewForward, viewRight } = getViewAxesWithOffset(state.cockpitLookOffset);
    if (state.vehicleType === 'motorcycle') {
      const position = car.position.clone()
        .add(new THREE.Vector3(0, 1.42, 0))
        .add(forward.clone().multiplyScalar(0.18));
      const lookTarget = position.clone()
        .add(viewForward.clone().multiplyScalar(30))
        .add(viewRight.clone().multiplyScalar(0.04))
        .add(new THREE.Vector3(0, -0.08, 0));
      return { position, lookTarget };
    }
    // Keep the eye point slightly raised and forward to avoid clipping into the dash.
    const position = car.position.clone()
      .add(new THREE.Vector3(0, 1.6, 0))
      .add(forward.clone().multiplyScalar(0.28))
      .add(right.clone().multiplyScalar(-0.3));
    const lookTarget = position.clone()
      .add(viewForward.clone().multiplyScalar(28))
      .add(viewRight.clone().multiplyScalar(-0.04))
      .add(new THREE.Vector3(0, -0.12, 0));
    return { position, lookTarget };
  }

  const { viewForward } = getViewAxesWithOffset(state.followLookOffset);
  const followDistance = state.vehicleType === 'motorcycle' ? 7.2 : 9;
  const followBaseHeight = state.vehicleType === 'motorcycle' ? 4.6 : 5.5;
  const followHeight = followBaseHeight + Math.sin(state.followLookPitch) * followDistance * 0.72;
  const horizontalDistance = Math.cos(state.followLookPitch) * followDistance;
  const position = car.position.clone()
    .add(new THREE.Vector3(0, followHeight, 0))
    .add(viewForward.clone().multiplyScalar(-horizontalDistance));
  const lookTarget = car.position.clone()
    .add(new THREE.Vector3(0, state.vehicleType === 'motorcycle' ? 1.28 : 1.6, 0));
  return { position, lookTarget };
}

function setCockpitBodyVisibility(isVisible) {
  if (state.vehicleType === 'motorcycle') {
    body.visible = false;
    shoulderShell.visible = false;
    hood.visible = false;
    trunk.visible = false;
    frontBumper.visible = false;
    rearBumper.visible = false;
    grille.visible = false;
    cabin.visible = false;
    roofPanel.visible = false;
    headlightL.visible = false;
    headlightR.visible = false;
    taillightL.visible = false;
    taillightR.visible = false;
    sideMirrorL.visible = false;
    sideMirrorR.visible = false;
    roofRailL.visible = false;
    roofRailR.visible = false;
    rearWindow.visible = false;
    driverSeat.visible = false;
    passengerSeat.visible = false;
    dashboard.visible = false;
    instrumentCluster.visible = false;
    centerScreen.visible = false;
    steeringWheel.visible = false;
    windshield.visible = false;
    sideWindowL.visible = false;
    sideWindowR.visible = false;
    aPillarL.visible = false;
    aPillarR.visible = false;
    cPillarL.visible = false;
    cPillarR.visible = false;
    motorcycleRoot.visible = isVisible;
    bikeCockpitRoot.visible = !isVisible;
    wheelAssemblies.forEach((assembly) => {
      assembly.pivot.visible = false;
    });
    bikeFrontWheelPivot.visible = isVisible;
    bikeRearWheelMount.visible = isVisible;
    arrow.visible = isVisible && state.view !== 'cockpit';

    /* 隐藏轿车灯具 mesh（转向灯、刹车灯、倒车灯） */
    sedanSignalLamps.left.forEach((l) => { l.mesh.visible = false; l.light.visible = false; });
    sedanSignalLamps.right.forEach((l) => { l.mesh.visible = false; l.light.visible = false; });
    sedanBrakeLamps.forEach((l) => { l.mesh.visible = false; l.light.visible = false; });
    reverseLamps.forEach((l) => { l.mesh.visible = false; l.light.visible = false; });

    /* 显示摩托灯具 */
    bikeSignalLamps.left.forEach((l) => { l.mesh.visible = true; l.light.visible = true; });
    bikeSignalLamps.right.forEach((l) => { l.mesh.visible = true; l.light.visible = true; });
    bikeBrakeLamp.mesh.visible = true;
    bikeBrakeLamp.light.visible = true;
    return;
  }

  // Exterior parts: hidden in cockpit
  body.visible = isVisible;
  shoulderShell.visible = isVisible;
  hood.visible = isVisible;
  trunk.visible = isVisible;
  frontBumper.visible = isVisible;
  rearBumper.visible = isVisible;
  grille.visible = isVisible;
  cabin.visible = isVisible;
  roofPanel.visible = isVisible;
  headlightL.visible = isVisible;
  headlightR.visible = isVisible;
  taillightL.visible = isVisible;
  taillightR.visible = isVisible;
  sideMirrorL.visible = isVisible;
  sideMirrorR.visible = isVisible;
  roofRailL.visible = isVisible;
  roofRailR.visible = isVisible;
  rearWindow.visible = isVisible;
  driverSeat.visible = isVisible;
  passengerSeat.visible = isVisible;

  // Interior parts: always visible (seen from cockpit)
  dashboard.visible = true;
  instrumentCluster.visible = isVisible;
  centerScreen.visible = true;
  steeringWheel.visible = true;
  windshield.visible = true;
  sideWindowL.visible = true;
  sideWindowR.visible = true;
  aPillarL.visible = true;
  aPillarR.visible = true;
  cPillarL.visible = !isVisible; // only show C-pillars from cockpit for framing
  cPillarR.visible = !isVisible;
  motorcycleRoot.visible = false;
  bikeCockpitRoot.visible = false;
  wheelAssemblies.forEach((assembly) => {
    assembly.pivot.visible = true;
  });
  bikeFrontWheelPivot.visible = false;
  bikeRearWheelMount.visible = false;

  /* 显示轿车灯具 */
  sedanSignalLamps.left.forEach((l) => { l.mesh.visible = true; l.light.visible = true; });
  sedanSignalLamps.right.forEach((l) => { l.mesh.visible = true; l.light.visible = true; });
  sedanBrakeLamps.forEach((l) => { l.mesh.visible = true; l.light.visible = true; });
  reverseLamps.forEach((l) => { l.mesh.visible = true; l.light.visible = true; });

  /* 隐藏摩托灯具 */
  bikeSignalLamps.left.forEach((l) => { l.mesh.visible = false; l.light.visible = false; });
  bikeSignalLamps.right.forEach((l) => { l.mesh.visible = false; l.light.visible = false; });
  bikeBrakeLamp.mesh.visible = false;
  bikeBrakeLamp.light.visible = false;

  arrow.visible = isVisible && state.view !== 'cockpit';
}

function setVehicleType(nextVehicleType) {
  state.vehicleType = nextVehicleType === 'motorcycle' ? 'motorcycle' : 'sedan';
  syncVehicleTypeControl(state.vehicleType);
  motorcycleRoot.rotation.z = 0;
  bikeCockpitRoot.rotation.z = 0;
  bikeHandlebar.rotation.y = state.steer;
  bikeCockpitBar.rotation.y = state.steer;
  setCockpitBodyVisibility(state.view !== 'cockpit');
  const pose = getViewPose(state.view);
  if (state.view === 'orbit') {
    controls.target.copy(car.position).add(new THREE.Vector3(0, state.vehicleType === 'motorcycle' ? 1.0 : 1.2, 0));
    controls.update();
  } else {
    camera.position.copy(pose.position);
    camera.lookAt(pose.lookTarget);
  }
  saveSettings();
}

function setView(nextView) {
  state.view = nextView;
  const isOrbit = nextView === 'orbit';
  camera.fov = nextView === 'cockpit' ? COCKPIT_CAMERA_FOV : DEFAULT_CAMERA_FOV;
  camera.updateProjectionMatrix();
  if (nextView !== 'cockpit') {
    state.cockpitLookOffset = 0;
  }
  if (nextView !== 'follow') {
    state.followLookOffset = 0;
    state.followLookPitch = 0;
  }
  if (nextView === 'orbit') {
    state.lookDragActive = false;
    state.lookDragPointerId = null;
  }

  controls.enabled = isOrbit;
  viewModeEl.textContent = VIEW_LABELS[nextView];
  syncQuickViewButtons();
  mirrorHudEl.style.display = isOrbit ? 'none' : (nextView === 'cockpit' ? 'block' : 'flex');
  mirrorHudEl.classList.toggle('cockpit-layout', nextView === 'cockpit');
  if (cockpitSignalHudEl) cockpitSignalHudEl.classList.toggle('is-visible', nextView === 'cockpit');
  arrow.visible = !isOrbit && nextView !== 'cockpit';

  if (isOrbit) {
    setCockpitBodyVisibility(true);
    camera.position.set(car.position.x + 20, 22, car.position.z + 20);
    controls.target.copy(car.position).add(new THREE.Vector3(0, state.vehicleType === 'motorcycle' ? 1.0 : 1.2, 0));
    controls.update();
    return;
  }

  setCockpitBodyVisibility(nextView !== 'cockpit');

  const pose = getViewPose(nextView);
  camera.position.copy(pose.position);
  camera.lookAt(pose.lookTarget);
}

function toggleView() {
  const currentIndex = VIEW_ORDER.indexOf(state.view);
  const nextView = VIEW_ORDER[(currentIndex + 1) % VIEW_ORDER.length];
  setView(nextView);
}

function placeCarAtStart() {
  car.position.set(state.startPose.x, 0, state.startPose.z);
  state.heading = state.startPose.heading;
  clampCarInsideMap();
  car.rotation.y = state.heading;
}

function setMiniMapExpanded(expanded) {
  state.miniMapExpanded = expanded;
  miniMapEl.classList.toggle('expanded', expanded);
  document.body.classList.toggle('minimap-expanded', expanded);
}

function getVehicleDynamics() {
  if (state.vehicleType === 'motorcycle') {
    return {
      accel: 10.2,
      brake: 18.5,
      drag: 2.1,
      reverseFactor: 0.3,
      steeringWheelSpeed: 5.4,
      steeringReturnSpeed: 4.8,
      wheelBase: 1.62,
      throttleRise: 4.2,
      throttleFall: 6.2,
      reverseRise: 2.1,
      reverseFall: 5.8,
      maxSteer: 0.86,
      steerSpeedDrop: 0.04,
      maxLateralAccel: 10.2,
      scrubFactor: 2.4,
      leanGain: 0.9,
      leanMax: 0.5,
      leanResponse: 10,
    };
  }

  return {
    accel: 8.5,
    brake: 16.0,
    drag: 2.8,
    reverseFactor: 0.45,
    steeringWheelSpeed: 3.8,
    steeringReturnSpeed: 3.2,
    wheelBase: 2.8,
    throttleRise: 3.2,
    throttleFall: 4.6,
    reverseRise: 2.8,
    reverseFall: 4.2,
    maxSteer: MAX_STEER,
    steerSpeedDrop: 0.07,
    maxLateralAccel: 7.0,
    scrubFactor: 5.0,
    leanGain: 0,
    leanMax: 0,
    leanResponse: 8,
  };
}

function teleportCarTo(x, z) {
  car.position.set(x, 0, z);
  clampCarInsideMap();
  state.speed = 0;
  state.throttleInput = 0;
  state.reverseInput = 0;
  car.rotation.y = state.heading;
  updateBrakeLights(false);
  updateReverseLights(false);

  if (controls.enabled) {
    controls.target.copy(car.position).add(new THREE.Vector3(0, state.vehicleType === 'motorcycle' ? 1.0 : 1.2, 0));
    controls.update();
  }

  if (state.view !== 'orbit') {
    const pose = getViewPose(state.view);
    camera.position.copy(pose.position);
    camera.lookAt(pose.lookTarget);
  }
}

function resetCar() {
  placeCarAtStart();
  state.speed = 0;
  state.steer = 0;
  state.steeringWheelAngle = 0;
  state.turnSignal = 'off';
  state.signalBlinkVisible = false;
  state.signalTimer = 0;
  state.throttleInput = 0;
  state.reverseInput = 0;
  car.rotation.y = state.heading;
  updateSignalStatus();
  updateTurnSignalVisuals();
  updateBrakeLights(false);
  updateReverseLights(false);
  setCockpitBodyVisibility(state.view !== 'cockpit');
  steeringWheel.rotation.z = 0;
  wheelHudDialEl.style.transform = 'rotate(0rad)';
  steerAngleEl.textContent = '0';

  wheelAssemblies.forEach((assembly) => {
    assembly.pivot.rotation.y = 0;
    assembly.wheel.rotation.x = 0;
  });
  bikeFrontWheelPivot.rotation.y = 0;
  bikeFrontWheelAssembly.group.rotation.x = 0;
  bikeRearWheelAssembly.group.rotation.x = 0;
  bikeHandlebar.rotation.y = 0;
  bikeCockpitBar.rotation.y = 0;
  motorcycleRoot.rotation.z = 0;
  bikeCockpitRoot.rotation.z = 0;
  updateAccelCurveMarker(0);

  if (controls.enabled) {
    controls.target.copy(car.position).add(new THREE.Vector3(0, state.vehicleType === 'motorcycle' ? 1.0 : 1.2, 0));
    controls.update();
  }

  if (state.view !== 'orbit') {
    const pose = getViewPose(state.view);
    camera.position.copy(pose.position);
    camera.lookAt(pose.lookTarget);
  }
}

function updateCar(dt) {
  const dynamics = getVehicleDynamics();
  const accel = dynamics.accel;
  const brake = dynamics.brake;
  const drag = dynamics.drag;
  const reverseFactor = dynamics.reverseFactor;
  const steeringWheelSpeed = dynamics.steeringWheelSpeed;
  const steeringReturnSpeed = dynamics.steeringReturnSpeed;
  const wheelBase = dynamics.wheelBase;
  const throttleRise = dynamics.throttleRise;
  const throttleFall = dynamics.throttleFall;
  const reverseRise = dynamics.reverseRise;
  const reverseFall = dynamics.reverseFall;

  const forward = keys.has('w') || keys.has('arrowup');
  const backward = keys.has('s') || keys.has('arrowdown');
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  const brakePedal = keys.has(' ');
  const throttleTarget = brakePedal ? 0 : (forward ? 1 : 0);
  const reverseTarget = brakePedal ? 0 : (backward ? 1 : 0);
  const effectiveThrottleFall = brakePedal ? 14.0 : throttleFall;
  const effectiveReverseFall = brakePedal ? 14.0 : reverseFall;

  state.throttleInput = THREE.MathUtils.damp(
    state.throttleInput,
    throttleTarget,
    throttleTarget > state.throttleInput ? throttleRise : effectiveThrottleFall,
    dt
  );
  state.reverseInput = THREE.MathUtils.damp(
    state.reverseInput,
    reverseTarget,
    reverseTarget > state.reverseInput ? reverseRise : effectiveReverseFall,
    dt
  );

  if (state.throttleInput > 0.001) {
    const launchBoost = THREE.MathUtils.lerp(0.38, 1, Math.min(Math.abs(state.speed) / Math.max(state.maxSpeed * 0.4, MIN_DRIVE_SPEED), 1));
    state.speed += accel * Math.pow(state.throttleInput, state.accelCurve) * launchBoost * dt;
    if (state.speed > 0 && state.speed < MIN_DRIVE_SPEED) state.speed = MIN_DRIVE_SPEED;
  }
  if (state.reverseInput > 0.001) {
    state.speed -= accel * reverseFactor * Math.pow(state.reverseInput, 1.28) * dt;
    const minReverseSpeed = MIN_DRIVE_SPEED * reverseFactor;
    if (state.speed < 0 && Math.abs(state.speed) < minReverseSpeed) state.speed = -minReverseSpeed;
  }

  if (state.throttleInput < 0.01 && state.reverseInput < 0.01) {
    // 滑行阻力 = 滚动阻力（固定）+ 空气阻力（随速度线性增长，近似 v²）
    const v = Math.abs(state.speed);
    const rollingRes = drag * 0.57;
    const aeroDrag = 0.09 * v;
    const coastDecel = (rollingRes + aeroDrag) * dt;
    if (v <= coastDecel) state.speed = 0;
    else state.speed -= Math.sign(state.speed) * coastDecel;
  }

  // 踩油时也有持续空气阻力，让极速感觉是"推不动了"而非撞到硬限速
  {
    const v = Math.abs(state.speed);
    const contAero = 0.025 * v * v * dt;
    if (v > contAero) state.speed -= Math.sign(state.speed) * contAero;
  }

  if (brakePedal) {
    // 脚刹：桌面端空格作为制动踏板，制动力强于手刹
    const brakeForce = brake * dt;
    if (Math.abs(state.speed) <= brakeForce) state.speed = 0;
    else state.speed -= Math.sign(state.speed) * brakeForce;

    // 脚刹踩住时不保留残余推进，避免速度卡在中低速区间
    if (state.throttleInput < 0.02) state.throttleInput = 0;
    if (state.reverseInput < 0.02) state.reverseInput = 0;
  }

  updateBrakeLights(state.reverseInput > 0.05 || brakePedal);
  updateReverseLights(state.reverseInput > 0.05 || state.speed < -0.2);

  state.maxSpeed = Number(maxSpeedEl.value);
  state.accelCurve = Number(accelCurveEl.value) / 100;
  maxSpeedValueEl.textContent = `${state.maxSpeed} m/s`;
  state.speed = THREE.MathUtils.clamp(state.speed, -Math.max(MIN_DRIVE_SPEED * reverseFactor, state.maxSpeed * 0.45), state.maxSpeed);

  // 速度敏感转向：速度越快，方向盘转动越迟钝（防止高速急打方向）
  const speedMs = Math.abs(state.speed);
  const steerSpeedFactor = 1.0 / (1.0 + speedMs * dynamics.steerSpeedDrop);
  const effectiveSteeringSpeed = steeringWheelSpeed * state.steeringSensitivity * steerSpeedFactor;
  const effectiveReturnSpeed = steeringReturnSpeed * (0.55 + 0.45 * steerSpeedFactor);

  // 触控滑动转向时跳过键盘路径，由 touch handler 直接写 steeringWheelAngle
  if (!state.touchSteerActive) {
    if (left) state.steeringWheelAngle += effectiveSteeringSpeed * dt;
    if (right) state.steeringWheelAngle -= effectiveSteeringSpeed * dt;
    if (state.autoCenterSteering && !left && !right) {
      state.steeringWheelAngle = THREE.MathUtils.damp(state.steeringWheelAngle, 0, effectiveReturnSpeed, dt);
    }
  } else if (state.autoCenterSteering) {
    // 松手后自动回正（触控路径）
    state.steeringWheelAngle = THREE.MathUtils.damp(state.steeringWheelAngle, 0, effectiveReturnSpeed, dt);
  }
  state.steeringWheelAngle = THREE.MathUtils.clamp(state.steeringWheelAngle, -STEERING_WHEEL_MAX, STEERING_WHEEL_MAX);
  state.steer = (state.steeringWheelAngle / STEERING_WHEEL_MAX) * dynamics.maxSteer;

  if (Math.abs(state.speed) > 0.05 && Math.abs(state.steer) > 0.0005) {
    const turnRadius = wheelBase / Math.tan(state.steer);
    // 横向抓地力上限：弯道速度过高时产生推头，car往外滑
    const lateralAccelNeeded = (state.speed * state.speed) / Math.abs(turnRadius);
    const maxLateralAccel = 7.0; // 约 0.7g，驾校车型的抓地力上限
    const gripFactor = Math.min(1.0, dynamics.maxLateralAccel / Math.max(lateralAccelNeeded, 0.01));
    state.heading += (state.speed / turnRadius) * gripFactor * dt;
    // 超出抓地力时：轮胎摩擦消耗速度 + 触觉反馈
    if (gripFactor < 0.98) {
      const scrubDecel = (1.0 - gripFactor) * dynamics.scrubFactor;
      state.speed -= Math.sign(state.speed) * scrubDecel * dt;
      if (!state.gripExceededLast) navigator.vibrate?.([18, 8, 18]);
      state.gripExceededLast = true;
    } else {
      state.gripExceededLast = false;
    }
  } else {
    state.gripExceededLast = false;
  }

  car.rotation.y = state.heading;
  const moveDirection = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  car.position.addScaledVector(moveDirection, state.speed * dt);
  clampCarInsideMap();

  const leanSpeedRatio = Math.min(speedMs / Math.max(state.maxSpeed, 1), 1);
  const bikeLeanTarget = state.vehicleType === 'motorcycle' && speedMs > 0.35
    ? THREE.MathUtils.clamp(-state.steer * (0.22 + leanSpeedRatio * dynamics.leanGain), -dynamics.leanMax, dynamics.leanMax)
    : 0;
  motorcycleRoot.rotation.z = THREE.MathUtils.damp(motorcycleRoot.rotation.z, bikeLeanTarget, dynamics.leanResponse, dt);
  bikeCockpitRoot.rotation.z = THREE.MathUtils.damp(bikeCockpitRoot.rotation.z, bikeLeanTarget * 0.45, dynamics.leanResponse, dt);

  wheelAssemblies.forEach((assembly) => {
    const steerAngle = assembly.steerable ? state.steer : 0;
    assembly.pivot.rotation.y = steerAngle;
    assembly.wheel.rotation.x -= (state.speed * dt) / 0.48;
  });
  bikeFrontWheelPivot.rotation.y = state.steer;
  bikeFrontWheelAssembly.group.rotation.x -= (state.speed * dt) / 0.48;
  bikeRearWheelAssembly.group.rotation.x -= (state.speed * dt) / 0.48;

  steeringWheel.rotation.z = -state.steeringWheelAngle;
  bikeHandlebar.rotation.y = state.steer;
  bikeCockpitBar.rotation.y = state.steer;
  wheelHudDialEl.style.transform = `rotate(${-state.steeringWheelAngle}rad)`;
  steerAngleEl.textContent = Math.round(THREE.MathUtils.radToDeg(-state.steeringWheelAngle)).toString();
  updateAccelCurveMarker(state.throttleInput);

  // 更新触控转向区域的指示点位置
  if (mobileSteerIndicatorEl && mobileSteerZoneEl) {
    const ratio = state.steeringWheelAngle / STEERING_WHEEL_MAX;
    const maxOffset = (mobileSteerZoneEl.offsetWidth - 32) / 2;
    mobileSteerIndicatorEl.style.transform = `translateX(${-ratio * maxOffset}px)`;
  }

  speedEl.textContent = (Math.abs(state.speed) * 3.6).toFixed(1);
  gearEl.textContent = state.speed > 0.2 ? 'D' : state.speed < -0.2 ? 'R' : 'N';
  positionEl.textContent = `${car.position.x.toFixed(1)}, ${car.position.z.toFixed(1)}`;
  headingEl.textContent = formatHeadingValue(state.heading);
}

function updateEngineAudio() {
  const context = audioState.context;
  if (!context || context.state !== 'running') return;

  const now = context.currentTime;
  const accelerating = keys.has('w') || keys.has('arrowup');
  const reversing = keys.has('s') || keys.has('arrowdown');
  const speedRatio = Math.min(Math.abs(state.speed) / Math.max(state.maxSpeed, 1), 1);
  const throttleAmount = accelerating ? 1 : reversing ? 0.65 : 0.18;
  const baseFrequency = 42 + speedRatio * 96 + throttleAmount * 22;
  const targetCutoff = 220 + speedRatio * 860 + throttleAmount * 240;
  const targetGain = 0.018 + speedRatio * 0.055 + throttleAmount * 0.015;

  audioState.engineOscLow.frequency.setTargetAtTime(baseFrequency, now, 0.08);
  audioState.engineOscHigh.frequency.setTargetAtTime(baseFrequency * 2.03, now, 0.08);
  audioState.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.12);
  audioState.engineGain.gain.setTargetAtTime(targetGain, now, 0.12);
}

function updateCamera(dt) {
  if (!state.lookDragActive || state.view !== 'follow') {
    state.followLookOffset = THREE.MathUtils.damp(state.followLookOffset, 0, 6.5, dt);
    state.followLookPitch = THREE.MathUtils.damp(state.followLookPitch, 0, 6.5, dt);
  }
  if (!state.lookDragActive || state.view !== 'cockpit') {
    state.cockpitLookOffset = THREE.MathUtils.damp(state.cockpitLookOffset, 0, 7.5, dt);
  }

  if (state.view === 'orbit') {
    const orbitTarget = car.position.clone().add(new THREE.Vector3(0, state.vehicleType === 'motorcycle' ? 1.0 : 1.2, 0));
    if (performance.now() < state.mapResizeSnapUntil) {
      controls.target.copy(orbitTarget);
    } else {
      controls.target.lerp(orbitTarget, 1 - Math.pow(0.01, dt));
    }
    controls.update();
    return;
  }

  const pose = getViewPose(state.view);
  if (state.view === 'cockpit') {
    camera.position.copy(pose.position);
    camera.lookAt(pose.lookTarget);
    return;
  }

  const smooth = 1 - Math.pow(0.002, dt);
  if (performance.now() < state.mapResizeSnapUntil) {
    camera.position.copy(pose.position);
  } else {
    camera.position.lerp(pose.position, smooth);
  }
  camera.lookAt(pose.lookTarget);
}

function updateMirrorCamera(cameraRef, side) {
  const { forward, right } = getVehicleAxes();
  const sideDirection = side === 'left' ? 1 : side === 'right' ? -1 : 0;
  const offset = side === 'center' ? 0 : 0.88 * sideDirection;
  const lateralLook = side === 'center' ? 0 : 8.5 * sideDirection;
  const mirrorPosition = car.position.clone()
    .add(new THREE.Vector3(0, side === 'center' ? 1.93 : 1.78, 0))
    .add(forward.clone().multiplyScalar(side === 'center' ? 0.24 : 0.06))
    .add(right.clone().multiplyScalar(offset));
  const mirrorTarget = mirrorPosition.clone()
    .add(forward.clone().multiplyScalar(-16))
    .add(right.clone().multiplyScalar(lateralLook))
    .add(new THREE.Vector3(0, 0.12, 0));

  cameraRef.position.copy(mirrorPosition);
  cameraRef.lookAt(mirrorTarget);
}

function renderMirrorPane(container, cameraRef, side) {
  const rect = container.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  cameraRef.aspect = rect.width / rect.height;
  cameraRef.updateProjectionMatrix();
  if (side === 'center') {
    cameraRef.projectionMatrix.elements[0] *= -1;
    cameraRef.projectionMatrixInverse.copy(cameraRef.projectionMatrix).invert();
  }
  updateMirrorCamera(cameraRef, side);

  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setViewport(rect.left, window.innerHeight - rect.bottom, rect.width, rect.height);
  renderer.setScissor(rect.left, window.innerHeight - rect.bottom, rect.width, rect.height);
  renderer.render(scene, cameraRef);
}

function renderRearViewMirrors() {
  if (state.view === 'orbit') return;
  renderMirrorPane(mirrorLeftEl, mirrorCameras.left, 'left');
  renderMirrorPane(mirrorCenterEl, mirrorCameras.center, 'center');
  renderMirrorPane(mirrorRightEl, mirrorCameras.right, 'right');
  renderer.setScissorTest(false);
}

function updateMiniMapCamera() {
  const mapHalfWidth = groundSize.width * 0.5;
  const mapHalfHeight = groundSize.height * 0.5;
  const miniHalfSize = state.miniMapExpanded
    ? Math.max(groundSize.width, groundSize.height) * 0.56
    : Math.max(16, Math.max(groundSize.width, groundSize.height) * 0.34);
  const centerX = state.miniMapExpanded
    ? 0
    : THREE.MathUtils.clamp(car.position.x, -mapHalfWidth, mapHalfWidth);
  const centerZ = state.miniMapExpanded
    ? 0
    : THREE.MathUtils.clamp(car.position.z, -mapHalfHeight, mapHalfHeight);

  miniMapViewport.centerX = centerX;
  miniMapViewport.centerZ = centerZ;
  miniMapViewport.halfSize = miniHalfSize;

  miniMapCamera.left = -miniHalfSize;
  miniMapCamera.right = miniHalfSize;
  miniMapCamera.top = miniHalfSize;
  miniMapCamera.bottom = -miniHalfSize;
  miniMapCamera.position.set(centerX, 80, centerZ);
  miniMapCamera.lookAt(centerX, 0, centerZ);
  miniMapCamera.updateProjectionMatrix();
}

function renderMiniMap() {
  const rect = miniMapEl.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  updateMiniMapCamera();
  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setViewport(rect.left, window.innerHeight - rect.bottom, rect.width, rect.height);
  renderer.setScissor(rect.left, window.innerHeight - rect.bottom, rect.width, rect.height);
  renderer.render(scene, miniMapCamera);
  renderer.setScissorTest(false);
}

function handleMiniMapClick(event) {
  if (!state.miniMapExpanded) {
    setMiniMapExpanded(true);
    return;
  }

  const rect = miniMapEl.getBoundingClientRect();
  const normalizedX = (event.clientX - rect.left) / rect.width;
  const normalizedY = (event.clientY - rect.top) / rect.height;
  const worldX = miniMapViewport.centerX + (normalizedX - 0.5) * miniMapViewport.halfSize * 2;
  const worldZ = miniMapViewport.centerZ + (normalizedY - 0.5) * miniMapViewport.halfSize * 2;
  teleportCarTo(worldX, worldZ);
}

miniMapEl.addEventListener('click', handleMiniMapClick);
miniMapCloseEl?.addEventListener('click', (event) => {
  event.stopPropagation();
  setMiniMapExpanded(false);
});
miniMapEl.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (state.miniMapExpanded) {
    setMiniMapExpanded(false);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.miniMapExpanded) {
    setMiniMapExpanded(false);
  }
});

document.getElementById('viewBtn').addEventListener('click', toggleView);
document.getElementById('resetBtn').addEventListener('click', resetCar);
setSpawnBtnEl.addEventListener('click', () => {
  state.startPose = {
    x: car.position.x,
    z: car.position.z,
    heading: state.heading,
  };
  saveSettings();
});
copyMapJsonBtnEl?.addEventListener('click', handleCopyMapJson);
uiToggleEl.addEventListener('click', () => {
  setUiCollapsed(!state.uiCollapsed);
});

quickViewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetView = button.dataset.viewTarget;
    if (targetView) setView(targetView);
  });
});

function updateMapWidth(widthMeters) {
  const clampedWidth = THREE.MathUtils.clamp(widthMeters, MAP_WIDTH_MIN, MAP_WIDTH_MAX);
  state.mapResizeSnapUntil = performance.now() + 120;
  syncMapControls(clampedWidth);
  updateGroundGeometry(clampedWidth);
  saveSettings();
}

function formatHeadingValue(headingRadians) {
  const normalizedRadians = THREE.MathUtils.euclideanModulo(headingRadians, Math.PI * 2);
  const degrees = THREE.MathUtils.radToDeg(normalizedRadians);
  return `${degrees.toFixed(1)}° / ${normalizedRadians.toFixed(6)} rad`;
}

function buildCurrentMapConfigJson() {
  const normalizedHeading = THREE.MathUtils.euclideanModulo(state.heading, Math.PI * 2);
  return JSON.stringify({
    image: state.currentMapImage || '',
    mapWidth: Math.round(groundSize.width),
    maxSpeed: Number(state.maxSpeed.toFixed(2)),
    startPose: {
      x: Number(car.position.x.toFixed(1)),
      z: Number(car.position.z.toFixed(1)),
      heading: Number(normalizedHeading.toFixed(6)),
    },
  }, null, 2);
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      console.warn('navigator.clipboard.writeText failed, falling back to execCommand:', error);
    }
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  helper.style.pointerEvents = 'none';
  document.body.append(helper);
  helper.select();
  helper.setSelectionRange(0, helper.value.length);
  const copied = document.execCommand('copy');
  helper.remove();

  if (!copied) {
    throw new Error('Clipboard copy failed');
  }
}

let copyMapJsonResetTimer = null;

async function handleCopyMapJson() {
  if (!copyMapJsonBtnEl) return;
  const defaultLabel = t('controls.copyMapJson');

  try {
    await copyTextToClipboard(buildCurrentMapConfigJson());
    copyMapJsonBtnEl.textContent = t('controls.copyMapJsonDone');
  } catch (error) {
    console.warn('Failed to copy map JSON:', error);
    copyMapJsonBtnEl.textContent = t('controls.copyMapJsonFailed');
  }

  if (copyMapJsonResetTimer) {
    window.clearTimeout(copyMapJsonResetTimer);
  }
  copyMapJsonResetTimer = window.setTimeout(() => {
    copyMapJsonBtnEl.textContent = defaultLabel;
  }, 1600);
}

mapScaleEl.addEventListener('input', () => {
  updateMapWidth(Number(mapScaleEl.value));
});

mapWidthEl.addEventListener('input', () => {
  const widthMeters = Number(mapWidthEl.value);
  if (!Number.isFinite(widthMeters)) return;
  updateMapWidth(widthMeters);
});

mapWidthEl.addEventListener('change', () => {
  const widthMeters = Number(mapWidthEl.value);
  if (!Number.isFinite(widthMeters)) {
    syncMapControls(groundSize.width);
    return;
  }
  updateMapWidth(widthMeters);
});

maxSpeedEl.addEventListener('input', () => {
  state.maxSpeed = Number(maxSpeedEl.value);
  syncMaxSpeedControl(state.maxSpeed);
  saveSettings();
});

steeringSensitivityEl.addEventListener('input', () => {
  state.steeringSensitivity = Number(steeringSensitivityEl.value) / 100;
  syncSteeringSensitivityControl(state.steeringSensitivity);
  saveSettings();
});

accelCurveEl.addEventListener('input', () => {
  state.accelCurve = Number(accelCurveEl.value) / 100;
  syncAccelCurveControl(state.accelCurve);
  saveSettings();
});

autoCenterSteeringEl.addEventListener('change', () => {
  state.autoCenterSteering = autoCenterSteeringEl.checked;
  saveSettings();
});

vehicleTypeEl.addEventListener('change', () => {
  setVehicleType(vehicleTypeEl.value);
});

function applyMapSource(src, shouldReset = true) {
  showLoading();
  const img = new Image();
  img.onload = () => {
    const requestedWidth = Number.isFinite(Number(mapWidthEl.value))
      ? THREE.MathUtils.clamp(Number(mapWidthEl.value), MAP_WIDTH_MIN, MAP_WIDTH_MAX)
      : groundSize.width;
    const heightMeters = requestedWidth * (img.height / img.width);

    textureLoader.load(
      src,
      (texture) => {
        applyGroundTexture(texture, requestedWidth, heightMeters);
        hideLoading();
        if (shouldReset) {
          resetCar();
        } else {
          placeCarAtStart();
          if (state.view !== 'orbit') {
            const pose = getViewPose(state.view);
            camera.position.copy(pose.position);
            camera.lookAt(pose.lookTarget);
          }
        }
        saveSettings();
      }
    );
  };
  img.onerror = () => hideLoading();
  img.src = src;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function loadMapCatalog() {
  const catalogUrl = new URL('index.json', MAPS_BASE_URL);
  const catalog = await fetchJson(catalogUrl);
  availableMaps = Array.isArray(catalog.maps) ? catalog.maps : [];
  populateMapPresetOptions();

  if (!availableMaps.length) {
    throw new Error('No maps declared in maps/index.json');
  }

  if (!availableMaps.includes(state.selectedMapId)) {
    state.selectedMapId = availableMaps[0];
  }
}

async function loadBuiltInMap(mapId, shouldReset = true) {
  flushPlaytimeAnalytics('map_change');
  const resolvedMapId = availableMaps.includes(mapId) ? mapId : availableMaps[0];
  const configUrl = new URL(`${resolvedMapId}.json`, MAPS_BASE_URL);
  const mapConfig = await fetchJson(configUrl);

  state.selectedMapId = resolvedMapId;
  state.mapImageDataUrl = null;
  state.currentMapImage = typeof mapConfig.image === 'string' ? mapConfig.image : '';
  state.startPose = sanitizeStartPose(mapConfig.startPose);
  state.maxSpeed = THREE.MathUtils.clamp(
    Number.isFinite(mapConfig.maxSpeed) ? mapConfig.maxSpeed : state.maxSpeed,
    Number(maxSpeedEl.min) || MIN_DRIVE_SPEED,
    Number(maxSpeedEl.max) || 40
  );
  syncMapPresetControl(resolvedMapId);
  syncMapControls(mapConfig.mapWidth ?? groundSize.width);
  syncMaxSpeedControl(state.maxSpeed);
  syncPlaytimeMapContext();

  applyMapSource(new URL(mapConfig.image, MAPS_BASE_URL).href, shouldReset);
  saveSettings();
}

function handleMapUpload(file) {
  flushPlaytimeAnalytics('map_change');
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') return;
    state.selectedMapId = 'custom';
    state.mapImageDataUrl = reader.result;
    state.currentMapImage = file.name || 'custom-map';
    syncPlaytimeMapContext();
    syncMapPresetControl('custom');
    applyMapSource(reader.result);
  };
  reader.readAsDataURL(file);
}

document.getElementById('mapInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) handleMapUpload(file);
});

mapPresetEl?.addEventListener('change', () => {
  const selected = mapPresetEl.value;
  if (selected === 'custom') {
    if (state.mapImageDataUrl) {
      state.selectedMapId = 'custom';
      applyMapSource(state.mapImageDataUrl);
    } else {
      syncMapPresetControl(state.selectedMapId);
      document.getElementById('mapInput').click();
    }
    return;
  }

  void loadBuiltInMap(selected);
});

bindMobileControls();
updateOrientationUi();
refreshMobileShellState();
void tryLockLandscapeOrientation();
registerServiceWorker();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  refreshMobileShellState();
});

window.addEventListener('orientationchange', refreshMobileShellState);

setAudioStatus(
  audioState.supported ? 'pending' : 'error',
  audioState.supported ? t('audio.pending') : t('audio.unavailable')
);
syncMaxSpeedControl(persistedSettings?.maxSpeed ?? state.maxSpeed);
syncSteeringSensitivityControl(state.steeringSensitivity);
syncAccelCurveControl(state.accelCurve);
syncAutoCenterControl(state.autoCenterSteering);
syncVehicleTypeControl(state.vehicleType);
state.maxSpeed = Number(maxSpeedEl.value);

resetCar();
setView('follow');
setVehicleType(state.vehicleType);
setUiCollapsed(isMobileLikeDevice() ? true : Boolean(persistedSettings?.uiCollapsed));
syncPlaytimeMapContext();
beginPlaytimeTracking();
startPlaytimeHeartbeat();

async function initializeMaps() {
  try {
    await loadMapCatalog();
    if (state.selectedMapId === 'custom' && state.mapImageDataUrl) {
      syncMapPresetControl('custom');
      applyMapSource(state.mapImageDataUrl, false);
      return;
    }
    await loadBuiltInMap(state.selectedMapId, false);
  } catch (error) {
    console.error('Map initialization failed:', error);
    createDefaultGround();
    syncMapControls(groundSize.width);
  }
}

const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  updateCar(dt);
  updateTurnSignal(dt);
  updateEngineAudio();
  updateCamera(dt);

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.render(scene, camera);
  renderRearViewMirrors();
  renderMiniMap();
  requestAnimationFrame(animate);
}

void initializeMaps();
animate();
