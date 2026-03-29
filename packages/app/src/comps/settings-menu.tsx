'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Palette, Settings } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/comps/ui/dropdown-menu'
import { Button } from '@/comps/ui/button'

export function SettingsMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='h-11 w-11 rounded-full'
          aria-label='打开设置菜单'
        >
          <Settings className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' sideOffset={12}>
        <DropdownMenuLabel className='text-xs uppercase tracking-wide'>主题</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme || 'system'} onValueChange={setTheme}>
          <DropdownMenuRadioItem value='light'>
            <Sun className='mr-2 h-4 w-4' />
            浅色
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='dark'>
            <Moon className='mr-2 h-4 w-4' />
            深色
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='system'>
            <Palette className='mr-2 h-4 w-4' />
            自动
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
