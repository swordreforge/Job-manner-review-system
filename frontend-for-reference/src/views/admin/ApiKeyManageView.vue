<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ApiResponse } from '@/types/api'
import type { ApiKeyListItem, ApiKeyCreated, CreateApiKeyForm } from '@/types/apiKey'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/api-keys'))

// ── 密钥列表 ──
const keys = ref<ApiKeyListItem[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)

async function loadKeys() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await adminApi.getApiKeyList()) as unknown as ApiResponse<ApiKeyListItem[]>
    keys.value = res.data ?? []
  } catch {
    fetchError.value = '加载 API 密钥列表失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

// ── 创建对话框 ──
const createDialog = ref(false)
const creating = ref(false)
const form = ref<CreateApiKeyForm>({
  name: '',
  expiresAt: null,
  rateLimit: 60,
  allowedIps: null,
  permissions: null,
})

// 日期时间选择器辅助状态
const expiresAtMenu = ref(false)
const expiresDate = ref<Date | null>(null)
const expiresTime = ref('23:59')

function toExpiresDateDisplay(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildExpiresAt(): string | null {
  if (!expiresDate.value) return null
  const dateStr = toExpiresDateDisplay(expiresDate.value)
  const timeStr = expiresTime.value || '23:59'
  return `${dateStr}T${timeStr}:00`
}

async function handleCreate() {
  if (!form.value.name.trim()) return
  creating.value = true
  try {
    const res = (await adminApi.createApiKey({
      name: form.value.name,
      expiresAt: buildExpiresAt(),
      rateLimit: form.value.rateLimit,
      allowedIps: form.value.allowedIps || null,
      permissions: form.value.permissions || null,
    })) as unknown as ApiResponse<ApiKeyCreated>
    createDialog.value = false
    // 展示一次性密钥
    newCreatedKey.value = res.data!
    showKeyDialog.value = true
    resetForm()
    await loadKeys()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showSnackbar(e.response?.data?.message || '创建失败', 'error')
  } finally {
    creating.value = false
  }
}

function resetForm() {
  form.value = { name: '', expiresAt: null, rateLimit: 60, allowedIps: null, permissions: null }
  expiresDate.value = null
  expiresTime.value = '23:59'
}

// ── 一次性密钥展示对话框 ──
const showKeyDialog = ref(false)
const newCreatedKey = ref<ApiKeyCreated | null>(null)
const keyCopied = ref(false)

async function copyKey() {
  if (!newCreatedKey.value?.rawKey) return
  await navigator.clipboard.writeText(newCreatedKey.value.rawKey)
  keyCopied.value = true
  setTimeout(() => (keyCopied.value = false), 2000)
}

// ── 删除 ──
const deleteDialog = ref(false)
const deleteTargetId = ref('')
const deleteTargetName = ref('')
const deleting = ref(false)

function confirmDelete(key: ApiKeyListItem) {
  deleteTargetId.value = key.id
  deleteTargetName.value = key.name
  deleteDialog.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await adminApi.deleteApiKey(deleteTargetId.value)
    deleteDialog.value = false
    showSnackbar('密钥已删除')
    await loadKeys()
  } catch {
    showSnackbar('删除失败', 'error')
  } finally {
    deleting.value = false
  }
}

// ── 启用/禁用 ──
const toggling = ref<string | null>(null)

async function handleToggle(key: ApiKeyListItem) {
  toggling.value = key.id
  try {
    await adminApi.toggleApiKey(key.id)
    await loadKeys()
  } catch {
    showSnackbar('操作失败', 'error')
  } finally {
    toggling.value = null
  }
}

// ── 工具 ──
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showSnackbar(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('zh-CN', { hour12: false })
}

onMounted(loadKeys)
</script>

<template>
  <v-container>
    <PageHeader :title="pageItem?.title ?? 'API 密钥管理'" :icon="pageItem?.icon" :description="pageItem?.description">
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="createDialog = true">
          创建密钥
        </v-btn>
      </template>
    </PageHeader>

    <p class="text-body-2 text-grey mb-4">
      通过 API 密钥，外部系统可以使用 <code>X-API-Key</code> 请求头调用
      <code>/api/open/**</code> 端点提交岗位数据。
    </p>

    <!-- 密钥列表 -->
    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadKeys"
    />
    <v-card v-else flat>
      <v-data-table
        :headers="[
          { title: '名称', key: 'name', sortable: false },
          { title: '前缀', key: 'keyPrefix', sortable: false },
          { title: '状态', key: 'enabled', sortable: false },
          { title: '最后使用', key: 'lastUsedAt', sortable: false },
          { title: '使用次数', key: 'usageCount', sortable: false },
          { title: '过期时间', key: 'expiresAt', sortable: false },
          { title: '速率限制', key: 'rateLimit', sortable: false },
          { title: '操作', key: 'actions', sortable: false },
        ]"
        :items="keys"
        :loading="loading"
        no-data-text="暂无 API 密钥"
      >
        <template #item.enabled="{ item }">
          <v-chip :color="item.enabled ? 'success' : 'error'" size="small">
            {{ item.enabled ? '启用' : '禁用' }}
          </v-chip>
        </template>

        <template #item.lastUsedAt="{ item }">
          {{ formatDate(item.lastUsedAt) }}
        </template>

        <template #item.expiresAt="{ item }">
          <span :class="item.expiresAt && new Date(item.expiresAt) < new Date() ? 'text-error' : ''">
            {{ formatDate(item.expiresAt) }}
          </span>
        </template>

        <template #item.rateLimit="{ item }"> {{ item.rateLimit }} 次/分钟 </template>

        <template #item.actions="{ item }">
          <v-btn
            size="small"
            :color="item.enabled ? 'warning' : 'success'"
            variant="text"
            :loading="toggling === item.id"
            @click="handleToggle(item)"
          >
            {{ item.enabled ? '禁用' : '启用' }}
          </v-btn>
          <v-btn size="small" color="error" variant="text" @click="confirmDelete(item)">
            删除
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 创建对话框 -->
    <v-dialog v-model="createDialog" max-width="500">
      <v-card>
        <v-card-title>创建 API 密钥</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="密钥名称"
            variant="outlined"
            density="compact"
            class="mb-3"
            required
          />
          <v-menu
            v-model="expiresAtMenu"
            :close-on-content-click="false"
            transition="scale-transition"
          >
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="toExpiresDateDisplay(expiresDate)"
                label="过期日期（留空表示永不过期）"
                variant="outlined"
                density="compact"
                readonly
                clearable
                prepend-inner-icon="mdi-calendar"
                class="mb-3"
                style="cursor: pointer"
                @click="expiresAtMenu = true"
                @click:clear="expiresDate = null"
              />
            </template>
            <v-date-picker
              v-model="expiresDate"
              hide-header
              color="primary"
              @update:model-value="expiresAtMenu = false"
            />
          </v-menu>
          <v-text-field
            v-model="expiresTime"
            label="过期时间点"
            type="time"
            variant="outlined"
            density="compact"
            class="mb-3"
            :disabled="!expiresDate"
          />
          <v-text-field
            v-model.number="form.rateLimit"
            label="速率限制（次/分钟）"
            type="number"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="form.allowedIps"
            label='IP 白名单（JSON 数组，如 ["1.2.3.4"]，留空不限制）'
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="form.permissions"
            label='权限范围（如 ["job:upload"]，可留空）'
            variant="outlined"
            density="compact"
          />
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" @click="createDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            :disabled="!form.name.trim()"
            @click="handleCreate"
          >
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 一次性密钥展示对话框 -->
    <v-dialog v-model="showKeyDialog" max-width="520" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
          密钥创建成功
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            此密钥仅展示一次，请立即复制保存。关闭后将无法再次查看。
          </v-alert>
          <div class="text-caption text-grey mb-1">API 密钥</div>
          <code
            class="text-body-2 pa-2 rounded d-block"
            style="background: #f5f5f5; word-break: break-all"
          >
            {{ newCreatedKey?.rawKey }}
          </code>
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn
            :color="keyCopied ? 'success' : 'primary'"
            variant="tonal"
            :prepend-icon="keyCopied ? 'mdi-check' : 'mdi-content-copy'"
            @click="copyKey"
          >
            {{ keyCopied ? '已复制' : '复制' }}
          </v-btn>
          <v-btn color="primary" @click="showKeyDialog = false"> 我已保存，关闭 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除密钥 <strong>{{ deleteTargetName }}</strong> 吗？删除后无法恢复。
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDelete">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 全局提示 -->
    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
