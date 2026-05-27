<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  docSections,
  flattenDocs,
  isAdminDoc,
  isSchoolDoc,
  type DocSection,
  type DocNode,
} from '@/docs/manifest'
import { loadDoc, docExists } from '@/docs/loader'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ── 状态 ──
const content = ref('')
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const mobileDrawer = ref(false)

// ── 当前 slug ──
const currentSlug = computed(() => {
  const slug = route.params.slug
  if (Array.isArray(slug)) return slug.join('/')
  return slug || 'getting-started'
})

// ── 按角色过滤文档分组 ──
const isAdmin = computed(() => authStore.isAdmin)
const isSchool = computed(() => authStore.isSchool)

const filteredSections = computed<DocSection[]>(() => {
  return docSections
    .filter((section) => {
      if (!section.role) return true
      if (section.role === 'admin') return isAdmin.value
      if (section.role === 'school') return isSchool.value
      return false
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.role) return true
        if (item.role === 'admin') return isAdmin.value
        if (item.role === 'school') return isSchool.value
        return false
      }),
    }))
    .filter((section) => section.items.length > 0)
})

// ── 搜索过滤 ──
const searchedSections = computed<DocSection[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return filteredSections.value
  return filteredSections.value
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.title.toLowerCase().includes(q)),
    }))
    .filter((section) => section.items.length > 0)
})

// ── 扁平列表（用于上/下页导航） ──
const flatDocs = computed(() => {
  const all = flattenDocs(filteredSections.value)
  return all
})

const currentIndex = computed(() => flatDocs.value.findIndex((d) => d.slug === currentSlug.value))
const prevDoc = computed<DocNode | null>(() =>
  currentIndex.value > 0 ? (flatDocs.value[currentIndex.value - 1] ?? null) : null,
)
const nextDoc = computed<DocNode | null>(() =>
  currentIndex.value >= 0 && currentIndex.value < flatDocs.value.length - 1
    ? (flatDocs.value[currentIndex.value + 1] ?? null)
    : null,
)

// ── 当前文档标题 ──
const currentTitle = computed(() => {
  const found = flatDocs.value.find((d) => d.slug === currentSlug.value)
  return found?.title ?? '文档'
})

// ── 加载文档内容 ──
async function load(slug: string) {
  loading.value = true
  error.value = ''
  content.value = ''
  try {
    if (!docExists(slug)) {
      error.value = `文档「${slug}」不存在`
      return
    }
    // 管理员文档权限校验
    if (isAdminDoc(slug) && !isAdmin.value) {
      error.value = '该文档仅管理员可访问'
      return
    }
    // 学校管理员文档权限校验
    if (isSchoolDoc(slug) && !isSchool.value) {
      error.value = '该文档仅学校管理员可访问'
      return
    }
    content.value = await loadDoc(slug)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载文档失败'
  } finally {
    loading.value = false
  }
}

function navigateTo(slug: string) {
  router.push(`/docs/${slug}`)
  mobileDrawer.value = false
}

// ── 监听路由变化 ──
watch(currentSlug, (slug) => load(slug), { immediate: false })

onMounted(() => {
  load(currentSlug.value)
})
</script>

<template>
  <v-container fluid class="pa-0 fill-height" style="align-items: stretch">
    <v-row no-gutters class="fill-height">
      <!-- ── 侧边目录（桌面端） ── -->
      <v-col
        cols="0"
        md="3"
        lg="2"
        class="d-none d-md-flex flex-column"
        style="
          border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
          max-height: calc(100vh - 64px);
          overflow-y: auto;
        "
      >
        <div class="pa-3">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="solo-filled"
            flat
            placeholder="搜索文档..."
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
          />
        </div>

        <v-list density="compact" nav class="pt-0">
          <template v-for="section in searchedSections" :key="section.heading">
            <v-list-subheader>
              <v-icon v-if="section.icon" size="16" class="mr-1">{{ section.icon }}</v-icon>
              {{ section.heading }}
            </v-list-subheader>

            <v-list-item
              v-for="item in section.items"
              :key="item.slug"
              :prepend-icon="item.icon"
              :title="item.title"
              :active="item.slug === currentSlug"
              color="primary"
              rounded="lg"
              @click="navigateTo(item.slug)"
            />
          </template>
        </v-list>
      </v-col>

      <!-- ── 主内容区 ── -->
      <v-col cols="12" md="9" lg="10">
        <!-- 移动端顶部工具栏 -->
        <div class="d-flex d-md-none align-center pa-3" style="gap: 8px">
          <v-btn icon variant="text" @click="mobileDrawer = true">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
          <span class="text-subtitle-1 font-weight-medium">{{ currentTitle }}</span>
        </div>

        <!-- 内容 -->
        <div
          class="pa-4 pa-md-6 w-100"
          style="max-height: calc(100vh - 64px); overflow-y: auto"
        >
          <!-- 面包屑 -->
          <v-breadcrumbs density="compact" class="px-0 mb-2">
            <v-breadcrumbs-item to="/docs" :disabled="currentSlug === 'getting-started'">
              <v-icon size="16" class="mr-1">mdi-book-open-variant</v-icon>
              文档
            </v-breadcrumbs-item>
            <v-breadcrumbs-divider />
            <v-breadcrumbs-item disabled>
              {{ currentTitle }}
            </v-breadcrumbs-item>
          </v-breadcrumbs>

          <!-- 加载中 -->
          <div v-if="loading" class="py-4">
            <v-skeleton-loader type="heading, paragraph, paragraph, paragraph" />
          </div>

          <!-- 错误 -->
          <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
            {{ error }}
          </v-alert>

          <!-- 正文 -->
          <MarkdownRenderer v-else :source="content" />

          <!-- 上/下页导航 -->
          <v-divider class="my-6" />
          <div class="d-flex justify-space-between">
            <v-btn
              v-if="prevDoc"
              variant="text"
              :prepend-icon="'mdi-chevron-left'"
              @click="navigateTo(prevDoc.slug)"
            >
              {{ prevDoc.title }}
            </v-btn>
            <v-spacer />
            <v-btn
              v-if="nextDoc"
              variant="text"
              :append-icon="'mdi-chevron-right'"
              @click="navigateTo(nextDoc.slug)"
            >
              {{ nextDoc.title }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- ── 移动端抽屉目录 ── -->
    <v-navigation-drawer v-model="mobileDrawer" temporary location="left" class="d-md-none">
      <div class="pa-3">
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="solo-filled"
          flat
          placeholder="搜索文档..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
        />
      </div>

      <v-list density="compact" nav>
        <template v-for="section in searchedSections" :key="section.heading">
          <v-list-subheader>
            <v-icon v-if="section.icon" size="16" class="mr-1">{{ section.icon }}</v-icon>
            {{ section.heading }}
          </v-list-subheader>

          <v-list-item
            v-for="item in section.items"
            :key="item.slug"
            :prepend-icon="item.icon"
            :title="item.title"
            :active="item.slug === currentSlug"
            color="primary"
            rounded="lg"
            @click="navigateTo(item.slug)"
          />
        </template>
      </v-list>
    </v-navigation-drawer>
  </v-container>
</template>
