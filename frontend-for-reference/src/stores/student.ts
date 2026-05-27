import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StudentProfile } from '@/types/student'
import type { ApiResponse } from '@/types/api'
import * as studentApi from '@/api/student'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { onTaskEvent } from '@/api/sse'

/** 会触发 profile 更新的任务类型 */
const PROFILE_TASK_TYPES = new Set(['RESUME_PARSE', 'STUDENT_PROFILE_FROM_INPUT'])

export const useStudentStore = defineStore('student', () => {
  const profile = ref<StudentProfile | null>(null)
  const parseStatus = ref<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const { loading, run } = useAsyncAction()

  /** 防止重复订阅 SSE */
  let profileListenerCleanup: (() => void) | null = null

  /**
   * 监听 SSE 任务事件，任务完成后自动刷新 profile。
   * 幂等：已有监听时不重复注册。
   */
  function listenForProfileCompletion(): void {
    if (profileListenerCleanup) return

    profileListenerCleanup = onTaskEvent((event) => {
      if (!PROFILE_TASK_TYPES.has(event.taskType)) return

      if (event.status === 'COMPLETED') {
        profileListenerCleanup?.()
        profileListenerCleanup = null
        fetchProfile()
      } else if (event.status === 'FAILED') {
        profileListenerCleanup?.()
        profileListenerCleanup = null
        parseStatus.value = 'error'
      }
    })
  }

  async function uploadResume(file: File) {
    parseStatus.value = 'parsing'
    try {
      await run(async () => {
        await studentApi.uploadResume(file)
        // 任务已入队，不从响应中设置 profile —— 等待 SSE 通知后再拉取
      })
      listenForProfileCompletion()
    } catch (e) {
      parseStatus.value = 'error'
      throw e
    }
  }

  async function submitManualProfile(data: Record<string, unknown>) {
    parseStatus.value = 'parsing'
    try {
      await run(async () => {
        await studentApi.submitManualProfile(data)
        // 任务已入队，不从响应中设置 profile —— 等待 SSE 通知后再拉取
      })
      listenForProfileCompletion()
    } catch (e) {
      parseStatus.value = 'error'
      throw e
    }
  }

  async function fetchProfile() {
    await run(async () => {
      try {
        const res = (await studentApi.getProfile()) as unknown as ApiResponse<StudentProfile | null>
        if (res.data) {
          profile.value = res.data
          parseStatus.value = 'done'
        } else {
          profile.value = null
          // 检查后端是否仍有进行中的解析任务（处理页面刷新场景）
          try {
            const statusRes = (await studentApi.getParseStatus()) as unknown as ApiResponse<{
              status: string
            }>
            const status = (statusRes.data?.status || 'idle') as typeof parseStatus.value
            parseStatus.value = status
            if (status === 'parsing') {
              listenForProfileCompletion()
            }
          } catch {
            parseStatus.value = 'idle'
          }
        }
      } catch {
        parseStatus.value = 'idle'
      }
    })
  }

  async function updateProfile(data: Record<string, unknown>) {
    await run(async () => {
      const res = (await studentApi.updateProfile(
        data,
      )) as unknown as ApiResponse<StudentProfile | null>
      profile.value = res.data
    })
  }

  async function checkParseStatus() {
    const res = (await studentApi.getParseStatus()) as unknown as ApiResponse<{ status: string }>
    parseStatus.value = (res.data?.status || 'idle') as typeof parseStatus.value
  }

  return {
    profile,
    parseStatus,
    loading,
    uploadResume,
    submitManualProfile,
    fetchProfile,
    updateProfile,
    checkParseStatus,
  }
})
