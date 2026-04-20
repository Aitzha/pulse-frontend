export default defineNuxtRouteMiddleware((to) => {
  const token = useAuthToken()
  if (!token.value) {
    return navigateTo('/login')
  }
})
