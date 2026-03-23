'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/comps/ui/button'

type RequestAction = {
  id: string
  description: string
}

export type DeviceRequestActionsProps = {
  deviceId: number
  requests: RequestAction[]
}

type PendingSnapshot = {
  deviceId: number
  messageId: string
  commandId: number
  startedAt: number
}

export function DeviceRequestActions({ deviceId, requests }: DeviceRequestActionsProps) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pendingCommandId, setPendingCommandId] = useState<number | null>(null)
  const router = useRouter()
  const sourceRef = useRef<EventSource | null>(null)
  const storageKey = useMemo(() => `device-request-pending:${deviceId}`, [deviceId])

  const clearPendingSnapshot = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    setPendingId(null)
    setPendingCommandId(null)
  }

  const closeSource = () => {
    sourceRef.current?.close()
    sourceRef.current = null
  }

  const notifyHistoryRefresh = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('device-messages:refresh', {
      detail: { deviceId },
    }))
    window.dispatchEvent(new CustomEvent('device-state:refresh', {
      detail: { deviceId },
    }))
  }

  const trackCommandResult = (commandId: number, messageId: string) => new Promise<void>((resolve, reject) => {
    closeSource()
    const source = new EventSource(`/api/commands/${commandId}/events`)
    sourceRef.current = source

    source.addEventListener('command', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        status: string
        error?: string
      }

      if (data.status === 'success') {
        closeSource()
        clearPendingSnapshot()
        notifyHistoryRefresh()
        toast.success('操作已完成，状态已刷新')
        router.refresh()
        resolve()
        return
      }

      if (data.status === 'failed' || data.status === 'timeout') {
        closeSource()
        clearPendingSnapshot()
        notifyHistoryRefresh()
        reject(new Error(data.error || '命令执行失败'))
      }
    })

    source.onerror = () => {
      closeSource()
      reject(new Error('命令结果订阅失败'))
    }

    setPendingId(messageId)
    setPendingCommandId(commandId)
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const raw = localStorage.getItem(storageKey)
    if (!raw) return

    try {
      const snapshot = JSON.parse(raw) as PendingSnapshot
      if (snapshot.deviceId !== deviceId || !snapshot.commandId || !snapshot.messageId) {
        localStorage.removeItem(storageKey)
        return
      }

      void trackCommandResult(snapshot.commandId, snapshot.messageId).catch((error) => {
        const message = error instanceof Error ? error.message : '命令执行失败'
        toast.error(message)
      })
    }
    catch {
      localStorage.removeItem(storageKey)
    }

    return () => {
      closeSource()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, storageKey])

  const runRequest = async (messageId: string) => {
    setPendingId(messageId)

    try {
      const response = await fetch(`/api/devices/${deviceId}/commands/${encodeURIComponent(messageId)}`, {
        method: 'POST',
      })

      const payload = await response.json() as {
        success: boolean
        message?: string
        data?: {
          commandId: number
          status: string
        }
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || '命令执行失败')
      }

      const commandId = payload.data?.commandId
      if (!commandId) {
        throw new Error('命令创建失败：缺少 commandId')
      }

      if (typeof window !== 'undefined') {
        const snapshot: PendingSnapshot = {
          deviceId,
          messageId,
          commandId,
          startedAt: Date.now(),
        }
        localStorage.setItem(storageKey, JSON.stringify(snapshot))
      }

      await trackCommandResult(commandId, messageId)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '命令执行失败'
      toast.error(message)
      clearPendingSnapshot()
    }
  }

  if (!requests.length) {
    return <p className='text-sm text-slate-400'>该型号暂无 request 类型操作。</p>
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {requests.map((request) => {
        const pending = pendingId === request.id

        return (
          <Button
            key={request.id}
            size='sm'
            variant={pending ? 'secondary' : 'default'}
            disabled={pendingId !== null}
            onClick={() => runRequest(request.id)}
            title={request.description}
          >
            {pending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            {pending ? `执行中... #${pendingCommandId ?? ''}` : request.description}
          </Button>
        )
      })}
    </div>
  )
}
