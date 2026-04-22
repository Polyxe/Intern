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

## Learn More

To learn more about the stack in this repository:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

For deployment, make sure the production environment also defines `DATABASE_URL` and that migrations are applied before serving traffic.
