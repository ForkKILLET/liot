export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiFailure = {
  success: false
  message: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export type DeviceMessageType = 'report' | 'request' | 'response' | 'set' | 'action'

export type DeviceMessageHistoryItem = {
  id: number
  direction: 'in' | 'out'
  topic: string
  payload: unknown
  messageId?: string
  messageType?: DeviceMessageType
  isWaiting?: boolean
  isAbnormal: boolean
  abnormalReason?: string
  createdAt: string
}

export type DeviceMessagesHistoryData = {
  messages: DeviceMessageHistoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type DeviceMessagesHistoryResponse = ApiResponse<DeviceMessagesHistoryData>

export type DeviceStateHistorySeriesMeta = {
  field: string
  label: string
  unit: string
  min?: number
  max?: number
  precision?: number
}

export type DeviceStateHistoryPoint = {
  ts: string
  values: Record<string, number>
}

export type DeviceStateHistoryData = {
  meta: DeviceStateHistorySeriesMeta[]
  points: DeviceStateHistoryPoint[]
}

export type DeviceStateHistoryResponse = ApiResponse<DeviceStateHistoryData>

export type DeviceCommandEnqueueData = {
  commandId: number
  status: string
}

export type DeviceCommandEnqueueResponse = ApiResponse<DeviceCommandEnqueueData>
