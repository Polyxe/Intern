This is a Next.js 16 App Router project with Prisma 7 configured for PostgreSQL.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

1. Create a local environment file from the example:

```bash
cp .env.example .env
```

2. Set `DATABASE_URL` in `.env` to a PostgreSQL connection string.

3. Configure email delivery if you want notification emails to be sent:

```bash
APP_BASE_URL=http://localhost:3000
RESEND_API_KEY=re_123456789
RESEND_FROM_EMAIL="Intern Wonderland <notifications@example.com>"
```

4. Generate the Prisma client:

```bash
npm run db:generate
```

5. Create and apply the initial migration once your database is reachable:

```bash
npm run db:migrate -- --name init
```

6. Optionally inspect data with Prisma Studio:

```bash
npm run db:studio
```

The starter schema currently defines a `User` model and generates the client into `src/generated/prisma`.

## CMU Entra ID OAuth

The login page now supports CMU Entra ID OAuth using the existing variables in `.env`:

- `AUTH_URL`
- `TOKEN_URL`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `SCOPE`
- `BASICINFO_URL`
- `CALLBACK_URL` (optional but recommended)
- `LOGOUT_URL` (optional, used after CMU logout and returned to the app home page)

The callback route is `/intern/api/auth/callback`.

If `CALLBACK_URL` is left blank, the app derives it from the current request origin using that path. For local development, register:

```text
http://localhost:3000/intern/api/auth/callback
```

For production, register the deployed origin with the same path, for example `https://your-domain.example/intern/api/auth/callback`.

For CMU logout, point `LOGOUT_URL` at the Microsoft logout endpoint. The app will align `post_logout_redirect_uri` to the current app origin and `/`, so local development returns to:

```text
http://localhost:3000/
```

OAuth sign-in does not create new users. The admin team must pre-create the user record with the exact email address that will come back from CMU.

## Google OAuth

The login page also supports Google OAuth for pre-provisioned users. Add these variables to `.env`:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_CALLBACK_URL` (optional but recommended)

If `GOOGLE_OAUTH_CALLBACK_URL` is blank, the app derives it from the current request origin using this callback path:

```text
/intern/login/google/callback
```

For a Google Cloud OAuth client of type Web application, register these values:

- Authorized JavaScript origins:
	- `http://localhost:3000`
	- `https://your-domain.example`
- Authorized redirect URIs:
	- `http://localhost:3000/intern/login/google/callback`
	- `https://your-domain.example/intern/login/google/callback`

If you deploy under a different host name, replace the origin while keeping the same callback path.

Google OAuth sign-in does not create new users. The email returned by Google must already exist in the `User` table, created by an admin ahead of time.

## Learn More

To learn more about the stack in this repository:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

For deployment, make sure the production environment also defines `DATABASE_URL` and that migrations are applied before serving traffic.

If you want notification emails in production, also define `APP_BASE_URL`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` with your deployed origin and a verified Resend sender.

## Docker Workflow

The repository now includes an app container that runs the production server with the same `npm run build` flow used outside Docker.

1. Make sure your environment file defines `DATABASE_URL` and the PostgreSQL variables used by `docker-compose.yml`:

```bash
POSTGRES_USER=superadmin
POSTGRES_PASSWORD=admin123
POSTGRES_DB=defaultdb
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin123
```

2. Start the app, database, and file watcher:

```bash
docker compose up --build -d app
docker compose watch app
```

This does three things:

- builds the app image with npm dependencies installed
- starts PostgreSQL, applies Prisma migrations, and runs the Next.js production server on port 3000
- keeps the app running in the background while `docker compose watch app` watches source files and restarts the app container so it reruns `npm run build` and `npm run start` after each change

Inside the app container, `DATABASE_URL` is rebuilt from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`, so the app connects to the Docker PostgreSQL service at `db:5432` instead of host `localhost`.

Use `bash run_build.sh` if you want the same Docker workflow through the existing helper script.

Notes:

- code changes under `src`, `public`, `prisma`, `next.config.ts`, and other tracked app files are synced into the container and trigger a rebuild/restart cycle automatically
- changes to `package.json`, `package-lock.json`, `.env`, or `.env.local` trigger a full image rebuild
- `exited with code 143` during watch-driven restarts is expected: Docker Compose sends `SIGTERM` to replace the old app container with the rebuilt one
- uploaded files persist in the named Docker volume `intern_app_uploads`
- pgAdmin remains available on port 5050
