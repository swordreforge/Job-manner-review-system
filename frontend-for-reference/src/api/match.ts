import api from '@/api'

export function startMatch(data: { jobProfileId?: string; jobProfileIds?: string[] }) {
  return api.post('/match', data)
}

export function getMatchResults(params?: { page?: number; size?: number }) {
  return api.get('/match/results', { params })
}

export function getMatchDetail(id: string) {
  return api.get(`/match/results/${id}`)
}
