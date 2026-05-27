<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick, type Ref } from 'vue'
import { useJobStore } from '@/stores/job'
import { useNavItems } from '@/composables/useNavItems'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import type { GraphData, GraphEdge, GraphNode } from '@/types/job'

const store = useJobStore()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/jobs/graph'))
const activeTab = ref(0)
const fetchError = ref<string | null>(null)

const promotionContainerRef = ref<HTMLDivElement>()
const transferContainerRef = ref<HTMLDivElement>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let promotionGraphInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transferGraphInstance: any = null

// ── 点击详情弹窗相关 ──
const showDetailDialog = ref(false)
const detailType = ref<'node' | 'promotion-edge' | 'transfer-edge'>('node')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const detailData = ref<Record<string, any>>({})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openNodeDetail(nodeData: Record<string, any>) {
  detailType.value = 'node'
  detailData.value = nodeData
  showDetailDialog.value = true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openEdgeDetail(edgeData: Record<string, any>, type: 'promotion-edge' | 'transfer-edge') {
  detailType.value = type
  detailData.value = edgeData
  showDetailDialog.value = true
}

/** 将 skillsSummary 统一规范化为字符串数组 */
function normalizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return []
  return skills.map((s: unknown) => {
    if (typeof s === 'string') return s
    if (s && typeof s === 'object') {
      const obj = s as Record<string, unknown>
      return (obj.skillName || obj.skill_name || obj.name || JSON.stringify(s)) as string
    }
    return String(s)
  })
}

/** 截断文本，超出部分用省略号 */
function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

// 合并 renderPromotionGraph / renderTransferGraph 为通用 renderGraph(options)
interface RenderGraphOptions {
  containerRef: Ref<HTMLDivElement | undefined>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getInstance: () => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setInstance: (g: any) => void
  data: GraphData
  edgeIdPrefix: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edgeDataMapper: (e: GraphEdge, i: number) => Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout: Record<string, any>
  nodeSize: [number, number]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edgeStyle: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  behaviors: any[]
  edgeDetailType: 'promotion-edge' | 'transfer-edge'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edgeDetailMapper: (e: GraphEdge, src?: GraphNode, tgt?: GraphNode) => Record<string, any>
  /** 节点标签最大字符数，默认 12 */
  labelMaxLen?: number
}

async function renderGraph(opts: RenderGraphOptions) {
  if (!opts.containerRef.value || !opts.data?.nodes?.length) return
  const { Graph } = await import('@antv/g6')

  opts.getInstance()?.destroy()

  // 只保留被边引用的节点，减少渲染量
  const referencedIds = new Set<string>()
  opts.data.edges.forEach((e) => {
    referencedIds.add(e.source)
    referencedIds.add(e.target)
  })
  const filteredNodes = opts.data.nodes.filter((n) => referencedIds.has(n.id))

  const graph = new Graph({
    container: opts.containerRef.value,
    width: opts.containerRef.value.clientWidth,
    height: opts.containerRef.value.clientHeight,
    data: {
      nodes: filteredNodes.map((n) => ({
        id: n.id,
        data: { label: n.label, category: n.category, skillsSummary: n.skillsSummary },
      })),
      edges: opts.data.edges.map((e, i) => ({
        id: `${opts.edgeIdPrefix}-${i}`,
        source: e.source,
        target: e.target,
        data: opts.edgeDataMapper(e, i),
      })),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layout: opts.layout as any,
    node: {
      type: 'rect',
      style: {
        size: opts.nodeSize,
        radius: 6,
        labelText: (d: Record<string, unknown>) =>
          truncate(((d.data as Record<string, unknown>)?.label as string) || (d.id as string), opts.labelMaxLen ?? 12),
        labelPlacement: 'center',
        labelFill: '#333',
        labelFontSize: 13,
        labelFontWeight: 500,
        fill: '#ffffff',
        stroke: '#bdbdbd',
        lineWidth: 1,
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowBlur: 4,
        shadowOffsetY: 2,
        cursor: 'pointer',
      },
    },
    edge: { style: { endArrow: true, labelText: '', cursor: 'pointer', ...opts.edgeStyle } },
    behaviors: opts.behaviors,
    autoFit: 'view',
    zoomRange: [0.3, 3],
  })
  opts.setInstance(graph)
  await graph.render()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph.on('node:click', (evt: any) => {
    const nodeId = evt.target?.id ?? evt.targetId
    const nodeModel = filteredNodes.find((n) => n.id === nodeId)
    if (nodeModel) {
      openNodeDetail({
        label: nodeModel.label,
        category: nodeModel.category,
        skillsSummary: nodeModel.skillsSummary,
        education: nodeModel.education,
        salaryMin: nodeModel.salaryMin,
        salaryMax: nodeModel.salaryMax,
        description: nodeModel.description,
      })
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graph.on('edge:click', (evt: any) => {
    const edgeId = evt.target?.id ?? evt.targetId
    const idx =
      typeof edgeId === 'string' ? parseInt(edgeId.replace(`${opts.edgeIdPrefix}-`, ''), 10) : -1
    const edgeModel = opts.data.edges[idx]
    if (edgeModel) {
      const srcNode = opts.data.nodes.find((n) => n.id === edgeModel.source)
      const tgtNode = opts.data.nodes.find((n) => n.id === edgeModel.target)
      openEdgeDetail(opts.edgeDetailMapper(edgeModel, srcNode, tgtNode), opts.edgeDetailType)
    }
  })
}

async function renderPromotionGraph(data: GraphData) {
  await renderGraph({
    containerRef: promotionContainerRef,
    getInstance: () => promotionGraphInstance,
    setInstance: (g) => { promotionGraphInstance = g },
    data,
    edgeIdPrefix: 'edge',
    edgeDataMapper: (e) => ({ description: e.description, conditions: e.conditions }),
    layout: { type: 'dagre', rankdir: 'TB', nodesep: 80, ranksep: 100 },
    nodeSize: [140, 40],
    edgeStyle: { stroke: '#90CAF9', lineWidth: 1.5 },
    behaviors: [
      { type: 'drag-canvas', key: 'drag-canvas', range: 0.8 },
      { type: 'zoom-canvas', key: 'zoom-canvas', sensitivity: 1 },
      'click-select',
    ],
    edgeDetailType: 'promotion-edge',
    edgeDetailMapper: (e, src, tgt) => ({
      source: src?.label || e.source,
      target: tgt?.label || e.target,
      description: e.description,
      conditions: e.conditions,
    }),
  })
}

async function renderTransferGraph(data: GraphData) {
  await renderGraph({
    containerRef: transferContainerRef,
    getInstance: () => transferGraphInstance,
    setInstance: (g) => { transferGraphInstance = g },
    data,
    edgeIdPrefix: 'transfer-edge',
    edgeDataMapper: (e) => ({ weight: e.weight, description: e.description, gapSkills: e.gapSkills }),
    layout: {
      type: 'circular',
      radius: 400,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      divisions: 1,
      ordering: 'topology',
    },
    nodeSize: [130, 38],
    labelMaxLen: 8,
    edgeStyle: {
      stroke: (d: Record<string, unknown>) => {
        const w = ((d.data as Record<string, unknown>)?.weight as number) || 0
        return w > 0.6 ? '#4CAF50' : w > 0.4 ? '#FF9800' : '#F44336'
      },
      lineWidth: (d: Record<string, unknown>) =>
        Math.max(1, (((d.data as Record<string, unknown>)?.weight as number) || 0) * 4),
    },
    behaviors: [
      { type: 'drag-canvas', key: 'drag-canvas', range: 0.8 },
      { type: 'zoom-canvas', key: 'zoom-canvas', sensitivity: 1 },
      'drag-element',
    ],
    edgeDetailType: 'transfer-edge',
    edgeDetailMapper: (e, src, tgt) => ({
      source: src?.label || e.source,
      target: tgt?.label || e.target,
      description: e.description,
      weight: e.weight,
      gapSkills: e.gapSkills,
    }),
  })
}

onMounted(async () => {
  fetchError.value = null
  try {
    await store.fetchGraphData()
    // 确保初始 Tab 的图谱渲染
    await nextTick()
    if (activeTab.value === 0 && store.graphData?.promotionGraph) {
      renderPromotionGraph(store.graphData.promotionGraph)
    } else if (activeTab.value === 1 && store.graphData?.transferGraph) {
      renderTransferGraph(store.graphData.transferGraph)
    }
  } catch {
    fetchError.value = '加载图谱数据失败，请检查网络后重试'
  }
})

async function retryLoad() {
  fetchError.value = null
  try {
    await store.fetchGraphData()
  } catch {
    fetchError.value = '加载图谱数据失败，请检查网络后重试'
  }
}

// 添加 immediate: true，确保在数据已缓存时立即渲染，无需等待下次变更
watch(
  () => store.graphData?.promotionGraph,
  (data) => {
    if (data) renderPromotionGraph(data)
  },
  { immediate: true },
)
watch(
  () => store.graphData?.transferGraph,
  (data) => {
    if (data) renderTransferGraph(data)
  },
  { immediate: true },
)

// 修复惰性渲染导致的 Tab 切换空白：v-window-item 在非活跃时不挂载 DOM，
// 数据 watch 触发时容器不存在故跳过渲染；切换后数据未变化 watch 不重触发。
// 方案：监听 activeTab，切换后 nextTick 等待 DOM 就绪，若实例尚未创建则补渲染。
watch(activeTab, async (tab) => {
  await nextTick()
  if (tab === 0 && store.graphData?.promotionGraph && !promotionGraphInstance) {
    renderPromotionGraph(store.graphData.promotionGraph)
  } else if (tab === 1 && store.graphData?.transferGraph && !transferGraphInstance) {
    renderTransferGraph(store.graphData.transferGraph)
  }
})

onBeforeUnmount(() => {
  if (promotionGraphInstance) promotionGraphInstance.destroy()
  if (transferGraphInstance) transferGraphInstance.destroy()
})
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '岗位图谱'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    >
    </PageHeader>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab :value="0">垂直晋升图谱</v-tab>
      <v-tab :value="1">换岗路径图谱</v-tab>
    </v-tabs>

    <v-alert type="info" variant="tonal" class="mb-4" density="compact" icon="mdi-gesture-tap">
      💡 点击图谱中的节点或连线可查看详细信息
    </v-alert>

    <ApiErrorState
      v-if="fetchError && !store.graphData"
      :error="fetchError"
      title="加载失败"
      @retry="retryLoad"
    />
    <v-skeleton-loader v-else-if="!store.graphData" type="image" class="mb-4" />

    <!-- 图谱校验警告 -->
    <template v-if="store.graphData">
      <v-alert
        v-for="(warning, idx) in [
          ...(store.graphData.promotionGraph?.warnings || []),
          ...(store.graphData.transferGraph?.warnings || []),
        ]"
        :key="idx"
        type="warning"
        variant="tonal"
        class="mb-2"
        density="compact"
        icon="mdi-alert-outline"
        >{{ warning }}</v-alert
      >
    </template>

    <v-window v-model="activeTab">
      <v-window-item :value="0" eager>
        <div
          v-if="store.graphData?.promotionGraph"
          ref="promotionContainerRef"
          class="graph-container"
        ></div>
        <v-alert v-else type="info" variant="tonal">晋升图谱尚未构建</v-alert>
      </v-window-item>
      <v-window-item :value="1" eager>
        <div
          v-if="store.graphData?.transferGraph"
          ref="transferContainerRef"
          class="graph-container"
        ></div>
        <v-alert v-else type="info" variant="tonal">换岗图谱尚未构建</v-alert>
      </v-window-item>
    </v-window>

    <!-- 节点/边详情弹窗 -->
    <v-dialog v-model="showDetailDialog" max-width="520">
      <v-card>
        <!-- 节点详情 -->
        <template v-if="detailType === 'node'">
          <v-card-title class="d-flex align-center">
            <v-icon start icon="mdi-briefcase-outline" color="primary" />
            {{ detailData.label }}
          </v-card-title>
          <v-card-subtitle>{{ detailData.category }}</v-card-subtitle>
          <v-card-text>
            <div v-if="detailData.education" class="mb-2">
              <span class="text-subtitle-2 font-weight-bold">学历要求：</span>{{ detailData.education }}
            </div>
            <div v-if="detailData.salaryMin || detailData.salaryMax" class="mb-2">
              <span class="text-subtitle-2 font-weight-bold">薪资范围：</span>
              {{ detailData.salaryMin ? detailData.salaryMin + ' 元' : '' }}
              {{ detailData.salaryMin && detailData.salaryMax ? ' - ' : '' }}
              {{ detailData.salaryMax ? detailData.salaryMax + ' 元/月' : '' }}
            </div>
            <div v-if="detailData.description" class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">岗位描述</div>
              <p class="text-body-2" style="white-space: pre-line">{{ detailData.description }}</p>
            </div>
            <div class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">核心技能</div>
              <div v-if="normalizeSkills(detailData.skillsSummary).length">
                <v-chip
                  v-for="skill in normalizeSkills(detailData.skillsSummary)"
                  :key="skill"
                  size="small"
                  color="primary"
                  variant="outlined"
                  class="mr-1 mb-1"
                  >{{ skill }}</v-chip
                >
              </div>
              <span v-else class="text-grey">暂无技能数据</span>
            </div>
          </v-card-text>
        </template>

        <!-- 晋升边详情 -->
        <template v-else-if="detailType === 'promotion-edge'">
          <v-card-title class="d-flex align-center">
            <v-icon start icon="mdi-arrow-up-bold" color="blue" />
            晋升路径
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-center mb-4">
              <v-chip color="blue" variant="flat">{{ detailData.source }}</v-chip>
              <v-icon class="mx-2" icon="mdi-arrow-right" />
              <v-chip color="blue-darken-2" variant="flat">{{ detailData.target }}</v-chip>
            </div>
            <div v-if="detailData.conditions" class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">晋升条件</div>
              <p style="white-space: pre-line">{{ detailData.conditions }}</p>
            </div>
            <div v-if="detailData.description" class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">关系说明</div>
              <p style="white-space: pre-line">{{ detailData.description }}</p>
            </div>
          </v-card-text>
        </template>

        <!-- 换岗边详情 -->
        <template v-else-if="detailType === 'transfer-edge'">
          <v-card-title class="d-flex align-center">
            <v-icon start icon="mdi-swap-horizontal" color="green" />
            换岗路径
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-center mb-4">
              <v-chip color="green" variant="flat">{{ detailData.source }}</v-chip>
              <v-icon class="mx-2" icon="mdi-swap-horizontal" />
              <v-chip color="green-darken-2" variant="flat">{{ detailData.target }}</v-chip>
            </div>
            <div v-if="detailData.weight != null" class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">技能重叠率</div>
              <v-progress-linear
                :model-value="(detailData.weight || 0) * 100"
                :color="
                  detailData.weight > 0.6 ? 'green' : detailData.weight > 0.4 ? 'orange' : 'red'
                "
                height="10"
                rounded
              />
              <span class="text-caption">{{ ((detailData.weight || 0) * 100).toFixed(1) }}%</span>
            </div>
            <div v-if="detailData.description" class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">转岗说明</div>
              <p style="white-space: pre-line">{{ detailData.description }}</p>
            </div>
            <div v-if="detailData.difficulty" class="mb-3">
              <span class="text-subtitle-2 font-weight-bold">换岗难度：</span>
              <v-chip
                size="small"
                :color="detailData.difficulty === '高' ? 'red' : detailData.difficulty === '低' ? 'green' : 'orange'"
                variant="flat"
                >{{ detailData.difficulty }}</v-chip
              >
            </div>
            <div v-if="normalizeSkills(detailData.gapSkills).length" class="mb-3">
              <div class="text-subtitle-2 font-weight-bold mb-1">需补充技能</div>
              <v-chip
                v-for="skill in normalizeSkills(detailData.gapSkills)"
                :key="skill"
                size="small"
                color="warning"
                variant="outlined"
                class="mr-1 mb-1"
                >{{ skill }}</v-chip
              >
            </div>
          </v-card-text>
        </template>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.graph-container {
  width: 100%;
  height: 500px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

@media (max-width: 959.98px) {
  .graph-container {
    height: 350px;
  }
}
</style>
