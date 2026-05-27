import api from '@/api'

export function updateProfile(data: {
  username?: string
  oldPassword?: string
  newPassword?: string
}) {
  return api.put('/user/profile', data)
}
