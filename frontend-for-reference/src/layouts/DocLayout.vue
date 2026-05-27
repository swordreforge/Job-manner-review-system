<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useNavHistory } from '@/composables/useNavHistory'

const router = useRouter()
const { lastNonDocPath } = useNavHistory()

function goBack() {
  router.push(lastNonDocPath.value)
}
</script>

<template>
  <!-- 顶栏 -->
  <v-app-bar app elevation="4" color="primary">
    <v-btn icon variant="text" color="white" @click="goBack()">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <v-toolbar-title class="text-white font-weight-medium">
      <router-link to="/" class="text-decoration-none text-white">
        大学生职业规划智能体 — 帮助文档
      </router-link>
    </v-toolbar-title>
  </v-app-bar>

  <!-- 内容区 -->
  <v-main>
    <router-view />
  </v-main>
</template>
