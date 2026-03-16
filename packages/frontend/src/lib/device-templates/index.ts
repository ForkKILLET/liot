import { db, schema } from '@/lib/db'

export async function getDeviceTemplates() {
  const templates = await db
    .select()
    .from(schema.deviceTemplates)

  return templates
}
