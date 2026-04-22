# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:3000
npm run build     # production build
npm run preview   # preview production build locally
```

There are no lint or test scripts configured yet.

## Architecture

**Nuxt 4** app using the `app/` directory convention. All application code lives under `app/` (pages, components, composables, middleware, plugins, assets). Components in `app/components/` and composables in `app/composables/` are auto-imported by Nuxt — do not write explicit imports for them.

### State

No Pinia/Vuex. Cross-component state lives in composables that wrap `useState('<key>', () => ...)` (SSR-safe) plus `useCookie` for auth. The pattern: one composable per feature exposes reactive state and mutator functions (see `useAuth`, `useActivities`). Persistence is either cookies (auth cookies survive reloads) or server state fetched on demand.

### Auth

Auth is centralised in `app/composables/useAuth.ts`. It exposes:
- `useAuthToken()` — reactive cookie (`pulse_token`) holding the JWT
- `useAuthUser()` — reactive cookie (`pulse_user`) holding `{ id, username }`; cookie-backed so identity survives page reloads alongside the token
- `useAuth()` — composable with `login`, `register`, `logout`, and a generic `request(path, opts)` helper that automatically attaches the Bearer token

The `request()` helper should be used for all authenticated API calls. The API base URL (`http://localhost:3001` by default) comes from `runtimeConfig.public.apiBase`. All backend endpoints are mounted under `/api` (e.g. `/api/auth/login`, `/api/auth/register`) — include the prefix when calling `request()`.

### Route protection

`app/middleware/auth.ts` is a named middleware. Protect a page by adding `definePageMeta({ middleware: ['auth'] })`. Public pages (login, register) opt out of the default layout with `definePageMeta({ layout: false })`.

### Styling

Styling is Tailwind-only — pages should not use `<style>` blocks. The design system is defined in two places:

- `tailwind.config.js` extends the theme with the Pulse dark palette: `canvas` (page bg `#0f1115`), `card` (raised surface `#171a21`), `well` (inset/input bg `#0f1218`), `topbar` (`#131620`), `edge` / `edge-strong` (borders), `ink` / `ink-muted` / `ink-soft` / `ink-inverse` (text), `accent` / `accent-hover` (`#6ea8ff`), and `danger`. Use these colour tokens (e.g. `bg-card`, `border-edge`, `text-ink-muted`) instead of hex values.
- `app/assets/css/tailwind.css` holds the Tailwind entry. Global element defaults (`html`/`body` background, link colour, font) live in `@layer base`. Reusable component classes live in `@layer components`: `surface-card`, `form-input`, `form-label`, `btn-primary`, `btn-ghost`. Prefer these over re-pasting long utility strings for forms and cards.

When adding new surfaces or buttons, extend the `@layer components` block rather than adding scoped `<style>` per page.

### Icons

Icons are rendered with FontAwesome (`@fortawesome/vue-fontawesome`). Registration lives in [`app/plugins/fontawesome.ts`](app/plugins/fontawesome.ts) — it imports each icon from `@fortawesome/free-solid-svg-icons`, adds it to the shared `library`, and registers `<FontAwesomeIcon>` globally. `config.autoAddCss = false` is set alongside an explicit import of `@fortawesome/fontawesome-svg-core/styles.css` so SSR renders icons at their final size instead of flashing oversized glyphs.

To use a new icon: import it in the plugin (e.g. `faChartLine`), pass it to `library.add(...)`, then reference it in a template with the kebab-case name: `<FontAwesomeIcon :icon="['fas', 'chart-line']" />`. Prefer FontAwesome icons over raw emoji in UI copy.

### Activities

The `/activities` page is implemented and backed by `useActivities()` (`app/composables/useActivities.ts`). Key conventions that span multiple files:

- **Kazakhstan timezone is authoritative.** All date labels, day boundaries, and the "today" default are computed in `Asia/Almaty` (UTC+5, no DST). The page sends ISO 8601 timestamps with a literal `+05:00` offset (`isoFromKz(date, "HH:MM")`) and reads them back through `Intl.DateTimeFormat` with `timeZone: 'Asia/Almaty'` (`kzTimeFromISO`, `kzDateFromISO`). Never compare raw `Date` objects for day equality — always go through `kzDateString`/`kzDateFromISO`.
- **Activity shape matches backend DTOs** (`title`, `category`, `subcategory`, `startTime: ISO`, optional `endTime: ISO`, optional `durationMinutes`, optional `description`). `activityDurationMinutes()` resolves the effective duration in priority order: `endTime - startTime`, else `durationMinutes`, else 60. That fallback is what makes open-ended activities render as a 1h block.
- **Category/subcategory are enums**, not free text. The allowed values mirror the backend and live in `ACTIVITY_CATEGORIES` + `ACTIVITY_SUBCATEGORIES_BY_CATEGORY`. The modal uses `<select>`s and resets subcategory when the category changes.
- **Colour is derived from subcategory**, not user-picked and not persisted. `SUBCATEGORY_COLOR` inside `useActivities.ts` maps each subcategory to a preset hex (blues for Work/Study, shared green for Routine, orange/yellow for Unplanned, pinks for Health). Use `colorForActivity(a)` / `colorForSubcategory(sub)` in components.
- **Normalise backend responses.** Activities come back from MongoDB as `_id`, so `useActivities` funnels everything through `normalizeActivity()` to expose `id: string`. Without this, edit silently turns into create and delete hits `/api/activities/undefined`. Always pipe new fetch/create/update results through it.
- **Fetching is week-scoped.** The page calls `loadRange(mondayOfWeek, sundayOfWeek)` whenever the week's Monday changes; switching between days inside the same week is a pure client-side filter. `from` is inclusive (`Monday 00:00 +05:00`); `to` is exclusive (`nextMonday 00:00 +05:00`).
- **End-of-day sentinel.** The UI lets users set the end time to `24:00` (or `00:00`) to mean "until end of day"; `endTimeToIso()` translates that to the next day's `00:00 +05:00` ISO, and `activityEndLabelOn()` / `activityModalEndTime()` render it back as `24:00` on the start day.
- **New-activity defaults** come from `nowKzTimeRoundedDown(5)` for start and `addMinutesToTime(start, 60)` for end. Minimum duration is 15 min, enforced by both validation and the `min-time` prop on `TimePicker`.
- **Time grid components** (`TimeGridDay.vue`, `TimeGridWeek.vue`) accept raw `Activity[]` and internally compute `startMinutes` / `visibleMinutes` via the composable's helpers. Day grid auto-distributes overlapping activities into columns. Midnight-spanning activities are clamped to the start day. Both grids render a reactive blue "now" line (ticks once a minute) on today's column.
- **`TimePicker.vue`** is the shared hour/minute chooser. Chevron-up (top) decrements, chevron-down (bottom) increments; hour step 1, minute step 5; minute wrap does **not** carry into hour. `allow-end-of-day` extends the hour to 24, `min-time` disables decrements past the floor.

API endpoints (NestJS + MongoDB backend): `GET/POST /api/activities`, `GET/PATCH/DELETE /api/activities/:id`, with `from`/`to` query params on GET.

### Planned features

`Finances` and `Goals` tiles on the home dashboard (`app/pages/index.vue`) are still placeholders.

## Commit messages

Write commit subjects that describe the actual change in a few words — "Fix subcategory select resetting on edit", "Add current-time line to day grid" — not generic labels like "activity page improvements" or "misc fixes". The subject is the only part most readers see; make it earn its line.
