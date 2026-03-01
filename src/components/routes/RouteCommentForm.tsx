'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MessageSquarePlus } from 'lucide-react'

interface RouteCommentFormProps {
  routeId: string
}

const commentTypeOptions = [
  { value: 'general', label: 'General' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'access', label: 'Access' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'tip', label: 'Tip' },
]

export function RouteCommentForm({ routeId }: RouteCommentFormProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [commentType, setCommentType] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/routes/${routeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          comment_type: commentType,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to post comment')
      }

      setText('')
      setCommentType('general')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        label="Add a comment"
        placeholder="Share info about this route — conditions, hazards, tips..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Select
            label="Type"
            options={commentTypeOptions}
            value={commentType}
            onChange={(e) => setCommentType(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm" loading={submitting} disabled={!text.trim()}>
          <MessageSquarePlus className="w-4 h-4" />
          Post
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-flag">{error}</p>
      )}
    </form>
  )
}
