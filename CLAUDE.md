# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build; run after non-trivial routing, layout, or config changes
- `npm run lint` — ESLint (primary validation)
- `npm run db:generate` — generate Prisma client into `src/generated/prisma`
- `npm run db:migrate` — create and apply a Prisma migration
- `npm run db:seed` — seed the database via `prisma/seed.mjs`
- `npm run db:studio` — open Prisma Studio

There is no test suite. Do not invent test commands.

## Architecture

CMU internship management system. Three user roles: **Student**, **Admin**, **Superadmin**. Interface language is Thai (`lang="th"`).

### Data flow

Server components in `src/app/intern/` read the session via `getCurrentUser()` (`src/lib/auth.ts`), which decodes an HMAC-signed cookie (`src/lib/session.ts`) and fetches the user from PostgreSQL via Prisma 7. Form mutations use Next.js server actions. The Prisma client is a singleton in `src/lib/prisma.ts` using the `@prisma/adapter-pg` driver adapter; generated code lives in `src/generated/prisma`.

### Auth

OAuth-only login (no password-based auth in the UI despite the schema field). Two providers: CMU Entra ID and Google, configured in `src/lib/cmu-oauth.ts` and `src/lib/google-oauth.ts` with callback handlers in `src/lib/cmu-oauth-callback.ts` and `src/lib/google-oauth-callback.ts`. OAuth does **not** auto-create users — the email must already exist in the database. Sessions last 7 days.

### Routing structure

- `/intern` — authenticated area; root `/` redirects here
- `/intern/login` — OAuth login page
- `/intern/terms` — terms acceptance gate for students
- `/intern/application` — student internship application form
- `/intern/profile` — student profile view
- `/intern/manage-users` — admin user management
- `/intern/uploads/[...slug]` — serves locally stored files from `/uploads`
- `/api/auth/callback/cmu` and `/api/auth/callback/google` — OAuth callbacks

### Role-based gating

`src/lib/user-management.ts` has permission helpers. `src/lib/manage-users-routing.ts` controls routing for the manage-users section. `src/lib/public-paths.ts` lists paths accessible without auth.

### Notifications

Dual-channel: in-app (Prisma `Notification` model) and email via Resend (`src/lib/email.ts`, `src/lib/notifications.ts`).

### File uploads

Local filesystem storage under `/uploads`, served through a catch-all route. `src/lib/file-storage.ts` handles read/write.

### Theme system

`src/app/globals.css` defines two theme variants using CSS custom properties:
- **Default** (violet): admin/coordinator flows
- **Student flow** (warm orange): activated via `html.student-flow-theme` or `body:has(main[data-student-flow])`

Custom utility classes: `bg-gradient-brand`, `bg-gradient-brand-soft`, `bg-gradient-accent`, `text-gradient-brand`, `card-surface`, `page-shell`, `page-grid`, `page-hero`, `section-kicker`, `shadow-glow`, `shadow-elegant`, etc.

### Fonts

Fraunces (headings), Instrument Sans (body), IBM Plex Mono (code). Set via CSS variables `--font-fraunces`, `--font-instrument-sans`, `--font-ibm-plex-mono`.

## Environment variables

- `DATABASE_URL` — PostgreSQL connection string (required; app throws at import time if missing)
- `AUTH_SESSION_SECRET` — HMAC key for session cookies (defaults to `DATABASE_URL`)
- OAuth: CMU Entra ID and/or Google credentials
- Email: `APP_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
