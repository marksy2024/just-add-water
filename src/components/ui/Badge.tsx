interface TypeBadgeProps {
  type: string
  size?: 'sm' | 'md'
}

export function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  return (
    <span className={`type-badge type-badge-${type} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}>
      {type}
    </span>
  )
}

interface DifficultyBadgeProps {
  difficulty: string
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const dots = difficulty === 'easy' ? 1 : difficulty === 'moderate' ? 2 : 3
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium difficulty-${difficulty}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < dots ? 'bg-current' : 'bg-current/20'}`}
        />
      ))}
      <span className="ml-0.5 capitalize">{difficulty}</span>
    </span>
  )
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    planned: 'bg-shallows/20 text-atlantic-blue',
    active: 'bg-kelp-green/10 text-kelp-green',
    completed: 'bg-storm-grey/10 text-storm-grey',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.planned}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-kelp-green mr-1.5 animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

interface CommentTypeBadgeProps {
  type: string
}

export function CommentTypeBadge({ type }: CommentTypeBadgeProps) {
  const styles: Record<string, string> = {
    general: 'bg-storm-grey/10 text-storm-grey',
    hazard: 'bg-sunset-coral/10 text-sunset-coral',
    access: 'bg-atlantic-blue/10 text-atlantic-blue',
    conditions: 'bg-shallows/20 text-deep-ocean',
    tip: 'bg-kelp-green/10 text-kelp-green',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles[type] || styles.general}`}>
      {type}
    </span>
  )
}
