This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database setup

This app uses [Drizzle ORM](https://orm.drizzle.team) with a PostgreSQL database. Copy `.env.example` to `.env.local` (for Next.js) and `.env` (for Drizzle CLI) and adjust the credentials:

```bash
cp .env.example .env.local
cp .env.example .env
```

Run migrations and start the interactive schema studio with the scripts provided in `package.json`:

```bash
pnpm drizzle:generate   # create SQL migrations from schema changes
pnpm drizzle:migrate    # apply migrations to the target database
pnpm drizzle:studio     # open Drizzle studio UI
```

## Authentication

Two API routes power the login & register pages:

| Endpoint | Method | Body |
| --- | --- | --- |
| `/api/auth/register` | POST | `{ "email": string, "username": string, "password": string }` |
| `/api/auth/login` | POST | `{ "email": string, "password": string }` |

- Passwords are hashed with `bcryptjs` before being stored in the `users` table.
- Validation happens on both client (React Hook Form) and server (Zod) so you get immediate feedback.
- Successful login currently redirects to `/dashboard`; registration redirects to `/auth/login` once complete.

### Auth Provider

- `src/lib/auth/provider.tsx` exposes an `AuthProvider` + `useAuth()` hook. It manages the signed-in user state, stores the latest user payload in `localStorage`, and exposes `login` / `logout` helpers.
- `src/app/providers.tsx` wraps the entire app with the auth + theme providers.
- Login/Register pages consume `useAuth()` to automatically redirect authenticated visitors and, after signup, to sign in transparently.
- The dashboard page uses `useAuth()` to guard access and show the current profile/ logout action.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
