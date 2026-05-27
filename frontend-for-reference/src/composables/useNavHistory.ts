import { ref } from 'vue'

// 记录最后一个非文档页面路径，用于文档页返回按钮
const lastNonDocPath = ref('/')

export function recordNonDocRoute(fullPath: string) {
  lastNonDocPath.value = fullPath
}

export function useNavHistory() {
  return { lastNonDocPath }
}
