import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-sand p-6">
      <div className="card p-8 max-w-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-xl font-bold text-deep-ocean mb-2">Check your email</h1>
        <p className="text-sm text-driftwood mb-6">
          A sign-in link has been sent to your email address.
          Click the link to log in to Just Add Water.
        </p>
        <Link href="/login" className="text-sm text-atlantic-blue hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  )
}
