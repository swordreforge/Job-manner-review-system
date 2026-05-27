/**
 * 统一 API 错误信息提取工具函数。
 * 替换各视图中重复的深层类型断言链：
 *   (err as { response?: { data?: { message?: string } } })?.response?.data?.message
 */

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

/**
 * 从 axios 错误或任意 unknown 异常中提取可读的错误消息。
 * 优先返回服务器返回的 response.data.message，其次返回 err.message，最后返回 fallback。
 */
export function getApiErrorMessage(err: unknown, fallback = '操作失败'): string {
  const e = err as ApiErrorShape
  return e?.response?.data?.message ?? e?.message ?? fallback
}
