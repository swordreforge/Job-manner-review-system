<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Conversation, ConversationDetail } from '@/types/chat'
import * as chatApi from '@/api/chat'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import logoUrl from '@/assets/logo.svg'

const route = useRoute()
const userId = computed(() => route.params.userId as string)

const conversations = ref<Conversation[]>([])
const selectedConv = ref<ConversationDetail | null>(null)
const listLoading = ref(false)
const listError = ref<string | null>(null)
const detailLoading = ref(false)
const selectedId = ref<string | null>(null)

// 删除确认
const deleteDialogVisible = ref(false)
const deletingId = ref<string | null>(null)
const deleteLoading = ref(false)

function formatTime(dateStr: string) {
  return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-'
}

async function loadList() {
  listLoading.value = true
  listError.value = null
  try {
    const result = await chatApi.listStudentConversations(userId.value)
    conversations.value = result.content
  } catch {
    conversations.value = []
    listError.value = '加载聊天记录失败，请重试'
  } finally {
    listLoading.value = false
  }
}

async function selectConv(id: string) {
  selectedId.value = id
  selectedConv.value = null
  detailLoading.value = true
  try {
    selectedConv.value = await chatApi.getStudentConversation(userId.value, id)
  } catch {
    selectedConv.value = null
  } finally {
    detailLoading.value = false
  }
}

function confirmDelete(id: string, event: Event) {
  event.stopPropagation()
  deletingId.value = id
  deleteDialogVisible.value = true
}

async function handleDelete() {
  if (!deletingId.value) return
  deleteLoading.value = true
  try {
    await chatApi.deleteStudentConversation(userId.value, deletingId.value)
    // 如果删除的是当前选中的会话，清空右侧
    if (selectedId.value === deletingId.value) {
      selectedId.value = null
      selectedConv.value = null
    }
    deleteDialogVisible.value = false
    await loadList()
  } finally {
    deleteLoading.value = false
    deletingId.value = null
  }
}

onMounted(loadList)
</script>

<template>
  <v-container fluid class="pa-4 d-flex flex-column" style="height: calc(100vh - 64px); overflow: hidden">
    <v-btn icon="mdi-arrow-left" variant="text" size="small" class="mb-1 flex-shrink-0" @click="$router.back()" />
    <PageHeader title="学生聊天记录" icon="mdi-chat-outline" class="flex-shrink-0" :breadcrumb-title="'学生聊天记录'" />

    <div class="d-flex gap-4 flex-grow-1" style="min-height: 0">
      <!-- 左侧：会话列表 -->
      <v-card width="260" class="flex-shrink-0 d-flex flex-column" style="height: 100%">
        <v-card-title class="text-body-1 py-2 px-3">对话列表</v-card-title>
        <v-divider />
        <div v-if="listLoading" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>
        <div v-else-if="listError" class="pa-3">
          <ApiErrorState :error="listError" title="加载失败" @retry="loadList" />
        </div>
        <v-list v-else density="compact" nav class="flex-grow-1 overflow-y-auto py-1">
          <v-list-item
            v-if="conversations.length === 0"
            class="text-medium-emphasis text-caption text-center"
          >
            暂无聊天记录
          </v-list-item>
          <v-list-item
            v-for="conv in conversations"
            :key="conv.id"
            :active="selectedId === conv.id"
            active-color="primary"
            rounded="lg"
            class="mb-1"
            @click="selectConv(conv.id)"
          >
            <v-list-item-title class="text-body-2 text-truncate">{{ conv.title }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ formatTime(conv.updatedAt) }}</v-list-item-subtitle>
            <template #append>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="x-small"
                color="error"
                @click="confirmDelete(conv.id, $event)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- 右侧：消息详情（只读） -->
      <v-card class="flex-grow-1 d-flex flex-column" style="min-width: 0; height: 100%">
        <div v-if="!selectedId" class="flex-grow-1 d-flex align-center justify-center">
          <div class="text-center text-medium-emphasis">
            <v-icon size="64" class="mb-4 opacity-40">mdi-chat-outline</v-icon>
            <p>选择左侧对话查看内容</p>
          </div>
        </div>

        <template v-else>
          <v-card-title class="py-2 px-4 text-body-1 flex-shrink-0">
            {{ selectedConv?.title ?? '加载中...' }}
          </v-card-title>
          <v-divider />
          <div v-if="detailLoading" class="d-flex justify-center pa-4">
            <v-progress-circular indeterminate size="24" color="primary" />
          </div>
          <div v-else-if="selectedConv" class="flex-grow-1 overflow-y-auto pa-4">
            <template v-for="msg in selectedConv.messages" :key="msg.id">
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
                  class="px-3 py-2 ml-3 ai-bubble"
                  style="border-radius: 4px 16px 16px 16px"
                >
                  <MarkdownRenderer :source="msg.content || ' '" />
                </v-card>
              </div>
            </template>
          </div>
        </template>
      </v-card>
    </div>

    <!-- 删除确认 Dialog -->
    <v-dialog v-model="deleteDialogVisible" max-width="400">
      <v-card>
        <v-card-title class="text-body-1 font-weight-medium pa-4">确认删除</v-card-title>
        <v-card-text class="text-body-2">确定要删除该会话吗？此操作不可撤销。</v-card-text>
        <v-card-actions class="justify-end pa-4 gap-2">
          <v-btn variant="text" @click="deleteDialogVisible = false">取消</v-btn>
          <v-btn color="error" variant="tonal" :loading="deleteLoading" @click="handleDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.user-bubble {
  max-width: 70%;
}

.ai-bubble {
  max-width: 80%;
}
</style>
