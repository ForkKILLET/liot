import {
  DeviceField,
  DeviceMessage,
  DeviceProtocol,
  DeviceState,
  DeviceTemplate,
  JsonTemplate,
} from '@/lib/db/schema'

export type TemplateValidationResult = {
  valid: boolean
  errors: string[]
}

export function validateDeviceTemplate(template: DeviceTemplate): TemplateValidationResult {
  const errors: string[] = []

  if (!template.name?.trim()) {
    errors.push('模板名称不能为空')
  }

  if (!template.state || !Array.isArray(template.state.fields)) {
    errors.push('state.fields 必须是数组')
  }

  if (!template.protocol || !Array.isArray(template.protocol.messages)) {
    errors.push('protocol.messages 必须是数组')
  }

  template.state.fields.forEach((field, index) => {
    validateStateField(field, `state.fields[${index}]`, errors)
  })

  const messageIds = new Set<string>()
  template.protocol.messages.forEach((message, index) => {
    validateMessage(message, `protocol.messages[${index}]`, errors)

    if (messageIds.has(message.id)) {
      errors.push(`message.id 重复: ${message.id}`)
    }
    messageIds.add(message.id)
  })

  template.protocol.messages.forEach((message) => {
    if (message.type === 'request') {
      const responseExists = template.protocol.messages.some((candidate) => candidate.id === message.responseId)
      if (!responseExists) {
        errors.push(`request 消息 ${message.id} 的 responseId=${message.responseId} 未定义`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

function validateStateField(field: DeviceField, path: string, errors: string[]) {
  if (!field.field?.trim()) errors.push(`${path}.field 不能为空`)
  if (!field.label?.trim()) errors.push(`${path}.label 不能为空`)
  if (!field.description?.trim()) errors.push(`${path}.description 不能为空`)

  if (field.type === 'number') {
    if (!field.unit?.trim()) errors.push(`${path}.unit 不能为空（number 类型必填）`)
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      errors.push(`${path} min 不能大于 max`)
    }
  }
}

function validateMessage(message: DeviceMessage, path: string, errors: string[]) {
  if (!message.id?.trim()) errors.push(`${path}.id 不能为空`)
  if (!message.topicTemplate?.trim()) errors.push(`${path}.topicTemplate 不能为空`)
  if (!message.description?.trim()) errors.push(`${path}.description 不能为空`)
  validateJsonTemplate(message.payloadTemplate, `${path}.payloadTemplate`, errors)

  if ((message.type === 'report' || message.type === 'set') && !Array.isArray(message.fields)) {
    errors.push(`${path}.fields 必须是数组`)
  }

  if (message.type === 'request' && !message.responseId?.trim()) {
    errors.push(`${path}.responseId 不能为空（request 类型必填）`)
  }
}

function validateJsonTemplate(payload: JsonTemplate, path: string, errors: string[]) {
  if (payload.type === 'literal') return

  if (payload.type === 'field') {
    if (!payload.field?.trim()) errors.push(`${path}.field 不能为空`)
    return
  }

  if (payload.type === 'randomId') {
    if (!Number.isInteger(payload.bits) || payload.bits <= 0) {
      errors.push(`${path}.bits 必须是大于 0 的整数`)
    }

    if (payload.bits > 53) {
      errors.push(`${path}.bits 不能大于 53（JavaScript Number 精度限制）`)
    }
    return
  }

  if (payload.type === 'pong') {
    if (!payload.field?.trim()) errors.push(`${path}.field 不能为空`)
    return
  }

  if (payload.type === 'object') {
    if (!payload.properties || typeof payload.properties !== 'object') {
      errors.push(`${path}.properties 必须是对象`)
      return
    }

    Object.entries(payload.properties).forEach(([key, value]) => {
      validateJsonTemplate(value, `${path}.properties.${key}`, errors)
    })
  }
}

export function getRequestMessages(protocol: DeviceProtocol) {
  return protocol.messages.filter((message) => message.type === 'request')
}

export function getReportMessages(protocol: DeviceProtocol) {
  return protocol.messages.filter((message) => message.type === 'report')
}

export function renderTopicTemplate(template: string, context: Record<string, string | number>) {
  return template.replace(/\$\{(\w+)\}/g, (_match, key) => {
    const value = context[key]
    if (value === undefined || value === null) return ''
    return String(value)
  })
}

function getValueByPath(source: Record<string, unknown> | undefined, path: string) {
  if (!source || !path.trim()) {
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

function randomIntByBits(bits: number) {
  const normalizedBits = Math.trunc(bits)

  if (normalizedBits <= 0 || normalizedBits > 53) {
    throw new Error(`invalid randomId bits: ${bits}`)
  }

  if (normalizedBits <= 32) {
    return Math.floor(Math.random() * (2 ** normalizedBits))
  }

  const highBits = normalizedBits - 32
  const high = Math.floor(Math.random() * (2 ** highBits))
  const low = Math.floor(Math.random() * (2 ** 32))
  return high * (2 ** 32) + low
}

export function renderPayloadTemplate(template: JsonTemplate, context: {
  fields?: Record<string, unknown>
  requestPayload?: Record<string, unknown>
  randomIntByBits?: (bits: number) => number
} = {}): unknown {
  if (template.type === 'literal') return template.value

  if (template.type === 'field') {
    return getValueByPath(context.fields, template.field) ?? null
  }

  if (template.type === 'randomId') {
    const randomInt = context.randomIntByBits ?? randomIntByBits
    return randomInt(template.bits)
  }

  if (template.type === 'pong') {
    return getValueByPath(context.requestPayload, template.field) ?? null
  }

  const result: Record<string, unknown> = {}
  Object.entries(template.properties).forEach(([key, value]) => {
    result[key] = renderPayloadTemplate(value, context)
  })
  return result
}

export function formatStateFieldValue(field: DeviceField, state: Record<string, unknown>) {
  const raw = state[field.field]

  if (raw === undefined || raw === null) return '--'

  if (field.type === 'number') {
    const value = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isNaN(value)) return '--'
    const formatted = field.precision !== undefined ? value.toFixed(field.precision) : String(value)
    return field.unit ? `${formatted} ${field.unit}` : formatted
  }

  if (field.type === 'boolean') {
    return raw ? '是' : '否'
  }

  return String(raw)
}

export function toStateRecord(state: DeviceState | Record<string, unknown> | null | undefined) {
  if (!state || typeof state !== 'object') return {}
  return state as Record<string, unknown>
}
