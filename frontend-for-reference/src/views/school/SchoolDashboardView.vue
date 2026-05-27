<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import type { SchoolStatistics } from '@/types/school'
import * as schoolApi from '@/api/school'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const router = useRouter()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/school/dashboard'))

const stats = ref<SchoolStatistics | null>(null)
const loading = ref(false)
const fetchError = ref<string | null>(null)

async function loadStats() {
  loading.value = true
  fetchError.value = null
  try {
    const res = (await schoolApi.getSchoolStatistics()) as unknown as ApiResponse<SchoolStatistics>
    stats.value = res.data || null
  } catch {
    fetchError.value = '加载统计数据失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

// 评分分布柱状图数据
const scoreDistLabels = ['0-20', '20-40', '40-60', '60-80', '80-100']
const scoreChartData = computed(() => {
  if (!stats.value?.scoreDistribution) return scoreDistLabels.map(() => 0)
  return scoreDistLabels.map((k) => stats.value!.scoreDistribution[k] ?? 0)
})

// 雷达图维度中文映射
const RADAR_LABELS: Record<string, string> = {
  technical: '专业技能',
  project: '项目经历',
  internship: '实习经历',
  education: '学历背景',
  achievement: '获奖成就',
  soft_skill: '软性素质',
  professionalism: '职业素养',
}

const radarDimensions = computed(() => {
  if (!stats.value?.radarAvg) return []
  return Object.entries(stats.value.radarAvg).map(([key, val]) => ({
    name: RADAR_LABELS[key] ?? key,
    value: Math.round(val * 10) / 10,
  }))
})

function goToAlerts() {
  router.push('/school/alerts')
}


onMounted(() => loadStats())
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '就业看板'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    >
      <template #actions>
        <v-btn color="warning" prepend-icon="mdi-alert-circle" @click="goToAlerts">预警中心</v-btn>
      </template>
    </PageHeader>

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadStats"
    />

    <template v-else>
      <!-- 概览统计卡片 -->
      <v-row class="mb-4">
        <v-col v-if="loading" cols="12" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </v-col>
        <template v-else-if="stats">
          <v-col cols="6" md="2">
            <v-card variant="tonal" color="blue">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">{{ stats.totalStudents }}</div>
                <div class="text-caption">学生总数</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="2">
            <v-card variant="tonal" color="green">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">{{ stats.studentsWithProfile }}</div>
                <div class="text-caption">已完成画像</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="2">
            <v-card variant="tonal" color="orange">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">{{ stats.studentsWithMatch }}</div>
                <div class="text-caption">已做匹配</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="2">
            <v-card variant="tonal" color="purple">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">{{ stats.studentsWithReport }}</div>
                <div class="text-caption">已生成报告</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card variant="tonal" color="indigo">
              <v-card-text class="text-center">
                <div class="text-h4 font-weight-bold">
                  {{ stats.avgCompetitivenessScore.toFixed(1) }}
                </div>
                <div class="text-caption">平均竞争力评分</div>
              </v-card-text>
            </v-card>
          </v-col>
        </template>
      </v-row>

      <v-row v-if="stats && !loading">
        <!-- 评分分布 -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">竞争力评分分布</v-card-title>
            <v-card-text>
              <div
                v-for="(label, idx) in scoreDistLabels"
                :key="label"
                class="d-flex align-center ga-2 mb-2"
              >
                <span class="text-caption" style="min-width: 50px">{{ label }}</span>
                <v-progress-linear
                  :model-value="
                    stats.totalStudents > 0
                      ? ((scoreChartData[idx] ?? 0) / stats.totalStudents) * 100
                      : 0
                  "
                  color="primary"
                  bg-color="grey-lighten-3"
                  height="18"
                  rounded
                  class="flex-1-1"
                />
                <span class="text-caption" style="min-width: 24px">{{ scoreChartData[idx] }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 7维能力雷达（文字版） -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">7 维能力均值（全校）</v-card-title>
            <v-card-text>
              <div
                v-if="radarDimensions.length === 0"
                class="text-grey text-center py-4"
              >
                暂无数据（学生尚未生成画像）
              </div>
              <div
                v-for="dim in radarDimensions"
                :key="dim.name"
                class="d-flex align-center ga-2 mb-2"
              >
                <span class="text-caption" style="min-width: 64px">{{ dim.name }}</span>
                <v-progress-linear
                  :model-value="dim.value"
                  color="teal"
                  bg-color="grey-lighten-3"
                  height="18"
                  rounded
                  class="flex-1-1"
                />
                <span class="text-caption" style="min-width: 32px">{{ dim.value }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 专业维度统计 -->
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-subtitle-1">专业维度统计</v-card-title>
            <v-data-table
              :headers="[
                { title: '专业', key: 'major' },
                { title: '学生数', key: 'studentCount', width: '120px' },
                { title: '平均竞争力评分', key: 'avgScore', width: '160px' },
              ]"
              :items="stats.majorStats"
              hide-default-footer
              density="compact"
            >
              <template #item.avgScore="{ item }">
                <v-chip
                  :color="
                    item.avgScore >= 70 ? 'success' : item.avgScore >= 40 ? 'warning' : 'error'
                  "
                  size="small"
                  variant="tonal"
                >
                  {{ item.avgScore.toFixed(1) }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>
