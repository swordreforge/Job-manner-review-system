<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ApiResponse, PageData } from '@/types/api'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/users'))

// ── 用户列表 ──
interface UserItem {
  id: string
  username: string
  role: string
  createdAt: string
  updatedAt: string
}

const users = ref<UserItem[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)

const headers = [
  { title: '用户名', key: 'username' },
  { title: '角色', key: 'role', width: '120px' },
  { title: '创建时间', key: 'createdAt', width: '180px' },
  { title: '操作', key: 'actions', sortable: false, width: '180px' },
]

async function loadUsers() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await adminApi.getUserList({
      page: currentPage.value - 1,
      size: pageSize.value,
    })) as unknown as ApiResponse<PageData<UserItem>>
    users.value = res.data?.content || []
    totalElements.value = res.data?.page?.totalElements || 0
  } catch {
    users.value = []
    fetchError.value = '加载用户列表失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadUsers())

// ── 新增用户对话框 ──
const createDialog = ref(false)
const createForm = ref({ username: '', password: '' })
const createLoading = ref(false)
const showCreatePassword = ref(false)

function openCreateDialog() {
  createForm.value = { username: '', password: '' }
  showCreatePassword.value = false
  createDialog.value = true
}

async function submitCreate() {
  if (!createForm.value.username || !createForm.value.password) {
    showMessage('请填写完整信息', 'error')
    return
  }
  createLoading.value = true
  try {
    await adminApi.createUser(createForm.value)
    showMessage('用户创建成功')
    createDialog.value = false
    loadUsers()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '创建失败', 'error')
  } finally {
    createLoading.value = false
  }
}

// ── 编辑用户对话框 ──
const editDialog = ref(false)
const editForm = ref({ id: '', username: '', password: '' })
const editLoading = ref(false)
const showEditPassword = ref(false)

function openEditDialog(user: UserItem) {
  editForm.value = { id: user.id, username: user.username, password: '' }
  showEditPassword.value = false
  editDialog.value = true
}

async function submitEdit() {
  if (!editForm.value.username) {
    showMessage('用户名不能为空', 'error')
    return
  }
  editLoading.value = true
  try {
    const data: Record<string, string> = { username: editForm.value.username }
    if (editForm.value.password) {
      data.password = editForm.value.password
    }
    await adminApi.updateUser(editForm.value.id, data)
    showMessage('用户信息已更新')
    editDialog.value = false
    loadUsers()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '更新失败', 'error')
  } finally {
    editLoading.value = false
  }
}

// ── 删除用户 ──
const deleteDialog = ref(false)
const deleteTarget = ref<UserItem | null>(null)
const deleteLoading = ref(false)

function openDeleteDialog(user: UserItem) {
  deleteTarget.value = user
  deleteDialog.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await adminApi.deleteUser(deleteTarget.value.id)
    showMessage('用户已删除')
    deleteDialog.value = false
    loadUsers()
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '删除失败', 'error')
  } finally {
    deleteLoading.value = false
  }
}

// ── 消息提示 ──
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

function showMessage(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

function roleLabel(role: string) {
  if (role === 'ADMIN') return '管理员'
  if (role === 'SCHOOL') return '学校'
  return '学生'
}

function roleColor(role: string) {
  if (role === 'ADMIN') return 'error'
  if (role === 'SCHOOL') return 'warning'
  return 'primary'
}
</script>

<template>
  <v-container class="py-6">
    <PageHeader :title="pageItem?.title ?? '用户管理'" :description="pageItem?.description" :icon="pageItem?.icon">
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreateDialog">
          新增用户
        </v-btn>
      </template>
    </PageHeader>

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadUsers"
    />
    <v-card v-else>
      <v-data-table-server
        :headers="headers"
        :items="users"
        :items-length="totalElements"
        :loading="loading"
        :items-per-page="pageSize"
        :items-per-page-options="[]"
        v-model:page="currentPage"
        @update:page="loadUsers"
      >
        <template #item.role="{ item }">
          <v-chip :color="roleColor(item.role)" size="small" variant="flat">
            {{ roleLabel(item.role) }}
          </v-chip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
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
            :disabled="item.role === 'ADMIN'"
            @click="openDeleteDialog(item)"
          />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 新增用户对话框 -->
    <v-dialog v-model="createDialog" max-width="460" persistent>
      <v-card>
        <v-card-title>新增用户</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="createForm.username"
            label="用户名"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account"
            counter="50"
            maxlength="50"
            class="mb-2"
            hint="3-50 个字符"
          />
          <v-text-field
            v-model="createForm.password"
            label="密码"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock"
            :type="showCreatePassword ? 'text' : 'password'"
            :append-inner-icon="showCreatePassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showCreatePassword = !showCreatePassword"
            hint="至少 6 个字符"
          />
          <v-alert type="info" variant="tonal" density="compact" class="mt-2">
            新用户角色默认为「学生」，不可创建管理员账号。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="createLoading" @click="submitCreate">
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑用户对话框 -->
    <v-dialog v-model="editDialog" max-width="460" persistent>
      <v-card>
        <v-card-title>编辑用户</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editForm.username"
            label="用户名"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account"
            counter="50"
            maxlength="50"
            class="mb-2"
          />
          <v-text-field
            v-model="editForm.password"
            label="新密码（留空则不修改）"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock"
            :type="showEditPassword ? 'text' : 'password'"
            :append-inner-icon="showEditPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showEditPassword = !showEditPassword"
            hint="至少 6 个字符，留空不修改密码"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="editLoading" @click="submitEdit">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除用户
          <strong>{{ deleteTarget?.username }}</strong>
          吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteLoading" @click="submitDelete">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
