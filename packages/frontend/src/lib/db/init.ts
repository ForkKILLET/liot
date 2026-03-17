import { count } from 'drizzle-orm'
import { Db } from '.'
import * as schema from './schema'
import { validateDeviceTemplate } from '@/lib/device-templates/protocol'

const defaultDeviceTemplates: schema.NewDeviceTemplate[] = [
  {
    name: 'SRTP-1',
    description: '简易水表',
    state: {
      fields: [
        {
          field: 'flow',
          label: '流量',
          description: '水表统计的总流量',
          type: 'number',
          unit: 'm³',
          min: 0,
          precision: 3,
        },
        {
          field: 'battery',
          label: '电量',
          description: '设备当前的电池电量百分比',
          type: 'number',
          unit: '%',
          min: 0,
          max: 100,
          precision: 1,
        }
      ],
    },
    protocol: {
      messages: [
        {
          id: 'telemetry',
          topicTemplate: 'device/${template}/${id}/telemetry',
          description: '定时上报流量',
          type: 'report',
          fields: ['flow'],
          payloadTemplate: {
            type: 'object',
            properties: {
              version: { type: 'literal', value: 1 },
              flow: { type: 'field', field: 'flow' },
            }
          }
        },
        {
          id: 'status/request',
          topicTemplate: 'device/${template}/${id}/status/request',
          description: '请求设备上报当前状态',
          type: 'request',
          responseId: 'status/response',
          payloadTemplate: {
            type: 'object',
            properties: {
              version: { type: 'literal', value: 1 },
            }
          }
        },
        {
          id: 'status/response',
          topicTemplate: 'device/${template}/${id}/status/response',
          description: '设备响应当前状态',
          type: 'report',
          fields: ['flow', 'battery'],
          payloadTemplate: {
            type: 'object',
            properties: {
              version: { type: 'literal', value: 1 },
              flow: { type: 'field', field: 'flow' },
              battery: { type: 'field', field: 'battery' },
            },
          }
        }
      ],
    }
  }
]

export async function initDb(db: Db) {
  defaultDeviceTemplates.forEach((template) => {
    const result = validateDeviceTemplate(template as schema.DeviceTemplate)
    if (!result.valid) {
      throw new Error(`defaultDeviceTemplates 校验失败(${template.name}): ${result.errors.join(', ')}`)
    }
  })

  const [{ count: deviceTemplateCount }] = await db
    .select({ count: count(schema.deviceTemplates) })
    .from(schema.deviceTemplates)

  if (! deviceTemplateCount) {
    await db
      .insert(schema.deviceTemplates)
      .values(defaultDeviceTemplates)
  }
}
