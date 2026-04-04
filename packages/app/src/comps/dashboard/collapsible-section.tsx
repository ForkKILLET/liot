'use client'

import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

type CollapsibleSectionProps = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <button
        type='button'
        onClick={() => setIsOpen(prev => !prev)}
        className='inline-flex items-center gap-1 text-xs text-primary/80 transition hover:text-primary'
      >
        <span>{title}</span>
        {isOpen
          ? <ChevronUp className='h-3.5 w-3.5' />
          : <ChevronDown className='h-3.5 w-3.5' />}
      </button>

      {isOpen && children}
    </div>
  )
}
