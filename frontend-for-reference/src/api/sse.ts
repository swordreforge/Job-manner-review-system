/**
 * SSE 连接管理 —— 与后端建立长连接，接收任务状态更新事件。
 *
 * - 仅在用户已登录（token 存在）时建立连接
 * - 通过一次性 ticket 机制建立连接，避免在 URL 中暴露 JWT token
 * - 内置心跳看门狗：45 秒内未收到后端心跳则自动重连
 * - 断线重连前检查登录状态，未登录则不重连
 */

import axios from 'axios'

type TaskEventHandler = (event: TaskEvent) => void

export interface TaskEvent {
  taskId: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
  taskType: string
  data: Record<string, unknown>
  result?: unknown
}

let eventSource: EventSource | null = null
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const handlers = new Set<TaskEventHandler>()

/** 心跳看门狗超时（毫秒）—— 后端每 30s 发一次心跳，45s 仍未收到则视为断连 */
const HEARTBEAT_TIMEOUT = 45_000
/** 断线重连延迟（毫秒） */
const RECONNECT_DELAY = 5_000

/**
 * 重置心跳看门狗定时器
 */
function resetHeartbeatTimer(): void {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
  }
  heartbeatTimer = setTimeout(() => {
    console.warn('SSE 心跳超时，尝试重连...')
    disconnectSSE()
    scheduleReconnect()
  }, HEARTBEAT_TIMEOUT)
}

/**
 * 在检查登录状态后延迟重连
 * 清除已有 timer 防止重连竞态
 */
function scheduleReconnect(): void {
  const token = localStorage.getItem('token')
  if (!token) {
    return // 已登出，不再重连
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectSSE()
  }, RECONNECT_DELAY)
}

/**
 * 建立 SSE 连接（需先确保已登录）
 * 通过一次性 ticket 机制避免在 URL 中暴露 JWT token
 */
export async function connectSSE(): Promise<void> {
  if (eventSource) {
    return // 已连接
  }

  const token = localStorage.getItem('token')
  if (!token) {
    return // 未登录，不建立连接
  }

  try {
    // 先通过 Authorization Header 获取一次性 ticket
    const res = await axios.post('/api/tasks/sse-ticket', null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const ticket = res.data?.data?.ticket
    if (!ticket) {
      console.error('获取 SSE ticket 失败')
      scheduleReconnect()
      return
    }

    // 用 ticket 建立 SSE 连接（ticket 30秒有效，一次性使用）
    eventSource = new EventSource(`/api/tasks/events?ticket=${encodeURIComponent(ticket)}`)
  } catch {
    console.error('获取 SSE ticket 请求失败，稍后重试')
    scheduleReconnect()
    return
  }

  // 监听业务事件
  eventSource.addEventListener('task-update', (e: MessageEvent) => {
    try {
      const event: TaskEvent = JSON.parse(e.data)
      handlers.forEach((handler) => handler(event))
    } catch (err) {
      console.error('SSE 事件解析失败:', err)
    }
  })

  // 监听心跳事件 —— 重置看门狗
  eventSource.addEventListener('heartbeat', () => {
    resetHeartbeatTimer()
  })

  // 连接成功后启动看门狗
  eventSource.onopen = () => {
    resetHeartbeatTimer()
  }

  // 连接错误 —— 断开后延迟重连（需检查登录状态）
  eventSource.onerror = () => {
    console.warn('SSE 连接断开，稍后重连...')
    disconnectSSE()
    scheduleReconnect()
  }
}

/**
 * 断开 SSE 连接并清理所有定时器
 */
export function disconnectSSE(): void {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
    heartbeatTimer = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

/**
 * 注册事件处理器
 */
export function onTaskEvent(handler: TaskEventHandler): () => void {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

/**
 * 监听特定 taskId 的事件，完成/失败后自动移除。
 * F1: 添加超时机制，防止任务在注册前完成导致 Promise 永久挂起。
 * @param taskId 要监听的任务 ID
 * @param timeoutMs 超时时间（毫秒），默认 120s
 */
export function waitForTask(taskId: number, timeoutMs = 120_000): Promise<TaskEvent> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = onTaskEvent((event) => {
      if (event.taskId === taskId) {
        if (event.status === 'COMPLETED') {
          if (timer) clearTimeout(timer)
          unsubscribe()
          resolve(event)
        } else if (event.status === 'FAILED') {
          if (timer) clearTimeout(timer)
          unsubscribe()
          reject(new Error(`任务失败: ${JSON.stringify(event.data)}`))
        }
        // PROCESSING / RETRYING 不做处理，继续监听
      }
    })

    timer = setTimeout(() => {
      unsubscribe()
      reject(new Error(`任务 ${taskId} 等待超时（${timeoutMs / 1000}s）`))
    }, timeoutMs)
  })
}
