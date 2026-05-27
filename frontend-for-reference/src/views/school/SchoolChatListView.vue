<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Conversation, ConversationDetail } from '@/types/chat'
import * as chatApi from '@/api/chat'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import { useNavItems } from '@/composables/useNavItems'

const conversations = ref<Conversation[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const searchUsername = ref('')
const totalItems = ref(0)
const currentPage = ref(1)
const PAGE_SIZE = 20

const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/school/chats'))

// 详情 dialog
const dialogVisible = ref(false)
const selectedConv = ref<ConversationDetail | null>(null)
const detailLoading = ref(false)
const detailUserId = ref<string | null>(null)

// 删除确认 dialog
const deleteDialogVisible = ref(false)
const deletingItem = ref<{ userId: string; chatId: string } | null>(null)
const deleteLoading = ref(false)

const headers = [
  { title: '用户名', key: 'username', sortable: false, width: 160 },
  { title: '标题', key: 'title', sortable: false },
  { title: '创建时间', key: 'createdAt', sortable: false, width: 180 },
  { title: '最后更新', key: 'updatedAt', sortable: false, width: 180 },
  { title: '操作', key: 'actions', sortable: false, width: 120, align: 'center' as const },
]

function formatTime(dateStr: string) {
  return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-'
}

async function loadList(page = 1) {
  loading.value = true
  fetchError.value = null
  try {
    const result = await chatApi.listSchoolChats(
      searchUsername.value.trim() || undefined,
      page - 1,
      PAGE_SIZE,
    )
    conversations.value = result.content
    totalItems.value = result.totalElements ?? result.totalPages * PAGE_SIZE
    currentPage.value = page
  } catch {
    conversations.value = []
    fetchError.value = '加载聊天记录失败，请检查网络后重试'
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  await loadList(1)
}

async function openDetail(item: Conversation) {
  // 取 userId：需要先通过 username 找到 userId，但这里直接用 username 查会话详情
  // 直接用 getStudentConversation 需要 userId，改为直接调取会话详情
  dialogVisible.value = true
  selectedConv.value = null
  detailLoading.value = true
  detailUserId.value = item.username ?? null
  try {
    // School 可通过 /api/school/students/{userId}/conversations/{convId} 查详情
    // 但这里我们没有 userId，改用 admin 能访问的接口或直接沿用学生端接口
    // 实际上，SchoolController.getStudentConversationDetail 需要 userId
    // 这里采用：从会话列表点击的 item.username 去查找 userId (不方便)
    // 最简方案：沿用 getStudentConversation 前，先从 username 得到会话详情
    // 由于 /api/school/chats 返回的 Conversation 已包含 username，
    // 而 getStudentConversation(userId, convId) 需要 userId（UUID）
    // 因此在后端补充一个通过 username 查详情的路由，或直接复用旧路由
    // 简单方案：对 school 增加一个直接通过 convId 查看详情的接口
    // 暂时：直接请求 /api/school/chats/{chatId} (新增)
    const res = await chatApi.getSchoolChat(item.id)
    selectedConv.value = res
  } catch {
    selectedConv.value = null
  } finally {
    detailLoading.value = false
  }
}

function confirmDelete(item: Conversation) {
  if (!item.username) return
  deletingItem.value = { userId: item.username, chatId: item.id }
  deleteDialogVisible.value = true
}

async function handleDelete() {
  if (!deletingItem.value) return
  deleteLoading.value = true
  try {
    await chatApi.deleteSchoolChat(deletingItem.value.chatId)
    deleteDialogVisible.value = false
    if (selectedConv.value?.id === deletingItem.value.chatId) {
      dialogVisible.value = false
      selectedConv.value = null
    }
    await loadList(currentPage.value)
  } finally {
    deleteLoading.value = false
    deletingItem.value = null
  }
}

onMounted(() => loadList())
</script>

<template>
  <v-container fluid class="pa-6">
    <PageHeader
      :title="pageItem?.title ?? '聊天记录管理'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <!-- 搜索栏 -->
    <v-row class="mb-4" dense>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="searchUsername"
          placeholder="按用户名搜索"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          @keyup.enter="handleSearch"
          @click:clear="handleSearch"
        />
      </v-col>
      <v-col cols="auto">
        <v-btn variant="tonal" prepend-icon="mdi-magnify" @click="handleSearch">搜索</v-btn>
      </v-col>
    </v-row>

    <!-- 数据表格 -->
    <ApiErrorState
      v-if="fetchError && !loading"
      :error="fetchError"
      title="加载失败"
      @retry="() => loadList(currentPage)"
    />
    <v-card v-else>
      <v-data-table-server
        :headers="headers"
        :items="conversations"
        :items-length="totalItems"
        :loading="loading"
        :items-per-page="PAGE_SIZE"
        :items-per-page-options="[]"
        v-model:page="currentPage"
        item-value="id"
        @update:page="loadList"
      >
        <template #item.username="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.username ?? '-' }}</span>
        </template>
        <template #item.title="{ item }">
          <span class="text-body-2">{{ item.title }}</span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-caption text-medium-emphasis">{{ formatTime(item.createdAt) }}</span>
        </template>
        <template #item.updatedAt="{ item }">
          <span class="text-caption text-medium-emphasis">{{ formatTime(item.updatedAt) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-eye-outline"
            variant="text"
            size="small"
            color="primary"
            @click="openDetail(item)"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            color="error"
            @click="confirmDelete(item)"
          />
        </template>
        <template #no-data>
          <div class="text-center text-medium-emphasis py-6">暂无数据</div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 对话详情 Dialog -->
    <v-dialog v-model="dialogVisible" max-width="760" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center ga-2">
            <v-icon color="primary">mdi-chat-outline</v-icon>
            <span class="text-body-1 font-weight-medium">
              {{ detailLoading ? '加载中...' : (selectedConv?.title ?? '') }}
            </span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialogVisible = false" />
        </v-card-title>
        <v-divider />

        <v-card-text style="height: 560px; overflow-y: auto">
          <div v-if="detailLoading" class="d-flex justify-center align-center" style="height: 100%">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <template v-else-if="selectedConv">
            <template v-for="msg in selectedConv.messages" :key="msg.id">
              <div v-if="msg.role === 'user'" class="d-flex justify-end mb-3">
                <v-card
                  color="primary"
                  class="pa-3"
                  style="max-width: 70%; border-radius: 16px 4px 16px 16px"
                >
                  <p class="text-body-2 text-white" style="white-space: pre-wrap">{{ msg.content }}</p>
                </v-card>
              </div>
              <div v-else class="d-flex justify-start mb-3 align-start">
                <v-avatar size="32" color="primary" class="mt-1 flex-shrink-0">
                  <v-icon size="18" color="white">mdi-robot</v-icon>
                </v-avatar>
                <v-card
                  elevation="1"
                  class="pa-3 ml-3"
                  style="max-width: 80%; border-radius: 4px 16px 16px 16px"
                >
                  <MarkdownRenderer :source="msg.content || ' '" />
                </v-card>
              </div>
            </template>
          </template>
          <div v-else class="d-flex justify-center align-center text-medium-emphasis" style="height: 100%">
            加载失败，请重试
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

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
