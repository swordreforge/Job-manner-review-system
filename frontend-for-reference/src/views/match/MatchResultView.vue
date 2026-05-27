<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchStore } from '@/stores/match'
import ApiErrorState from '@/components/ApiErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([GaugeChart, TooltipComponent, CanvasRenderer])

const route = useRoute()
const router = useRouter()
const store = useMatchStore()
const fetchError = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  store.currentMatch = null
  loading.value = true
  fetchError.value = null
  try {
    await store.fetchMatchDetail(route.params.id as string)
  } catch {
    fetchError.value = '加载匹配详情失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
})

async function retryLoad() {
  loading.value = true
  fetchError.value = null
  try {
    await store.fetchMatchDetail(route.params.id as string)
  } catch {
    fetchError.value = '加载匹配详情失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

const gaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      min: 0,
      max: 100,
      progress: { show: true, width: 18 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 18 } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { offsetCenter: [0, '30%'], fontSize: 14 },
      detail: {
        valueAnimation: true,
        fontSize: 30,
        offsetCenter: [0, '-10%'],
        formatter: '{value}%',
      },
      data: [{ value: store.currentMatch?.overallScore || 0, name: '综合匹配度' }],
    },
  ],
}))

function statusIcon(status: string) {
  return status === 'MATCH' ? '✅' : status === 'PARTIAL' ? '⚠️' : '❌'
}

function statusColor(status: string) {
  return status === 'MATCH' ? 'success' : status === 'PARTIAL' ? 'warning' : 'error'
}

function statusLabel(status: string) {
  return status === 'MATCH' ? '匹配' : status === 'PARTIAL' ? '部分匹配' : '未匹配'
}

/** 根据分数返回颜色：≥70 绿色，40-69 黄色，<40 红色 */
function scoreColor(score: number | undefined): string {
  const v = score ?? 0
  if (v >= 70) return 'green'
  if (v >= 40) return 'orange'
  return 'red'
}
</script>

<template>
  <v-container v-if="store.currentMatch">
    <PageHeader title="匹配分析详情" icon="mdi-compare-horizontal">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/match">返回匹配</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <v-col cols="12" md="4" class="d-flex">
        <v-card class="text-center pa-4 flex-grow-1 d-flex flex-column align-center justify-center">
          <v-chart :option="gaugeOption" style="height: 200px" autoresize />
        </v-card>
      </v-col>

      <v-col cols="12" md="8" class="d-flex">
        <v-card class="pa-4 flex-grow-1">
          <v-card-title>四维评分</v-card-title>
          <v-card-text>
            <div
              v-for="{ label, dimension } in [
                {
                  label: '基础要求',
                  dimension: store.currentMatch.dimensions.basicRequirement,
                },
                {
                  label: '职业技能',
                  dimension: store.currentMatch.dimensions.professionalSkill,
                },
                {
                  label: '职业素养',
                  dimension: store.currentMatch.dimensions.professionalQuality,
                },
                {
                  label: '发展潜力',
                  dimension: store.currentMatch.dimensions.developmentPotential,
                },
              ]"
              :key="label"
              class="mb-4"
            >
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-1 font-weight-medium">{{ label }}</span>
                <span class="text-body-2">{{ dimension?.score?.toFixed(1) ?? '0.0' }} 分</span>
              </div>
              <v-progress-linear
                :model-value="dimension?.score ?? 0"
                :color="scoreColor(dimension?.score)"
                height="10"
                rounded
              />
              <p class="text-caption text-grey mt-1">{{ dimension?.analysis }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-4" v-if="store.currentMatch.skillComparison?.length">
      <v-card-title>技能知识点对比</v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>岗位技能</th>
              <th>匹配状态</th>
              <th>匹配知识点</th>
              <th>缺失知识点</th>
              <th>匹配率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.currentMatch.skillComparison" :key="item.jobSkill">
              <td class="font-weight-medium">{{ item.jobSkill }}</td>
              <td>
                <v-chip size="small" :color="statusColor(item.status)"
                  >{{ statusIcon(item.status) }} {{ statusLabel(item.status) }}</v-chip
                >
              </td>
              <td>{{ (item.studentMatchedPoints || []).join(', ') || '-' }}</td>
              <td class="text-error">{{ (item.studentMissingPoints || []).join(', ') || '-' }}</td>
              <td>{{ ((item.matchRate ?? 0) * 100).toFixed(0) }}%</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-card class="mt-4" v-if="store.currentMatch.analysisText">
      <v-card-title>AI 分析</v-card-title>
      <v-card-text style="white-space: pre-line">{{ store.currentMatch.analysisText }}</v-card-text>
    </v-card>

    <v-btn
      color="primary"
      size="large"
      class="mt-4"
      @click="router.push({ path: '/reports', query: { generate: store.currentMatch.id } })"
    >
      <v-icon start icon="mdi-file-document-edit" />生成职业规划报告
    </v-btn>
  </v-container>

  <v-container v-else-if="loading">
    <v-skeleton-loader type="card, table, article" />
  </v-container>

  <v-container v-else>
    <ApiErrorState
      :error="fetchError ?? '加载匹配详情失败'"
      title="加载失败"
      @retry="retryLoad"
    />
  </v-container>
</template>
