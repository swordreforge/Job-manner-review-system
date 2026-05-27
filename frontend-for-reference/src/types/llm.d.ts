export interface LlmProvider {
  id: string
  name: string
  baseUrl: string
  apiKeyMasked: string
  createdAt: string
  updatedAt: string
}

export interface LlmModel {
  id: string
  providerId: string
  modelName: string
  inputPricePerMillion: number | null
  outputPricePerMillion: number | null
  createdAt: string
  updatedAt: string
}

export interface LlmModelConfig {
  id: string
  functionKey: string
  displayName: string
  functionGroup: string
  modelId: string | null
  temperature: number
  createdAt: string
  updatedAt: string
}

export interface TokenUsageStats {
  totalRequests: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalCost: number
}

export interface DailyUsageStat {
  date: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  totalCost: number
  requestCount: number
}

export interface ModelUsageStat {
  modelName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  totalCost: number
  requestCount: number
}

export interface TaskTypeUsageStat {
  taskType: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  totalCost: number
  requestCount: number
}

export interface TokenUsageRecord {
  id: string
  taskId: number | null
  userId: string | null
  taskType: string
  modelName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  createdAt: string
}
