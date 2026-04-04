import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
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
    <div className={cn('h-screen bg-background text-foreground', mainClassName)}>
      <div className={cn('flex flex-col h-full py-5 sm:px-6 lg:px-8', containerClassName)}>
        <header className={cn('flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between', headerClassName)}>
          <Link href='/' icon={false} className='flex items-center gap-3 text-foreground/90 transition hover:text-foreground'>
            <span className='text-xl font-semibold'>Liot</span>
          </Link>

          {header ?? <>
            <ButtonLink href='/' variant='ghost' icon={ArrowLeft}>返回首页</ButtonLink>
          </>}
        </header>

        <main className='flex-1 sm:px-2 lg:px-4'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className='h-full'
          >
            {children}
          </motion.div>
        </main>

        {footer !== null && (
          <footer className={cn('mt-auto border-t border-border pt-6 text-center text-sm text-muted-foreground', footerClassName)}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
