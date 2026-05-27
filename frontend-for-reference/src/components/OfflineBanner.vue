<template>
  <Transition name="offline-banner">
    <v-alert
      v-if="isOffline || isReconnected"
      :key="isOffline ? 'offline' : 'reconnected'"
      :color="isOffline ? 'error' : 'success'"
      :icon="isOffline ? 'mdi-wifi-off' : 'mdi-wifi-check'"
      density="compact"
      rounded="0"
    >
      {{ isOffline ? '当前处于离线状态，部分功能可能不可用' : '网络已恢复连接' }}
    </v-alert>
  </Transition>
</template>

<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOffline, isReconnected } = useNetworkStatus()
</script>

<style scoped>
.offline-banner-enter-active,
.offline-banner-leave-active {
  transition: transform 0.3s ease;
}
.offline-banner-leave-active {
  position: absolute;
  width: 100%;
}
.offline-banner-enter-from,
.offline-banner-leave-to {
  transform: translateY(-100%);
}
</style>
