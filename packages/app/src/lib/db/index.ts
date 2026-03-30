import { drizzle } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import 'dotenv/config'

import * as schema from './schema'
import { initDb } from './init'

export type Db = NodePgDatabase<typeof schema>

let dbInstance: Db | null = null
let dbInitStarted = false

function createDb() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  return drizzle({
    connection: databaseUrl,
    schema,
    casing: 'snake_case'
  })
}

function shouldInitDbOnBoot() {
  return process.env.NEXT_PHASE !== 'phase-production-build'
}

export function getDb() {
  dbInstance ??= createDb()

  if (shouldInitDbOnBoot() && !dbInitStarted) {
    dbInitStarted = true
    void initDb(dbInstance)
  }

  return dbInstance
}

export const db: Db = new Proxy({} as Db, {
  get(_, prop: keyof Db) {
    const db = getDb()
    return db[prop]
  }
})

export { schema }
