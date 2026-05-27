import { ref } from 'vue'

/**
 * 带 error ref 的异步操作封装。
 * 在现有 useAsyncAction 基础上增加错误状态管理，用于需要显示 ApiErrorState 的页面。
 */
export function useAsyncData() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        error.value = '网络连接失败，请检查网络后重试'
      } else if (err && typeof err === 'object' && 'response' in err) {
        const e = err as { response?: { status?: number; data?: { message?: string } } }
        const status = e.response?.status
        if (status === 401 || status === 403) {
          error.value = '权限不足，请重新登录'
        } else if (status && status >= 500) {
          error.value = '服务器错误，请稍后重试'
        } else {
          error.value = e.response?.data?.message ?? '请求失败，请稍后重试'
        }
      } else {
        error.value = '请求失败，请稍后重试'
      }
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}
