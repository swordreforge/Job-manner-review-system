<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ApiResponse } from '@/types/api'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/export'))

// ── 知识库统计 ──
const stats = ref<Record<string, number> | null>(null)
const statsLoading = ref(false)
const statsError = ref<string | null>(null)

const statsItems = [
  { key: 'job_data', label: '岗位原始数据', icon: 'mdi-database-outline' },
  { key: 'job_profiles', label: '岗位画像', icon: 'mdi-card-account-details-outline' },
  { key: 'student_profiles', label: '学生画像', icon: 'mdi-school-outline' },
]

async function loadStats() {
  statsLoading.value = true
  statsError.value = null
  try {
    const res = (await adminApi.getKnowledgeStats()) as unknown as ApiResponse<
      Record<string, number>
    >
    stats.value = res.data
  } catch {
    stats.value = null
    statsError.value = '加载知识库统计失败，请检查网络后重试'
  } finally {
    statsLoading.value = false
  }
}

// ── 导出 ──
const loading = ref(false)
const includeEmbeddings = ref(false)
const selectedCollections = ref('all')
const snackbar = ref(false)
const snackbarText = ref('')

const collectionOptions = [
  { title: '全部', value: 'all' },
  { title: '岗位原始数据', value: 'job_data' },
  { title: '岗位画像', value: 'job_profiles' },
  { title: '学生画像', value: 'student_profiles' },
]

async function handleExport() {
  loading.value = true
  try {
    const res = (await adminApi.exportKnowledgeBase({
      includeEmbeddings: includeEmbeddings.value,
      collections: selectedCollections.value,
    })) as unknown as Blob
    // 下载 Blob 文件
    const blob = new Blob([res], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge_base_export.json'
    a.click()
    URL.revokeObjectURL(url)
    snackbarText.value = '导出成功'
    snackbar.value = true
  } catch {
    snackbarText.value = '导出失败'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '知识库导出'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <!-- 知识库统计概览 -->
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-chart-bar" class="mr-2" />
        知识库统计
        <v-spacer />
        <v-btn
          size="small"
          variant="text"
          icon="mdi-refresh"
          :loading="statsLoading"
          @click="loadStats"
        />
      </v-card-title>
      <v-card-text>
        <ApiErrorState
          v-if="statsError"
          :error="statsError"
          title="统计加载失败"
          @retry="loadStats"
        />
        <v-row v-else-if="stats">
          <v-col v-for="item in statsItems" :key="item.key" cols="12" sm="4">
            <v-card variant="tonal" class="pa-4 text-center">
              <v-icon :icon="item.icon" size="28" class="mb-1" />
              <div class="text-h5 font-weight-bold">{{ stats[item.key] ?? 0 }}</div>
              <div class="text-caption text-grey">{{ item.label }}</div>
            </v-card>
          </v-col>
        </v-row>
        <div v-else-if="statsLoading" class="text-center py-4">
          <v-skeleton-loader type="text@3" />
        </div>
        <div v-else class="text-body-2 text-grey text-center py-4">暂无统计数据</div>
      </v-card-text>
    </v-card>

    <v-card class="pa-6">
      <v-card-title>导出选项</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedCollections"
          :items="collectionOptions"
          item-title="title"
          item-value="value"
          label="选择导出范围"
          variant="outlined"
          class="mb-4"
        />

        <v-checkbox
          v-model="includeEmbeddings"
          label="包含向量数据（文件较大）"
          hide-details
          class="mb-4"
        />

        <v-btn color="primary" size="large" block :loading="loading" @click="handleExport">
          <v-icon start icon="mdi-download" />导出 JSON 文件
        </v-btn>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="3000" location="top right">{{
      snackbarText
    }}</v-snackbar>
  </v-container>
</template>
