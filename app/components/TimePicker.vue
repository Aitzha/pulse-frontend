<script setup lang="ts">
import { computed } from 'vue'
import { minutesFromTime } from '~/composables/useActivities'

type Props = {
  modelValue: string
  allowEndOfDay?: boolean
  step?: number
  disabled?: boolean
  minTime?: string // "HH:MM" — decrements below this are blocked
}

const props = withDefaults(defineProps<Props>(), {
  allowEndOfDay: false,
  step: 5,
  disabled: false,
  minTime: '',
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function current(): { h: number; m: number } {
  if (!props.modelValue) return { h: 0, m: 0 }
  const [h, m] = props.modelValue.split(':').map(Number)
  return { h: h ?? 0, m: m ?? 0 }
}

const hourDisplay = computed(() =>
  props.modelValue ? props.modelValue.split(':')[0] ?? '--' : '--',
)
const minuteDisplay = computed(() =>
  props.modelValue ? props.modelValue.split(':')[1] ?? '--' : '--',
)

const minuteLocked = computed(
  () => props.allowEndOfDay && hourDisplay.value === '24',
)

const minMinutes = computed(() => (props.minTime ? minutesFromTime(props.minTime) : -1))

function emitValue(nh: number, nm: number) {
  const candidate = nh * 60 + nm
  if (candidate < minMinutes.value) return
  emit('update:modelValue', `${pad(nh)}:${pad(nm)}`)
}

function bumpHour(delta: number) {
  if (props.disabled) return
  const { h, m } = current()
  const range = props.allowEndOfDay ? 25 : 24
  const nh = ((h + delta) % range + range) % range
  const nm = nh === 24 ? 0 : m
  emitValue(nh, nm)
}

// Independent minute wrap — does NOT spill into hour.
function bumpMinute(delta: number) {
  if (props.disabled || minuteLocked.value) return
  const { h, m } = current()
  const nm = ((m + delta) % 60 + 60) % 60
  emitValue(h, nm)
}

// Disable the decrement arrows when already at or below the minimum.
const atMinimum = computed(() => {
  if (minMinutes.value < 0) return false
  const { h, m } = current()
  return h * 60 + m <= minMinutes.value
})

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-edge-strong bg-well focus-within:border-accent transition-colors"
    :class="disabled ? 'opacity-60' : ''"
  >
    <FontAwesomeIcon :icon="['fas', 'clock']" class="text-ink-muted text-sm" />

    <div class="flex flex-col items-stretch select-none">
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-30 disabled:hover:text-ink-muted"
        :disabled="disabled || atMinimum"
        aria-label="Earlier hour"
        @click="bumpHour(-1)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-down']" />
      </button>
      <span class="text-lg tabular-nums leading-none py-1 min-w-[1.75em] text-center text-ink">
        {{ hourDisplay }}
      </span>
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-30 disabled:hover:text-ink-muted"
        :disabled="disabled"
        aria-label="Later hour"
        @click="bumpHour(1)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-up']" />
      </button>
    </div>

    <span class="text-ink-muted text-lg leading-none select-none">:</span>

    <div class="flex flex-col items-stretch select-none">
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-30 disabled:hover:text-ink-muted"
        :disabled="disabled || minuteLocked || atMinimum"
        :aria-label="`Earlier minute by ${step}`"
        @click="bumpMinute(-step)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-down']" />
      </button>
      <span class="text-lg tabular-nums leading-none py-1 min-w-[1.75em] text-center text-ink">
        {{ minuteDisplay }}
      </span>
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-30 disabled:hover:text-ink-muted"
        :disabled="disabled || minuteLocked"
        :aria-label="`Later minute by ${step}`"
        @click="bumpMinute(step)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-up']" />
      </button>
    </div>

    <button
      v-if="!disabled && modelValue"
      type="button"
      class="ml-1 w-6 h-6 flex items-center justify-center rounded-full border border-edge-strong text-ink-muted hover:border-danger hover:text-danger hover:bg-danger/10 text-base leading-none transition-colors"
      aria-label="Clear time"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>
