import api from '@/api'

export function generateReport(matchResultId: string) {
  return api.post('/reports/generate', { matchResultId })
}

export function getReports(params?: { page?: number; size?: number }) {
  return api.get('/reports', { params })
}

export function getReport(id: string) {
  return api.get(`/reports/${id}`)
}

export function updateReport(id: string, content: string) {
  return api.put(`/reports/${id}`, { content })
}

export function polishReport(id: string, section?: number) {
  return api.post(`/reports/${id}/polish`, { section })
}

export function checkCompleteness(id: string) {
  return api.post(`/reports/${id}/check`)
}

export function deleteReport(id: string) {
  return api.delete(`/reports/${id}`)
}

export function getVersionHistory(id: string) {
  return api.get(`/reports/${id}/versions`)
}

export function getVersion(id: string, version: number) {
  return api.get(`/reports/${id}/versions/${version}`)
}

export function revertToVersion(id: string, version: number) {
  return api.post(`/reports/${id}/revert/${version}`)
}
