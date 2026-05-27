<script setup lang="ts">
import { computed, watch } from 'vue'
import { useFaceAuth } from '@/composables/useFaceAuth'

const props = defineProps<{
  videoEl: HTMLVideoElement | null
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'authorized'): void
}>()

const { loadingModels, authenticated, confidence, error, start, stop } = useFaceAuth(computed(() => props.videoEl))

watch(
  () => props.active,
  (val) => {
    if (val) start()
    else stop()
  },
  { immediate: true },
)

watch(authenticated, (val) => {
  if (val) emit('authorized')
})
</script>

<template>
  <div class="face-overlay" :class="{ 'face-overlay--hidden': !active }">
    <div class="scan-frame">
      <div class="scan-border" />
      <div class="scan-pulse" />
    </div>

    <div class="status">
      <span v-if="loadingModels">加载人脸模型中…</span>
      <span v-else-if="error">{{ error }}</span>
      <span v-else-if="authenticated">已识别，正在进入体验…</span>
      <span v-else>对准面部，自动完成无感登录</span>
      <div class="confidence" aria-live="polite">
        置信度：{{ Math.round(confidence * 100) }}%
      </div>
    </div>
  </div>
</template>

<style scoped>
.face-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: grid;
  place-items: center;
  color: #dfe9ff;
  transition: opacity 0.4s ease, transform 0.6s ease;
}

.face-overlay--hidden {
  opacity: 0;
  transform: scale(1.05);
}

.scan-frame {
  position: relative;
  width: min(48vw, 520px);
  aspect-ratio: 4 / 5;
  border-radius: 22px;
  backdrop-filter: blur(14px) brightness(0.85);
  background: rgba(12, 20, 35, 0.32);
  overflow: hidden;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.35);
}

.scan-border {
  position: absolute;
  inset: 0;
  border: 1.5px solid rgba(104, 181, 255, 0.65);
  border-radius: inherit;
  box-shadow: 0 0 24px rgba(104, 181, 255, 0.35);
}

.scan-pulse {
  position: absolute;
  inset: 10%;
  border-radius: inherit;
  background: radial-gradient(circle at 50% 30%, rgba(120, 195, 255, 0.28), transparent 70%);
  animation: pulse 2.4s ease-in-out infinite;
}

.status {
  position: absolute;
  bottom: 6%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  padding: 12px 18px;
  background: rgba(10, 16, 28, 0.55);
  border: 1px solid rgba(104, 181, 255, 0.45);
  border-radius: 14px;
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.32);
}

.confidence {
  font-size: 0.85rem;
  color: #9bb8ff;
  margin-top: 6px;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0.98);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}
</style>
