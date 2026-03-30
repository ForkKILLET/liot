'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard, Server } from 'lucide-react'

import { ButtonLink } from '../ui/link'
import React from 'react'
import { cn } from '@/lib/utils'
import { getDeviceDetailPath } from '@/lib/devices/url'

interface SidebarItemDef {
  title: string
  href: string
  Icon: React.ComponentType,
}

const items: SidebarItemDef[] = [
  {
    title: '概览',
    href: '/dashboard',
    Icon: LayoutDashboard,
  },
  {
    title: '设备管理',
    href: '/dashboard/devices',
    Icon: Server,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const detailMatch = pathname.match(/^\/dashboard\/devices\/([^/]+)\/([^/]+)(?:\/(properties|status|messages))?$/)
  const detailProduct = detailMatch?.[1]
  const detailDeviceId = detailMatch?.[2]
  const detailSection = (detailMatch?.[3] ?? 'properties') as 'properties' | 'status' | 'messages'

  const decodeSegment = (value: string) => {
    try {
      return decodeURIComponent(value)
    }
    catch {
      return value
    }
  }

  const product = detailProduct ? decodeSegment(detailProduct) : null
  const deviceId = detailDeviceId ? decodeSegment(detailDeviceId) : null

  const sectionItems = product && deviceId
    ? [
      {
        title: '属性',
        href: getDeviceDetailPath(product, deviceId, 'properties'),
      },
      {
        title: '状态',
        href: getDeviceDetailPath(product, deviceId, 'status'),
      },
      {
        title: '消息历史',
        href: getDeviceDetailPath(product, deviceId, 'messages'),
      },
    ]
    : []

  return (
    <nav className="flex flex-col space-y-2 w-40 p-4 border-r border-border h-full">
      {items.map((item) => (
        <SidebarItem key={item.href} item={item} pathname={pathname} />
      ))}

      {product && deviceId && (
        <div className='mt-4 border-t border-border pt-3'>
          <div className='px-2 pb-2 text-xs text-muted-foreground'>{product}/{deviceId}</div>
          <div className='flex flex-col gap-1'>
            {sectionItems.map((sectionItem) => {
              const active = sectionItem.href.endsWith(`/${detailSection}`)
              return (
                <ButtonLink
                  key={sectionItem.href}
                  href={sectionItem.href}
                  variant={active ? 'secondary' : 'ghost'}
                  size='sm'
                  icon={false}
                  className={cn('justify-start', active && 'font-semibold')}
                >
                  {sectionItem.title}
                </ButtonLink>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}

function SidebarItem({ item, pathname }: { item: typeof items[number], pathname: string }) {
  const isDevicesRoot = item.href === '/dashboard/devices'
  const isActive = isDevicesRoot ? pathname.startsWith('/dashboard/devices') : pathname === item.href

  return (
    <ButtonLink
      variant={isActive ? 'default' : 'ghost'}
      className='justify-between'
      href={item.href}
      icon={item.Icon}
    >
      {item.title}
    </ButtonLink>
  )
}
