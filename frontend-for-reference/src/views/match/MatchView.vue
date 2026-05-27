<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useJobStore } from '@/stores/job'
import { useMatchStore } from '@/stores/match'
import { useStudentStore } from '@/stores/student'
import { useNavItems } from '@/composables/useNavItems'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'

const jobStore = useJobStore()
const matchStore = useMatchStore()
const studentStore = useStudentStore()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/match'))
const fetchError = ref<string | null>(null)
const dataLoaded = ref(false)
const currentPage = ref(1)

/** 就业意向是否已填写（4 个字段任一非空即视为已填写） */
const hasPreference = computed(() => {
  const p = studentStore.profile
  if (!p) return false
  return !!(p.preferredCity || p.preferredSalary || p.preferredDirection || p.careerGoal)
})

onMounted(async () => {
  fetchError.value = null
  dataLoaded.value = false
  try {
    await Promise.all([
      jobStore.fetchJobList(),
      matchStore.fetchMatchResults(),
      studentStore.fetchProfile(),
    ])
  } catch {
    fetchError.value = '加载数据失败，请检查网络后重试'
  } finally {
    dataLoaded.value = true
  }
})

async function retryLoad() {
  fetchError.value = null
  dataLoaded.value = false
  try {
    await Promise.all([
      jobStore.fetchJobList(),
      matchStore.fetchMatchResults(),
      studentStore.fetchProfile(),
    ])
  } catch {
    fetchError.value = '加载数据失败，请检查网络后重试'
  } finally {
    dataLoaded.value = true
  }
}

async function onPageChange(page: number) {
  currentPage.value = page
  await matchStore.fetchMatchResults(page - 1)
}

/** jobProfileId → profileName 映射 */
const jobNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const j of jobStore.jobList) {
    map[j.id] = j.profileName
  }
  return map
})

function resolveJobName(jobProfileId: string): string {
  return jobNameMap.value[jobProfileId] || jobProfileId
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function matchScoreColor(score: number): string {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '人岗匹配'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <v-skeleton-loader v-if="!dataLoaded" type="card@3" class="mb-4" />

    <ApiErrorState
      v-else-if="fetchError && !jobStore.loading && !matchStore.loading"
      :error="fetchError"
      title="加载失败"
      @retry="retryLoad"
    />

    <v-alert
      v-else-if="dataLoaded && !hasPreference"
      type="warning"
      variant="tonal"
      class="mb-4"
      icon="mdi-alert-circle-outline"
    >
      请先前往
      <RouterLink to="/preference" class="text-warning font-weight-medium">就业意向</RouterLink>
      页面填写期望城市、期望薪资等信息，填写后即可发起人岗匹配。
    </v-alert>

    <template v-else>
      <!-- 匹配历史卡片网格 -->
      <v-row v-if="matchStore.matchResults.length">
        <v-col v-for="match in matchStore.matchResults" :key="match.id" cols="12" sm="6" md="4">
          <v-card :to="`/match/${match.id}`" hover height="100%">
            <v-card-title class="text-subtitle-1 font-weight-bold">
              {{ resolveJobName(match.jobProfileId) }}
            </v-card-title>
            <v-card-subtitle>
              {{ formatDate(match.createdAt) }}
            </v-card-subtitle>
            <v-card-text>
              <div class="d-flex flex-wrap ga-1 mb-2">
                <v-chip size="small" variant="tonal" :color="matchScoreColor(match.overallScore)">
                  匹配度 {{ match.overallScore }}%
                </v-chip>
              </div>
              <div class="d-flex flex-wrap ga-1">
                <v-chip size="x-small" variant="tonal" color="blue">
                  基础 {{ match.dimensions.basicRequirement.score }}
                </v-chip>
                <v-chip size="x-small" variant="tonal" color="green">
                  技能 {{ match.dimensions.professionalSkill.score }}
                </v-chip>
                <v-chip size="x-small" variant="tonal" color="orange">
                  素养 {{ match.dimensions.professionalQuality.score }}
                </v-chip>
                <v-chip size="x-small" variant="tonal" color="purple">
                  潜力 {{ match.dimensions.developmentPotential.score }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 空状态提示 -->
      <v-alert v-else-if="!matchStore.loading && !fetchError" type="info" variant="tonal" class="mt-4">
        <p class="mb-2">暂无匹配记录，请先前往岗位画像页面浏览岗位并发起匹配。</p>
        <v-btn color="primary" variant="outlined" to="/jobs" prepend-icon="mdi-briefcase">
          前往岗位画像
        </v-btn>
      </v-alert>

      <!-- 分页组件 -->
      <div class="d-flex justify-center mt-4" v-if="matchStore.totalPages > 1">
        <v-pagination
          v-model="currentPage"
          :length="matchStore.totalPages"
          rounded
          @update:model-value="onPageChange"
        />
      </div>
    </template>
  </v-container>
</template>
