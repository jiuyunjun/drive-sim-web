import { buildCB400 } from './cb400-model.js';
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
const PREVIEW_OVERRIDES = {};
/* PREVIEW_OVERRIDES_END */

export function buildCar(THREE, sedanBuilder = buildCorolla, Reflector, bikeBuilder = buildCB400) {
  const car = new THREE.Group();

  /* ══════════════════════════════════════
   *  通用材质
   * ══════════════════════════════════════ */
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xfafaf5, metalness: 0.12, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.17 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dee3, metalness: 0.92, roughness: 0.16 });
  const trimBlackMat = new THREE.MeshStandardMaterial({ color: 0x14181d, metalness: 0.38, roughness: 0.58 });

  const sedanParts = sedanBuilder(THREE, car, bodyMat, chromeMat, trimBlackMat, Reflector);
  const bikeParts = bikeBuilder(THREE, car, chromeMat, Reflector);

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

