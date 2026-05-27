/**
 * 文档清单 — 定义文档树结构、路由 slug 与角色权限
 *
 * 约定：
 * - `slug` 即路由参数，同时也是 `.md` 文件在 `content/` 目录下的路径（不含扩展名）
 * - `role`  为空表示公开可见（无需登录），'admin' 表示仅管理员可见
 * - `children` 支持嵌套分组
 */

export interface DocNode {
  /** 显示标题 */
  title: string
  /** 路由标识 / 文件路径（不含 .md） */
  slug: string
  /** mdi 图标名 */
  icon?: string
  /** 访问角色限制：undefined = 公开可见（无需登录），'admin' = 仅管理员可见，'school' = 仅学校管理员可见 */
  role?: 'admin' | 'school'
  /** 子节点 */
  children?: DocNode[]
}

/** 文档分组 */
export interface DocSection {
  /** 分组标题 */
  heading: string
  /** 可选图标 */
  icon?: string
  /** 角色限制 */
  role?: 'admin' | 'school'
  /** 分组下的文档 */
  items: DocNode[]
}

export const docSections: DocSection[] = [
  {
    heading: '快速上手',
    icon: 'mdi-rocket-launch',
    items: [
      { title: '欢迎使用', slug: 'getting-started', icon: 'mdi-hand-wave' },
      { title: '上传简历', slug: 'resume-upload', icon: 'mdi-file-upload' },
      { title: '学生画像', slug: 'student-profile', icon: 'mdi-account' },
    ],
  },
  {
    heading: '核心功能',
    icon: 'mdi-star',
    items: [
      { title: '岗位画像', slug: 'job-profile', icon: 'mdi-briefcase' },
      { title: '岗位图谱', slug: 'job-graph', icon: 'mdi-graph' },
      { title: '人岗匹配', slug: 'match', icon: 'mdi-compare-horizontal' },
      { title: '报告管理', slug: 'report', icon: 'mdi-file-document' },
      { title: 'AI 对话助手', slug: 'chat', icon: 'mdi-chat-processing' },
    ],
  },
  {
    heading: '管理员指南',
    icon: 'mdi-shield-crown',
    role: 'admin',
    items: [
      { title: '用户管理', slug: 'admin/user-manage', icon: 'mdi-account-cog', role: 'admin' },
      {
        title: '任务队列监控',
        slug: 'admin/task-queue',
        icon: 'mdi-format-list-checks',
        role: 'admin',
      },
      {
        title: '岗位数据上传',
        slug: 'admin/job-upload',
        icon: 'mdi-upload',
        role: 'admin',
      },
      {
        title: '知识库导出',
        slug: 'admin/knowledge-export',
        icon: 'mdi-database-export',
        role: 'admin',
      },
      {
        title: 'OAuth 提供商',
        slug: 'admin/oauth-providers',
        icon: 'mdi-key-chain',
        role: 'admin',
      },
      {
        title: 'API Key 管理',
        slug: 'admin/api-key',
        icon: 'mdi-api',
        role: 'admin',
      },
      {
        title: 'LLM 配置管理',
        slug: 'admin/llm-config',
        icon: 'mdi-robot-outline',
        role: 'admin',
      },
      {
        title: 'LLM 用量统计',
        slug: 'admin/llm-usage',
        icon: 'mdi-chart-bar',
        role: 'admin',
      },
      {
        title: '对话记录管理',
        slug: 'admin/chat-manage',
        icon: 'mdi-message-text-outline',
        role: 'admin',
      },
    ],
  },
  {
    heading: '学校管理员指南',
    icon: 'mdi-school',
    role: 'school',
    items: [
      { title: '控制台概述', slug: 'school/overview', icon: 'mdi-view-dashboard', role: 'school' },
      {
        title: '学生管理',
        slug: 'school/student-manage',
        icon: 'mdi-account-group',
        role: 'school',
      },
      {
        title: '批量导入学生',
        slug: 'school/batch-import',
        icon: 'mdi-file-import',
        role: 'school',
      },
      {
        title: '查看学生对话',
        slug: 'school/student-chats',
        icon: 'mdi-message-text-outline',
        role: 'school',
      },
    ],
  },
]

/**
 * 扁平化获取所有文档节点（深度优先）
 */
export function flattenDocs(sections: DocSection[] = docSections): DocNode[] {
  const result: DocNode[] = []
  function walk(nodes: DocNode[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children) walk(node.children)
    }
  }
  for (const section of sections) {
    walk(section.items)
  }
  return result
}

/**
 * 判断某个 slug 对应的文档是否需要管理员权限
 */
export function isAdminDoc(slug: string): boolean {
  for (const section of docSections) {
    if (section.role === 'admin') {
      for (const item of section.items) {
        if (item.slug === slug) return true
      }
    }
    for (const item of section.items) {
      if (item.slug === slug && item.role === 'admin') return true
    }
  }
  return false
}

/**
 * 判断某个 slug 对应的文档是否需要学校管理员权限
 */
export function isSchoolDoc(slug: string): boolean {
  for (const section of docSections) {
    if (section.role === 'school') {
      for (const item of section.items) {
        if (item.slug === slug) return true
      }
    }
    for (const item of section.items) {
      if (item.slug === slug && item.role === 'school') return true
    }
  }
  return false
}
