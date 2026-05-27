<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api'
import * as authApi from '@/api/auth'
import type { FaceLoginResponse, OAuthProviderInfo } from '@/types/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useCameraManager } from '@/composables/useCameraManager'
import { useFaceAuth } from '@/composables/useFaceAuth'

const router = useRouter()
const authStore = useAuthStore()
const cameraManager = useCameraManager()

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

// 人脸快捷登录状态
const hiddenVideo = ref<HTMLVideoElement | null>(null)
const releaseCamera = ref<(() => void) | null>(null)
const faceBusy = ref(false)
const faceMessage = ref('摄像头未启用')
const faceError = ref('')
const faceSimilarity = ref<number | null>(null)
const faceAuth = useFaceAuth(computed(() => hiddenVideo.value))

// OAuth 提供商
const oauthProviders = ref<OAuthProviderInfo[]>([])
const oauthLoading = ref<string | null>(null)

const rules = {
  required: (v: string) => !!v || '此项不能为空',
  minLength: (v: string) => v.length >= 3 || '至少 3 个字符',
}

onMounted(async () => {
  try {
    const res = (await authApi.getOAuthProviders()) as unknown as ApiResponse<OAuthProviderInfo[]>
    oauthProviders.value = res.data || []
  } catch {
    // 获取提供商失败不影响正常登录
  }
})

const faceHint = computed(() => {
  if (faceBusy.value) return '请保持正对屏幕，系统正在读取你的面部特征'
  if (faceSimilarity.value) {
    return `本次会话最近一次刷脸成功，相似度 ${(faceSimilarity.value * 100).toFixed(1)}%`
  }
  return '无需展示画面，体验类似手机 Face ID 的刷脸登录'
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureCameraReady() {
  await nextTick()
  if (!hiddenVideo.value) throw new Error('摄像头未就绪')
  if (!releaseCamera.value) {
    releaseCamera.value = await cameraManager.attach(hiddenVideo.value, { mirror: true })
  }
}

function releaseCam() {
  faceAuth.stop()
  releaseCamera.value?.()
  releaseCamera.value = null
}

async function captureBatch(desired = 3): Promise<number[][]> {
  await ensureCameraReady()
  const descriptors: number[][] = []
  for (let i = 0; i < desired; i++) {
    const descriptor = await faceAuth.captureDescriptor()
    if (descriptor?.length) {
      descriptors.push(descriptor)
    }
    await sleep(180)
  }
  return descriptors
}

async function handleLogin() {
  if (!username.value || !password.value || loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(username.value, password.value)
    router.push('/dashboard')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMessage.value = e.response?.data?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

async function handleFaceEnroll() {
  faceError.value = ''
  faceMessage.value = '正在录入多帧人脸…'
  faceBusy.value = true
  faceSimilarity.value = null
  if (!username.value || !password.value) {
    errorMessage.value = '请先填写用户名和密码，再录入人脸'
    faceBusy.value = false
    return
  }
  try {
    const descriptors = await captureBatch(4)
    if (!descriptors.length) throw new Error('未检测到人脸，请调整光线或距离')
    await authApi.faceEnroll({
      username: username.value,
      password: password.value,
      descriptors,
    })
    faceMessage.value = `已录入 ${descriptors.length} 组特征，支持刷脸快捷登录`
  } catch (err) {
    faceError.value = (err as Error)?.message || '人脸录入失败，请重试'
    faceMessage.value = '录入未完成'
  } finally {
    faceBusy.value = false
    releaseCam()
  }
}

async function handleFaceLogin() {
  faceError.value = ''
  faceMessage.value = '请正视屏幕，正在比对…'
  faceBusy.value = true
  faceSimilarity.value = null
  if (!username.value) {
    errorMessage.value = '请先输入用户名以匹配对应的人脸模板'
    faceBusy.value = false
    return
  }
  try {
    const descriptors = await captureBatch(1)
    if (!descriptors.length) throw new Error('未检测到人脸，请调整姿势后重试')
    const res = (await authApi.faceLogin({
      username: username.value,
      descriptor: descriptors[0] as number[],
    })) as unknown as ApiResponse<FaceLoginResponse>
    faceSimilarity.value = res.data.similarity ?? null
    authStore.loginWithTokens(res.data.accessToken, res.data.refreshToken, res.data.user)
    faceMessage.value = '刷脸登录成功'
    router.push('/dashboard')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    faceError.value = e.response?.data?.message || (err as Error)?.message || '刷脸登录失败'
    faceMessage.value = '可重试或改用密码登录'
  } finally {
    faceBusy.value = false
    releaseCam()
  }
}

onUnmounted(() => {
  releaseCam()
})

async function handleOAuthLogin(providerName: string) {
  oauthLoading.value = providerName
  errorMessage.value = ''
  try {
    const res = (await authApi.getOAuthUrl(providerName)) as unknown as ApiResponse<{
      authorizationUrl: string
    }>
    window.location.href = res.data.authorizationUrl
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMessage.value = e.response?.data?.message || '无法获取授权链接'
    oauthLoading.value = null
  }
}
</script>

<template>
  <AuthLayout brand-title="欢迎回来" brand-subtitle="继续你的职业规划之旅，让 AI 为你保驾护航" gradient-variant="login">
    <!-- 表单标题 -->
    <div class="form-header mb-8">
      <h2 class="form-title">登录账号</h2>
      <p class="form-desc">使用你的账号密码继续</p>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-5"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
      </v-alert>

      <div class="face-assist-card mb-6">
        <div class="d-flex align-center justify-space-between mb-3">
          <div>
            <div class="text-subtitle-2 font-weight-bold">刷脸快捷登录（可选）</div>
            <div class="text-body-2 text-medium-emphasis">{{ faceHint }}</div>
          </div>
          <v-chip size="small" color="primary" variant="tonal" class="text-none">
            安全 · 无画面
          </v-chip>
        </div>

        <div class="rounded px-3 py-3 gradient-box d-flex flex-column ga-2">
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-shield-account" size="20" color="primary" />
            <span class="text-body-2 font-weight-medium">{{ faceMessage }}</span>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              class="text-none"
              :loading="faceBusy"
              prepend-icon="mdi-face-recognition"
              @click="handleFaceLogin"
            >
              刷脸登录
            </v-btn>
            <v-btn
              color="secondary"
              variant="tonal"
              size="small"
              class="text-none"
              :loading="faceBusy"
              prepend-icon="mdi-refresh"
              @click="handleFaceEnroll"
            >
              录入 / 更新人脸
            </v-btn>
            <v-btn
              color="default"
              variant="text"
              size="small"
              class="text-none"
              :disabled="faceBusy"
              prepend-icon="mdi-lock"
              @click="releaseCam"
            >
              关闭摄像头
            </v-btn>
          </div>
          <div class="d-flex align-center ga-2">
            <v-chip
              size="small"
              :color="faceBusy ? 'warning' : faceSimilarity ? 'success' : 'info'"
              variant="tonal"
              class="text-none"
            >
              <template v-if="faceBusy">检测中</template>
              <template v-else-if="faceSimilarity">相似度 {{ (faceSimilarity * 100).toFixed(1) }}%</template>
              <template v-else>待检测</template>
            </v-chip>
            <span v-if="faceError" class="text-error text-body-2">{{ faceError }}</span>
          </div>
        </div>
        <video ref="hiddenVideo" class="sr-only camera-hidden" autoplay muted playsinline aria-hidden="true" />
      </div>

    <v-form @submit.prevent="handleLogin">
      <v-text-field
        v-model="username"
        label="用户名"
        prepend-inner-icon="mdi-account-outline"
        :rules="[rules.required, rules.minLength]"
        variant="outlined"
        density="comfortable"
        class="mb-3 enhanced-field"
      />
      <v-text-field
        v-model="password"
        label="密码"
        prepend-inner-icon="mdi-lock-outline"
        :type="showPassword ? 'text' : 'password'"
        :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        @click:append-inner="showPassword = !showPassword"
        :rules="[rules.required]"
        variant="outlined"
        density="comfortable"
        class="mb-5 enhanced-field"
      />
      <v-btn type="submit" color="primary" block size="large" :loading="loading" class="login-btn">
        登录
      </v-btn>
    </v-form>

    <div class="text-center mt-5 text-body-2 text-medium-emphasis">
      还没有账号？
      <router-link to="/register" class="text-primary font-weight-medium">立即注册</router-link>
    </div>

    <!-- OAuth 第三方登录 -->
    <template v-if="oauthProviders.length > 0">
      <div class="oauth-divider my-5">
        <span class="oauth-divider-text">或使用以下方式登录</span>
      </div>
      <div class="d-flex justify-center ga-3 flex-wrap">
        <v-btn
          v-for="provider in oauthProviders"
          :key="provider.name"
          :prepend-icon="provider.icon"
          variant="outlined"
          :loading="oauthLoading === provider.name"
          @click="handleOAuthLogin(provider.name)"
          class="oauth-btn"
        >
          {{ provider.displayName }}
        </v-btn>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
.form-header {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 14px;
}
.form-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}
.form-desc {
  font-size: 0.9rem;
  color: #718096;
}

/* 输入框聚焦光晕 */
.enhanced-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.15);
}

/* 主按钮发光 + 上浮 */
.login-btn {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  box-shadow: 0 4px 14px rgba(25, 118, 210, 0.35) !important;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.45) !important;
}

/* OAuth 分隔线 */
.oauth-divider {
  position: relative;
  display: flex;
  align-items: center;
}
.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
}
.oauth-divider-text {
  padding: 0 14px;
  font-size: 0.8rem;
  color: #718096;
  white-space: nowrap;
}

.oauth-btn {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.oauth-btn:hover {
  transform: translateY(-1px);
}

.face-assist-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(25, 118, 210, 0.2);
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.06), rgba(99, 102, 241, 0.08));
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.camera-hidden {
  /* 明示这是摄像头占位的隐藏元素 */
}

.gradient-box {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.85));
  border-radius: 12px;
  border: 1px dashed rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(6px);
}
</style>
