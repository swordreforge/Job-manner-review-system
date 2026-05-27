import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { AuthResponse, User } from '@/types/auth'
import type { ApiResponse } from '@/types/api'
import * as authApi from '@/api/auth'
import { connectSSE, disconnectSSE } from '@/api/sse'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isSchool = computed(() => user.value?.role === 'SCHOOL')
  const currentUser = computed(() => user.value)

  function applyAuthPayload(payload: AuthResponse) {
    token.value = payload.accessToken
    refreshTokenValue.value = payload.refreshToken
    user.value = payload.user
    localStorage.setItem('token', payload.accessToken)
    localStorage.setItem('refreshToken', payload.refreshToken)
    connectSSE()
  }

  async function login(username: string, password: string) {
    const res = (await authApi.login({
      username,
      password,
    })) as unknown as ApiResponse<AuthResponse>
    applyAuthPayload(res.data)
  }

  async function register(data: { username: string; password: string }) {
    await authApi.register(data)
  }

  /** OAuth 登录成功后直接存储 token（由 OAuthCallbackView 调用） */
  function loginWithOAuth(accessToken: string, refreshToken: string, userData: User) {
    applyAuthPayload({ accessToken, refreshToken, user: userData })
  }

  /** 供人脸/其他快捷登录使用 */
  function loginWithTokens(accessToken: string, refreshToken: string, userData: User) {
    applyAuthPayload({ accessToken, refreshToken, user: userData })
  }

  function logout() {
    // 登出时断开 SSE 长连接
    disconnectSSE()
    token.value = null
    refreshTokenValue.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    router.push('/login')
  }

  async function refreshToken() {
    if (!refreshTokenValue.value) return
    try {
      const res = (await authApi.refreshToken(
        refreshTokenValue.value,
      )) as unknown as ApiResponse<AuthResponse>
      token.value = res.data.accessToken
      refreshTokenValue.value = res.data.refreshToken
      localStorage.setItem('token', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
    } catch {
      logout()
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      const res = (await authApi.getMe()) as unknown as ApiResponse<User>
      user.value = res.data
      // 页面刷新后恢复 SSE 连接
      connectSSE()
    } catch {
      logout()
    }
  }

  // 初始化时恢复用户信息
  if (token.value) {
    fetchCurrentUser()
  }

  return {
    token,
    refreshTokenValue,
    user,
    isAuthenticated,
    isAdmin,
    isSchool,
    currentUser,
    login,
    loginWithOAuth,
    loginWithTokens,
    register,
    logout,
    refreshToken,
    fetchCurrentUser,
  }
})
