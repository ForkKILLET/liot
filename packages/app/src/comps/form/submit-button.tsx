import { ArrowRight, LoaderCircle } from 'lucide-react'
import React from 'react'

import { Button } from '@/comps/ui/button'
import { cn } from '@/lib/utils'

export type SubmitButtonProps = React.ComponentProps<'button'> & {
  isPending?: boolean
  icon?: React.ComponentType | false
}

export function SubmitButton({
  icon,
  isPending,
  children,
  ...props
}: SubmitButtonProps) {
  const Icon = icon === false
    ? null
    : isPending ? LoaderCircle : icon ?? ArrowRight

  return (
    <Button
      type='submit'
      size='lg'
      className='w-full gap-2'
      {...props}
      disabled={isPending}
    >
      {children}
      {Icon && <Icon className={cn('w-4 h-4', isPending && 'animate-spin')} />}
    </Button>
  )
}
