'use client'

import { useMemo, useRef, useState } from 'react'
import { FunnelIcon, Grid3x3Icon, ListIcon, X } from 'lucide-react'
import { Button } from '@/comps/ui/button'
import { Input } from '@/comps/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/comps/ui/dropdown-menu'
import { DeviceTemplate } from '@/lib/db/schema'

export type DeviceListToolbarProps = {
  templates: DeviceTemplate[]
  onFiltersChange: (filters: {
    mode: 'grid' | 'list'
    templateId?: number
    search?: string
  }) => void
}

export function DeviceListToolbar({
  templates,
  onFiltersChange
}: DeviceListToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const activeFilters = useMemo(() => {
    const filters = []
    if (templateId) {
      const template = templates.find(t => String(t.id) === templateId)
      if (template) {
        filters.push({ type: 'template', label: `型号: ${template.name}`, value: templateId })
      }
    }
    if (search) {
      filters.push({ type: 'search', label: `搜索: ${search}`, value: search })
    }
    return filters
  }, [templateId, search, templates])

  const handleModeChange = (newMode: 'grid' | 'list') => {
    setMode(newMode)
    onFiltersChange({
      mode: newMode,
      templateId: templateId ? parseInt(templateId) : undefined,
      search: search || undefined,
    })
  }

  const handleFilterChange = (newTemplateId: string, newSearch: string) => {
    setTemplateId(newTemplateId)
    setSearch(newSearch)
    onFiltersChange({
      mode,
      templateId: newTemplateId ? parseInt(newTemplateId) : undefined,
      search: newSearch || undefined,
    })
  }

  const clearFilter = (type: string, _value: string) => {
    if (type === 'template') {
      setTemplateId('')
    }
    else if (type === 'search') {
      setSearch('')
    }
    handleFilterChange(
      type === 'template' ? '' : templateId,
      type === 'search' ? '' : search
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex gap-2'>
          <Button
            variant={mode === 'grid' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleModeChange('grid')}
            title='卡片模式'
          >
            <Grid3x3Icon className='h-4 w-4' />
          </Button>
          <Button
            variant={mode === 'list' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleModeChange('list')}
            title='列表模式'
          >
            <ListIcon className='h-4 w-4' />
          </Button>

          <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='gap-2'>
                <FunnelIcon className='h-4 w-4' />
                筛选
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-56'>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>型号</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className='w-56'>
                  <DropdownMenuRadioGroup
                    value={templateId || 'all'}
                    onValueChange={(value) => {
                      const nextTemplateId = value === 'all' ? '' : value
                      handleFilterChange(nextTemplateId, search)
                    }}
                  >
                    <DropdownMenuRadioItem value='all'>全部型号</DropdownMenuRadioItem>
                    {templates.map(template => (
                      <DropdownMenuRadioItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem
                onSelect={() => {
                  handleFilterChange('', '')
                }}
              >
                清空全部筛选
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='flex flex-1 justify-end gap-3 sm:flex-row'>
          <Input
            ref={searchInputRef}
            type='text'
            placeholder='搜索设备名称或描述...'
            value={search}
            onChange={(e) => handleFilterChange(templateId, e.target.value)}
            className='w-full max-w-md'
          />
        </div>
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
                onClick={() => clearFilter(filter.type, filter.value)}
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
