'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WaveDivider } from '@/components/ui/WaveDivider'

function VerifyContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('url')

  return (
    <div className="card p-6 text-center">
      <div className="text-3xl mb-3">🔐</div>
      <h2 className="text-lg font-bold text-deep-ocean mb-2">Confirm sign in</h2>
      <p className="text-sm text-driftwood mb-6">
        Tap the button below to complete your sign in.
      </p>
      {callbackUrl ? (
        <a
          href={callbackUrl}
          className="inline-block w-full rounded-xl bg-deep-ocean px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-atlantic-blue transition-colors"
        >
          Sign In to Just Add Water
        </a>
      ) : (
        <p className="text-sm text-sunset-coral">
          Invalid sign-in link. Please request a new one.
        </p>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-deep-ocean">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🛶</div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Just Add Water</h1>
            <p className="text-shallows/80 text-sm">Your paddling group companion</p>
          </div>

          <Suspense fallback={<div className="card p-6 text-center text-driftwood">Loading...</div>}>
            <VerifyContent />
          </Suspense>
        </div>
      </div>

      <WaveDivider className="text-sand" flip />
    </div>
  )
}
