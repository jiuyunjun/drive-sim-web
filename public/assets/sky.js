// Procedural sky: gradient, sun glow and drifting clouds in one draw call.
// The same shader, minus the sun disc, is baked once into an environment map so
// paint, chrome and glass have something real to reflect.

const VERTEX = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  // The top-down mini map has no horizon to show.
  if (isOrthographic) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  // Rotate with the camera but never translate, and pin depth to the far plane,
  // so one unit cube works for every camera (main view, mirrors, reflections).
  vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  gl_Position = clip.xyww;
}`;

const FRAGMENT = /* glsl */`
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform float uTime;
uniform float uEnv;
varying vec3 vDir;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float sum = 0.0, amp = 0.5;
  for (int i = 0; i < CLOUD_OCTAVES; i++) {
    sum += amp * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec3 dir = normalize(vDir);
  float h = dir.y;
  float toSun = max(dot(dir, uSunDir), 0.0);

  vec3 col = mix(uZenith, uHorizon, pow(1.0 - clamp(h, 0.0, 1.0), 3.0));
  // Aureole: broad haze glow plus a tight halo round the sun.
  col += uSunColor * (0.10 * pow(toSun, 6.0) + 0.35 * pow(toSun, 90.0));

  if (h > 0.0) {
    // Project onto a flat cloud layer; the offset keeps the horizon from stretching to infinity.
    vec2 uv = dir.xz / (h + 0.14) * 1.25 + uTime * vec2(0.006, 0.002);
    float cover = smoothstep(0.50, 0.74, fbm(uv));
    // Sample density a step toward the sun: thick cloud in that direction means a shaded underside.
    float shade = fbm(uv + uSunDir.xz * 0.22);
    vec3 cloud = mix(vec3(1.0, 0.99, 0.96), vec3(0.62, 0.70, 0.80), smoothstep(0.42, 0.78, shade));
    cloud += uSunColor * 0.25 * pow(toSun, 5.0);
    // Far cloud melts into the horizon colour instead of aliasing.
    col = mix(col, cloud, cover * smoothstep(0.015, 0.2, h));
  }

  // The directional light already stands in for the sun in the environment map.
  col += uSunColor * 8.0 * smoothstep(0.99935, 0.99975, dot(dir, uSunDir)) * (1.0 - uEnv);
  col = mix(col, uGround, smoothstep(0.0, -0.06, h));
  // Ambient light baked from a saturated sky turns white paint and dark trim blue,
  // and nothing occludes it inside the cabin. Keep the brightness, drop most of the hue.
  col = mix(col, vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), 0.7 * uEnv);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const SKY_HORIZON_COLOR = 0xb9dcf7;

export function createSky(THREE, { sunDirection, lowDetail = false }) {
  const uniforms = {
    uSunDir: { value: sunDirection.clone().normalize() },
    uSunColor: { value: new THREE.Color(0xfff1d6) },
    uZenith: { value: new THREE.Color(0x3f86d6) },
    uHorizon: { value: new THREE.Color(SKY_HORIZON_COLOR) },
    uGround: { value: new THREE.Color(0x9aa7ad) },
    uTime: { value: 0 },
    uEnv: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    defines: { CLOUD_OCTAVES: lowDetail ? 3 : 5 },
    // The centre mirror flips its projection, which reverses winding; draw both faces.
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
  mesh.name = 'sky';
  mesh.frustumCulled = false;
  // Drawn after the opaque scene so hidden sky pixels fail the depth test instead of being shaded.
  mesh.renderOrder = 1000;

  return {
    mesh,
    setTime(seconds) { uniforms.uTime.value = seconds; },
    // One-off bake; the returned texture goes on scene.environment.
    bakeEnvironment(renderer) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      const envMaterial = material.clone();
      envMaterial.uniforms.uEnv.value = 1;
      const envMesh = new THREE.Mesh(mesh.geometry, envMaterial);
      envMesh.frustumCulled = false;
      envScene.add(envMesh);
      try {
        return pmrem.fromScene(envScene, 0, 0.1, 10).texture;
      } finally {
        envMaterial.dispose();
        pmrem.dispose();
      }
    },
  };
}
