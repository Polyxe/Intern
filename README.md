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

3. Generate the Prisma client:

```bash
npm run db:generate
```

4. Create and apply the initial migration once your database is reachable:

```bash
npm run db:migrate -- --name init
```

5. Optionally inspect data with Prisma Studio:

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

## Learn More

To learn more about the stack in this repository:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

For deployment, make sure the production environment also defines `DATABASE_URL` and that migrations are applied before serving traffic.
