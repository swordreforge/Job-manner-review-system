<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useChatStore } from '@/stores/chat'
import { useStudentStore } from '@/stores/student'
import ApiErrorState from '@/components/ApiErrorState.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import logoUrl from '@/assets/logo.svg'

const chatStore = useChatStore()
const studentStore = useStudentStore()
const router = useRouter()
const route = useRoute()
const { mobile } = useDisplay()

const inputText = ref('')
const messageListRef = ref<HTMLElement | null>(null)
const conversationsError = ref<string | null>(null)
const sidebarOpen = ref(false)
// 避免画像未加载时警告栏闪烁：fetch 完成前保持隐藏
const profileFetched = ref(studentStore.profile !== null)

// 当前会话标题（移动端顶部工具栏显示）
const currentConvTitle = computed(() => {
  const conv = chatStore.conversations.find((c) => c.id === chatStore.currentConversationId)
  return conv?.title || '新对话'
})

const QUICK_QUESTIONS_POOL = [
  '我适合哪些职业方向？',
  '如何提升竞争力？',
  '我的技能有哪些不足？',
  '我该如何规划未来三年的职业发展？',
  '当前市场上哪些岗位需求旺盛？',
  '我的简历有哪些可以改进的地方？',
  '如何准备技术面试？',
  '转行需要补充哪些技能？',
  '大厂和中小公司哪个更适合我？',
  '实习经历对求职有多大影响？',
  '如何在校期间积累有竞争力的项目经验？',
  '求职时如何谈薪资？',
]

function sampleQuestions(pool: string[], n: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

const quickQuestions = ref(sampleQuestions(QUICK_QUESTIONS_POOL, 3))

function hasProfile() {
  return studentStore.profile !== null
}

async function scrollToBottom() {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

async function handleSend() {
  const content = inputText.value.trim()
  if (!content || chatStore.loading) return
  const wasNew = !chatStore.currentConversationId
  inputText.value = ''
  await chatStore.sendMessage(content)
  // 新会话流式完成后将 URL 同步为 /chat/:id，确保刷新或导航后能正确加载
  if (wasNew && chatStore.currentConversationId) {
    router.replace({ name: 'Chat', params: { conversationId: chatStore.currentConversationId } })
  }
  await scrollToBottom()
}

async function handleQuickQuestion(q: string) {
  if (chatStore.loading) return
  await chatStore.sendMessage(q)
  await scrollToBottom()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    handleSend()
  }
}

async function handleSelectConversation(id: string) {
  await chatStore.selectConversation(id)
  router.replace({ name: 'Chat', params: { conversationId: id } })
  await scrollToBottom()
  // 移动端选择会话后自动关闭抽屉
  if (mobile.value) sidebarOpen.value = false
}

function handleNewConversation() {
  chatStore.startNewConversation()
  router.replace({ name: 'Chat' })
  if (mobile.value) sidebarOpen.value = false
}

async function handleDeleteConversation(id: string, event: Event) {
  event.stopPropagation()
  await chatStore.deleteConversation(id)
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

async function loadConversations() {
  conversationsError.value = null
  try {
    await chatStore.fetchConversations()
  } catch {
    conversationsError.value = '加载历史对话失败，请检查网络后重试'
  }
}

onMounted(async () => {
  if (!studentStore.profile) {
    await studentStore.fetchProfile()
  }
  profileFetched.value = true
  await loadConversations()

  // 路由参数中带 conversationId 时直接加载；
  // 若 id 未变但有后台生成任务（用户中途离开后返回），同样强制重新加载以恢复占位符
  const routeConvId = route.params.conversationId as string | undefined
  if (routeConvId) {
    const needReload =
      routeConvId !== chatStore.currentConversationId ||
      chatStore.pendingGeneration?.conversationId === routeConvId
    if (needReload) {
      await chatStore.selectConversation(routeConvId)
      await scrollToBottom()
    }
  }
})

// 组件卸载时中止进行中的流式请求，防止内存泄漏和无效网络请求
onBeforeUnmount(() => {
  chatStore.abortStream()
})

// watch 路由变化（通过导航切换会话时同步 store）
watch(
  () => route.params.conversationId,
  async (newId) => {
    if (!newId) {
      chatStore.startNewConversation()
    } else {
      // 同 onMounted：id 未变但有后台任务时也需重新加载
      const needReload =
        newId !== chatStore.currentConversationId ||
        chatStore.pendingGeneration?.conversationId === newId
      if (needReload) {
        await chatStore.selectConversation(newId as string)
        await scrollToBottom()
      }
    }
  },
)

// 监听消息变化（含流式更新时内容追加），自动滚动到底部
watch(
  () => chatStore.messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)
</script>

<template>
  <div class="chat-layout d-flex" style="height: calc(100dvh - 64px)">
    <!-- 移动端会话抽屉 (d-md-none) -->
    <v-navigation-drawer v-model="sidebarOpen" temporary class="d-md-none" width="280">
      <div class="pa-3">
        <v-btn
          block
          variant="tonal"
          color="primary"
          prepend-icon="mdi-plus"
          @click="handleNewConversation"
        >
          新建对话
        </v-btn>
      </div>

      <v-divider />

      <div v-if="chatStore.conversationsLoading" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate size="24" color="primary" />
      </div>

      <div v-else-if="conversationsError" class="pa-3">
        <ApiErrorState
          :error="conversationsError"
          title="加载失败"
          @retry="loadConversations"
        />
      </div>

      <v-list v-else density="compact" nav class="py-1" style="overflow-y: auto">
        <v-list-item
          v-if="chatStore.conversations.length === 0"
          class="text-medium-emphasis text-caption text-center"
        >
          暂无历史对话
        </v-list-item>
        <v-list-item
          v-for="conv in chatStore.conversations"
          :key="conv.id"
          :active="chatStore.currentConversationId === conv.id"
          active-color="primary"
          rounded="lg"
          class="mb-1 conv-item"
          @click="handleSelectConversation(conv.id)"
        >
          <v-list-item-title class="text-body-2 conv-title">{{ conv.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ formatTime(conv.updatedAt) }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              icon="mdi-delete-outline"
              size="x-small"
              variant="text"
              class="conv-delete-btn"
              @click="handleDeleteConversation(conv.id, $event)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 桌面端左侧会话列表 (d-none d-md-flex) -->
    <div class="chat-sidebar flex-shrink-0 d-none d-md-flex flex-column">
      <div class="pa-3">
        <v-btn
          block
          variant="tonal"
          color="primary"
          prepend-icon="mdi-plus"
          @click="handleNewConversation"
        >
          新建对话
        </v-btn>
      </div>

      <v-divider />

      <div v-if="chatStore.conversationsLoading" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate size="24" color="primary" />
      </div>

      <div v-else-if="conversationsError" class="pa-3">
        <ApiErrorState
          :error="conversationsError"
          title="加载失败"
          @retry="loadConversations"
        />
      </div>

      <v-list v-else density="compact" nav class="py-1 flex-grow-1" style="overflow-y: auto">
        <v-list-item
          v-if="chatStore.conversations.length === 0"
          class="text-medium-emphasis text-caption text-center"
        >
          暂无历史对话
        </v-list-item>
        <v-list-item
          v-for="conv in chatStore.conversations"
          :key="conv.id"
          :active="chatStore.currentConversationId === conv.id"
          active-color="primary"
          rounded="lg"
          class="mb-1 conv-item"
          @click="handleSelectConversation(conv.id)"
        >
          <v-list-item-title class="text-body-2 conv-title">{{ conv.title }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption">{{ formatTime(conv.updatedAt) }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              icon="mdi-delete-outline"
              size="x-small"
              variant="text"
              class="conv-delete-btn"
              @click="handleDeleteConversation(conv.id, $event)"
            />
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- 右侧对话区域 -->
    <v-container
      fluid
      class="pa-2 pa-md-4 d-flex flex-column flex-grow-1"
      style="min-width: 0; height: 100%; overflow: hidden"
    >
      <!-- 移动端顶部工具栏 (d-flex d-md-none) -->
      <div class="d-flex d-md-none align-center px-1 py-1 mb-1">
        <v-btn
          icon="mdi-menu"
          variant="text"
          size="small"
          @click="sidebarOpen = true"
        />
        <span class="text-body-2 mx-2 flex-grow-1 text-truncate font-weight-medium">
          {{ currentConvTitle }}
        </span>
        <v-btn
          icon="mdi-plus"
          variant="text"
          size="small"
          @click="handleNewConversation"
        />
      </div>

      <!-- 消息区域 -->
      <div ref="messageListRef" class="flex-grow-1 px-2 message-list" style="min-height: 0">
        <!-- 后台生成中提示 -->
        <v-chip
          v-if="chatStore.isPolling"
          size="small"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-dots-horizontal-circle-outline"
          class="mb-3"
        >
          AI 正在后台生成，稍后自动更新…
        </v-chip>

        <!-- 画像缺失提示：等 fetchProfile 完成后再判断，避免初始闪烁 -->
        <v-alert
          v-if="profileFetched && !hasProfile()"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          closable
        >
          尚未建立学生画像，AI 将以通用模式对话。
          <v-btn variant="text" size="small" class="ml-2" @click="router.push('/profile')">
            立即完善 →
          </v-btn>
        </v-alert>

        <!-- 欢迎状态（无消息时） -->
        <div
          v-if="chatStore.messages.length === 0"
          class="d-flex flex-column align-center justify-center"
          style="min-height: 300px"
        >
          <v-img :src="logoUrl" width="72" height="72" class="mb-4 opacity-40" />
          <p class="text-h6 text-medium-emphasis mb-2">你好，我是你的 AI 职业规划顾问</p>
          <p class="text-body-2 text-medium-emphasis mb-6">
            基于你的学生画像，为你提供个性化的职业建议
          </p>
          <!-- 移动端纵向列表，桌面端横向 flex-wrap -->
          <div
            class="d-flex justify-center"
            :class="mobile ? 'flex-column align-stretch' : 'flex-wrap'"
            style="gap: 8px; max-width: 480px; width: 100%"
          >
            <v-chip
              v-for="q in quickQuestions"
              :key="q"
              variant="tonal"
              color="primary"
              clickable
              @click="handleQuickQuestion(q)"
            >
              {{ q }}
            </v-chip>
          </div>
        </div>

        <!-- 消息列表 -->
        <template v-for="(msg, idx) in chatStore.messages" :key="idx">
          <!-- 用户消息 -->
          <div v-if="msg.role === 'user'" class="d-flex justify-end mb-3">
            <v-card
              class="px-3 py-2 user-bubble"
              style="border-radius: 12px; background-color: #f5f5f5"
            >
              <p class="text-body-2" style="white-space: pre-wrap; color: #212121">{{ msg.content }}</p>
            </v-card>
          </div>

          <!-- AI 消息 -->
          <div v-else class="d-flex justify-start mb-3 align-start">
            <v-avatar size="32" class="mt-1 flex-shrink-0">
              <v-img :src="logoUrl" />
            </v-avatar>
            <v-card
              elevation="2"
              class="px-3 py-2 ai-bubble ml-3"
              style="border-radius: 4px 16px 16px 16px"
            >
              <!-- 流式加载骨架屏 -->
              <v-skeleton-loader
                v-if="chatStore.loading && idx === chatStore.messages.length - 1"
                type="paragraph"
                width="220"
                class="bg-transparent"
              />
              <MarkdownRenderer
                v-else
                :source="msg.content || ' '"
                :isStreaming="chatStore.loading && idx === chatStore.messages.length - 1"
              />
            </v-card>
          </div>
        </template>

        <!-- 错误提示 -->
        <v-alert
          v-if="chatStore.error"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-2"
          closable
          @click:close="chatStore.error = null"
        >
          {{ chatStore.error }}
        </v-alert>
      </div>

      <!-- 输入区域 -->
      <v-card elevation="3" class="pa-3 mt-3 flex-shrink-0" rounded="lg">
        <v-textarea
          v-model="inputText"
          :placeholder="mobile ? '输入问题...' : '输入问题...（Ctrl+Enter 发送，Enter 换行）'"
          :rows="mobile ? 2 : 3"
          variant="outlined"
          density="comfortable"
          hide-details
          :disabled="chatStore.loading"
          @keydown="handleKeydown"
        />
        <div class="d-flex justify-end mt-2">
          <v-btn
            color="primary"
            :loading="chatStore.loading"
            :disabled="!inputText.trim()"
            @click="handleSend"
          >
            <v-icon start>mdi-send</v-icon>
            发送
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.chat-layout {
  overflow: hidden;
}

.chat-sidebar {
  width: 260px;
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

.message-list {
  overflow-y: auto;
}

.conv-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.conv-item .conv-delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
}

.conv-item:hover .conv-delete-btn {
  opacity: 1;
}

/* 消息气泡宽度：桌面端 70% / 80%，移动端放宽 */
.user-bubble {
  max-width: 70%;
}

.ai-bubble {
  max-width: 80%;
}

@media (max-width: 959.98px) {
  .user-bubble {
    max-width: 85%;
  }

  .ai-bubble {
    max-width: 95%;
  }
}

.user-bubble :deep(p) {
  margin: 0;
}

/* AI 气泡入场动画：淡入 + 轻微上移 */
.ai-bubble {
  animation: ai-bubble-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes ai-bubble-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
