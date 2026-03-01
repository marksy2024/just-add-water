import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      {!icon && (
        <div className="mb-4 mx-auto w-24 h-16 text-driftwood/30">
          {/* Simple kayak-on-water line art */}
          <svg viewBox="0 0 96 64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8,48 C24,40 40,56 56,48 C72,40 88,48 88,48" strokeLinecap="round" />
            <path d="M28,38 C32,36 40,36 48,38" strokeLinecap="round" />
            <ellipse cx="38" cy="36" rx="14" ry="3" />
            <line x1="38" y1="20" x2="38" y2="36" />
            <circle cx="38" cy="18" r="3" />
            <line x1="30" y1="28" x2="46" y2="22" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-deep-ocean mb-1">{title}</h3>
      <p className="text-sm text-driftwood max-w-sm mx-auto mb-4">{description}</p>
      {action && (
        action.href ? (
          <a href={action.href}>
            <Button size="sm">{action.label}</Button>
          </a>
        ) : (
          <Button size="sm" onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  )
}
