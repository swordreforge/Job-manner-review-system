/**
 * 全局任务完成通知模块 —— 监听 SSE 事件，通过响应式状态驱动全局 v-snackbar。
 *
 * 功能：
 * - 任务完成 / 失败时弹出全局 snackbar 提示（无论当前在哪个页面）
 * - 系统任务（DATA_CLEAN / PROFILE_GENERATE / GRAPH_BUILD）不弹通知
 * - 用户离线时不会收到通知（后端 SSE 仅推给在线连接）
 */

import { ref } from 'vue'
import { onTaskEvent, type TaskEvent } from '@/api/sse'

// ── 响应式 snackbar 状态（由 App.vue 绑定） ──

export const notifyVisible = ref(false)
export const notifyText = ref('')
export const notifyColor = ref<'success' | 'error' | 'info'>('success')

// ── 系统任务类型 —— 这些不向用户推送通知 ──

const SYSTEM_TASK_TYPES = new Set(['DATA_CLEAN', 'PROFILE_GENERATE', 'GRAPH_BUILD', 'CHAT_TITLE_GENERATE'])

// ── 任务类型 → 中文名映射 ──

const TASK_TYPE_LABELS: Record<string, string> = {
  RESUME_PARSE: '简历解析',
  STUDENT_PROFILE: '学生画像生成',
  STUDENT_PROFILE_FROM_INPUT: '学生画像生成',
  MATCH_ANALYZE: '人岗匹配',
  REPORT_GENERATE: '报告生成',
  REPORT_POLISH: '报告润色',
  REPORT_COMPLETENESS_CHECK: '完整性检查',
}

function getTaskLabel(taskType: string): string {
  return TASK_TYPE_LABELS[taskType] ?? taskType
}

/**
 * 显示一条全局 snackbar 通知
 */
function showNotify(text: string, color: 'success' | 'error' | 'info' = 'success') {
  notifyText.value = text
  notifyColor.value = color
  notifyVisible.value = true
}

/**
 * 初始化全局任务通知监听 —— 在 App.vue setup 中调用一次即可。
 */
export function initTaskNotification(): void {
  onTaskEvent((event: TaskEvent) => {
    // 系统任务不通知
    if (SYSTEM_TASK_TYPES.has(event.taskType)) {
      return
    }

    const label = getTaskLabel(event.taskType)

    if (event.status === 'COMPLETED') {
      showNotify(`${label}任务已完成`, 'success')
    } else if (event.status === 'FAILED') {
      showNotify(`${label}任务失败`, 'error')
    }
  })
}
