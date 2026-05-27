<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useJobStore } from '@/stores/job'
import { useNavItems } from '@/composables/useNavItems'
import ApiErrorState from '@/components/ApiErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'

const store = useJobStore()
const { findNavItemByPath } = useNavItems()
const pageItem = computed(() => findNavItemByPath('/jobs'))
const fetchError = ref<string | null>(null)

async function loadData() {
  fetchError.value = null
  try {
    await store.fetchCategories()
    await store.resetAndFetch()
  } catch {
    fetchError.value = '加载岗位数据失败，请检查网络后重试'
  }
}

onMounted(loadData)

// P9: 手动实现搜索防抖，避免每次击键都触发请求
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => [store.filters.keyword, store.filters.category],
  ([, newCategory], [, oldCategory]) => {
    // 分类切换立即响应；关键词输入防抖 300ms
    const isKeywordChange = newCategory === oldCategory
    if (isKeywordChange) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        store.resetAndFetch().catch(() => {
          fetchError.value = '加载岗位数据失败，请检查网络后重试'
        })
      }, 300)
    } else {
      if (debounceTimer) clearTimeout(debounceTimer)
      store.resetAndFetch().catch(() => {
        fetchError.value = '加载岗位数据失败，请检查网络后重试'
      })
    }
  },
)

type InfiniteScrollStatus = 'ok' | 'empty' | 'error' | 'loading'

async function onLoad({ done }: { side: string; done: (status: InfiniteScrollStatus) => void }) {
  if (!store.hasMore) {
    done('empty')
    return
  }
  try {
    store.filters.page += 1
    await store.fetchJobList(true)
    done(store.hasMore ? 'ok' : 'empty')
  } catch {
    done('error')
  }
}
</script>

<template>
  <v-container>
    <PageHeader
      :title="pageItem?.title ?? '岗位画像'"
      :description="pageItem?.description"
      :icon="pageItem?.icon"
    />

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="store.filters.keyword"
          label="搜索岗位"
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="store.filters.category"
          :items="store.categories"
          label="类别筛选"
          clearable
          hide-details
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn color="primary" block :to="'/jobs/graph'">
          <v-icon start icon="mdi-graph" />图谱
        </v-btn>
      </v-col>
    </v-row>

    <v-skeleton-loader v-if="store.loading && store.jobList.length === 0" type="card@4" class="mb-4" />

    <ApiErrorState
      v-else-if="fetchError && store.jobList.length === 0"
      :error="fetchError"
      title="加载失败"
      @retry="loadData"
    />

    <v-alert v-else-if="!store.loading && store.jobList.length === 0 && !fetchError" type="info" variant="tonal" class="mt-4">
      暂无岗位画像数据
    </v-alert>

    <v-infinite-scroll
      v-else
      :items="store.jobList"
      :onLoad="onLoad"
      empty-text=""
      class="overflow-visible"
    >
      <template #default>
        <v-row>
          <v-col v-for="job in store.jobList" :key="job.id" cols="12" sm="6" md="4" lg="3">
            <v-card :to="`/jobs/${job.id}`" hover height="100%">
              <v-card-title class="text-subtitle-1 font-weight-bold">{{
                job.profileName
              }}</v-card-title>
              <v-card-subtitle>{{ job.category }}</v-card-subtitle>
              <v-card-text>
                <div class="mb-2">
                  <v-chip
                    v-for="skill in (job.requiredSkills || []).slice(0, 3)"
                    :key="skill.skillName"
                    size="small"
                    color="primary"
                    variant="outlined"
                    class="mr-1 mb-1"
                  >
                    {{ skill.skillName }}
                  </v-chip>
                  <v-chip v-if="(job.requiredSkills || []).length > 3" size="small" variant="text">
                    +{{ job.requiredSkills.length - 3 }}
                  </v-chip>
                </div>
                <div class="text-body-2 text-grey">
                  <v-icon size="small" icon="mdi-school" class="mr-1" />{{
                    job.educationRequirement || '不限'
                  }}
                  <span class="mx-2">|</span>
                  <v-icon size="small" icon="mdi-currency-cny" class="mr-1" />
                  {{
                    job.salaryRangeMin
                      ? `${(job.salaryRangeMin / 1000).toFixed(0)}K-${(job.salaryRangeMax / 1000).toFixed(0)}K`
                      : '面议'
                  }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <template #load-more="{ props }">
        <div class="d-flex justify-center py-4">
          <v-btn v-if="fetchError" color="error" variant="text" v-bind="props">
            加载失败，点击重试
          </v-btn>
          <span v-else-if="!store.hasMore" class="text-body-2 text-grey">没有更多岗位了</span>
          <v-progress-circular v-else indeterminate color="primary" size="24" />
        </div>
      </template>
    </v-infinite-scroll>
  </v-container>
</template>
