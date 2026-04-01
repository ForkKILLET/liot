'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { DeviceMessageHistory } from './device-message-history'
import { DeviceMessagesHistoryResponse, DeviceMessageHistoryItem } from '@/lib/api/contracts'

type DeviceMessageRecord = DeviceMessageHistoryItem

export type DeviceMessageHistoryContainerProps = {
  deviceId: number
  pageSize?: number
  onLoadingChange?: (isLoading: boolean) => void
}

export function DeviceMessageHistoryContainer({
  deviceId,
  pageSize = 20,
  onLoadingChange,
}: DeviceMessageHistoryContainerProps) {
  const [page, setPage] = useState(1)
  const [loadingCount, setLoadingCount] = useState(0)
  const [messagesData, setMessagesData] = useState<{
    messages: DeviceMessageRecord[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const isLoading = isPending || loadingCount > 0

  const doLoadPage = useCallback(async (targetPage: number) => {
    try {
      const response = await fetch(
        `/api/devices/${deviceId}/messages?page=${targetPage}&pageSize=${pageSize}`,
        { method: 'GET' }
      )

      const payload = await response.json() as DeviceMessagesHistoryResponse

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
    }
    finally {
      setLoadingCount((count) => Math.max(0, count - 1))
    }
  }, [deviceId, pageSize])

  const loadPage = useCallback((targetPage: number) => {
    setLoadingCount((count) => count + 1)
    startTransition(() => void doLoadPage(targetPage))
  }, [doLoadPage])

  useEffect(() => {
    onLoadingChange?.(isLoading)
  }, [isLoading, onLoadingChange])

  useEffect(() => {
    loadPage(1)
  }, [deviceId, pageSize, loadPage])

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
  }, [deviceId, page, loadPage])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadPage(newPage)
  }

  if (!messagesData && isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-sm text-muted-foreground'>加载消息历史中...</div>
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
      isLoading={isLoading}
    />
  )
}
