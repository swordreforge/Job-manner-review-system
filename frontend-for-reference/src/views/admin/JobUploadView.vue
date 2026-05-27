<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import { useNavItems } from '@/composables/useNavItems'

const router = useRouter()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/upload'))

const uploadFile = ref<File | null>(null)
const uploading = ref(false)
const uploadResult = ref<{
  totalRows: number
  importedCount: number
  skippedCount: number
  skippedReasons?: string[]
} | null>(null)
const uploadError = ref<string | null>(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showSnackbar(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

function onFileChange(files: File | File[] | null) {
  if (Array.isArray(files)) {
    uploadFile.value = files[0] ?? null
  } else {
    uploadFile.value = files
  }
  uploadResult.value = null
  uploadError.value = null
}

async function handleUpload() {
  if (!uploadFile.value) return
  uploading.value = true
  uploadResult.value = null
  uploadError.value = null
  try {
    const res = (await adminApi.uploadJobData(uploadFile.value)) as unknown as ApiResponse<{
      totalRows: number
      importedCount: number
      skippedCount: number
      skippedReasons?: string[]
    }>
    uploadResult.value = res.data
    if (res.data!.importedCount > 0) {
      showSnackbar(
        `导入成功：${res.data!.importedCount} 条，数据管道已自动触发`,
        'info',
      )
    } else {
      showSnackbar('文件解析完成，无新增数据（全部重复）', 'warning')
    }
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    uploadError.value = e.response?.data?.message || '上传失败'
    showSnackbar(uploadError.value!, 'error')
  } finally {
    uploading.value = false
  }
}

function goToTaskQueue() {
  router.push('/admin/tasks')
}
</script>

<template>
  <v-container>
    <PageHeader :title="pageItem?.title ?? '数据导入'" :icon="pageItem?.icon">
      <template #description>
        <p class="text-body-2 text-medium-emphasis mt-1 ml-1">
          上传岗位数据文件后，系统将自动触发数据处理管道（清洗 → 向量化 → 画像生成 → 图谱构建）。处理进度可在
          <a href="#" @click.prevent="goToTaskQueue" class="text-primary">任务队列</a>
          页面查看。
        </p>
      </template>
    </PageHeader>

    <p class="text-body-1 mb-4">
      支持 Excel（.xls / .xlsx）或 CSV 文件，支持中文列名（如"岗位名称"、"公司名称"等）和英文列名（如
      job_name、company_name 等）。
    </p>

    <!-- 文件选择 -->
    <v-file-input
      label="选择数据文件"
      accept=".xls,.xlsx,.csv"
      prepend-icon="mdi-file-table-outline"
      variant="outlined"
      density="compact"
      class="mb-4"
      :disabled="uploading"
      show-size
      @update:model-value="onFileChange"
    />

    <!-- 上传按钮 -->
    <v-btn
      color="primary"
      size="large"
      :disabled="!uploadFile || uploading"
      :loading="uploading"
      class="mb-4"
      @click="handleUpload"
    >
      <v-icon start icon="mdi-upload" />
      上传并导入
    </v-btn>

    <!-- 导入结果 -->
    <v-alert v-if="uploadResult" type="success" variant="tonal" density="compact" class="mb-4">
      <div>
        文件共 <strong>{{ uploadResult.totalRows }}</strong> 行， 成功导入
        <strong>{{ uploadResult.importedCount }}</strong> 条， 跳过
        <strong>{{ uploadResult.skippedCount }}</strong> 条
      </div>
      <div v-if="uploadResult.importedCount > 0" class="mt-2">
        <v-chip size="small" color="success" prepend-icon="mdi-check-circle">
          数据管道已自动触发
        </v-chip>
        <v-btn size="small" variant="text" color="primary" class="ml-2" @click="goToTaskQueue">
          查看任务队列
          <v-icon end icon="mdi-open-in-new" size="14" />
        </v-btn>
      </div>
      <div
        v-if="uploadResult.skippedReasons && uploadResult.skippedReasons.length > 0"
        class="mt-2"
      >
        <div class="text-caption font-weight-medium mb-1">跳过详情：</div>
        <div
          v-for="(reason, i) in uploadResult.skippedReasons"
          :key="i"
          class="text-caption"
        >
          • {{ reason }}
        </div>
      </div>
    </v-alert>

    <!-- 上传错误 -->
    <v-alert v-if="uploadError" type="error" variant="tonal" density="compact">
      {{ uploadError }}
    </v-alert>

    <!-- 全局提示 -->
    <v-snackbar v-model="snackbar" :timeout="4000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
