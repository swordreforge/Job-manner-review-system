import { ref } from 'vue'

/**
 * 封装 loading 状态管理的 composable（1.12 优化：消除 stores 中重复的 loading/error 样板代码）
 */
export function useAsyncAction() {
  const loading = ref(false)

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
