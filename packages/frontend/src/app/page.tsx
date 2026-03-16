'use client'

import { LogIn, UserRoundPlus } from 'lucide-react'
import * as motion from 'framer-motion/client'

import { ButtonLink } from '@/comps/ui/link'
import { SiteShell } from '@/comps/site-shell'
import { authClient } from '@/lib/auth/client'

export default function HomePage() {
  const session = authClient.useSession()

  return (
    <SiteShell
      header={(
        <>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-6'>
            <div className='flex items-center justify-center gap-2'>
              {session.data
                ? (
                  <ButtonLink href='/dashboard'>控制台</ButtonLink>
                )
                : (
                  <>
                    <ButtonLink href='/auth/login' icon={LogIn}>登录</ButtonLink>
                    <ButtonLink href='/auth/register' icon={UserRoundPlus}>注册</ButtonLink>
                  </>
                )
              }
            </div>
          </div>
        </>
      )}
    >
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className='grid flex-1 gap-12 py-16 '
      >
        <div className='space-y-8 text-center'>
          <div className='space-y-4'>
            <h1 className='text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl'>Liot</h1>
            <p className='text-lg leading-relaxed text-slate-300'>
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
