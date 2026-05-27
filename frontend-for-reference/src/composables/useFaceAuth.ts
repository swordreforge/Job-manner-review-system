import { onBeforeUnmount, ref, type Ref } from 'vue'
import * as faceapi from 'face-api.js'

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
const DETECTOR_INPUT_SIZE = 320
const DETECTOR_SCORE_THRESHOLD = 0.45
// Minimum readyState (HAVE_CURRENT_DATA) required before attempting detection
const MIN_REQUIRED_VIDEO_READY_STATE = HTMLMediaElement.HAVE_CURRENT_DATA
const createDetectorOptions = () =>
  new faceapi.TinyFaceDetectorOptions({
    inputSize: DETECTOR_INPUT_SIZE,
    scoreThreshold: DETECTOR_SCORE_THRESHOLD,
  })

export interface FaceAuthState {
  loadingModels: Ref<boolean>
  authenticated: Ref<boolean>
  confidence: Ref<number>
  error: Ref<string | null>
  start: () => Promise<void>
  captureDescriptor: () => Promise<number[] | null>
  stop: () => void
}

/**
 * 使用 face-api.js 进行轻量人脸检测：
 * - start/tick 循环负责“无感”多帧检测
 * - captureDescriptor 用于单帧特征提取（录入/快捷登录）
 */
export function useFaceAuth(
  videoRef: Ref<HTMLVideoElement | null>,
  requiredConsecutiveDetections = 6,
): FaceAuthState {
  const loadingModels = ref(false)
  const authenticated = ref(false)
  const confidence = ref(0)
  const error = ref<string | null>(null)

  let rafId: number | null = null
  let loaded = false
  let recogLoaded = false
  let consecutive = 0

  async function loadModels() {
    if (loaded) return
    loadingModels.value = true
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ])
      loaded = true
    } catch (e) {
      error.value = (e as Error).message || '人脸模型加载失败'
    } finally {
      loadingModels.value = false
    }
  }

  async function loadRecognition() {
    if (recogLoaded) return
    try {
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      recogLoaded = true
    } catch (e) {
      const message = (e as Error).message || '未知错误'
      error.value = `人脸模型加载失败：${message}`
      throw e
    }
  }

  async function tick() {
    const video = videoRef.value
    if (!video || video.readyState < 2) {
      rafId = requestAnimationFrame(tick)
      return
    }
    if (authenticated.value) return
    try {
      const detection = await faceapi.detectSingleFace(video, createDetectorOptions())
      if (detection) {
        consecutive += 1
        confidence.value = detection.score ?? 0
        if (consecutive >= requiredConsecutiveDetections) {
          authenticated.value = true
        }
      } else {
        consecutive = Math.max(0, consecutive - 1)
        confidence.value = 0
      }
    } catch (e) {
      error.value = (e as Error).message || '人脸识别失败'
    } finally {
      rafId = requestAnimationFrame(tick)
    }
  }

  async function start() {
    await loadModels()
    if (error.value) return
    if (rafId) cancelAnimationFrame(rafId)
    consecutive = 0
    authenticated.value = false
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  /**
   * 抓取当前帧的人脸特征（128 维），用于后端比对与存储。
   * 无需持续运行 tick 循环即可单帧获取。
   */
  async function captureDescriptor(): Promise<number[] | null> {
    try {
      await loadModels()
      await loadRecognition()
    } catch {
      return null
    }
    const video = videoRef.value
    if (!video || video.readyState < MIN_REQUIRED_VIDEO_READY_STATE) return null
    try {
      const detection = await faceapi
        .detectSingleFace(video, createDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor()
      if (!detection?.descriptor) return null
      return Array.from(detection.descriptor)
    } catch (e) {
      error.value = (e as Error).message || '特征提取失败'
      return null
    }
  }

  onBeforeUnmount(stop)

  return { loadingModels, authenticated, confidence, error, start, captureDescriptor, stop }
}
