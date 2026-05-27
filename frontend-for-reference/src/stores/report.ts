import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Report, ReportVersionSummary } from '@/types/report'
import type { ApiResponse, PageData, TaskSubmitData } from '@/types/api'
import * as reportApi from '@/api/report'
import { waitForTask } from '@/api/sse'
import { useAsyncAction } from '@/composables/useAsyncAction'

export const useReportStore = defineStore('report', () => {
  const reportList = ref<Report[]>([])
  const currentReport = ref<Report | null>(null)
  const editStatus = ref<'idle' | 'saving' | 'saved'>('idle')
  const { loading, run } = useAsyncAction()
  const totalPages = ref(0)
  const pendingTaskId = ref<number | null>(null)

  // 版本历史
  const versionHistory = ref<ReportVersionSummary[]>([])
  // 润色后上一版本号（供 Snackbar 撤销使用）
  const lastPolishPreviousVersion = ref<number | null>(null)

  async function generateReport(matchResultId: string, awaitCompletion = false): Promise<number> {
    return run(async () => {
      const res = (await reportApi.generateReport(
        matchResultId,
      )) as unknown as ApiResponse<TaskSubmitData>
      const taskId = res.data?.taskId
      pendingTaskId.value = taskId

      if (awaitCompletion && taskId) {
        await waitForTask(taskId)
        await fetchReports()
      }
      pendingTaskId.value = null
      return taskId
    })
  }

  async function fetchReports(page = 0, size = 10) {
    return run(async () => {
      const res = (await reportApi.getReports({ page, size })) as unknown as ApiResponse<
        PageData<Report>
      >
      reportList.value = res.data?.content || []
      totalPages.value = res.data?.page?.totalPages || 0
    })
  }

  async function fetchReport(id: string) {
    return run(async () => {
      const res = (await reportApi.getReport(id)) as unknown as ApiResponse<Report>
      currentReport.value = res.data
    })
  }

  async function saveReport(id: string, content: string) {
    editStatus.value = 'saving'
    try {
      const res = (await reportApi.updateReport(id, content)) as unknown as ApiResponse<Report>
      currentReport.value = res.data
      editStatus.value = 'saved'
      // 刷新版本历史
      await fetchVersionHistory(id)
    } catch {
      editStatus.value = 'idle'
    }
  }

  async function polishReport(
    id: string,
    section?: number,
    awaitCompletion = false,
  ): Promise<{ taskId: number; previousVersion: number | null }> {
    return run(async () => {
      // 记录润色前版本号
      const prevVersion = currentReport.value?.version ?? null
      lastPolishPreviousVersion.value = prevVersion

      const res = (await reportApi.polishReport(
        id,
        section,
      )) as unknown as ApiResponse<TaskSubmitData>
      const taskId = res.data?.taskId
      pendingTaskId.value = taskId

      if (awaitCompletion && taskId) {
        await waitForTask(taskId)
        await fetchReport(id)
        await fetchVersionHistory(id)
      }
      pendingTaskId.value = null
      return { taskId, previousVersion: prevVersion }
    })
  }

  async function deleteReport(id: string) {
    await reportApi.deleteReport(id)
    reportList.value = reportList.value.filter((r) => r.id !== id)
  }

  async function checkCompleteness(id: string) {
    const res = (await reportApi.checkCompleteness(id)) as unknown as ApiResponse<{
      taskId: number
    }>
    return res.data.taskId
  }

  // ── 版本历史 ──

  async function fetchVersionHistory(id: string) {
    const res = (await reportApi.getVersionHistory(id)) as unknown as ApiResponse<
      ReportVersionSummary[]
    >
    versionHistory.value = res.data || []
  }

  async function revertToVersion(id: string, version: number) {
    const res = (await reportApi.revertToVersion(id, version)) as unknown as ApiResponse<Report>
    currentReport.value = res.data
    await fetchVersionHistory(id)
  }

  return {
    reportList,
    currentReport,
    editStatus,
    loading,
    totalPages,
    pendingTaskId,
    versionHistory,
    lastPolishPreviousVersion,
    generateReport,
    fetchReports,
    fetchReport,
    saveReport,
    polishReport,
    deleteReport,
    checkCompleteness,
    fetchVersionHistory,
    revertToVersion,
  }
})
