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

**Nuxt 4** app using the `app/` directory convention. All application code lives under `app/`.

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

### Planned features

The home dashboard (`app/pages/index.vue`) has three placeholder sections — **Finances**, **Activities**, and **Insights** — that are yet to be built out.
