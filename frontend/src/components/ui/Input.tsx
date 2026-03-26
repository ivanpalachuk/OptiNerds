import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>}
      <input
        ref={ref}
        className={`border rounded-md px-3 py-2 text-sm text-slate-900 bg-white outline-none
          transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-300
          ${error ? 'border-red-400' : 'border-slate-300'}
          ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  ),
)
Input.displayName = 'Input'
