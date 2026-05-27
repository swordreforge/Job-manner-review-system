import api from '@/api'
import type {
  AuthResponse,
  LoginRequest,
  OAuthCallbackResponse,
  OAuthProviderInfo,
  RegisterRequest,
  User,
} from '@/types/auth'

export function login(data: LoginRequest): Promise<AuthResponse> {
  return api.post('/auth/login', data)
}

export function register(data: RegisterRequest): Promise<{ data: User }> {
  return api.post('/auth/register', data)
}

export function refreshToken(refreshToken: string): Promise<AuthResponse> {
  return api.post('/auth/refresh', { refreshToken })
}

export function getMe(): Promise<{ data: User }> {
  return api.get('/auth/me')
}

// ── OAuth2 ──

export function getOAuthProviders(): Promise<{ data: OAuthProviderInfo[] }> {
  return api.get('/auth/oauth2/providers')
}

export function getOAuthUrl(
  provider: string,
  action?: string,
): Promise<{ data: { authorizationUrl: string; state: string } }> {
  return api.get(`/auth/oauth2/${provider}`, { params: action ? { action } : undefined })
}

export function oauthCallback(
  provider: string,
  code: string,
  state: string,
): Promise<{ data: OAuthCallbackResponse }> {
  return api.post(`/auth/oauth2/${provider}/callback`, { code, state })
}

export function completeOAuthRegistration(
  pendingToken: string,
  username: string,
): Promise<{ data: OAuthCallbackResponse }> {
  return api.post('/auth/oauth2/complete-registration', { pendingToken, username })
}

// ── 人脸快速登录 ──
export function faceEnroll(payload: {
  username: string
  password: string
  descriptors: number[][]
}) {
  return api.post('/auth/face/enroll', payload)
}

export function faceLogin(payload: { username: string; descriptor: number[] }) {
  return api.post('/auth/face/login', payload)
}

export function linkOAuth(
  provider: string,
  code: string,
  state: string,
): Promise<{ data: { message: string; providerUsername: string } }> {
  return api.post(`/auth/oauth2/link/${provider}`, { code, state })
}

export function unlinkOAuth(provider: string) {
  return api.delete(`/auth/oauth2/link/${provider}`)
}

export function getMyOAuthLinks(): Promise<{
  data: { provider: string; displayName: string; providerUsername: string }[]
}> {
  return api.get('/auth/oauth2/links')
}
