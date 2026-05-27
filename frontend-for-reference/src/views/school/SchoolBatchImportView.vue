<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApiResponse } from '@/types/api'
import type { BatchImportResult } from '@/types/school'
import * as schoolApi from '@/api/school'
import PageHeader from '@/components/PageHeader.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/school/import'))

const file = ref<File | null>(null)
const loading = ref(false)
const result = ref<BatchImportResult | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const resultHeaders = [
  { title: '用户名', key: 'username' },
  { title: '初始密码（请及时告知学生）', key: 'password' },
]

async function handleImport() {
  if (!file.value) return
  loading.value = true
  result.value = null
  try {
    const res = (await schoolApi.batchImportStudents(
      file.value,
    )) as unknown as ApiResponse<BatchImportResult>
    result.value = res.data
    showMessage(`导入完成：创建 ${res.data.created} 条，跳过 ${res.data.skipped} 条`, 'success')
  } catch {
    showMessage('导入失败，请检查文件格式', 'error')
  } finally {
    loading.value = false
  }
}

async function downloadTemplate() {
  try {
    const res = await schoolApi.downloadBatchImportTemplate()
    const blob = new Blob([res.data as BlobPart], { type: 'text/csv;charset=UTF-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    showMessage('模板下载失败', 'error')
  }
}

function showMessage(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '批量导入学生'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <v-alert type="info" variant="tonal" class="mb-4">
      <p class="mb-1">文件格式要求：</p>
      <ul class="pl-4">
        <li>支持 .xlsx / .xls / .csv 格式</li>
        <li>第一行为表头（username, password）</li>
        <li>password 列可留空，系统将自动生成随机密码</li>
        <li>用户名已存在的行将自动跳过</li>
      </ul>
    </v-alert>

    <v-file-input
      v-model="file"
      label="选择导入文件"
      accept=".xlsx,.xls,.csv"
      prepend-icon="mdi-file-upload"
      variant="outlined"
      density="compact"
      show-size
      class="mb-4"
    />

    <div class="d-flex ga-3 mb-6">
      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!file"
        prepend-icon="mdi-upload"
        @click="handleImport"
      >
        开始导入
      </v-btn>
      <v-btn variant="outlined" prepend-icon="mdi-download" @click="downloadTemplate">
        下载模板
      </v-btn>
    </div>

    <!-- 导入结果 -->
    <template v-if="result">
      <v-divider class="mb-4" />
      <div class="text-subtitle-1 font-weight-medium mb-4">导入结果</div>
      <v-row class="mb-4">
        <v-col cols="4" class="text-center">
          <div class="text-h4 text-primary font-weight-bold">{{ result.total }}</div>
          <div class="text-caption text-grey">总行数</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h4 text-success font-weight-bold">{{ result.created }}</div>
          <div class="text-caption text-grey">成功创建</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h4 text-warning font-weight-bold">{{ result.skipped }}</div>
          <div class="text-caption text-grey">已跳过</div>
        </v-col>
      </v-row>

      <template v-if="result.generatedPasswords && result.generatedPasswords.length > 0">
        <v-divider class="mb-4" />
        <v-alert type="warning" variant="tonal" class="mb-3">
          以下账号的密码由系统自动生成，请记录后告知学生。关闭此页面后将无法再次查看。
        </v-alert>
        <v-data-table
          :headers="resultHeaders"
          :items="result.generatedPasswords"
          density="compact"
          hide-default-footer
        >
          <template #item.password="{ item }">
            <v-chip label color="warning" variant="tonal" size="small" style="font-family: monospace">
              {{ item.password }}
            </v-chip>
          </template>
        </v-data-table>
      </template>
    </template>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
