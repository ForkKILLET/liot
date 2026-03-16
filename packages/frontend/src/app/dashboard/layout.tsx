import { headers } from 'next/headers'
import { LogIn } from 'lucide-react'
import * as motion from 'framer-motion/client'

import { SiteShell } from '@/comps/site-shell'
import { UserMenu } from '@/comps/user-menu'
import { DashboardSidebar } from '@/comps/dashboard/sidebar'
import { auth } from '@/lib/auth/server'
import { ButtonLink } from '@/comps/ui/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (! session) {
    return (
      <SiteShell>
        <div className='flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center text-slate-300'>
          <p>请先登录以访问控制台</p>
          <ButtonLink href='/auth/login' icon={LogIn}>
            前往登录
          </ButtonLink>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell header={<UserMenu />}>
      <div className="flex gap-6">
        <aside className="hidden shrink-0 md:block">
          <DashboardSidebar />
        </aside>
        <main className="flex-1 py-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </SiteShell>
  )
}
