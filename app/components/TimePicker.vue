<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  modelValue: string
  allowEndOfDay?: boolean
  step?: number
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

// Disable minute controls when at 24:00 (end-of-day sentinel).
const minuteLocked = computed(
  () => props.allowEndOfDay && hourDisplay.value === '24',
)

function bumpHour(delta: number) {
  if (props.disabled) return
  const { h, m } = current()
  const range = props.allowEndOfDay ? 25 : 24 // 0..(range-1)
  const nh = ((h + delta) % range + range) % range
  const nm = nh === 24 ? 0 : m
  emit('update:modelValue', `${pad(nh)}:${pad(nm)}`)
}

function bumpMinute(delta: number) {
  if (props.disabled || minuteLocked.value) return
  const { h, m } = current()
  let total = h * 60 + m + delta
  const mod = props.allowEndOfDay ? 1441 : 1440
  total = ((total % mod) + mod) % mod
  const nh = Math.floor(total / 60)
  const nm = total % 60
  emit('update:modelValue', `${pad(nh)}:${pad(nm)}`)
}

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
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-40 disabled:hover:text-ink-muted"
        :disabled="disabled"
        aria-label="Increment hour"
        @click="bumpHour(1)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-up']" />
      </button>
      <span class="text-lg tabular-nums leading-none py-1 min-w-[1.75em] text-center text-ink">
        {{ hourDisplay }}
      </span>
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-40 disabled:hover:text-ink-muted"
        :disabled="disabled"
        aria-label="Decrement hour"
        @click="bumpHour(-1)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-down']" />
      </button>
    </div>

    <span class="text-ink-muted text-lg leading-none select-none">:</span>

    <div class="flex flex-col items-stretch select-none">
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-40 disabled:hover:text-ink-muted"
        :disabled="disabled || minuteLocked"
        :aria-label="`Increment minute by ${step}`"
        @click="bumpMinute(step)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-up']" />
      </button>
      <span class="text-lg tabular-nums leading-none py-1 min-w-[1.75em] text-center text-ink">
        {{ minuteDisplay }}
      </span>
      <button
        type="button"
        class="text-ink-muted hover:text-accent text-[10px] leading-none py-0.5 rounded transition-colors disabled:opacity-40 disabled:hover:text-ink-muted"
        :disabled="disabled || minuteLocked"
        :aria-label="`Decrement minute by ${step}`"
        @click="bumpMinute(-step)"
      >
        <FontAwesomeIcon :icon="['fas', 'chevron-down']" />
      </button>
    </div>

    <button
      v-if="!disabled && modelValue"
      type="button"
      class="text-ink-muted hover:text-ink text-sm ml-1"
      aria-label="Clear time"
      @click="clear"
    >
      &times;
    </button>
  </div>
</template>
