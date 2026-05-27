import api from '@/api'

export function uploadResume(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/student/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getParseStatus() {
  return api.get('/student/resume/parse-status')
}

export function submitManualProfile(data: Record<string, unknown>) {
  return api.post('/student/profile/manual', data)
}

export function getProfile() {
  return api.get('/student/profile')
}

export function updateProfile(data: Record<string, unknown>) {
  return api.put('/student/profile', data)
}
