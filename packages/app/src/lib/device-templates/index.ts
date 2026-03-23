import { db, schema } from '@/lib/db'
import * as $ from 'drizzle-orm'
import { validateDeviceTemplate } from './protocol'

export async function getDeviceTemplates() {
  const templates = await db
    .select()
    .from(schema.deviceTemplates)

  return templates
}

export async function getDeviceTemplateById(id: number) {
  const [template] = await db
    .select()
    .from(schema.deviceTemplates)
    .where($.eq(schema.deviceTemplates.id, id))
    .limit(1)

  return template ?? null
}

export function validateTemplatesOrThrow(templates: typeof schema.deviceTemplates.$inferSelect[]) {
  const errors: string[] = []

  templates.forEach((template) => {
    const result = validateDeviceTemplate(template)
    if (!result.valid) {
      result.errors.forEach((error) => {
        errors.push(`[template:${template.name}] ${error}`)
      })
    }
  })

  if (errors.length > 0) {
    throw new Error(`设备模板校验失败:\n${errors.join('\n')}`)
  }
}
