<script setup lang="ts">
import { useBreadcrumbs } from '@/composables/useBreadcrumbs'

const props = defineProps<{
  title: string
  description?: string
  icon?: string
  breadcrumbTitle?: string
  hideBreadcrumb?: boolean
}>()

const { breadcrumbs } = useBreadcrumbs(() => props.breadcrumbTitle)
</script>

<template>
  <div class="page-header mb-6">
    <v-breadcrumbs
      v-if="!hideBreadcrumb && breadcrumbs.length > 1"
      :items="breadcrumbs"
      density="compact"
      class="px-0 pt-0 pb-1"
    />
    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center ga-2">
        <v-icon v-if="icon" :icon="icon" color="primary" size="26" />
        <h1 class="text-h5 font-weight-bold">{{ title }}</h1>
      </div>
      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>
    <p v-if="description" class="text-body-2 text-medium-emphasis mt-1 ml-1">{{ description }}</p>
    <slot name="description" />
    <v-divider class="mt-3" />
  </div>
</template>
