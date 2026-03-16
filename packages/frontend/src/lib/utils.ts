import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function unless<T, U>(value: T | false, fn: (v: T) => U): U | false {
  return value === false ? false : fn(value)
}
