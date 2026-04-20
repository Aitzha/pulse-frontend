<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { user, logout } = useAuth()
</script>

<template>
  <div class="home">
    <header class="topbar">
      <div class="brand">Pulse</div>
      <div class="right">
        <span v-if="user" class="who">{{ user.username }}</span>
        <button class="logout" @click="logout">Logout</button>
      </div>
    </header>

    <main class="content">
      <h1>Welcome back<span v-if="user">, {{ user.username }}</span> 👋</h1>
      <p class="lede">Track your finances and activities, all in one place.</p>

      <section class="grid">
        <div class="tile">
          <h3>Finances</h3>
          <p>Log income and expenses. Coming soon.</p>
        </div>
        <div class="tile">
          <h3>Activities</h3>
          <p>Track habits and daily activities. Coming soon.</p>
        </div>
        <div class="tile">
          <h3>Insights</h3>
          <p>See trends across your data. Coming soon.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home { min-height: 100vh; display: flex; flex-direction: column; }
.topbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #242833; background: #131620; }
.brand { font-weight: 700; font-size: 1.2rem; }
.right { display: flex; gap: 1rem; align-items: center; }
.who { color: #9aa3b2; font-size: .9rem; }
.logout { background: transparent; border: 1px solid #2a2f3d; color: #e6e8eb; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; }
.logout:hover { border-color: #6ea8ff; }
.content { flex: 1; max-width: 1000px; width: 100%; margin: 0 auto; padding: 2rem 1.5rem; }
h1 { margin: 0 0 .5rem; }
.lede { color: #9aa3b2; margin: 0 0 2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.tile { background: #171a21; border: 1px solid #242833; border-radius: 12px; padding: 1.25rem; }
.tile h3 { margin: 0 0 .5rem; }
.tile p { margin: 0; color: #9aa3b2; font-size: .9rem; }
</style>
