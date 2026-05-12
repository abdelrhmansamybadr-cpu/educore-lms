import * as React from 'react'
import { cn } from './utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors',
            error && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
