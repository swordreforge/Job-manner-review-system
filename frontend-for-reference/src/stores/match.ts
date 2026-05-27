import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MatchResult } from '@/types/match'
import type { ApiResponse, PageData, TaskSubmitData, BatchTaskSubmitData } from '@/types/api'
import * as matchApi from '@/api/match'
import { waitForTask } from '@/api/sse'
import { useAsyncAction } from '@/composables/useAsyncAction'

export const useMatchStore = defineStore('match', () => {
  const matchResults = ref<MatchResult[]>([])
  const currentMatch = ref<MatchResult | null>(null)
  const { loading, run } = useAsyncAction()
  const totalPages = ref(0)
  const pendingTaskId = ref<number | null>(null)

  /**
   * 提交单岗匹配任务（异步），返回 taskId。
   * 可选地通过 SSE 等待完成。
   */
  async function startMatch(jobProfileId: string, awaitCompletion = false): Promise<number> {
    return run(async () => {
      const res = (await matchApi.startMatch({
        jobProfileId,
      })) as unknown as ApiResponse<TaskSubmitData>
      const taskId = res.data?.taskId
      pendingTaskId.value = taskId

      if (awaitCompletion && taskId) {
        await waitForTask(taskId)
        await fetchMatchResults()
      }
      pendingTaskId.value = null
      return taskId
    })
  }

  /**
   * 提交多岗批量匹配任务（异步），返回 taskIds。
   */
  async function batchMatch(jobProfileIds: string[]): Promise<number[]> {
    return run(async () => {
      const res = (await matchApi.startMatch({
        jobProfileIds,
      })) as unknown as ApiResponse<BatchTaskSubmitData>
      return res.data?.taskIds || []
    })
  }

  async function fetchMatchResults(page = 0, size = 10) {
    return run(async () => {
      const res = (await matchApi.getMatchResults({ page, size })) as unknown as ApiResponse<
        PageData<MatchResult>
      >
      matchResults.value = res.data?.content || []
      totalPages.value = res.data?.page?.totalPages || 0
    })
  }

  async function fetchMatchDetail(id: string) {
    return run(async () => {
      const res = (await matchApi.getMatchDetail(id)) as unknown as ApiResponse<MatchResult>
      currentMatch.value = res.data
    })
  }

  return {
    matchResults,
    currentMatch,
    loading,
    totalPages,
    pendingTaskId,
    startMatch,
    batchMatch,
    fetchMatchResults,
    fetchMatchDetail,
  }
})
