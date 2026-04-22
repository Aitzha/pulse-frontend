<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Activity } from '~/composables/useActivities'
import {
  activityDate,
  activityStartLabel,
  activityStartMinutesOn,
  activityVisibleMinutesOn,
  colorForActivity,
  kzDateString,
  nowKzMinutes,
  parseDate,
} from '~/composables/useActivities'

type Props = {
  days: string[]
  activities: Activity[]
  pixelsPerMinute?: number
}

const props = withDefaults(defineProps<Props>(), { pixelsPerMinute: 0.5 })

const emit = defineEmits<{
  activityClick: [activity: Activity]
}>()

const totalHeight = computed(() => 24 * 60 * props.pixelsPerMinute)
const hours = computed(() => Array.from({ length: 24 }, (_, i) => i))

const now = ref(new Date())
let tick: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  tick = setInterval(() => (now.value = new Date()), 60_000)
})
onBeforeUnmount(() => {
  if (tick) clearInterval(tick)
})

const today = computed(() => kzDateString(now.value))
const currentMinutes = computed(() => nowKzMinutes(now.value))

const dayHeaders = computed(() =>
  props.days.map(d => {
    const date = parseDate(d)
    return {
      dateStr: d,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      isToday: d === today.value,
    }
  }),
)

type PlacedActivity = {
  activity: Activity
  top: number
  height: number
  color: string
  startLabel: string
}

function placedForDay(dateStr: string): PlacedActivity[] {
  return props.activities
    .filter(a => activityDate(a) === dateStr)
    .map(a => ({
      activity: a,
      top: activityStartMinutesOn(a, dateStr) * props.pixelsPerMinute,
      height: Math.max(8, activityVisibleMinutesOn(a, dateStr) * props.pixelsPerMinute),
      color: colorForActivity(a),
      startLabel: activityStartLabel(a),
    }))
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex border-b border-edge">
      <div class="w-14 flex-shrink-0" />
      <div
        v-for="d in dayHeaders"
        :key="d.dateStr"
        class="flex-1 text-center py-2 text-xs"
        :class="d.isToday ? 'text-accent font-semibold' : 'text-ink-muted'"
      >
        <div class="uppercase tracking-wide">{{ d.weekday }}</div>
        <div class="text-base text-ink mt-0.5">{{ d.dayNum }}</div>
      </div>
    </div>

    <div class="flex">
      <div class="relative w-14 flex-shrink-0 text-right pr-2 text-[10px] text-ink-muted select-none">
        <div
          v-for="h in hours"
          :key="h"
          class="absolute right-2 -translate-y-1/2"
          :style="{ top: `${h * 60 * pixelsPerMinute}px` }"
        >
          {{ formatHour(h) }}
        </div>
        <div :style="{ height: `${totalHeight}px` }" />
      </div>

      <div class="flex flex-1 bg-well border border-edge rounded-lg overflow-hidden">
        <div
          v-for="(d, idx) in days"
          :key="d"
          class="relative flex-1"
          :class="idx > 0 ? 'border-l border-edge' : ''"
          :style="{ height: `${totalHeight}px` }"
        >
          <div
            v-for="h in hours"
            :key="`line-${d}-${h}`"
            class="absolute left-0 right-0 border-t border-edge/60 pointer-events-none"
            :style="{ top: `${h * 60 * pixelsPerMinute}px` }"
          />
          <div
            v-if="d === today"
            class="absolute left-0 right-0 h-0.5 bg-accent pointer-events-none z-20"
            :style="{ top: `${currentMinutes * pixelsPerMinute}px` }"
          >
            <span class="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-accent" />
          </div>
          <button
            v-for="p in placedForDay(d)"
            :key="p.activity.id"
            type="button"
            class="absolute left-0.5 right-0.5 rounded text-ink-inverse px-1 text-[10px] text-left overflow-hidden shadow-sm hover:scale-[1.02] hover:z-10 transition-transform focus:outline-none focus:ring-1 focus:ring-white/60"
            :style="{
              top: `${p.top}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
            }"
            @click="emit('activityClick', p.activity)"
          >
            <div class="font-semibold leading-tight truncate">{{ p.activity.title }}</div>
            <div v-if="p.height > 22" class="opacity-80 leading-tight truncate">
              {{ p.startLabel }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
