import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as chatApi from '@/api/chat'
import type { ChatMessage, Conversation, ConversationMessage } from '@/types/chat'

export const useChatStore = defineStore('chat', () => {
  //  当前对话状态
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  //  会话列表状态
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const conversationsLoading = ref(false)

  // 保存当前流式请求的 AbortController，组件卸载时可调用 abortStream() 终止
  let currentAbortController: AbortController | null = null

  //  后台生成追踪
  // 用户切换页面后，SSE 断开但后端仍在生成；保留此状态以便返回时恢复占位符 UI
  const pendingGeneration = ref<{ conversationId: string; userContent: string } | null>(null)
  // 是否正在轮询等待后台生成完成
  const isPolling = ref(false)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  function stopPolling() {
    if (pollingTimer !== null) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    isPolling.value = false
  }

  function startPolling(id: string) {
    stopPolling()
    isPolling.value = true
    pollingTimer = setInterval(async () => {
      // 用户已切换到其他会话时停止轮询
      if (currentConversationId.value !== id) {
        stopPolling()
        return
      }
      try {
        const detail = await chatApi.getConversation(id)
        if (detail.messages.length > 0) {
          messages.value = detail.messages.map(
            (m: ConversationMessage): ChatMessage => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.createdAt).getTime(),
            }),
          )
          loading.value = false
          if (pendingGeneration.value?.conversationId === id) {
            pendingGeneration.value = null
          }
          stopPolling()
        }
      } catch {
        // 静默忽略轮询错误
      }
    }, 3000)
  }

  //  会话列表操作

  async function fetchConversations() {
    conversationsLoading.value = true
    try {
      const result = await chatApi.listConversations(0, 50)
      conversations.value = result.content
    } catch {
      // 静默失败
    } finally {
      conversationsLoading.value = false
    }
  }

  /**
   * 切换到指定会话，从 API 加载历史消息。
   * 若该会话有后台生成任务（pendingGeneration），则展示占位符并开始轮询。
   */
  async function selectConversation(id: string) {
    stopPolling()
    currentConversationId.value = id
    messages.value = []
    error.value = null
    loading.value = false
    try {
      const detail = await chatApi.getConversation(id)
      if (detail.messages.length > 0) {
        // 消息已存在（生成完成或普通加载）
        messages.value = detail.messages.map(
          (m: ConversationMessage): ChatMessage => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt).getTime(),
          }),
        )
        if (pendingGeneration.value?.conversationId === id) {
          pendingGeneration.value = null
        }
      } else if (pendingGeneration.value?.conversationId === id) {
        // 后台仍在生成——展示用户原文 + AI 骨架占位，轮询等待完成
        messages.value = [
          { role: 'user', content: pendingGeneration.value.userContent, timestamp: Date.now() },
          { role: 'assistant', content: '', timestamp: Date.now() },
        ]
        loading.value = true
        startPolling(id)
      }
    } catch {
      error.value = '加载历史消息失败'
    }
  }

  /** 开始新会话（清空当前，id 置 null） */
  function startNewConversation() {
    stopPolling()
    currentConversationId.value = null
    messages.value = []
    error.value = null
    loading.value = false
  }

  /** 删除会话，并在当前正显示该会话时切换 */
  async function deleteConversation(id: string) {
    await chatApi.deleteConversation(id)
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (currentConversationId.value === id) {
      startNewConversation()
    }
    if (pendingGeneration.value?.conversationId === id) {
      pendingGeneration.value = null
    }
  }

  //  发消息

  async function sendMessage(content: string) {
    const userMsg: ChatMessage = { role: 'user', content, timestamp: Date.now() }
    messages.value.push(userMsg)

    // 立即追加空助手消息作为流式占位
    messages.value.push({ role: 'assistant', content: '', timestamp: Date.now() })
    loading.value = true
    error.value = null

    // 创建新的 AbortController，覆盖上一个（同时只允许一个流式请求）
    currentAbortController = new AbortController()

    const convId = currentConversationId.value ?? 'new'

    // 记录 pending 状态（新会话的 conversationId 在收到 meta 事件后更新）
    pendingGeneration.value = {
      conversationId: convId === 'new' ? '' : convId,
      userContent: content,
    }

    try {
      for await (const event of chatApi.sendMessageStream(
        convId,
        content,
        currentAbortController.signal,
      )) {
        if (event.type === 'meta') {
          // 新建会话时，服务端返回的 conversationId
          currentConversationId.value = event.conversationId
          // 同步更新 pending 中的 conversationId
          if (pendingGeneration.value) {
            pendingGeneration.value = {
              ...pendingGeneration.value,
              conversationId: event.conversationId,
            }
          }
          // 延迟刷新会话列表（标题可能正在异步生成）
          setTimeout(() => fetchConversations(), 1500)
        } else if (event.type === 'chunk') {
          const last = messages.value[messages.value.length - 1]
          if (last) last.content += event.chunk
        }
      }
      // 流正常完成，清除 pending
      pendingGeneration.value = null
      // 已有会话时刷新列表（updated_at 变化）
      if (convId !== 'new') {
        await fetchConversations()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 主动中止（用户离开页面）——保留 pendingGeneration，返回时可恢复占位符
      } else {
        pendingGeneration.value = null
        error.value = '对话失败，请稍后重试'
        // 回滚用户消息 + 空助手消息
        messages.value.splice(-2)
      }
    } finally {
      loading.value = false
      currentAbortController = null
    }
  }

  /** 中止当前流式请求（组件卸载时调用） */
  function abortStream() {
    currentAbortController?.abort()
    currentAbortController = null
  }

  function clearHistory() {
    stopPolling()
    messages.value = []
    error.value = null
    currentConversationId.value = null
    loading.value = false
  }

  return {
    messages,
    loading,
    error,
    conversations,
    currentConversationId,
    conversationsLoading,
    pendingGeneration,
    isPolling,
    fetchConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    sendMessage,
    abortStream,
    clearHistory,
  }
})
