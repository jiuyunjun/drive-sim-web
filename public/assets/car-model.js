/**
 * 车模模块 — 同时供 app.js 主应用和 car-preview.html 预览页面使用
 *
 * 修改此文件后：
 *   - 主应用刷新页面即可生效
 *   - 预览页面按 R 或开启自动刷新即可看到效果
 *
 * 导出函数: buildCar(THREE) → { group, parts }
 *   group: THREE.Group（车模根节点）
 *   parts: 所有运行时需要引用的部件
 */

export function buildCar(THREE) {
  const car = new THREE.Group();

  /* ══════════════════════════════════════
   *  通用材质
   * ══════════════════════════════════════ */
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc5ccd2, metalness: 0.76, roughness: 0.28 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dee3, metalness: 0.92, roughness: 0.16 });
  const trimBlackMat = new THREE.MeshStandardMaterial({ color: 0x14181d, metalness: 0.38, roughness: 0.58 });

  const sedanParts = buildSedan(THREE, car, bodyMat, chromeMat, trimBlackMat);
  const bikeParts = buildMotorcycle(THREE, car, chromeMat);

  /* 方向箭头 */
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 2.2, 0),
    3.6, 0x00bfff, 0.8, 0.5
  );
  car.add(arrow);

  /* 自动命名（供预览页面部件列表使用） */
  car.traverse((child) => {
    if (child === car) return;
    if (!child.userData.partName) {
      child.userData.partName = child.name || child.type + '_' + child.id;
    }
  });

  return {
    group: car,
    parts: { ...sedanParts, ...bikeParts, arrow },
  };
}

/* ══════════════════════════════════════════════════════════════
 *  轿车
 * ══════════════════════════════════════════════════════════════ */
function buildSedan(THREE, car, bodyMat, chromeMat, trimBlackMat) {

  // Lower body shell
  const body = n(new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.64, 4.56), bodyMat), 'body');
  body.position.y = 0.8;
  body.castShadow = true;
  body.receiveShadow = true;
  car.add(body);

  const shoulderShell = n(new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.2, 3.44), bodyMat), 'shoulderShell');
  shoulderShell.position.set(0, 1.02, -0.04);
  shoulderShell.castShadow = true;
  car.add(shoulderShell);

  // Hood
  const hood = n(new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.12, 1.5), bodyMat), 'hood');
  hood.position.set(0, 1.18, 1.34);
  hood.rotation.x = -0.08;
  hood.castShadow = true;
  car.add(hood);

  // Trunk lid
  const trunk = n(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.96), bodyMat), 'trunk');
  trunk.position.set(0, 1.19, -1.66);
  trunk.rotation.x = 0.04;
  trunk.castShadow = true;
  car.add(trunk);

  // Front bumper
  const frontBumper = n(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.36, 0.34), bodyMat), 'frontBumper');
  frontBumper.position.set(0, 0.7, 2.2);
  frontBumper.castShadow = true;
  const frontLowerIntake = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.16, 0.12), trimBlackMat);
  frontLowerIntake.position.set(0, -0.16, 0.06);
  const fogPocketL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.08), trimBlackMat);
  fogPocketL.position.set(-0.74, -0.08, 0.04);
  const fogPocketR = fogPocketL.clone();
  fogPocketR.position.x = 0.74;
  frontBumper.add(frontLowerIntake, fogPocketL, fogPocketR);
  car.add(frontBumper);

  // Rear bumper
  const rearBumper = n(new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.32, 0.28), bodyMat), 'rearBumper');
  rearBumper.position.set(0, 0.69, -2.22);
  rearBumper.castShadow = true;
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.12, 0.1), trimBlackMat);
  rearDiffuser.position.set(0, -0.12, -0.03);
  rearBumper.add(rearDiffuser);
  car.add(rearBumper);

  // Front grille
  const grille = n(new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.22, 0.04), trimBlackMat), 'grille');
  grille.position.set(0, 0.8, 2.29);
  const upperGrille = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.11, 0.04), trimBlackMat);
  upperGrille.position.set(0, 0.17, 0);
  const chromeWingL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.04), chromeMat);
  chromeWingL.position.set(-0.27, 0.2, 0.01);
  chromeWingL.rotation.z = 0.22;
  const chromeWingR = chromeWingL.clone();
  chromeWingR.position.x = 0.27;
  chromeWingR.rotation.z = -0.22;
  const grilleBadge = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 22), chromeMat);
  grilleBadge.position.set(0, 0.17, 0.04);
  grille.add(upperGrille, chromeWingL, chromeWingR, grilleBadge);
  car.add(grille);

  /* ── Cabin ── */
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111315, metalness: 0.16, roughness: 0.44 });
  const cabin = n(new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.56, 2.16), cabinMat), 'cabin');
  cabin.position.set(0, 1.57, -0.08);
  cabin.castShadow = true;
  car.add(cabin);

  const roofPanel = n(new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 1.42), bodyMat), 'roofPanel');
  roofPanel.position.set(0, 1.9, -0.08);
  roofPanel.castShadow = true;
  car.add(roofPanel);

  // Pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
  const aPillarGeo = new THREE.BoxGeometry(0.08, 0.76, 0.1);
  const aPillarL = n(new THREE.Mesh(aPillarGeo, pillarMat), 'aPillarL');
  aPillarL.position.set(-0.76, 1.58, 0.83);
  aPillarL.rotation.z = -0.18;
  car.add(aPillarL);
  const aPillarR = n(new THREE.Mesh(aPillarGeo, pillarMat), 'aPillarR');
  aPillarR.position.set(0.76, 1.58, 0.83);
  aPillarR.rotation.z = 0.18;
  car.add(aPillarR);

  const cPillarL = n(new THREE.Mesh(aPillarGeo, pillarMat), 'cPillarL');
  cPillarL.position.set(-0.74, 1.59, -0.98);
  cPillarL.rotation.z = -0.12;
  car.add(cPillarL);
  const cPillarR = n(new THREE.Mesh(aPillarGeo, pillarMat), 'cPillarR');
  cPillarR.position.set(0.74, 1.59, -0.98);
  cPillarR.rotation.z = 0.12;
  car.add(cPillarR);

  /* ── Windows ── */
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88b6d0, metalness: 0.12, roughness: 0.08, transparent: true, opacity: 0.34,
  });

  const windshield = n(new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.7), glassMat), 'windshield');
  windshield.position.set(0, 1.57, 0.97);
  windshield.rotation.x = 0.26;
  car.add(windshield);

  const rearWindow = n(new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.54), glassMat), 'rearWindow');
  rearWindow.position.set(0, 1.59, -1.12);
  rearWindow.rotation.x = -0.33;
  rearWindow.rotation.y = Math.PI;
  car.add(rearWindow);

  const sideWindowGeo = new THREE.PlaneGeometry(1.42, 0.46);
  const sideWindowL = n(new THREE.Mesh(sideWindowGeo, glassMat), 'sideWindowL');
  sideWindowL.position.set(-0.82, 1.58, -0.08);
  sideWindowL.rotation.y = -Math.PI / 2;
  car.add(sideWindowL);
  const sideWindowR = n(new THREE.Mesh(sideWindowGeo, glassMat), 'sideWindowR');
  sideWindowR.position.set(0.82, 1.58, -0.08);
  sideWindowR.rotation.y = Math.PI / 2;
  car.add(sideWindowR);

  /* ── Headlights ── */
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfffff1, emissive: 0xffffcf, emissiveIntensity: 0.42, metalness: 0.3, roughness: 0.18,
  });
  const headlightGeo = new THREE.BoxGeometry(0.42, 0.1, 0.1);
  const headlightL = n(new THREE.Mesh(headlightGeo, headlightMat), 'headlightL');
  headlightL.position.set(-0.72, 0.93, 2.18);
  headlightL.rotation.y = -0.34;
  headlightL.rotation.z = -0.1;
  const headlightLTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), headlightMat);
  headlightLTip.position.set(-0.18, -0.02, -0.06);
  headlightLTip.rotation.y = -0.2;
  headlightL.add(headlightLTip);
  car.add(headlightL);
  const headlightR = n(new THREE.Mesh(headlightGeo, headlightMat), 'headlightR');
  headlightR.position.set(0.72, 0.93, 2.18);
  headlightR.rotation.y = 0.34;
  headlightR.rotation.z = 0.1;
  const headlightRTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), headlightMat);
  headlightRTip.position.set(0.18, -0.02, -0.06);
  headlightRTip.rotation.y = 0.2;
  headlightR.add(headlightRTip);
  car.add(headlightR);

  /* ── Tail lights ── */
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0x6f0a0a, emissive: 0xff1b1b, emissiveIntensity: 0.16, metalness: 0.24, roughness: 0.3,
  });
  const taillightGeo = new THREE.BoxGeometry(0.34, 0.12, 0.09);
  const taillightL = n(new THREE.Mesh(taillightGeo, taillightMat), 'taillightL');
  taillightL.position.set(-0.72, 0.9, -2.18);
  taillightL.rotation.y = -0.18;
  const taillightLInner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.07), taillightMat);
  taillightLInner.position.set(0.22, 0, 0.02);
  taillightL.add(taillightLInner);
  car.add(taillightL);
  const taillightR = n(new THREE.Mesh(taillightGeo, taillightMat), 'taillightR');
  taillightR.position.set(0.72, 0.9, -2.18);
  taillightR.rotation.y = 0.18;
  const taillightRInner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.07), taillightMat);
  taillightRInner.position.set(-0.22, 0, 0.02);
  taillightR.add(taillightRInner);
  car.add(taillightR);

  /* ── Side mirrors ── */
  const mirrorBodyMat = new THREE.MeshStandardMaterial({ color: 0xc5ccd2, metalness: 0.68, roughness: 0.3 });
  const mirrorGlassMat = new THREE.MeshStandardMaterial({ color: 0xaaccee, metalness: 0.8, roughness: 0.05 });
  function createSideMirror(side, name) {
    const g = n(new THREE.Group(), name);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.05), trimBlackMat);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.22), mirrorBodyMat);
    housing.position.set(side * 0.13, 0.01, 0.05);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.11), mirrorGlassMat);
    glass.position.set(side * 0.18, 0.01, 0.05);
    glass.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(arm, housing, glass);
    g.position.set(side * 1.04, 1.3, 0.75);
    car.add(g);
    return g;
  }
  const sideMirrorL = createSideMirror(-1, 'sideMirrorL');
  const sideMirrorR = createSideMirror(1, 'sideMirrorR');

  /* ── Roof rails ── */
  const roofRailGeo = new THREE.BoxGeometry(0.02, 0.02, 1.46);
  const roofRailL = n(new THREE.Mesh(roofRailGeo, chromeMat), 'roofRailL');
  roofRailL.position.set(-0.72, 1.86, -0.08);
  car.add(roofRailL);
  const roofRailR = n(new THREE.Mesh(roofRailGeo, chromeMat), 'roofRailR');
  roofRailR.position.set(0.72, 1.86, -0.08);
  car.add(roofRailR);

  /* ── Dashboard ── */
  const dashboard = n(new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.22, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.9 })
  ), 'dashboard');
  dashboard.position.set(0, 1.32, 0.65);
  car.add(dashboard);

  /* ── Instrument cluster ── */
  const instrumentCluster = n(new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.18, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x001a00, emissive: 0x003300, emissiveIntensity: 0.3, roughness: 0.6 })
  ), 'instrumentCluster');
  instrumentCluster.position.set(-0.32, 1.42, 0.32);
  instrumentCluster.rotation.x = -0.4;
  car.add(instrumentCluster);

  /* ── Center screen ── */
  const centerScreen = n(new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.24, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, emissive: 0x112244, emissiveIntensity: 0.15, roughness: 0.3 })
  ), 'centerScreen');
  centerScreen.position.set(0.1, 1.42, 0.36);
  centerScreen.rotation.x = -0.35;
  car.add(centerScreen);

  /* ── Seats ── */
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });
  function createSeat(x, name) {
    const seatGroup = n(new THREE.Group(), name);
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.52), seatMat);
    cushion.position.y = 0;
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.12), seatMat);
    backrest.position.set(0, 0.32, -0.22);
    backrest.rotation.x = -0.15;
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.08), seatMat);
    headrest.position.set(0, 0.64, -0.24);
    seatGroup.add(cushion, backrest, headrest);
    seatGroup.position.set(x, 1.08, 0.05);
    car.add(seatGroup);
    return seatGroup;
  }
  const driverSeat = createSeat(-0.38, 'driverSeat');
  const passengerSeat = createSeat(0.38, 'passengerSeat');

  /* ── Steering wheel ── */
  const steeringWheel = n(new THREE.Group(), 'steeringWheel');
  steeringWheel.position.set(-0.36, 1.38, 0.42);
  steeringWheel.rotation.x = 1.1;
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

  /* ── Wheels ── */
  function createWheelAssembly(x, z, steerable, name) {
    const pivot = n(new THREE.Group(), name);
    pivot.position.set(x, 0.48, z);
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.32, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 })
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    pivot.add(wheel);
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.34, 24),
      new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7, roughness: 0.2 })
    );
    rim.rotation.z = Math.PI / 2;
    pivot.add(rim);
    const hubCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.36, 12),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.15 })
    );
    hubCap.rotation.z = Math.PI / 2;
    pivot.add(hubCap);
    car.add(pivot);
    return { pivot, wheel, steerable };
  }

  const wheelAssemblies = [
    createWheelAssembly(-1.05, 1.35, true, 'wheelFL'),
    createWheelAssembly(1.05, 1.35, true, 'wheelFR'),
    createWheelAssembly(-1.05, -1.35, false, 'wheelRL'),
    createWheelAssembly(1.05, -1.35, false, 'wheelRR'),
  ];

  /* ── Signal lamps ── */
  function createSignalLamp(x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.16, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xffb74d, emissiveIntensity: 0.02, roughness: 0.42, metalness: 0.08 })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    const light = new THREE.PointLight(0xffb347, 0, 5.2, 2);
    light.position.copy(mesh.position);
    car.add(mesh, light);
    return { mesh, light };
  }

  const sedanSignalLamps = {
    left: [createSignalLamp(1.06, 0.98, 2.16), createSignalLamp(1.06, 0.98, -2.16)],
    right: [createSignalLamp(-1.06, 0.98, 2.16), createSignalLamp(-1.06, 0.98, -2.16)],
  };

  /* ── Brake lamps ── */
  function createBrakeLamp(x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.16, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x351012, emissive: 0xff2a2a, emissiveIntensity: 0.04, roughness: 0.42, metalness: 0.08 })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    const light = new THREE.PointLight(0xff3d3d, 0, 6, 2);
    light.position.copy(mesh.position);
    car.add(mesh, light);
    return { mesh, light };
  }

  const sedanBrakeLamps = [createBrakeLamp(-0.5, 0.96, -2.13), createBrakeLamp(0.5, 0.96, -2.13)];

  /* ── Reverse lamps ── */
  function createReverseLamp(x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xeeeeff, emissive: 0xeef6ff, emissiveIntensity: 0.02, roughness: 0.26, metalness: 0.16 })
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    const light = new THREE.PointLight(0xeef6ff, 0, 4.5, 2);
    light.position.copy(mesh.position);
    car.add(mesh, light);
    return { mesh, light };
  }

  const reverseLamps = [createReverseLamp(-0.2, 0.88, -2.16), createReverseLamp(0.2, 0.88, -2.16)];

  return {
    body, shoulderShell, hood, trunk, frontBumper, rearBumper, grille,
    cabin, roofPanel, aPillarL, aPillarR, cPillarL, cPillarR,
    windshield, rearWindow, sideWindowL, sideWindowR,
    headlightL, headlightR, taillightL, taillightR,
    sideMirrorL, sideMirrorR, roofRailL, roofRailR,
    dashboard, instrumentCluster, centerScreen,
    driverSeat, passengerSeat, steeringWheel,
    wheelAssemblies,
    sedanSignalLamps, sedanBrakeLamps, reverseLamps,
  };
}

/* ══════════════════════════════════════════════════════════════
 *  摩托车 (CB400SF style)
 * ══════════════════════════════════════════════════════════════ */
function buildMotorcycle(THREE, car, chromeMat) {
  const motorcycleRoot = n(new THREE.Group(), 'motorcycleRoot');
  car.add(motorcycleRoot);

  const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, metalness: 0.52, roughness: 0.40 });
  const bikeSilverMat = new THREE.MeshStandardMaterial({ color: 0xc9ced3, metalness: 0.78, roughness: 0.28 });
  const bikeSeatMat = new THREE.MeshStandardMaterial({ color: 0x0e0f10, roughness: 0.92, metalness: 0.04 });
  const bikeRedMat = new THREE.MeshStandardMaterial({ color: 0xa81520, metalness: 0.36, roughness: 0.34 });
  const bikeExhaustMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.88, roughness: 0.18 });

  /* --- Main frame --- */
  const bikeBackbone = n(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.40, 10), bikeFrameMat), 'bikeBackbone');
  bikeBackbone.position.set(0, 1.02, 0.10);
  bikeBackbone.rotation.x = -0.22;
  motorcycleRoot.add(bikeBackbone);

  const bikeDowntubeL = n(new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.72, 8), bikeFrameMat), 'bikeDowntubeL');
  bikeDowntubeL.position.set(-0.06, 0.78, 0.42);
  bikeDowntubeL.rotation.x = 0.48;
  const bikeDowntubeR = n(bikeDowntubeL.clone(), 'bikeDowntubeR');
  bikeDowntubeR.position.x = 0.06;
  motorcycleRoot.add(bikeDowntubeL, bikeDowntubeR);

  /* --- Tank --- */
  const bikeTank = n(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.46, 8, 16), bikeRedMat), 'bikeTank');
  bikeTank.position.set(0, 1.16, 0.38);
  bikeTank.rotation.x = -0.15;
  bikeTank.rotation.z = Math.PI / 2;
  bikeTank.scale.set(1.0, 0.92, 1.38);
  motorcycleRoot.add(bikeTank);

  const bikeTankStripe = n(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.56), chromeMat), 'bikeTankStripe');
  bikeTankStripe.position.set(0, 1.38, 0.38);
  motorcycleRoot.add(bikeTankStripe);

  /* --- Seat --- */
  const bikeSeat = n(new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.52, 6, 12), bikeSeatMat), 'bikeSeat');
  bikeSeat.position.set(0, 1.10, -0.30);
  bikeSeat.rotation.x = 0.06;
  bikeSeat.rotation.z = Math.PI / 2;
  bikeSeat.scale.set(0.7, 1.8, 1.1);
  motorcycleRoot.add(bikeSeat);

  /* --- Tail cowl --- */
  const bikeTailCowl = n(new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.46), bikeRedMat), 'bikeTailCowl');
  bikeTailCowl.position.set(0, 1.06, -0.78);
  bikeTailCowl.rotation.x = 0.22;
  motorcycleRoot.add(bikeTailCowl);

  const bikeRearFender = n(new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.50), bikeFrameMat), 'bikeRearFender');
  bikeRearFender.position.set(0, 0.66, -1.08);
  bikeRearFender.rotation.x = 0.28;
  motorcycleRoot.add(bikeRearFender);

  /* --- Engine --- */
  const bikeEngineBlock = n(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.30, 0.40), bikeSilverMat), 'bikeEngineBlock');
  bikeEngineBlock.position.set(0, 0.68, 0.08);
  motorcycleRoot.add(bikeEngineBlock);

  const bikeCylinderHead = n(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.34), bikeFrameMat), 'bikeCylinderHead');
  bikeCylinderHead.position.set(0, 0.86, 0.10);
  motorcycleRoot.add(bikeCylinderHead);

  /* --- Exhaust --- */
  const bikeExhPipe1 = n(new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.60, 8), bikeExhaustMat), 'bikeExhPipe1');
  bikeExhPipe1.position.set(0.20, 0.54, 0.10);
  bikeExhPipe1.rotation.x = Math.PI / 2;
  motorcycleRoot.add(bikeExhPipe1);

  const bikeExhPipe2 = n(new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.60, 8), bikeExhaustMat), 'bikeExhPipe2');
  bikeExhPipe2.position.set(0.22, 0.50, -0.20);
  bikeExhPipe2.rotation.x = Math.PI / 2;
  motorcycleRoot.add(bikeExhPipe2);

  const bikeExhCollector = n(new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.70, 10), bikeExhaustMat), 'bikeExhCollector');
  bikeExhCollector.position.set(0.24, 0.44, -0.68);
  bikeExhCollector.rotation.x = -0.08;
  motorcycleRoot.add(bikeExhCollector);

  const bikeMuffler = n(new THREE.Mesh(new THREE.CapsuleGeometry(0.054, 0.40, 8, 12), bikeExhaustMat), 'bikeMuffler');
  bikeMuffler.position.set(0.24, 0.46, -1.06);
  bikeMuffler.rotation.x = Math.PI / 2;
  motorcycleRoot.add(bikeMuffler);

  /* --- Front fork --- */
  const forkRake = 0.47;
  const bikeForkL = n(new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.026, 0.82, 10), chromeMat), 'bikeForkL');
  bikeForkL.position.set(-0.16, 0.88, 1.08);
  bikeForkL.rotation.x = forkRake;
  const bikeForkR = n(bikeForkL.clone(), 'bikeForkR');
  bikeForkR.position.x = 0.16;
  motorcycleRoot.add(bikeForkL, bikeForkR);

  const bikeTripleUpper = n(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.10), bikeFrameMat), 'bikeTripleUpper');
  bikeTripleUpper.position.set(0, 1.26, 1.00);
  const bikeTripleLower = n(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.08), bikeFrameMat), 'bikeTripleLower');
  bikeTripleLower.position.set(0, 0.94, 1.14);
  motorcycleRoot.add(bikeTripleUpper, bikeTripleLower);

  /* --- Front fender --- */
  const bikeFrontFender = n(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.40), bikeFrameMat), 'bikeFrontFender');
  bikeFrontFender.position.set(0, 0.72, 1.35);
  motorcycleRoot.add(bikeFrontFender);

  /* --- Handlebar --- */
  const bikeHandlebar = n(new THREE.Group(), 'bikeHandlebar');
  const bikeBar = n(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 12), chromeMat), 'bikeBar');
  bikeBar.rotation.z = Math.PI / 2;
  const bikeBarCenter = n(new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 0.06), bikeFrameMat), 'bikeBarCenter');
  bikeHandlebar.add(bikeBar, bikeBarCenter);
  bikeHandlebar.position.set(0, 1.32, 0.92);
  motorcycleRoot.add(bikeHandlebar);

  /* --- Headlight --- */
  const bikeHeadlight = n(new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xf7f4eb, emissive: 0xffffd8, emissiveIntensity: 0.38, metalness: 0.30, roughness: 0.20 })
  ), 'bikeHeadlight');
  bikeHeadlight.rotation.x = -Math.PI / 2;
  bikeHeadlight.position.set(0, 1.06, 1.30);
  motorcycleRoot.add(bikeHeadlight);

  const bikeHeadlightBucket = n(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 18), chromeMat), 'bikeHeadlightBucket');
  bikeHeadlightBucket.rotation.x = Math.PI / 2;
  bikeHeadlightBucket.position.set(0, 1.06, 1.26);
  motorcycleRoot.add(bikeHeadlightBucket);

  /* --- Meters --- */
  const meterMat = new THREE.MeshStandardMaterial({ color: 0x061015, emissive: 0x14394d, emissiveIntensity: 0.18, roughness: 0.32 });
  const bikeMeterL = n(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), meterMat), 'bikeMeterL');
  bikeMeterL.rotation.x = Math.PI / 2;
  bikeMeterL.position.set(-0.08, 1.30, 0.96);
  const bikeMeterR = n(bikeMeterL.clone(), 'bikeMeterR');
  bikeMeterR.position.x = 0.08;
  motorcycleRoot.add(bikeMeterL, bikeMeterR);

  /* --- Swingarm --- */
  const bikeSwingarmL = n(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.80), bikeFrameMat), 'bikeSwingarmL');
  bikeSwingarmL.position.set(-0.10, 0.52, -0.92);
  const bikeSwingarmR = n(bikeSwingarmL.clone(), 'bikeSwingarmR');
  bikeSwingarmR.position.x = 0.10;
  motorcycleRoot.add(bikeSwingarmL, bikeSwingarmR);

  /* --- Rear shocks --- */
  const bikeShockL = n(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 8), chromeMat), 'bikeShockL');
  bikeShockL.position.set(-0.14, 0.82, -0.72);
  bikeShockL.rotation.x = -0.16;
  const bikeShockR = n(bikeShockL.clone(), 'bikeShockR');
  bikeShockR.position.x = 0.14;
  motorcycleRoot.add(bikeShockL, bikeShockR);

  /* --- Wheels --- */
  function createBikeWheel() {
    const group = new THREE.Group();
    const orient = new THREE.Group();
    orient.rotation.z = Math.PI / 2;
    group.add(orient);
    const tire = n(new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.14, 28),
      new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.94 })
    ), 'tire');
    orient.add(tire);
    const rim = n(new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.10, 20),
      new THREE.MeshStandardMaterial({ color: 0x9ea7af, metalness: 0.82, roughness: 0.18 })
    ), 'rim');
    orient.add(rim);
    const hub = n(new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12),
      chromeMat
    ), 'hub');
    orient.add(hub);
    return { group, tire, rim, hub };
  }

  /* Front disc brake */
  const bikeFrontDisc = n(new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.012, 20),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.70, roughness: 0.30 })
  ), 'bikeFrontDisc');
  bikeFrontDisc.rotation.z = Math.PI / 2;
  bikeFrontDisc.position.set(0.07, 0, 0);

  const bikeFrontWheelPivot = n(new THREE.Group(), 'bikeFrontWheelPivot');
  bikeFrontWheelPivot.position.set(0, 0.42, 1.35);
  const bikeFrontWheelAssembly = createBikeWheel();
  bikeFrontWheelAssembly.group.add(bikeFrontDisc);
  bikeFrontWheelPivot.add(bikeFrontWheelAssembly.group);
  motorcycleRoot.add(bikeFrontWheelPivot);

  const bikeRearWheelMount = n(new THREE.Group(), 'bikeRearWheelMount');
  bikeRearWheelMount.position.set(0, 0.42, -1.35);
  const bikeRearWheelAssembly = createBikeWheel();
  bikeRearWheelMount.add(bikeRearWheelAssembly.group);
  motorcycleRoot.add(bikeRearWheelMount);

  /* --- Side stand --- */
  const bikeKickstand = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.50, 6), bikeFrameMat);
  bikeKickstand.position.set(-0.18, 0.44, -0.12);
  bikeKickstand.rotation.x = 0.10;
  bikeKickstand.rotation.z = 0.30;
  motorcycleRoot.add(bikeKickstand);

  /* --- Cockpit view parts --- */
  const bikeCockpitRoot = n(new THREE.Group(), 'bikeCockpitRoot');
  car.add(bikeCockpitRoot);
  const bikeCockpitBar = n(bikeHandlebar.clone(), 'bikeCockpitBar');
  bikeCockpitBar.position.set(0, 1.26, 0.72);
  const bikeCockpitCluster = n(new THREE.Group(), 'bikeCockpitCluster');
  const bikeCockpitMeterL = n(bikeMeterL.clone(), 'bikeCockpitMeterL');
  bikeCockpitMeterL.position.set(-0.08, 1.30, 0.66);
  const bikeCockpitMeterR = n(bikeMeterR.clone(), 'bikeCockpitMeterR');
  bikeCockpitMeterR.position.set(0.08, 1.30, 0.66);
  bikeCockpitCluster.add(bikeCockpitMeterL, bikeCockpitMeterR);
  bikeCockpitRoot.add(bikeCockpitBar, bikeCockpitCluster);

  /* --- Bike signal lamps --- */
  function createBikeSignalLamp(name, x, y, z) {
    const mesh = n(new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a2a14, emissive: 0xffb74d, emissiveIntensity: 0.02, roughness: 0.42, metalness: 0.08 })
    ), name);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    const light = new THREE.PointLight(0xffb347, 0, 3.5, 2);
    light.position.copy(mesh.position);
    motorcycleRoot.add(mesh, light);
    return { mesh, light };
  }

  const bikeSignalLamps = {
    left: [
      createBikeSignalLamp('bikeSignalFrontL', 0.18, 1.06, 1.12),
      createBikeSignalLamp('bikeSignalRearL', 0.16, 0.96, -0.92),
    ],
    right: [
      createBikeSignalLamp('bikeSignalFrontR', -0.18, 1.06, 1.12),
      createBikeSignalLamp('bikeSignalRearR', -0.16, 0.96, -0.92),
    ],
  };

  /* --- Bike brake lamp --- */
  function createBikeBrakeLamp(x, y, z) {
    const mesh = n(new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x661111, emissive: 0xff2020, emissiveIntensity: 0.04, roughness: 0.36, metalness: 0.10 })
    ), 'bikeBrakeLampMesh');
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    const light = new THREE.PointLight(0xff3d3d, 0, 4, 2);
    light.position.copy(mesh.position);
    motorcycleRoot.add(mesh, light);
    return { mesh, light };
  }

  const bikeBrakeLamp = createBikeBrakeLamp(0, 0.84, -1.22);

  return {
    motorcycleRoot, bikeCockpitRoot, bikeCockpitBar,
    bikeHandlebar,
    bikeFrontWheelPivot, bikeFrontWheelAssembly, bikeRearWheelAssembly, bikeRearWheelMount,
    bikeSignalLamps, bikeBrakeLamp,
  };
}

/* ══ 命名辅助 ══ */
function n(obj, name) {
  obj.userData.partName = name;
  obj.name = name;
  return obj;
}

