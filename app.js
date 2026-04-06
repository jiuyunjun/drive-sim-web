import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0ff);
scene.fog = new THREE.Fog(0x9fd0ff, 90, 220);

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
const maxSpeedEl = document.getElementById('maxSpeed');
const maxSpeedValueEl = document.getElementById('maxSpeedValue');
const autoCenterSteeringEl = document.getElementById('autoCenterSteering');
const mapWidthEl = document.getElementById('mapWidth');
const mapScaleEl = document.getElementById('mapScale');
const mapScaleValueEl = document.getElementById('mapScaleValue');
const uiEl = document.getElementById('ui');
const uiToggleEl = document.getElementById('uiToggle');
const setSpawnBtnEl = document.getElementById('setSpawnBtn');
const mirrorHudEl = document.getElementById('mirrorHud');
const mirrorLeftEl = document.getElementById('mirrorLeft');
const mirrorCenterEl = document.getElementById('mirrorCenter');
const mirrorRightEl = document.getElementById('mirrorRight');
const miniMapEl = document.getElementById('miniMap');
const mobileControlsEl = document.getElementById('mobileControls');
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
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const SETTINGS_STORAGE_KEY = 'driveSimSettingsV2';
const VIEW_LABELS = {
  follow: '跟车视角',
  cockpit: '第一人称',
  orbit: '自由观察',
};

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
    mapWidth: Math.round(groundSize.width),
    maxSpeed: state.maxSpeed,
    autoCenterSteering: state.autoCenterSteering,
    uiCollapsed: state.uiCollapsed,
    startPose: state.startPose,
    mapImageDataUrl: state.mapImageDataUrl,
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

function syncAutoCenterControl(enabled) {
  autoCenterSteeringEl.checked = Boolean(enabled);
}

function updateSignalStatus() {
  const labels = {
    off: '关闭',
    left: '左转',
    right: '右转',
  };
  signalStatusEl.textContent = labels[state.turnSignal];
  signalStatusBoxEl.dataset.signal = state.turnSignal;
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
    setAudioStatus('error', '不可用');
    return false;
  }

  try {
    const context = setupAudioGraph();
    if (context.state !== 'running') {
      await context.resume();
    }
    setAudioStatus('on', '已开启');
    return true;
  } catch (error) {
    console.error('Audio init failed:', error);
    setAudioStatus('error', '启动失败');
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
  groundSize.width = widthMeters;
  groundSize.height = widthMeters * groundAspect;

  if (!groundMesh) return;

  groundMesh.geometry.dispose();
  groundMesh.geometry = new THREE.PlaneGeometry(groundSize.width, groundSize.height);
  updateSunShadowBounds();
  clampCarInsideMap();
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

const worldRoot = new THREE.Group();
scene.add(worldRoot);

function createTree(x, z, s = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * s, 0.22 * s, 2.0 * s, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a5330 })
  );
  trunk.position.y = 1.0 * s;
  trunk.castShadow = true;

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.3 * s, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x3d8c40 })
  );
  crown.position.y = 2.8 * s;
  crown.castShadow = true;

  group.add(trunk, crown);
  group.position.set(x, 0, z);
  return group;
}

function populateEnvironment() {
  const positions = [
    [-42, -24], [-34, 22], [-18, -28], [18, 26], [36, -20],
    [42, 20], [-45, 0], [0, -30], [0, 30], [28, 0],
  ];
  positions.forEach(([x, z], i) => worldRoot.add(createTree(x, z, 0.85 + (i % 3) * 0.2)));
}
populateEnvironment();

const car = new THREE.Group();
scene.add(car);

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2.0, 0.8, 4.2),
  new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.15, roughness: 0.6 })
);
body.position.y = 0.9;
body.castShadow = true;
body.receiveShadow = true;
car.add(body);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.72, 2.0),
  new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.2, roughness: 0.45 })
);
cabin.position.set(0, 1.45, -0.1);
cabin.castShadow = true;
car.add(cabin);

const dashboard = new THREE.Mesh(
  new THREE.BoxGeometry(1.45, 0.16, 0.75),
  new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 })
);
dashboard.position.set(0, 1.58, 0.65);
car.add(dashboard);

const steeringWheel = new THREE.Group();
steeringWheel.position.set(-0.36, 1.6, 0.4);
steeringWheel.rotation.x = 1.05;

const wheelRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.26, 0.035, 12, 28),
  new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.18 })
);
const wheelHub = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16),
  new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.55, metalness: 0.25 })
);
wheelHub.rotation.x = Math.PI / 2;
steeringWheel.add(wheelRing, wheelHub);

for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
  const spoke = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.19, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.7, metalness: 0.18 })
  );
  spoke.position.set(Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0);
  spoke.rotation.z = angle;
  steeringWheel.add(spoke);
}

car.add(steeringWheel);

function createSignalLamp(x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.18, 0.16),
    new THREE.MeshStandardMaterial({
      color: 0x3a2a14,
      emissive: 0xffb74d,
      emissiveIntensity: 0.02,
      roughness: 0.42,
      metalness: 0.08,
    })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;

  const light = new THREE.PointLight(0xffb347, 0, 5.2, 2);
  light.position.copy(mesh.position);

  car.add(mesh, light);
  return { mesh, light };
}

const turnSignalLamps = {
  left: [
    createSignalLamp(0.82, 0.98, 2.12),
    createSignalLamp(0.82, 0.98, -2.12),
  ],
  right: [
    createSignalLamp(-0.82, 0.98, 2.12),
    createSignalLamp(-0.82, 0.98, -2.12),
  ],
};

function createBrakeLamp(x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.16, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x351012,
      emissive: 0xff2a2a,
      emissiveIntensity: 0.04,
      roughness: 0.42,
      metalness: 0.08,
    })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;

  const light = new THREE.PointLight(0xff3d3d, 0, 6, 2);
  light.position.copy(mesh.position);

  car.add(mesh, light);
  return { mesh, light };
}

const brakeLamps = [
  createBrakeLamp(-0.5, 0.96, -2.13),
  createBrakeLamp(0.5, 0.96, -2.13),
];

function setSignalLampState(lamp, isActive) {
  lamp.mesh.material.emissiveIntensity = isActive ? 2.2 : 0.02;
  lamp.mesh.scale.setScalar(isActive ? 1.06 : 1);
  lamp.light.intensity = isActive ? 1.4 : 0;
}

function updateTurnSignalVisuals() {
  const leftActive = state.turnSignal === 'left' && state.signalBlinkVisible;
  const rightActive = state.turnSignal === 'right' && state.signalBlinkVisible;

  turnSignalLamps.left.forEach((lamp) => setSignalLampState(lamp, leftActive));
  turnSignalLamps.right.forEach((lamp) => setSignalLampState(lamp, rightActive));
}

function updateBrakeLights(isActive) {
  brakeLamps.forEach((lamp) => {
    lamp.mesh.material.emissiveIntensity = isActive ? 2.4 : 0.04;
    lamp.mesh.scale.setScalar(isActive ? 1.04 : 1);
    lamp.light.intensity = isActive ? 1.6 : 0;
  });
}

function createWheelAssembly(x, z, steerable) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0.48, z);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 0.36, 20),
    new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.9 })
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.castShadow = true;
  pivot.add(wheel);
  car.add(pivot);

  return { pivot, wheel, steerable };
}

const wheelAssemblies = [
  createWheelAssembly(-1.05, 1.35, true),
  createWheelAssembly(1.05, 1.35, true),
  createWheelAssembly(-1.05, -1.35, false),
  createWheelAssembly(1.05, -1.35, false),
];

const arrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 2.2, 0),
  3.6,
  0x00bfff,
  0.8,
  0.5
);
car.add(arrow);

const browserControlKeys = new Set([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const keys = new Set();
const activeTouchPointers = new Map();

function activateKey(key) {
  keys.add(key);
}

function deactivateKey(key) {
  keys.delete(key);
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
}, { passive: true });

function bindMobileControls() {
  if (!mobileControlsEl) return;

  const releasePointer = (pointerId) => {
    const binding = activeTouchPointers.get(pointerId);
    if (!binding) return;
    if (binding.key) deactivateKey(binding.key);
    binding.button.classList.remove('active');
    activeTouchPointers.delete(pointerId);
  };

  mobileControlButtons.forEach((button) => {
    const holdKey = button.dataset.holdKey;
    const tapAction = button.dataset.tapAction;

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      void ensureAudioRunning();

      if (holdKey) {
        activateKey(holdKey);
        activeTouchPointers.set(event.pointerId, { key: holdKey, button });
        button.classList.add('active');
        button.setPointerCapture?.(event.pointerId);
        return;
      }

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

  window.addEventListener('blur', () => {
    activeTouchPointers.forEach((binding, pointerId) => {
      deactivateKey(binding.key);
      binding.button.classList.remove('active');
      activeTouchPointers.delete(pointerId);
    });
  });
}

const state = {
  speed: 0,
  heading: 0,
  steer: 0,
  steeringWheelAngle: 0,
  view: 'follow',
  uiCollapsed: false,
  maxSpeed: Number(maxSpeedEl.value),
  turnSignal: 'off',
  signalBlinkVisible: false,
  signalTimer: 0,
  throttleInput: 0,
  reverseInput: 0,
  autoCenterSteering: Boolean(persistedSettings?.autoCenterSteering),
  mapImageDataUrl: persistedSettings?.mapImageDataUrl || null,
  startPose: sanitizeStartPose(persistedSettings?.startPose),
  miniMapExpanded: false,
};

function setUiCollapsed(collapsed) {
  state.uiCollapsed = collapsed;
  uiEl.classList.toggle('collapsed', collapsed);
  uiToggleEl.textContent = collapsed ? '显示菜单' : '隐藏菜单';
  saveSettings();
}

function setTurnSignal(nextSignal) {
  const toggledSignal = state.turnSignal === nextSignal ? 'off' : nextSignal;
  state.turnSignal = toggledSignal;
  state.signalTimer = 0;
  state.signalBlinkVisible = toggledSignal !== 'off';
  updateSignalStatus();
  updateTurnSignalVisuals();
  playIndicatorClick(toggledSignal !== 'off');
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

function getViewPose(view) {
  const { forward, right } = getVehicleAxes();

  if (view === 'cockpit') {
    const position = car.position.clone()
      .add(new THREE.Vector3(0, 1.72, 0))
      .add(forward.clone().multiplyScalar(0.26))
      .add(right.clone().multiplyScalar(-0.34));
    const lookTarget = position.clone()
      .add(forward.clone().multiplyScalar(22))
      .add(right.clone().multiplyScalar(-0.08))
      .add(new THREE.Vector3(0, 0.2, 0));
    return { position, lookTarget };
  }

  const position = car.position.clone()
    .add(new THREE.Vector3(0, 5.5, 0))
    .add(forward.clone().multiplyScalar(-9));
  const lookTarget = car.position.clone()
    .add(new THREE.Vector3(0, 1.6, 0))
    .add(forward.clone().multiplyScalar(7));
  return { position, lookTarget };
}

function setCockpitBodyVisibility(isVisible) {
  body.visible = isVisible;
  cabin.visible = isVisible;
  dashboard.visible = isVisible;
  steeringWheel.visible = isVisible;
  arrow.visible = isVisible && state.view !== 'cockpit';
}

function setView(nextView) {
  state.view = nextView;
  const isOrbit = nextView === 'orbit';

  controls.enabled = isOrbit;
  viewModeEl.textContent = VIEW_LABELS[nextView];
  mirrorHudEl.style.display = isOrbit ? 'none' : (nextView === 'cockpit' ? 'block' : 'flex');
  mirrorHudEl.classList.toggle('cockpit-layout', nextView === 'cockpit');
  arrow.visible = !isOrbit && nextView !== 'cockpit';

  if (isOrbit) {
    setCockpitBodyVisibility(true);
    setUiCollapsed(false);
    camera.position.set(car.position.x + 20, 22, car.position.z + 20);
    controls.target.copy(car.position).add(new THREE.Vector3(0, 1.2, 0));
    controls.update();
    return;
  }

  setCockpitBodyVisibility(nextView !== 'cockpit');
  setUiCollapsed(nextView === 'cockpit');

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
}

function teleportCarTo(x, z) {
  car.position.set(x, 0, z);
  clampCarInsideMap();
  state.speed = 0;
  state.throttleInput = 0;
  state.reverseInput = 0;
  car.rotation.y = state.heading;
  updateBrakeLights(false);

  if (controls.enabled) {
    controls.target.copy(car.position).add(new THREE.Vector3(0, 1.2, 0));
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
  steeringWheel.rotation.z = 0;
  wheelHudDialEl.style.transform = 'rotate(0rad)';
  steerAngleEl.textContent = '0';

  wheelAssemblies.forEach((assembly) => {
    assembly.pivot.rotation.y = 0;
    assembly.wheel.rotation.x = 0;
  });

  if (controls.enabled) {
    controls.target.copy(car.position).add(new THREE.Vector3(0, 1.2, 0));
    controls.update();
  }

  if (state.view !== 'orbit') {
    const pose = getViewPose(state.view);
    camera.position.copy(pose.position);
    camera.lookAt(pose.lookTarget);
  }
}

function updateCar(dt) {
  const accel = 8.5;
  const brake = 16.0;
  const drag = 2.8;
  const reverseFactor = 0.45;
  const steeringWheelSpeed = 3.8;
  const steeringReturnSpeed = 3.2;
  const wheelBase = 2.8;
  const throttleRise = 3.2;
  const throttleFall = 4.6;
  const reverseRise = 2.8;
  const reverseFall = 4.2;

  const forward = keys.has('w') || keys.has('arrowup');
  const backward = keys.has('s') || keys.has('arrowdown');
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  const handbrake = keys.has(' ');
  const throttleTarget = forward ? 1 : 0;
  const reverseTarget = backward ? 1 : 0;

  state.throttleInput = THREE.MathUtils.damp(
    state.throttleInput,
    throttleTarget,
    throttleTarget > state.throttleInput ? throttleRise : throttleFall,
    dt
  );
  state.reverseInput = THREE.MathUtils.damp(
    state.reverseInput,
    reverseTarget,
    reverseTarget > state.reverseInput ? reverseRise : reverseFall,
    dt
  );

  if (state.throttleInput > 0.001) {
    const launchBoost = THREE.MathUtils.lerp(0.38, 1, Math.min(Math.abs(state.speed) / Math.max(state.maxSpeed * 0.4, MIN_DRIVE_SPEED), 1));
    state.speed += accel * Math.pow(state.throttleInput, 1.35) * launchBoost * dt;
    if (state.speed > 0 && state.speed < MIN_DRIVE_SPEED) state.speed = MIN_DRIVE_SPEED;
  }
  if (state.reverseInput > 0.001) {
    state.speed -= accel * reverseFactor * Math.pow(state.reverseInput, 1.28) * dt;
    const minReverseSpeed = MIN_DRIVE_SPEED * reverseFactor;
    if (state.speed < 0 && Math.abs(state.speed) < minReverseSpeed) state.speed = -minReverseSpeed;
  }

  if (state.throttleInput < 0.01 && state.reverseInput < 0.01) {
    const decel = drag * dt;
    if (Math.abs(state.speed) <= decel) state.speed = 0;
    else state.speed -= Math.sign(state.speed) * decel;
  }

  if (handbrake) {
    const hb = brake * dt;
    if (Math.abs(state.speed) <= hb) state.speed = 0;
    else state.speed -= Math.sign(state.speed) * hb;
  }

  updateBrakeLights(state.reverseInput > 0.05 || handbrake);

  state.maxSpeed = Number(maxSpeedEl.value);
  maxSpeedValueEl.textContent = `${state.maxSpeed} m/s`;
  state.speed = THREE.MathUtils.clamp(state.speed, -Math.max(MIN_DRIVE_SPEED * reverseFactor, state.maxSpeed * 0.45), state.maxSpeed);

  if (left) state.steeringWheelAngle += steeringWheelSpeed * dt;
  if (right) state.steeringWheelAngle -= steeringWheelSpeed * dt;
  if (state.autoCenterSteering && !left && !right) {
    state.steeringWheelAngle = THREE.MathUtils.damp(state.steeringWheelAngle, 0, steeringReturnSpeed, dt);
  }
  state.steeringWheelAngle = THREE.MathUtils.clamp(state.steeringWheelAngle, -STEERING_WHEEL_MAX, STEERING_WHEEL_MAX);
  state.steer = (state.steeringWheelAngle / STEERING_WHEEL_MAX) * MAX_STEER;

  if (Math.abs(state.speed) > 0.05 && Math.abs(state.steer) > 0.0005) {
    const turnRadius = wheelBase / Math.tan(state.steer);
    state.heading += (state.speed / turnRadius) * dt;
  }

  car.rotation.y = state.heading;
  const moveDirection = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  car.position.addScaledVector(moveDirection, state.speed * dt);
  clampCarInsideMap();

  wheelAssemblies.forEach((assembly) => {
    const steerAngle = assembly.steerable ? state.steer : 0;
    assembly.pivot.rotation.y = steerAngle;
    assembly.wheel.rotation.x -= (state.speed * dt) / 0.48;
  });

  steeringWheel.rotation.z = -state.steeringWheelAngle;
  wheelHudDialEl.style.transform = `rotate(${-state.steeringWheelAngle}rad)`;
  steerAngleEl.textContent = Math.round(THREE.MathUtils.radToDeg(-state.steeringWheelAngle)).toString();

  speedEl.textContent = (Math.abs(state.speed) * 3.6).toFixed(1);
  gearEl.textContent = state.speed > 0.2 ? 'D' : state.speed < -0.2 ? 'R' : 'N';
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
  if (state.view === 'orbit') {
    const orbitTarget = car.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    controls.target.lerp(orbitTarget, 1 - Math.pow(0.01, dt));
    controls.update();
    return;
  }

  const pose = getViewPose(state.view);
  const smooth = state.view === 'cockpit' ? 1 - Math.pow(0.0005, dt) : 1 - Math.pow(0.002, dt);
  camera.position.lerp(pose.position, smooth);
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
uiToggleEl.addEventListener('click', () => {
  setUiCollapsed(!state.uiCollapsed);
});

function updateMapWidth(widthMeters) {
  const clampedWidth = THREE.MathUtils.clamp(widthMeters, MAP_WIDTH_MIN, MAP_WIDTH_MAX);
  syncMapControls(clampedWidth);
  updateGroundGeometry(clampedWidth);
  saveSettings();
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

autoCenterSteeringEl.addEventListener('change', () => {
  state.autoCenterSteering = autoCenterSteeringEl.checked;
  saveSettings();
});

function applyMapSource(src, shouldReset = true) {
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
  img.src = src;
}

function handleMapUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') return;
    state.mapImageDataUrl = reader.result;
    applyMapSource(reader.result);
  };
  reader.readAsDataURL(file);
}

document.getElementById('mapInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) handleMapUpload(file);
});

bindMobileControls();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setAudioStatus(audioState.supported ? 'pending' : 'error', audioState.supported ? '待启用' : '不可用');
syncMapControls(persistedSettings?.mapWidth ?? groundSize.width);
syncMaxSpeedControl(persistedSettings?.maxSpeed ?? state.maxSpeed);
syncAutoCenterControl(state.autoCenterSteering);
state.maxSpeed = Number(maxSpeedEl.value);

if (state.mapImageDataUrl) applyMapSource(state.mapImageDataUrl, false);
else createDefaultGround();

resetCar();
setView('follow');
setUiCollapsed(Boolean(persistedSettings?.uiCollapsed));

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

animate();
