<template>
  <v-alert
    type="error"
    variant="tonal"
    class="my-4"
    :title="title"
  >
    <p class="mb-3">{{ error }}</p>
    <v-btn size="small" color="error" variant="outlined" @click="emit('retry')">
      <v-icon start icon="mdi-refresh" />重试
    </v-btn>
  </v-alert>
</template>

<script setup lang="ts">
defineProps<{
  error: string
  title?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>
