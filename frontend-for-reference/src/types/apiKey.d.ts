export interface ApiKeyListItem {
  id: string
  name: string
  keyPrefix: string
  enabled: boolean
  expiresAt: string | null
  lastUsedAt: string | null
  usageCount: number
  rateLimit: number
  allowedIps: string | null
  permissions: string | null
  createdBy: string | null
  createdAt: string
}

export interface ApiKeyCreated {
  id: string
  name: string
  keyPrefix: string
  rawKey: string // 一次性明文，仅创建时返回
  expiresAt: string | null
  rateLimit: number
  permissions: string | null
  createdAt: string
}

export interface CreateApiKeyForm {
  name: string
  expiresAt: string | null
  rateLimit: number | null
  allowedIps: string | null
  permissions: string | null
}
