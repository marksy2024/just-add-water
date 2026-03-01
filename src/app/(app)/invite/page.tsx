'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import { UserPlus, Copy, Check, Send } from 'lucide-react'

export default function InvitePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create invite')
      }

      const data = await res.json()
      setInviteLink(data.inviteLink)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the text
    }
  }

  const handleReset = () => {
    setName('')
    setEmail('')
    setInviteLink(null)
    setError(null)
    setCopied(false)
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

      {!inviteLink ? (
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
              label="Email (optional)"
              type="email"
              placeholder="marie@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-flag">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              <Send className="w-4 h-4" />
              Create Invite Link
            </Button>
          </form>
        </Card>
      ) : (
        /* Invite Created — show link */
        <div className="space-y-4">
          <Card>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-kelp-green/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-kelp-green" />
              </div>
              <CardTitle>Invite Created</CardTitle>
              <p className="text-sm text-driftwood mt-1">
                Share this link with {name} to invite them to the group
              </p>
            </div>

            {/* Invite Link */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-sand">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 text-sm text-storm-grey bg-transparent outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-lg hover:bg-storm-grey/10 transition-colors"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-kelp-green" />
                ) : (
                  <Copy className="w-4 h-4 text-storm-grey" />
                )}
              </button>
            </div>

            {copied && (
              <p className="text-xs text-kelp-green text-center mt-1">Copied to clipboard</p>
            )}
          </Card>

          {/* Share Options */}
          <div className="flex flex-col gap-3">
            <WhatsAppShare
              message={`Hey! Join our paddling group on Just Add Water \u{1F6F6}\n${inviteLink}`}
              buttonText="Share via WhatsApp"
              variant="primary"
              size="md"
            />
            <Button variant="outline" onClick={handleReset} className="w-full">
              Invite someone else
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
