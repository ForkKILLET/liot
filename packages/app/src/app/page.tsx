'use client'

import { UserRoundPlus } from 'lucide-react'
import * as motion from 'framer-motion/client'

import { ButtonLink } from '@/comps/ui/link'
import { SiteShell } from '@/comps/site-shell'
import { PageToolbar } from '@/comps/page-toolbar'
import { authClient } from '@/lib/auth/client'

export default function HomePage() {
  const session = authClient.useSession()

  return (
    <SiteShell
      header={<PageToolbar />}
    >
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className='grid flex-1 gap-12 py-16 '
      >
        <div className='space-y-8 text-center'>
          <div className='space-y-4'>
            <h1 className='text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>Liot</h1>
            <p className='text-lg leading-relaxed text-muted-foreground'>
              轻量、开源、渐进式的物联网平台
            </p>
          </div>

          <div className='flex gap-3 flex-row items-center justify-center'>
            {session.data
              ? <ButtonLink href='/dashboard'>控制台</ButtonLink>
              : <ButtonLink href='/auth/register' icon={UserRoundPlus}>注册</ButtonLink>
            }
            <ButtonLink variant='secondary' href='//github.com/ForkKILLET/liot'>GitHub</ButtonLink>
          </div>
        </div>
      </motion.section>
    </SiteShell>
  )
}
