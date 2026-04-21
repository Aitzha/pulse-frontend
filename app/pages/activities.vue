<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Activity, CreateActivityPayload } from '~/composables/useActivities'
import {
  addDays,
  formatDateLong,
  kzDateString,
  timeFromMinutes,
  weekRange,
} from '~/composables/useActivities'

definePageMeta({ middleware: ['auth'] })

const { user, logout } = useAuth()
const {
  loading,
  byDate,
  inWeek,
  categories,
  setCategoryColor,
  loadRange,
  create,
  update,
  remove,
} = useActivities()

const selectedDate = ref<string>(kzDateString())

const weekDays = computed(() => weekRange(selectedDate.value))
const dayActivities = computed(() => byDate(selectedDate.value))
const weekActivities = computed(() => inWeek(weekDays.value))

const modalOpen = ref(false)
const editing = ref<Activity | null>(null)
const prefillStart = ref<string | null>(null)
const errorMessage = ref('')

const currentWeekKey = computed(() => `${weekDays.value[0]}_${weekDays.value[6]}`)

async function fetchCurrentWeek() {
  errorMessage.value = ''
  try {
    await loadRange(weekDays.value[0]!, weekDays.value[6]!)
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to load activities'
  }
}

// Refetch whenever the week boundaries change.
watch(
  currentWeekKey,
  () => {
    if (import.meta.client) fetchCurrentWeek()
  },
  { immediate: true },
)

function openNew(minutes?: number) {
  editing.value = null
  prefillStart.value = typeof minutes === 'number' ? timeFromMinutes(minutes) : null
  modalOpen.value = true
}

function openEdit(a: Activity) {
  editing.value = a
  prefillStart.value = null
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editing.value = null
  prefillStart.value = null
}

async function onSave(ev: { id?: string; payload: CreateActivityPayload; color: string }) {
  errorMessage.value = ''
  setCategoryColor(ev.payload.category, ev.color)
  try {
    if (ev.id) await update(ev.id, ev.payload)
    else await create(ev.payload)
    closeModal()
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to save activity'
  }
}

async function onRemove(id: string) {
  errorMessage.value = ''
  try {
    await remove(id)
    closeModal()
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to delete activity'
  }
}

function goPrev() {
  selectedDate.value = addDays(selectedDate.value, -1)
}
function goNext() {
  selectedDate.value = addDays(selectedDate.value, 1)
}
function goToday() {
  selectedDate.value = kzDateString()
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header
      class="flex justify-between items-center px-6 py-4 border-b border-edge bg-topbar/80 backdrop-blur sticky top-0 z-20"
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

    <main class="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight m-0 flex items-center gap-3">
            <FontAwesomeIcon :icon="['fas', 'clock']" class="text-accent" />
            <span>Activities</span>
          </h1>
          <p class="text-ink-muted text-sm m-0 mt-1">
            Track how you spend your time. Times are in Kazakhstan (Asia/Almaty).
          </p>
        </div>
      </div>

      <p v-if="errorMessage" class="text-danger text-sm m-0">{{ errorMessage }}</p>

      <section class="surface-card p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2">
            <button type="button" class="btn-ghost" @click="goPrev" aria-label="Previous day">
              <FontAwesomeIcon :icon="['fas', 'chevron-left']" />
            </button>
            <input
              v-model="selectedDate"
              type="date"
              class="form-input !py-1.5 !w-auto"
            />
            <button type="button" class="btn-ghost" @click="goNext" aria-label="Next day">
              <FontAwesomeIcon :icon="['fas', 'chevron-right']" />
            </button>
            <button
              type="button"
              class="btn-ghost"
              :class="selectedDate === kzDateString() ? 'border-accent text-accent' : ''"
              @click="goToday"
            >
              Today
            </button>
            <span v-if="loading" class="text-ink-muted text-xs ml-2">Loading…</span>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-ink-muted text-sm hidden sm:inline">
              {{ formatDateLong(selectedDate) }}
            </span>
            <button type="button" class="btn-primary !mt-0 px-4 flex items-center gap-2" @click="openNew()">
              <FontAwesomeIcon :icon="['fas', 'plus']" />
              <span>Add activity</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          <div class="max-h-[640px] overflow-y-auto pr-1">
            <TimeGridDay
              :date="selectedDate"
              :activities="dayActivities"
              :pixels-per-minute="1"
              :show-description="true"
              @activity-click="openEdit"
              @empty-click="openNew"
            />
          </div>
          <aside class="lg:border-l lg:border-edge lg:pl-5">
            <h2 class="text-sm font-semibold text-ink-muted uppercase tracking-wide m-0 mb-3">
              Day summary
            </h2>
            <ActivityPieChart :activities="dayActivities" />
          </aside>
        </div>
      </section>

      <section class="surface-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold m-0">This week</h2>
          <span class="text-ink-muted text-sm">
            {{ formatDateLong(weekDays[0]!) }} – {{ formatDateLong(weekDays[6]!) }}
          </span>
        </div>
        <div class="max-h-[520px] overflow-y-auto">
          <TimeGridWeek
            :days="weekDays"
            :activities="weekActivities"
            :pixels-per-minute="0.5"
            @activity-click="openEdit"
          />
        </div>
      </section>
    </main>

    <ActivityModal
      :open="modalOpen"
      :activity="editing"
      :default-date="selectedDate"
      :default-start="prefillStart"
      :existing-categories="categories()"
      @close="closeModal"
      @save="onSave"
      @remove="onRemove"
    />
  </div>
</template>
