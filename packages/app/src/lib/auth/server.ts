import { Auth, betterAuth, BetterAuthOptions } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { db, schema } from '@/lib/db'
import { headers } from 'next/headers'
import { redirect, unauthorized } from 'next/navigation'

const authOptions: BetterAuthOptions = {
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
}
type AuthInstance = Auth<typeof authOptions>
let authInstance: AuthInstance | null = null

export function getAuth() {
  return authInstance ??= betterAuth(authOptions)
}

export async function getSession() {
  const session = await getAuth().api.getSession({
    headers: await headers()
  })

  if (! session) unauthorized()

  return session
}

export async function getCurrentUser() {
  const { user } = await getSession()
  return user
}

export async function requireSessionOrRedirect(nextPath = '/dashboard') {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  if (! session) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
  }

  return session
}

export async function requireUserOrRedirect(nextPath = '/dashboard') {
  const { user } = await requireSessionOrRedirect(nextPath)
  return user
}
