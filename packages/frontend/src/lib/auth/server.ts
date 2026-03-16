import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { db, schema } from '@/lib/db'
import { headers } from 'next/headers'
import { unauthorized } from 'next/navigation'

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  plugins: [
    nextCookies(),
  ],
})

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (! session) unauthorized()

  return session
}

export async function getCurrentUser() {
  const { user } = await getSession()
  return user
}
