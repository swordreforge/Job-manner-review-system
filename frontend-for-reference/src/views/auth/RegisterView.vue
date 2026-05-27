<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const snackbar = ref(false)

const rules = {
  required: (v: string) => !!v || '此项不能为空',
  minLength: (min: number) => (v: string) => v.length >= min || `至少 ${min} 个字符`,
  passwordMatch: () => form.value.password === form.value.confirmPassword || '两次输入的密码不一致',
}

async function handleRegister() {
  if (!form.value.username || !form.value.password) return
  if (form.value.password !== form.value.confirmPassword) return

  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.register({
      username: form.value.username,
      password: form.value.password,
    })
    snackbar.value = true
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    errorMessage.value = e.response?.data?.message || '注册失败，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    brand-title="开启你的职业规划"
    brand-subtitle="免费注册，立即体验 AI 驱动的职业发展路径规划"
    gradient-variant="register"
  >
    <!-- 表单标题 -->
    <div class="form-header mb-8">
      <h2 class="form-title">创建账号</h2>
      <p class="form-desc">填写以下信息完成注册</p>
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

    <v-form @submit.prevent="handleRegister">
      <v-text-field
        v-model="form.username"
        label="用户名"
        prepend-inner-icon="mdi-account-outline"
        :rules="[rules.required, rules.minLength(3)]"
        variant="outlined"
        density="comfortable"
        class="mb-3 enhanced-field"
      />
      <v-text-field
        v-model="form.password"
        label="密码"
        prepend-inner-icon="mdi-lock-outline"
        :type="showPassword ? 'text' : 'password'"
        :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
        @click:append-inner="showPassword = !showPassword"
        :rules="[rules.required, rules.minLength(6)]"
        variant="outlined"
        density="comfortable"
        class="mb-3 enhanced-field"
      />
      <v-text-field
        v-model="form.confirmPassword"
        label="确认密码"
        prepend-inner-icon="mdi-lock-check-outline"
        :type="showPassword ? 'text' : 'password'"
        :rules="[rules.required, rules.passwordMatch]"
        variant="outlined"
        density="comfortable"
        class="mb-5 enhanced-field"
      />
      <v-btn type="submit" color="primary" block size="large" :loading="loading" class="register-btn">
        注册
      </v-btn>
    </v-form>

    <div class="text-center mt-5 text-body-2 text-medium-emphasis">
      已有账号？
      <router-link to="/login" class="text-primary font-weight-medium">去登录</router-link>
    </div>
  </AuthLayout>

  <v-snackbar v-model="snackbar" :timeout="3000" color="success" location="top right">
    注册成功！3 秒后跳转到登录页面...
  </v-snackbar>
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
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* 主按钮发光 + 上浮 */
.register-btn {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35) !important;
}
.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45) !important;
}
</style>
