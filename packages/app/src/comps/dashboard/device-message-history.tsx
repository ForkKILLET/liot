'use client'

import { Fragment, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/comps/ui/button'
import { DeviceMessageTypeBadge } from '@/comps/dashboard/device-message-type-badge'

export type MessageRecord = {
  id: number
  direction: 'in' | 'out'
  topic: string
  payload: unknown
  messageId?: string
  messageType?: 'report' | 'request' | 'response' | 'set' | 'action'
  isWaiting?: boolean
  isAbnormal: boolean
  abnormalReason?: string
  createdAt: Date | string
}

export type DeviceMessageHistoryProps = {
  messages: MessageRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function formatPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload
  }
  try {
    return JSON.stringify(payload, null, 2)
  }
  catch {
    return String(payload)
  }
}

function payloadPreview(payload: unknown): string {
  const text = formatPayload(payload).replace(/\s+/g, ' ').trim()
  if (text.length <= 80) {
    return text
  }
  return `${text.slice(0, 80)}...`
}

function getStatusBadge(isWaiting: boolean | undefined, isAbnormal: boolean, abnormalReason?: string) {
  if (isWaiting) {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900/50'>
        等待中
      </span>
    )
  }

  if (!isAbnormal) {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50'>
        正常
      </span>
    )
  }

  return (
    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-900 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50'>
      {abnormalReason || '异常'}
    </span>
  )
}

export function getDirectionBadge(direction: 'in' | 'out') {
  const directionText = direction === 'in' ? '↓ 入' : '↑ 出'
  const directionColor = direction === 'in'
    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${directionColor}`}>
      {directionText}
    </span>
  )
}

export function DeviceMessageHistory({
  messages,
  total,
  page,
  pageSize: _,
  totalPages,
  onPageChange,
  isLoading = false,
}: DeviceMessageHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-sm text-muted-foreground'>加载消息历史中...</div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground text-sm'>暂无消息记录</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-border'>
              <th className='px-4 py-3 text-left font-semibold text-muted-foreground'>消息类型</th>
              <th className='px-4 py-3 text-left font-semibold text-muted-foreground'>消息 ID</th>
              <th className='px-4 py-3 text-left font-semibold text-muted-foreground'>参数</th>
              <th className='px-4 py-3 text-left font-semibold text-muted-foreground'>时间</th>
              <th className='px-4 py-3 text-left font-semibold text-muted-foreground'>状态</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <Fragment key={message.id}>
                <tr
                  className='border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors'
                  onClick={() => setExpandedId(expandedId === message.id ? null : message.id)}
                >
                  <td className='px-4 py-3'>
                    <DeviceMessageTypeBadge type={message.messageType} />
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-foreground/80'>
                    {message.messageId || '-'}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-foreground/80 max-w-xs truncate' title={formatPayload(message.payload)}>
                    {payloadPreview(message.payload)}
                  </td>
                  <td className='px-4 py-3 text-muted-foreground whitespace-nowrap'>
                    {new Date(message.createdAt).toLocaleString()}
                  </td>
                  <td className='px-4 py-3'>
                    {getStatusBadge(message.isWaiting, message.isAbnormal, message.abnormalReason)}
                  </td>
                </tr>
                {expandedId === message.id && (
                  <tr className='border-b border-border/50 bg-muted/30'>
                    <td colSpan={5} className='px-4 py-4'>
                      <div className='space-y-2'>
                        <div className='text-xs text-muted-foreground font-mono'>{message.topic}</div>
                        <pre className='bg-muted border border-border rounded p-3 overflow-x-auto text-xs text-foreground/80 font-mono max-h-60'>
                          {formatPayload(message.payload)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex items-center justify-between border-t border-border pt-4'>
        <div className='text-sm text-muted-foreground'>
          第 {page} / {totalPages} 页 · 共 {total} 条消息
        </div>

        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const startPage = Math.max(1, page - 2)
            const pageNum = startPage + i
            if (pageNum > totalPages) return null

            return (
              <Button
                key={pageNum}
                size='sm'
                variant={pageNum === page ? 'default' : 'outline'}
                disabled={isLoading}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}

          <Button
            size='sm'
            variant='outline'
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
