<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await login(username.value, password.value)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center p-4 bg-gradient-to-b from-canvas to-topbar">
    <form
      class="surface-card w-full max-w-sm p-8 flex flex-col gap-3 shadow-2xl shadow-black/40"
      @submit.prevent="onSubmit"
    >
      <h1 class="text-3xl font-bold tracking-tight m-0 flex items-center gap-2">
        <FontAwesomeIcon :icon="['fas', 'heart-pulse']" class="text-accent" />
        <span>Pulse</span>
      </h1>
      <p class="m-0 mb-3 text-ink-muted">Sign in to your account</p>

      <label class="form-label">
        Username
        <input v-model="username" required autocomplete="username" class="form-input" />
      </label>

      <label class="form-label">
        Password
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="form-input"
        />
      </label>

      <p v-if="error" class="text-danger text-sm m-0">{{ error }}</p>

      <button :disabled="loading" type="submit" class="btn-primary">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="text-center text-sm text-ink-muted m-0 mt-2">
        No account?
        <NuxtLink to="/register" class="text-accent hover:underline">Create one</NuxtLink>
      </p>
    </form>
  </div>
</template>
