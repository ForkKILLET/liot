import { drizzle } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import 'dotenv/config'

import * as schema from './schema'
import { initDb } from './init'

export type Db = NodePgDatabase<typeof schema>

function createDb() {
  if (! process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  return drizzle({
    connection: process.env.DATABASE_URL,
    schema,
    casing: 'snake_case'
  })
}

export const db = createDb()

initDb(db)

export { schema }
