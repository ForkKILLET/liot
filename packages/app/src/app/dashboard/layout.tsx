import * as motion from 'framer-motion/client'

import { SiteShell } from '@/comps/site-shell'
import { PageToolbar } from '@/comps/page-toolbar'
import { DashboardSidebar } from '@/comps/dashboard/sidebar'
import { requireSessionOrRedirect } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSessionOrRedirect('/dashboard')

  return (
    <SiteShell header={<PageToolbar />}>
      <div className="flex h-full gap-6">
        <aside className="hidden h-full shrink-0 md:block">
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
