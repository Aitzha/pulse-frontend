import type { FetchOptions } from 'ofetch'

type AuthUser = { id: number | string; username: string }
type AuthResponse = { accessToken?: string; access_token?: string; token?: string; user?: AuthUser } & Record<string, any>

export const useAuthToken = () => useCookie<string | null>('pulse_token', { default: () => null, sameSite: 'lax' })
export const useAuthUser = () =>
  useCookie<AuthUser | null>('pulse_user', {
    default: () => null,
    sameSite: 'lax',
    path: '/',
  })

export function useAuth() {
  const config = useRuntimeConfig()
  const token = useAuthToken()
  const user = useAuthUser()

  const apiBase = config.public.apiBase as string

  async function request<T>(path: string, opts: FetchOptions<'json'> = {}): Promise<T> {
    return await $fetch<T>(path, {
      baseURL: apiBase,
      ...opts,
      headers: {
        ...(opts.headers || {}),
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
    })
  }

  function handleAuthResponse(res: AuthResponse) {
    const t = res.accessToken || res.access_token || res.token
    if (t) token.value = t
    if (res.user) user.value = res.user
    else if (res.username) user.value = { id: res.id ?? '', username: res.username }
  }

  async function login(username: string, password: string) {
    const res = await request<AuthResponse>('/api/auth/login', { method: 'POST', body: { username, password } })
    handleAuthResponse(res)
    return res
  }

  async function register(username: string, password: string) {
    const res = await request<AuthResponse>('/api/auth/register', { method: 'POST', body: { username, password } })
    handleAuthResponse(res)
    return res
  }

  function logout() {
    token.value = null
    user.value = null
    return navigateTo('/login')
  }

  return { token, user, login, register, logout, request }
}
