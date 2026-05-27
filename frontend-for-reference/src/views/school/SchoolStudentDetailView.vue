<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import type { SchoolStudentDetail } from '@/types/school'
import * as schoolApi from '@/api/school'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'

const route = useRoute()
const router = useRouter()

const userId = computed(() => route.params.userId as string)
const detail = ref<SchoolStudentDetail | null>(null)
const loading = ref(false)
const fetchError = ref<string | null>(null)
const activeTab = ref('info')

const DIMENSION_CONFIG = [
  { key: 'technical', label: '技术能力' },
  { key: 'project', label: '项目经验' },
  { key: 'internship', label: '实习经历' },
  { key: 'education', label: '学术背景' },
  { key: 'achievement', label: '竞赛与成果' },
  { key: 'soft_skill', label: '软素质' },
  { key: 'professionalism', label: '职业素养' },
]

function getDimScore(key: string): number {
  return detail.value?.profile?.scoreDetail?.[key]?.score ?? 0
}

async function loadDetail() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await schoolApi.getSchoolStudentDetail(
      userId.value,
    )) as unknown as ApiResponse<SchoolStudentDetail>
    detail.value = res.data
  } catch {
    detail.value = null
    fetchError.value = '加载学生详情失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  return date ? new Date(date).toLocaleString('zh-CN') : '-'
}

function formatScore(score?: number) {
  return score != null ? score.toString() : '-'
}

onMounted(() => loadDetail())
</script>

<template>
  <v-container>
    <v-btn icon="mdi-arrow-left" variant="text" size="small" class="mb-2" @click="router.back()" />
    <PageHeader
      :title="detail ? `学生详情 @${detail.username}` : '学生详情'"
      icon="mdi-account"
      :breadcrumb-title="detail ? `@${detail.username}` : undefined"
    >
      <template #actions>
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-chat-outline"
          size="small"
          @click="router.push(`/school/students/${userId}/chats`)"
        >
          聊天记录
        </v-btn>
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <ApiErrorState
      v-else-if="fetchError"
      :error="fetchError"
      title="加载失败"
      @retry="loadDetail"
    />

    <v-card v-else-if="detail">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="info">基础信息</v-tab>
        <v-tab value="scores" :disabled="!detail.profile">能力评分</v-tab>
        <v-tab value="matches">匹配结果</v-tab>
        <v-tab value="reports">规划报告</v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab">
        <!-- 基础信息 -->
        <v-window-item value="info">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list density="compact">
                  <v-list-subheader>账号信息</v-list-subheader>
                  <v-list-item title="用户名" :subtitle="detail.username" />
                  <v-list-item title="注册时间" :subtitle="formatDate(detail.userCreatedAt)" />
                </v-list>
              </v-col>
              <v-col cols="12" md="6" v-if="detail.profile">
                <v-list density="compact">
                  <v-list-subheader>学历信息</v-list-subheader>
                  <v-list-item title="院校" :subtitle="detail.profile.university || '-'" />
                  <v-list-item title="专业" :subtitle="detail.profile.major || '-'" />
                  <v-list-item title="学历" :subtitle="detail.profile.education || '-'" />
                </v-list>
              </v-col>
              <v-col cols="12" v-if="detail.profile?.careerGoal">
                <v-list density="compact">
                  <v-list-subheader>就业意向</v-list-subheader>
                  <v-list-item title="目标方向" :subtitle="detail.profile.preferredDirection || '-'" />
                  <v-list-item title="意向城市" :subtitle="detail.profile.preferredCity || '-'" />
                  <v-list-item title="期望薪资" :subtitle="detail.profile.preferredSalary || '-'" />
                  <v-list-item title="职业目标" :subtitle="detail.profile.careerGoal" />
                </v-list>
              </v-col>
            </v-row>
            <v-alert
              v-if="!detail.profile"
              type="info"
              variant="tonal"
              class="mt-4"
              text="该学生尚未生成学生画像"
            />
          </v-card-text>
        </v-window-item>

        <!-- 能力评分 -->
        <v-window-item value="scores">
          <v-card-text v-if="detail.profile">
            <v-row>
              <v-col cols="12" md="6">
                <v-list density="compact">
                  <v-list-subheader>综合评估</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-star" color="amber" />
                    </template>
                    <v-list-item-title>完整度评分</v-list-item-title>
                    <template #append>
                      <v-chip color="blue" variant="tonal" size="small">
                        {{ formatScore(detail.profile.completenessScore) }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-trophy" color="amber" />
                    </template>
                    <v-list-item-title>竞争力评分</v-list-item-title>
                    <template #append>
                      <v-chip color="green" variant="tonal" size="small">
                        {{ formatScore(detail.profile.competitivenessScore) }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <v-list density="compact">
                  <v-list-subheader>7 维竞争力评分</v-list-subheader>
                  <v-list-item v-for="{ key, label } in DIMENSION_CONFIG" :key="key">
                    <v-list-item-title class="text-body-2">{{ label }}</v-list-item-title>
                    <template #append>
                      <div class="d-flex align-center ga-2" style="min-width: 140px">
                        <v-progress-linear
                          :model-value="getDimScore(key)"
                          :max="100"
                          color="primary"
                          bg-color="grey-lighten-3"
                          height="8"
                          rounded
                          style="width: 100px"
                        />
                        <span class="text-caption text-grey" style="width: 30px">
                          {{ getDimScore(key) }}
                        </span>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>

        <!-- 匹配结果 -->
        <v-window-item value="matches">
          <v-card-text>
            <div v-if="detail.matchResults.length === 0" class="text-grey text-center py-8">
              暂无匹配记录
            </div>
            <v-list v-else density="compact">
              <v-list-item
                v-for="match in detail.matchResults"
                :key="match.id"
                :subtitle="formatDate(match.createdAt)"
              >
                <v-list-item-title>
                  岗位画像 {{ match.jobProfileId.substring(0, 8) }}...
                </v-list-item-title>
                <template #append>
                  <v-chip
                    :color="
                      (match.overallScore ?? 0) >= 70
                        ? 'success'
                        : (match.overallScore ?? 0) >= 40
                          ? 'warning'
                          : 'error'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{ match.overallScore ?? '-' }} 分
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-window-item>

        <!-- 规划报告 -->
        <v-window-item value="reports">
          <v-card-text>
            <div v-if="detail.reports.length === 0" class="text-grey text-center py-8">
              暂无规划报告
            </div>
            <v-list v-else density="compact">
              <v-list-item
                v-for="report in detail.reports"
                :key="report.id"
                :title="report.title || '未命名报告'"
                :subtitle="formatDate(report.createdAt)"
              >
                <template #append>
                  <div class="d-flex align-center ga-2">
                    <v-chip
                      :color="report.status === 'FINAL' ? 'success' : 'default'"
                      size="small"
                      variant="tonal"
                    >
                      {{ report.status }}
                    </v-chip>
                    <v-chip size="small" variant="outlined">v{{ report.version }}</v-chip>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>

    <v-alert
      v-else-if="!loading"
      type="error"
      variant="tonal"
      text="学生信息加载失败，可能无权限查看"
      class="mt-4"
    />
  </v-container>
</template>
