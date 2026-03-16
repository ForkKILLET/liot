import { ArrowRight, ArrowUpRight } from 'lucide-react'
import NextLink from 'next/link'
import React from 'react'
import { Button, ButtonProps, buttonVariants } from './button'
import { VariantProps } from 'class-variance-authority'
import { unless } from '@/lib/utils'

type LinkProps = React.ComponentProps<'a'> & {
  href: string
  icon?: React.ComponentType | false
}

export function Link({
  icon,
  ...props
}: LinkProps) {
  const isExternal = props.href?.match(/^(https?:)?\/\//)
  const Icon = unless(icon, () => icon ?? (isExternal ? ArrowUpRight : ArrowRight))
  const LinkComp = isExternal ? 'a' : NextLink

  return (
    <LinkComp
      target={isExternal ? '_blank' : undefined}
      {...props}
    >
      {props.children}
      {Icon && <Icon />}
    </LinkComp>
  )
}

export function TextLink({
  ...props
}: React.ComponentProps<'a'> & {
  href: string
}) {
  return (
    <Link
      {...props} icon={false}
      className='font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary/80'
    />
  )
}

export function ButtonLink({
  className,
  size,
  variant,
  ...props
}: VariantProps<typeof buttonVariants> & LinkProps) {
  return (
    <Button asChild {...{size, variant, className}}>
      <Link {...props} />
    </Button>
  )
}
