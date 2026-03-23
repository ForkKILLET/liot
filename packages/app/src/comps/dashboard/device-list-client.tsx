'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Device as DeviceType, DeviceTemplate } from '@/lib/db/schema'
import { DeviceListToolbar } from '@/comps/dashboard/device-list-toolbar'
import { Device } from '@/comps/dashboard/device'

export type DeviceListClientProps = {
  devices: DeviceType[]
  templates: DeviceTemplate[]
}

export function DeviceListClient({ devices, templates }: DeviceListClientProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
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
          setMode(filters.mode)
          setTemplateId(filters.templateId)
          setSearch(filters.search)
        }}
      />

      {filteredDevices.length === 0
        ? (
          <p className='text-sm text-slate-400'>
            {devices.length === 0
              ? '暂无设备，点击上方添加第一个设备。'
              : '没有匹配的设备，请调整筛选条件。'}
          </p>
        )
        : (
          mode === 'grid'
            ? (
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {filteredDevices.map(device => (
                  <Device
                    key={device.id}
                    device={device}
                    templateName={templateNameById.get(device.templateId)}
                  />
                ))}
              </div>
            )
            : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-slate-800 text-left text-slate-400'>
                      <th className='py-3 pr-4 font-medium'>设备 ID</th>
                      <th className='py-3 pr-4 font-medium'>名称</th>
                      <th className='py-3 pr-4 font-medium'>型号</th>
                      <th className='py-3 pr-4 font-medium'>状态</th>
                      <th className='py-3 font-medium'>描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map(device => (
                      <tr key={device.id} className='border-b border-slate-800/80'>
                        <td className='py-3 pr-4 text-slate-300'>{device.id}</td>
                        <td className='py-3 pr-4'>
                          <Link
                            href={`/dashboard/devices/${device.id}`}
                            className='font-medium text-slate-100 underline-offset-2 hover:underline'
                          >
                            {device.name}
                          </Link>
                        </td>
                        <td className='py-3 pr-4 text-slate-300'>
                          {templateNameById.get(device.templateId) ?? '-'}
                        </td>
                        <td className='py-3 pr-4'>
                          <span className={device.isOnline ? 'text-emerald-400' : 'text-slate-400'}>
                            {device.isOnline ? '在线' : '离线'}
                          </span>
                        </td>
                        <td className='max-w-[28rem] py-3 text-slate-400'>
                          <span className='line-clamp-1'>{device.description || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )
      }
    </div>
  )
}
