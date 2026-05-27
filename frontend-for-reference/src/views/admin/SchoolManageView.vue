<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ApiResponse, PageData } from '@/types/api'
import type { School } from '@/types/school'
import * as adminApi from '@/api/admin'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/admin/schools'))

const schools = ref<School[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalElements = ref(0)

// 对话框状态
const createDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const createUserDialog = ref(false)
const studentsDialog = ref(false)

const selectedSchool = ref<School | null>(null)

// 表单数据
const createForm = ref({ name: '', description: '' })
const editForm = ref({ name: '', description: '' })
const userForm = ref({ username: '', password: '' })
const actionLoading = ref(false)

// 该学校的学生列表
const schoolStudents = ref<Array<{ userId: string; username: string; hasProfile: boolean }>>([])
const studentsLoading = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = [
  { title: '学校名称', key: 'name' },
  { title: '邀请码', key: 'inviteCode', width: '140px' },
  { title: '描述', key: 'description' },
  { title: '创建时间', key: 'createdAt', width: '160px' },
  { title: '操作', key: 'actions', sortable: false, width: '260px' },
]

async function loadSchools() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await adminApi.getSchoolList({
      page: currentPage.value - 1,
      size: pageSize.value,
    })) as unknown as ApiResponse<PageData<School>>
    schools.value = res.data?.content || []
    totalElements.value = res.data?.page?.totalElements || 0
  } catch {
    schools.value = []
    fetchError.value = '加载学校列表失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  actionLoading.value = true
  try {
    await adminApi.createSchool(createForm.value)
    createDialog.value = false
    createForm.value = { name: '', description: '' }
    showMessage('学校创建成功')
    loadSchools()
  } catch {
    showMessage('创建失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

function openEdit(school: School) {
  selectedSchool.value = school
  editForm.value = { name: school.name, description: school.description || '' }
  editDialog.value = true
}

async function handleEdit() {
  if (!selectedSchool.value) return
  actionLoading.value = true
  try {
    await adminApi.updateSchool(selectedSchool.value.id, editForm.value)
    editDialog.value = false
    showMessage('更新成功')
    loadSchools()
  } catch {
    showMessage('更新失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

function openDelete(school: School) {
  selectedSchool.value = school
  deleteDialog.value = true
}

async function handleDelete() {
  if (!selectedSchool.value) return
  actionLoading.value = true
  try {
    await adminApi.deleteSchool(selectedSchool.value.id)
    deleteDialog.value = false
    showMessage('删除成功')
    loadSchools()
  } catch {
    showMessage('删除失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

async function handleRegenerateCode(school: School) {
  try {
    await adminApi.regenerateInviteCode(school.id)
    showMessage('邀请码已重新生成')
    loadSchools()
  } catch {
    showMessage('操作失败', 'error')
  }
}

function openCreateUser(school: School) {
  selectedSchool.value = school
  userForm.value = { username: '', password: '' }
  createUserDialog.value = true
}

async function handleCreateUser() {
  if (!selectedSchool.value) return
  actionLoading.value = true
  try {
    await adminApi.createSchoolUser(selectedSchool.value.id, userForm.value)
    createUserDialog.value = false
    showMessage('学校账号创建成功')
  } catch {
    showMessage('创建失败，用户名可能已存在', 'error')
  } finally {
    actionLoading.value = false
  }
}

async function openStudents(school: School) {
  selectedSchool.value = school
  studentsDialog.value = true
  studentsLoading.value = true
  try {
    const res = (await adminApi.getSchoolStudents(school.id, {
      page: 0,
      size: 100,
    })) as unknown as ApiResponse<PageData<{ userId: string; username: string; hasProfile: boolean }>>
    schoolStudents.value = res.data?.content || []
  } catch {
    schoolStudents.value = []
  } finally {
    studentsLoading.value = false
  }
}

function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString('zh-CN') : '-'
}

function showMessage(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(() => loadSchools())
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '学校管理'"
      :icon="pageItem?.icon"
      :description="pageItem?.description"
    >
      <template #actions>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="createDialog = true">
          新建学校
        </v-btn>
      </template>
    </PageHeader>

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadSchools"
    />
    <v-card v-else>
      <v-data-table-server
        :headers="headers"
        :items="schools"
        :items-length="totalElements"
        :loading="loading"
        :items-per-page="pageSize"
        :items-per-page-options="[]"
        v-model:page="currentPage"
        @update:page="loadSchools"
      >
        <template #item.inviteCode="{ item }">
          <v-chip label variant="tonal" color="primary" size="small" style="font-family: monospace">
            {{ item.inviteCode }}
          </v-chip>
        </template>

        <template #item.description="{ item }">
          <span class="text-body-2">{{ item.description || '-' }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn size="small" variant="text" color="primary" @click="openEdit(item)">编辑</v-btn>
            <v-btn size="small" variant="text" @click="handleRegenerateCode(item)">换邀请码</v-btn>
            <v-btn size="small" variant="text" color="blue" @click="openCreateUser(item)">创建账号</v-btn>
            <v-btn size="small" variant="text" @click="openStudents(item)">学生</v-btn>
            <v-btn size="small" variant="text" color="error" @click="openDelete(item)">删除</v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 新建学校对话框 -->
    <v-dialog v-model="createDialog" max-width="500">
      <v-card>
        <v-card-title>新建学校</v-card-title>
        <v-card-text>
          <v-text-field v-model="createForm.name" label="学校名称" variant="outlined" density="compact" class="mb-3" />
          <v-textarea v-model="createForm.description" label="描述（选填）" variant="outlined" density="compact" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="createDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="actionLoading" @click="handleCreate">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 编辑学校对话框 -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>编辑学校</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.name" label="学校名称" variant="outlined" density="compact" class="mb-3" />
          <v-textarea v-model="editForm.description" label="描述" variant="outlined" density="compact" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="actionLoading" @click="handleEdit">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确认删除学校「{{ selectedSchool?.name }}」？删除后关联学生的学校绑定将被清除。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" :loading="actionLoading" @click="handleDelete">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 创建学校账号对话框 -->
    <v-dialog v-model="createUserDialog" max-width="500">
      <v-card>
        <v-card-title>创建学校账号</v-card-title>
        <v-card-subtitle>为「{{ selectedSchool?.name }}」创建 SCHOOL 角色账号</v-card-subtitle>
        <v-card-text>
          <v-text-field v-model="userForm.username" label="用户名" variant="outlined" density="compact" class="mb-3" />
          <v-text-field v-model="userForm.password" label="密码" type="password" variant="outlined" density="compact" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="createUserDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="actionLoading" @click="handleCreateUser">创建</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 学生列表对话框 -->
    <v-dialog v-model="studentsDialog" max-width="600">
      <v-card>
        <v-card-title>{{ selectedSchool?.name }} — 学生列表</v-card-title>
        <v-card-text>
          <v-progress-linear v-if="studentsLoading" indeterminate class="mb-2" />
          <v-list v-if="!studentsLoading" density="compact">
            <div v-if="schoolStudents.length === 0" class="text-grey text-center py-4">
              暂无学生
            </div>
            <v-list-item
              v-for="s in schoolStudents"
              :key="s.userId"
              :title="s.username"
            >
              <template #append>
                <v-chip
                  :color="s.hasProfile ? 'success' : 'default'"
                  size="small"
                  variant="tonal"
                >
                  {{ s.hasProfile ? '有画像' : '无画像' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="studentsDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
