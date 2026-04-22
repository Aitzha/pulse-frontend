<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '~/composables/useActivities'
import {
  activityEndLabelOn,
  activityStartLabel,
  activityStartMinutesOn,
  activityVisibleMinutesOn,
  colorForActivity,
} from '~/composables/useActivities'

type Props = {
  date: string
  activities: Activity[]
  pixelsPerMinute?: number
  showDescription?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pixelsPerMinute: 1,
  showDescription: true,
})

const emit = defineEmits<{
  activityClick: [activity: Activity]
  emptyClick: [minutes: number]
}>()

const totalHeight = computed(() => 24 * 60 * props.pixelsPerMinute)
const hours = computed(() => Array.from({ length: 24 }, (_, i) => i))

type PlacedActivity = {
  activity: Activity
  top: number
  height: number
  column: number
  columns: number
  startLabel: string
  endLabel: string
  color: string
}

// Lay out overlapping activities into columns so they don't visually stack.
const placed = computed<PlacedActivity[]>(() => {
  const items = props.activities
    .map(a => {
      const start = activityStartMinutesOn(a, props.date)
      const dur = activityVisibleMinutesOn(a, props.date)
      return {
        activity: a,
        startMinutes: start,
        durationMinutes: dur,
      }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes)

  const result: (PlacedActivity & { startMinutes: number; end: number })[] = []
  let cluster: (PlacedActivity & { startMinutes: number; end: number })[] = []
  let clusterEnd = 0

  const flush = () => {
    if (!cluster.length) return
    const cols = Math.max(...cluster.map(a => a.column)) + 1
    cluster.forEach(a => (a.columns = cols))
    result.push(...cluster)
    cluster = []
  }

  for (const it of items) {
    const end = it.startMinutes + it.durationMinutes
    const placedItem = {
      activity: it.activity,
      top: it.startMinutes * props.pixelsPerMinute,
      height: Math.max(14, it.durationMinutes * props.pixelsPerMinute),
      column: 0,
      columns: 1,
      startLabel: activityStartLabel(it.activity),
      endLabel: activityEndLabelOn(it.activity, props.date),
      color: colorForActivity(it.activity),
      startMinutes: it.startMinutes,
      end,
    }

    if (!cluster.length || it.startMinutes >= clusterEnd) {
      flush()
      cluster.push(placedItem)
      clusterEnd = end
    } else {
      const usedCols = new Set(cluster.filter(c => c.end > it.startMinutes).map(c => c.column))
      let col = 0
      while (usedCols.has(col)) col++
      placedItem.column = col
      cluster.push(placedItem)
      clusterEnd = Math.max(clusterEnd, end)
    }
  }
  flush()
  return result
})

function handleEmptyClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = e.clientY - rect.top
  const minutes = Math.max(0, Math.min(24 * 60 - 1, Math.round(y / props.pixelsPerMinute)))
  emit('emptyClick', minutes)
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`
}
</script>

<template>
  <div class="flex">
    <!-- hour labels -->
    <div class="relative w-14 flex-shrink-0 text-right pr-2 text-xs text-ink-muted select-none">
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

    <!-- grid body -->
    <div
      class="relative flex-1 bg-well border border-edge rounded-lg overflow-hidden cursor-crosshair"
      :style="{ height: `${totalHeight}px` }"
      @click.self="handleEmptyClick"
    >
      <div
        v-for="h in hours"
        :key="`line-${h}`"
        class="absolute left-0 right-0 border-t border-edge/60 pointer-events-none"
        :style="{ top: `${h * 60 * pixelsPerMinute}px` }"
      />
      <div
        v-for="h in hours"
        :key="`half-${h}`"
        class="absolute left-0 right-0 border-t border-dashed border-edge/30 pointer-events-none"
        :style="{ top: `${(h * 60 + 30) * pixelsPerMinute}px` }"
      />

      <button
        v-for="p in placed"
        :key="p.activity.id"
        type="button"
        class="absolute rounded-md text-left px-2 py-1 text-ink-inverse overflow-hidden shadow-sm transition-transform hover:scale-[1.01] hover:z-10 focus:outline-none focus:ring-2 focus:ring-white/60"
        :style="{
          top: `${p.top}px`,
          height: `${p.height}px`,
          left: `calc(${(p.column / p.columns) * 100}% + 2px)`,
          width: `calc(${100 / p.columns}% - 4px)`,
          backgroundColor: p.color,
        }"
        @click="emit('activityClick', p.activity)"
      >
        <div class="font-semibold text-xs leading-tight truncate">
          {{ p.activity.title }}
        </div>
        <div class="text-[10px] opacity-80 leading-tight">
          {{ p.startLabel }}–{{ p.endLabel }}
        </div>
        <div
          v-if="showDescription && p.activity.description && p.height > 44"
          class="text-[11px] mt-0.5 opacity-90 leading-snug line-clamp-3"
        >
          {{ p.activity.description }}
        </div>
      </button>
    </div>
  </div>
</template>
