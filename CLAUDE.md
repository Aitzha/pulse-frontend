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
- `useAuthUser()` — global Vue state for the logged-in user object
- `useAuth()` — composable with `login`, `register`, `logout`, and a generic `request(path, opts)` helper that automatically attaches the Bearer token

The `request()` helper should be used for all authenticated API calls. The API base URL (`http://localhost:3001` by default) comes from `runtimeConfig.public.apiBase`.

### Route protection

`app/middleware/auth.ts` is a named middleware. Protect a page by adding `definePageMeta({ middleware: ['auth'] })`. Public pages (login, register) opt out of the default layout with `definePageMeta({ layout: false })`.

### Styling

No component library. Styles are scoped CSS inside each `.vue` file. The design uses a dark palette — background `#0f1115`, surface `#171a21`, border `#242833`, muted text `#9aa3b2`, accent blue `#6ea8ff`. TailwindCSS is installed but mostly unused; prefer extending this existing palette when adding styles.

### Planned features

The home dashboard (`app/pages/index.vue`) has three placeholder sections — **Finances**, **Activities**, and **Insights** — that are yet to be built out.
