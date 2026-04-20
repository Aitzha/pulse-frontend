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
  <div class="auth-wrap">
    <form class="card" @submit.prevent="onSubmit">
      <h1>Pulse</h1>
      <p class="sub">Create your account</p>
      <label>Username<input v-model="username" required autocomplete="username" /></label>
      <label>Password<input v-model="password" type="password" required minlength="6" autocomplete="new-password" /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="loading" type="submit">{{ loading ? 'Creating…' : 'Create account' }}</button>
      <p class="alt">Already registered? <NuxtLink to="/login">Sign in</NuxtLink></p>
    </form>
  </div>
</template>

<style scoped>
.auth-wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; }
.card { width: 100%; max-width: 380px; background: #171a21; border: 1px solid #242833; border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; gap: .75rem; }
h1 { margin: 0; font-size: 1.75rem; }
.sub { margin: 0 0 1rem; color: #9aa3b2; }
label { display: flex; flex-direction: column; gap: .35rem; font-size: .85rem; color: #b8c0cc; }
input { padding: .65rem .75rem; border-radius: 8px; border: 1px solid #2a2f3d; background: #0f1218; color: #e6e8eb; font-size: 1rem; }
input:focus { outline: none; border-color: #6ea8ff; }
button { margin-top: .5rem; padding: .75rem; border-radius: 8px; border: none; background: #6ea8ff; color: #0b0d12; font-weight: 600; cursor: pointer; }
button:disabled { opacity: .6; cursor: not-allowed; }
.error { color: #ff6b6b; margin: 0; font-size: .85rem; }
.alt { text-align: center; font-size: .85rem; color: #9aa3b2; margin: .5rem 0 0; }
</style>
