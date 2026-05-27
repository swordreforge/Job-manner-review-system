import { ref, readonly } from 'vue'

const isOffline = ref(!navigator.onLine)
const isReconnected = ref(false)

let reconnectTimer: ReturnType<typeof setTimeout> | null = null

window.addEventListener('online', () => {
  isOffline.value = false
  isReconnected.value = true
  reconnectTimer = setTimeout(() => {
    isReconnected.value = false
    reconnectTimer = null
  }, 3000)
})

window.addEventListener('offline', () => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  isReconnected.value = false
  isOffline.value = true
})

export function useNetworkStatus() {
  return {
    isOffline: readonly(isOffline),
    isReconnected: readonly(isReconnected),
  }
}
