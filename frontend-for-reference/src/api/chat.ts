import { useAuthStore } from '@/stores/auth'
import type { Conversation, ConversationDetail } from '@/types/chat'
import type { ApiResponse } from '@/types/api'
import api from '@/api'

//  流式接口

/**
 * 新版流式对话（conversationId="new" 时自动创建）。
 * 首条 SSE meta 事件携带 { conversationId }，后续均为 chunk 数据。
 * 支持 AbortController，调用方可在组件卸载时终止请求。
 */
export async function* sendMessageStream(
  conversationId: string,
  content: string,
  signal?: AbortSignal,
): AsyncGenerator<{ type: 'meta'; conversationId: string } | { type: 'chunk'; chunk: string }> {
  const authStore = useAuthStore()

  const response = await fetch(`/api/chat/conversations/${conversationId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify({ content }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:') && !line.startsWith('event:')) continue
      if (line.startsWith('event:')) continue  // SSE event 行，下一行是 data
      const data = line.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data) as {
          conversationId?: string
          chunk?: string
          error?: string
        }
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.conversationId) {
          yield { type: 'meta', conversationId: parsed.conversationId }
        } else if (parsed.chunk) {
          yield { type: 'chunk', chunk: parsed.chunk }
        }
      } catch (e) {
        if (!(e instanceof SyntaxError)) throw e
        // 跳过 JSON 格式异常的行（SyntaxError 来自 JSON.parse）
      }
    }
  }
}

//  会话 CRUD

export async function listConversations(page = 0, size = 20) {
  const res = (await api.get('/chat/conversations', {
    params: { page, size },
  })) as unknown as ApiResponse<{ content: Conversation[]; totalPages: number; totalElements: number }>
  return res.data
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = (await api.get(`/chat/conversations/${id}`)) as unknown as ApiResponse<ConversationDetail>
  return res.data
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/chat/conversations/${id}`)
}

//  School 端

export async function listSchoolChats(username?: string, page = 0, size = 20) {
  const params: Record<string, unknown> = { page, size }
  if (username) params.username = username
  const res = (await api.get('/school/chats', {
    params,
  })) as unknown as ApiResponse<{ content: Conversation[]; totalPages: number; totalElements: number }>
  return res.data
}

export async function listStudentConversations(userId: string, page = 0, size = 20) {
  const res = (await api.get(`/school/students/${userId}/conversations`, {
    params: { page, size },
  })) as unknown as ApiResponse<{ content: Conversation[]; totalPages: number; totalElements: number }>
  return res.data
}

export async function getStudentConversation(
  userId: string,
  convId: string,
): Promise<ConversationDetail> {
  const res = (await api.get(
    `/school/students/${userId}/conversations/${convId}`,
  )) as unknown as ApiResponse<ConversationDetail>
  return res.data
}

export async function deleteStudentConversation(userId: string, convId: string): Promise<void> {
  await api.delete(`/school/students/${userId}/conversations/${convId}`)
}

export async function getSchoolChat(chatId: string): Promise<ConversationDetail> {
  const res = (await api.get(`/school/chats/${chatId}`)) as unknown as ApiResponse<ConversationDetail>
  return res.data
}

export async function deleteSchoolChat(chatId: string): Promise<void> {
  await api.delete(`/school/chats/${chatId}`)
}

//  Admin 端

export async function adminListConversations(username?: string, page = 0, size = 20) {
  const params: Record<string, unknown> = { page, size }
  if (username) params.username = username
  const res = (await api.get('/admin/chats', {
    params,
  })) as unknown as ApiResponse<{ content: Conversation[]; totalPages: number; totalElements: number }>
  return res.data
}

export async function adminGetConversation(chatId: string): Promise<ConversationDetail> {
  const res = (await api.get(`/admin/chats/${chatId}`)) as unknown as ApiResponse<ConversationDetail>
  return res.data
}

export async function adminDeleteConversation(chatId: string): Promise<void> {
  await api.delete(`/admin/chats/${chatId}`)
}
