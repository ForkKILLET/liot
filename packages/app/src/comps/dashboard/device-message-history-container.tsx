'use client'

import { useEffect, useState, useTransition } from 'react'
import { DeviceMessageHistory } from './device-message-history'

type DeviceMessageRecord = {
  id: number
  direction: 'in' | 'out'
  topic: string
  payload: unknown
  messageId?: string
  messageType?: 'report' | 'request' | 'response' | 'set' | 'action'
  isWaiting?: boolean
  isAbnormal: boolean
  abnormalReason?: string
  createdAt: string
}

export type DeviceMessageHistoryContainerProps = {
  deviceId: number
  pageSize?: number
}

export function DeviceMessageHistoryContainer({
  deviceId,
  pageSize = 20,
}: DeviceMessageHistoryContainerProps) {
  const [page, setPage] = useState(1)
  const [messagesData, setMessagesData] = useState<{
    messages: DeviceMessageRecord[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadPage = (targetPage: number) => {
    startTransition(async () => {
      const response = await fetch(
        `/api/devices/${deviceId}/messages?page=${targetPage}&pageSize=${pageSize}`,
        { method: 'GET' }
      )

      const payload = await response.json() as {
        success: boolean
        data?: {
          messages: DeviceMessageRecord[]
          total: number
          page: number
          pageSize: number
          totalPages: number
        }
      }

      if (!response.ok || !payload.success || !payload.data) {
        setMessagesData({
          messages: [],
          total: 0,
          page: targetPage,
          pageSize,
          totalPages: 1,
        })
        return
      }

      setMessagesData(payload.data)
    })
  }

  useEffect(() => {
    loadPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, pageSize])

  useEffect(() => {
    const onRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ deviceId?: number }>
      if (customEvent.detail?.deviceId !== deviceId) return
      loadPage(page)
    }

    window.addEventListener('device-messages:refresh', onRefresh)
    return () => {
      window.removeEventListener('device-messages:refresh', onRefresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, page])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadPage(newPage)
  }

  if (!messagesData && isPending) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-muted-foreground'>加载消息历史中...</div>
      </div>
    )
  }

  if (!messagesData) {
    return null
  }

  return (
    <DeviceMessageHistory
      messages={messagesData.messages}
      total={messagesData.total}
      page={messagesData.page}
      pageSize={messagesData.pageSize}
      totalPages={messagesData.totalPages}
      onPageChange={handlePageChange}
      isLoading={isPending}
    />
  )
}
