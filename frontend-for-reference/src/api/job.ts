import api from '@/api'

export function getJobList(params?: {
  page?: number
  size?: number
  keyword?: string
  category?: string
}) {
  return api.get('/jobs', { params })
}

export function getJobDetail(id: string) {
  return api.get(`/jobs/${id}`)
}

export function getCategories() {
  return api.get('/jobs/categories')
}

export function getPromotionGraph() {
  return api.get('/jobs/graph/promotion')
}

export function getTransferGraph() {
  return api.get('/jobs/graph/transfer')
}
