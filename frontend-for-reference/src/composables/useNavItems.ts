import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export interface NavItem {
  title: string
  icon: string
  to: string
  description?: string
  color?: string
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

interface NavGroupDef {
  title?: string
  paths: string[]
}

const studentGroupDefs: NavGroupDef[] = [
  { paths: ['/dashboard'] },
  { title: '职业探索', paths: ['/chat', '/jobs', '/jobs/graph'] },
  { title: '我的信息', paths: ['/profile', '/preference', '/match', '/reports'] },
  { title: '账号', paths: ['/user/settings'] },
]

const schoolGroupDefs: NavGroupDef[] = [
  { paths: ['/dashboard'] },
  { title: '数据分析', paths: ['/school/dashboard', '/school/alerts'] },
  { title: '学生管理', paths: ['/school/students', '/school/chats', '/school/import'] },
  { title: '账号', paths: ['/user/settings'] },
]

const adminGroupDefs: NavGroupDef[] = [
  { paths: ['/dashboard'] },
  { title: '用户管理', paths: ['/admin/users', '/admin/schools'] },
  { title: '数据管理', paths: ['/admin/upload', '/admin/export'] },
  { title: 'AI 配置', paths: ['/admin/llm-config', '/admin/llm-usage'] },
  { title: '第三方接入', paths: ['/admin/oauth-providers', '/admin/api-keys'] },
  { title: '运维监控', paths: ['/admin/tasks', '/admin/chats'] },
  { title: '账号', paths: ['/user/settings'] },
]

export function useNavItems() {
  const authStore = useAuthStore()
  const router = useRouter()

  function resolveItem(path: string): NavItem {
    const meta = router.resolve(path).meta
    return {
      title: (meta.title as string) ?? path,
      icon: (meta.icon as string) ?? 'mdi-circle',
      to: path,
      description: meta.description as string | undefined,
      color: meta.color as string | undefined,
    }
  }

  function resolveGroups(defs: NavGroupDef[]): NavGroup[] {
    return defs.map((d) => ({ title: d.title, items: d.paths.map(resolveItem) }))
  }

  const navGroups = computed<NavGroup[]>(() => {
    if (authStore.isAdmin) return resolveGroups(adminGroupDefs)
    if (authStore.isSchool) return resolveGroups(schoolGroupDefs)
    return resolveGroups(studentGroupDefs)
  })

  const navItems = computed<NavItem[]>(() => navGroups.value.flatMap((g) => g.items))

  /** 用于首页功能卡片：排除"首页"自身 */
  const featureCards = computed<NavItem[]>(() =>
    navItems.value.filter((item) => item.to !== '/dashboard'),
  )

  /** 按路由路径查找 NavItem，用于视图中同步 PageHeader 标题与简介 */
  const findNavItemByPath = (path: string): NavItem | undefined =>
    navItems.value.find((item) => item.to === path)

  return { navItems, navGroups, featureCards, findNavItemByPath }
}
