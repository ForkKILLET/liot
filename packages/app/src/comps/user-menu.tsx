'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRound, LogOut, LogIn, UserRoundPlus } from 'lucide-react'

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
          className='h-11 w-11 rounded-full'
        >
          <UserRound className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='end'
        sideOffset={12}
        className='w-56'
      >
        {session.data ? (
          <>
            <DropdownMenuLabel className='flex flex-col gap-0.5 text-left'>
              <span className='text-xs uppercase tracking-wide'>已登录账户</span>
              <span className='text-base font-semibold'>{session.data.user.name}</span>
              <span className='text-sm'>{session.data.user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
          </>
        ) : (
          <>
            <DropdownMenuLabel className='text-xs uppercase tracking-wide'>账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='gap-3 text-sm'
              onSelect={() => {
                setProfileMenuOpen(false)
                router.push('/auth/login')
              }}
            >
              <LogIn className='h-4 w-4' />
              登录
            </DropdownMenuItem>
            <DropdownMenuItem
              className='gap-3 text-sm'
              onSelect={() => {
                setProfileMenuOpen(false)
                router.push('/auth/register')
              }}
            >
              <UserRoundPlus className='h-4 w-4' />
              注册
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
