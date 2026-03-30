import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

export async function runMigrations() {
  const db = drizzle(process.env.DATABASE_URL!)
  await migrate(db, { migrationsFolder: './drizzle' })
}
