<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { LlmProvider, LlmModel, LlmModelConfig } from '@/types/llm'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import { useNavItems } from '@/composables/useNavItems'
import { getApiErrorMessage } from '@/utils/apiError'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/llm-config'))

// ── Tab 状态 ──────────────────────────────────────────────────────────────────
const activeTab = ref('providers')

// ── 确认 Dialog ───────────────────────────────────────────────────────────────
const confirmDialog = ref(false)
const confirmMessage = ref('')
const confirmConfirmText = ref('确认')
const confirmAction = ref<(() => Promise<void>) | null>(null)
const confirmLoading = ref(false)

function openConfirm(message: string, action: () => Promise<void>, confirmText = '确认') {
  confirmMessage.value = message
  confirmConfirmText.value = confirmText
  confirmAction.value = action
  confirmDialog.value = true
}

async function executeConfirm() {
  if (!confirmAction.value) return
  confirmLoading.value = true
  try {
    await confirmAction.value()
  } finally {
    confirmLoading.value = false
    confirmDialog.value = false
  }
}

// ── Snackbar ─────────────────────────────────────────────────────────────────
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

function notify(text: string, color: 'success' | 'error' = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// ── 供应商 ──────────────────────────────────────────────────────────────────
const providers = ref<LlmProvider[]>([])
const loadingProviders = ref(false)
const providerDialog = ref(false)
const savingProvider = ref(false)
const editingProvider = ref<LlmProvider | null>(null)
const providerForm = ref({ name: '', baseUrl: '', apiKey: '' })

const providerHeaders = [
  { title: '名称', key: 'name' },
  { title: 'Base URL', key: 'baseUrl' },
  { title: 'API Key', key: 'apiKeyMasked' },
  { title: '操作', key: 'actions', sortable: false, width: '120px' },
]

async function loadProviders() {
  loadingProviders.value = true
  try {
    const res = await adminApi.getLlmProviders()
    providers.value = res.data ?? []
  } catch {
    notify('加载供应商列表失败', 'error')
  } finally {
    loadingProviders.value = false
  }
}

function openCreateProvider() {
  editingProvider.value = null
  providerForm.value = { name: '', baseUrl: '', apiKey: '' }
  providerDialog.value = true
}

function openEditProvider(p: LlmProvider) {
  editingProvider.value = p
  providerForm.value = { name: p.name, baseUrl: p.baseUrl, apiKey: '' }
  providerDialog.value = true
}

async function saveProvider() {
  savingProvider.value = true
  try {
    if (editingProvider.value) {
      await adminApi.updateLlmProvider(editingProvider.value.id, providerForm.value)
      notify('供应商已更新')
    } else {
      await adminApi.createLlmProvider(providerForm.value)
      notify('供应商创建成功')
    }
    providerDialog.value = false
    await loadProviders()
  } catch (err: unknown) {
    notify(getApiErrorMessage(err, editingProvider.value ? '更新供应商失败' : '创建供应商失败'), 'error')
  } finally {
    savingProvider.value = false
  }
}

function deleteProvider(id: string) {
  openConfirm('确定删除此供应商吗？已关联模型将无法删除。', async () => {
    try {
      await adminApi.deleteLlmProvider(id)
      notify('供应商已删除')
      await loadProviders()
    } catch (err: unknown) {
      notify(getApiErrorMessage(err, '删除供应商失败'), 'error')
    }
  }, '删除')
}

// ── 模型 ────────────────────────────────────────────────────────────────────
const models = ref<LlmModel[]>([])
const loadingModels = ref(false)
const modelDialog = ref(false)
const savingModel = ref(false)
const editingModel = ref<LlmModel | null>(null)
const modelForm = ref({
  providerId: '',
  modelName: '',
  inputPricePerMillion: 0,
  outputPricePerMillion: 0,
})

const modelHeaders = [
  { title: '供应商', key: 'providerName' },
  { title: '模型标识符', key: 'modelName' },
  { title: '输入价格 (元/百万Token)', key: 'inputPricePerMillion', width: '200px' },
  { title: '输出价格 (元/百万Token)', key: 'outputPricePerMillion', width: '200px' },
  { title: '操作', key: 'actions', sortable: false, width: '120px' },
]

/** 模型列表（附带供应商名称，用于显示） */
const modelsWithProvider = computed(() =>
  models.value.map((m) => ({
    ...m,
    providerName: providers.value.find((p) => p.id === m.providerId)?.name ?? m.providerId,
  })),
)

async function loadModels() {
  loadingModels.value = true
  try {
    const res = await adminApi.getLlmModels()
    models.value = res.data ?? []
  } catch {
    notify('加载模型列表失败', 'error')
  } finally {
    loadingModels.value = false
  }
}

function openCreateModel() {
  editingModel.value = null
  modelForm.value = {
    providerId: providers.value[0]?.id ?? '',
    modelName: '',
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
  }
  modelDialog.value = true
}

function openEditModel(m: LlmModel) {
  editingModel.value = m
  modelForm.value = {
    providerId: m.providerId,
    modelName: m.modelName,
    inputPricePerMillion: m.inputPricePerMillion ?? 0,
    outputPricePerMillion: m.outputPricePerMillion ?? 0,
  }
  modelDialog.value = true
}

async function saveModel() {
  savingModel.value = true
  try {
    if (editingModel.value) {
      await adminApi.updateLlmModel(editingModel.value.id, {
        providerId: modelForm.value.providerId,
        modelName: modelForm.value.modelName,
        inputPricePerMillion: modelForm.value.inputPricePerMillion,
        outputPricePerMillion: modelForm.value.outputPricePerMillion,
      })
      notify('模型已更新')
    } else {
      await adminApi.createLlmModel(modelForm.value)
      notify('模型创建成功')
    }
    modelDialog.value = false
    await loadModels()
  } catch (err: unknown) {
    notify(getApiErrorMessage(err, editingModel.value ? '更新模型失败' : '创建模型失败'), 'error')
  } finally {
    savingModel.value = false
  }
}

function deleteModel(id: string) {
  openConfirm('确定删除此模型吗？已被功能配置引用时无法删除。', async () => {
    try {
      await adminApi.deleteLlmModel(id)
      notify('模型已删除')
      await loadModels()
    } catch (err: unknown) {
      notify(getApiErrorMessage(err, '删除模型失败'), 'error')
    }
  }, '删除')
}

// ── 功能配置 ─────────────────────────────────────────────────────────────────
const configs = ref<LlmModelConfig[]>([])
const loadingConfigs = ref(false)
const savingIds = ref(new Set<string>())
const editValues = ref<Record<string, { modelId: string; temperature: number }>>({})
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

const groupedConfigs = computed(() => {
  const groups: Record<string, LlmModelConfig[]> = {}
  for (const c of configs.value) {
    if (!groups[c.functionGroup]) groups[c.functionGroup] = []
    groups[c.functionGroup]!.push(c)
  }
  return groups
})

/** 供 v-select 使用的模型选项，格式：供应商/模型标识符 */
const modelSelectItems = computed(() =>
  models.value.map((m) => ({
    title: `${providers.value.find((p) => p.id === m.providerId)?.name ?? '未知'}/${m.modelName}`,
    value: m.id,
  })),
)

async function loadConfigs() {
  loadingConfigs.value = true
  try {
    const res = await adminApi.getLlmConfigs()
    configs.value = res.data ?? []
    for (const c of configs.value) {
      editValues.value[c.id] = {
        modelId: c.modelId ?? '',
        temperature: c.temperature,
      }
    }
  } catch {
    notify('加载功能配置失败', 'error')
  } finally {
    loadingConfigs.value = false
  }
}

async function saveConfig(c: LlmModelConfig) {
  if (savingIds.value.has(c.id)) return
  const val = editValues.value[c.id]
  if (!val) return
  savingIds.value.add(c.id)
  try {
    await adminApi.updateLlmConfig(c.id, val)
    await loadConfigs()
  } catch (err: unknown) {
    notify(getApiErrorMessage(err, `「${c.displayName}」自动保存失败`), 'error')
  } finally {
    savingIds.value.delete(c.id)
  }
}

function scheduleSave(c: LlmModelConfig, delay = 0) {
  const existing = debounceTimers.get(c.id)
  if (existing) clearTimeout(existing)
  debounceTimers.set(
    c.id,
    setTimeout(() => {
      debounceTimers.delete(c.id)
      saveConfig(c)
    }, delay),
  )
}

function resetConfigs() {
  openConfirm('确定要将所有功能配置重置为默认值吗？', async () => {
    try {
      await adminApi.resetLlmConfigs()
      notify('已重置为默认配置')
      await loadConfigs()
    } catch {
      notify('重置配置失败', 'error')
    }
  }, '确认重置')
}

onMounted(async () => {
  try {
    await loadProviders()
    await loadModels()
    await loadConfigs()
  } catch {
    // 各 load 函数内部已通过 notify 报告具体错误
  }
})
</script>

<template>
  <v-container class="pa-6">
    <PageHeader
      :title="pageItem?.title ?? '模型配置管理'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <v-tabs v-model="activeTab" color="primary">
        <v-tab value="providers">
          <v-icon start>mdi-cloud-outline</v-icon>
          供应商
        </v-tab>
        <v-tab value="models">
          <v-icon start>mdi-robot-outline</v-icon>
          模型
        </v-tab>
        <v-tab value="configs">
          <v-icon start>mdi-cog-outline</v-icon>
          功能配置
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab">
        <!-- 供应商 Tab -->
        <v-window-item value="providers">
          <div class="d-flex align-center px-6 py-4">
            <span class="text-body-2 text-medium-emphasis">共 {{ providers.length }} 个供应商</span>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              :loading="loadingProviders"
              @click="openCreateProvider"
            >
              新增供应商
            </v-btn>
          </div>
          <v-data-table
            :headers="providerHeaders"
            :items="providers"
            :loading="loadingProviders"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                @click="openEditProvider(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                @click="deleteProvider(item.id)"
              />
            </template>
          </v-data-table>
        </v-window-item>

        <!-- 模型 Tab -->
        <v-window-item value="models">
          <div class="d-flex align-center px-6 py-4">
            <span class="text-body-2 text-medium-emphasis">共 {{ models.length }} 个模型</span>
            <v-spacer />
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              :loading="loadingModels"
              @click="openCreateModel"
            >
              新增模型
            </v-btn>
          </div>
          <v-data-table
            :headers="modelHeaders"
            :items="modelsWithProvider"
            :loading="loadingModels"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.inputPricePerMillion="{ item }">
              {{ item.inputPricePerMillion != null ? `¥${item.inputPricePerMillion}` : '-' }}
            </template>
            <template #item.outputPricePerMillion="{ item }">
              {{ item.outputPricePerMillion != null ? `¥${item.outputPricePerMillion}` : '-' }}
            </template>
            <template #item.actions="{ item }">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                @click="openEditModel(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                @click="deleteModel(item.id)"
              />
            </template>
          </v-data-table>
        </v-window-item>

        <!-- 功能配置 Tab -->
        <v-window-item value="configs">
          <div class="d-flex align-center px-6 py-4">
            <span class="text-body-2 text-medium-emphasis">修改后自动保存</span>
            <v-spacer />
            <v-btn
              variant="tonal"
              color="warning"
              prepend-icon="mdi-restore"
              :loading="loadingConfigs"
              @click="resetConfigs"
            >
              重置为默认
            </v-btn>
          </div>
          <v-divider />
          <div class="pa-4">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel
                v-for="(groupItems, groupName) in groupedConfigs"
                :key="groupName"
                :value="groupName"
              >
                <v-expansion-panel-title class="text-subtitle-2 font-weight-medium">
                  {{ groupName }}
                  <template #actions="{ expanded }">
                    <v-chip size="x-small" class="mr-2">{{ groupItems.length }}</v-chip>
                    <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="pt-2 pb-3">
                  <div
                    v-for="c in groupItems"
                    :key="c.id"
                    class="config-item d-flex align-center gap-4 py-3 px-2 rounded"
                  >
                    <!-- 功能名 -->
                    <div class="config-label">
                      <div class="text-body-2 font-weight-medium">{{ c.displayName }}</div>
                    </div>

                    <!-- 模型选择 -->
                    <div class="config-model">
                      <v-select
                        v-if="editValues[c.id]"
                        v-model="editValues[c.id]!.modelId"
                        :items="modelSelectItems"
                        label="模型"
                        density="comfortable"
                        variant="outlined"
                        hide-details
                        @update:model-value="scheduleSave(c)"
                      />
                    </div>

                    <!-- 温度 -->
                    <div class="config-temp">
                      <div class="text-caption text-medium-emphasis mb-1">
                        温度 {{ editValues[c.id]?.temperature?.toFixed(1) }}
                      </div>
                      <div v-if="editValues[c.id]" class="d-flex align-center gap-3">
                        <v-slider
                          v-model="editValues[c.id]!.temperature"
                          :min="0"
                          :max="2"
                          :step="0.1"
                          density="comfortable"
                          hide-details
                          color="primary"
                          class="flex-grow-1"
                          @end="scheduleSave(c, 300)"
                        />
                      </div>
                    </div>

                    <!-- 保存状态 -->
                    <div style="width: 20px; flex-shrink: 0">
                      <v-progress-circular
                        v-if="savingIds.has(c.id)"
                        indeterminate
                        size="16"
                        width="2"
                        color="primary"
                      />
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-window-item>
      </v-window>

    <!-- 供应商编辑 Dialog -->
    <v-dialog v-model="providerDialog" max-width="520">
      <v-card>
        <v-card-title class="px-6 pt-6 pb-2">
          {{ editingProvider ? '编辑供应商' : '新增供应商' }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <v-text-field
            v-model="providerForm.name"
            label="供应商名称"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model="providerForm.baseUrl"
            label="API Base URL"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model="providerForm.apiKey"
            label="API Key"
            type="password"
            variant="outlined"
            :placeholder="editingProvider ? '留空表示不修改' : ''"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5 pt-3">
          <v-spacer />
          <v-btn variant="text" @click="providerDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingProvider" @click="saveProvider">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 模型编辑 Dialog -->
    <v-dialog v-model="modelDialog" max-width="520">
      <v-card>
        <v-card-title class="px-6 pt-6 pb-2">
          {{ editingModel ? '编辑模型' : '新增模型' }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <v-select
            v-model="modelForm.providerId"
            :items="providers.map((p) => ({ title: p.name, value: p.id }))"
            label="所属供应商"
            variant="outlined"
            class="mb-4"
          />
          <v-text-field
            v-model="modelForm.modelName"
            label="模型标识符（如 deepseek-v3.2）"
            variant="outlined"
            class="mb-4"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="modelForm.inputPricePerMillion"
                label="输入价格（元/百万Token）"
                variant="outlined"
                type="number"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="modelForm.outputPricePerMillion"
                label="输出价格（元/百万Token）"
                variant="outlined"
                type="number"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-5 pt-1">
          <v-spacer />
          <v-btn variant="text" @click="modelDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingModel" @click="saveModel">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 通用确认 Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-body-1 font-weight-bold pt-6 px-6">操作确认</v-card-title>
        <v-card-text class="px-6 pb-4">{{ confirmMessage }}</v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" :disabled="confirmLoading" @click="confirmDialog = false">
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="tonal"
            :loading="confirmLoading"
            @click="executeConfirm"
          >
            {{ confirmConfirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 全局通知 Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" :timeout="3000">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.config-item {
  border: 1px solid transparent;
  transition: background-color 0.15s;
}
.config-item:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.4);
}
.config-label {
  width: 160px;
  flex-shrink: 0;
}
.config-model {
  width: 260px;
  flex-shrink: 0;
}
.config-temp {
  flex: 1;
  min-width: 200px;
}
</style>
