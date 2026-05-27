<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { ApiResponse, PageData } from '@/types/api'
import * as adminApi from '@/api/admin'
import type { TaskMessage, QueueStats } from '@/types/task'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/tasks'))

// ── 队列统计 ──
const stats = ref<QueueStats | null>(null)
const statsLoading = ref(false)
const fetchError = ref<string | null>(null)

async function loadStats() {
  statsLoading.value = true
  try {
    const res = (await adminApi.getQueueStats()) as unknown as ApiResponse<QueueStats>
    stats.value = res.data
  } catch {
    stats.value = null
  } finally {
    statsLoading.value = false
  }
}

// ── 任务列表 ──
const tasks = ref<TaskMessage[]>([])
const tasksLoading = ref(false)
const page = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)
const statusFilter = ref<string>('')

async function loadTasks() {
  tasksLoading.value = true
  fetchError.value = null
  try {
    const params: Record<string, string | number> = { page: page.value, size: pageSize.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = (await adminApi.getTaskList(
      params as Record<string, string | number>,
    )) as unknown as ApiResponse<PageData<TaskMessage>>
    tasks.value = res.data?.content || []
    totalPages.value = res.data?.page?.totalPages || 0
    totalElements.value = res.data?.page?.totalElements || 0
  } catch {
    tasks.value = []
    fetchError.value = '加载任务列表失败，请检查网络后重试'
  } finally {
    tasksLoading.value = false
  }
}

function onStatusFilterChange() {
  page.value = 0
  loadTasks()
}

function onPageChange(newPage: number) {
  page.value = newPage - 1 // v-pagination 是 1-based
  loadTasks()
}

// ── 自动刷新 ──
const autoRefresh = ref(true)
const REFRESH_INTERVAL = 5000
let refreshTimer: ReturnType<typeof setInterval> | null = null

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    loadStats()
    loadTasks()
  }, REFRESH_INTERVAL)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// ── 工具函数 ──

const statusOptions = [
  { title: '全部', value: '' },
  { title: '排队中', value: 'PENDING' },
  { title: '执行中', value: 'DISPATCHED' },
  { title: '已完成', value: 'COMPLETED' },
  { title: '失败', value: 'FAILED' },
]

function statusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'DISPATCHED':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'error'
    default:
      return 'default'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return '排队中'
    case 'DISPATCHED':
      return '执行中'
    case 'COMPLETED':
      return '已完成'
    case 'FAILED':
      return '失败'
    default:
      return status
  }
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    DATA_CLEAN: '数据清洗',
    DATA_VECTORIZE: '数据向量化',
    PROFILE_GENERATE: '画像生成',
    GRAPH_BUILD: '图谱构建',
    RESUME_PARSE: '简历解析',
    STUDENT_PROFILE_FROM_INPUT: '学生画像',
    MATCH_ANALYZE: '人岗匹配',
    REPORT_GENERATE: '报告生成',
    REPORT_POLISH: '报告润色',
    CHAT_TITLE_GENERATE: '对话标题生成',
  }
  return map[type] || type
}

function formatTime(time: string | null): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ── 详情弹窗 ──
const detailDialog = ref(false)
const selectedTask = ref<TaskMessage | null>(null)

function openDetail(task: TaskMessage) {
  selectedTask.value = task
  detailDialog.value = true
}

// ── 生命周期 ──
onMounted(() => {
  loadStats()
  loadTasks()
  if (autoRefresh.value) startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '任务队列监控'"
      :icon="pageItem?.icon"
      :description="pageItem?.description"
    >
      <template #actions>
        <div class="d-flex align-center ga-2">
          <v-btn
            size="small"
            variant="text"
            :icon="autoRefresh ? 'mdi-pause-circle-outline' : 'mdi-play-circle-outline'"
            :color="autoRefresh ? 'success' : 'grey'"
            @click="toggleAutoRefresh"
          />
          <span class="text-caption" :class="autoRefresh ? 'text-success' : 'text-grey'">
            {{ autoRefresh ? '自动刷新中' : '已暂停' }}
          </span>
        </div>
      </template>
    </PageHeader>

    <!-- 统计卡片 -->
    <ApiErrorState
      v-if="fetchError && !statsLoading && !tasksLoading"
      :error="fetchError"
      title="加载失败"
      @retry="() => { loadStats(); loadTasks() }"
    />
    <template v-else>
    <v-row class="mb-4">
      <v-col
        cols="6"
        sm="3"
        v-for="item in [
          { label: '排队中', key: 'pending', color: 'warning', icon: 'mdi-clock-outline' },
          { label: '执行中', key: 'dispatched', color: 'info', icon: 'mdi-play-circle' },
          { label: '已完成', key: 'completed', color: 'success', icon: 'mdi-check-circle' },
          { label: '失败', key: 'failed', color: 'error', icon: 'mdi-alert-circle' },
        ]"
        :key="item.key"
      >
        <v-card variant="tonal" :color="item.color" class="pa-4 text-center">
          <v-icon :icon="item.icon" size="28" class="mb-1" />
          <div class="text-h5 font-weight-bold">
            {{ stats ? stats[item.key as keyof QueueStats] : '-' }}
          </div>
          <div class="text-caption">{{ item.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 总计 -->
    <v-alert v-if="stats" density="compact" variant="tonal" type="info" class="mb-4">
      队列总任务数: <strong>{{ stats.total }}</strong>
    </v-alert>

    <!-- 筛选 & 任务列表 -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
        任务列表
        <v-spacer />
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="title"
          item-value="value"
          label="状态筛选"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 160px"
          @update:model-value="onStatusFilterChange"
        />
      </v-card-title>

      <v-divider />

      <v-data-table-server
        :headers="[
          { title: 'ID', key: 'id', width: '160px' },
          { title: '类型', key: 'type', width: '120px' },
          { title: '状态', key: 'status', width: '100px' },
          { title: '用户', key: 'userId', width: '160px' },
          { title: '创建时间', key: 'createdAt' },
          { title: '更新时间', key: 'updatedAt' },
          {
            title: '更多',
            key: 'actions',
            width: '80px',
            align: 'center' as const,
            sortable: false,
          },
        ]"
        :items="tasks"
        :items-length="totalElements"
        :items-per-page="pageSize"
        :page="page + 1"
        :loading="tasksLoading"
        item-value="id"
        @update:page="onPageChange"
        @update:items-per-page="
          (v: number) => {
            pageSize = v
            page = 0
            loadTasks()
          }
        "
      >
        <template #item.id="{ value }">
          <span class="text-caption font-weight-medium">{{ String(value) }}</span>
        </template>
        <template #item.type="{ value }">
          <v-chip size="small" variant="flat" color="primary">
            {{ typeLabel(value) }}
          </v-chip>
        </template>
        <template #item.status="{ value }">
          <v-chip size="small" variant="flat" :color="statusColor(value)">
            {{ statusLabel(value) }}
          </v-chip>
        </template>
        <template #item.userId="{ value }">
          <span v-if="value" class="text-caption">{{ value.substring(0, 8) }}…</span>
          <span v-else class="text-grey text-caption">系统</span>
        </template>
        <template #item.createdAt="{ value }">
          <span class="text-caption">{{ formatTime(value) }}</span>
        </template>
        <template #item.updatedAt="{ value }">
          <span class="text-caption">{{ formatTime(value) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            variant="text"
            icon="mdi-information-outline"
            color="primary"
            @click="openDetail(item)"
          />
        </template>
        <template #no-data>
          <div class="text-center py-8 text-grey">
            <v-icon icon="mdi-tray-remove" size="48" class="mb-2" />
            <div>暂无任务</div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 任务详情弹窗 -->
    <v-dialog v-model="detailDialog" max-width="520">
      <v-card v-if="selectedTask">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-information-outline" class="mr-2" />
          任务详情
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-list density="compact" class="pa-0">
            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-identifier" size="small" class="mr-2" />
              </template>
              <v-list-item-title class="text-caption text-grey">任务 ID</v-list-item-title>
              <v-list-item-subtitle class="text-body-2 text-high-emphasis" style="white-space: normal">{{
                selectedTask.id
              }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-tag-outline" size="small" class="mr-2" />
              </template>
              <v-list-item-title class="text-caption text-grey">类型</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip size="small" variant="flat" color="primary">{{
                  typeLabel(selectedTask.type)
                }}</v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-reload" size="small" class="mr-2" />
              </template>
              <v-list-item-title class="text-caption text-grey">重试次数</v-list-item-title>
              <v-list-item-subtitle class="text-high-emphasis">
                <v-chip
                  v-if="selectedTask.retryCount > 0"
                  size="small"
                  color="warning"
                  variant="flat"
                  >{{ selectedTask.retryCount }}</v-chip
                >
                <span v-else>0</span>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon icon="mdi-alert-circle-outline" size="small" class="mr-2" />
              </template>
              <v-list-item-title class="text-caption text-grey">错误信息</v-list-item-title>
              <v-list-item-subtitle
                class="text-body-2"
                :class="selectedTask.errorMessage ? 'text-error' : 'text-grey'"
                style="white-space: pre-wrap; word-break: break-all"
                >{{ selectedTask.errorMessage || '无' }}</v-list-item-subtitle
              >
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </template>
  </v-container>
</template>
