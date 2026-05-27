<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import type { SchoolAlert } from '@/types/school'
import * as schoolApi from '@/api/school'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const router = useRouter()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/school/alerts'))

const alerts = ref<SchoolAlert[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)

const ALERT_TYPE_LABELS: Record<string, string> = {
  NO_PROFILE: '未完成画像',
  LOW_SCORE: '评分过低',
  LOW_COMPLETENESS: '完成度不足',
  NO_MATCH: '未做匹配',
}

const SEVERITY_CONFIG = {
  high: { color: 'error', label: '高风险' },
  medium: { color: 'warning', label: '中等' },
  low: { color: 'info', label: '提示' },
} as const

const headers = [
  { title: '严重程度', key: 'severity', width: '100px' },
  { title: '用户名', key: 'username' },
  { title: '预警类型', key: 'alertType', width: '120px' },
  { title: '预警说明', key: 'alertMessage' },
  { title: '操作', key: 'actions', sortable: false, width: '80px' },
]

const highCount = computed(() => alerts.value.filter((a) => a.severity === 'high').length)
const mediumCount = computed(() => alerts.value.filter((a) => a.severity === 'medium').length)
const lowCount = computed(() => alerts.value.filter((a) => a.severity === 'low').length)

async function loadAlerts() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await schoolApi.getSchoolAlerts()) as unknown as ApiResponse<SchoolAlert[]>
    alerts.value = res.data || []
  } catch {
    fetchError.value = '加载预警数据失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

function viewStudent(userId: string) {
  router.push(`/school/students/${userId}`)
}

onMounted(() => loadAlerts())
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '预警中心'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadAlerts"
    />

    <template v-else>
      <!-- 统计徽章 -->
      <v-row class="mb-4">
        <v-col cols="4">
          <v-card variant="tonal" color="error">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold">{{ highCount }}</div>
              <div class="text-caption">高风险预警</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card variant="tonal" color="warning">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold">{{ mediumCount }}</div>
              <div class="text-caption">中等预警</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card variant="tonal" color="info">
            <v-card-text class="text-center">
              <div class="text-h4 font-weight-bold">{{ lowCount }}</div>
              <div class="text-caption">提示</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card>
        <v-data-table
          :headers="headers"
          :items="alerts"
          :loading="loading"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #item.severity="{ item }">
            <v-chip
              :color="SEVERITY_CONFIG[item.severity]?.color ?? 'default'"
              size="small"
              variant="tonal"
            >
              {{ SEVERITY_CONFIG[item.severity]?.label ?? item.severity }}
            </v-chip>
          </template>

          <template #item.alertType="{ item }">
            <v-chip size="small" variant="outlined">
              {{ ALERT_TYPE_LABELS[item.alertType] ?? item.alertType }}
            </v-chip>
          </template>

          <template #item.alertMessage="{ item }">
            <span class="text-body-2">{{ item.alertMessage }}</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" @click="viewStudent(item.userId)">
              查看
            </v-btn>
          </template>

          <template #no-data>
            <div class="py-8 text-center text-grey">
              <v-icon size="48" class="mb-2">mdi-check-circle-outline</v-icon>
              <div>当前无预警学生</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </v-container>
</template>
