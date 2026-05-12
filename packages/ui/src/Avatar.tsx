import * as React from 'react'
import { cn } from './utils'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' }

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizeClass = sizeMap[size]
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClass, className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full bg-primary-900 text-white flex items-center justify-center font-semibold',
        sizeClass,
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
