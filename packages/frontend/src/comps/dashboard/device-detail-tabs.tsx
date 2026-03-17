'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/comps/ui/card'
import { Button } from '@/comps/ui/button'
import { DeviceBasicInfoEditor } from '@/comps/dashboard/device-basic-info-editor'
import { DeviceRequestActions } from '@/comps/dashboard/device-request-actions'
import { DeviceStateFields } from '@/comps/dashboard/device-state-fields'
import { DeviceDeleteButton } from '@/comps/dashboard/device-delete-button'
import { DeviceMessageHistoryContainer } from '@/comps/dashboard/device-message-history-container'
import { DeviceStateChartPanel } from '@/comps/dashboard/device-state-chart-panel'
import { DeviceTemplate } from '@/lib/db/schema'
import { RefreshCw } from 'lucide-react'

type TabType = 'properties' | 'status' | 'messages'
type RequestMessage = {
  id: string
  description: string
}

export type DeviceDetailTabsProps = {
  section: TabType
  deviceId: number
  deviceName: string
  deviceDescription: string | null
  device: {
    templateId: number
    createdBy: string
    createdAt: string | Date | null
    isOnline: boolean | null
    stateUpdatedAt: Date | null
    state: unknown
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  template?: DeviceTemplate
  requestMessages: RequestMessage[]
}

export function DeviceDetailTabs({
  section,
  deviceId,
  deviceName,
  deviceDescription,
  device,
  creator,
  template,
  requestMessages,
}: DeviceDetailTabsProps) {
  const [selectedChartFields, setSelectedChartFields] = useState<string[]>([])

  const createdAtDisplay = typeof device.createdAt === 'string'
    ? device.createdAt
    : device.createdAt?.toString().split('T')[0] || '-'

  const numberFieldMetas = useMemo(() => {
    return (template?.state.fields ?? [])
      .filter((field): field is typeof field & { type: 'number' } => field.type === 'number')
      .map((field) => ({
        field: field.field,
        label: field.label,
        unit: field.unit,
        min: field.min,
        max: field.max,
        precision: field.precision,
      }))
  }, [template])

  const selectedNumberFieldMetas = numberFieldMetas.filter((meta) => selectedChartFields.includes(meta.field))

  const toggleChartField = (fieldName: string) => {
    setSelectedChartFields((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter((item) => item !== fieldName)
      }
      return [...prev, fieldName]
    })
  }

  return (
    <div className='space-y-6'>
      {section === 'properties' && (
        <div className='space-y-6'>
          <Card className='border-slate-800 bg-slate-900/60'>
            <CardHeader className='pb-2'>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceBasicInfoEditor
                deviceId={deviceId}
                deviceDisplayId={deviceId}
                templateId={device.templateId}
                templateName={template?.name ?? null}
                creatorDisplay={creator ? `${creator.name} (${creator.email})` : device.createdBy}
                createdAtDisplay={createdAtDisplay}
                defaultName={deviceName}
                defaultDescription={deviceDescription}
              />
            </CardContent>
          </Card>

          <Card className='border-red-900/50 bg-red-950/20'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-red-400'>危险操作</CardTitle>
            </CardHeader>
            <CardContent>
              <DeviceDeleteButton deviceId={deviceId} deviceName={deviceName} />
            </CardContent>
          </Card>
        </div>
      )}

      {section === 'status' && (
        <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
          <div className='space-y-6'>
            <Card className='border-slate-800 bg-slate-900/60'>
              <CardHeader className='pb-2'>
                <CardTitle>设备状态</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceStateFields
                  fields={template?.state.fields ?? []}
                  state={device.state as Record<string, unknown>}
                  selectedChartFields={selectedChartFields}
                  onToggleChartField={toggleChartField}
                />

                <div className='mt-4 border-t border-slate-800 pt-3 text-sm'>
                  <div className='grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3'>
                    <div className='flex h-9 items-center text-muted-foreground font-medium'>在线状态</div>
                    <div className='flex h-9 items-center'>
                      <span
                        className={`inline-flex items-center gap-2 ${
                          device.isOnline ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            device.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        {device.isOnline ? '在线' : '离线'}
                      </span>
                    </div>
                    <div className='flex h-9 items-center text-muted-foreground font-medium'>状态更新时间</div>
                    <div className='flex h-9 items-center text-foreground'>
                      {device.stateUpdatedAt?.toLocaleString() || '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-slate-800 bg-slate-900/60'>
              <CardHeader className='pb-2'>
                <CardTitle>主动操作</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceRequestActions
                  deviceId={deviceId}
                  requests={requestMessages.map((message) => ({
                    id: message.id,
                    description: message.description,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <DeviceStateChartPanel
            deviceId={deviceId}
            selectedFields={selectedNumberFieldMetas}
          />
        </div>
      )}

      {section === 'messages' && (
        <Card className='border-slate-800 bg-slate-900/60'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between space-y-0'>
            <CardTitle>消息历史</CardTitle>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                if (typeof window === 'undefined') return
                window.dispatchEvent(new CustomEvent('device-messages:refresh', {
                  detail: { deviceId },
                }))
              }}
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              刷新
            </Button>
          </CardHeader>
          <CardContent>
            <DeviceMessageHistoryContainer deviceId={deviceId} pageSize={20} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
