/**
 * 文档内容加载器
 *
 * 使用 Vite 的 import.meta.glob 批量懒加载 content/ 目录下的 .md 文件。
 * 运行时按 slug 动态获取对应 Markdown 原始文本。
 */

// 编译时收集所有 .md 文件，以懒加载函数形式返回
const modules = import.meta.glob<string>('./content/**/*.md', {
  query: '?raw',
  import: 'default',
})

/**
 * 根据 slug 加载 Markdown 原始字符串
 * @param slug 如 'getting-started' 或 'admin/task-queue'
 */
export async function loadDoc(slug: string): Promise<string> {
  const key = `./content/${slug}.md`
  const loader = modules[key]
  if (!loader) {
    throw new Error(`文档不存在: ${slug}`)
  }
  return loader()
}

/**
 * 检查某 slug 的文档是否存在
 */
export function docExists(slug: string): boolean {
  return `./content/${slug}.md` in modules
}
