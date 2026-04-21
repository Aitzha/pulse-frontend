<script setup lang="ts">
import { computed } from 'vue'
import type { Activity } from '~/composables/useActivities'
import { activityDurationMinutes } from '~/composables/useActivities'

type Props = {
  activities: Activity[]
  size?: number
}

const props = withDefaults(defineProps<Props>(), { size: 180 })

const { colorForCategory } = useActivities()

type Slice = {
  category: string
  color: string
  hours: number
  fraction: number
}

const slices = computed<Slice[]>(() => {
  const map = new Map<string, number>()
  for (const a of props.activities) {
    const key = a.category || 'Uncategorised'
    map.set(key, (map.get(key) ?? 0) + activityDurationMinutes(a))
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
  if (total === 0) return []
  return Array.from(map.entries())
    .map(([category, minutes]) => ({
      category,
      color: colorForCategory(category),
      hours: minutes / 60,
      fraction: minutes / total,
    }))
    .sort((a, b) => b.fraction - a.fraction)
})

const totalHours = computed(() => slices.value.reduce((s, v) => s + v.hours, 0))

type ArcPath = {
  category: string
  color: string
  d: string
}

const paths = computed<ArcPath[]>(() => {
  const r = 50
  const cx = 60
  const cy = 60
  if (slices.value.length === 1) {
    const s = slices.value[0]!
    return [
      {
        category: s.category,
        color: s.color,
        d: `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`,
      },
    ]
  }
  let angle = -Math.PI / 2
  return slices.value.map(s => {
    const sweep = s.fraction * Math.PI * 2
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + sweep)
    const y2 = cy + r * Math.sin(angle + sweep)
    const largeArc = sweep > Math.PI ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    angle += sweep
    return { category: s.category, color: s.color, d }
  })
})

function formatHours(h: number): string {
  if (h === Math.floor(h)) return `${h}h`
  return `${h.toFixed(1)}h`
}
</script>

<template>
  <div>
    <div v-if="slices.length === 0" class="text-ink-muted text-sm py-6 text-center">
      No activities yet for this day.
    </div>
    <div v-else class="flex flex-col items-center gap-4">
      <svg :width="size" :height="size" viewBox="0 0 120 120" class="block">
        <path
          v-for="p in paths"
          :key="p.category"
          :d="p.d"
          :fill="p.color"
          stroke="#171a21"
          stroke-width="1"
        />
        <circle cx="60" cy="60" r="28" fill="#171a21" />
        <text
          x="60"
          y="58"
          text-anchor="middle"
          class="fill-ink"
          style="font-size: 10px; font-weight: 600"
        >
          {{ formatHours(totalHours) }}
        </text>
        <text x="60" y="70" text-anchor="middle" fill="#9aa3b2" style="font-size: 7px">
          total
        </text>
      </svg>

      <ul class="w-full flex flex-col gap-1.5 text-sm">
        <li v-for="s in slices" :key="s.category" class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-sm flex-shrink-0" :style="{ backgroundColor: s.color }" />
          <span class="flex-1 truncate">{{ s.category }}</span>
          <span class="text-ink-muted tabular-nums">{{ formatHours(s.hours) }}</span>
          <span class="text-ink-muted tabular-nums text-xs w-10 text-right">
            {{ Math.round(s.fraction * 100) }}%
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
