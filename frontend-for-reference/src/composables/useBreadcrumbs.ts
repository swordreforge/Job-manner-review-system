import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface BreadcrumbRoute {
  title: string
  parent?: string
}

const routeMap: Record<string, BreadcrumbRoute> = {
  '/dashboard': { title: '首页' },

  // 学生端
  '/jobs': { title: '岗位画像', parent: '/dashboard' },
  '/jobs/graph': { title: '岗位图谱', parent: '/dashboard' },
  '/jobs/:id': { title: '岗位详情', parent: '/jobs' },
  '/profile': { title: '学生画像', parent: '/dashboard' },
  '/preference': { title: '就业意向', parent: '/dashboard' },
  '/match': { title: '人岗匹配', parent: '/dashboard' },
  '/match/:id': { title: '匹配结果', parent: '/match' },
  '/reports': { title: '报告管理', parent: '/dashboard' },
  '/reports/:id': { title: '报告编辑', parent: '/reports' },
  '/user/settings': { title: '用户中心', parent: '/dashboard' },
  '/chat': { title: '智能对话', parent: '/dashboard' },

  // 管理端
  '/admin/users': { title: '用户管理', parent: '/dashboard' },
  '/admin/export': { title: '知识库导出', parent: '/dashboard' },
  '/admin/upload': { title: '数据导入', parent: '/dashboard' },
  '/admin/tasks': { title: '任务队列', parent: '/dashboard' },
  '/admin/oauth-providers': { title: 'OAuth 提供商', parent: '/dashboard' },
  '/admin/schools': { title: '学校管理', parent: '/dashboard' },
  '/admin/api-keys': { title: 'API 密钥', parent: '/dashboard' },
  '/admin/llm-config': { title: '模型配置', parent: '/dashboard' },
  '/admin/llm-usage': { title: 'LLM 计费', parent: '/dashboard' },
  '/admin/chats': { title: '聊天记录', parent: '/dashboard' },

  // 学校端
  '/school/dashboard': { title: '就业看板' },
  '/school/alerts': { title: '预警中心', parent: '/school/dashboard' },
  '/school/chats': { title: '聊天记录', parent: '/school/dashboard' },
  '/school/students': { title: '学生列表', parent: '/school/dashboard' },
  '/school/students/compare': { title: '对比分析', parent: '/school/students' },
  '/school/students/:userId': { title: '学生详情', parent: '/school/students' },
  '/school/import': { title: '批量导入', parent: '/school/dashboard' },
  '/school/students/:userId/chats': {
    title: '学生聊天记录',
    parent: '/school/students/:userId',
  },
}

/** 将实际路径匹配到 pattern，返回提取的参数 */
function matchRoute(path: string): { pattern: string; params: Record<string, string> } | null {
  for (const pattern of Object.keys(routeMap)) {
    const paramNames: string[] = []
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name: string) => {
      paramNames.push(name)
      return '([^/]+)'
    })
    const regex = new RegExp(`^${regexStr}$`)
    const m = path.match(regex)
    if (m) {
      const params: Record<string, string> = {}
      paramNames.forEach((name, i) => {
        const val = m[i + 1]
        if (val !== undefined) params[name] = val
      })
      return { pattern, params }
    }
  }
  return null
}

/** 将 pattern 中的 :param 替换为实际参数值 */
function fillParams(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/:([^/]+)/g, (_, name: string) => params[name] ?? `:${name}`)
}

export interface BreadcrumbItem {
  title: string
  to?: string
  disabled: boolean
}

export function useBreadcrumbs(overrideTitle?: () => string | undefined) {
  const route = useRoute()

  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const path = route.path
    const matched = matchRoute(path)
    if (!matched) return []

    const { pattern, params } = matched
    const items: BreadcrumbItem[] = []

    // 沿 parent 链回溯
    let currentPattern: string | undefined = pattern
    while (currentPattern !== undefined) {
      const config: BreadcrumbRoute | undefined = routeMap[currentPattern]
      if (!config) break
      const actualPath = fillParams(currentPattern, params)
      items.unshift({ title: config.title, to: actualPath, disabled: false })
      currentPattern = config.parent
    }

    // 最后一项：不可点击，可覆盖标题
    const last = items[items.length - 1]
    if (last !== undefined) {
      last.disabled = true
      last.to = undefined
      const override = overrideTitle?.()
      if (override) last.title = override
    }

    return items
  })

  return { breadcrumbs }
}
