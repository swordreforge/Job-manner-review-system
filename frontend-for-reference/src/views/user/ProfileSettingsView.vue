<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavItems } from '@/composables/useNavItems'
import PageHeader from '@/components/PageHeader.vue'
import ApiErrorState from '@/components/ApiErrorState.vue'
import type { ApiResponse } from '@/types/api'
import type { School } from '@/types/school'
import * as userApi from '@/api/user'
import * as authApi from '@/api/auth'
import * as schoolApi from '@/api/school'
import type { OAuthProviderInfo } from '@/types/auth'

const route = useRoute()
const authStore = useAuthStore()
const { findNavItemByPath } = useNavItems()
const navItem = findNavItemByPath('/user/settings')

const username = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// 分区标识：哪个部分在提交
const usernameLoading = ref(false)
const passwordLoading = ref(false)

// OAuth 绑定
const oauthProviders = ref<OAuthProviderInfo[]>([])
const oauthLinks = ref<{ provider: string; displayName: string; providerUsername: string }[]>([])
const oauthLoading = ref<string | null>(null)
const oauthError = ref<string | null>(null)
const hasPassword = ref(true)

// 解绑确认弹窗
const unbindDialog = ref(false)
const unbindTarget = ref<string | null>(null)

// 学校绑定（仅 STUDENT 角色）
const isStudent = computed(() => authStore.user?.role === 'STUDENT')
const boundSchool = ref<School | null>(null)
const inviteCodeInput = ref('')
const schoolBindLoading = ref(false)
const schoolUnbindDialog = ref(false)

/** 当前用户是否绑定了指定提供商 */
function getLink(providerName: string) {
  return oauthLinks.value.find((l) => l.provider === providerName)
}

const canSetPasswordWithoutOld = computed(() => !hasPassword.value)

onMounted(async () => {
  if (authStore.user) {
    username.value = authStore.user.username
  }

  // 加载学校绑定信息（仅学生）
  if (isStudent.value) {
    try {
      const res = (await schoolApi.getMyBoundSchool()) as unknown as ApiResponse<School | null>
      boundSchool.value = res.data || null
    } catch {
      // 非关键功能
    }
  }

  // 加载 OAuth 绑定信息
  oauthError.value = null
  try {
    const [providersRes, linksRes, meRes] = (await Promise.all([
      authApi.getOAuthProviders(),
      authApi.getMyOAuthLinks(),
      authApi.getMe(),
    ])) as unknown as [
      ApiResponse<OAuthProviderInfo[]>,
      ApiResponse<{ provider: string; displayName: string; providerUsername: string }[]>,
      ApiResponse<{ hasPassword?: boolean }>,
    ]
    oauthProviders.value = providersRes.data || []
    oauthLinks.value = linksRes.data || []
    hasPassword.value = meRes.data?.hasPassword !== false
  } catch {
    oauthError.value = '加载账号绑定信息失败，请刷新页面重试'
  }

  // OAuth 绑定回跳提示
  if (route.query.oauthResult === 'success') {
    showMessage((route.query.oauthMessage as string) || '绑定成功')
  } else if (route.query.oauthResult === 'error') {
    showMessage((route.query.oauthMessage as string) || '绑定失败', 'error')
  } else if (route.query.linked) {
    showMessage(`${route.query.linked} 绑定成功`)
  }
})

function showMessage(text: string, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

async function saveUsername() {
  if (!username.value || username.value.trim().length < 3) {
    showMessage('用户名长度至少 3 个字符', 'error')
    return
  }
  if (username.value === authStore.user?.username) {
    showMessage('用户名未变更', 'warning')
    return
  }
  usernameLoading.value = true
  try {
    const res = (await userApi.updateProfile({
      username: username.value.trim(),
    })) as unknown as ApiResponse<{ usernameChanged?: boolean }>
    showMessage('用户名修改成功，请重新登录')
    // 用户名变更后需要重新登录（JWT 中存的是 username）
    if (res.data?.usernameChanged) {
      setTimeout(() => {
        authStore.logout()
      }, 1500)
    } else {
      await authStore.fetchCurrentUser()
    }
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    const msg = e.response?.data?.message || '修改失败'
    showMessage(msg, 'error')
  } finally {
    usernameLoading.value = false
  }
}

async function savePassword() {
  if (!canSetPasswordWithoutOld.value && !oldPassword.value) {
    showMessage('请输入旧密码', 'error')
    return
  }
  if (!newPassword.value || newPassword.value.length < 6) {
    showMessage('新密码长度至少 6 个字符', 'error')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showMessage('两次输入的密码不一致', 'error')
    return
  }
  passwordLoading.value = true
  try {
    const payload: Record<string, string> = { newPassword: newPassword.value }
    if (!canSetPasswordWithoutOld.value) {
      payload.oldPassword = oldPassword.value
    }
    await userApi.updateProfile(payload)
    showMessage(canSetPasswordWithoutOld.value ? '密码设置成功' : '密码修改成功，请重新登录')
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    if (canSetPasswordWithoutOld.value) {
      hasPassword.value = true
    } else {
      setTimeout(() => {
        authStore.logout()
      }, 1500)
    }
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    const msg = e.response?.data?.message || '修改失败'
    showMessage(msg, 'error')
  } finally {
    passwordLoading.value = false
  }
}

// ── 学校绑定/解绑 ──

async function handleBindSchool() {
  if (!inviteCodeInput.value.trim()) return
  schoolBindLoading.value = true
  try {
    await schoolApi.bindSchool(inviteCodeInput.value.trim())
    const res = (await schoolApi.getMyBoundSchool()) as unknown as ApiResponse<School | null>
    boundSchool.value = res.data || null
    inviteCodeInput.value = ''
    showMessage('学校绑定成功')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '绑定失败，请检查邀请码', 'error')
  } finally {
    schoolBindLoading.value = false
  }
}

async function handleUnbindSchool() {
  schoolUnbindDialog.value = false
  schoolBindLoading.value = true
  try {
    await schoolApi.unbindSchool()
    boundSchool.value = null
    showMessage('已解绑学校')
  } catch {
    showMessage('解绑失败', 'error')
  } finally {
    schoolBindLoading.value = false
  }
}

// ── OAuth 绑定/解绑 ──

async function handleBindOAuth(providerName: string) {
  oauthLoading.value = providerName
  try {
    const res = (await authApi.getOAuthUrl(providerName, 'link')) as unknown as ApiResponse<{
      authorizationUrl: string
    }>
    window.location.href = res.data.authorizationUrl
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '获取授权链接失败', 'error')
    oauthLoading.value = null
  }
}

function confirmUnbindOAuth(providerName: string) {
  unbindTarget.value = providerName
  unbindDialog.value = true
}

async function handleUnbindOAuth() {
  const providerName = unbindTarget.value
  if (!providerName) return
  unbindDialog.value = false
  oauthLoading.value = providerName
  try {
    await authApi.unlinkOAuth(providerName)
    oauthLinks.value = oauthLinks.value.filter((l) => l.provider !== providerName)
    showMessage('解绑成功')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    showMessage(e.response?.data?.message || '解绑失败', 'error')
  } finally {
    oauthLoading.value = null
    unbindTarget.value = null
  }
}
</script>

<template>
  <v-container class="py-6">
    <PageHeader
      :title="navItem?.title ?? '用户中心'"
      :description="navItem?.description"
      :icon="navItem?.icon"
    />

    <v-row>
      <v-col cols="12" md="6">
        <!-- 修改用户名 -->
        <div class="text-subtitle-2 text-medium-emphasis mb-4">修改用户名</div>
        <v-text-field
          v-model="username"
          label="用户名"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account"
          counter="50"
          maxlength="50"
        />
        <div class="d-flex justify-end mb-2">
          <v-btn color="primary" variant="flat" :loading="usernameLoading" @click="saveUsername">
            保存用户名
          </v-btn>
        </div>

        <v-divider class="my-6" />

        <!-- 修改/设置密码 -->
        <div class="text-subtitle-2 text-medium-emphasis mb-4">
          {{ canSetPasswordWithoutOld ? '设置密码' : '修改密码' }}
        </div>
        <v-alert
          v-if="canSetPasswordWithoutOld"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          您的账号通过第三方登录创建，尚未设置密码。设置密码后可使用用户名 + 密码登录。
        </v-alert>
        <v-text-field
          v-if="!canSetPasswordWithoutOld"
          v-model="oldPassword"
          label="旧密码"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-lock"
          :type="showOldPassword ? 'text' : 'password'"
          :append-inner-icon="showOldPassword ? 'mdi-eye-off' : 'mdi-eye'"
          class="mb-2"
          @click:append-inner="showOldPassword = !showOldPassword"
        />
        <v-text-field
          v-model="newPassword"
          :label="canSetPasswordWithoutOld ? '密码' : '新密码'"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-lock-plus"
          :type="showNewPassword ? 'text' : 'password'"
          :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
          hint="至少 6 个字符"
          class="mb-2"
          @click:append-inner="showNewPassword = !showNewPassword"
        />
        <v-text-field
          v-model="confirmPassword"
          label="确认密码"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-lock-check"
          :type="showConfirmPassword ? 'text' : 'password'"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :error-messages="
            confirmPassword && confirmPassword !== newPassword ? '两次输入的密码不一致' : ''
          "
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
        />
        <div class="d-flex justify-end mb-2">
          <v-btn color="primary" variant="flat" :loading="passwordLoading" @click="savePassword">
            {{ canSetPasswordWithoutOld ? '设置密码' : '修改密码' }}
          </v-btn>
        </div>
      </v-col>

      <v-col v-if="isStudent || oauthProviders.length > 0 || oauthError" cols="12" md="6">
        <!-- 学校绑定（仅学生） -->
        <template v-if="isStudent">
          <div class="text-subtitle-2 text-medium-emphasis mb-4">学校绑定</div>
          <template v-if="boundSchool">
            <v-alert type="success" variant="tonal" class="mb-3">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">{{ boundSchool.name }}</div>
                  <div v-if="boundSchool.description" class="text-caption text-grey">
                    {{ boundSchool.description }}
                  </div>
                </div>
                <v-btn
                  size="small"
                  color="error"
                  variant="outlined"
                  :loading="schoolBindLoading"
                  @click="schoolUnbindDialog = true"
                >
                  解绑
                </v-btn>
              </div>
            </v-alert>
          </template>
          <template v-else>
            <p class="text-body-2 text-grey mb-3">
              输入学校提供的邀请码，绑定后学校可查看您的学习数据
            </p>
            <div class="d-flex ga-2 align-start">
              <v-text-field
                v-model="inviteCodeInput"
                label="邀请码"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="8位邀请码"
                style="max-width: 200px"
              />
              <v-btn
                color="primary"
                :loading="schoolBindLoading"
                :disabled="!inviteCodeInput.trim()"
                @click="handleBindSchool"
              >
                绑定
              </v-btn>
            </div>
          </template>
        </template>

        <!-- 第三方账号绑定 -->
        <template v-if="oauthError">
          <v-divider v-if="isStudent" class="my-6" />
          <ApiErrorState
            :error="oauthError"
            title="加载第三方绑定失败"
            @retry="() => $router.go(0)"
          />
        </template>
        <template v-else-if="oauthProviders.length > 0">
          <v-divider v-if="isStudent" class="my-6" />
          <div class="text-subtitle-2 text-medium-emphasis mb-4">第三方账号绑定</div>
          <v-list density="compact" class="pa-0">
            <v-list-item v-for="provider in oauthProviders" :key="provider.name">
              <template #prepend>
                <v-icon :icon="provider.icon" class="mr-3" />
              </template>
              <v-list-item-title>{{ provider.displayName }}</v-list-item-title>
              <v-list-item-subtitle v-if="getLink(provider.name)">
                已绑定：{{ getLink(provider.name)!.providerUsername || '未知用户' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else class="text-grey">未绑定</v-list-item-subtitle>
              <template #append>
                <v-btn
                  v-if="getLink(provider.name)"
                  variant="outlined"
                  color="error"
                  size="small"
                  :loading="oauthLoading === provider.name"
                  @click="confirmUnbindOAuth(provider.name)"
                >
                  解绑
                </v-btn>
                <v-btn
                  v-else
                  variant="outlined"
                  color="primary"
                  size="small"
                  :loading="oauthLoading === provider.name"
                  @click="handleBindOAuth(provider.name)"
                >
                  绑定
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </template>
      </v-col>
    </v-row>

    <!-- 学校解绑确认弹窗 -->
    <v-dialog v-model="schoolUnbindDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>确认解绑学校</v-card-title>
        <v-card-text>确定要解绑「{{ boundSchool?.name }}」吗？解绑后该学校将无法查看您的数据。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="schoolUnbindDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="handleUnbindSchool">确认解绑</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 解绑确认弹窗 -->
    <v-dialog v-model="unbindDialog" max-width="400" persistent>
      <v-card>
        <v-card-title>确认解绑</v-card-title>
        <v-card-text>确定要解绑该第三方账号吗？解绑后将无法使用该账号登录。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="unbindDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="handleUnbindOAuth">确认解绑</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
