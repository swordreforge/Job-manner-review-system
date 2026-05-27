export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface Conversation {
  id: string
  username?: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationDetail {
  id: string
  title: string
  messages: ConversationMessage[]
  createdAt: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
