'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Device, DeviceTemplate } from '@/lib/db/schema'
import { DeviceListToolbar } from '@/comps/dashboard/device-list-toolbar'
import { DeviceOnlineBadge } from '@/comps/dashboard/device-online-badge'
import { getDeviceDetailPath } from '@/lib/devices/url'

export type DeviceListClientProps = {
  devices: Device[]
  templates: DeviceTemplate[]
}

export function DeviceListClient({ devices, templates }: DeviceListClientProps) {
  const router = useRouter()
  const [templateId, setTemplateId] = useState<number>()
  const [search, setSearch] = useState<string>()

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      if (templateId && device.templateId !== templateId) return false
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = device.name.toLowerCase().includes(searchLower)
        const matchesDesc = device.description?.toLowerCase().includes(searchLower) ?? false
        if (!matchesName && !matchesDesc) return false
      }
      return true
    })
  }, [devices, templateId, search])

  const templateNameById = useMemo(() => {
    return new Map(templates.map(template => [template.id, template.name]))
  }, [templates])

  return (
    <div className='space-y-6'>
      <DeviceListToolbar
        templates={templates}
        onFiltersChange={(filters) => {
          setTemplateId(filters.templateId)
          setSearch(filters.search)
        }}
      />

      {filteredDevices.length === 0
        ? (
          <p className='text-sm text-muted-foreground'>
            {devices.length === 0
              ? '暂无设备，点击工具栏创建第一个设备。'
              : '没有匹配的设备，请调整筛选条件。'}
          </p>
        )
        : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border text-left text-muted-foreground'>
                  <th className='py-3 pr-4 font-medium'>型号</th>
                  <th className='py-3 pr-4 font-medium'>设备 ID</th>
                  <th className='py-3 pr-4 font-medium'>名称</th>
                  <th className='py-3 pr-4 font-medium'>状态</th>
                  <th className='py-3 font-medium'>描述</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const templateName = templateNameById.get(device.templateId)
                  const href = templateName
                    ? getDeviceDetailPath(templateName, device.deviceId)
                    : '/dashboard/devices'

                  return (
                    <tr
                      key={device.id}
                      className='cursor-pointer border-b border-border/80 transition-colors hover:bg-muted/20'
                      onClick={() => router.push(href)}
                    >
                      <td className='py-3 pr-4 text-foreground'>
                        {templateNameById.get(device.templateId)}
                      </td>
                      <td className='py-3 pr-4 text-foreground'>{device.deviceId}</td>
                      <td className='py-3 pr-4 text-foreground'>{device.name}</td>
                      <td className='py-3 pr-4'>
                        <DeviceOnlineBadge isOnline={device.isOnline} />
                      </td>
                      <td className='max-w-[28rem] py-3 text-foreground'>
                        <span className='line-clamp-1'>{device.description || '-'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}
