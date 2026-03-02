'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Send } from 'lucide-react'

const MAX_CHARS = 140

interface Comment {
  id: string
  text: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null } | null
}

interface PaddleCommentsProps {
  paddleId: string
  comments: Comment[]
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function PaddleComments({ paddleId, comments }: PaddleCommentsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(comments.length <= 5)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = MAX_CHARS - text.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > MAX_CHARS) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/paddles/${paddleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to post comment')
      }

      setText('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full group"
      >
        <ChevronDown
          className={`w-4 h-4 text-atlantic-blue transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
          Comments ({comments.length})
        </h2>
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="space-y-1">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5 py-2">
                <div className="w-7 h-7 rounded-full bg-sea-foam flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                  {comment.user?.image ? (
                    <img
                      src={comment.user.image}
                      alt={comment.user.name || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] font-semibold text-atlantic-blue">
                      {(comment.user?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-deep-ocean">
                      {comment.user?.name || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-driftwood">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-storm-grey leading-snug mt-0.5">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-driftwood py-2">
            No comments yet. Drop a quick note below.
          </p>
        )}

        {/* Comment form */}
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setText(e.target.value)
                  }
                }}
                placeholder="Quick note..."
                rows={2}
                className="w-full rounded-xl border border-storm-grey/20 bg-salt-white px-3 py-2 text-sm text-storm-grey placeholder:text-driftwood/50 focus:outline-none focus:ring-2 focus:ring-atlantic-blue/30 focus:border-atlantic-blue resize-none"
              />
              <span
                className={`absolute bottom-2 right-3 text-[10px] font-medium tabular-nums ${
                  remaining <= 0
                    ? 'text-red-flag'
                    : remaining <= 20
                      ? 'text-amber-buoy'
                      : 'text-driftwood/40'
                }`}
              >
                {remaining}
              </span>
            </div>
            <button
              type="submit"
              disabled={!text.trim() || remaining < 0 || submitting}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-atlantic-blue text-salt-white disabled:opacity-30 transition-opacity shrink-0"
            >
              <Send className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-flag mt-1">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
