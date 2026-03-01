import { prisma } from '@/lib/db'
import { JoinForm } from './JoinForm'

interface JoinPageProps {
  params: Promise<{ token: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params

  // Validate the invite token
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      inviter: { select: { name: true } },
    },
  })

  // Check validity
  const isValid = invite
    && invite.status === 'pending'
    && new Date(invite.expiresAt) > new Date()

  const inviterName = invite?.inviter
    ? invite.inviter.name
    : 'A fellow paddler'

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-deep-ocean">Just Add Water</h1>
          <p className="text-sm text-driftwood mt-1">Your paddling group companion</p>
        </div>

        {isValid ? (
          <div className="card p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-atlantic-blue/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl" role="img" aria-label="canoe">&#x1F6F6;</span>
              </div>
              <h2 className="text-xl font-bold text-deep-ocean">
                You&apos;re invited!
              </h2>
              <p className="text-sm text-driftwood mt-1">
                {inviterName} has invited{' '}
                {invite.inviteeName ? (
                  <span className="font-semibold text-storm-grey">{invite.inviteeName}</span>
                ) : (
                  'you'
                )}{' '}
                to join their paddling group
              </p>
            </div>

            <JoinForm
              token={token}
              defaultName={invite.inviteeName || ''}
              defaultEmail={invite.inviteeEmail || ''}
            />
          </div>
        ) : (
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-storm-grey/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl" role="img" aria-label="clock">&#x23F3;</span>
            </div>
            <h2 className="text-xl font-bold text-deep-ocean mb-2">
              Invite {invite?.status === 'accepted' ? 'already used' : 'expired'}
            </h2>
            <p className="text-sm text-driftwood">
              {invite?.status === 'accepted'
                ? 'This invite has already been accepted. If you already have an account, you can sign in.'
                : 'This invite link is no longer valid. Ask your friend to send you a new one.'
              }
            </p>
            <a
              href="/login"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-deep-ocean text-white font-semibold text-sm hover:bg-deep-ocean/90 transition-colors"
            >
              Go to Sign In
            </a>
          </div>
        )}

        <p className="text-center text-xs text-driftwood mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-atlantic-blue hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
