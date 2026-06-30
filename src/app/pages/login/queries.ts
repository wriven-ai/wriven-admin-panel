import { useMutation } from '@tanstack/react-query'
import { api, setCsrfToken } from '@/lib/api'
import { useAdminStore } from '@/stores/admin'
import type { AdminMeResponse } from '@/lib/types'

interface LoginDto {
  email: string
  password: string
}

interface LoginResponse {
  admin: AdminMeResponse
  csrfToken: string | null
}

export function useLogin() {
  const setMe = useAdminStore((s) => s.setMe)

  return useMutation({
    mutationFn: (dto: LoginDto) =>
      api.post<LoginResponse>('/admin/auth/login', dto),
    onSuccess: (data) => {
      setCsrfToken(data.csrfToken)
      setMe(data.admin)
    },
  })
}
