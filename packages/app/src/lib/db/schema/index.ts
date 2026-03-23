import { integer, pgTable, serial, boolean, json, date, timestamp, text } from 'drizzle-orm/pg-core'

import { users } from './auth'

export * from './auth'

export type DeviceState = {
  fields: DeviceField[]
}

export type DeviceField = DeviceFieldBase & DeviceFieldVariants

export type DeviceFieldBase = {
  field: string
  label: string
  description: string
}

export type DeviceFieldVariants =
  | { type: 'number', precision?: number, min?: number, max?: number, unit: string }
  | { type: 'string' }
  | { type: 'boolean' }

export type DeviceProtocol = {
  messages: DeviceMessage[]
}

export type DeviceMessage = DeviceMessageBase & DeviceMessageVariants

export type DeviceMessageBase = {
  id: string
  topicTemplate: string
  description: string
  payloadTemplate: JsonTemplate
}

export type JsonTemplate =
  | JsonTemplateLiteral
  | JsonTemplateField
  | JsonTemplateObject
  | JsonTemplateRandomId
  | JsonTemplatePong

export type JsonTemplateLiteral = {
  type: 'literal'
  value: string | number | boolean | null
}

export type JsonTemplateField = {
  type: 'field'
  field: string
}

export type JsonTemplateObject = {
  type: 'object'
  properties: Record<string, JsonTemplate>
}

export type JsonTemplateRandomId = {
  type: 'randomId'
  bits: number
}

export type JsonTemplatePong = {
  type: 'pong'
  field: string
}

export type DeviceMessageVariants =
  | { type: 'report', fields: string[] }    // Device -> Cloud, 设备上报自身状态，包含 `fields` 字段
  | { type: 'set', fields: string[] }       // Cloud -> Device, 云端下发更新状态，包含 `fields` 字段
  | { type: 'request', responseId: string } // Cloud -> Device, 云端对设备发送请求，期望设备以 `responseId` 消息响应
  | { type: 'action' }                      // Cloud -> Device, 云端指令设备执行某个动作，无响应

export const deviceTemplates = pgTable('device_templates', {
  id: serial().primaryKey(),

  name: text().notNull(),
  description: text(),

  state: json().$type<DeviceState>().notNull(),
  protocol: json().$type<DeviceProtocol>().notNull(),
})

export type DeviceTemplate = typeof deviceTemplates.$inferSelect
export type NewDeviceTemplate = typeof deviceTemplates.$inferInsert

export const devices = pgTable('devices', {
  id: serial().primaryKey(),
  templateId: integer().references(() => deviceTemplates.id).notNull(),
  createdBy: text().references(() => users.id).notNull(),
  createdAt: date().defaultNow(),

  name: text().notNull(),
  description: text(),

  isOnline: boolean().default(false),
  state: json().notNull(),
  stateUpdatedAt: timestamp().defaultNow(),

  deletedAt: timestamp(),
})

export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert

export const deviceCommands = pgTable('device_commands', {
  id: serial().primaryKey(),
  deviceId: integer().references(() => devices.id).notNull(),
  messageId: text().notNull(),
  requestTopic: text().notNull(),
  requestPayload: json().notNull(),
  responseTopic: text(),
  responsePayload: json(),
  status: text().notNull().default('pending'),
  error: text(),
  createdBy: text().references(() => users.id).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()).notNull(),
})

export type DeviceCommand = typeof deviceCommands.$inferSelect
export type NewDeviceCommand = typeof deviceCommands.$inferInsert

export const deviceMessages = pgTable('device_messages', {
  id: serial().primaryKey(),
  deviceId: integer().references(() => devices.id),
  direction: text().notNull(),
  topic: text().notNull(),
  payload: json().notNull(),
  parsedMessageId: text(),
  createdAt: timestamp().defaultNow().notNull(),
})

export type DeviceMessageRecord = typeof deviceMessages.$inferSelect
export type NewDeviceMessageRecord = typeof deviceMessages.$inferInsert
