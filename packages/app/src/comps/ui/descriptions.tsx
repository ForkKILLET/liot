import * as React from 'react'

import { cn } from '@/lib/utils'

export function Descriptions({
  className, ...props
}: React.ComponentProps<'dl'>) {
  return (
    <dl
      className={cn(
        'grid grid-cols-[minmax(0,auto)_1fr] gap-x-4 gap-y-3 text-sm',
        className
      )}
      {...props}
    />
  )
}

export function DescriptionItem({
  label, className, children, ...props
}: React.ComponentProps<'div'> & { label: React.ReactNode }) {
  return (
    <div
      className={cn('contents', className)}
      {...props}
    >
      <dt className="text-muted-foreground font-medium text-nowrap">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  )
}
