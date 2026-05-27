<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import StudentDashboard from './dashboard/StudentDashboard.vue'
import SchoolDashboard from './dashboard/SchoolDashboard.vue'
import AdminDashboard from './dashboard/AdminDashboard.vue'

const authStore = useAuthStore()
</script>

<template>
  <v-container fluid>
    <!-- 加载状态 -->
    <div v-if="!authStore.user" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-4 text-medium-emphasis">加载中...</p>
    </div>

    <!-- 角色路由 -->
    <AdminDashboard v-else-if="authStore.isAdmin" />
    <SchoolDashboard v-else-if="authStore.isSchool" />
    <StudentDashboard v-else />
  </v-container>
</template>
