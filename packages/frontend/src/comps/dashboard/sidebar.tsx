'use client'

import { usePathname } from 'next/navigation'
import { LayoutDashboard, Server } from 'lucide-react'

import { ButtonLink } from '../ui/link'
import React from 'react'

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
  return (
    <nav className="flex flex-col space-y-2 w-40 p-4 border-r border-slate-800 min-h-[calc(100vh-10rem)]">
      {items.map((item) => (
        <SidebarItem key={item.href} item={item} />
      ))}
    </nav>
  )
}

function SidebarItem({ item }: { item: typeof items[number] }) {
  const pathname = usePathname()
  const isActive = pathname === item.href

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
