import api from '@/api'

// ── SCHOOL 角色 API ──

export function getMySchoolInfo() {
  return api.get('/school/info')
}

export interface StudentFilterParams {
  keyword?: string
  minScore?: number
  maxScore?: number
  minCompleteness?: number
  maxCompleteness?: number
  majors?: string[]
  hasProfile?: boolean
  hasMatch?: boolean
  activityStatus?: string
  sortBy?: string
  sortDir?: string
  page?: number
  size?: number
}

export function getSchoolStudents(params?: StudentFilterParams) {
  return api.get('/school/students', { params })
}

export function getSchoolStudentMajors() {
  return api.get('/school/students/majors')
}

export function exportSchoolStudents(params?: Omit<StudentFilterParams, 'page' | 'size' | 'sortBy' | 'sortDir'>) {
  return api.get('/school/students/export', { params, responseType: 'blob' })
}

export function getSchoolStatistics() {
  return api.get('/school/statistics')
}

export function getSchoolAlerts() {
  return api.get('/school/alerts')
}

export function compareStudents(userIds: string[]) {
  return api.post('/school/students/compare', userIds)
}

export function getSchoolStudentDetail(userId: string) {
  return api.get(`/school/students/${userId}`)
}

export function batchImportStudents(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/school/students/batch-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function downloadBatchImportTemplate() {
  return api.get('/school/students/batch-import/template', { responseType: 'blob' })
}

// ── STUDENT 绑定学校 API ──

export function bindSchool(inviteCode: string) {
  return api.post('/student/school/bind', { inviteCode })
}

export function unbindSchool() {
  return api.delete('/student/school/bind')
}

export function getMyBoundSchool() {
  return api.get('/student/school')
}
