<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReportStore } from '@/stores/report'
import { useNavItems } from '@/composables/useNavItems'
import ApiErrorState from '@/components/ApiErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const store = useReportStore()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/reports'))
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const fetchError = ref<string | null>(null)
// F2: 响应式当前页，用于分页组件双向绑定（v-pagination 从 1 开始，API 从 0 开始）
const currentPage = ref(1)

function showSnackbar(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

async function loadReports(page = 0) {
  fetchError.value = null
  try {
    await store.fetchReports(page)
  } catch {
    fetchError.value = '加载报告列表失败，请检查网络后重试'
  }
}

async function onPageChange(page: number) {
  currentPage.value = page
  await loadReports(page - 1)
}

onMounted(async () => {
  await loadReports(0)
  // 如果路由携带 ?generate=matchResultId 参数，则自动提交报告生成任务
  const generateFor = route.query.generate as string
  if (generateFor) {
    try {
      await store.generateReport(generateFor)
      showSnackbar('报告生成任务已提交，请稍后刷新查看', 'info')
      // 清除 URL 中的 generate 参数
      router.replace({ path: '/reports', query: {} })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showSnackbar(e.response?.data?.message || '提交报告生成失败', 'error')
    }
  }
})

function statusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'GENERATING':
      return 'primary'
    case 'FAILED':
      return 'error'
    default:
      return 'secondary'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'GENERATING':
      return '生成中...'
    case 'COMPLETED':
      return '已完成'
    case 'FAILED':
      return '生成失败'
    default:
      return status
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '报告管理'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <v-skeleton-loader v-if="store.loading" type="card@3" class="mb-4" />

    <ApiErrorState
      v-else-if="fetchError"
      :error="fetchError"
      title="加载失败"
      @retry="() => loadReports(currentPage - 1)"
    />

    <v-row v-else-if="store.reportList.length">
      <v-col v-for="report in store.reportList" :key="report.id" cols="12" sm="6" md="4">
        <v-card :to="`/reports/${report.id}`" hover height="100%">
          <v-card-title class="text-subtitle-1 font-weight-bold">{{ report.title }}</v-card-title>
          <v-card-subtitle>{{ formatDate(report.createdAt) }}</v-card-subtitle>
          <v-card-text>
            <div class="d-flex align-center ga-2">
              <v-chip size="small" :color="statusColor(report.status)" variant="tonal">
                <v-progress-circular
                  v-if="report.status === 'GENERATING'"
                  size="12"
                  width="2"
                  indeterminate
                  class="mr-1"
                />
                {{ statusLabel(report.status) }}
              </v-chip>
              <v-chip size="small" variant="outlined">v{{ report.version }}</v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-else-if="!store.loading && !fetchError" type="info" variant="tonal" class="mt-4">
      <p class="mb-2">暂无报告，请先完成人岗匹配后再生成报告。</p>
      <v-btn color="primary" variant="outlined" to="/match">
        <v-icon start icon="mdi-compare-horizontal" />前往人岗匹配
      </v-btn>
    </v-alert>

    <!-- F2: 绑定响应式 currentPage 并处理页码变更事件 -->
    <div class="d-flex justify-center mt-4" v-if="store.totalPages > 1">
      <v-pagination
        v-model="currentPage"
        :length="store.totalPages"
        rounded
        @update:model-value="onPageChange"
      />
    </div>

    <v-snackbar v-model="snackbar" :timeout="4000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
