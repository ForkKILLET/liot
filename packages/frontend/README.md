# Liot Frontend

Liot frontend is a lightweight IoT platform UI built with Next.js App Router.

## Tech Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS v4 + shadcn/ui style components
- better-auth for authentication
- Drizzle ORM + PostgreSQL

## Project Structure

- src/app: routes and layouts
- src/comps: reusable components (ui, form, dashboard)
- src/lib/auth: auth client and server setup
- src/lib/db: database connection, schema, initialization
- src/lib/devices: device domain operations
- src/lib/device-templates: template queries
- drizzle: SQL migrations

## Environment Setup

Create environment files for Next runtime and Drizzle CLI:

```bash
cp .env.example .env.local
cp .env.example .env
```

Required variables at minimum:

- DATABASE_URL

## Development

Start the dev server:

```bash
pnpm dev
```

Build and run production mode:

```bash
pnpm build
pnpm start
```

## Database Commands

Generate migrations from schema changes:

```bash
pnpm db:generate
```

Apply migrations:

```bash
pnpm db:migrate
```

Push schema directly:

```bash
pnpm db:push
```

Open Drizzle Studio:

```bash
pnpm db:studio
```

## Authentication

Authentication is handled by better-auth through a catch-all Next route handler at /api/auth/[...all].

- Server setup: src/lib/auth/server.ts
- Client usage: src/lib/auth/client.ts
- Route handler bridge: src/app/api/auth/[...all]/route.ts

Current auth behavior:

- Login and register pages call better-auth client methods directly.
- Dashboard layout checks session server-side and blocks anonymous access.
- Server actions and server functions can call getSession or getCurrentUser for protected reads and writes.

## Notes

- Database initialization seeds default device templates in src/lib/db/init.ts.
- Database init is currently triggered during db module load.
