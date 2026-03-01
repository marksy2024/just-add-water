'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WaveDivider } from '@/components/ui/WaveDivider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn('email', { email, redirect: false })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-deep-ocean">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🛶</div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Just Add Water</h1>
            <p className="text-shallows/80 text-sm">Your paddling group companion</p>
          </div>

          {sent ? (
            <div className="card p-6 text-center">
              <div className="text-3xl mb-3">📧</div>
              <h2 className="text-lg font-bold text-deep-ocean mb-2">Check your email</h2>
              <p className="text-sm text-driftwood mb-4">
                We sent a magic link to <strong className="text-storm-grey">{email}</strong>.
                Click the link to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="text-sm text-atlantic-blue hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                autoComplete="email"
              />
              <Button type="submit" loading={loading} disabled={!email} className="w-full" size="lg">
                Send Magic Link
              </Button>
              <p className="text-xs text-driftwood text-center">
                No password needed — we&apos;ll email you a sign-in link
              </p>
            </form>
          )}
        </div>
      </div>

      <WaveDivider className="text-sand" flip />
    </div>
  )
}
