/** 任务消息（管理员队列展示用） */
export interface TaskMessage {
  id: number
  userId: string | null
  type: string
  status: 'PENDING' | 'DISPATCHED' | 'COMPLETED' | 'FAILED'
  retryCount: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

/** 队列统计 */
export interface QueueStats {
  pending: number
  dispatched: number
  completed: number
  failed: number
  total: number
}
