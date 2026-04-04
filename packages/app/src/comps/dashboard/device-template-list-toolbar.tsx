'use client'

import { useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import { Input } from '@/comps/ui/input'
import { ButtonLink } from '@/comps/ui/link'

export type DeviceTemplateListToolbarProps = {
  createHref?: string
  createLabel?: string
  onFiltersChange: (filters: {
    search?: string
  }) => void
}

export function DeviceTemplateListToolbar({
  createHref = '/dashboard/templates/new',
  createLabel = '创建模板',
  onFiltersChange,
}: DeviceTemplateListToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState<string>('')

  const activeFilters = useMemo(() => {
    const filters = [] as Array<{ type: 'search', label: string, value: string }>
    if (search) {
      filters.push({ type: 'search', label: `搜索: ${search}`, value: search })
    }
    return filters
  }, [search])

  const handleFilterChange = (newSearch: string) => {
    setSearch(newSearch)
    onFiltersChange({
      search: newSearch || undefined,
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='w-full max-w-md'>
          <Input
            ref={searchInputRef}
            type='text'
            placeholder='搜索模板名称或描述...'
            value={search}
            onChange={(e) => handleFilterChange(e.target.value)}
            className='w-full'
          />
        </div>

        <ButtonLink href={createHref} icon={Plus} className='h-9 shrink-0'>
          {createLabel}
        </ButtonLink>
      </div>

      {activeFilters.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {activeFilters.map((filter) => (
            <div
              key={`${filter.type}-${filter.value}`}
              className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary'
            >
              <span>{filter.label}</span>
              <button
                type='button'
                onClick={() => handleFilterChange('')}
                className='ml-1 transition hover:text-foreground'
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
