import api from '@/api'
import type { ApiResponse } from '@/types/api'
import type { QueueStats } from '@/types/task'

// ── 数据导入 ──

export function uploadJobData(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/admin/jobs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 大文件上传可能较慢
  })
}

// ── 知识库 ──

export function exportKnowledgeBase(params?: {
  includeEmbeddings?: boolean
  collections?: string
}) {
  return api.get('/admin/knowledge/export', { params, responseType: 'blob' })
}

export function getKnowledgeStats(): Promise<ApiResponse<Record<string, number>>> {
  return api.get('/admin/knowledge/stats')
}

// ── 异步数据管道操作（提交即返回成功） ──

// ── 任务队列管理 ──

export function getTaskList(params?: { page?: number; size?: number; status?: string }) {
  return api.get('/admin/tasks', { params })
}

export function getQueueStats(): Promise<ApiResponse<QueueStats>> {
  return api.get('/admin/tasks/stats')
}

// ── 用户管理 ──

export function getUserList(params?: { page?: number; size?: number }) {
  return api.get('/admin/users', { params })
}

export function createUser(data: { username: string; password: string }) {
  return api.post('/admin/users', data)
}

export function updateUser(id: string, data: { username?: string; password?: string }) {
  return api.put(`/admin/users/${id}`, data)
}

export function deleteUser(id: string) {
  return api.delete(`/admin/users/${id}`)
}

// ── OAuth 提供商管理 ──

export function getOAuthProviders(params?: { page?: number; size?: number }) {
  return api.get('/admin/oauth-providers', { params })
}

export function createOAuthProvider(data: Record<string, unknown>) {
  return api.post('/admin/oauth-providers', data)
}

export function updateOAuthProvider(id: string, data: Record<string, unknown>) {
  return api.put(`/admin/oauth-providers/${id}`, data)
}

export function deleteOAuthProvider(id: string) {
  return api.delete(`/admin/oauth-providers/${id}`)
}

export function toggleOAuthProvider(id: string) {
  return api.patch(`/admin/oauth-providers/${id}/toggle`)
}

// ── 学校管理 ──

export function getSchoolList(params?: { page?: number; size?: number }) {
  return api.get('/admin/schools', { params })
}

export function createSchool(data: { name: string; description?: string }) {
  return api.post('/admin/schools', data)
}

export function updateSchool(id: string, data: { name?: string; description?: string }) {
  return api.put(`/admin/schools/${id}`, data)
}

export function deleteSchool(id: string) {
  return api.delete(`/admin/schools/${id}`)
}

export function regenerateInviteCode(id: string) {
  return api.post(`/admin/schools/${id}/regenerate-invite-code`)
}

export function createSchoolUser(id: string, data: { username: string; password: string }) {
  return api.post(`/admin/schools/${id}/users`, data)
}

export function getSchoolStudents(id: string, params?: { page?: number; size?: number }) {
  return api.get(`/admin/schools/${id}/students`, { params })
}

// ── API 密钥管理 ──

export function getApiKeyList() {
  return api.get('/admin/api-keys')
}

export function createApiKey(data: {
  name: string
  expiresAt?: string | null
  rateLimit?: number | null
  allowedIps?: string | null
  permissions?: string | null
}) {
  return api.post('/admin/api-keys', data)
}

export function deleteApiKey(id: string) {
  return api.delete(`/admin/api-keys/${id}`)
}

export function toggleApiKey(id: string) {
  return api.patch(`/admin/api-keys/${id}/toggle`)
}

// ── LLM 供应商管理 ──

export function getLlmProviders() {
  return api.get('/admin/llm/providers')
}

export function createLlmProvider(data: { name: string; baseUrl: string; apiKey: string }) {
  return api.post('/admin/llm/providers', data)
}

export function updateLlmProvider(
  id: string,
  data: { name?: string; baseUrl?: string; apiKey?: string },
) {
  return api.put(`/admin/llm/providers/${id}`, data)
}

export function deleteLlmProvider(id: string) {
  return api.delete(`/admin/llm/providers/${id}`)
}

// ── LLM 模型管理 ──

export function getLlmModels() {
  return api.get('/admin/llm/models')
}

export function createLlmModel(data: {
  providerId: string
  modelName: string
  inputPricePerMillion?: number
  outputPricePerMillion?: number
}) {
  return api.post('/admin/llm/models', data)
}

export function updateLlmModel(
  id: string,
  data: {
    providerId?: string
    modelName?: string
    inputPricePerMillion?: number
    outputPricePerMillion?: number
  },
) {
  return api.put(`/admin/llm/models/${id}`, data)
}

export function deleteLlmModel(id: string) {
  return api.delete(`/admin/llm/models/${id}`)
}

// ── LLM 功能配置 ──

export function getLlmConfigs() {
  return api.get('/admin/llm/configs')
}

export function updateLlmConfig(id: string, data: { modelId: string; temperature: number }) {
  return api.put(`/admin/llm/configs/${id}`, data)
}

export function resetLlmConfigs() {
  return api.post('/admin/llm/configs/reset')
}

// ── LLM 用量统计 ──

export function getLlmUsageStats(params?: { startDate?: string; endDate?: string }) {
  return api.get('/admin/llm/usage/stats', { params })
}

export function getLlmUsageDaily(params?: { startDate?: string; endDate?: string }) {
  return api.get('/admin/llm/usage/daily', { params })
}

export function getLlmUsageByModel(params?: { startDate?: string; endDate?: string }) {
  return api.get('/admin/llm/usage/by-model', { params })
}

export function getLlmUsageByTaskType(params?: { startDate?: string; endDate?: string }) {
  return api.get('/admin/llm/usage/by-task-type', { params })
}

export function getLlmUsageRecords(params?: {
  page?: number
  size?: number
  userId?: string
  taskType?: string
  startDate?: string
  endDate?: string
}) {
  return api.get('/admin/llm/usage/records', { params })
}
