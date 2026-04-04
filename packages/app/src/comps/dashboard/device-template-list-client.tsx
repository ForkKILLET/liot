'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { DeviceTemplate } from '@/lib/db/schema'
import { getDeviceTemplateDetailPath } from '../../lib/device-templates/url'
import { DeviceTemplateListToolbar } from './device-template-list-toolbar'

export function DeviceTemplateListClient({
  templates,
}: {
  templates: DeviceTemplate[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState<string>()

  const filteredTemplates = useMemo(() => {
    const orderedTemplates = [...templates].sort((a, b) => b.id - a.id)
    if (!search) {
      return orderedTemplates
    }

    const searchLower = search.toLowerCase()
    return orderedTemplates.filter((template) => {
      const matchesName = template.name.toLowerCase().includes(searchLower)
      const matchesDesc = template.description?.toLowerCase().includes(searchLower) ?? false
      return matchesName || matchesDesc
    })
  }, [templates, search])
  return (
    <div className='space-y-6'>
      <DeviceTemplateListToolbar
        onFiltersChange={(filters: { search?: string }) => {
          setSearch(filters.search)
        }}
      />

      {filteredTemplates.length === 0
        ? (
          <p className='text-sm text-muted-foreground'>
            {templates.length === 0
              ? '暂无模板，点击工具栏创建第一个模板。'
              : '没有匹配的模板，请调整筛选条件。'}
          </p>
        )
        : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border text-left text-muted-foreground'>
                  <th className='py-3 pr-4 font-medium'>模板名称</th>
                  <th className='py-3 pr-4 font-medium'>状态字段</th>
                  <th className='py-3 pr-4 font-medium'>协议消息</th>
                  <th className='py-3 pr-4 font-medium'>描述</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className='cursor-pointer border-b border-border/80 transition-colors hover:bg-muted/20'
                    onClick={() => router.push(getDeviceTemplateDetailPath(template.id))}
                  >
                    <td className='py-3 pr-4 text-foreground'>{template.name}</td>
                    <td className='py-3 pr-4 text-foreground'>{template.state.fields.length}</td>
                    <td className='py-3 pr-4 text-foreground'>{template.protocol.messages.length}</td>
                    <td className='max-w-[28rem] py-3 pr-4 text-foreground'>
                      <span className='line-clamp-1'>{template.description || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
