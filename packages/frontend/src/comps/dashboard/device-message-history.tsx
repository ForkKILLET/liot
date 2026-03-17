'use client'

import { Fragment, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/comps/ui/button'

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

function getMessageTypeBadge(type?: string) {
  const typeColors: Record<string, string> = {
    report: 'bg-blue-900/30 text-blue-300 border-blue-900/50',
    request: 'bg-amber-900/30 text-amber-300 border-amber-900/50',
    response: 'bg-emerald-900/30 text-emerald-300 border-emerald-900/50',
    set: 'bg-purple-900/30 text-purple-300 border-purple-900/50',
    action: 'bg-cyan-900/30 text-cyan-300 border-cyan-900/50',
  }

  const color = typeColors[type || 'report'] || typeColors.report

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {type || '-'}
    </span>
  )
}

function getStatusBadge(isWaiting: boolean | undefined, isAbnormal: boolean, abnormalReason?: string) {
  if (isWaiting) {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300 border border-amber-900/50'>
        等待中
      </span>
    )
  }

  if (!isAbnormal) {
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-300 border border-emerald-900/50'>
        正常
      </span>
    )
  }

  return (
    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-900/50'>
      {abnormalReason || '异常'}
    </span>
  )
}

export function getDirectionBadge(direction: 'in' | 'out') {
  const directionText = direction === 'in' ? '↓ 入' : '↑ 出'
  const directionColor = direction === 'in'
    ? 'bg-slate-800 text-slate-300'
    : 'bg-slate-700 text-slate-200'

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

  if (total === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-slate-400 text-sm'>暂无消息记录</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-slate-800'>
              <th className='px-4 py-3 text-left font-semibold text-slate-400'>消息类型</th>
              <th className='px-4 py-3 text-left font-semibold text-slate-400'>消息 ID</th>
              <th className='px-4 py-3 text-left font-semibold text-slate-400'>参数</th>
              <th className='px-4 py-3 text-left font-semibold text-slate-400'>时间</th>
              <th className='px-4 py-3 text-left font-semibold text-slate-400'>状态</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <Fragment key={message.id}>
                <tr
                  className='border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors'
                  onClick={() => setExpandedId(expandedId === message.id ? null : message.id)}
                >
                  <td className='px-4 py-3'>
                    {getMessageTypeBadge(message.messageType)}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-slate-300'>
                    {message.messageId || '-'}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-slate-300 max-w-xs truncate' title={formatPayload(message.payload)}>
                    {payloadPreview(message.payload)}
                  </td>
                  <td className='px-4 py-3 text-slate-400 whitespace-nowrap'>
                    {new Date(message.createdAt).toLocaleString()}
                  </td>
                  <td className='px-4 py-3'>
                    {getStatusBadge(message.isWaiting, message.isAbnormal, message.abnormalReason)}
                  </td>
                </tr>
                {expandedId === message.id && (
                  <tr className='border-b border-slate-800/50 bg-slate-800/20'>
                    <td colSpan={5} className='px-4 py-4'>
                      <div className='space-y-2'>
                        <div className='text-xs text-slate-400 font-mono'>{message.topic}</div>
                        <pre className='bg-slate-900/50 border border-slate-800 rounded p-3 overflow-x-auto text-xs text-slate-300 font-mono max-h-60'>
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

      <div className='flex items-center justify-between border-t border-slate-800 pt-4'>
        <div className='text-sm text-slate-400'>
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
