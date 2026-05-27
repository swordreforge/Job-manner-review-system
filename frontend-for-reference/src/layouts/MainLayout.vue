<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import type { QueueStats } from '@/types/task'
import { useAuthStore } from '@/stores/auth'
import { useNavItems } from '@/composables/useNavItems'
import * as adminApi from '@/api/admin'
import OfflineBanner from '@/components/OfflineBanner.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { mobile, mdAndDown } = useDisplay()
const drawer = ref(!mobile.value)
const commandOpen = ref(false)
const commandKeyword = ref('')

watch(mobile, (isMobile) => {
  drawer.value = !isMobile
})

const isAdmin = computed(() => authStore.isAdmin)
const isSchool = computed(() => authStore.isSchool)
const userRoleLabel = computed(() => {
  if (isAdmin.value) return '管理员'
  if (isSchool.value) return '学校'
  return '学生'
})
const userRoleColor = computed(() => {
  if (isAdmin.value) return 'error'
  if (isSchool.value) return 'info'
  return 'success'
})

const { navGroups, navItems } = useNavItems()

const flatRoutes = computed(() =>
  navGroups.value.flatMap((g) =>
    g.items.map((item) => ({
      ...item,
      group: g.title ?? '常用',
      path: item.to,
    })),
  ),
)

const quickActions = computed(() =>
  navItems.value
    .filter((item) => item.to !== route.path)
    .slice(0, 6)
    .map((item) => ({ title: item.title, icon: item.icon, to: item.to })),
)

const filteredCommandItems = computed(() => {
  const keyword = commandKeyword.value.trim().toLowerCase()
  if (!keyword) return flatRoutes.value
  return flatRoutes.value.filter((item) => {
    const title = item.title.toLowerCase()
    const group = item.group.toLowerCase()
    const desc = (item.description ?? '').toLowerCase()
    return title.includes(keyword) || group.includes(keyword) || desc.includes(keyword)
  })
})

function openCommandPalette() {
  commandOpen.value = true
}

function closeCommandPalette() {
  commandOpen.value = false
  commandKeyword.value = ''
}

function goTo(path: string) {
  router.push(path)
  closeCommandPalette()
  if (mobile.value) drawer.value = false
}

function handleNavClick() {
  if (mobile.value) drawer.value = false
}

function logout() {
  authStore.logout()
}

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openCommandPalette()
  }
}

const queueStats = ref<QueueStats | null>(null)
const queueStatsLoading = ref(false)
const ACTIVE_POLL_INTERVAL_MS = 15000
const IDLE_POLL_INTERVAL_MS = 45000
const queueTimer = ref<ReturnType<typeof setTimeout> | null>(null)

async function loadQueueStats() {
  if (!isAdmin.value) return
  queueStatsLoading.value = true
  try {
    const res = await adminApi.getQueueStats()
    queueStats.value = res.data
  } catch {
    queueStats.value = null
  } finally {
    queueStatsLoading.value = false
  }
}

function resolveNextQueuePollMs() {
  const activeTaskCount = (queueStats.value?.pending ?? 0) + (queueStats.value?.dispatched ?? 0)
  return activeTaskCount > 0 ? ACTIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS
}

function scheduleQueuePolling() {
  if (!isAdmin.value) return
  queueTimer.value = setTimeout(async () => {
    await loadQueueStats()
    scheduleQueuePolling()
  }, resolveNextQueuePollMs())
}

function startQueuePolling() {
  stopQueuePolling()
  if (!isAdmin.value) return
  loadQueueStats()
  scheduleQueuePolling()
}

function stopQueuePolling() {
  if (queueTimer.value) {
    clearTimeout(queueTimer.value)
    queueTimer.value = null
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  startQueuePolling()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  stopQueuePolling()
})

watch(isAdmin, () => {
  if (!isAdmin.value) {
    queueStats.value = null
  }
  startQueuePolling()
})
</script>

<template>
  <v-app-bar app elevation="2" color="surface">
    <v-app-bar-nav-icon @click="drawer = !drawer" />

    <v-avatar size="28" rounded="lg" class="mr-2">
      <img src="@/assets/logo.svg" alt="Logo" />
    </v-avatar>
    <v-toolbar-title class="text-body-1 font-weight-bold">Career Planner</v-toolbar-title>
    <v-spacer />

    <v-chip :color="userRoleColor" size="small" variant="flat" class="mr-2 d-none d-sm-flex">
      {{ userRoleLabel }}
    </v-chip>

    <v-btn
      variant="tonal"
      color="primary"
      class="text-none mr-2 command-btn"
      rounded="lg"
      @click="openCommandPalette"
    >
      <v-icon start icon="mdi-magnify" />
      <span class="d-none d-md-inline">快速导航</span>
      <v-chip size="x-small" class="ml-2 d-none d-lg-inline-flex">Ctrl/⌘ + K</v-chip>
    </v-btn>

    <v-btn variant="text" class="text-none mr-1" rounded="lg" to="/docs">
      <v-icon start icon="mdi-book-open-variant" />
      <span class="d-none d-sm-inline">帮助文档</span>
    </v-btn>

    <v-tooltip text="退出登录" location="bottom">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" app elevation="2" :temporary="mobile" :width="mdAndDown ? 288 : 320">
    <div class="pa-4 pb-2">
      <div class="text-subtitle-2 font-weight-bold mb-1">
        {{ authStore.currentUser?.username || '用户' }}
      </div>
      <div class="text-caption text-medium-emphasis mb-3">统一导航 · 快速操作 · 状态感知</div>
      <v-btn block color="primary" variant="tonal" rounded="lg" class="text-none" @click="openCommandPalette">
        <v-icon start icon="mdi-magnify" />
        打开命令面板
      </v-btn>
    </div>

    <v-divider class="mb-2" />

    <v-list density="compact" nav class="pb-0">
      <template v-for="group in navGroups" :key="group.title ?? '_root'">
        <v-list-subheader class="font-weight-medium">{{ group.title ?? '常用' }}</v-list-subheader>
        <v-list-item
          v-for="item in group.items"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :subtitle="item.description"
          :to="item.to"
          rounded="lg"
          exact
          @click="handleNavClick"
        />
      </template>
    </v-list>

    <template #append>
      <v-divider class="mb-2" />
      <div class="pa-3">
        <div class="text-caption text-medium-emphasis mb-2">快捷入口</div>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip
            v-for="item in quickActions"
            :key="item.to"
            size="small"
            variant="tonal"
            color="primary"
            class="cursor-pointer"
            @click="goTo(item.to)"
          >
            <v-icon start :icon="item.icon" size="14" />
            {{ item.title }}
          </v-chip>
        </div>

        <v-card
          v-if="isAdmin"
          variant="tonal"
          color="orange"
          rounded="lg"
          class="task-status-card"
          :loading="queueStatsLoading"
          @click="goTo('/admin/tasks')"
        >
          <v-card-text class="py-3">
            <div class="text-caption mb-2 d-flex align-center">
              <v-icon icon="mdi-pulse" size="14" class="mr-1" />
              队列状态总览
            </div>
            <div class="d-flex justify-space-between">
              <div class="text-center">
                <div class="text-caption">排队</div>
                <div class="text-subtitle-2">{{ queueStats?.pending ?? '-' }}</div>
              </div>
              <div class="text-center">
                <div class="text-caption">执行</div>
                <div class="text-subtitle-2">{{ queueStats?.dispatched ?? '-' }}</div>
              </div>
              <div class="text-center">
                <div class="text-caption">失败</div>
                <div class="text-subtitle-2">{{ queueStats?.failed ?? '-' }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </template>
  </v-navigation-drawer>

  <v-dialog v-model="commandOpen" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center py-3">
        <v-icon icon="mdi-magnify" class="mr-2" />
        快速导航 / Command Palette
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="closeCommandPalette">
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pb-2">
        <v-text-field
          v-model="commandKeyword"
          placeholder="输入功能名称、分组或描述关键词..."
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          hide-details
          autofocus
        />
      </v-card-text>
      <v-list max-height="420" class="overflow-y-auto">
        <v-list-item
          v-for="item in filteredCommandItems"
          :key="item.path"
          :title="item.title"
          :subtitle="item.description || item.group"
          :prepend-icon="item.icon"
          rounded="lg"
          @click="goTo(item.path)"
        >
          <template #append>
            <v-chip size="x-small" variant="tonal">{{ item.group }}</v-chip>
          </template>
        </v-list-item>
        <v-list-item v-if="filteredCommandItems.length === 0" title="未找到匹配功能" subtitle="请尝试更短或更通用的关键词" />
      </v-list>
    </v-card>
  </v-dialog>

  <v-main>
    <OfflineBanner />
    <router-view />
  </v-main>
</template>

<style scoped>
.command-btn {
  min-width: 132px;
}

.task-status-card {
  cursor: pointer;
  transition: transform 0.18s ease;
}

.task-status-card:hover {
  transform: translateY(-1px);
}
</style>
