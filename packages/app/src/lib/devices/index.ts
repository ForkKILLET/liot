'use server'

import * as $ from 'drizzle-orm'
import { db, schema } from '@/lib/db'
import { DeviceField, DeviceMessage, NewDevice } from '@/lib/db/schema'
import { getCurrentUser, getSession } from '@/lib/auth/server'
import { unauthorized } from 'next/navigation'
import {
  getRequestMessages,
  renderPayloadTemplate,
  renderTopicTemplate,
  toStateRecord,
} from '@/lib/device-templates/protocol'
import { getMqttRuntime } from '@/lib/mqtt/runtime'

type ResponsePayloadMatcher = {
  path: string
  value: unknown
}

function getValueByPath(source: Record<string, unknown>, path: string) {
  if (!path.trim()) {
    return undefined
  }

  const segments = path.split('.').filter(Boolean)
  let current: unknown = source

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

function collectPongMatchers(
  template: schema.JsonTemplate,
  requestPayload: unknown,
  path: string[] = []
): ResponsePayloadMatcher[] {
  if (!requestPayload || typeof requestPayload !== 'object') {
    return [] as ResponsePayloadMatcher[]
  }

  if (template.type === 'pong') {
    const value = getValueByPath(requestPayload as Record<string, unknown>, template.field)
    if (value === undefined) {
      return []
    }

    return [{ path: path.join('.'), value }]
  }

  if (template.type !== 'object') {
    return []
  }

  return Object.entries(template.properties).flatMap(([key, childTemplate]) => {
    return collectPongMatchers(childTemplate, requestPayload, [...path, key])
  })
}

export async function getUserDeviceOverview(userId: string) {
  const [overview] = await db
    .select({ count: $.count(schema.devices) })
    .from(schema.devices)
    .where(
      $.and(
        $.eq(schema.devices.createdBy, userId),
        $.isNull(schema.devices.deletedAt)
      )
    )

  return overview
}

export type DeviceMessageRecord = {
  id: number
  direction: 'in' | 'out'
  topic: string
  payload: unknown
  messageId?: string
  messageType?: 'report' | 'request' | 'response' | 'set' | 'action'
  isWaiting?: boolean
  isAbnormal: boolean
  abnormalReason?: string
  createdAt: Date
}

export type DeviceStateHistorySeriesMeta = {
  field: string
  label: string
  unit: string
  min?: number
  max?: number
  precision?: number
}

export type DeviceStateHistoryPoint = {
  ts: Date
  values: Record<string, number>
}

export async function getDeviceStateHistory(input: {
  deviceId: number
  fields: string[]
  from: Date
  to: Date
  limit?: number
}) {
  await getDeviceById(input.deviceId)

  const [device] = await db
    .select()
    .from(schema.devices)
    .where(
      $.and(
        $.eq(schema.devices.id, input.deviceId),
        $.isNull(schema.devices.deletedAt)
      )
    )
    .limit(1)

  if (!device) {
    throw new Error('设备不存在')
  }

  const [template] = await db
    .select()
    .from(schema.deviceTemplates)
    .where($.eq(schema.deviceTemplates.id, device.templateId))
    .limit(1)

  if (!template) {
    throw new Error('设备模板不存在')
  }

  const numberFieldMetas = template.state.fields
    .filter((field): field is DeviceField & { type: 'number' } => field.type === 'number')
    .filter((field) => input.fields.includes(field.field))
    .map((field) => ({
      field: field.field,
      label: field.label,
      unit: field.unit,
      min: field.min,
      max: field.max,
      precision: field.precision,
    })) satisfies DeviceStateHistorySeriesMeta[]

  if (!numberFieldMetas.length) {
    return {
      meta: [] as DeviceStateHistorySeriesMeta[],
      points: [] as DeviceStateHistoryPoint[],
    }
  }

  const reportMessageIds = new Set(
    template.protocol.messages
      .filter((message) => message.type === 'report')
      .map((message) => message.id)
  )

  const messages = await db
    .select({
      createdAt: schema.deviceMessages.createdAt,
      payload: schema.deviceMessages.payload,
      parsedMessageId: schema.deviceMessages.parsedMessageId,
    })
    .from(schema.deviceMessages)
    .where(
      $.and(
        $.eq(schema.deviceMessages.deviceId, input.deviceId),
        $.eq(schema.deviceMessages.direction, 'in'),
        $.gte(schema.deviceMessages.createdAt, input.from),
        $.lte(schema.deviceMessages.createdAt, input.to)
      )
    )
    .orderBy($.desc(schema.deviceMessages.createdAt))
    .limit(input.limit ?? 10)

  const points: DeviceStateHistoryPoint[] = []

  messages.reverse().forEach((message) => {
    if (!message.parsedMessageId || !reportMessageIds.has(message.parsedMessageId)) {
      return
    }

    if (!message.payload || typeof message.payload !== 'object') {
      return
    }

    const payloadObject = message.payload as Record<string, unknown>
    const values: Record<string, number> = {}

    numberFieldMetas.forEach((meta) => {
      const raw = payloadObject[meta.field]
      const num = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(num)) {
        return
      }
      values[meta.field] = num
    })

    if (!Object.keys(values).length) {
      return
    }

    points.push({
      ts: message.createdAt,
      values,
    })
  })

  return {
    meta: numberFieldMetas,
    points,
  }
}

export async function getDeviceMessagesHistory(input: {
  deviceId: number
  page: number
  pageSize: number
}) {
  const { user } = await getSession()

  // Verify device access
  const device = await getDeviceById(input.deviceId)
  if (device.createdBy !== user.id) {
    unauthorized()
  }

  // Get template for message type detection
  const [template] = await db
    .select()
    .from(schema.deviceTemplates)
    .where($.eq(schema.deviceTemplates.id, device.templateId))
    .limit(1)

  const timeoutCommands = await db
    .select({
      messageId: schema.deviceCommands.messageId,
      createdAt: schema.deviceCommands.createdAt,
    })
    .from(schema.deviceCommands)
    .where(
      $.and(
        $.eq(schema.deviceCommands.deviceId, input.deviceId),
        $.eq(schema.deviceCommands.status, 'timeout')
      )
    )

  const pendingCommands = await db
    .select({
      messageId: schema.deviceCommands.messageId,
      createdAt: schema.deviceCommands.createdAt,
    })
    .from(schema.deviceCommands)
    .where(
      $.and(
        $.eq(schema.deviceCommands.deviceId, input.deviceId),
        $.eq(schema.deviceCommands.status, 'pending')
      )
    )

  // Fetch messages with offset/limit for pagination
  const offset = (input.page - 1) * input.pageSize
  const messages = await db
    .select()
    .from(schema.deviceMessages)
    .where($.eq(schema.deviceMessages.deviceId, input.deviceId))
    .orderBy($.desc(schema.deviceMessages.createdAt))
    .limit(input.pageSize)
    .offset(offset)

  // Get total count
  const [{ total }] = await db
    .select({ total: $.count() })
    .from(schema.deviceMessages)
    .where($.eq(schema.deviceMessages.deviceId, input.deviceId))

  const requestResponseMap = new Map<string, string>()
  const responseIds = new Set<string>()
  template?.protocol.messages.forEach((message) => {
    if (message.type === 'request') {
      requestResponseMap.set(message.id, message.responseId)
      responseIds.add(message.responseId)
    }
  })

  const findMessageIdByTopic = (topic: string) => {
    if (!template) {
      return undefined
    }

    const matched = template.protocol.messages.find((message) => {
      const expectedTopic = renderTopicTemplate(message.topicTemplate, {
        template: template.name,
        id: device.deviceId,
      })
      return expectedTopic === topic
    })

    return matched?.id
  }

  // Process messages and detect abnormalities
  const processedMessages: DeviceMessageRecord[] = messages.map((msg) => {
    let messageType: DeviceMessageRecord['messageType'] = undefined
    let isWaiting = false
    let isAbnormal = false
    let abnormalReason: string | undefined = undefined
    const resolvedMessageId = msg.parsedMessageId || findMessageIdByTopic(msg.topic)

    // Check if parsedMessageId is missing
    if (!resolvedMessageId) {
      isAbnormal = true
      abnormalReason = '未定义的 path'
    }
    else if (template) {
      // Find message definition
      const messageDef = template.protocol.messages.find((m) => m.id === resolvedMessageId)
      if (!messageDef) {
        isAbnormal = true
        abnormalReason = '未定义的 path'
        messageType = undefined
      }
      else {
        if (messageDef.type === 'report' && responseIds.has(messageDef.id)) {
          messageType = 'response'
        }
        else {
          messageType = messageDef.type as DeviceMessageRecord['messageType']
        }
      }
    }

    // Parse payload and check for format errors
    if (!abnormalReason && typeof msg.payload === 'string') {
      try {
        JSON.parse(msg.payload)
      }
      catch {
        isAbnormal = true
        abnormalReason = '消息格式错误'
      }
    }

    if (
      !abnormalReason &&
      msg.payload &&
      typeof msg.payload === 'object' &&
      Reflect.has(msg.payload as Record<string, unknown>, 'raw')
    ) {
      isAbnormal = true
      abnormalReason = '消息格式错误'
    }

    // Check for requests without responses
    if (
      !abnormalReason &&
      messageType === 'request' &&
      msg.direction === 'out' &&
      resolvedMessageId
    ) {
      const isPendingCommand = pendingCommands.some((command) => {
        if (command.messageId !== resolvedMessageId || !command.createdAt) {
          return false
        }

        const delta = Math.abs(command.createdAt.getTime() - msg.createdAt.getTime())
        return delta <= 30000
      })

      if (isPendingCommand) {
        isWaiting = true
      }

      const isTimeoutCommand = timeoutCommands.some((command) => {
        if (command.messageId !== resolvedMessageId || !command.createdAt) {
          return false
        }

        const delta = Math.abs(command.createdAt.getTime() - msg.createdAt.getTime())
        return delta <= 30000
      })

      if (isTimeoutCommand) {
        isAbnormal = true
        abnormalReason = '未收到 response'
      }
    }

    return {
      id: msg.id,
      direction: msg.direction as 'in' | 'out',
      topic: msg.topic,
      payload: msg.payload,
      messageId: resolvedMessageId,
      messageType,
      isWaiting,
      isAbnormal,
      abnormalReason,
      createdAt: msg.createdAt,
    }
  })

  return {
    messages: processedMessages,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(total / input.pageSize),
  }
}
export async function getUserDevices(userId: string, filters?: {
  templateId?: number
  search?: string
}) {
  const conditions = [
    $.eq(schema.devices.createdBy, userId),
    $.isNull(schema.devices.deletedAt),
  ]

  if (filters?.templateId) {
    conditions.push($.eq(schema.devices.templateId, filters.templateId))
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    conditions.push($.ilike(schema.devices.name, searchTerm))
  }

  const devices = await db
    .select()
    .from(schema.devices)
    .where($.and(...conditions))

  return devices
}

export async function getDeviceById(id: number) {
  const { user } = await getSession()

  const device = await db
    .select()
    .from(schema.devices)
    .where(
      $.and(
        $.eq(schema.devices.id, id),
        $.eq(schema.devices.createdBy, user.id),
        $.isNull(schema.devices.deletedAt)
      )
    )
    .limit(1)

  if (!device.length) {
    unauthorized()
  }

  return device[0]
}

export async function getDeviceDetailById(id: number) {
  const device = await getDeviceById(id)

  const [creator] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
    })
    .from(schema.users)
    .where($.eq(schema.users.id, device.createdBy))
    .limit(1)

  const [template] = await db
    .select()
    .from(schema.deviceTemplates)
    .where($.eq(schema.deviceTemplates.id, device.templateId))
    .limit(1)

  return {
    device,
    creator,
    template,
  }
}

export async function getDeviceDetailByProductAndDeviceId(product: string, deviceId: string) {
  const { user } = await getSession()

  const [deviceRef] = await db
    .select({ id: schema.devices.id })
    .from(schema.devices)
    .innerJoin(schema.deviceTemplates, $.eq(schema.deviceTemplates.id, schema.devices.templateId))
    .where(
      $.and(
        $.eq(schema.deviceTemplates.name, product),
        $.eq(schema.devices.deviceId, deviceId),
        $.eq(schema.devices.createdBy, user.id),
        $.isNull(schema.devices.deletedAt)
      )
    )
    .limit(1)

  if (!deviceRef) {
    unauthorized()
  }

  return getDeviceDetailById(deviceRef.id)
}

export type DefineDevice = Pick<NewDevice, 'deviceId' | 'name' | 'description' | 'templateId' | 'createdBy'>

export async function createDevice(device: DefineDevice) {
  const normalizedDeviceId = device.deviceId.trim()
  if (!normalizedDeviceId) {
    throw new Error('设备 ID 不能为空')
  }

  const [existingDevice] = await db
    .select({
      id: schema.devices.id,
      createdBy: schema.devices.createdBy,
    })
    .from(schema.devices)
    .where(
      $.and(
        $.eq(schema.devices.templateId, device.templateId),
        $.eq(schema.devices.deviceId, normalizedDeviceId)
      )
    )
    .limit(1)

  if (existingDevice) {
    if (existingDevice.createdBy !== device.createdBy) {
      throw new Error('该型号下设备 ID 已被其他用户占用')
    }

    throw new Error('该型号下设备 ID 已存在')
  }

  await db
    .insert(schema.devices)
    .values({
      ...device,
      deviceId: normalizedDeviceId,
      state: {},
    })
}

export type DefineDeviceUnderCurrentUser = Omit<DefineDevice, 'createdBy'>

export async function createDeviceUnderCurrentUser(device: DefineDeviceUnderCurrentUser) {
  const user = await getCurrentUser()
  return createDevice({
    ...device,
    createdBy: user.id,
  })
}

export async function deleteDevice(id: number) {
  const { user } = await getSession()

  const device = await getDeviceById(id)

  if (device.createdBy !== user.id) {
    unauthorized()
  }

  await db
    .update(schema.devices)
    .set({ deletedAt: new Date() })
    .where($.eq(schema.devices.id, id))
}

export async function updateDeviceBasicInfo(id: number, input: {
  name: string
  description?: string | null
}) {
  const { user } = await getSession()

  await db
    .update(schema.devices)
    .set({
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .where(
      $.and(
        $.eq(schema.devices.id, id),
        $.eq(schema.devices.createdBy, user.id),
        $.isNull(schema.devices.deletedAt)
      )
    )
}

export async function createDeviceCommand(input: {
  deviceId: number
  messageId: string
  requestTopic: string
  requestPayload: unknown
  responseTopic?: string
  createdBy: string
}) {
  const [command] = await db
    .insert(schema.deviceCommands)
    .values({
      deviceId: input.deviceId,
      messageId: input.messageId,
      requestTopic: input.requestTopic,
      requestPayload: input.requestPayload,
      responseTopic: input.responseTopic,
      createdBy: input.createdBy,
      status: 'pending',
    })
    .returning()

  return command
}

export async function getDeviceCommandById(commandId: number) {
  const { user } = await getSession()

  const [command] = await db
    .select()
    .from(schema.deviceCommands)
    .innerJoin(schema.devices, $.eq(schema.devices.id, schema.deviceCommands.deviceId))
    .where(
      $.and(
        $.eq(schema.deviceCommands.id, commandId),
        $.eq(schema.devices.createdBy, user.id)
      )
    )
    .limit(1)

  if (!command) {
    unauthorized()
  }

  return command.device_commands
}

export async function markDeviceCommandSuccess(commandId: number, responsePayload: unknown) {
  await db
    .update(schema.deviceCommands)
    .set({
      status: 'success',
      responsePayload,
    })
    .where($.eq(schema.deviceCommands.id, commandId))
}

export async function markDeviceCommandFailed(commandId: number, error: string) {
  await db
    .update(schema.deviceCommands)
    .set({
      status: 'failed',
      error,
    })
    .where($.eq(schema.deviceCommands.id, commandId))
}

export async function markDeviceCommandTimeout(commandId: number) {
  const [command] = await db
    .select()
    .from(schema.deviceCommands)
    .where($.eq(schema.deviceCommands.id, commandId))
    .limit(1)

  if (!command) {
    return
  }

  // Mark command as timeout and mark device as offline
  await Promise.all([
    db
      .update(schema.deviceCommands)
      .set({
        status: 'timeout',
        error: '命令响应超时',
      })
      .where($.eq(schema.deviceCommands.id, commandId)),
    db
      .update(schema.devices)
      .set({
        isOnline: false,
      })
      .where($.eq(schema.devices.id, command.deviceId)),
  ])
}

export async function saveDeviceMessage(input: {
  deviceId?: number
  direction: 'in' | 'out'
  topic: string
  payload: unknown
  parsedMessageId?: string
}) {
  await db
    .insert(schema.deviceMessages)
    .values({
      deviceId: input.deviceId,
      direction: input.direction,
      topic: input.topic,
      payload: input.payload,
      parsedMessageId: input.parsedMessageId,
    })
}

export async function mergeDeviceStateFromReport(input: {
  deviceId: number
  message: DeviceMessage
  payload: Record<string, unknown>
}) {
  if (input.message.type !== 'report') return

  const device = await getDeviceById(input.deviceId)
  const nextState = {
    ...toStateRecord(device.state as Record<string, unknown>),
  }

  input.message.fields.forEach((fieldName) => {
    if (Reflect.has(input.payload, fieldName)) {
      nextState[fieldName] = input.payload[fieldName]
    }
  })

  await db
    .update(schema.devices)
    .set({
      state: nextState,
      stateUpdatedAt: new Date(),
      isOnline: true,
    })
    .where($.eq(schema.devices.id, input.deviceId))
}

export async function enqueueDeviceRequestCommand(input: {
  deviceId: number
  messageId: string
}) {
  const { user } = await getSession()
  const { device, template } = await getDeviceDetailById(input.deviceId)

  if (!template) {
    throw new Error('设备模板不存在')
  }

  const requestMessage = getRequestMessages(template.protocol).find((message) => message.id === input.messageId)
  if (!requestMessage) {
    throw new Error('请求消息不存在或不是 request 类型')
  }

  const responseMessage = template.protocol.messages.find((message) => message.id === requestMessage.responseId)
  const requestTopic = renderTopicTemplate(requestMessage.topicTemplate, {
    template: template.name,
    id: device.deviceId,
  })
  const responseTopic = responseMessage
    ? renderTopicTemplate(responseMessage.topicTemplate, {
      template: template.name,
      id: device.deviceId,
    })
    : undefined

  const payload = renderPayloadTemplate(requestMessage.payloadTemplate, {
    fields: toStateRecord(device.state as Record<string, unknown>),
  })

  const responsePayloadMatchers = responseMessage
    ? collectPongMatchers(responseMessage.payloadTemplate, payload)
    : []

  const command = await createDeviceCommand({
    deviceId: device.id,
    messageId: requestMessage.id,
    requestTopic,
    requestPayload: payload,
    responseTopic,
    createdBy: user.id,
  })

  void executePendingDeviceCommand({
    commandId: command.id,
    messageId: requestMessage.id,
    deviceId: device.id,
    requestTopic,
    responseTopic,
    payload,
    responseMessage,
    responsePayloadMatchers,
  })

  return {
    commandId: command.id,
    status: 'pending' as const,
  }
}

async function executePendingDeviceCommand(input: {
  commandId: number
  messageId: string
  deviceId: number
  requestTopic: string
  responseTopic?: string
  payload: unknown
  responseMessage?: DeviceMessage
  responsePayloadMatchers?: ResponsePayloadMatcher[]
}) {
  const runtime = await getMqttRuntime()

  try {
    const result = await runtime.publishRequestAndWaitForResponse({
      commandId: input.commandId,
      messageId: input.messageId,
      deviceId: input.deviceId,
      requestTopic: input.requestTopic,
      responseTopic: input.responseTopic,
      responseMessageId: input.responseMessage?.id,
      expectedPayloadMatches: input.responsePayloadMatchers,
      payload: input.payload,
      timeoutMs: 12000,
    })

    await markDeviceCommandSuccess(input.commandId, result.payload)

    if (input.responseMessage && input.responseMessage.type === 'report') {
      await mergeDeviceStateFromReport({
        deviceId: input.deviceId,
        message: input.responseMessage,
        payload: result.payload,
      })
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '命令执行失败'

    if (message === '命令响应超时') {
      await markDeviceCommandTimeout(input.commandId)
    }
    else {
      await markDeviceCommandFailed(input.commandId, message)
    }
  }
}
