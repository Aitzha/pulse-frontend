<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Activity, CreateActivityPayload } from '~/composables/useActivities'
import {
  ACTIVITY_COLORS,
  activityDate,
  isoFromKz,
  kzTimeFromISO,
  minutesFromTime,
} from '~/composables/useActivities'

type Props = {
  open: boolean
  activity: Activity | null
  defaultDate: string
  defaultStart?: string | null
  existingCategories?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultStart: null,
  existingCategories: () => [],
})

const emit = defineEmits<{
  close: []
  save: [value: { id?: string; payload: CreateActivityPayload; color: string }]
  remove: [id: string]
}>()

const { colorForCategory } = useActivities()

const title = ref('')
const category = ref('')
const color = ref<string>(ACTIVITY_COLORS[0]!)
const date = ref('')
const startTime = ref('09:00')
const endTime = ref('')
const description = ref('')
const error = ref('')

const isEdit = computed(() => !!props.activity)

watch(
  () => [props.open, props.activity, props.defaultDate, props.defaultStart],
  () => {
    if (!props.open) return
    error.value = ''
    if (props.activity) {
      const a = props.activity
      title.value = a.title
      category.value = a.category
      color.value = colorForCategory(a.category)
      date.value = activityDate(a)
      startTime.value = kzTimeFromISO(a.startTime)
      endTime.value = a.endTime ? kzTimeFromISO(a.endTime) : ''
      description.value = a.description ?? ''
    } else {
      title.value = ''
      category.value = ''
      color.value = ACTIVITY_COLORS[0]!
      date.value = props.defaultDate
      startTime.value = props.defaultStart || '09:00'
      endTime.value = ''
      description.value = ''
    }
  },
  { immediate: true },
)

// Auto-adopt the existing color when the user types a known category.
watch(category, (next) => {
  if (!next) return
  const existing = colorForCategory(next)
  if (existing) color.value = existing
})

function submit() {
  if (!title.value.trim()) {
    error.value = 'Title is required'
    return
  }
  if (!category.value.trim()) {
    error.value = 'Category is required'
    return
  }
  if (!startTime.value) {
    error.value = 'Start time is required'
    return
  }
  if (endTime.value && minutesFromTime(endTime.value) <= minutesFromTime(startTime.value)) {
    error.value = 'End time must be after start time'
    return
  }
  const payload: CreateActivityPayload = {
    title: title.value.trim(),
    category: category.value.trim(),
    startTime: isoFromKz(date.value, startTime.value),
    description: description.value.trim() || undefined,
  }
  if (endTime.value) {
    payload.endTime = isoFromKz(date.value, endTime.value)
  }
  emit('save', { id: props.activity?.id, payload, color: color.value })
}

function onDelete() {
  if (props.activity) emit('remove', props.activity.id)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="emit('close')"
  >
    <div class="surface-card w-full max-w-md p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold m-0">
          {{ isEdit ? 'Edit activity' : 'New activity' }}
        </h2>
        <button
          type="button"
          class="text-ink-muted hover:text-ink transition-colors text-xl leading-none"
          aria-label="Close"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <label class="form-label">
          Title
          <input v-model="title" class="form-input" placeholder="e.g. Standup meeting" />
        </label>

        <label class="form-label">
          Category
          <input
            v-model="category"
            class="form-input"
            list="activity-category-options"
            placeholder="e.g. Work, Exercise, Sleep"
          />
          <datalist id="activity-category-options">
            <option v-for="c in existingCategories" :key="c" :value="c" />
          </datalist>
        </label>

        <div>
          <span class="form-label mb-1.5">
            Color
            <span v-if="category" class="text-ink-muted text-xs font-normal">
              (applies to all "{{ category }}" activities)
            </span>
          </span>
          <div class="flex flex-wrap gap-2 mt-1.5">
            <button
              v-for="c in ACTIVITY_COLORS"
              :key="c"
              type="button"
              class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              :style="{
                backgroundColor: c,
                borderColor: color === c ? '#ffffff' : 'transparent',
              }"
              :aria-label="`Color ${c}`"
              @click="color = c"
            />
          </div>
        </div>

        <label class="form-label">
          Date
          <input v-model="date" type="date" class="form-input" />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="form-label">
            Start time
            <input v-model="startTime" type="time" class="form-input" required />
          </label>
          <label class="form-label">
            End time <span class="text-ink-muted">(optional)</span>
            <input v-model="endTime" type="time" class="form-input" />
          </label>
        </div>

        <label class="form-label">
          Description <span class="text-ink-muted">(optional)</span>
          <textarea
            v-model="description"
            class="form-input min-h-[72px] resize-y"
            placeholder="What was this about?"
          />
        </label>

        <p v-if="error" class="text-danger text-sm m-0">{{ error }}</p>

        <div class="flex items-center gap-2 mt-2">
          <button v-if="isEdit" type="button" class="btn-ghost !border-danger !text-danger" @click="onDelete">
            Delete
          </button>
          <div class="flex-1" />
          <button type="button" class="btn-ghost" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn-primary !mt-0 px-4">
            {{ isEdit ? 'Save' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
