// Procedural E210 Corolla sedan. Metres, +Z forward, right-hand-drive.
// Styling reference: Toyota 2025 Corolla brochure (exterior and interior).
// All details are local geometry/canvas textures; no remote model dependency.
export function buildCorolla(THREE, car, paint, chrome, black, Reflector) {
  const root = new THREE.Group();
  root.name = 'sedanRoot';
  root.userData.previewPathAlias = 'corolla';
  car.add(root);
  const parts = { sedanRoot: root };
  const mirrors = [];
  parts.mirrorSurfaces = mirrors;
  const mat = (color, roughness = 0.65, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const leather = mat(0x25282c, 0.88);
  const soft = mat(0x41454a, 0.96);
  const satin = mat(0x8c969f, 0.38, 0.55);
  const lens = mat(0x15232e, 0.16, 0.4);
  const led = new THREE.MeshStandardMaterial({ color: 0xf0f9ff, emissive: 0xd9eeff, emissiveIntensity: 0.8 });
  const red = new THREE.MeshStandardMaterial({ color: 0x9a121b, emissive: 0xe91d29, emissiveIntensity: 0.28, roughness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xa6c3ce, roughness: 0.12, metalness: 0.12, transparent: true, opacity: 0.19, depthWrite: false, side: THREE.DoubleSide });
  const name = (obj, label) => { obj.name = label; obj.userData.partName = label; return obj; };
  const group = (label, parent = root) => { const g = name(new THREE.Group(), label); parent.add(g); return g; };
  const part = label => (parts[label] = group(label));
  // Bevelled solids replace the old sharp boxes, without an extra library.
  function rounded(w, h, d, r = 0.025) {
    r = Math.min(r, w / 3, h / 3, d / 3);
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2 + r);
    s.lineTo(w / 2 - r, -h / 2 + r); s.lineTo(w / 2 - r, h / 2 - r);
    s.lineTo(-w / 2 + r, h / 2 - r); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: r, bevelThickness: r });
    geo.translate(0, 0, -d / 2 + r);
    return geo;
  }
  function mesh(parent, label, geo, material, x = 0, y = 0, z = 0) {
    // Stable unique sibling names keep preview edits from moving every slat/spoke.
    const siblings = parent.children.filter(child => child.name === label || child.name.startsWith(`${label}:`)).length;
    const m = name(new THREE.Mesh(geo, material), siblings ? `${label}:${siblings + 1}` : label);
    m.position.set(x, y, z); m.castShadow = !material.transparent; m.receiveShadow = true;
    parent.add(m); return m;
  }
  const box = (p, label, w, h, d, material, x = 0, y = 0, z = 0, r = 0.025) => mesh(p, label, rounded(w, h, d, r), material, x, y, z);
  // Rounded cross-sections produce tapered sheet metal and bumper corners.
  function loft(p, label, sections, material) {
    const vertices = [], indices = [], steps = 32;
    for (const [z, halfWidth, bottom, top] of sections) {
      for (let i = 0; i < steps; i++) {
        const a = i / steps * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        vertices.push(Math.sign(c) * Math.pow(Math.abs(c), 0.42) * halfWidth,
          (top + bottom) / 2 + Math.sign(s) * Math.pow(Math.abs(s), 0.42) * (top - bottom) / 2, z);
      }
    }
    for (let j = 0; j < sections.length - 1; j++) for (let i = 0; i < steps; i++) {
      const a = j * steps + i, b = j * steps + (i + 1) % steps;
      indices.push(a, b, b + steps, a, b + steps, a + steps);
    }
    for (let i = 1; i < steps - 1; i++) {
      indices.push(0, i + 1, i);
      const last = (sections.length - 1) * steps;
      indices.push(last, last + i, last + i + 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices); geo.computeVertexNormals(); return mesh(p, label, geo, material);
  }
  function line(p, label, points, material, radius = 0.008) {
    const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)));
    return mesh(p, label, new THREE.TubeGeometry(curve, Math.max(8, points.length * 5), radius, 5, false), material);
  }
  function panel(p, label, points, material) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    return mesh(p, label, geo, material);
  }
  function badge(p, x, y, z, size = 0.06) {
    const b = group('toyotaEmblem', p); b.position.set(x, y, z);
    for (const [sx, sy, dy] of [[1.45, 1, 0], [0.48, 0.94, 0], [1.12, 0.4, 0.35]]) {
      const ring = mesh(b, 'ellipse', new THREE.TorusGeometry(size, size * 0.095, 6, 32), chrome, 0, size * dy, 0);
      ring.scale.set(sx, sy, 1);
    }
    return b;
  }
  function mirrorFace(parent, label, w, h, position, rearDirection) {
    const mount = group(label, parent);
    mount.position.set(...position);
    // The surface normal bisects the directions toward the seated eye and road.
    const eyeDirection = new THREE.Vector3(-0.36, 1.245, -0.38).sub(mount.position).normalize();
    const normal = eyeDirection.add(new THREE.Vector3(...rearDirection).normalize()).normalize();
    // Keep the mirror's vertical axis upright even when its normal faces -Z.
    mount.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(normal, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)));
    box(mount, 'mirrorFrame', w + 0.022, h + 0.022, 0.024, black, 0, 0, -0.015, 0.006);
    const geometry = new THREE.PlaneGeometry(w, h);
    const surface = name(Reflector
      ? new Reflector(geometry, { color: 0xb6b6b6, textureWidth: 512, textureHeight: 512, clipBias: 0.001, multisample: 0 })
      : new THREE.Mesh(geometry, mat(0xa1b4c2, 0.08, 0.85)), 'reflectiveGlass');
    mount.add(surface);
    mirrors.push(surface);
    if (Reflector) {
      const renderReflection = surface.onBeforeRender;
      surface.onBeforeRender = function(renderer, scene, camera) {
        if (camera.userData.skipCarMirrors) return;
        // Suppress mirror-in-mirror passes and preserve the caller's viewport.
        const visibility = mirrors.map(m => m.visible);
        const viewport = renderer.getViewport(new THREE.Vector4());
        const scissor = renderer.getScissor(new THREE.Vector4());
        const scissorTest = renderer.getScissorTest();
        mirrors.forEach(m => { if (m !== surface) m.visible = false; });
        renderer.setScissorTest(false);
        try { renderReflection.call(this, renderer, scene, camera); }
        finally {
          mirrors.forEach((m, i) => { m.visible = visibility[i]; });
          renderer.setViewport(viewport); renderer.setScissor(scissor); renderer.setScissorTest(scissorTest);
        }
      };
    }
    return mount;
  }

  const body = part('body');
  // Open wheel arches are cut into the actual sill silhouette, not painted on.
  const sideShape = new THREE.Shape();
  sideShape.moveTo(-2.26, 0.3); sideShape.lineTo(-2.26, 0.76);
  sideShape.quadraticCurveTo(-2.15, 0.94, -1.6, 0.97);
  sideShape.lineTo(0.95, 0.94); sideShape.quadraticCurveTo(1.95, 0.94, 2.24, 0.78);
  sideShape.lineTo(2.24, 0.3); sideShape.lineTo(1.72, 0.3);
  sideShape.absarc(1.35, 0.315, 0.371, 0, Math.PI, false);
  sideShape.lineTo(-0.979, 0.3);
  sideShape.absarc(-1.35, 0.315, 0.371, 0, Math.PI, false);
  sideShape.closePath();
  const sideGeo = new THREE.ExtrudeGeometry(sideShape, { depth: 0.055, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.018, bevelThickness: 0.018, curveSegments: 32 });
  const sideVertices = sideGeo.attributes.position;
  for (let i = 0; i < sideVertices.count; i++) {
    const z = sideVertices.getX(i), y = sideVertices.getY(i);
    const shoulderInset = Math.max(0, y - 0.77) * 0.24;
    const endInset = Math.pow(Math.min(Math.abs(z) / 2.3, 1), 5) * 0.048;
    sideVertices.setZ(i, sideVertices.getZ(i) - shoulderInset - endInset);
  }
  sideGeo.computeVertexNormals();
  for (const side of [-1, 1]) {
    const skin = mesh(body, `sideSkin${side}`, sideGeo, paint, side * 0.825);
    skin.rotation.y = side * Math.PI / 2;
    // Both skins share the same front/rear silhouette.
    if (side === 1) skin.scale.x = -1;
    for (const z of [-1.35, 1.35]) {
      const arc = [];
      for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI; arc.push([side * 0.885, 0.315 + Math.sin(a) * 0.382, z + Math.cos(a) * 0.382]); }
      line(body, 'fenderLip', arc, paint, 0.018);
    }
    line(body, 'shoulderCrease', [[side * 0.86, 0.81, -2.04], [side * 0.898, 0.88, -0.9], [side * 0.898, 0.87, 0.7], [side * 0.855, 0.8, 1.98]], satin, 0.003);
    for (const z of [-0.48, 0.67]) {
      line(body, 'doorShutline', [[side * 0.898, 0.93, z], [side * 0.899, 0.63, z - 0.02], [side * 0.88, 0.36, z - 0.07]], black, 0.0035);
      box(body, 'doorHandle', 0.026, 0.032, 0.15, paint, side * 0.912, 0.84, z - 0.19, 0.01);
    }
    box(body, 'rocker', 0.07, 0.08, 1.9, paint, side * 0.85, 0.3, 0);
  }
  box(body, 'underbody', 1.55, 0.08, 3.65, black, 0, 0.24, 0);
  const shoulderShell = part('shoulderShell');
  for (const side of [-1, 1]) box(shoulderShell, 'beltLine', 0.12, 0.09, 2.5, paint, side * 0.81, 0.94, -0.2);
  const hood = part('hood');
  loft(hood, 'bonnet', [[0.94, 0.785, 0.943, 1.012], [1.15, 0.817, 0.929, 1.0], [1.75, 0.822, 0.884, 0.965], [2.1, 0.785, 0.859, 0.932], [2.23, 0.71, 0.85, 0.912]], paint);
  for (const side of [-1, 1]) line(hood, 'bonnetCrease', [[side * 0.57, 1.01, 0.99], [side * 0.49, 0.981, 1.6], [side * 0.38, 0.945, 2.15]], paint, 0.009);
  const trunk = part('trunk');
  loft(trunk, 'bootLid', [[-2.275, 0.74, 0.902, 0.958], [-2.16, 0.835, 0.905, 0.99], [-1.85, 0.85, 0.916, 1.004], [-1.51, 0.79, 0.925, 1.015]], paint);
  box(trunk, 'bootFace', 1.64, 0.24, 0.07, paint, 0, 0.8, -2.255);
  badge(trunk, 0, 0.86, -2.299, 0.039);
  const frontBumper = part('frontBumper');
  loft(frontBumper, 'bumper', [[1.98, 0.848, 0.3, 0.823], [2.15, 0.875, 0.295, 0.846], [2.25, 0.834, 0.31, 0.854], [2.318, 0.753, 0.34, 0.848]], paint);
  const rearBumper = part('rearBumper');
  loft(rearBumper, 'bumper', [[-2.323, 0.746, 0.345, 0.636], [-2.28, 0.836, 0.32, 0.655], [-2.16, 0.873, 0.31, 0.665], [-2.02, 0.846, 0.32, 0.66]], paint);
  box(rearBumper, 'lowerValance', 1.36, 0.105, 0.03, black, 0, 0.335, -2.321);
  for (const s of [-1, 1]) box(rearBumper, 'reflector', 0.19, 0.033, 0.016, red, s * 0.66, 0.48, -2.327);
  const grille = part('grille');
  const intake = new THREE.Shape();
  intake.moveTo(-0.52, 0.735); intake.lineTo(0.52, 0.735); intake.lineTo(0.715, 0.385); intake.quadraticCurveTo(0, 0.315, -0.715, 0.385); intake.closePath();
  mesh(grille, 'trapezoidIntake', new THREE.ShapeGeometry(intake), black, 0, 0, 2.323);
  for (let i = 0; i < 7; i++) {
    const y = 0.39 + i * 0.046, half = 0.70 - i * 0.026;
    box(grille, 'grilleSlat', half * 2, 0.012, 0.014, mat(0x343b40, 0.45, 0.15), 0, y, 2.331, 0.003);
  }
  box(grille, 'upperIntake', 1.26, 0.063, 0.035, black, 0, 0.825, 2.276);
  line(grille, 'chromeWing', [[-0.71, 0.87, 2.273], [-0.36, 0.847, 2.308], [0, 0.848, 2.319], [0.36, 0.847, 2.308], [0.71, 0.87, 2.273]], chrome, 0.01);
  badge(grille, 0, 0.862, 2.343, 0.041);

  const cabin = part('cabin');
  const roofPanel = part('roofPanel');
  box(roofPanel, 'roof', 1.39, 0.075, 1.14, paint, 0, 1.435, -0.23, 0.024);
  box(roofPanel, 'headliner', 1.32, 0.021, 1.11, soft, 0, 1.388, -0.23, 0.006);
  // Four sloping pillars and trapezoid glazing form a hollow cabin.
  for (const [label, side, back] of [['aPillarL', -1, false], ['aPillarR', 1, false], ['cPillarL', -1, true], ['cPillarR', 1, true]]) {
    const p = part(label);
    line(p, 'paintedPillar', [[side * 0.81, 0.97, back ? -1.57 : 1.0], [side * 0.735, 1.2, back ? -1.19 : 0.65], [side * 0.66, 1.435, back ? -0.8 : 0.31]], paint, back ? 0.065 : 0.031);
    line(p, 'pillarLining', [[side * 0.779, 0.978, back ? -1.54 : 0.99], [side * 0.705, 1.2, back ? -1.18 : 0.64], [side * 0.637, 1.418, back ? -0.79 : 0.3]], soft, back ? 0.033 : 0.019);
  }
  const windshield = part('windshield');
  panel(windshield, 'glass', [[-0.78, 0.99, 1.0], [0.78, 0.99, 1.0], [0.65, 1.413, 0.32], [-0.65, 1.413, 0.32]], glass);
  const rearWindow = part('rearWindow');
  panel(rearWindow, 'glass', [[0.76, 1.005, -1.53], [-0.76, 1.005, -1.53], [-0.64, 1.415, -0.79], [0.64, 1.415, -0.79]], glass);
  for (const [label, side] of [['sideWindowL', -1], ['sideWindowR', 1]]) {
    const p = part(label);
    panel(p, 'glass', [[side * 0.816, 0.986, 0.97], [side * 0.816, 0.986, -1.5], [side * 0.665, 1.412, -0.78], [side * 0.665, 1.412, 0.30]], glass);
    line(cabin, 'bPillar', [[side * 0.814, 0.97, -0.37], [side * 0.667, 1.413, -0.37]], black, 0.033);
    line(cabin, 'windowSurround', [[side * 0.816, 0.975, 0.98], [side * 0.664, 1.422, 0.30], [side * 0.666, 1.426, -0.77], [side * 0.816, 0.981, -1.5]], black, 0.009);
  }
  for (const [label, side] of [['roofRailL', -1], ['roofRailR', 1]]) {
    const p = part(label);
    line(p, 'roofSeam', [[side * 0.65, 1.465, 0.25], [side * 0.66, 1.475, -0.24], [side * 0.65, 1.465, -0.74]], black, 0.003);
  }
  const antenna = mesh(roofPanel, 'sharkFin', new THREE.ConeGeometry(0.042, 0.09, 4), paint, 0, 1.508, -0.66); antenna.scale.z = 1.7;
  for (const [label, side] of [['headlightL', -1], ['headlightR', 1]]) {
    const p = part(label); p.position.set(side * 0.653, 0.848, 2.197); p.rotation.y = side * 0.16;
    box(p, 'smokedHousing', 0.43, 0.108, 0.13, lens, 0, 0, 0, 0.028);
    for (const x of [-0.1, 0.025]) mesh(p, 'projector', new THREE.CylinderGeometry(0.027, 0.027, 0.012, 20), led, x, 0.01, 0.072).rotation.x = Math.PI / 2;
    line(p, 'ledSignature', [[-0.192, 0.027, 0.073], [-0.13, -0.03, 0.073], [0.14, -0.03, 0.073], [0.193, 0.021, 0.073]], led, 0.008);
  }
  for (const [label, side] of [['taillightL', -1], ['taillightR', 1]]) {
    const p = part(label); p.position.set(side * 0.622, 0.835, -2.278);
    box(p, 'redHousing', 0.43, 0.104, 0.061, red, 0, 0, 0, 0.02);
    line(p, 'lightSignature', [[-0.19, 0.03, -0.04], [0.19, 0.03, -0.04], [0.13, -0.032, -0.04], [-0.17, -0.032, -0.04]], red, 0.012);
  }
  for (const [label, side] of [['sideMirrorL', -1], ['sideMirrorR', 1]]) {
    const p = part(label);
    box(p, 'mirrorStalk', 0.17, 0.032, 0.054, black, side * 0.866, 1.027, 0.72);
    const face = mirrorFace(p, 'sideMirrorFace', 0.15, 0.061, [side * 0.97, 1.064, 0.582], [side * 0.15, -0.05, -1]);
    box(face, 'mirrorCap', 0.19, 0.10, 0.19, paint, 0, 0, -0.12, 0.027);
  }

  const dashboard = part('dashboard');
  // A sealed passenger compartment stays visible even when the driver seat is hidden.
  box(dashboard, 'cabinFloor', 1.58, 0.08, 2.58, leather, 0, 0.335, -0.28);
  box(dashboard, 'firewall', 1.55, 0.56, 0.09, leather, 0, 0.615, 0.90);
  for (const side of [-1, 1]) {
    box(dashboard, 'lowerDoorLining', 0.075, 0.23, 2.15, leather, side * 0.766, 0.46, -0.13);
    box(dashboard, 'carpetMat', 0.53, 0.018, 0.80, black, side * 0.39, 0.383, 0.10, 0.004);
  }
  box(dashboard, 'mirrorStem', 0.025, 0.09, 0.035, black, 0.03, 1.354, 0.405, 0.007);
  mirrorFace(dashboard, 'centerMirror', 0.245, 0.083, [0.03, 1.287, 0.39], [0, -0.02, -1]);
  box(dashboard, 'softDashTop', 1.56, 0.13, 0.56, leather, 0, 0.915, 0.69, 0.035);
  box(dashboard, 'lowerDash', 1.51, 0.17, 0.26, soft, 0, 0.797, 0.60, 0.034);
  line(dashboard, 'satinDashAccent', [[-0.74, 0.86, 0.408], [-0.43, 0.863, 0.399], [0, 0.862, 0.397], [0.46, 0.864, 0.398], [0.74, 0.885, 0.414]], satin, 0.007);
  for (const x of [-0.665, -0.11, 0.115, 0.665]) {
    box(dashboard, 'ventFrame', 0.16, 0.062, 0.021, satin, x, 0.875, 0.386, 0.005);
    box(dashboard, 'ventRecess', 0.143, 0.047, 0.013, black, x, 0.875, 0.372, 0.004);
    for (let i = -1; i <= 1; i++) box(dashboard, 'ventSlat', 0.13, 0.003, 0.009, soft, x, 0.875 + i * 0.013, 0.362, 0.0008);
  }
  box(dashboard, 'climatePanel', 0.38, 0.073, 0.038, black, 0.015, 0.761, 0.432, 0.01);
  for (const x of [-0.135, 0.16]) {
    const knob = mesh(dashboard, 'climateKnob', new THREE.CylinderGeometry(0.026, 0.026, 0.018, 24), satin, x, 0.761, 0.407); knob.rotation.x = Math.PI / 2;
  }
  box(dashboard, 'centerTunnel', 0.25, 0.17, 0.95, leather, 0.015, 0.5, -0.04);
  box(dashboard, 'shiftSurround', 0.19, 0.017, 0.28, satin, 0.015, 0.596, 0.18, 0.005);
  box(dashboard, 'shiftBoot', 0.11, 0.07, 0.14, black, 0.015, 0.634, 0.18);
  box(dashboard, 'gearSelector', 0.065, 0.10, 0.07, leather, 0.015, 0.704, 0.18);
  for (const z of [-0.1, -0.28]) {
    mesh(dashboard, 'cupWell', new THREE.CylinderGeometry(0.057, 0.047, 0.012, 24), black, 0.015, 0.59, z);
    mesh(dashboard, 'cupRim', new THREE.TorusGeometry(0.057, 0.004, 6, 24), satin, 0.015, 0.597, z).rotation.x = Math.PI / 2;
  }
  box(dashboard, 'armrest', 0.25, 0.085, 0.28, leather, 0.015, 0.64, -0.51);
  for (const side of [-1, 1]) {
    box(dashboard, 'doorCard', 0.047, 0.42, 1.3, leather, side * 0.79, 0.74, -0.03);
    box(dashboard, 'doorArmrest', 0.10, 0.048, 0.57, soft, side * 0.738, 0.72, 0.07);
    line(dashboard, 'doorTrim', [[side * 0.757, 0.875, 0.5], [side * 0.757, 0.857, 0.1], [side * 0.757, 0.8, -0.5]], satin, 0.006);
    box(dashboard, 'doorPull', 0.014, 0.029, 0.12, chrome, side * 0.755, 0.84, 0.28, 0.004);
  }
  // Steering ring lies in XY; animation rotates local Z around its real column.
  const steeringWheel = part('steeringWheel');
  steeringWheel.position.set(-0.36, 0.971, 0.16); steeringWheel.rotation.x = -0.22;
  mesh(steeringWheel, 'leatherRim', new THREE.TorusGeometry(0.174, 0.019, 12, 64), leather);
  box(steeringWheel, 'airbag', 0.137, 0.105, 0.055, leather, 0, -0.005, 0, 0.016);
  for (const side of [-1, 1]) {
    box(steeringWheel, 'horizontalSpoke', 0.11, 0.046, 0.028, leather, side * 0.112, -0.008, 0);
    box(steeringWheel, 'spokeTrim', 0.081, 0.009, 0.014, satin, side * 0.113, -0.031, -0.018, 0.002);
    for (let j = 0; j < 3; j++) box(steeringWheel, 'controlButton', 0.014, 0.011, 0.006, satin, side * (0.084 + j * 0.025), 0.002, -0.019, 0.001);
  }
  box(steeringWheel, 'lowerSpoke', 0.05, 0.098, 0.025, satin, 0, -0.116, 0);
  badge(steeringWheel, 0, 0.009, -0.035, 0.021);
  for (const side of [-1, 1]) box(dashboard, 'columnStalk', 0.15, 0.019, 0.025, black, -0.36 + side * 0.14, 0.971, 0.24, 0.006);

  function display(parent, label, width, height, draw, pixels = [768, 320]) {
    const canvas = document.createElement('canvas'); canvas.width = pixels[0]; canvas.height = pixels[1];
    const ctx = canvas.getContext('2d'); draw(ctx, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const screen = mesh(parent, label, new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    screen.rotation.y = Math.PI; screen.castShadow = false;
    return { ctx, texture, screen };
  }
  const instrumentCluster = part('instrumentCluster'); instrumentCluster.position.set(-0.36, 0.973, 0.399); instrumentCluster.rotation.x = -0.15;
  box(instrumentCluster, 'clusterHousing', 0.47, 0.17, 0.066, black, 0, 0, 0.027, 0.02);
  box(instrumentCluster, 'clusterHood', 0.49, 0.023, 0.13, leather, 0, 0.083, 0.014, 0.007);
  let speed = 0, rpm = 0.18, gear = 'N', signal = 'off';
  function drawCluster(ctx, w, h) {
    ctx.fillStyle = '#071017'; ctx.fillRect(0, 0, w, h);
    const dial = (x, value, maximum, label) => {
      ctx.strokeStyle = '#304652'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, 163, 116, 0.75 * Math.PI, 2.25 * Math.PI); ctx.stroke();
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (0.75 + 1.5 * i / 12);
        ctx.strokeStyle = i > 10 ? '#ff655b' : '#d0dee7'; ctx.lineWidth = i % 2 ? 2 : 4;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 96, 163 + Math.sin(a) * 96); ctx.lineTo(x + Math.cos(a) * 110, 163 + Math.sin(a) * 110); ctx.stroke();
        if (!(i % 2)) { ctx.fillStyle = '#c6d5df'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(Math.round(i / 12 * maximum)), x + Math.cos(a) * 79, 169 + Math.sin(a) * 79); }
      }
      const a = Math.PI * (0.75 + 1.5 * Math.min(value / maximum, 1));
      ctx.strokeStyle = '#f65b4f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 163); ctx.lineTo(x + Math.cos(a) * 89, 163 + Math.sin(a) * 89); ctx.stroke();
      ctx.fillStyle = '#c3d4df'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, 240);
    };
    dial(151, rpm * 8, 8, '×1000'); dial(617, speed, 240, 'km/h');
    ctx.textAlign = 'center'; ctx.fillStyle = '#f2f7fa'; ctx.font = '64px sans-serif'; ctx.fillText(String(speed), 384, 150);
    ctx.font = '20px sans-serif'; ctx.fillStyle = '#9dafbd'; ctx.fillText('km/h', 384, 182);
    ctx.fillStyle = '#f2f7fa'; ctx.font = '32px sans-serif'; ctx.fillText(gear, 384, 246);
    ctx.fillStyle = '#56da9c'; ctx.font = '26px sans-serif';
    if (signal === 'left') ctx.fillText('◀', 304, 48);
    if (signal === 'right') ctx.fillText('▶', 464, 48);
  }
  const clusterDisplay = display(instrumentCluster, 'liveGauges', 0.43, 0.139, drawCluster);
  clusterDisplay.screen.position.z = -0.009;
  let previous = '';
  parts.updateCockpit = (speedMs, rpmRatio, currentGear, currentSignal) => {
    speed = Math.round(Math.abs(speedMs) * 3.6); rpm = Math.round(rpmRatio * 40) / 40; gear = currentGear; signal = currentSignal;
    const key = `${speed}/${rpm}/${gear}/${signal}`;
    if (key === previous) return; previous = key;
    drawCluster(clusterDisplay.ctx, 768, 320); clusterDisplay.texture.needsUpdate = true;
  };
  const centerScreen = part('centerScreen'); centerScreen.position.set(0.055, 1.04, 0.438); centerScreen.rotation.x = -0.1;
  box(centerScreen, 'tabletBezel', 0.33, 0.206, 0.028, black, 0, 0, 0.015, 0.009);
  const mapDisplay = display(centerScreen, 'mapDisplay', 0.305, 0.177, (ctx, w, h) => {
    ctx.fillStyle = '#172632'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#344b58'; ctx.lineWidth = 10;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(i * 140 - 90, 0); ctx.lineTo(i * 140 + 20, h); ctx.stroke(); }
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * 90 + 15); ctx.lineTo(w, i * 90 - 50); ctx.stroke(); }
    ctx.strokeStyle = '#52b9ee'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(380, 310); ctx.lineTo(360, 180); ctx.lineTo(570, 155); ctx.lineTo(550, 40); ctx.stroke();
    ctx.fillStyle = '#e6f5ff'; ctx.beginPath(); ctx.moveTo(358, 181); ctx.lineTo(339, 215); ctx.lineTo(378, 207); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0c151e'; ctx.fillRect(0, 0, 95, h); ctx.font = '32px sans-serif'; ctx.fillStyle = '#a8c9dd'; ctx.fillText('⌂', 28, 65); ctx.fillText('♪', 29, 156); ctx.fillText('⚙', 26, 255);
  });
  mapDisplay.screen.position.z = -0.001;
  for (const [label, x] of [['driverSeat', -0.37], ['passengerSeat', 0.37]]) {
    const p = part(label); p.position.set(x, 0.55, -0.4);
    box(p, 'cushion', 0.47, 0.13, 0.5, leather);
    box(p, 'fabricInsert', 0.29, 0.025, 0.40, soft, 0, 0.076, 0.02, 0.007);
    box(p, 'seatBack', 0.46, 0.50, 0.13, leather, 0, 0.27, -0.24).rotation.x = -0.14;
    box(p, 'backInsert', 0.30, 0.37, 0.034, soft, 0, 0.28, -0.158).rotation.x = -0.14;
    for (const sx of [-0.08, 0.08]) box(p, 'headrestPost', 0.011, 0.10, 0.012, chrome, sx, 0.565, -0.27, 0.002);
    box(p, 'headrest', 0.25, 0.15, 0.10, leather, 0, 0.65, -0.27);
  }
  box(cabin, 'rearBench', 1.36, 0.15, 0.45, leather, 0, 0.56, -1.09);
  box(cabin, 'rearSeatBack', 1.35, 0.42, 0.12, leather, 0, 0.8, -1.34);
  parts.wheelAssemblies = [];
  const tire = mat(0x16191b, 0.93);
  const rimDark = mat(0x313840, 0.32, 0.65);
  for (const [label, x, z, steerable] of [['wheelFL', -0.79, 1.35, true], ['wheelFR', 0.79, 1.35, true], ['wheelRL', -0.79, -1.35, false], ['wheelRR', 0.79, -1.35, false]]) {
    const pivot = group(label); pivot.position.set(x, 0.315, z);
    const wheel = group('rollingAssembly', pivot);
    mesh(wheel, 'tire', new THREE.CylinderGeometry(0.315, 0.315, 0.205, 48), tire).rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) {
      const face = group(`rimFace${side}`, wheel); face.position.x = side * 0.108; face.rotation.y = side * Math.PI / 2;
      mesh(face, 'rimBarrel', new THREE.CylinderGeometry(0.224, 0.224, 0.013, 48), rimDark).rotation.x = Math.PI / 2;
      mesh(face, 'machinedLip', new THREE.TorusGeometry(0.224, 0.01, 8, 48), satin, 0, 0, 0.01);
      mesh(face, 'brakeDisc', new THREE.CircleGeometry(0.171, 32), satin, 0, 0, 0.009);
      for (let j = 0; j < 5; j++) for (const offset of [-0.11, 0.11]) {
        const a = j * Math.PI * 2 / 5 + offset;
        const spoke = box(face, 'splitSpoke', 0.024, 0.18, 0.017, chrome, Math.sin(a) * 0.127, Math.cos(a) * 0.127, 0.025, 0.004); spoke.rotation.z = -a;
      }
      mesh(face, 'hub', new THREE.CylinderGeometry(0.052, 0.052, 0.03, 20), satin, 0, 0, 0.026).rotation.x = Math.PI / 2;
      for (let j = 0; j < 5; j++) { const a = j * Math.PI * 2 / 5; mesh(face, 'lug', new THREE.SphereGeometry(0.007, 6, 4), black, Math.cos(a) * 0.038, Math.sin(a) * 0.038, 0.045); }
    }
    parts.wheelAssemblies.push({ pivot, wheel, steerable, radius: 0.315 });
  }
  function lamp(label, x, y, z, color, w, h) {
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.02, roughness: 0.25 });
    const m = box(root, label, w, h, 0.018, material, x, y, z, 0.005);
    const light = new THREE.PointLight(color, 0, 5, 2); light.position.copy(m.position); root.add(light);
    return { mesh: m, light };
  }
  // +X is the vehicle's left when facing +Z (same convention as app signals).
  parts.sedanSignalLamps = {
    left: [lamp('frontSignalL', 0.795, 0.862, 2.247, 0xffaa31, 0.073, 0.024), lamp('rearSignalL', 0.754, 0.813, -2.319, 0xffaa31, 0.13, 0.022)],
    right: [lamp('frontSignalR', -0.795, 0.862, 2.247, 0xffaa31, 0.073, 0.024), lamp('rearSignalR', -0.754, 0.813, -2.319, 0xffaa31, 0.13, 0.022)],
  };
  parts.sedanBrakeLamps = [-1, 1].map(s => lamp(`brake${s}`, s * 0.59, 0.86, -2.32, 0xff2635, 0.28, 0.025));
  parts.reverseLamps = [-1, 1].map(s => lamp(`reverse${s}`, s * 0.43, 0.807, -2.32, 0xeef5ff, 0.08, 0.022));
  return parts;
}
