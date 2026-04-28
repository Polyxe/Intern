# Repository Overview

This repository is a single Next.js 16.2.4 App Router application for internship management. It serves students, admins, and superadmins, supports CMU Entra ID and Google OAuth for pre-provisioned users only, stores data in PostgreSQL through Prisma 7, and handles uploaded profile photos and internship attachments from the app itself.

Treat it as a small-to-medium single-app TypeScript codebase: one app under `src/app`, shared business logic under `src/lib`, shared UI under `src/components`, Prisma schema and migrations under `prisma`, and local Docker infrastructure in `docker-compose.yml`. Main runtimes validated here: Node `v24.15.0`, npm `11.12.1`, Next `16.2.4`, Prisma `7.7.0`, PostgreSQL `16` via Docker.

# Bootstrap And Validation

Trust this section first and search only if it is incomplete or proven wrong.

- Always run `npm install` before any build or lint step. Validated: succeeds in about 6s.
- Always ensure `DATABASE_URL` is set before running app code, Prisma, or builds that import server modules. `src/lib/prisma.ts` throws at module load if it is missing.
- If you want the local Docker database, `.env.example` is not sufficient by itself. `docker-compose.yml` also requires `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `PGADMIN_DEFAULT_EMAIL`, and `PGADMIN_DEFAULT_PASSWORD`, which are not present in `.env.example`.
- Recommended bootstrap order from a clean clone:
  1. Create `.env` from `.env.example` and fill `DATABASE_URL`.
  2. Add the Docker-only variables above if you will run `docker compose up -d`.
  3. Run `npm install`.
  4. Run `docker compose up -d` if you need the local database. Validated: Postgres reaches `healthy` in about 11s.
  5. Run `npm run db:generate`. Validated: succeeds; Prisma client is generated into `src/generated/prisma` in about 0.1s.
  6. Run `npm run lint`.
  7. Run `npm run build` before `npm start`.

- `npm run lint` is the primary pre-check-in validation. Validated: it passes with 3 existing warnings and 0 errors. Current warnings are unused variables in `src/app/intern/application/page.tsx`, `src/app/intern/manage-users/page.tsx`, and `src/app/intern/profile/page.tsx`.
- `npm run build` is required after non-trivial route, layout, server-action, Prisma-client-usage, or config changes. Validated: succeeds in about 20-30s and uses `.env.local` and `.env` when present.
- `npm run dev` is the fastest local run path. Validated: starts successfully and is ready in about 0.4s on port 3000.
- `npm start` only works after a successful build and only when port 3000 is free. Validated failure modes:
  - After deleting `.next`, `npm start` fails immediately with “Could not find a production build in the '.next' directory”.
  - If another server already owns port 3000, `npm start` fails with `EADDRINUSE`.
- `bash run_build.sh` is a convenience wrapper for `docker compose down`, `docker compose up -d`, `npm run build`, and `npm start`. Validated: it works through the build, but it also fails with `EADDRINUSE` if another server is already running on port 3000.
- There is no configured test suite. Validated: `npm test` fails immediately with `Missing script: "test"`. Do not invent test commands.
- For database status checks, use `prisma migrate status`. Validated: current database is up to date with 11 migrations.
- If you change `prisma/schema.prisma`, always run `npm run db:generate` after migration work. `src/generated/prisma` is ignored and can become stale even if the database is current.

# Environment Notes

- Required for most work: `DATABASE_URL`.
- Required for CMU OAuth: `AUTH_URL`, `TOKEN_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `SCOPE`, `BASICINFO_URL`; optional `CALLBACK_URL`, `LOGOUT_URL`.
- Required for Google OAuth: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`; optional `GOOGLE_OAUTH_CALLBACK_URL`.
- Required for email delivery: `APP_BASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` or `RESEND_FROM`.
- Optional but recommended in production: `AUTH_SESSION_SECRET`. If omitted, session signing falls back to `DATABASE_URL`.

# Architecture And File Map

- `src/app/layout.tsx`: global shell, fonts, metadata.
- `src/app/page.tsx`: redirects `/` to `/intern`.
- `src/app/intern/page.tsx`: post-login router; redirects by role and terms/application state.
- `src/app/intern/application/page.tsx` and `src/app/intern/application/application-form.tsx`: student internship form flow.
- `src/app/intern/manage-users/page.tsx` plus sibling files: admin and superadmin user-management dashboard and detail flows.
- `src/app/intern/profile/page.tsx`: student profile plus admin account overview.
- `src/app/intern/terms/page.tsx`: required student terms acceptance gate.
- `src/lib/auth.ts`: current-user lookup.
- `src/lib/session.ts`: signed cookie session storage.
- `src/lib/user-management.ts`: role rules, post-login routing, permissions.
- `src/lib/internship-application.ts`: application status constants, shared selects, and lifecycle helpers.
- `src/lib/cmu-oauth.ts` and `src/lib/google-oauth.ts`: OAuth integrations. Important behavior: OAuth does not create users; the email must already exist in `User`.
- `src/lib/file-storage.ts`: uploaded files are stored on disk under `uploads`, but public URLs are served under `/intern/uploads`.
- `src/lib/notifications.ts` and `src/lib/email.ts`: in-app notifications and mirrored email sending.
- `prisma/schema.prisma`: source of truth for models and enums.
- `prisma/migrations`: checked-in migration history.
- `prisma/seed.mjs`: seeds a superadmin using `pg` directly, not the Prisma client.
- `prisma.config.ts`: Prisma CLI wiring.
- `src/generated/prisma`: generated code only; never hand-edit.
- `eslint.config.mjs`: flat ESLint config.
- `next.config.ts`: Next config; currently only server action body-size configuration.
- `docker-compose.yml`: local Postgres + pgAdmin stack.
- `README.md`: setup summary and OAuth callback expectations.
- `CMU_ENTRA_ID_OAUTH_DATA.md`: detailed CMU payload mapping and account-provisioning behavior.
- `AGENTS.md`: additional repo conventions; `CLAUDE.md` currently delegates to it.

# Change Guidance

- Default to server components in `src/app`; add client components only when hooks or browser APIs require them.
- Reuse existing helpers before adding packages. This repo already has auth, notifications, file storage, date parsing, role logic, and form validation utilities.
- Keep imports to concrete generated Prisma files such as `@/generated/prisma/client`; do not create ad hoc wrappers around generated output.
- Preserve the current UI system in `src/app/globals.css` and shared components; student-facing pages use the established gradient/soft-card visual language.
- There are no GitHub Actions workflows in the repo. To replicate the effective CI gate locally, run `npm run lint`, then `npm run build`, and add `npm run db:generate` whenever Prisma schema or generated-client usage changes.
