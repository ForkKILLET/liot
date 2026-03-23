'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound, LogOut } from 'lucide-react'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/comps/ui/dropdown-menu'
import { Button } from '@/comps/ui/button'
import { authClient } from '@/lib/auth/client'

export function UserMenu() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const toggleProfileMenuOpen = () => setProfileMenuOpen((open) => ! open)
  const router = useRouter()

  const handleLogout = () => {
    setProfileMenuOpen(false)
    authClient.signOut()
    router.push('/')
  }

  const session = authClient.useSession()

  if (! session.data) return null

  const { user } = session.data

  return (
    <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
      <DropdownMenuTrigger
        asChild
        onClick={toggleProfileMenuOpen}
        aria-label='打开账户菜单'
      >
        <Button
          variant='outline'
          size='icon'
          className='h-11 w-11 rounded-full border-slate-800 bg-slate-950/60 text-white hover:border-slate-700 hover:bg-slate-900'
        >
          <UserRound className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={12}
        className='w-56 border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur'
      >
        <DropdownMenuLabel className='flex flex-col gap-0.5 text-left'>
          <span className='text-xs uppercase tracking-wide text-slate-400'>已登录账户</span>
          <span className='text-base font-semibold text-white'>{user.name}</span>
          <span className='text-sm text-slate-400'>{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-slate-800' />
        <DropdownMenuItem
          variant='destructive'
          className='gap-3 text-sm'
          onSelect={(event) => {
            event.preventDefault()
            handleLogout()
          }}
        >
          <LogOut className='h-4 w-4' />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
