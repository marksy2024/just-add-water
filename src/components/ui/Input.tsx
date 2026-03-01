import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const baseInputStyles = `
  w-full px-4 py-2.5 rounded-xl border border-storm-grey/20 bg-salt-white
  text-storm-grey placeholder:text-driftwood/50
  focus:outline-none focus:ring-2 focus:ring-atlantic-blue/30 focus:border-atlantic-blue
  transition-colors duration-150
`

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-deep-ocean">{label}</label>}
        <input ref={ref} className={`${baseInputStyles} ${error ? 'border-red-flag' : ''} ${className}`} {...props} />
        {error && <p className="text-sm text-red-flag">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-deep-ocean">{label}</label>}
        <textarea ref={ref} rows={3} className={`${baseInputStyles} resize-y ${error ? 'border-red-flag' : ''} ${className}`} {...props} />
        {error && <p className="text-sm text-red-flag">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-deep-ocean">{label}</label>}
        <select ref={ref} className={`${baseInputStyles} ${error ? 'border-red-flag' : ''} ${className}`} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-sm text-red-flag">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
