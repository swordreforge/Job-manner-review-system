import { createRouter, createWebHistory } from 'vue-router'
import { recordNonDocRoute } from '@/composables/useNavHistory'

const APP_TITLE = '大学生职业规划智能体'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── 公开页面 ──
    {
      path: '/',
      name: 'Home',
      meta: { title: '欢迎' },
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      meta: { title: '登录' },
      component: () => import('@/views/auth/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'Register',
      meta: { title: '注册' },
      component: () => import('@/views/auth/RegisterView.vue'),
    },
    {
      path: '/oauth2/callback/:provider',
      name: 'OAuthCallback',
      meta: { title: 'OAuth 登录' },
      component: () => import('@/views/auth/OAuthCallbackView.vue'),
    },

    // ── 帮助文档（公开，使用独立布局） ──
    {
      path: '/docs',
      component: () => import('@/layouts/DocLayout.vue'),
      children: [
        {
          path: '',
          name: 'Docs',
          meta: { title: '帮助文档' },
          redirect: '/docs/getting-started',
        },
        {
          path: ':slug+',
          name: 'DocPage',
          meta: { title: '帮助文档' },
          component: () => import('@/views/docs/DocView.vue'),
        },
      ],
    },

    // ── 需登录（Layout 包裹） ──
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          meta: { title: '首页', icon: 'mdi-home' },
          component: () => import('@/views/DashboardView.vue'),
        },

        // 岗位画像模块
        {
          path: 'jobs',
          name: 'JobList',
          meta: { title: '岗位画像', icon: 'mdi-briefcase', description: '查看 AI 生成的岗位画像，了解各类岗位的技能要求和发展前景', color: 'blue' },
          component: () => import('@/views/job/JobListView.vue'),
        },
        {
          path: 'jobs/graph',
          name: 'JobGraph',
          meta: { title: '岗位图谱', icon: 'mdi-graph', description: '可视化职业晋升与转型路径图，探索职业发展方向', color: 'teal' },
          component: () => import('@/views/job/JobGraphView.vue'),
        },
        {
          path: 'jobs/:id',
          name: 'JobDetail',
          meta: { title: '岗位详情' },
          component: () => import('@/views/job/JobDetailView.vue'),
        },

        // 学生画像模块
        {
          path: 'profile',
          name: 'StudentProfile',
          meta: { title: '学生画像', icon: 'mdi-account', description: '上传简历，AI 自动解析并生成个人能力画像', color: 'green' },
          component: () => import('@/views/student/ProfileView.vue'),
        },
        {
          path: 'profile/upload',
          redirect: '/profile',
        },
        {
          path: 'preference',
          name: 'CareerPreference',
          meta: { title: '就业意向', icon: 'mdi-briefcase-outline', description: '设置期望城市、薪资区间、求职方向和职业目标', color: 'amber' },
          component: () => import('@/views/student/CareerPreferenceView.vue'),
        },

        // 人岗匹配模块
        {
          path: 'match',
          name: 'Match',
          meta: { title: '人岗匹配', icon: 'mdi-compare-horizontal', description: '四维智能匹配，精准分析您与目标岗位的契合度', color: 'orange' },
          component: () => import('@/views/match/MatchView.vue'),
        },
        {
          path: 'match/:id',
          name: 'MatchResult',
          meta: { title: '匹配结果' },
          component: () => import('@/views/match/MatchResultView.vue'),
        },

        // 报告模块
        {
          path: 'reports',
          name: 'ReportList',
          meta: { title: '报告管理', icon: 'mdi-file-document', description: 'AI 生成职业生涯发展报告，支持编辑、润色和 PDF 导出', color: 'purple' },
          component: () => import('@/views/report/ReportListView.vue'),
        },
        {
          path: 'reports/:id',
          name: 'ReportEditor',
          meta: { title: '报告编辑' },
          component: () => import('@/views/report/ReportEditorView.vue'),
        },

        // 用户中心
        {
          path: 'user/settings',
          name: 'UserSettings',
          meta: { title: '用户中心', icon: 'mdi-account-edit', description: '修改用户名、密码，管理第三方账号绑定与学校归属' },
          component: () => import('@/views/user/ProfileSettingsView.vue'),
        },

        // 智能对话
        {
          path: 'chat/:conversationId?',
          name: 'Chat',
          meta: { title: '智能对话', icon: 'mdi-chat', description: '与 AI 助手实时对话，获取个性化的职业规划建议', color: 'cyan' },
          component: () => import('@/views/student/ChatView.vue'),
        },

        // 用户管理（管理功能，第一项）
        {
          path: 'admin/users',
          name: 'UserManage',
          meta: { title: '用户管理', icon: 'mdi-account-cog', description: '查看和管理系统中的所有用户与权限', color: 'blue', requiresAdmin: true },
          component: () => import('@/views/admin/UserManageView.vue'),
        },

        // 知识库导出（管理功能）
        {
          path: 'admin/export',
          name: 'KnowledgeExport',
          meta: { title: '知识库导出', icon: 'mdi-database-export', description: '导出 ChromaDB 向量知识库数据，用于备份或迁移', color: 'deep-purple', requiresAdmin: true },
          component: () => import('@/views/admin/KnowledgeExportView.vue'),
        },

        // 上传岗位数据（管理功能）
        {
          path: 'admin/upload',
          name: 'JobUpload',
          meta: { title: '数据导入', icon: 'mdi-upload', description: '批量上传岗位招聘数据，触发 AI 数据清洗与画像生成流水线', color: 'indigo', requiresAdmin: true },
          component: () => import('@/views/admin/JobUploadView.vue'),
        },

        // 任务队列监控（管理功能）
        {
          path: 'admin/tasks',
          name: 'TaskQueue',
          meta: { title: '任务队列', icon: 'mdi-format-list-checks', description: '监控异步任务队列执行状态和性能指标', color: 'orange', requiresAdmin: true },
          component: () => import('@/views/admin/TaskQueueView.vue'),
        },

        // OAuth 提供商管理（管理功能）
        {
          path: 'admin/oauth-providers',
          name: 'OAuthProviders',
          meta: { title: 'OAuth 提供商', icon: 'mdi-key-chain', description: '配置和管理第三方 OAuth 登录提供商', color: 'purple', requiresAdmin: true },
          component: () => import('@/views/admin/OAuthProviderManageView.vue'),
        },

        // 学校管理（管理功能）
        {
          path: 'admin/schools',
          name: 'SchoolManage',
          meta: { title: '学校管理', icon: 'mdi-domain', description: '管理学校信息、邀请码及学校管理员账号', color: 'teal', requiresAdmin: true },
          component: () => import('@/views/admin/SchoolManageView.vue'),
        },

        // API 密钥管理（管理功能）
        {
          path: 'admin/api-keys',
          name: 'ApiKeyManage',
          meta: { title: 'API 密钥', icon: 'mdi-key-variant', description: '管理 AI 服务 API 密钥及调用配额', color: 'amber', requiresAdmin: true },
          component: () => import('@/views/admin/ApiKeyManageView.vue'),
        },

        // LLM 模型配置
        {
          path: 'admin/llm-config',
          name: 'LlmConfig',
          meta: { title: '模型配置', icon: 'mdi-tune-variant', description: '配置 LLM 供应商、模型参数及各功能模型绑定', color: 'cyan', requiresAdmin: true },
          component: () => import('@/views/admin/LlmConfigView.vue'),
        },

        // LLM 计费统计
        {
          path: 'admin/llm-usage',
          name: 'LlmUsage',
          meta: { title: 'LLM 计费', icon: 'mdi-chart-bar', description: '查看 Token 用量统计与 LLM 调用费用明细', color: 'green', requiresAdmin: true },
          component: () => import('@/views/admin/LlmUsageView.vue'),
        },

        // 学校端功能
        {
          path: 'school/dashboard',
          name: 'SchoolDashboard',
          meta: { title: '就业看板', icon: 'mdi-chart-bar', description: '纵览本校学生就业准备全局数据，含评分分布、能力雷达与专业对比', color: 'indigo', requiresSchool: true },
          component: () => import('@/views/school/SchoolDashboardView.vue'),
        },
        {
          path: 'school/alerts',
          name: 'SchoolAlerts',
          meta: { title: '预警中心', icon: 'mdi-alert-circle', description: '自动标记需关注学生：未完成画像、评分过低、未匹配等', color: 'red', requiresSchool: true },
          component: () => import('@/views/school/SchoolAlertListView.vue'),
        },
        {
          path: 'school/chats',
          name: 'SchoolChats',
          meta: { title: '聊天记录', icon: 'mdi-chat-processing', description: '查阅本校学生的聊天记录，支持按用户名筛选与删除', color: 'cyan', requiresSchool: true },
          component: () => import('@/views/school/SchoolChatListView.vue'),
        },
        {
          path: 'school/students',
          name: 'SchoolStudentList',
          meta: { title: '学生列表', icon: 'mdi-account-group', description: '查看本校所有学生，支持多维筛选、对比分析与 Excel 导出', color: 'blue', requiresSchool: true },
          component: () => import('@/views/school/SchoolStudentListView.vue'),
        },
        {
          path: 'school/students/compare',
          name: 'SchoolStudentCompare',
          meta: { title: '对比分析', requiresSchool: true },
          component: () => import('@/views/school/SchoolStudentCompareView.vue'),
        },
        {
          path: 'school/students/:userId',
          name: 'SchoolStudentDetail',
          meta: { title: '学生详情', requiresSchool: true },
          component: () => import('@/views/school/SchoolStudentDetailView.vue'),
        },
        {
          path: 'school/import',
          name: 'SchoolBatchImport',
          meta: { title: '批量导入', icon: 'mdi-file-upload', description: '通过 Excel/CSV 批量创建学生账号，支持自动生成密码', color: 'green', requiresSchool: true },
          component: () => import('@/views/school/SchoolBatchImportView.vue'),
        },
        {
          path: 'school/students/:userId/chats',
          name: 'SchoolStudentChats',
          meta: { title: '学生聊天记录', requiresSchool: true },
          component: () => import('@/views/school/SchoolStudentChatView.vue'),
        },

        // 管理端聊天记录
        {
          path: 'admin/chats',
          name: 'AdminChats',
          meta: { title: '聊天记录', icon: 'mdi-chat-processing', description: '查阅全量用户聊天记录，支持按用户名筛选', color: 'red', requiresAdmin: true },
          component: () => import('@/views/admin/AdminChatListView.vue'),
        },
      ],
    },
  ],
})

// P10: 路由守卫 — 统一 store 加载，仅在首次或 user 为空时请求用户信息
router.beforeEach(async (to) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
  const requiresSchool = to.matched.some((record) => record.meta.requiresSchool)

  // 管理员文档路由保护：/docs/admin/* 需要管理员权限
  const isAdminDocRoute = to.path.startsWith('/docs/admin')
  // 学校管理员文档路由保护：/docs/school/* 需要学校管理员权限
  const isSchoolDocRoute = to.path.startsWith('/docs/school')

  // P10: 提取公共逻辑，只导入一次 store，只在 user 为空时请求
  const needsUserInfo =
    token &&
    (requiresAdmin || requiresSchool || isAdminDocRoute || isSchoolDocRoute ||
     to.path === '/login' || to.path === '/register')

  let authStore: Awaited<ReturnType<typeof import('@/stores/auth').useAuthStore>> | null = null
  if (needsUserInfo) {
    const { useAuthStore } = await import('@/stores/auth')
    authStore = useAuthStore()
    if (!authStore.user) {
      await authStore.fetchCurrentUser()
    }
  }

  if (isAdminDocRoute) {
    if (!token) return '/login'
    if (!authStore?.isAdmin) return '/docs/getting-started'
    return true
  }

  if (isSchoolDocRoute) {
    if (!token) return '/login'
    if (!authStore?.isSchool) return '/docs/getting-started'
    return true
  }

  if (requiresAuth && !token) return '/'

  if ((to.path === '/login' || to.path === '/register') && token) return '/dashboard'

  if (requiresAdmin && token && !authStore?.isAdmin) return '/dashboard'

  if (requiresSchool && token && !authStore?.isSchool) return '/dashboard'

  return true
})

// 动态标题 & 记录最后非文档路由
router.afterEach((to, from) => {
  document.title = to.meta.title ? `${to.meta.title} | ${APP_TITLE}` : APP_TITLE
  // 仅当 from 是真实页面（matched 非空）且不是文档页时才记录
  if (from.matched.length > 0 && !from.path.startsWith('/docs')) {
    recordNonDocRoute(from.fullPath)
  }
})

export default router
