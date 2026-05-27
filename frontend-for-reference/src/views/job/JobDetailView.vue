<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJobStore } from '@/stores/job'
import { useMatchStore } from '@/stores/match'
import { useStudentStore } from '@/stores/student'
import ApiErrorState from '@/components/ApiErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const store = useJobStore()
const matchStore = useMatchStore()
const studentStore = useStudentStore()
const fetchError = ref<string | null>(null)
const loading = ref(false)
const matching = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const hasProfile = computed(() => studentStore.profile !== null)
const hasPreference = computed(() => {
  const p = studentStore.profile
  if (!p) return false
  return !!(p.preferredCity || p.preferredSalary || p.preferredDirection || p.careerGoal)
})

function showSnackbar(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(async () => {
  loading.value = true
  fetchError.value = null
  try {
    await Promise.all([
      store.fetchJobDetail(route.params.id as string),
      studentStore.fetchProfile(),
    ])
  } catch {
    fetchError.value = '加载岗位详情失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
})

async function retryLoad() {
  loading.value = true
  fetchError.value = null
  try {
    await Promise.all([
      store.fetchJobDetail(route.params.id as string),
      studentStore.fetchProfile(),
    ])
  } catch {
    fetchError.value = '加载岗位详情失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

async function handleMatch() {
  if (!store.currentJob) return
  matching.value = true
  showSnackbar('人岗匹配任务已提交，正在处理中...', 'info')
  try {
    await matchStore.startMatch(store.currentJob.id, true)
    showSnackbar('匹配完成，正在跳转...')
    // 从刷新后的匹配结果中找到本次匹配
    const result = matchStore.matchResults.find(
      (r) => r.jobProfileId === store.currentJob!.id,
    )
    if (result) {
      router.push(`/match/${result.id}`)
    } else {
      router.push('/match')
    }
  } catch {
    showSnackbar('匹配失败，请稍后重试', 'error')
  } finally {
    matching.value = false
  }
}

const abilityLabels: Record<string, string> = {
  innovationAbility: '创新能力',
  learningAbility: '学习能力',
  stressTolerance: '抗压能力',
  communicationSkill: '沟通能力',
}
</script>

<template>
  <v-container v-if="store.currentJob">
    <PageHeader
      :title="store.currentJob.profileName"
      :description="store.currentJob.category"
      icon="mdi-briefcase-outline"
      :breadcrumb-title="store.currentJob.profileName"
    >
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/jobs">返回列表</v-btn>
      </template>
    </PageHeader>

    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <p class="mb-2">
              <strong>学历要求：</strong>{{ store.currentJob.educationRequirement }}
            </p>
            <p class="mb-2">
              <strong>专业要求：</strong
              >{{ (store.currentJob.majorRequirement || []).join('、') || '不限' }}
            </p>
            <p class="mb-2">
              <strong>薪资范围：</strong>
              {{
                store.currentJob.salaryRangeMin
                  ? `${(store.currentJob.salaryRangeMin / 1000).toFixed(0)}K - ${(store.currentJob.salaryRangeMax / 1000).toFixed(0)}K`
                  : '面议'
              }}
            </p>
          </v-col>
          <v-col cols="12" md="6">
            <div v-for="(label, key) in abilityLabels" :key="key" class="mb-1">
              <strong>{{ label }}：</strong>
              <v-chip
                size="small"
                :color="
                  (store.currentJob as any)[key] === '高'
                    ? 'error'
                    : (store.currentJob as any)[key] === '中'
                      ? 'warning'
                      : 'success'
                "
              >
                {{ (store.currentJob as any)[key] || '中' }}
              </v-chip>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>技能要求</v-card-title>
      <v-card-text>
        <div v-for="skill in store.currentJob.requiredSkills" :key="skill.skillName" class="mb-3">
          <div class="font-weight-medium mb-1">
            {{ skill.skillName }} ({{ skill.proficiencyLevel }})
          </div>
          <div>
            <v-chip
              v-for="kp in skill.knowledgePoints"
              :key="kp"
              color="info"
              variant="outlined"
              size="small"
              class="mr-1 mb-1"
            >
              {{ kp }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" v-if="store.currentJob.requiredCertificates?.length">
      <v-card-title>证书要求</v-card-title>
      <v-card-text>
        <v-chip
          v-for="cert in store.currentJob.requiredCertificates"
          :key="cert"
          class="mr-2 mb-1"
          color="secondary"
          variant="outlined"
          >{{ cert }}</v-chip
        >
      </v-card-text>
    </v-card>

    <v-card class="mb-4" v-if="store.currentJob.careerProspects">
      <v-card-title>职业前景</v-card-title>
      <v-card-text>{{ store.currentJob.careerProspects }}</v-card-text>
    </v-card>

    <v-card class="mb-4" v-if="store.currentJob.description">
      <v-card-title>岗位描述</v-card-title>
      <v-card-text style="white-space: pre-line">{{ store.currentJob.description }}</v-card-text>
    </v-card>

    <!-- 匹配操作区 -->
    <v-card class="mb-4">
      <v-card-text>
        <!-- 无学生画像 -->
        <template v-if="!hasProfile">
          <v-alert type="warning" variant="tonal" class="mb-3">
            请先完善个人资料（上传简历或手动填写）后再发起匹配
          </v-alert>
          <v-btn color="primary" prepend-icon="mdi-account-edit" to="/student/profile">
            前往填写资料
          </v-btn>
        </template>

        <!-- 有画像但无就业意向 -->
        <template v-else>
          <v-alert v-if="!hasPreference" type="info" variant="tonal" class="mb-3">
            建议先填写就业意向以获得更精准的匹配结果。
            <router-link to="/preference" class="ml-1">前往填写</router-link>
          </v-alert>
          <div class="d-flex align-center ga-3">
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-compare-horizontal"
              :loading="matching"
              :disabled="matching"
              @click="handleMatch"
            >
              {{ matching ? '匹配中...' : '发起人岗匹配' }}
            </v-btn>
            <v-btn
              variant="text"
              :to="`/match?jobId=${store.currentJob.id}`"
            >
              前往匹配页
            </v-btn>
          </div>
        </template>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="4000" :color="snackbarColor" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>

  <v-container v-else-if="loading">
    <v-skeleton-loader type="heading, divider, paragraph, paragraph, chip@3" />
  </v-container>

  <v-container v-else>
    <ApiErrorState
      :error="fetchError ?? '加载岗位详情失败'"
      title="加载失败"
      @retry="retryLoad"
    />
  </v-container>
</template>
