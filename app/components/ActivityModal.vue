<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Activity, ActivityCategory, CreateActivityPayload } from '~/composables/useActivities'
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_SUBCATEGORIES_BY_CATEGORY,
  activityDate,
  activityModalEndTime,
  addMinutesToTime,
  colorForSubcategory,
  endMinutesForValidation,
  endTimeToIso,
  isoFromKz,
  kzTimeFromISO,
  minutesFromTime,
  nowKzTimeRoundedDown,
} from '~/composables/useActivities'

type Props = {
  open: boolean
  activity: Activity | null
  defaultDate: string
  defaultStart?: string | null
}

const props = withDefaults(defineProps<Props>(), { defaultStart: null })

const emit = defineEmits<{
  close: []
  save: [value: { id?: string; payload: CreateActivityPayload }]
  remove: [id: string]
}>()

const title = ref('')
const category = ref<ActivityCategory>(ACTIVITY_CATEGORIES[0])
const subcategory = ref<string>(ACTIVITY_SUBCATEGORIES_BY_CATEGORY[ACTIVITY_CATEGORIES[0]][0]!)
const date = ref('')
const startTime = ref('09:00')
const endTime = ref('')
const description = ref('')
const error = ref('')

const isEdit = computed(() => !!props.activity)

const subcategoryOptions = computed(() => ACTIVITY_SUBCATEGORIES_BY_CATEGORY[category.value])
const currentColor = computed(() => colorForSubcategory(subcategory.value))

watch(
  () => [props.open, props.activity, props.defaultDate, props.defaultStart],
  () => {
    if (!props.open) return
    error.value = ''
    if (props.activity) {
      const a = props.activity
      title.value = a.title
      const cat = (ACTIVITY_CATEGORIES as readonly string[]).includes(a.category)
        ? (a.category as ActivityCategory)
        : ACTIVITY_CATEGORIES[0]
      category.value = cat
      const subs = ACTIVITY_SUBCATEGORIES_BY_CATEGORY[cat]
      subcategory.value = subs.includes(a.subcategory) ? a.subcategory : subs[0]!
      date.value = activityDate(a)
      startTime.value = kzTimeFromISO(a.startTime)
      endTime.value = activityModalEndTime(a)
      description.value = a.description ?? ''
    } else {
      title.value = ''
      category.value = ACTIVITY_CATEGORIES[0]
      subcategory.value = ACTIVITY_SUBCATEGORIES_BY_CATEGORY[ACTIVITY_CATEGORIES[0]][0]!
      date.value = props.defaultDate
      const start = props.defaultStart || nowKzTimeRoundedDown(5)
      startTime.value = start
      endTime.value = addMinutesToTime(start, 60)
      description.value = ''
    }
  },
  { immediate: true },
)

// Keep subcategory valid when the category changes.
watch(category, (next, prev) => {
  if (next === prev) return
  const subs = ACTIVITY_SUBCATEGORIES_BY_CATEGORY[next]
  if (!subs.includes(subcategory.value)) subcategory.value = subs[0]!
})

const endBeforeStart = computed(() => {
  if (!endTime.value || !startTime.value) return false
  const startM = minutesFromTime(startTime.value)
  const endM = endMinutesForValidation(endTime.value)
  return endM <= startM
})

const canSubmit = computed(
  () => !!title.value.trim() && !!startTime.value && !endBeforeStart.value,
)

function validate(): string | null {
  if (!title.value.trim()) return 'Title is required'
  if (!category.value) return 'Category is required'
  if (!subcategory.value) return 'Subcategory is required'
  if (!startTime.value) return 'Start time is required'
  if (endBeforeStart.value) return 'End time must be after start time'
  return null
}

// Surface the end/start conflict inline as the user adjusts times.
watch([startTime, endTime], () => {
  if (endBeforeStart.value) {
    error.value = 'End time must be after start time'
  } else if (error.value === 'End time must be after start time') {
    error.value = ''
  }
})

function submit() {
  const err = validate()
  if (err) {
    error.value = err
    return
  }
  const payload: CreateActivityPayload = {
    title: title.value.trim(),
    category: category.value,
    subcategory: subcategory.value,
    startTime: isoFromKz(date.value, startTime.value),
    description: description.value.trim() || undefined,
  }
  if (endTime.value) {
    payload.endTime = endTimeToIso(date.value, endTime.value)
  }
  emit('save', { id: props.activity?.id, payload })
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
    <div class="surface-card w-full max-w-lg p-6 shadow-2xl">
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

        <div class="grid grid-cols-2 gap-3">
          <label class="form-label">
            Category
            <select v-model="category" class="form-input">
              <option v-for="c in ACTIVITY_CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="form-label">
            <span class="flex items-center gap-2">
              <span>Subcategory</span>
              <span
                class="w-3 h-3 rounded-full inline-block ring-1 ring-edge"
                :style="{ backgroundColor: currentColor }"
                :aria-label="`Color for ${subcategory}`"
                :title="`Color for ${subcategory}`"
              />
            </span>
            <select v-model="subcategory" class="form-input">
              <option v-for="s in subcategoryOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
        </div>

        <label class="form-label">
          Date
          <input v-model="date" type="date" class="form-input" />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-label">
            <span>Start time</span>
            <TimePicker v-model="startTime" />
          </div>
          <div class="form-label">
            <span>End time <span class="text-ink-muted">(optional)</span></span>
            <TimePicker v-model="endTime" :allow-end-of-day="true" />
          </div>
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
          <button type="submit" class="btn-primary !mt-0 px-4" :disabled="!canSubmit">
            {{ isEdit ? 'Save' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
