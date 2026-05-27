<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api'
import * as authApi from '@/api/auth'
import type { OAuthCallbackResponse, User } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const errorMessage = ref('')

// ── 用户名设置弹窗 ──
const usernameDialog = ref(false)
const pendingToken = ref('')
const suggestedUsername = ref('')
const providerUsername = ref('')
const customUsername = ref('')
const registering = ref(false)
const registerError = ref('')

onMounted(async () => {
  const provider = route.params.provider as string
  const code = route.query.code as string
  const state = route.query.state as string

  if (!code || !state) {
    errorMessage.value = '缺少授权参数'
    loading.value = false
    return
  }

  try {
    // 统一回调接口，后端根据 Redis state 中存储的 action 自动判断是登录还是绑定
    const res = (await authApi.oauthCallback(provider, code, state)) as unknown as ApiResponse<
      OAuthCallbackResponse & { action?: string; message?: string }
    >
    const data = res.data

    if (data.action === 'link') {
      // 绑定模式 → 跳回个人设置页，附带成功提示
      router.push({
        path: '/user/settings',
        query: { oauthResult: 'success', oauthMessage: data.message || '绑定成功' },
      })
      return
    }

    if (!data.newUser) {
      // 已有用户，直接登录
      authStore.loginWithOAuth(data.accessToken!, data.refreshToken!, data.user as User)
      router.push('/dashboard')
    } else {
      // 新用户，弹出用户名设置弹窗
      pendingToken.value = data.pendingToken!
      suggestedUsername.value = data.suggestedUsername!
      providerUsername.value = data.providerUsername!
      customUsername.value = data.suggestedUsername!
      loading.value = false
      usernameDialog.value = true
    }
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: number } } }
    const msg = e.response?.data?.message || 'OAuth 登录失败'
    // 如果是绑定操作失败（错误码为 OAUTH 绑定相关），跳回设置页提示
    const errCode = e.response?.data?.code
    if (errCode === 1012 || errCode === 1013) {
      // OAUTH_ACCOUNT_ALREADY_LINKED 或 OAUTH_STATE_INVALID
      router.push({
        path: '/user/settings',
        query: { oauthResult: 'error', oauthMessage: msg },
      })
      return
    }
    errorMessage.value = msg
    loading.value = false
  }
})

async function submitRegistration(username: string) {
  registering.value = true
  registerError.value = ''
  try {
    const res = (await authApi.completeOAuthRegistration(
      pendingToken.value,
      username,
    )) as unknown as ApiResponse<OAuthCallbackResponse>
    const data = res.data
    authStore.loginWithOAuth(data.accessToken!, data.refreshToken!, data.user as User)
    usernameDialog.value = false
    router.push('/dashboard')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    registerError.value = e.response?.data?.message || '注册失败'
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5">
        <!-- 加载状态 -->
        <v-card
          v-if="loading && !usernameDialog"
          class="pa-8 text-center"
          elevation="8"
          rounded="lg"
        >
          <v-skeleton-loader type="text" class="mb-4" />
          <div class="text-body-1">正在处理第三方登录…</div>
        </v-card>

        <!-- 错误状态 -->
        <v-card v-else-if="errorMessage" class="pa-6" elevation="8" rounded="lg">
          <v-card-title class="text-h6 text-center">
            <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
            登录失败
          </v-card-title>
          <v-card-text class="text-center">
            <v-alert type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-btn color="primary" variant="flat" to="/login">返回登录</v-btn>
          </v-card-actions>
        </v-card>

        <!-- 空状态（弹窗模式下背景） -->
        <v-card v-else-if="usernameDialog" class="pa-8 text-center" elevation="8" rounded="lg">
          <v-icon color="success" size="48" class="mb-4">mdi-account-check</v-icon>
          <div class="text-body-1">第三方账号验证成功，请设置用户名</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 用户名设置弹窗 -->
    <v-dialog v-model="usernameDialog" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2" color="primary">mdi-account-edit</v-icon>
          设置您的用户名
        </v-card-title>
        <v-card-subtitle v-if="providerUsername" class="mt-1">
          来自第三方账号：{{ providerUsername }}
        </v-card-subtitle>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            欢迎！请设置一个用户名，也可以直接使用推荐的用户名。
          </v-alert>

          <v-alert
            v-if="registerError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
            @click:close="registerError = ''"
          >
            {{ registerError }}
          </v-alert>

          <v-text-field
            v-model="customUsername"
            label="用户名"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account"
            counter="50"
            maxlength="50"
            hint="3-50 个字符"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" color="grey" to="/login">取消</v-btn>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="secondary"
            :loading="registering"
            @click="submitRegistration(suggestedUsername)"
          >
            使用推荐用户名
          </v-btn>
          <v-btn
            variant="flat"
            color="primary"
            :loading="registering"
            :disabled="!customUsername || customUsername.length < 3"
            @click="submitRegistration(customUsername)"
          >
            确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
