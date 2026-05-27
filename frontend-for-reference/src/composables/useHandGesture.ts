import { onBeforeUnmount, ref, type Ref } from 'vue'
import { Hands, type NormalizedLandmarkList } from '@mediapipe/hands'

const HANDS_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240'
const NORMALIZED_BASE_OFFSET = 0.6
const NORMALIZED_SCALING = 1.4

export interface HandGestureState {
  gesture: Ref<number>
  tracking: Ref<boolean>
  start: () => Promise<void>
  stop: () => void
}

function vectorDistance(a: NormalizedLandmarkList[0], b: NormalizedLandmarkList[0]): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * 基于 MediaPipe Hands 计算手掌张合度（0=握紧，1=完全张开）
 */
export function useHandGesture(videoRef: Ref<HTMLVideoElement | null>): HandGestureState {
  const gesture = ref(0)
  const tracking = ref(false)
  let hands: Hands | null = null
  let rafId: number | null = null

  function computeOpenness(landmarks: NormalizedLandmarkList) {
    const palmIndices = [0, 1, 5, 9, 13, 17]
    const tipIndices = [4, 8, 12, 16, 20]

    if (landmarks.length < 21) return

    const palmCenter = palmIndices.reduce(
      (acc, idx) => {
        const p = landmarks[idx]
        if (!p) return acc
        acc.x += p.x
        acc.y += p.y
        acc.z += p.z
        return acc
      },
      { x: 0, y: 0, z: 0 },
    )
    palmCenter.x /= palmIndices.length
    palmCenter.y /= palmIndices.length
    palmCenter.z /= palmIndices.length

    const tipDistances = tipIndices.map((idx) => vectorDistance(landmarks[idx]!, palmCenter))
    const avgTipDist = tipDistances.reduce((a, b) => a + b, 0) / tipDistances.length

    // wrist -> middle finger MCP 作为参考尺度
    const baseDist = vectorDistance(landmarks[0]!, landmarks[9]!) || 1
    const normalized = avgTipDist / baseDist

    const openness = Math.min(1, Math.max(0, (normalized - NORMALIZED_BASE_OFFSET) * NORMALIZED_SCALING))
    // 平滑处理
    gesture.value = gesture.value * 0.82 + openness * 0.18
  }

  async function start() {
    if (tracking.value) return
    const video = videoRef.value
    if (!video) return

    hands = new Hands({
      locateFile: (file) => `${HANDS_CDN_BASE}/${file}`,
    })
    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.6,
      modelComplexity: 1,
    })

    hands.onResults((results) => {
      const landmarks = results.multiHandLandmarks?.[0]
      if (landmarks) {
        computeOpenness(landmarks)
      } else {
        gesture.value = gesture.value * 0.9
      }
    })

    tracking.value = true
    const loop = async () => {
      if (!hands || !tracking.value) return
      if (video.readyState >= 2) {
        await hands.send({ image: video })
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }

  function stop() {
    tracking.value = false
    if (rafId) cancelAnimationFrame(rafId)
    if (hands) {
      hands.reset()
      hands.close()
      hands = null
    }
  }

  onBeforeUnmount(stop)

  return { gesture, tracking, start, stop }
}
