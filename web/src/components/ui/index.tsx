'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// ── Button ────────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-900 text-white hover:bg-primary-800 shadow-sm',
        secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
        accent: 'bg-accent text-primary-900 hover:bg-accent/90 shadow-sm',
        outline: 'border border-primary-900 text-primary-900 hover:bg-primary-50',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500',
            leftIcon && 'ps-10',
            rightIcon && 'pe-10',
            error && 'border-red-500 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'

// ── Card ──────────────────────────────────────────────────────────────────────

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm', className)} {...props} />
)

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-4 border-b border-gray-100', className)} {...props} />
)

export const CardBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-4', className)} {...props} />
)

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-4 border-t border-gray-100', className)} {...props} />
)

// ── Badge ─────────────────────────────────────────────────────────────────────

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-gray-100 text-gray-700',
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800',
      danger: 'bg-red-100 text-red-800',
      accent: 'bg-accent/20 text-primary-900',
    },
  },
  defaultVariants: { variant: 'default' },
})

export const Badge = ({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
)

// ── Avatar ────────────────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }

export const Avatar = ({ src, name, size = 'md', className }: AvatarProps) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={cn('rounded-full object-cover', avatarSizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold',
        avatarSizes[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin h-5 w-5 text-primary-900', className)}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-gray-200 rounded', className)} />
)

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  ),
)
Select.displayName = 'Select'

// ── Progress Bar ──────────────────────────────────────────────────────────────

export const ProgressBar = ({ value, max = 100, className }: { value: number; max?: number; className?: string }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div
        className="bg-accent h-2 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Stats Card ────────────────────────────────────────────────────────────────

export const StatsCard = ({
  title, value, icon, change, changeType = 'neutral', className,
}: {
  title: string
  value: string | number
  icon?: React.ReactNode
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  className?: string
}) => (
  <Card className={cn('p-6', className)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={cn(
            'text-xs mt-1',
            changeType === 'up' && 'text-green-600',
            changeType === 'down' && 'text-red-600',
            changeType === 'neutral' && 'text-gray-500',
          )}>
            {change}
          </p>
        )}
      </div>
      {icon && (
        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-900">
          {icon}
        </div>
      )}
    </div>
  </Card>
)

// ── Empty State ───────────────────────────────────────────────────────────────

export const EmptyState = ({
  icon, title, description, action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-gray-300 mb-4 text-6xl">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>}
    {action}
  </div>
)
