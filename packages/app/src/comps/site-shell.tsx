import { ReactNode } from 'react'
import { ArrowLeft, Radar } from 'lucide-react'
import * as motion from 'framer-motion/client'

import { cn } from '@/lib/utils'
import { ButtonLink, Link } from '@/comps/ui/link'

interface SiteShellProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode | null
  mainClassName?: string
  containerClassName?: string
  headerClassName?: string
  footerClassName?: string
}

export function SiteShell({
  children,
  header,
  footer,
  mainClassName,
  containerClassName,
  headerClassName,
  footerClassName,
}: SiteShellProps) {
  return (
    <div className={cn('min-h-screen bg-slate-950 text-slate-50', mainClassName)}>
      <div className={cn('mx-auto flex min-h-screen max-w-screen flex-col py-8 sm:px-6 lg:px-8', containerClassName)}>
        <header className={cn('flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between', headerClassName)}>
          <Link href='/' icon={false} className='flex items-center gap-3 text-white/90 transition hover:text-white'>
            <span className='flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner shadow-primary/20'>
              <Radar className='h-5 w-5' />
            </span>
            <span className='text-xl font-semibold'>Liot</span>
          </Link>

          {header ?? <>
            <ButtonLink href='/' variant='ghost' icon={ArrowLeft}>返回首页</ButtonLink>
          </>}
        </header>

        <main className='sm:px-2 lg:px-4'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>

        {footer !== null && (
          <footer className={cn('mt-auto border-t border-slate-800 pt-6 text-center text-sm text-slate-500', footerClassName)}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
