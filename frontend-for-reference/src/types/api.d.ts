/** 后端统一响应信封 */
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  code?: number
}

/** 分页响应（Spring PagedModel VIA_DTO 格式） */
export interface PageData<T> {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

/** 异步任务提交响应 */
export interface TaskSubmitData {
  taskId: number
}

/** 批量异步任务提交响应 */
export interface BatchTaskSubmitData {
  taskIds: number[]
}
