<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ApiResponse } from '@/types/api'
import type { StudentCompareResult, StudentCompareItem } from '@/types/school'
import * as schoolApi from '@/api/school'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'

const route = useRoute()
const router = useRouter()

const compareResult = ref<StudentCompareResult | null>(null)
const loading = ref(false)
const fetchError = ref<string | null>(null)

const RADAR_LABELS: Record<string, string> = {
  technical: '专业技能',
  project: '项目经历',
  internship: '实习经历',
  education: '学历背景',
  achievement: '获奖成就',
  soft_skill: '软性素质',
  professionalism: '职业素养',
}

const COLORS = ['blue', 'orange', 'green', 'purple', 'red']

// 从路由 query 读取 userIds
const userIds = computed(() => {
  const ids = route.query.ids
  if (!ids) return []
  return Array.isArray(ids) ? (ids as string[]) : [ids as string]
})

// 所有维度的 union（不同学生可能有不同维度）
const allDimensions = computed(() => {
  if (!compareResult.value) return []
  const keys = new Set<string>()
  for (const s of compareResult.value.students) {
    if (s.scoreDetail) Object.keys(s.scoreDetail).forEach((k) => keys.add(k))
  }
  return Array.from(keys)
})

function getDimensionScore(student: StudentCompareItem, dim: string): number {
  const detail = student.scoreDetail?.[dim]
  if (!detail) return 0
  return typeof detail === 'object' && 'score' in detail ? (detail as { score: number }).score : 0
}

async function loadCompare() {
  if (userIds.value.length < 2) {
    fetchError.value = '请至少选择 2 名学生进行对比'
    return
  }
  loading.value = true
  fetchError.value = null
  try {
    const res = (await schoolApi.compareStudents(
      userIds.value,
    )) as unknown as ApiResponse<StudentCompareResult>
    compareResult.value = res.data || null
  } catch {
    fetchError.value = '加载对比数据失败，请重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/school/students')
}

onMounted(() => loadCompare())
</script>

<template>
  <v-container>
    <PageHeader title="学生画像对比分析" description="横向对比多名学生的能力维度与关键指标" icon="mdi-compare-horizontal">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">返回列表</v-btn>
      </template>
    </PageHeader>

    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="loadCompare"
    />

    <v-progress-circular v-else-if="loading" indeterminate color="primary" class="d-flex mx-auto my-8" />

    <template v-else-if="compareResult">
      <!-- 关键指标对比表 -->
      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1">关键指标对比</v-card-title>
        <v-table>
          <thead>
            <tr>
              <th>指标</th>
              <th
                v-for="(student, idx) in compareResult.students"
                :key="student.userId"
              >
                <v-chip :color="COLORS[idx % COLORS.length]" size="small" variant="tonal">
                  {{ student.username }}
                </v-chip>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-caption">专业</td>
              <td v-for="s in compareResult.students" :key="s.userId">
                {{ s.major || '-' }}
              </td>
            </tr>
            <tr>
              <td class="text-caption">竞争力评分</td>
              <td v-for="s in compareResult.students" :key="s.userId">
                <v-chip
                  v-if="s.competitivenessScore != null"
                  :color="
                    s.competitivenessScore >= 70
                      ? 'success'
                      : s.competitivenessScore >= 40
                        ? 'warning'
                        : 'error'
                  "
                  size="small"
                  variant="tonal"
                >
                  {{ s.competitivenessScore }}
                </v-chip>
                <span v-else class="text-grey">-</span>
              </td>
            </tr>
            <tr>
              <td class="text-caption">画像完成度</td>
              <td v-for="s in compareResult.students" :key="s.userId">
                {{ s.completenessScore != null ? s.completenessScore + '%' : '-' }}
              </td>
            </tr>
            <tr>
              <td class="text-caption">匹配次数</td>
              <td v-for="s in compareResult.students" :key="s.userId">{{ s.matchCount }}</td>
            </tr>
            <tr>
              <td class="text-caption">报告数</td>
              <td v-for="s in compareResult.students" :key="s.userId">{{ s.reportCount }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- 7维能力对比（进度条） -->
      <v-card v-if="allDimensions.length > 0">
        <v-card-title class="text-subtitle-1">7 维能力对比</v-card-title>
        <v-card-text>
          <div v-for="dim in allDimensions" :key="dim" class="mb-4">
            <div class="text-caption mb-1 font-weight-medium">
              {{ RADAR_LABELS[dim] ?? dim }}
            </div>
            <div
              v-for="(student, idx) in compareResult.students"
              :key="student.userId"
              class="d-flex align-center ga-2 mb-1"
            >
              <v-chip
                :color="COLORS[idx % COLORS.length]"
                size="x-small"
                variant="tonal"
                style="min-width: 80px"
              >
                {{ student.username }}
              </v-chip>
              <v-progress-linear
                :model-value="getDimensionScore(student, dim)"
                :color="COLORS[idx % COLORS.length]"
                bg-color="grey-lighten-3"
                height="14"
                rounded
                class="flex-1-1"
              />
              <span class="text-caption" style="min-width: 28px">
                {{ getDimensionScore(student, dim) }}
              </span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-alert v-else type="info" variant="tonal" class="mt-4">
        所选学生均未生成画像，无法进行能力维度对比。
      </v-alert>
    </template>
  </v-container>
</template>
