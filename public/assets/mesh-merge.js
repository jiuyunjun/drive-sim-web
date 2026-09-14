// Collapse the procedural vehicles' many small static meshes into one mesh per
// material, so each pass (main, shadow, reflections, mini map) issues a few dozen
// draw calls instead of several hundred.
//
// Every Object3D in `boundaries` is something the app moves, spins or toggles, so
// it stays a real node and starts its own merge unit: meshes are only ever merged
// with siblings that share the same nearest boundary, and the merged mesh is
// placed under that boundary. Animation and visibility therefore behave exactly
// as before.

const TEXTURE_SLOTS = ['map', 'alphaMap', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'clearcoatNormalMap'];

export function collectBoundaries(THREE, parts) {
  const found = new Set();
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (value instanceof THREE.Object3D) { found.add(value); return; }
    Object.values(value).forEach(visit);
  };
  visit(parts);
  return found;
}

export function mergeStaticMeshes(THREE, mergeGeometries, root, boundaries) {
  root.updateMatrixWorld(true);
  const isBoundary = (o) => o === root || boundaries.has(o);
  const hasBoundaryBelow = (o) => o.children.some((c) => boundaries.has(c) || hasBoundaryBelow(c));
  const defaultBeforeRender = THREE.Object3D.prototype.onBeforeRender;

  const isCandidate = (o) => o.isMesh && !isBoundary(o) && o.visible
    && o.onBeforeRender === defaultBeforeRender && !o.isInstancedMesh && !o.isSkinnedMesh
    && !Array.isArray(o.material) && !o.material.transparent
    && Object.keys(o.geometry.morphAttributes).length === 0
    && o.geometry.attributes.position && !hasBoundaryBelow(o);

  // Bucket candidates by their nearest boundary and by everything that must match
  // for one draw call to stand in for many.
  const units = new Map();
  root.traverse((o) => {
    if (!isCandidate(o)) return;
    let unit = o.parent;
    while (!isBoundary(unit)) {
      if (!unit.visible) return; // Hidden intermediate groups stay as authored.
      unit = unit.parent;
    }
    const key = [o.material.uuid, o.castShadow, o.receiveShadow, o.renderOrder, o.frustumCulled, o.layers.mask].join('|');
    if (!units.has(unit)) units.set(unit, new Map());
    const buckets = units.get(unit);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(o);
  });

  const inverse = new THREE.Matrix4();
  const relative = new THREE.Matrix4();
  let before = 0, after = 0;
  for (const [unit, buckets] of units) {
    inverse.copy(unit.matrixWorld).invert();
    for (const meshes of buckets.values()) {
      const material = meshes[0].material;
      const needsUv = TEXTURE_SLOTS.some((slot) => material[slot]);
      const required = needsUv ? ['position', 'normal', 'uv'] : ['position', 'normal'];
      const members = [], geometries = [];
      for (const mesh of meshes) {
        relative.multiplyMatrices(inverse, mesh.matrixWorld);
        // Baking a mirrored transform would flip the triangle winding.
        if (relative.determinant() < 0) continue;
        if (needsUv && !mesh.geometry.attributes.uv) continue;
        const source = mesh.geometry;
        const geometry = new THREE.BufferGeometry();
        for (const name of required) {
          if (source.attributes[name]) geometry.setAttribute(name, source.attributes[name].clone());
        }
        // Mixed indexed/non-indexed sources merge once every piece has an index.
        if (source.index) geometry.setIndex(source.index.clone());
        else geometry.setIndex([...Array(source.attributes.position.count).keys()]);
        if (!geometry.attributes.normal) geometry.computeVertexNormals();
        // Honour a partial draw range by keeping only the drawn indices.
        const { start, count } = source.drawRange;
        if (start > 0 || count !== Infinity) {
          const end = Math.min(geometry.index.count, start + count);
          geometry.setIndex(Array.from(geometry.index.array.slice(start, end)));
        }
        geometry.applyMatrix4(relative);
        geometries.push(geometry);
        members.push(mesh);
      }
      if (members.length < 2) continue;
      const merged = mergeGeometries(geometries, false);
      if (!merged) continue;

      const first = members[0];
      const combined = new THREE.Mesh(merged, material);
      combined.name = `merged:${first.name || material.name || material.type}`;
      combined.castShadow = first.castShadow;
      combined.receiveShadow = first.receiveShadow;
      combined.renderOrder = first.renderOrder;
      combined.frustumCulled = first.frustumCulled;
      combined.layers.mask = first.layers.mask;
      unit.add(combined);

      for (const mesh of members) {
        // Children that were not merged keep their world pose under the old parent.
        for (const child of [...mesh.children]) mesh.parent.attach(child);
        mesh.removeFromParent();
      }
      before += members.length;
      after += 1;
    }
  }
  root.updateMatrixWorld(true);
  return { before, after };
}
