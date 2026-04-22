<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  modelValue: string // "HH:MM", or "" for empty
  allowEndOfDay?: boolean // extends hour options up to 24
  step?: number // minute step, default 5
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allowEndOfDay: false,
  step: 5,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

const hour = computed(() => props.modelValue.split(':')[0] ?? '')
const minute = computed(() => props.modelValue.split(':')[1] ?? '')

const hourOptions = computed(() => {
  const max = props.allowEndOfDay ? 24 : 23
  return Array.from({ length: max + 1 }, (_, i) => pad(i))
})

// Minute options include the step grid plus the current value (in case the
// backend returns a minute that doesn't land on a step boundary).
const minuteOptions = computed(() => {
  const set = new Set<string>()
  for (let m = 0; m < 60; m += props.step) set.add(pad(m))
  if (minute.value) set.add(minute.value)
  return Array.from(set).sort()
})

function setHour(h: string) {
  const mm = h === '24' ? '00' : (minute.value || '00')
  emit('update:modelValue', `${h}:${mm}`)
}

function setMinute(m: string) {
  const h = hour.value || '00'
  emit('update:modelValue', `${h}:${m}`)
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <select
      class="form-input !py-2 !px-2 !w-auto tabular-nums"
      :value="hour"
      :disabled="disabled"
      @change="setHour(($event.target as HTMLSelectElement).value)"
    >
      <option disabled value="">--</option>
      <option v-for="h in hourOptions" :key="h" :value="h">{{ h }}</option>
    </select>
    <span class="text-ink-muted select-none">:</span>
    <select
      class="form-input !py-2 !px-2 !w-auto tabular-nums"
      :value="minute"
      :disabled="disabled || hour === '24'"
      @change="setMinute(($event.target as HTMLSelectElement).value)"
    >
      <option disabled value="">--</option>
      <option v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</option>
    </select>
    <button
      v-if="!disabled && modelValue"
      type="button"
      class="text-ink-muted hover:text-ink text-xs px-1"
      :aria-label="'Clear time'"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>
