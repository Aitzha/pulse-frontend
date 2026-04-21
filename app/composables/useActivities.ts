export type Activity = {
  id: string
  title: string
  description?: string
  category: string
  startTime: string // ISO 8601
  endTime?: string // ISO 8601
  durationMinutes?: number
}

export type CreateActivityPayload = Omit<Activity, 'id'>
export type UpdateActivityPayload = Partial<CreateActivityPayload>

const KZ_TZ = 'Asia/Almaty'
const KZ_OFFSET = '+05:00'
const COLOR_STORAGE_KEY = 'pulse_activity_colors'

export const ACTIVITY_COLORS = [
  '#6ea8ff',
  '#7cdba0',
  '#ffb86b',
  '#c792ea',
  '#ff6b9d',
  '#ffd166',
  '#4fd1c5',
  '#ff6b6b',
  '#9aa3b2',
  '#a0e7e5',
]

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

// ---------- KZ date/time helpers ----------

export function kzDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KZ_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  const d = parts.find(p => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1)
}

export function formatDateLong(dateStr: string): string {
  const d = parseDate(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function addDays(dateStr: string, delta: number): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// Monday-start week containing the given KZ date string.
export function weekRange(dateStr: string): string[] {
  const d = parseDate(dateStr)
  const dow = d.getDay()
  const offsetToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d)
  monday.setDate(d.getDate() + offsetToMonday)
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    out.push(`${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`)
  }
  return out
}

// Get KZ HH:MM and YYYY-MM-DD from an ISO 8601 timestamp.
export function kzTimeFromISO(iso: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: KZ_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const h = parts.find(p => p.type === 'hour')?.value ?? '00'
  const m = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${h === '24' ? '00' : h}:${m}`
}

export function kzDateFromISO(iso: string): string {
  return kzDateString(new Date(iso))
}

export function isoFromKz(dateStr: string, time: string): string {
  return `${dateStr}T${time}:00${KZ_OFFSET}`
}

export function minutesFromTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function timeFromMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)))
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`
}

// ---------- activity-derived helpers ----------

export function activityDate(a: Activity): string {
  return kzDateFromISO(a.startTime)
}

export function activityDurationMinutes(a: Activity): number {
  if (a.endTime) {
    const ms = new Date(a.endTime).getTime() - new Date(a.startTime).getTime()
    return Math.max(1, Math.round(ms / 60000))
  }
  if (typeof a.durationMinutes === 'number' && a.durationMinutes > 0) {
    return Math.round(a.durationMinutes)
  }
  return 60
}

// Minutes from KZ 00:00 of the given date. Clamped to [0, 1440].
export function activityStartMinutesOn(a: Activity, dateStr: string): number {
  const aDate = activityDate(a)
  if (aDate === dateStr) {
    return minutesFromTime(kzTimeFromISO(a.startTime))
  }
  // activity started on a previous day and spills into dateStr
  return 0
}

// Visible duration on a specific day (clamps activities spanning midnight).
export function activityVisibleMinutesOn(a: Activity, dateStr: string): number {
  const start = activityStartMinutesOn(a, dateStr)
  const totalEndAbsMinutes = (() => {
    const aDate = activityDate(a)
    const startMinInAbs = minutesFromTime(kzTimeFromISO(a.startTime))
    const duration = activityDurationMinutes(a)
    // offset in days between activity's start date and the given date
    const offsetDays =
      (parseDate(dateStr).getTime() - parseDate(aDate).getTime()) / 86400000
    return startMinInAbs + duration - offsetDays * 24 * 60
  })()
  const clamped = Math.min(24 * 60, totalEndAbsMinutes) - start
  return Math.max(1, clamped)
}

export function activityStartLabel(a: Activity): string {
  return kzTimeFromISO(a.startTime)
}

export function activityEndLabel(a: Activity): string {
  if (a.endTime) return kzTimeFromISO(a.endTime)
  const startMin = minutesFromTime(kzTimeFromISO(a.startTime))
  const endMin = startMin + activityDurationMinutes(a)
  return timeFromMinutes(endMin % (24 * 60))
}

// ---------- color-by-category persistence ----------

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function fallbackColor(category: string): string {
  if (!category) return ACTIVITY_COLORS[0]!
  return ACTIVITY_COLORS[hashString(category) % ACTIVITY_COLORS.length]!
}

function loadColorMap(): Record<string, string> {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveColorMap(map: Record<string, string>) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota errors
  }
}

// ---------- main composable ----------

export function useActivities() {
  const { request } = useAuth()
  const activities = useState<Activity[]>('pulse_activities', () => [])
  const categoryColors = useState<Record<string, string>>(
    'pulse_category_colors',
    () => ({}),
  )
  const colorsHydrated = useState<boolean>('pulse_category_colors_hydrated', () => false)
  const loading = useState<boolean>('pulse_activities_loading', () => false)
  const lastRange = useState<{ from: string; to: string } | null>(
    'pulse_activities_last_range',
    () => null,
  )

  if (import.meta.client && !colorsHydrated.value) {
    categoryColors.value = loadColorMap()
    colorsHydrated.value = true
  }

  function colorForCategory(category: string): string {
    if (!category) return ACTIVITY_COLORS[0]!
    return categoryColors.value[category] ?? fallbackColor(category)
  }

  function setCategoryColor(category: string, color: string) {
    if (!category) return
    categoryColors.value = { ...categoryColors.value, [category]: color }
    saveColorMap(categoryColors.value)
  }

  function byDate(dateStr: string): Activity[] {
    return activities.value
      .filter(a => activityDate(a) === dateStr)
      .slice()
      .sort(
        (a, b) =>
          minutesFromTime(kzTimeFromISO(a.startTime)) -
          minutesFromTime(kzTimeFromISO(b.startTime)),
      )
  }

  function inWeek(days: string[]): Activity[] {
    const set = new Set(days)
    return activities.value.filter(a => set.has(activityDate(a)))
  }

  function categories(): string[] {
    const set = new Set<string>()
    for (const a of activities.value) if (a.category) set.add(a.category)
    return Array.from(set).sort()
  }

  async function loadRange(fromDate: string, toDate: string) {
    const from = `${fromDate}T00:00:00${KZ_OFFSET}`
    // `to` is exclusive upper bound; pass start of day after toDate
    const to = `${addDays(toDate, 1)}T00:00:00${KZ_OFFSET}`
    loading.value = true
    try {
      const data = await request<Activity[]>(
        `/api/activities?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
      activities.value = Array.isArray(data) ? data : []
      lastRange.value = { from, to }
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateActivityPayload): Promise<Activity> {
    const created = await request<Activity>('/api/activities', {
      method: 'POST',
      body: payload,
    })
    activities.value = [...activities.value, created]
    return created
  }

  async function update(id: string, patch: UpdateActivityPayload): Promise<Activity> {
    const updated = await request<Activity>(`/api/activities/${id}`, {
      method: 'PATCH',
      body: patch,
    })
    activities.value = activities.value.map(a => (a.id === id ? updated : a))
    return updated
  }

  async function remove(id: string): Promise<void> {
    await request<void>(`/api/activities/${id}`, { method: 'DELETE' })
    activities.value = activities.value.filter(a => a.id !== id)
  }

  return {
    activities,
    loading,
    lastRange,
    byDate,
    inWeek,
    categories,
    colorForCategory,
    setCategoryColor,
    loadRange,
    create,
    update,
    remove,
  }
}
