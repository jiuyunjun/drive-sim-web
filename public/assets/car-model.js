import { buildCorolla } from './corolla-model.js';
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

/* PREVIEW_OVERRIDES_START */
const PREVIEW_OVERRIDES = {
  "motorcycleRoot": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeBackbone": {
    "position": [
      0,
      1.02,
      0.1
    ],
    "rotation": [
      -0.22,
      0,
      0
    ],
    "scale": [
      1,
      -0.072,
      1
    ]
  },
  "motorcycleRoot/bikeDowntubeL": {
    "position": [
      -0.06,
      0.78,
      0.42
    ],
    "rotation": [
      0.48,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeDowntubeR": {
    "position": [
      0.06,
      0.78,
      0.42
    ],
    "rotation": [
      0.48,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeTank": {
    "position": [
      0,
      1.16,
      0.38
    ],
    "rotation": [
      -0.15,
      0,
      1.571
    ],
    "scale": [
      1,
      0.661,
      2.308
    ]
  },
  "motorcycleRoot/bikeTankStripe": {
    "position": [
      0,
      1.38,
      0.38
    ],
    "rotation": [
      -0.189,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeSeat": {
    "position": [
      0,
      1.128,
      -0.4
    ],
    "rotation": [
      0.06,
      0,
      1.571
    ],
    "scale": [
      0.7,
      0.58,
      4.349
    ]
  },
  "motorcycleRoot/bikeTailCowl": {
    "position": [
      0,
      1.06,
      -0.78
    ],
    "rotation": [
      0.22,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearFender": {
    "position": [
      0,
      0.66,
      -1.08
    ],
    "rotation": [
      0.28,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeEngineBlock": {
    "position": [
      0,
      0.68,
      0.08
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeCylinderHead": {
    "position": [
      0,
      0.86,
      0.1
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeExhPipe1": {
    "position": [
      0.2,
      0.54,
      0.1
    ],
    "rotation": [
      1.571,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeExhPipe2": {
    "position": [
      0.22,
      0.5,
      -0.2
    ],
    "rotation": [
      1.571,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeExhCollector": {
    "position": [
      0.24,
      0.44,
      -0.586
    ],
    "rotation": [
      1.627,
      0,
      0
    ],
    "scale": [
      1,
      0.684,
      1
    ]
  },
  "motorcycleRoot/bikeMuffler": {
    "position": [
      0.24,
      0.53,
      -1.092
    ],
    "rotation": [
      1.875,
      0,
      0
    ],
    "scale": [
      1.573,
      1.175,
      1.449
    ]
  },
  "motorcycleRoot/bikeForkL": {
    "position": [
      -0.16,
      0.861,
      1.206
    ],
    "rotation": [
      -0.364,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeForkR": {
    "position": [
      0.16,
      0.841,
      1.186
    ],
    "rotation": [
      -0.346,
      -0.169,
      0.005
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeTripleUpper": {
    "position": [
      0,
      1.26,
      1
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeTripleLower": {
    "position": [
      0,
      0.94,
      1.14
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontFender": {
    "position": [
      0,
      0.72,
      1.35
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeHandlebar": {
    "position": [
      0,
      1.32,
      0.92
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeHandlebar/bikeBar": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      1.571
    ],
    "scale": [
      1,
      1.645,
      1
    ]
  },
  "motorcycleRoot/bikeHandlebar/bikeBarCenter": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeHeadlight": {
    "position": [
      0,
      1.06,
      1.3
    ],
    "rotation": [
      1.586,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeHeadlightBucket": {
    "position": [
      0,
      1.06,
      1.26
    ],
    "rotation": [
      1.571,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeMeterL": {
    "position": [
      -0.08,
      1.403,
      0.96
    ],
    "rotation": [
      1.885,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeMeterR": {
    "position": [
      0.08,
      1.4,
      0.96
    ],
    "rotation": [
      1.883,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1.018
    ]
  },
  "motorcycleRoot/bikeSwingarmL": {
    "position": [
      -0.1,
      0.52,
      -0.92
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeSwingarmR": {
    "position": [
      0.1,
      0.52,
      -0.92
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeShockL": {
    "position": [
      -0.14,
      0.82,
      -0.72
    ],
    "rotation": [
      -0.16,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeShockR": {
    "position": [
      0.14,
      0.82,
      -0.72
    ],
    "rotation": [
      -0.16,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot": {
    "position": [
      0,
      0.42,
      1.35
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot/Group_302": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot/Group_302/Group_303": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      1.571
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot/Group_302/Group_303/tire": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot/Group_302/Group_303/rim": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot/Group_302/Group_303/hub": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeFrontWheelPivot/Group_302/bikeFrontDisc": {
    "position": [
      0.07,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      1.571
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearWheelMount": {
    "position": [
      0,
      0.42,
      -1.35
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearWheelMount/Group_308": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearWheelMount/Group_308/Group_309": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      1.571
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearWheelMount/Group_308/Group_309/tire": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearWheelMount/Group_308/Group_309/rim": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeRearWheelMount/Group_308/Group_309/hub": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/Mesh_313": {
    "position": [
      -0.18,
      0.44,
      -0.12
    ],
    "rotation": [
      0.1,
      0,
      0.3
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeSignalFrontL": {
    "position": [
      0.18,
      1.06,
      1.12
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/PointLight_322": {
    "position": [
      0.18,
      1.06,
      1.12
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeSignalRearL": {
    "position": [
      0.119,
      1.103,
      -1.039
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/PointLight_325": {
    "position": [
      0.16,
      0.96,
      -0.92
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeSignalFrontR": {
    "position": [
      -0.18,
      1.06,
      1.12
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/PointLight_328": {
    "position": [
      -0.18,
      1.06,
      1.12
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeSignalRearR": {
    "position": [
      -0.119,
      1.102,
      -1.045
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/PointLight_331": {
    "position": [
      -0.16,
      0.96,
      -0.92
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/bikeBrakeLampMesh": {
    "position": [
      0,
      1.105,
      -1.047
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "motorcycleRoot/PointLight_334": {
    "position": [
      0,
      0.84,
      -1.22
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot/bikeCockpitBar": {
    "position": [
      0,
      1.26,
      0.72
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot/bikeCockpitBar/bikeBar": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      1.571
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot/bikeCockpitBar/bikeBarCenter": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot/bikeCockpitCluster": {
    "position": [
      0,
      0,
      0
    ],
    "rotation": [
      0,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot/bikeCockpitCluster/bikeCockpitMeterL": {
    "position": [
      -0.08,
      1.3,
      0.66
    ],
    "rotation": [
      1.571,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  },
  "bikeCockpitRoot/bikeCockpitCluster/bikeCockpitMeterR": {
    "position": [
      0.08,
      1.3,
      0.66
    ],
    "rotation": [
      1.571,
      0,
      0
    ],
    "scale": [
      1,
      1,
      1
    ]
  }
};
/* PREVIEW_OVERRIDES_END */

export function buildCar(THREE, sedanBuilder = buildCorolla, Reflector) {
  const car = new THREE.Group();

  /* ══════════════════════════════════════
   *  通用材质
   * ══════════════════════════════════════ */
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xfafaf5, metalness: 0.12, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.17 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dee3, metalness: 0.92, roughness: 0.16 });
  const trimBlackMat = new THREE.MeshStandardMaterial({ color: 0x14181d, metalness: 0.38, roughness: 0.58 });

  const sedanParts = sedanBuilder(THREE, car, bodyMat, chromeMat, trimBlackMat, Reflector);
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
  assignPreviewKeys(car);
  applyPreviewOverrides(car, PREVIEW_OVERRIDES);

  return {
    group: car,
    parts: {
      ...sedanParts,
      ...bikeParts,
      arrow,
      vehicles: {
        sedan: {
          root: sedanParts.sedanRoot,
          parts: {
            steeringWheel: sedanParts.steeringWheel,
            wheelAssemblies: sedanParts.wheelAssemblies,
            signalLamps: sedanParts.sedanSignalLamps,
            brakeLamps: sedanParts.sedanBrakeLamps,
            reverseLamps: sedanParts.reverseLamps,
            dashboard: sedanParts.dashboard,
            instrumentCluster: sedanParts.instrumentCluster,
            centerScreen: sedanParts.centerScreen,
          },
        },
        motorcycle: {
          root: bikeParts.motorcycleRoot,
          parts: {
            handlebar: bikeParts.bikeHandlebar,
            frontWheelPivot: bikeParts.bikeFrontWheelPivot,
            rearWheelMount: bikeParts.bikeRearWheelMount,
            signalLamps: bikeParts.bikeSignalLamps,
            brakeLamp: bikeParts.bikeBrakeLamp,
            cockpitRoot: bikeParts.bikeCockpitRoot,
          },
        },
      },
    },
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

function assignPreviewKeys(root) {
  const walk = (node, parentKey) => {
    node.children.forEach((child, index) => {
      const segment = Object.prototype.hasOwnProperty.call(child.userData, 'previewPathAlias')
        ? child.userData.previewPathAlias
        : (child.userData.partName || child.name || `${child.type}:${index}`);
      const key = parentKey ? `${parentKey}/${segment}` : segment;
      child.userData.previewKey = key || parentKey;
      walk(child, key);
    });
  };
  walk(root, '');
}

function applyPreviewOverrides(root, overrides) {
  if (!overrides || typeof overrides !== 'object') return;

  root.traverse((child) => {
    if (child === root) return;
    const override = overrides[child.userData.previewKey];
    if (!override) return;
    if (override.position) child.position.set(...override.position);
    if (override.rotation) child.rotation.set(...override.rotation);
    if (override.scale) child.scale.set(...override.scale);
  });
}

