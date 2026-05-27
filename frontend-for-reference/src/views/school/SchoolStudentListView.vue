<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import type { SchoolStudentListItem } from '@/types/school'
import * as schoolApi from '@/api/school'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const router = useRouter()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/school/students'))

// ── 列表数据 ──
const students = ref<SchoolStudentListItem[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const page = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)

// ── 多选 ──
const selected = ref<SchoolStudentListItem[]>([])

// ── 筛选面板 ──
const showFilter = ref(false)
const keyword = ref('')
const scoreRange = ref<[number, number]>([0, 100])
const completenessRange = ref<[number, number]>([0, 100])
const selectedMajors = ref<string[]>([])
const hasProfile = ref<boolean | null>(null)
const hasMatch = ref<boolean | null>(null)
const activityStatusFilter = ref<string>('')
const sortBy = ref('createdAt')
const sortDir = ref('desc')
const majorsOptions = ref<string[]>([])

const ACTIVITY_OPTIONS = [
  { title: '全部', value: '' },
  { title: '活跃（7天内）', value: 'active' },
  { title: '一般（7-30天）', value: 'normal' },
  { title: '沉默（30天+）', value: 'silent' },
  { title: '从未活跃', value: 'new' },
]
const SORT_OPTIONS = [
  { title: '注册时间', value: 'createdAt' },
  { title: '竞争力评分', value: 'competitivenessScore' },
  { title: '画像完成度', value: 'completenessScore' },
  { title: '最后活跃时间', value: 'lastActiveAt' },
]

const ACTIVITY_CHIP_CONFIG = {
  active: { color: 'success', label: '活跃' },
  normal: { color: 'warning', label: '一般' },
  silent: { color: 'error', label: '沉默' },
  new: { color: 'grey', label: '未活跃' },
} as const

const headers = computed(() => [
  { title: '', key: 'data-table-select', width: '50px' },
  { title: '用户名', key: 'username', width: '140px' },
  { title: '专业', key: 'major', width: '180px' },
  { title: '画像完成度', key: 'completenessScore', width: '140px' },
  { title: '竞争力评分', key: 'competitivenessScore', width: '120px' },
  { title: '活跃度', key: 'activityStatus', width: '100px' },
  { title: '对话/匹配/报告', key: 'activity', width: '140px', sortable: false },
  { title: '注册时间', key: 'createdAt', width: '120px' },
  { title: '操作', key: 'actions', sortable: false, width: '140px' },
])

const displayPage = computed({
  get: () => page.value + 1,
  set: (v: number) => {
    page.value = v - 1
    loadStudents()
  },
})

const canCompare = computed(
  () => selected.value.length >= 2 && selected.value.length <= 5,
)

function buildParams(): schoolApi.StudentFilterParams {
  return {
    keyword: keyword.value || undefined,
    minScore: scoreRange.value[0] > 0 ? scoreRange.value[0] : undefined,
    maxScore: scoreRange.value[1] < 100 ? scoreRange.value[1] : undefined,
    minCompleteness: completenessRange.value[0] > 0 ? completenessRange.value[0] : undefined,
    maxCompleteness: completenessRange.value[1] < 100 ? completenessRange.value[1] : undefined,
    majors: selectedMajors.value.length > 0 ? selectedMajors.value : undefined,
    hasProfile: hasProfile.value !== null ? hasProfile.value : undefined,
    hasMatch: hasMatch.value !== null ? hasMatch.value : undefined,
    activityStatus: activityStatusFilter.value || undefined,
    sortBy: sortBy.value,
    sortDir: sortDir.value,
    page: page.value,
    size: pageSize.value,
  }
}

async function loadStudents() {
  loading.value = true
  fetchError.value = null
  selected.value = []
  try {
    const res = (await schoolApi.getSchoolStudents(
      buildParams(),
    )) as unknown as ApiResponse<{ content: SchoolStudentListItem[]; totalPages: number; totalElements: number }>
    students.value = res.data?.content || []
    totalPages.value = res.data?.totalPages || 0
    totalElements.value = res.data?.totalElements || 0
  } catch {
    students.value = []
    fetchError.value = '加载学生列表失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

async function loadMajors() {
  try {
    const res = (await schoolApi.getSchoolStudentMajors()) as unknown as ApiResponse<string[]>
    majorsOptions.value = res.data || []
  } catch {
    majorsOptions.value = []
  }
}

function onSearch() {
  page.value = 0
  loadStudents()
}

function resetFilter() {
  keyword.value = ''
  scoreRange.value = [0, 100]
  completenessRange.value = [0, 100]
  selectedMajors.value = []
  hasProfile.value = null
  hasMatch.value = null
  activityStatusFilter.value = ''
  sortBy.value = 'createdAt'
  sortDir.value = 'desc'
  page.value = 0
  loadStudents()
}

function viewDetail(userId: string) {
  router.push(`/school/students/${userId}`)
}

function compareSelected() {
  const ids = selected.value.map((s) => s.userId)
  router.push({ path: '/school/students/compare', query: { ids } })
}

async function exportStudents() {
  try {
    const params: schoolApi.StudentFilterParams = buildParams()
    const res = await schoolApi.exportSchoolStudents(params)
    const blob = (res as { data: Blob }).data ?? (res as unknown as Blob)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('导出失败，请重试')
  }
}

function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString('zh-CN') : '-'
}

onMounted(() => {
  loadStudents()
  loadMajors()
})
</script>

<template>
  <v-container>
    <PageHeader :title="pageItem?.title ?? '学生列表'" :description="pageItem?.description" :icon="pageItem?.icon">
      <template #actions>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn
            v-if="canCompare"
            color="primary"
            prepend-icon="mdi-compare-horizontal"
            @click="compareSelected"
          >
            对比分析 ({{ selected.length }})
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-download" @click="exportStudents">
            导出
          </v-btn>
          <v-btn
            :color="showFilter ? 'primary' : 'default'"
            :variant="showFilter ? 'tonal' : 'outlined'"
            prepend-icon="mdi-filter"
            @click="showFilter = !showFilter"
          >
            筛选
          </v-btn>
        </div>
      </template>
    </PageHeader>

    <!-- 筛选面板 -->
    <v-expand-transition>
      <v-card v-if="showFilter" class="mb-4 pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="keyword"
              label="用户名搜索"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedMajors"
              :items="majorsOptions"
              label="专业（多选）"
              density="compact"
              variant="outlined"
              hide-details
              multiple
              chips
              closable-chips
              clearable
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="activityStatusFilter"
              :items="ACTIVITY_OPTIONS"
              item-title="title"
              item-value="value"
              label="活跃度"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption mb-1">
              竞争力评分：{{ scoreRange[0] }} - {{ scoreRange[1] }}
            </div>
            <v-range-slider
              v-model="scoreRange"
              :min="0"
              :max="100"
              :step="5"
              density="compact"
              hide-details
              color="primary"
            />
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption mb-1">
              画像完成度：{{ completenessRange[0] }}% - {{ completenessRange[1] }}%
            </div>
            <v-range-slider
              v-model="completenessRange"
              :min="0"
              :max="100"
              :step="5"
              density="compact"
              hide-details
              color="teal"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-checkbox
              v-model="hasProfile"
              label="已完成画像"
              density="compact"
              hide-details
              :true-value="true"
              :false-value="null"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-checkbox
              v-model="hasMatch"
              label="已做匹配"
              density="compact"
              hide-details
              :true-value="true"
              :false-value="null"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              :items="SORT_OPTIONS"
              item-title="title"
              item-value="value"
              label="排序字段"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn-toggle v-model="sortDir" density="compact" divided>
              <v-btn value="desc" size="small">降序</v-btn>
              <v-btn value="asc" size="small">升序</v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <div class="d-flex ga-2 mt-3">
          <v-btn color="primary" @click="onSearch">应用筛选</v-btn>
          <v-btn variant="text" @click="resetFilter">重置</v-btn>
        </div>
      </v-card>
    </v-expand-transition>

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadStudents"
    />
    <v-card v-else>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="students"
        :loading="loading"
        hide-default-footer
        show-select
        return-object
        item-value="userId"
      >
        <template #item.major="{ item }">
          <span class="text-body-2">{{ item.major || '-' }}</span>
        </template>

        <template #item.completenessScore="{ item }">
          <template v-if="item.hasProfile && item.completenessScore != null">
            <v-progress-linear
              :model-value="item.completenessScore"
              color="blue"
              bg-color="grey-lighten-3"
              height="6"
              rounded
              class="mb-1"
            />
            <span class="text-caption">{{ item.completenessScore }}</span>
          </template>
          <span v-else class="text-grey text-caption">无画像</span>
        </template>

        <template #item.competitivenessScore="{ item }">
          <template v-if="item.hasProfile && item.competitivenessScore != null">
            <v-chip
              :color="
                item.competitivenessScore >= 70
                  ? 'success'
                  : item.competitivenessScore >= 40
                    ? 'warning'
                    : 'error'
              "
              size="small"
              variant="tonal"
            >
              {{ item.competitivenessScore }}
            </v-chip>
          </template>
          <span v-else class="text-grey text-caption">-</span>
        </template>

        <template #item.activityStatus="{ item }">
          <v-chip
            v-if="item.activityStatus"
            :color="ACTIVITY_CHIP_CONFIG[item.activityStatus]?.color ?? 'default'"
            size="x-small"
            variant="tonal"
          >
            {{ ACTIVITY_CHIP_CONFIG[item.activityStatus]?.label ?? item.activityStatus }}
          </v-chip>
        </template>

        <template #item.activity="{ item }">
          <span class="text-caption text-grey">
            {{ item.conversationCount }} / {{ item.matchCount }} / {{ item.reportCount }}
          </span>
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn size="small" variant="text" color="primary" @click="viewDetail(item.userId)">
              详情
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="secondary"
              :disabled="selected.length < 1 || !selected.some((s) => s.userId === item.userId)"
              @click="() => { selected = [item]; }"
            >
              选中
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <div class="d-flex justify-space-between align-center mt-3">
      <span class="text-caption text-grey">共 {{ totalElements }} 条</span>
      <v-pagination
        v-if="totalPages > 1"
        v-model="displayPage"
        :length="totalPages"
      />
    </div>

    <!-- 选中学生提示栏 -->
    <v-snackbar
      v-model="canCompare"
      location="bottom"
      :timeout="-1"
      color="primary"
      class="text-center"
    >
      已选 {{ selected.length }} 名学生
      <template #actions>
        <v-btn variant="text" @click="compareSelected">对比分析</v-btn>
        <v-btn variant="text" @click="selected = []">清除</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>
