import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env.local' })
config()

if (! process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema/index.ts',
  casing: 'snake_case',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
