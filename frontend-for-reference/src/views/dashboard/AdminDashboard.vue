<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavItems } from '@/composables/useNavItems'
import { useNavHistory } from '@/composables/useNavHistory'
import type { QueueStats } from '@/types/task'
import * as adminApi from '@/api/admin'

const router = useRouter()
const authStore = useAuthStore()
const { featureCards, findNavItemByPath } = useNavItems()
const { lastNonDocPath } = useNavHistory()

const queueStats = ref<QueueStats | null>(null)
const knowledgeStats = ref<Record<string, number> | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)

const queueCards = computed(() => [
  { label: '排队中', value: queueStats.value?.pending ?? '-', icon: 'mdi-clock-outline', color: 'warning' },
  { label: '执行中', value: queueStats.value?.dispatched ?? '-', icon: 'mdi-play-circle-outline', color: 'info' },
  { label: '失败', value: queueStats.value?.failed ?? '-', icon: 'mdi-alert-circle-outline', color: 'error' },
  { label: '总任务量', value: queueStats.value?.total ?? '-', icon: 'mdi-counter', color: 'success' },
])

const workflowActions = [
  { title: '任务队列', subtitle: '查看任务运行状态与失败重试', icon: 'mdi-format-list-checks', to: '/admin/tasks' },
  { title: '知识库导出', subtitle: '导出向量知识库并校验存档', icon: 'mdi-database-export', to: '/admin/export' },
  { title: '模型配置', subtitle: '更新供应商、参数和功能模型绑定', icon: 'mdi-tune-variant', to: '/admin/llm-config' },
]

const recentPage = computed(() => {
  const path = lastNonDocPath.value
  if (!path || path === '/dashboard') return null
  return findNavItemByPath(path)
})

const knowledgeTotal = computed(() => {
  if (!knowledgeStats.value) return '-'
  return Object.values(knowledgeStats.value).reduce<number>(
    (acc, cur) => acc + (Number.isFinite(cur) ? cur : 0),
    0,
  )
})

async function loadWorkbenchStats() {
  loading.value = true
  loadError.value = null
  try {
    const [qRes, kRes] = await Promise.allSettled([
      adminApi.getQueueStats(),
      adminApi.getKnowledgeStats(),
    ])
    if (qRes.status === 'fulfilled') {
      queueStats.value = qRes.value.data
    } else {
      queueStats.value = null
    }
    if (kRes.status === 'fulfilled') {
      knowledgeStats.value = kRes.value.data
    } else {
      knowledgeStats.value = null
    }
    if (qRes.status === 'rejected' || kRes.status === 'rejected') {
      loadError.value = '部分工作台数据加载失败，已展示可用内容'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWorkbenchStats()
})
</script>

<template>
  <v-container>
    <v-card class="mb-6" variant="tonal" color="primary">
      <v-card-text class="d-flex flex-wrap align-center ga-4 py-6">
        <div>
          <div class="text-h5 font-weight-bold mb-1">管理员工作台</div>
          <div class="text-body-2 text-medium-emphasis">
            欢迎回来，{{ authStore.currentUser?.username || '用户' }}。今天先看系统健康，再处理关键任务。
          </div>
        </div>
        <v-spacer />
        <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="loading" @click="loadWorkbenchStats">
          刷新工作台
        </v-btn>
      </v-card-text>
    </v-card>

    <v-row class="mb-3">
      <v-col v-if="loadError" cols="12">
        <v-alert type="warning" variant="tonal" density="compact" class="mb-1">
          {{ loadError }}
        </v-alert>
      </v-col>
      <v-col v-for="item in queueCards" :key="item.label" cols="12" sm="6" md="3">
        <v-card variant="tonal" :color="item.color">
          <v-card-text class="text-center">
            <v-icon :icon="item.icon" size="28" class="mb-1" />
            <div class="text-h5 font-weight-bold">{{ item.value }}</div>
            <div class="text-caption">{{ item.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-3">
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-database" class="mr-2" />
            数据健康
          </v-card-title>
          <v-card-text>
            <div class="text-body-2 text-medium-emphasis mb-2">知识库总条目</div>
            <div class="text-h4 font-weight-bold mb-4">{{ knowledgeTotal }}</div>
            <v-list density="compact">
              <v-list-item title="岗位原始数据" :subtitle="String(knowledgeStats?.job_data ?? '-')" />
              <v-list-item title="岗位画像" :subtitle="String(knowledgeStats?.job_profiles ?? '-')" />
              <v-list-item title="学生画像" :subtitle="String(knowledgeStats?.student_profiles ?? '-')" />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-lightning-bolt-outline" class="mr-2" />
            快速工作流
          </v-card-title>
          <v-list>
            <v-list-item
              v-for="action in workflowActions"
              :key="action.to"
              :title="action.title"
              :subtitle="action.subtitle"
              :prepend-icon="action.icon"
              @click="router.push(action.to)"
            />
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2" />
            最近访问
          </v-card-title>
          <v-card-text v-if="recentPage">
            <div class="text-subtitle-2 mb-2">{{ recentPage.title }}</div>
            <div class="text-body-2 text-medium-emphasis mb-4">{{ recentPage.description || '继续上次操作' }}</div>
            <v-btn color="primary" variant="tonal" :prepend-icon="recentPage.icon" @click="router.push(recentPage.to)">
              继续处理
            </v-btn>
          </v-card-text>
          <v-card-text v-else class="text-medium-emphasis">
            暂无可恢复页面，建议从“任务队列”开始巡检。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card>
      <v-card-title>全部管理功能</v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-for="item in featureCards" :key="item.to" cols="12" sm="6" md="3">
            <v-card :to="item.to" hover height="100%">
              <v-card-text class="text-center pa-5">
                <v-icon :icon="item.icon" :color="item.color" size="40" class="mb-3" />
                <h3 class="text-subtitle-1 mb-1">{{ item.title }}</h3>
                <p class="text-body-2 text-medium-emphasis">{{ item.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
