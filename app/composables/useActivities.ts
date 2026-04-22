export type Activity = {
  id: string
  title: string
  description?: string
  category: string
  subcategory: string
  startTime: string // ISO 8601
  endTime?: string // ISO 8601
  durationMinutes?: number
}

export type CreateActivityPayload = Omit<Activity, 'id'>
export type UpdateActivityPayload = Partial<CreateActivityPayload>

const KZ_TZ = 'Asia/Almaty'
const KZ_OFFSET = '+05:00'

// ---------- taxonomy (mirrors backend enums; frontend uses string values) ----------

export const ACTIVITY_CATEGORIES = [
  'Work/Study',
  'Routine',
  'Unplanned',
  'Health',
] as const
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]

export const ACTIVITY_SUBCATEGORIES_BY_CATEGORY: Record<ActivityCategory, readonly string[]> = {
  'Work/Study': ['Programming', 'Drawing', 'Learning German'],
  'Routine': [
    'Morning Routine',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Night Routine',
    'Wash up',
    'Tea Break',
  ],
  'Unplanned': ['Self Care', 'Other'],
  'Health': ['Social', 'Gym', 'Sleep', 'Nap'],
}

// Fallback color if we see an unknown subcategory (defensive).
const DEFAULT_COLOR = '#9aa3b2'

// Preset colors per subcategory.
// - Work/Study: blue theme, distinct shades per subcategory
// - Routine:    all the same green (per spec)
// - Unplanned:  orange/yellow theme, distinct shades
// - Health:     pink theme, distinct shades
const SUBCATEGORY_COLOR: Record<string, string> = {
  // Work/Study
  'Programming': '#3b82f6',
  'Drawing': '#60a5fa',
  'Learning German': '#6366f1',
  // Routine (all same green)
  'Morning Routine': '#34d399',
  'Breakfast': '#34d399',
  'Lunch': '#34d399',
  'Dinner': '#34d399',
  'Night Routine': '#34d399',
  'Wash up': '#34d399',
  'Tea Break': '#34d399',
  // Unplanned
  'Self Care': '#fbbf24',
  'Other': '#f97316',
  // Health
  'Social': '#ec4899',
  'Gym': '#f472b6',
  'Sleep': '#be185d',
  'Nap': '#fb7185',
}

export function colorForSubcategory(subcategory: string): string {
  return SUBCATEGORY_COLOR[subcategory] ?? DEFAULT_COLOR
}

export function colorForActivity(a: Pick<Activity, 'subcategory'>): string {
  return colorForSubcategory(a.subcategory)
}

// ---------- date/time helpers ----------

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

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

// Convert a picker "HH:MM" end-time (possibly "24:00" or "00:00" meaning end-of-day)
// to an ISO string anchored at the given start date.
export function endTimeToIso(startDate: string, endTime: string): string {
  if (endTime === '24:00' || endTime === '00:00') {
    return isoFromKz(addDays(startDate, 1), '00:00')
  }
  return isoFromKz(startDate, endTime)
}

export function minutesFromTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

// For validation — treats "00:00" and "24:00" as end-of-day (1440).
export function endMinutesForValidation(time: string): number {
  if (!time) return -1
  if (time === '00:00' || time === '24:00') return 24 * 60
  return minutesFromTime(time)
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

export function activityStartMinutesOn(a: Activity, dateStr: string): number {
  const aDate = activityDate(a)
  if (aDate === dateStr) return minutesFromTime(kzTimeFromISO(a.startTime))
  return 0
}

export function activityVisibleMinutesOn(a: Activity, dateStr: string): number {
  const aDate = activityDate(a)
  const startMinAbs = minutesFromTime(kzTimeFromISO(a.startTime))
  const duration = activityDurationMinutes(a)
  const offsetDays = (parseDate(dateStr).getTime() - parseDate(aDate).getTime()) / 86400000
  const endAbsOnDay = startMinAbs + duration - offsetDays * 24 * 60
  const start = activityStartMinutesOn(a, dateStr)
  return Math.max(1, Math.min(24 * 60, endAbsOnDay) - start)
}

export function activityStartLabel(a: Activity): string {
  return kzTimeFromISO(a.startTime)
}

// End-time label relative to a specific day. If the activity ends at or past
// midnight of that day, returns "24:00" to make end-of-day clear.
export function activityEndLabelOn(a: Activity, dateStr: string): string {
  const start = activityStartMinutesOn(a, dateStr)
  const visible = activityVisibleMinutesOn(a, dateStr)
  const end = start + visible
  if (end >= 24 * 60) return '24:00'
  return timeFromMinutes(end)
}

// Time to show in the modal's end-time picker for an existing activity.
// If the activity ends at the next day's KZ 00:00, show "24:00".
export function activityModalEndTime(a: Activity): string {
  if (!a.endTime) return ''
  const startDate = activityDate(a)
  const endDate = kzDateFromISO(a.endTime)
  if (endDate !== startDate) return '24:00'
  return kzTimeFromISO(a.endTime)
}

// ---------- main composable ----------

export function useActivities() {
  const { request } = useAuth()
  const activities = useState<Activity[]>('pulse_activities', () => [])
  const loading = useState<boolean>('pulse_activities_loading', () => false)
  const lastRange = useState<{ from: string; to: string } | null>(
    'pulse_activities_last_range',
    () => null,
  )

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

  async function loadRange(fromDate: string, toDate: string) {
    const from = `${fromDate}T00:00:00${KZ_OFFSET}`
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
    colorForSubcategory,
    colorForActivity,
    loadRange,
    create,
    update,
    remove,
  }
}
