'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { UserPlus, Check, Send } from 'lucide-react'

export default function InvitePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create invite')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setSuccess(false)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-deep-ocean">Invite a Paddler</h1>
        <p className="text-sm text-driftwood mt-0.5">
          The more the merrier on the water
        </p>
      </div>

      {!success ? (
        /* Invite Form */
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-atlantic-blue" />
            <CardTitle>Send an Invite</CardTitle>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Their name"
              placeholder="e.g. Marie"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="marie@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-flag">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <Send className="w-4 h-4" />
              Send Invite
            </Button>
          </form>
        </Card>
      ) : (
        /* Success */
        <div className="space-y-4">
          <Card>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-kelp-green/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-kelp-green" />
              </div>
              <CardTitle>Invite Sent</CardTitle>
              <p className="text-sm text-driftwood mt-1">
                Account created for {name}. Login details have been emailed to them.
              </p>
            </div>
          </Card>

          <Button variant="outline" onClick={handleReset} className="w-full">
            Invite someone else
          </Button>
        </div>
      )}
    </div>
  )
}
