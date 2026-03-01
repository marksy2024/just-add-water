'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface JoinFormProps {
  token: string
  defaultName: string
  defaultEmail: string
}

export function JoinForm({ token, defaultName, defaultEmail }: JoinFormProps) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError('Please enter your name')
      setLoading(false)
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: email.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create account')
      }

      setSuccess(true)
      // Redirect to login after a brief moment
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-kelp-green/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">&#x2705;</span>
        </div>
        <h3 className="text-lg font-bold text-deep-ocean mb-1">Welcome aboard!</h3>
        <p className="text-sm text-driftwood">
          Your account has been created. Redirecting you to sign in...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Your name"
        placeholder="e.g. Marie Dupont"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Email address"
        type="email"
        placeholder="marie@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {error && (
        <p className="text-sm text-red-flag">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Join the Group
      </Button>

      <p className="text-[11px] text-driftwood text-center">
        By joining, you&apos;ll receive a sign-in link by email to access the app.
      </p>
    </form>
  )
}
