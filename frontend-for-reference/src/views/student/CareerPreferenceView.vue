<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useStudentStore } from '@/stores/student'
import { useNavItems } from '@/composables/useNavItems'
import ApiErrorState from '@/components/ApiErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'

const store = useStudentStore()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/preference'))
const profileError = ref<string | null>(null)

const salaryOptions = ['3k-5k', '5k-8k', '8k-12k', '12k-18k', '18k-25k', '25k+']
const preferenceForm = ref({
  preferredCity: '',
  preferredSalary: '',
  preferredDirection: '',
  careerGoal: '',
})
const saving = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('green')

watch(
  () => store.profile,
  (p) => {
    if (p) {
      preferenceForm.value = {
        preferredCity: p.preferredCity ?? '',
        preferredSalary: p.preferredSalary ?? '',
        preferredDirection: p.preferredDirection ?? '',
        careerGoal: p.careerGoal ?? '',
      }
    }
  },
  { immediate: true },
)

async function loadProfile() {
  profileError.value = null
  try {
    await store.fetchProfile()
  } catch {
    profileError.value = '加载学生画像失败，请检查网络后重试'
  }
}

async function save() {
  saving.value = true
  try {
    await store.updateProfile({ ...preferenceForm.value })
    snackbarText.value = '就业意向已保存'
    snackbarColor.value = 'green'
    snackbar.value = true
  } catch {
    snackbarText.value = '保存失败，请重试'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '就业意向'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <v-skeleton-loader v-if="store.loading && !store.profile" type="card" class="mb-4" />

    <ApiErrorState
      v-else-if="profileError && !store.profile"
      :error="profileError"
      title="加载失败"
      @retry="loadProfile"
    />

    <template v-else>
      <!-- 尚无画像提示 -->
      <v-alert
        v-if="!store.loading && !store.profile"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        请先前往
        <RouterLink to="/profile" class="text-primary font-weight-medium">学生画像</RouterLink>
        页面上传简历或手动录入信息，生成画像后即可设置就业意向。
      </v-alert>

      <template v-if="store.profile">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="preferenceForm.preferredCity"
              label="期望城市"
              placeholder="如：北京、上海、深圳"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-map-marker"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="preferenceForm.preferredSalary"
              :items="salaryOptions"
              label="期望薪资"
              placeholder="选择薪资区间"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-currency-cny"
              clearable
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="preferenceForm.preferredDirection"
              label="期望方向"
              placeholder="如：前端开发、数据分析、产品经理"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-compass"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="preferenceForm.careerGoal"
              label="职业目标"
              placeholder="描述你的短期和长期职业目标…"
              variant="outlined"
              density="comfortable"
              rows="4"
              prepend-inner-icon="mdi-flag-checkered"
            />
          </v-col>
        </v-row>
        <div class="d-flex justify-end">
          <v-btn color="primary" :loading="saving" @click="save">
            <v-icon start icon="mdi-content-save" />保存意向
          </v-btn>
        </div>
      </template>
    </template>

    <v-snackbar v-model="snackbar" :timeout="3000" location="top right" :color="snackbarColor">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>
