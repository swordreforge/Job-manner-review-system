<script setup lang="ts">
import { computed, watch, useTemplateRef, nextTick, ref } from 'vue'
import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import DOMPurify from 'dompurify'
// 按需注册语言（轻量化）
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import xml from 'highlight.js/lib/languages/xml'
import java from 'highlight.js/lib/languages/java'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('java', java)

const props = defineProps<{
  /** Markdown 原始文本 */
  source: string
  /** 是否正在流式生成中（用于前到后淡入效果） */
  isStreaming?: boolean
}>()

// 构建带代码高亮的 marked 实例
const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      let highlighted: string
      try {
        highlighted = hljs.highlight(text, { language }).value
      } catch {
        highlighted = text
      }
      return `<pre class="hljs-pre"><code class="hljs language-${language}">${highlighted}</code></pre>`
    },
    // 让内部链接支持 vue-router 风格（target=_blank 仅外部链接）
    link({ href, title, text }) {
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      const attrs = [
        `href="${href}"`,
        title ? `title="${title}"` : '',
        isExternal ? 'target="_blank" rel="noopener noreferrer"' : 'data-internal',
      ]
        .filter(Boolean)
        .join(' ')
      return `<a ${attrs}>${text}</a>`
    },
  },
  gfm: true,
  breaks: false,
})

const html = computed(() => {
  const rawHtml = marked.parse(props.source) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'data-internal', 'class', 'style', 'src', 'alt'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  })
})

const mdBodyRef = useTemplateRef<HTMLDivElement>('mdBody')
const lastRenderedLength = ref(0)

/**
 * 从 HTML 中提取纯文本
 */
function extractPlainText(html: string): string {
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || ''
}

/**
 * 在 HTML 中注入淡入动画（仅对新增字符）
 */
function injectFadeAnimation(
  html: string,
  startCharIndex: number,
  endCharIndex: number,
  baseDelay: number,
): string {
  const temp = document.createElement('div')
  temp.innerHTML = html

  let charCount = 0
  const CHUNK = 3
  const DELAY_STEP = 18

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      const nodeStart = charCount
      const nodeEnd = charCount + text.length

      if (nodeEnd > startCharIndex && nodeStart < endCharIndex) {
        const splitPos = Math.max(0, startCharIndex - nodeStart)
        const oldPart = text.slice(0, splitPos)
        const newPart = text.slice(splitPos)

        const fragment = document.createDocumentFragment()
        if (oldPart) fragment.appendChild(document.createTextNode(oldPart))

        for (let i = 0; i < newPart.length; i += CHUNK) {
          const chunk = newPart.slice(i, i + CHUNK)
          const span = document.createElement('span')
          span.className = 'fade-char'
          const chunkIndex = nodeStart + splitPos + i
          const delay = baseDelay + Math.floor((chunkIndex - startCharIndex) / CHUNK) * DELAY_STEP
          span.style.animationDelay = `${delay}ms`
          span.textContent = chunk
          fragment.appendChild(span)
        }

        node.parentNode?.replaceChild(fragment, node)
      }

      charCount += text.length
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(traverse)
    }
  }

  traverse(temp)
  return temp.innerHTML
}

watch(
  () => props.isStreaming,
  (streaming) => {
    if (streaming) {
      lastRenderedLength.value = 0
    } else {
      // 流式结束，重新渲染完整内容（无动画）
      nextTick(() => {
        if (mdBodyRef.value) {
          mdBodyRef.value.innerHTML = DOMPurify.sanitize(html.value, {
            ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'div'],
            ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'data-internal', 'class', 'style', 'src', 'alt'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
          })
        }
      })
    }
  },
)

watch(
  () => props.source,
  async (newContent) => {
    if (!props.isStreaming) {
      lastRenderedLength.value = 0
      return
    }

    await nextTick()
    const el = mdBodyRef.value
    if (!el) return

    // 增量解析 + 动画注入
    const newHtml = marked.parse(newContent) as string
    const plainText = extractPlainText(newHtml)
    const newChars = plainText.length - lastRenderedLength.value

    if (newChars > 0) {
      const animatedHtml = injectFadeAnimation(
        newHtml,
        lastRenderedLength.value,
        plainText.length,
        0,
      )

      el.innerHTML = DOMPurify.sanitize(animatedHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'blockquote', 'hr', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'data-internal', 'class', 'style', 'src', 'alt'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
      })
      lastRenderedLength.value = plainText.length
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="md-wrapper">
    <div ref="mdBody" class="md-body" v-html="html" />
  </div>
</template>

<style>
/* ── 引入 highlight.js 主题 ── */
@import 'highlight.js/styles/github.css';

/* ── Markdown 渲染样式（与 Vuetify 协调） ── */
.md-body {
  font-size: 0.975rem;
  line-height: 1.75;
  color: rgba(var(--v-theme-on-surface), 0.87);
  word-wrap: break-word;
}

.md-body h1 {
  font-size: 2rem;
  font-weight: 500;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.md-body h2 {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 1.75rem 0 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.md-body h3 {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 1.25rem 0 0.5rem;
}

.md-body h4 {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 1rem 0 0.5rem;
}

.md-body p {
  margin: 0.5rem 0;
}

.md-body a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.md-body a:hover {
  text-decoration: underline;
}

.md-body blockquote {
  margin: 0.75rem 0;
  padding: 0.5rem 1rem;
  border-left: 4px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
  border-radius: 0 4px 4px 0;
}

.md-body blockquote p {
  margin: 0.25rem 0;
}

.md-body ul,
.md-body ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.md-body li {
  margin: 0.25rem 0;
}

.md-body code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875em;
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}

.md-body .hljs-pre {
  margin: 0.75rem 0;
  border-radius: 8px;
  overflow-x: auto;
}

.md-body .hljs-pre code {
  display: block;
  padding: 1rem;
  background: #f6f8fa;
  font-size: 0.85rem;
  line-height: 1.6;
}

.md-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.75rem 0;
}

.md-body th,
.md-body td {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.md-body th {
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 600;
}

.md-body tr:nth-child(even) {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.md-body hr {
  border: none;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin: 1.5rem 0;
}

.md-body img {
  max-width: 100%;
  border-radius: 8px;
}

.md-body strong {
  font-weight: 600;
}

/* ── 流式生成：逐字淡入 ── */
.md-wrapper {
  position: relative;
}

.fade-char {
  display: inline;
  animation: char-fade-in 0.5s ease both;
}

@keyframes char-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

</style>
