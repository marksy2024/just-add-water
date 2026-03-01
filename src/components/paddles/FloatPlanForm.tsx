'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Shield } from 'lucide-react'

interface FloatPlanFormProps {
  paddleId: string
}

export function FloatPlanForm({ paddleId }: FloatPlanFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const [form, setForm] = useState({
    expectedReturnTime: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.expectedReturnTime || !form.emergencyContactName || !form.emergencyContactPhone) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/paddles/${paddleId}/float-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create float plan')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full"
      >
        <Card hover padding="sm">
          <div className="flex items-center gap-2 text-left">
            <Shield className="w-4 h-4 text-kelp-green" />
            <div>
              <p className="text-sm font-semibold text-deep-ocean">Create Float Plan</p>
              <p className="text-xs text-driftwood">
                Leave emergency contact details before you paddle
              </p>
            </div>
          </div>
        </Card>
      </button>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-kelp-green" />
        <CardTitle>Float Plan</CardTitle>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Expected Return Time"
          type="datetime-local"
          value={form.expectedReturnTime}
          onChange={(e) => updateField('expectedReturnTime', e.target.value)}
          required
        />

        <Input
          label="Emergency Contact Name"
          placeholder="e.g. Jane Smith"
          value={form.emergencyContactName}
          onChange={(e) => updateField('emergencyContactName', e.target.value)}
          required
        />

        <Input
          label="Emergency Contact Phone"
          type="tel"
          placeholder="e.g. +33 6 12 34 56 78"
          value={form.emergencyContactPhone}
          onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-flag">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={submitting}>
            <Shield className="w-4 h-4" />
            Activate Float Plan
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
