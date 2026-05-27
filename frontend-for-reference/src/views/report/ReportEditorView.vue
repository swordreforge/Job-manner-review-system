<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReportStore } from '@/stores/report'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ReportVersionSummary } from '@/types/report'
import { waitForTask } from '@/api/sse'

/**
 * 将 Markdown 内容转换为 HTML。
 * 报告内容由 AI 以 Markdown 格式生成，TipTap 编辑器需要 HTML 格式。
 */
function markdownToHtml(content: string): string {
  if (!content) return ''
  // 如果内容已经是 HTML（以 < 开头的标签），直接返回
  const trimmed = content.trim()
  if (
    trimmed.startsWith('<') &&
    (trimmed.startsWith('<h') || trimmed.startsWith('<p') || trimmed.startsWith('<div'))
  ) {
    return content
  }
  return marked.parse(content, { async: false }) as string
}

import type { CompletenessResult } from '@/types/report'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const store = useReportStore()
const editorContent = ref('')
const checkResult = ref<CompletenessResult | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const snackbarTimeout = ref(3000)
const snackbarShowUndo = ref(false)
const printRef = ref<HTMLDivElement>()
const fetchError = ref<string | null>(null)

// ── 润色 / 检查 / 删除 loading 状态 ──
const polishing = ref(false)
const checking = ref(false)
const deleteDialog = ref(false)
const deleting = ref(false)

// ── 版本历史 ──
const versionPreviewDialog = ref(false)
const versionPreviewContent = ref('')
const versionPreviewNum = ref(0)
const versionLoadingMap = ref<Record<number, boolean>>({})
const revertDialog = ref(false)
const revertTargetVersion = ref<ReportVersionSummary | null>(null)
const reverting = ref(false)

// 状态 chip 颜色
const statusColor = computed(() => {
  switch (store.currentReport?.status) {
    case 'COMPLETED':
      return 'success'
    case 'GENERATING':
      return 'primary'
    case 'FAILED':
      return 'error'
    default:
      return 'secondary'
  }
})

const statusLabel = computed(() => {
  switch (store.currentReport?.status) {
    case 'COMPLETED':
      return '已完成'
    case 'GENERATING':
      return '生成中'
    case 'FAILED':
      return '失败'
    default:
      return store.currentReport?.status ?? ''
  }
})

function sourceLabel(source: string): string {
  switch (source) {
    case 'GENERATED':
      return 'AI生成'
    case 'MANUAL_EDIT':
      return '手动编辑'
    case 'AI_POLISH':
      return 'AI润色'
    default:
      return source
  }
}

function sourceColor(source: string): string {
  switch (source) {
    case 'GENERATED':
      return 'primary'
    case 'MANUAL_EDIT':
      return 'secondary'
    case 'AI_POLISH':
      return 'deep-purple'
    default:
      return 'grey'
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function showSnackbar(text: string, color = 'success', timeout = 3000, showUndo = false) {
  snackbarText.value = text
  snackbarColor.value = color
  snackbarTimeout.value = timeout
  snackbarShowUndo.value = showUndo
  snackbar.value = true
}

// ── Tiptap 编辑器 ──
const editor = useEditor({
  content: '',
  extensions: [StarterKit, Placeholder.configure({ placeholder: '在此编辑报告内容...' })],
  onUpdate: ({ editor: ed }) => {
    editorContent.value = ed.getHTML()
  },
})

// 润色期间锁定编辑器
watch(polishing, (isPolishing) => {
  editor.value?.setEditable(!isPolishing)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

onMounted(async () => {
  fetchError.value = null
  try {
    const reportId = route.params.id as string
    await store.fetchReport(reportId)
    if (store.currentReport) {
      const htmlContent = markdownToHtml(store.currentReport.content)
      editorContent.value = htmlContent
      editor.value?.commands.setContent(htmlContent)
    }
    await store.fetchVersionHistory(reportId)
  } catch {
    fetchError.value = '加载报告失败，请检查网络后重试'
  }
})

async function retryLoad() {
  fetchError.value = null
  try {
    const reportId = route.params.id as string
    await store.fetchReport(reportId)
    if (store.currentReport) {
      const htmlContent = markdownToHtml(store.currentReport.content)
      editorContent.value = htmlContent
      editor.value?.commands.setContent(htmlContent)
    }
    await store.fetchVersionHistory(reportId)
  } catch {
    fetchError.value = '加载报告失败，请检查网络后重试'
  }
}

// ── PDF 导出（基于浏览器原生打印，支持中文渲染与文本选择） ──
function exportToPdf(element: HTMLElement, filename: string = 'career-report.pdf') {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('无法打开打印窗口，请允许弹出窗口后重试')
    return
  }

  const content = DOMPurify.sanitize(element.innerHTML, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr', 'div', 'span'],
    ALLOWED_ATTR: ['class', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  })

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${filename.replace('.pdf', '')}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    body {
      font-family: "Microsoft YaHei", "SimSun", "PingFang SC", "Hiragino Sans GB",
                   "Noto Sans CJK SC", "WenQuanYi Micro Hei", sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #333;
      padding: 0;
      margin: 0;
    }
    h1 { font-size: 1.8em; font-weight: 700; margin: 1em 0 0.5em; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 0.8em 0 0.4em; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 0.6em 0 0.3em; }
    p { margin: 0.4em 0; line-height: 1.8; }
    ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
    li { margin: 0.25em 0; }
    hr { border: none; border-top: 2px solid #e0e0e0; margin: 1.5em 0; }
    strong { font-weight: 700; }
    /* 隐藏编辑器工具栏 */
    .editor-toolbar { display: none !important; }
    /* 打印专用样式 */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>${content}</body>
</html>`)
  printWindow.document.close()

  // 等待内容加载完成后调用打印
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    // 用户关闭打印对话框后关闭窗口
    printWindow.onafterprint = () => printWindow.close()
  }
}

// ── 操作函数 ──
async function handleSave() {
  if (!store.currentReport) return
  await store.saveReport(store.currentReport.id, editorContent.value)
  showSnackbar('保存成功')
}

async function handlePolish(section?: number) {
  if (!store.currentReport || polishing.value) return
  polishing.value = true
  try {
    // awaitCompletion=true：Store 内部等待 SSE 任务完成并自动 fetchReport
    await store.polishReport(store.currentReport.id, section, true)
    // 任务完成后同步编辑器内容
    if (store.currentReport) {
      const html = markdownToHtml(store.currentReport.content)
      editorContent.value = html
      editor.value?.commands.setContent(html)
    }
    // 润色完成 Snackbar（带撤销按钮，8秒超时）
    const newVersion = store.currentReport?.version
    showSnackbar(`润色完成，已更新至 v${newVersion}`, 'success', 8000, true)
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message || ''
    if (msg.includes('超时')) {
      showSnackbar('润色超时，请稍后手动刷新页面查看结果', 'warning')
    } else {
      const e = err as { response?: { data?: { message?: string } } }
      showSnackbar(e.response?.data?.message || '润色任务失败，请重试', 'error')
    }
  } finally {
    polishing.value = false
  }
}

async function handleUndoPolish() {
  if (!store.currentReport || store.lastPolishPreviousVersion === null) return
  snackbar.value = false
  try {
    await store.revertToVersion(store.currentReport.id, store.lastPolishPreviousVersion)
    if (store.currentReport) {
      const html = markdownToHtml(store.currentReport.content)
      editorContent.value = html
      editor.value?.commands.setContent(html)
    }
    showSnackbar('已撤销润色，内容已恢复')
  } catch {
    showSnackbar('撤销失败，请通过版本历史手动回退', 'error')
  }
}

async function handleCheck() {
  if (!store.currentReport || checking.value) return
  checking.value = true
  checkResult.value = null
  try {
    const taskId = await store.checkCompleteness(store.currentReport.id)
    const event = await waitForTask(taskId, 120_000)
    // 修复：result 可能在 event.result 或 event.data.result 中
    const resultData = event?.result || event?.data?.result
    if (resultData) {
      try {
        const result = typeof resultData === 'string'
          ? JSON.parse(resultData)
          : resultData
        checkResult.value = result as CompletenessResult
      } catch (parseError) {
        console.error('解析检查结果失败:', parseError, resultData)
        showSnackbar('检查结果格式错误', 'error')
      }
    }
  } catch {
    showSnackbar('完整性检查失败，请重试', 'error')
  } finally {
    checking.value = false
  }
}

function handleExport() {
  if (!printRef.value) return
  exportToPdf(printRef.value, `${store.currentReport?.title || 'report'}.pdf`)
  showSnackbar('PDF 导出窗口已打开')
}

async function handleDelete() {
  if (!store.currentReport || deleting.value) return
  deleting.value = true
  try {
    await store.deleteReport(store.currentReport.id)
    router.push('/reports')
  } catch {
    showSnackbar('删除失败，请重试', 'error')
    deleting.value = false
  }
}

// ── 版本历史操作 ──
async function handlePreviewVersion(versionSummary: ReportVersionSummary) {
  const reportId = store.currentReport?.id
  if (!reportId) return
  versionLoadingMap.value[versionSummary.version] = true
  try {
    const res = await import('@/api/report').then((m) =>
      m.getVersion(reportId, versionSummary.version),
    ) as unknown as import('@/types/api').ApiResponse<import('@/types/report').ReportVersionDetail>
    versionPreviewContent.value = DOMPurify.sanitize(markdownToHtml(res.data?.content || ''), {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr', 'div', 'span'],
      ALLOWED_ATTR: [],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    })
    versionPreviewNum.value = versionSummary.version
    versionPreviewDialog.value = true
  } catch {
    showSnackbar('加载版本内容失败', 'error')
  } finally {
    versionLoadingMap.value[versionSummary.version] = false
  }
}

function confirmRevert(versionSummary: ReportVersionSummary) {
  revertTargetVersion.value = versionSummary
  revertDialog.value = true
}

async function handleRevert() {
  if (!store.currentReport || !revertTargetVersion.value || reverting.value) return
  reverting.value = true
  try {
    await store.revertToVersion(store.currentReport.id, revertTargetVersion.value.version)
    if (store.currentReport) {
      const html = markdownToHtml(store.currentReport.content)
      editorContent.value = html
      editor.value?.commands.setContent(html)
    }
    revertDialog.value = false
    showSnackbar(`已回退至 v${revertTargetVersion.value.version}，当前版本为 v${store.currentReport?.version}`)
  } catch {
    showSnackbar('回退失败，请重试', 'error')
  } finally {
    reverting.value = false
    revertTargetVersion.value = null
  }
}

/** 根据分数返回颜色 */
function scoreColor(score: number): string {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}
</script>

<template>
  <v-container>
    <PageHeader :title="store.currentReport?.title || '报告编辑'" icon="mdi-file-document-edit" :breadcrumb-title="store.currentReport?.title">
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/reports">返回列表</v-btn>
      </template>
    </PageHeader>

    <ApiErrorState
      v-if="fetchError && !store.loading"
      :error="fetchError"
      title="加载失败"
      @retry="retryLoad"
    />

    <template v-else>
      <v-skeleton-loader v-if="store.loading" type="heading, article, actions" class="mb-4" />

      <v-row v-if="store.currentReport">
        <!-- ── 编辑器列 ── -->
        <v-col cols="12" md="9" style="position: relative">
          <div ref="printRef">
            <div class="rich-editor">
              <div v-if="editor" class="editor-toolbar pa-2 d-flex flex-wrap ga-1">
                <v-btn
                  size="small"
                  variant="text"
                  :color="editor.isActive('bold') ? 'primary' : ''"
                  icon="mdi-format-bold"
                  @click="editor.chain().focus().toggleBold().run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  :color="editor.isActive('italic') ? 'primary' : ''"
                  icon="mdi-format-italic"
                  @click="editor.chain().focus().toggleItalic().run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-format-header-1"
                  @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-format-header-2"
                  @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-format-header-3"
                  @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-format-list-bulleted"
                  @click="editor.chain().focus().toggleBulletList().run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-format-list-numbered"
                  @click="editor.chain().focus().toggleOrderedList().run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-undo"
                  @click="editor.chain().focus().undo().run()"
                />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-redo"
                  @click="editor.chain().focus().redo().run()"
                />
              </div>
              <EditorContent :editor="editor" class="editor-content pa-4" />
            </div>
          </div>

          <!-- 润色 overlay：任务执行期间遮盖编辑器 -->
          <v-overlay
            v-model="polishing"
            contained
            persistent
            class="polish-overlay d-flex align-center justify-center"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="primary" size="48" class="mb-3" />
              <div class="text-body-2 text-white">AI 润色中，请稍候...</div>
            </div>
          </v-overlay>
        </v-col>

        <!-- ── 侧边栏 ── -->
        <v-col cols="12" md="3">
          <!-- AI 助手 -->
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1">AI 助手</v-card-title>
            <v-card-text>
              <v-btn
                block
                color="primary"
                class="mb-2"
                :loading="polishing"
                :disabled="polishing || checking"
                @click="handlePolish()"
              >
                <v-icon start icon="mdi-auto-fix" />一键润色全文
              </v-btn>
              <v-btn
                block
                variant="outlined"
                color="primary"
                class="mb-2"
                :loading="checking"
                :disabled="polishing || checking"
                @click="handleCheck()"
              >
                <v-icon start icon="mdi-check-circle" />完整性检查
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- 操作 -->
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1">操作</v-card-title>
            <v-card-text>
              <v-btn
                block
                variant="outlined"
                class="mb-2"
                :loading="store.editStatus === 'saving'"
                @click="handleSave"
              >
                <v-icon start icon="mdi-content-save" />保存
              </v-btn>
              <v-btn block variant="outlined" color="info" class="mb-2" @click="handleExport">
                <v-icon start icon="mdi-file-pdf-box" />导出 PDF
              </v-btn>
              <v-btn block variant="outlined" color="error" @click="deleteDialog = true">
                <v-icon start icon="mdi-delete" />删除
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- 完整性检查结果 -->
          <v-card v-if="checking || checkResult" class="mb-4">
            <v-card-title class="text-subtitle-1">检查结果</v-card-title>
            <v-card-text>

              <!-- 检查中：骨架屏 -->
              <template v-if="checking">
                <div class="d-flex justify-center mb-3">
                  <v-progress-circular indeterminate color="primary" size="40" />
                </div>
                <v-skeleton-loader type="text, text, text" />
              </template>

              <!-- 检查完成 -->
              <template v-else-if="checkResult">
                <!-- 分数圆环 -->
                <div class="d-flex justify-center mb-3">
                  <v-progress-circular
                    :model-value="checkResult.completeness_score"
                    :color="scoreColor(checkResult.completeness_score)"
                    size="80"
                    width="8"
                  >
                    <span class="text-body-2 font-weight-bold">
                      {{ checkResult.completeness_score }}%
                    </span>
                  </v-progress-circular>
                </div>

                <!-- 状态提示 -->
                <v-alert
                  v-if="checkResult.is_complete"
                  type="success"
                  variant="tonal"
                  density="compact"
                  class="mb-2"
                >
                  报告内容完整
                </v-alert>
                <v-alert v-else type="warning" variant="tonal" density="compact" class="mb-2">
                  报告存在不完整内容
                </v-alert>

                <!-- 总评 -->
                <p
                  v-if="checkResult.overall_comment"
                  class="text-body-2 text-medium-emphasis mb-3"
                >
                  {{ checkResult.overall_comment }}
                </p>

                <!-- 问题列表 accordion -->
                <v-expansion-panels
                  v-if="checkResult.issues && checkResult.issues.length > 0"
                  variant="accordion"
                  density="compact"
                >
                  <v-expansion-panel
                    v-for="(issue, idx) in checkResult.issues"
                    :key="idx"
                  >
                    <v-expansion-panel-title class="text-caption font-weight-bold">
                      {{ issue.chapter }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <p class="text-caption text-error mb-1">{{ issue.issue }}</p>
                      <p class="text-caption text-medium-emphasis">{{ issue.suggestion }}</p>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </template>

            </v-card-text>
          </v-card>

          <!-- 版本历史 -->
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1 d-flex align-center justify-space-between">
              版本历史
              <v-chip size="x-small" :color="statusColor" variant="tonal">{{ statusLabel }}</v-chip>
            </v-card-title>
            <v-card-text class="pa-2">
              <template v-if="store.versionHistory.length === 0">
                <p class="text-caption text-medium-emphasis text-center py-2">暂无版本记录</p>
              </template>
              <v-timeline v-else density="compact" align="start" side="end" truncate-line="both">
                <v-timeline-item
                  v-for="v in store.versionHistory"
                  :key="v.id"
                  :dot-color="v.version === store.currentReport.version ? 'primary' : 'grey-lighten-1'"
                  size="x-small"
                >
                  <div class="d-flex flex-column">
                    <div class="d-flex align-center ga-1 mb-1">
                      <span
                        class="text-caption font-weight-bold"
                        :class="v.version === store.currentReport.version ? 'text-primary' : ''"
                      >
                        v{{ v.version }}
                        <span v-if="v.version === store.currentReport.version" class="text-caption text-primary">（当前）</span>
                      </span>
                      <v-chip size="x-small" :color="sourceColor(v.source)" variant="tonal" class="ml-1">
                        {{ sourceLabel(v.source) }}
                      </v-chip>
                    </div>
                    <span class="text-caption text-medium-emphasis mb-1">{{ formatRelativeTime(v.createdAt) }}</span>
                    <div class="d-flex ga-1">
                      <v-btn
                        size="x-small"
                        variant="text"
                        color="primary"
                        :loading="versionLoadingMap[v.version]"
                        @click="handlePreviewVersion(v)"
                      >预览</v-btn>
                      <v-btn
                        v-if="v.version !== store.currentReport.version"
                        size="x-small"
                        variant="text"
                        color="warning"
                        @click="confirmRevert(v)"
                      >回退</v-btn>
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 删除确认对话框 -->
      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6">确认删除</v-card-title>
          <v-card-text>
            确定要删除报告「{{ store.currentReport?.title }}」吗？此操作不可撤销。
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
            <v-btn color="error" variant="flat" :loading="deleting" @click="handleDelete">
              确认删除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 版本预览对话框 -->
      <v-dialog v-model="versionPreviewDialog" max-width="800" scrollable>
        <v-card>
          <v-card-title class="text-h6">预览 v{{ versionPreviewNum }}</v-card-title>
          <v-divider />
          <v-card-text>
            <div class="version-preview-content" v-html="versionPreviewContent" />
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="versionPreviewDialog = false">关闭</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 回退确认对话框 -->
      <v-dialog v-model="revertDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6">确认回退</v-card-title>
          <v-card-text>
            将回退至 <strong>v{{ revertTargetVersion?.version }}</strong>（{{ sourceLabel(revertTargetVersion?.source ?? '') }}）的内容，并生成新版本 v{{ (store.currentReport?.version ?? 0) + 1 }}。
            <br /><br />历史版本不会丢失，可随时再次回退。
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="revertDialog = false">取消</v-btn>
            <v-btn color="warning" variant="flat" :loading="reverting" @click="handleRevert">
              确认回退
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 统一 Snackbar（润色撤销 / 普通通知） -->
      <v-snackbar
        v-model="snackbar"
        :timeout="snackbarTimeout"
        :color="snackbarColor"
        location="top right"
      >
        {{ snackbarText }}
        <template v-if="snackbarShowUndo" #actions>
          <v-btn variant="text" @click="handleUndoPolish">撤销</v-btn>
        </template>
      </v-snackbar>
    </template>
  </v-container>
</template>

<style scoped>
.rich-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}
.editor-toolbar {
  border-bottom: 1px solid #e0e0e0;
}
.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 400px;
}
.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
/* Markdown 渲染样式 */
.editor-content :deep(.tiptap h1) {
  font-size: 1.8em;
  font-weight: 700;
  margin: 1em 0 0.5em;
  line-height: 1.3;
}
.editor-content :deep(.tiptap h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.8em 0 0.4em;
  line-height: 1.3;
}
.editor-content :deep(.tiptap h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
  line-height: 1.3;
}
.editor-content :deep(.tiptap ul),
.editor-content :deep(.tiptap ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}
.editor-content :deep(.tiptap li) {
  margin: 0.25em 0;
}
.editor-content :deep(.tiptap hr) {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 1.5em 0;
}
.editor-content :deep(.tiptap strong) {
  font-weight: 700;
}
.editor-content :deep(.tiptap p) {
  margin: 0.4em 0;
  line-height: 1.7;
}
.polish-overlay {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.75);
}
/* 版本预览内容样式（只读） */
.version-preview-content :deep(h1) {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0.8em 0 0.4em;
}
.version-preview-content :deep(h2) {
  font-size: 1.3em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
}
.version-preview-content :deep(h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.5em 0 0.25em;
}
.version-preview-content :deep(p) {
  margin: 0.4em 0;
  line-height: 1.7;
}
.version-preview-content :deep(ul),
.version-preview-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}
</style>
