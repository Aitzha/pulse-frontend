<script setup lang="ts">
definePageMeta({ layout: false })

const { register } = useAuth()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  loading.value = true
  try {
    await register(username.value, password.value)
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Registration failed'
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
      <p class="m-0 mb-3 text-ink-muted">Create your account</p>

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
          minlength="6"
          autocomplete="new-password"
          class="form-input"
        />
      </label>

      <p v-if="error" class="text-danger text-sm m-0">{{ error }}</p>

      <button :disabled="loading" type="submit" class="btn-primary">
        {{ loading ? 'Creating…' : 'Create account' }}
      </button>

      <p class="text-center text-sm text-ink-muted m-0 mt-2">
        Already registered?
        <NuxtLink to="/login" class="text-accent hover:underline">Sign in</NuxtLink>
      </p>
    </form>
  </div>
</template>
