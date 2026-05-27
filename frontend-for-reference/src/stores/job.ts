import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { JobProfile, GraphData } from '@/types/job'
import type { ApiResponse, PageData } from '@/types/api'
import * as jobApi from '@/api/job'

export const useJobStore = defineStore('job', () => {
  const jobList = ref<JobProfile[]>([])
  const currentJob = ref<JobProfile | null>(null)
  const categories = ref<string[]>([])
  const graphData = ref<{ promotionGraph: GraphData; transferGraph: GraphData } | null>(null)
  const filters = ref({ keyword: '', category: '', page: 0, size: 20 })
  const totalElements = ref(0)
  const hasMore = ref(true)
  const loading = ref(false)

  async function fetchJobList(append: boolean = false) {
    loading.value = true
    try {
      const res = (await jobApi.getJobList({
        page: filters.value.page,
        size: filters.value.size,
        keyword: filters.value.keyword || undefined,
        category: filters.value.category || undefined,
      })) as unknown as ApiResponse<PageData<JobProfile>>
      const content = res.data.content || []
      if (append) {
        jobList.value = [...jobList.value, ...content]
      } else {
        jobList.value = content
      }
      totalElements.value = res.data.page?.totalElements || 0
      const pageNum = res.data.page?.number ?? filters.value.page
      const totalPages = res.data.page?.totalPages || 0
      hasMore.value = pageNum + 1 < totalPages
    } finally {
      loading.value = false
    }
  }

  async function resetAndFetch() {
    filters.value.page = 0
    hasMore.value = true
    await fetchJobList(false)
  }

  async function fetchJobDetail(id: string) {
    loading.value = true
    try {
      const res = (await jobApi.getJobDetail(id)) as unknown as ApiResponse<JobProfile>
      currentJob.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    const res = (await jobApi.getCategories()) as unknown as ApiResponse<string[]>
    categories.value = res.data || []
  }

  async function fetchGraphData() {
    const [promoRes, transRes] = (await Promise.all([
      jobApi.getPromotionGraph(),
      jobApi.getTransferGraph(),
    ])) as unknown as [ApiResponse<GraphData>, ApiResponse<GraphData>]
    graphData.value = {
      promotionGraph: promoRes.data || { nodes: [], edges: [] },
      transferGraph: transRes.data || { nodes: [], edges: [] },
    }
  }

  return {
    jobList,
    currentJob,
    categories,
    graphData,
    filters,
    totalElements,
    hasMore,
    loading,
    fetchJobList,
    resetAndFetch,
    fetchJobDetail,
    fetchCategories,
    fetchGraphData,
  }
})
