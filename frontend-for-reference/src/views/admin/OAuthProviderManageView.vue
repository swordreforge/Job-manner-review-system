<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ApiResponse, PageData } from '@/types/api'
import * as adminApi from '@/api/admin'
import type { OAuthProviderAdmin } from '@/types/auth'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/oauth-providers'))

// ── 列表 ──
const providers = ref<OAuthProviderAdmin[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)

const headers = [
  { title: '显示名', key: 'displayName' },
  { title: '标识符', key: 'name', width: '120px' },
  { title: '图标', key: 'icon', width: '60px', sortable: false },
  { title: '状态', key: 'enabled', width: '100px' },
  { title: '操作', key: 'actions', sortable: false, width: '160px' },
]

async function loadProviders() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await adminApi.getOAuthProviders({
      page: currentPage.value - 1,
      size: pageSize.value,
    })) as unknown as ApiResponse<PageData<OAuthProviderAdmin>>
    providers.value = res.data?.content || []
    totalElements.value = res.data?.page?.totalElements || 0
  } catch {
    providers.value = []
    fetchError.value = '加载 OAuth 提供商列表失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadProviders())

// ── 新增/编辑对话框 ──
const formDialog = ref(false)
const formLoading = ref(false)
const isEdit = ref(false)
const editId = ref('')

const emptyForm = () => ({
  name: '',
  displayName: '',
  icon: 'mdi-key',
  clientId: '',
  clientSecret: '',
  authorizationUri: '',
  tokenUri: '',
  userInfoUri: '',
  scopes: '',
  userIdField: 'id',
  usernameField: 'login',
  enabled: true,
})
const form = ref(emptyForm())

/** 回调地址 = 当前站点 origin + 固定前缀 + provider name */
const computedRedirectUri = computed(() => {
  const name = form.value.name || '{provider}'
  return `${window.location.origin}/oauth2/callback/${name}`
})

function copyRedirectUri() {
  window.navigator.clipboard.writeText(computedRedirectUri.value)
  showMessage('已复制到剪贴板')
}

function openCreateDialog() {
  isEdit.value = false
  editId.value = ''
  form.value = emptyForm()
  formDialog.value = true
}

function openEditDialog(item: OAuthProviderAdmin) {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    name: item.name,
    displayName: item.displayName,
    icon: item.icon,
    clientId: item.clientId,
    clientSecret: '', // 不回显
    authorizationUri: item.authorizationUri,
    tokenUri: item.tokenUri,
    userInfoUri: item.userInfoUri,
    scopes: item.scopes,
    userIdField: item.userIdField,
    usernameField: item.usernameField,
    enabled: item.enabled,
  }
  formDialog.value = true
}

async function submitForm() {
  if (!form.value.name || !form.value.displayName || !form.value.clientId) {
    showMessage('请填写必填项', 'error')
    return
  }
  if (!isEdit.value && !form.value.clientSecret) {
    showMessage('Client Secret 不能为空', 'error')
    return
  }
  formLoading.value = true
  try {
    if (isEdit.value) {
      await adminApi.updateOAuthProvider(editId.value, form.value as Record<string, unknown>)
      showMessage('提供商已更新')
    } else {
      await adminApi.createOAuthProvider(form.value as Record<string, unknown>)
      showMessage('提供商已创建')
    }
    formDialog.value = false
    loadProviders()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '操作失败', 'error')
  } finally {
    formLoading.value = false
  }
}

// ── 快捷模板 ──
interface ProviderTemplate {
  label: string
  icon: string
  data: Partial<ReturnType<typeof emptyForm>>
}

const templates: ProviderTemplate[] = [
  {
    label: 'GitHub',
    icon: 'mdi-github',
    data: {
      name: 'github',
      displayName: 'GitHub',
      icon: 'mdi-github',
      authorizationUri: 'https://github.com/login/oauth/authorize',
      tokenUri: 'https://github.com/login/oauth/access_token',
      userInfoUri: 'https://api.github.com/user',
      scopes: 'read:user',
      userIdField: 'id',
      usernameField: 'login',
    },
  },
  {
    label: '企业微信',
    icon: 'mdi-wechat',
    data: {
      name: 'wecom',
      displayName: '企业微信',
      icon: 'mdi-wechat',
      authorizationUri: 'https://open.weixin.qq.com/connect/oauth2/authorize',
      tokenUri: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
      userInfoUri: 'https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo',
      scopes: 'snsapi_base',
      userIdField: 'UserId',
      usernameField: 'UserId',
    },
  },
  {
    label: '钉钉',
    icon: 'mdi-message-text',
    data: {
      name: 'dingtalk',
      displayName: '钉钉',
      icon: 'mdi-message-text',
      authorizationUri: 'https://login.dingtalk.com/oauth2/auth',
      tokenUri: 'https://api.dingtalk.com/v1.0/oauth2/userAccessToken',
      userInfoUri: 'https://api.dingtalk.com/v1.0/contact/users/me',
      scopes: 'openid',
      userIdField: 'openId',
      usernameField: 'nick',
    },
  },
  {
    label: '飞书',
    icon: 'mdi-bird',
    data: {
      name: 'feishu',
      displayName: '飞书',
      icon: 'mdi-bird',
      authorizationUri: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
      tokenUri: 'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token',
      userInfoUri: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
      scopes: '',
      userIdField: 'data.open_id',
      usernameField: 'data.name',
    },
  },
]

function applyTemplate(tpl: ProviderTemplate) {
  form.value = { ...form.value, ...tpl.data }
}

// ── 启用/禁用 ──
async function toggleEnabled(item: OAuthProviderAdmin) {
  try {
    await adminApi.toggleOAuthProvider(item.id)
    loadProviders()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '操作失败', 'error')
  }
}

// ── 删除 ──
const deleteDialog = ref(false)
const deleteTarget = ref<OAuthProviderAdmin | null>(null)
const deleteLoading = ref(false)

function openDeleteDialog(item: OAuthProviderAdmin) {
  deleteTarget.value = item
  deleteDialog.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await adminApi.deleteOAuthProvider(deleteTarget.value.id)
    showMessage('提供商已删除')
    deleteDialog.value = false
    loadProviders()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '删除失败', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// ── 消息 ──
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showMessage(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}
</script>

<template>
  <v-container class="py-6">
    <PageHeader :title="pageItem?.title ?? 'OAuth 提供商管理'" :icon="pageItem?.icon" :description="pageItem?.description">
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreateDialog">
          新增提供商
        </v-btn>
      </template>
    </PageHeader>

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadProviders"
    />
    <v-card v-else>
      <v-data-table-server
        :headers="headers"
        :items="providers"
        :items-length="totalElements"
        :loading="loading"
        :items-per-page="pageSize"
        :items-per-page-options="[]"
        v-model:page="currentPage"
        @update:page="loadProviders"
      >
        <template #item.icon="{ item }">
          <v-icon>{{ item.icon }}</v-icon>
        </template>

        <template #item.enabled="{ item }">
          <v-switch
            :model-value="item.enabled"
            color="success"
            density="compact"
            hide-details
            @update:model-value="toggleEnabled(item)"
          />
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click="openEditDialog(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
          />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 新增/编辑对话框 -->
    <v-dialog v-model="formDialog" max-width="680" persistent scrollable>
      <v-card>
        <v-card-title>{{ isEdit ? '编辑提供商' : '新增提供商' }}</v-card-title>
        <v-card-text style="max-height: 70vh">
          <!-- 快捷模板 -->
          <div v-if="!isEdit" class="mb-4">
            <div class="text-body-2 text-grey mb-2">快捷模板（点击自动填入常用配置）</div>
            <div class="d-flex ga-2 flex-wrap">
              <v-chip
                v-for="tpl in templates"
                :key="tpl.label"
                :prepend-icon="tpl.icon"
                variant="outlined"
                color="primary"
                @click="applyTemplate(tpl)"
              >
                {{ tpl.label }}
              </v-chip>
            </div>
          </div>

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.name"
                label="标识符 *"
                variant="outlined"
                density="comfortable"
                hint="如 github, wecom"
                persistent-hint
                :disabled="isEdit"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.displayName"
                label="显示名 *"
                variant="outlined"
                density="comfortable"
                hint="如 GitHub, 企业微信"
                persistent-hint
              />
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.icon"
                label="图标 (MDI)"
                variant="outlined"
                density="comfortable"
                :prepend-inner-icon="form.icon || 'mdi-key'"
                hint="如 mdi-github"
                persistent-hint
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.scopes"
                label="Scopes"
                variant="outlined"
                density="comfortable"
                hint="如 read:user,email"
                persistent-hint
              />
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.clientId"
                label="Client ID *"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.clientSecret"
                :label="isEdit ? 'Client Secret（留空不修改）' : 'Client Secret *'"
                variant="outlined"
                density="comfortable"
                type="password"
              />
            </v-col>
          </v-row>

          <v-text-field
            v-model="form.authorizationUri"
            label="授权端点 (Authorization URI) *"
            variant="outlined"
            density="comfortable"
            class="mb-1"
          />
          <v-text-field
            v-model="form.tokenUri"
            label="Token 端点 (Token URI) *"
            variant="outlined"
            density="comfortable"
            class="mb-1"
          />
          <v-text-field
            v-model="form.userInfoUri"
            label="用户信息端点 (User Info URI) *"
            variant="outlined"
            density="comfortable"
            class="mb-1"
          />
          <v-text-field
            :model-value="computedRedirectUri"
            label="回调地址 (Redirect URI)"
            variant="outlined"
            density="comfortable"
            readonly
            bg-color="grey-lighten-4"
            hint="自动生成，请将此地址填入第三方平台的回调配置"
            persistent-hint
            class="mb-1"
          >
            <template #append-inner>
              <v-btn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                @click="copyRedirectUri"
              />
            </template>
          </v-text-field>

          <v-divider class="my-3" />

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="form.userIdField"
                label="用户 ID 字段"
                variant="outlined"
                density="comfortable"
                hint="JSON 响应中的字段路径"
                persistent-hint
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.usernameField"
                label="用户名字段"
                variant="outlined"
                density="comfortable"
                hint="JSON 响应中的字段路径"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="formLoading" @click="submitForm">
            {{ isEdit ? '保存' : '创建' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除提供商
          <strong>{{ deleteTarget?.displayName }}</strong>
          吗？已通过该提供商绑定的用户将无法使用该方式登录。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteLoading" @click="submitDelete"
            >删除</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
