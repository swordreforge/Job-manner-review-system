import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    description?: string
    color?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
    requiresSchool?: boolean
  }
}
