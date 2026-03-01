'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WaveDivider } from '@/components/ui/WaveDivider'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <Input
        label="Email address"
        type="text"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
        placeholder="you@example.com"
        required
        autoFocus
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
        required
        autoComplete="current-password"
      />

      {error && (
        <p className="text-sm text-red-flag text-center">{error}</p>
      )}

      <Button type="submit" loading={loading} disabled={!email || !password} className="w-full" size="lg">
        Sign In
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-deep-ocean">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🛶</div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Just Add Water</h1>
            <p className="text-shallows/80 text-sm">Your paddling group companion</p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <WaveDivider className="text-sand" flip />
    </div>
  )
}
