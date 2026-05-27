<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useNavItems } from '@/composables/useNavItems'
import { useNavHistory } from '@/composables/useNavHistory'
import { useAsyncData } from '@/composables/useAsyncData'
import { useStudentStore } from '@/stores/student'
import { useMatchStore } from '@/stores/match'
import { useReportStore } from '@/stores/report'
import ApiErrorState from '@/components/ApiErrorState.vue'

const router = useRouter()
const { mobile } = useDisplay()
const authStore = useAuthStore()
const { featureCards, findNavItemByPath } = useNavItems()
const { lastNonDocPath } = useNavHistory()

const studentStore = useStudentStore()
const matchStore = useMatchStore()
const reportStore = useReportStore()
const { loading: guideLoading, error: guideError, run: runGuide } = useAsyncData()

const guideSteps = [
  {
    title: '完善画像',
    icon: 'mdi-account-edit',
    description: '上传简历或手动填写个人信息，生成您的职业画像，是后续所有分析的基础。',
    actionLabel: '去完善',
    to: '/profile',
    done: computed(() => studentStore.profile !== null),
  },
  {
    title: '就业意向',
    icon: 'mdi-briefcase-search',
    description: '填写期望城市、求职方向与职业目标，让 AI 更精准地为您推荐和匹配岗位。',
    actionLabel: '去填写',
    to: '/profile',
    done: computed(() => {
      const p = studentStore.profile
      return !!(p?.preferredCity || p?.preferredDirection || p?.careerGoal)
    }),
  },
  {
    title: '人岗匹配',
    icon: 'mdi-compare-horizontal',
    description: '浏览推荐岗位并发起匹配分析，AI 将给出详细的匹配度评估报告。',
    actionLabel: '去匹配',
    to: '/match',
    done: computed(() => matchStore.matchResults.length > 0),
  },
  {
    title: '生成报告',
    icon: 'mdi-file-document-check',
    description: '基于匹配结果生成完整的职业规划报告，并可在线编辑、导出。',
    actionLabel: '去报告',
    to: '/reports',
    done: computed(() =>
      reportStore.reportList.some((r) =>
        (['DRAFT', 'COMPLETED', 'EXPORTED'] as const).includes(
          r.status as 'DRAFT' | 'COMPLETED' | 'EXPORTED',
        ),
      ),
    ),
  },
]

const guideCurrentStep = computed(() => {
  const idx = guideSteps.findIndex((s) => !s.done.value)
  return idx === -1 ? guideSteps.length + 1 : idx + 1
})

const guideAllDone = computed(() => guideSteps.every((s) => s.done.value))
const guideDoneCount = computed(() => guideSteps.filter((s) => s.done.value).length)

const studentStats = computed(() => {
  const profile = studentStore.profile
  return [
    {
      label: '画像完整度',
      value: profile ? `${Math.round(profile.completenessScore)}%` : '-',
      icon: 'mdi-account-check',
      color: 'success',
    },
    {
      label: '竞争力评分',
      value: profile ? profile.competitivenessScore.toFixed(1) : '-',
      icon: 'mdi-speedometer',
      color: 'indigo',
    },
    {
      label: '匹配记录',
      value: matchStore.matchResults.length,
      icon: 'mdi-compare-horizontal',
      color: 'orange',
    },
    {
      label: '报告数量',
      value: reportStore.reportList.length,
      icon: 'mdi-file-document',
      color: 'purple',
    },
  ]
})

const recentPage = computed(() => {
  const path = lastNonDocPath.value
  if (!path || path === '/dashboard') return null
  return findNavItemByPath(path)
})

const focusActions = [
  { title: '快速开始 AI 对话', subtitle: '和职业助手聊聊下一步方向', icon: 'mdi-chat', to: '/chat' },
  { title: '浏览岗位画像', subtitle: '找到更适合你的目标岗位', icon: 'mdi-briefcase', to: '/jobs' },
  { title: '发起人岗匹配', subtitle: '输出可执行的能力提升建议', icon: 'mdi-compare-horizontal', to: '/match' },
]

async function loadGuide() {
  await runGuide(async () => {
    await Promise.allSettled([
      studentStore.fetchProfile(),
      matchStore.fetchMatchResults(0, 1),
      reportStore.fetchReports(0, 1),
    ])
  })
}

loadGuide()
</script>

<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="tonal" color="primary">
          <v-card-text class="py-6 d-flex flex-wrap align-center ga-3">
            <div>
              <div class="text-h5 font-weight-bold mb-1">学生成长工作台</div>
              <div class="text-body-2 text-medium-emphasis">
                欢迎回来，{{ authStore.currentUser?.username || '用户' }}。今天完成一个关键动作，离目标岗位更近一步。
              </div>
            </div>
            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-refresh" :loading="guideLoading" @click="loadGuide">
              刷新状态
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-3">
      <v-col v-for="item in studentStats" :key="item.label" cols="12" sm="6" md="3">
        <v-card variant="tonal" :color="item.color">
          <v-card-text class="text-center">
            <v-icon :icon="item.icon" size="28" class="mb-1" />
            <div class="text-h5 font-weight-bold">{{ item.value }}</div>
            <div class="text-caption">{{ item.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-lightning-bolt-outline" class="mr-2" />
            今日推荐动作
          </v-card-title>
          <v-list>
            <v-list-item
              v-for="action in focusActions"
              :key="action.to"
              :title="action.title"
              :subtitle="action.subtitle"
              :prepend-icon="action.icon"
              @click="router.push(action.to)"
            />
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-history" class="mr-2" />
            最近访问
          </v-card-title>
          <v-card-text v-if="recentPage">
            <div class="text-subtitle-1 mb-2">{{ recentPage.title }}</div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              {{ recentPage.description || '继续你上次未完成的操作' }}
            </div>
            <v-btn color="primary" variant="tonal" :prepend-icon="recentPage.icon" @click="router.push(recentPage.to)">
              继续上次任务
            </v-btn>
          </v-card-text>
          <v-card-text v-else class="text-medium-emphasis">
            暂无最近访问记录，建议从“完善画像”开始。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 职业规划引导 Stepper -->
    <v-card :loading="guideLoading" class="mb-6">
      <v-card-title class="d-flex align-center ga-2 flex-wrap">
        <v-icon icon="mdi-map-marker-path" color="primary" />
        职业规划引导
        <v-spacer />
        <v-chip :color="guideAllDone ? 'success' : 'primary'" size="small" variant="tonal">
          {{ guideDoneCount }} / {{ guideSteps.length }}
        </v-chip>
      </v-card-title>

      <ApiErrorState v-if="guideError" :error="guideError" title="加载引导状态失败" @retry="loadGuide" />

      <template v-else-if="!guideLoading">
        <!-- 全部完成时的祝贺提示 -->
        <v-card-text v-if="guideAllDone" class="pb-2">
          <v-alert type="success" variant="tonal" :rounded="true">
            <template #title>恭喜！您已完成全部规划步骤 🎉</template>
            您可以随时回顾匹配结果和职业规划报告，继续完善您的职业规划。
          </v-alert>
        </v-card-text>

        <!-- 引导 Stepper -->
        <v-stepper v-else v-model="guideCurrentStep" :alt-labels="!mobile" flat>
          <v-stepper-header>
            <template v-for="(step, idx) in guideSteps" :key="step.title">
              <v-stepper-item
                :value="idx + 1"
                :title="step.title"
                :icon="step.done.value ? 'mdi-check' : step.icon"
                :color="step.done.value ? 'success' : 'primary'"
                :complete="step.done.value"
              />
              <v-divider v-if="idx < guideSteps.length - 1" />
            </template>
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item
              v-for="(step, idx) in guideSteps"
              :key="step.title"
              :value="idx + 1"
            >
              <v-card-text class="text-center">
                <v-icon :icon="step.icon" color="primary" size="48" class="mb-3" />
                <p class="text-body-1 mb-4">{{ step.description }}</p>
                <v-btn
                  color="primary"
                  variant="tonal"
                  :prepend-icon="step.icon"
                  @click="router.push(step.to)"
                >
                  {{ step.actionLabel }}
                </v-btn>
              </v-card-text>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </template>
    </v-card>

    <!-- 功能导航卡片 -->
    <v-row>
      <v-col v-for="item in featureCards" :key="item.to" cols="12" sm="6" md="3">
        <v-card :to="item.to" hover height="100%">
          <v-card-text class="text-center pa-6">
            <v-icon :icon="item.icon" :color="item.color" size="48" class="mb-4" />
            <h3 class="text-h6 mb-2">{{ item.title }}</h3>
            <p class="text-body-2 text-grey">{{ item.description }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
