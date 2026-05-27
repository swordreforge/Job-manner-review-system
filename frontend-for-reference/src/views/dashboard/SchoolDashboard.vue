<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavItems } from '@/composables/useNavItems'
import { useAsyncData } from '@/composables/useAsyncData'
import ApiErrorState from '@/components/ApiErrorState.vue'
import type { ApiResponse } from '@/types/api'
import type { School, SchoolStatistics } from '@/types/school'
import * as schoolApi from '@/api/school'

const router = useRouter()
const authStore = useAuthStore()
const { featureCards } = useNavItems()

const school = ref<School | null>(null)
const schoolStats = ref<SchoolStatistics | null>(null)
const copySnackbar = ref(false)
const copyErrorSnackbar = ref(false)
const { loading: schoolLoading, error: schoolError, run: runSchool } = useAsyncData()

async function loadSchoolInfo() {
  await runSchool(async () => {
    const [schoolRes, statsRes] = await Promise.allSettled([
      schoolApi.getMySchoolInfo() as Promise<ApiResponse<School>>,
      schoolApi.getSchoolStatistics() as Promise<ApiResponse<SchoolStatistics>>,
    ])

    if (schoolRes.status === 'fulfilled') {
      school.value = schoolRes.value.data
    } else {
      school.value = null
      throw schoolRes.reason
    }

    schoolStats.value = statsRes.status === 'fulfilled' ? statsRes.value.data : null
  })
}

async function copyInviteCode() {
  if (!school.value?.inviteCode) return
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      throw new Error('Clipboard API not available in this environment')
    }
    await navigator.clipboard.writeText(school.value.inviteCode)
    copySnackbar.value = true
  } catch {
    copyErrorSnackbar.value = true
  }
}

loadSchoolInfo()

const keyStats = computed(() => [
  { label: '学生总数', value: schoolStats.value?.totalStudents ?? '-', icon: 'mdi-account-group', color: 'primary' },
  { label: '已完成画像', value: schoolStats.value?.studentsWithProfile ?? '-', icon: 'mdi-account-check', color: 'success' },
  { label: '已做匹配', value: schoolStats.value?.studentsWithMatch ?? '-', icon: 'mdi-compare-horizontal', color: 'warning' },
  { label: '已出报告', value: schoolStats.value?.studentsWithReport ?? '-', icon: 'mdi-file-document-check', color: 'info' },
])
</script>

<template>
  <v-container>
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="tonal" color="indigo">
          <v-card-text class="py-6 d-flex flex-wrap align-center ga-3">
            <div>
              <div class="text-h5 font-weight-bold mb-1">学校工作台</div>
              <div class="text-body-2 text-medium-emphasis">
                欢迎回来，{{ authStore.currentUser?.username || '用户' }}。从这里快速处理学生管理与预警分析。
              </div>
            </div>
            <v-spacer />
            <v-btn color="indigo" prepend-icon="mdi-refresh" :loading="schoolLoading" @click="loadSchoolInfo">
              刷新数据
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-2">
      <v-col v-for="item in keyStats" :key="item.label" cols="12" sm="6" md="3">
        <v-card variant="tonal" :color="item.color">
          <v-card-text class="text-center">
            <v-icon :icon="item.icon" size="28" class="mb-1" />
            <div class="text-h5 font-weight-bold">{{ item.value }}</div>
            <div class="text-caption">{{ item.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 学校信息卡片 -->
    <v-row class="mb-4">
      <v-col cols="12" md="7">
        <v-card :loading="schoolLoading">
          <v-card-title class="d-flex align-center ga-2">
            <v-icon icon="mdi-school" color="primary" />
            学校信息
          </v-card-title>
          <ApiErrorState
            v-if="schoolError"
            :error="schoolError"
            title="加载学校信息失败"
            @retry="loadSchoolInfo"
          />
          <v-card-text v-else-if="school">
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-domain" class="mr-2" />
                </template>
                <v-list-item-title>{{ school.name }}</v-list-item-title>
                <v-list-item-subtitle>学校名称</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="school.description">
                <template #prepend>
                  <v-icon icon="mdi-information-outline" class="mr-2" />
                </template>
                <v-list-item-title>{{ school.description }}</v-list-item-title>
                <v-list-item-subtitle>学校描述</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-key-variant" class="mr-2" />
                </template>
                <v-list-item-title>
                  <v-chip
                    :label="true"
                    color="primary"
                    variant="tonal"
                    class="font-weight-bold mr-2"
                    style="font-family: monospace; letter-spacing: 2px"
                  >
                    {{ school.inviteCode }}
                  </v-chip>
                  <v-btn
                    size="small"
                    variant="text"
                    icon="mdi-content-copy"
                    @click="copyInviteCode"
                  />
                </v-list-item-title>
                <v-list-item-subtitle>邀请码（学生可用此码自主绑定本校）</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-text v-else-if="!schoolLoading && !schoolError">
            <p class="text-grey">暂无学校信息</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card height="100%">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-rocket-launch-outline" class="mr-2" />
            快速处理
          </v-card-title>
          <v-list density="comfortable">
            <v-list-item
              title="查看就业看板"
              subtitle="综合查看评分分布与能力维度"
              prepend-icon="mdi-chart-bar"
              @click="router.push('/school/dashboard')"
            />
            <v-list-item
              title="进入预警中心"
              subtitle="优先处理高风险学生"
              prepend-icon="mdi-alert-circle"
              @click="router.push('/school/alerts')"
            />
            <v-list-item
              title="管理学生列表"
              subtitle="批量筛选、导出与对比分析"
              prepend-icon="mdi-account-group"
              @click="router.push('/school/students')"
            />
            <v-list-item
              title="批量导入学生"
              subtitle="通过 Excel/CSV 快速建档"
              prepend-icon="mdi-file-upload"
              @click="router.push('/school/import')"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

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

    <v-snackbar v-model="copySnackbar" :timeout="2000" color="success" location="top right">
      邀请码已复制到剪贴板
    </v-snackbar>
    <v-snackbar v-model="copyErrorSnackbar" :timeout="2500" color="warning" location="top right">
      当前环境不支持自动复制，请手动复制邀请码
    </v-snackbar>
  </v-container>
</template>
