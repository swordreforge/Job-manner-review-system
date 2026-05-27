<template>
  <v-app>
    <router-view />

    <!-- 全局任务完成通知 snackbar -->
    <v-snackbar v-model="notifyVisible" :color="notifyColor" :timeout="4000" location="top right">
      {{ notifyText }}
      <template #actions>
        <v-btn variant="text" @click="notifyVisible = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style>
/* 移动端全局内边距收窄 */
@media (max-width: 959.98px) {
  .v-container {
    padding-inline: 12px !important;
  }
}
</style>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import { disconnectSSE } from '@/api/sse'
import {
  initTaskNotification,
  notifyVisible,
  notifyText,
  notifyColor,
} from '@/plugins/taskNotification'

// SSE 连接生命周期已由 auth store 管理（login → connect, logout → disconnect）
// 此处仅负责：
// 1. 初始化全局任务完成通知监听
// 2. 组件销毁时断开 SSE（兜底）

initTaskNotification()

onUnmounted(() => {
  disconnectSSE()
})
</script>
