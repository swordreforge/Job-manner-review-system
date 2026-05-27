<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  gesture: number
  active: boolean
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let ringMaterial: THREE.ShaderMaterial | null = null
let coreMaterial: THREE.ShaderMaterial | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null
let resizeObserver: ResizeObserver | null = null
const MAX_PIXEL_RATIO = 2.5

function buildCore() {
  if (!scene) return
  const count = 3500
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const r = 0.8 + Math.random() * 0.7
    const theta = Math.acos(2 * Math.random() - 1)
    const phi = Math.random() * Math.PI * 2
    const x = r * Math.sin(theta) * Math.cos(phi)
    const y = r * Math.cos(theta)
    const z = r * Math.sin(theta) * Math.sin(phi)
    positions.set([x, y, z], i * 3)
    seeds[i] = Math.random() * 1000
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1))

  coreMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uGesture: { value: 0 },
      uChaos: { value: 0 },
      uBrightness: { value: 1 },
    },
    vertexShader: `
      attribute float seed;
      uniform float uTime;
      uniform float uGesture;
      uniform float uChaos;
      uniform float uBrightness;
      varying float vAlpha;

      float noise(float x) {
        return fract(sin(x) * 43758.5453);
      }

      void main() {
        vec3 p = position;
        float r = length(p);
        float pulse = mix(0.65, 1.45, uGesture);
        p *= pulse;

        float breathing = 0.03 * sin(uTime * 2.0 + seed);
        p += normalize(p + 0.0001) * breathing;

        if (uChaos > 0.0) {
          float ripple = sin(seed * 5.7 + uTime * 8.0) * 0.35 * uChaos;
          p += normalize(p + 0.0001) * ripple;
        }

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = mix(2.5, 4.5, uBrightness) * (1.0 / -mvPosition.z) * 140.0;
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = mix(0.45, 1.2, uBrightness) * (1.0 + uChaos * 0.5);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        vec3 inner = vec3(0.35, 0.6, 1.2);
        vec3 outer = vec3(0.9, 0.75, 1.4);
        vec3 color = mix(inner, outer, vAlpha * 0.7);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })

  const points = new THREE.Points(geometry, coreMaterial)
  scene.add(points)
}

function buildRings() {
  if (!scene) return
  const count = 4800
  const radii = new Float32Array(count)
  const seeds = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const band = Math.random()
    // 核心环半径 2.4~5.0，随机倾角抖动
    radii[i] = 2.4 + band * 2.6 + Math.random() * 0.1
    seeds[i] = Math.random() * Math.PI * 2
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1))
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1))

  ringMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uGesture: { value: 0 },
      uChaos: { value: 0 },
      uBrightness: { value: 1 },
    },
    vertexShader: `
      attribute float radius;
      attribute float seed;
      uniform float uTime;
      uniform float uGesture;
      uniform float uChaos;
      uniform float uBrightness;
      varying float vAlpha;

      mat3 tiltRing() {
        float ax = radians(18.0);
        float az = radians(-14.0);
        float cx = cos(ax); float sx = sin(ax);
        float cz = cos(az); float sz = sin(az);
        mat3 rotX = mat3(1.0,0.0,0.0, 0.0,cx,-sx, 0.0,sx,cx);
        mat3 rotZ = mat3(cz,-sz,0.0, sz,cz,0.0, 0.0,0.0,1.0);
        return rotZ * rotX;
      }

      void main() {
        float spread = mix(0.85, 1.65, uGesture);
        float chaos = smoothstep(0.8, 1.0, uChaos);

        float orbitalSpeed = 0.35 / pow(radius + 0.35, 1.5);
        float angle = seed + uTime * orbitalSpeed;
        float r = radius * spread;

        vec3 p = vec3(cos(angle) * r, sin(seed * 6.0) * 0.15 * spread, sin(angle) * r);
        p = tiltRing() * p;

        if (uChaos > 0.0) {
          float radialNoise = sin(seed * 42.0 + uTime * 6.0) * (0.6 + chaos);
          p += normalize(p + 0.0001) * radialNoise * uChaos * 0.35;
        }

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = mix(1.2, 3.8, 1.0 / (radius * 0.35)) * (1.0 + uGesture * 0.4);
        gl_PointSize *= (1.0 / -mvPosition.z) * 110.0;
        gl_Position = projectionMatrix * mvPosition;

        float flicker = 0.55 + 0.35 * sin(uTime * 2.0 + seed * 10.0);
        vAlpha = flicker * mix(0.45, 1.6, uBrightness) * (1.0 + uChaos * 0.5);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.55, 0.0, d) * vAlpha;
        vec3 cold = vec3(0.35, 0.7, 1.35);
        vec3 warm = vec3(1.2, 0.75, 1.5);
        vec3 color = mix(cold, warm, clamp(vAlpha, 0.0, 1.2));
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })

  const points = new THREE.Points(geometry, ringMaterial)
  scene.add(points)
}

function initScene() {
  const container = containerRef.value
  if (!container) return

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(0, 0.6, 9)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const subtleGlow = new THREE.PointLight(0x7fb3ff, 0.8, 40)
  subtleGlow.position.set(0, 2, 4)
  scene.add(subtleGlow)

  buildCore()
  buildRings()

  clock = new THREE.Clock()

  resizeObserver = new ResizeObserver(() => {
    if (!container || !camera || !renderer) return
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })
  resizeObserver.observe(container)
}

function updateGestureUniforms(val: number) {
  if (ringMaterial) {
    ringMaterial.uniforms.uGesture!.value = val
    ringMaterial.uniforms.uChaos!.value = Math.max(0, val - 0.85) * 2.2
    ringMaterial.uniforms.uBrightness!.value = 0.7 + val * 1.0
  }
  if (coreMaterial) {
    coreMaterial.uniforms.uGesture!.value = val
    coreMaterial.uniforms.uChaos!.value = Math.max(0, val - 0.85) * 2.0
    coreMaterial.uniforms.uBrightness!.value = 0.8 + val * 0.9
  }
}

function animate() {
  if (!renderer || !scene || !camera || !clock) return
  const t = clock.getElapsedTime()
  if (ringMaterial) ringMaterial.uniforms.uTime!.value = t
  if (coreMaterial) coreMaterial.uniforms.uTime!.value = t
  renderer.render(scene, camera)
  animationId = requestAnimationFrame(animate)
}

function start() {
  if (!animationId) {
    animate()
  }
}

function stop() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

onMounted(() => {
  initScene()
  updateGestureUniforms(props.gesture)
  if (props.active) start()
})

watch(
  () => props.gesture,
  (val) => {
    updateGestureUniforms(val)
  },
)

watch(
  () => props.active,
  (val) => {
    if (val) start()
    else stop()
  },
)

onUnmounted(() => {
  stop()
  resizeObserver?.disconnect()
  if (scene) {
    scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Points) {
        obj.geometry?.dispose()
        const mat = obj.material as THREE.Material | THREE.Material[]
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose())
        } else {
          mat?.dispose()
        }
      }
    })
  }
  renderer?.dispose()
  if (renderer?.domElement && containerRef.value?.contains(renderer.domElement)) {
    containerRef.value.removeChild(renderer.domElement)
  }
  scene = null
  camera = null
  ringMaterial = null
  coreMaterial = null
  renderer = null
})
</script>

<template>
  <div ref="containerRef" class="saturn-container" aria-label="3D particle saturn canvas" />
</template>

<style scoped>
.saturn-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
</style>
