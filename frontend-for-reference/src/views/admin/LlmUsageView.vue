<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type {
  TokenUsageStats,
  DailyUsageStat,
  ModelUsageStat,
  TaskTypeUsageStat,
  TokenUsageRecord,
} from '@/types/llm'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/llm-usage'))

// ── 日期工具 ──
function toDateStr(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const today = new Date()
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000)
const startDate = ref<Date | null>(thirtyDaysAgo)
const endDate = ref<Date | null>(today)
const startDateMenu = ref(false)
const endDateMenu = ref(false)

// ── 分类统计 Tab ──
const breakdownTab = ref('model')

// ── 总体统计 ──
const stats = ref<TokenUsageStats | null>(null)
const loadingStats = ref(false)
const fetchError = ref<string | null>(null)

async function loadStats() {
  loadingStats.value = true
  try {
    const res = await adminApi.getLlmUsageStats({
      startDate: toDateStr(startDate.value),
      endDate: toDateStr(endDate.value),
    })
    stats.value = res.data
  } catch (e) {
    console.error('加载总体统计失败', e)
    fetchError.value = '加载统计数据失败，请检查网络后重试'
  } finally {
    loadingStats.value = false
  }
}

// ── 每日趋势 ──
const dailyStats = ref<DailyUsageStat[]>([])

async function loadDaily() {
  try {
    const res = await adminApi.getLlmUsageDaily({
      startDate: toDateStr(startDate.value),
      endDate: toDateStr(endDate.value),
    })
    dailyStats.value = res.data ?? []
  } catch (e) {
    console.error('加载每日趋势失败', e)
  }
}

const sparklineLabels = computed(() => dailyStats.value.map((d) => d.date.slice(5)))
const sparklineTokens = computed(() => dailyStats.value.map((d) => d.totalTokens))

/** 只在首、尾和每隔 ~7 个点显示日期标签，避免密集堆叠 */
function sparklabelVisible(index: number): boolean {
  const total = sparklineLabels.value.length
  if (total <= 1) return true
  const step = Math.max(1, Math.round(total / 5))
  return index === 0 || index === total - 1 || index % step === 0
}

// ── 按模型 ──
const modelStats = ref<ModelUsageStat[]>([])
const modelHeaders = [
  { title: '模型', key: 'modelName' },
  { title: '输入 Token', key: 'inputTokens' },
  { title: '输出 Token', key: 'outputTokens' },
  { title: '总 Token', key: 'totalTokens' },
  { title: '费用 (元)', key: 'totalCost' },
  { title: '请求数', key: 'requestCount' },
]

async function loadModelStats() {
  try {
    const res = await adminApi.getLlmUsageByModel({
      startDate: toDateStr(startDate.value),
      endDate: toDateStr(endDate.value),
    })
    modelStats.value = res.data ?? []
  } catch (e) {
    console.error('加载模型统计失败', e)
  }
}

// ── 按任务类型 ──
const taskTypeStats = ref<TaskTypeUsageStat[]>([])
const taskTypeHeaders = [
  { title: '任务类型', key: 'taskType' },
  { title: '输入 Token', key: 'inputTokens' },
  { title: '输出 Token', key: 'outputTokens' },
  { title: '总 Token', key: 'totalTokens' },
  { title: '费用 (元)', key: 'totalCost' },
  { title: '请求数', key: 'requestCount' },
]

async function loadTaskTypeStats() {
  try {
    const res = await adminApi.getLlmUsageByTaskType({
      startDate: toDateStr(startDate.value),
      endDate: toDateStr(endDate.value),
    })
    taskTypeStats.value = res.data ?? []
  } catch (e) {
    console.error('加载任务类型统计失败', e)
  }
}

// ── 详细记录 ──
const records = ref<TokenUsageRecord[]>([])
const recordPage = ref(1)
const recordPageSize = ref(20)
const recordTotal = ref(0)
const loadingRecords = ref(false)
const filterUserId = ref('')
const filterTaskType = ref('')

const TASK_TYPE_LABELS: Record<string, string> = {
  RESUME_FULL: '简历完整解析',
  RESUME_EXTRACT: '简历信息提取',
  STUDENT_SCORE: '学生评分',
  MATCH_BASIC_REQUIREMENT: '基础要求匹配',
  MATCH_SKILLS: '技能匹配',
  DEVELOPMENT_POTENTIAL: '发展潜力分析',
  OVERALL_ANALYSIS: '综合分析',
  JOB_PROFILE_GENERATE: '岗位画像生成',
  INDUSTRY_FILTER: '行业过滤',
  CATEGORY_CLASSIFY: '职类分类',
  PROMOTION_RELATION: '晋升关系构建',
  TRANSFER_RELATION: '转型关系构建',
  REPORT_CHAPTER: '报告章节生成',
  REPORT_POLISH: '报告全文润色',
  SECTION_POLISH: '报告章节润色',
  COMPLETENESS_CHECK: '完整性检查',
  CHAT: '对话',
  CHAT_TITLE: '对话标题生成',
}

function taskTypeLabel(key: string | null | undefined): string {
  if (!key) return '-'
  return TASK_TYPE_LABELS[key] ?? key
}

const recordHeaders = [
  { title: '时间', key: 'createdAt' },
  { title: '任务ID', key: 'taskId' },
  { title: '用户', key: 'userId' },
  { title: '类型', key: 'taskType' },
  { title: '模型', key: 'modelName' },
  { title: '输入 Token', key: 'inputTokens' },
  { title: '输出 Token', key: 'outputTokens' },
  { title: '费用 (元)', key: 'totalCost' },
]

async function loadRecords() {
  loadingRecords.value = true
  try {
    const res = await adminApi.getLlmUsageRecords({
      page: recordPage.value - 1,
      size: recordPageSize.value,
      userId: filterUserId.value || undefined,
      taskType: filterTaskType.value || undefined,
      startDate: toDateStr(startDate.value),
      endDate: toDateStr(endDate.value),
    })
    const data = res.data
    records.value = data?.content ?? []
    recordTotal.value = data?.page?.totalElements ?? 0
  } finally {
    loadingRecords.value = false
  }
}

function onTableOptions({ page, itemsPerPage }: { page: number; itemsPerPage: number }) {
  recordPage.value = page
  recordPageSize.value = itemsPerPage
  loadRecords()
}

function queryRecords() {
  recordPage.value = 1
  loadRecords()
}

async function refresh() {
  recordPage.value = 1
  fetchError.value = null
  await Promise.all([
    loadStats(),
    loadDaily(),
    loadModelStats(),
    loadTaskTypeStats(),
    loadRecords(),
  ])
}

onMounted(refresh)
</script>

<template>
  <v-container class="pa-6">
    <PageHeader
      :title="pageItem?.title ?? 'LLM 计费统计'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <!-- 日期范围筛选 -->
    <v-card class="mb-4" variant="flat" border>
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-menu
              v-model="startDateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="toDateStr(startDate)"
                  label="开始日期"
                  density="compact"
                  hide-details
                  readonly
                  prepend-inner-icon="mdi-calendar"
                />
              </template>
              <v-date-picker
                v-model="startDate"
                hide-header
                @update:model-value="startDateMenu = false"
              />
            </v-menu>
          </v-col>
          <v-col cols="12" sm="4">
            <v-menu
              v-model="endDateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="toDateStr(endDate)"
                  label="结束日期"
                  density="compact"
                  hide-details
                  readonly
                  prepend-inner-icon="mdi-calendar"
                />
              </template>
              <v-date-picker
                v-model="endDate"
                hide-header
                @update:model-value="endDateMenu = false"
              />
            </v-menu>
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn color="primary" prepend-icon="mdi-refresh" @click="refresh">刷新</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <ApiErrorState
      v-if="fetchError && !loadingStats"
      :error="fetchError"
      title="加载失败"
      @retry="refresh"
    />
    <template v-else>

    <!-- 统计卡片：总费用排第一 -->
    <v-row class="mb-4">
      <v-col
        v-for="card in [
          {
            label: '总费用 (元)',
            value: stats ? '¥' + (stats.totalCost ?? 0).toFixed(4) : '-',
            icon: 'mdi-currency-cny',
            color: 'orange',
          },
          {
            label: '总请求数',
            value: stats?.totalRequests ?? '-',
            icon: 'mdi-api',
            color: 'primary',
          },
          {
            label: '输入 Token',
            value: stats?.totalInputTokens?.toLocaleString() ?? '-',
            icon: 'mdi-arrow-right-circle',
            color: 'blue',
          },
          {
            label: '输出 Token',
            value: stats?.totalOutputTokens?.toLocaleString() ?? '-',
            icon: 'mdi-arrow-left-circle',
            color: 'teal',
          },
        ]"
        :key="card.label"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card variant="tonal" :color="card.color">
          <v-card-text class="d-flex align-center">
            <v-icon :icon="card.icon" size="36" class="mr-3 opacity-70" />
            <div>
              <div class="text-caption">{{ card.label }}</div>
              <div class="text-h6 font-weight-bold">{{ card.value }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 趋势图 -->
    <v-card v-if="sparklineTokens.length > 0" class="mb-4">
      <v-card-title class="pt-4 px-6 pb-0">每日 Token 趋势</v-card-title>
      <v-card-subtitle class="px-6 pb-0">
        {{ sparklineLabels[0] }} — {{ sparklineLabels[sparklineLabels.length - 1] }}
      </v-card-subtitle>
      <v-card-text class="pt-2">
        <v-sparkline
          :model-value="sparklineTokens"
          :labels="sparklineLabels"
          :gradient="['#1565C0', '#42A5F5', '#90CAF9']"
          gradient-direction="top"
          fill
          line-width="2"
          :padding="24"
          smooth
          auto-draw
          :auto-draw-duration="1200"
          show-labels
          label-size="6"
          :height="160"
          color="#1976D2"
        >
          <template #label="{ index, value }">
            {{ sparklabelVisible(index) ? value : '' }}
          </template>
        </v-sparkline>
      </v-card-text>
    </v-card>

    <!-- 按模型 / 按任务类型（合并为单卡片，Tab 切换） -->
    <v-card class="mb-6">
      <v-tabs v-model="breakdownTab" color="primary">
        <v-tab value="model">按模型统计</v-tab>
        <v-tab value="taskType">按任务类型统计</v-tab>
      </v-tabs>
      <v-divider />
      <v-tabs-window v-model="breakdownTab">
        <v-tabs-window-item value="model">
          <v-data-table
            :headers="modelHeaders"
            :items="modelStats"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.totalCost="{ item }">¥{{ (item.totalCost ?? 0).toFixed(4) }}</template>
          </v-data-table>
        </v-tabs-window-item>
        <v-tabs-window-item value="taskType">
          <v-data-table
            :headers="taskTypeHeaders"
            :items="taskTypeStats"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.taskType="{ item }">{{ taskTypeLabel(item.taskType) }}</template>
            <template #item.totalCost="{ item }">¥{{ (item.totalCost ?? 0).toFixed(4) }}</template>
          </v-data-table>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <!-- 详细记录 -->
    <v-card>
      <v-card-title class="pt-5 px-6 pb-3">详细记录</v-card-title>
      <v-card-text class="pb-0 px-6">
        <v-row align="center" class="mb-1">
          <v-col cols="12" sm="auto">
            <v-text-field
              v-model="filterUserId"
              placeholder="用户名筛选"
              density="comfortable"
              hide-details
              clearable
              style="min-width: 180px"
            />
          </v-col>
          <v-col cols="12" sm="auto">
            <v-text-field
              v-model="filterTaskType"
              placeholder="任务类型筛选"
              density="comfortable"
              hide-details
              clearable
              style="min-width: 180px"
            />
          </v-col>
          <v-col cols="12" sm="auto">
            <v-btn variant="tonal" @click="queryRecords">查询</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-data-table-server
        :headers="recordHeaders"
        :items="records"
        :items-length="recordTotal"
        :loading="loadingRecords"
        :page="recordPage"
        :items-per-page="recordPageSize"
        @update:options="onTableOptions"
      >
        <template #item.createdAt="{ item }">
          {{ item.createdAt?.slice(0, 19).replace('T', ' ') }}
        </template>
        <template #item.taskType="{ item }">{{ taskTypeLabel(item.taskType) }}</template>
        <template #item.totalCost="{ item }">¥{{ (item.totalCost ?? 0).toFixed(4) }}</template>
      </v-data-table-server>
    </v-card>
    </template>
  </v-container>
</template>
