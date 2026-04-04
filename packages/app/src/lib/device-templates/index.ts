'use server'

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

function parseTemplateJsonObject(label: string, value: string) {
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} 必须是 JSON 对象`)
    }
    return parsed
  }
  catch (error) {
    if (error instanceof Error) {
      throw new Error(`${label} JSON 格式错误: ${error.message}`)
    }
    throw new Error(`${label} JSON 格式错误`)
  }
}

export async function createDeviceTemplate(input: {
  name: string
  description?: string
  state: string
  protocol: string
}) {
  const name = input.name.trim()
  if (!name) {
    throw new Error('模板名称不能为空')
  }

  const [existing] = await db
    .select({ id: schema.deviceTemplates.id })
    .from(schema.deviceTemplates)
    .where($.eq(schema.deviceTemplates.name, name))
    .limit(1)

  if (existing) {
    throw new Error('模板名称已存在')
  }

  const state = parseTemplateJsonObject('state', input.state)
  const protocol = parseTemplateJsonObject('protocol', input.protocol)

  const candidate = {
    id: 0,
    name,
    description: input.description?.trim() || null,
    state: state as schema.DeviceState,
    protocol: protocol as schema.DeviceProtocol,
  } satisfies schema.DeviceTemplate

  const validation = validateDeviceTemplate(candidate)
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'))
  }

  const [template] = await db
    .insert(schema.deviceTemplates)
    .values({
      name,
      description: input.description?.trim() || null,
      state: candidate.state,
      protocol: candidate.protocol,
    })
    .returning()

  return template
}

export async function deleteDeviceTemplate(id: number) {
  const [usage] = await db
    .select({ count: $.count(schema.devices.id) })
    .from(schema.devices)
    .where(
      $.and(
        $.eq(schema.devices.templateId, id),
        $.isNull(schema.devices.deletedAt)
      )
    )

  const usingCount = Number(usage?.count ?? 0)
  if (usingCount > 0) {
    throw new Error('该模板正在被设备使用，无法删除')
  }

  await db
    .delete(schema.deviceTemplates)
    .where($.eq(schema.deviceTemplates.id, id))
}

