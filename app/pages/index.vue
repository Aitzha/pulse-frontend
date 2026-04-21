<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { user, logout } = useAuth()

const sections = [
  {
    title: 'Finances',
    description: 'Log income and expenses. Coming soon.',
    icon: 'money-bills',
    to: null as string | null,
  },
  {
    title: 'Activities',
    description: 'Track habits and daily activities.',
    icon: 'clock',
    to: '/activities',
  },
  {
    title: 'Goals',
    description: 'See trends across your data. Coming soon.',
    icon: 'chart-pie',
    to: null,
  },
]
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header
      class="flex justify-between items-center px-6 py-4 border-b border-edge bg-topbar/80 backdrop-blur sticky top-0 z-10"
    >
      <NuxtLink
        to="/"
        class="font-bold text-2xl tracking-tight flex items-center gap-2.5 text-ink hover:text-accent transition-colors"
      >
        <FontAwesomeIcon :icon="['fas', 'heart-pulse']" class="text-accent" />
        <span>Pulse</span>
      </NuxtLink>
      <div class="flex gap-4 items-center">
        <span v-if="user" class="text-ink-muted text-sm">{{ user.username }}</span>
        <button class="btn-ghost" @click="logout">Logout</button>
      </div>
    </header>

    <main class="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
        <span>Welcome back<span v-if="user">, {{ user.username }}</span></span>
        <FontAwesomeIcon :icon="['fas', 'hand']" class="text-accent" />
      </h1>
      <p class="text-ink-muted mb-10">
        Track your finances and activities, all in one place.
      </p>

      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <template v-for="section in sections" :key="section.title">
          <NuxtLink
            v-if="section.to"
            :to="section.to"
            class="surface-card p-6 transition-colors hover:border-edge-strong hover:bg-card/80 block no-underline !text-ink"
          >
            <div class="text-2xl mb-3 text-accent" aria-hidden="true">
              <FontAwesomeIcon :icon="['fas', section.icon]" />
            </div>
            <h3 class="font-semibold text-lg m-0 mb-1">{{ section.title }}</h3>
            <p class="text-ink-muted text-sm m-0">{{ section.description }}</p>
          </NuxtLink>
          <article
            v-else
            class="surface-card p-6 transition-colors hover:border-edge-strong hover:bg-card/80"
          >
            <div class="text-2xl mb-3 text-accent" aria-hidden="true">
              <FontAwesomeIcon :icon="['fas', section.icon]" />
            </div>
            <h3 class="font-semibold text-lg m-0 mb-1">{{ section.title }}</h3>
            <p class="text-ink-muted text-sm m-0">{{ section.description }}</p>
          </article>
        </template>
      </section>
    </main>
  </div>
</template>
